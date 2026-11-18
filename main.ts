// CBBTC momentum bot for make.fun's "Race a BTC trading bot live for 24 hours".
//
// Long-only, one symbol (CBBTC vs USDC), 1-minute bars, $1,000 paper capital.
// The replay fills orders at the next bar's open and charges a 4 bps fee +
// 2 bps slippage + constant-product price impact, so a full-size round trip
// costs roughly 30 bps: a trade has to catch a move clearly larger than that.
//
// Idea: hourly momentum persistence, plus a dip-recovery entry. On the
// published dev window the 60-minute return of cbBTC predicts the next hour:
// after a 60-minute return above +50 bps the next hour averages about
// +31 bps, against +1 bp unconditionally (n=115). So the bot waits for 240
// bars of history, buys all cash when the trailing 60-minute return reaches
// +50 bps, and exits on a 100 bp trailing stop from the peak close or when
// the 60-minute return turns to -40 bps or worse. The momentum leg alone can
// miss a recovery that starts with a sharp bounce off a deep low before any
// hourly print turns strong, so a second entry buys a confirmed dip: the
// price at least 200 bps below its 240-bar high and at least 60 bps above
// its 120-bar low. Both entries share the same exits. The bot never trades
// during the first four hours, which also keeps it out of the opening drop
// that sinks buy-and-hold on the dev window. Deterministic: integer
// arithmetic only, no clock, no randomness, no network, no files outside
// the repo. Node 22, no dependencies beyond the vendored make.fun SDK.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
// Bars of history before the first trade: four hours of 1-minute bars.
const HISTORY_BARS = 240;
// Momentum window (bars) and entry/exit thresholds (basis points).
const MOM_WIN = 60;
const MOM_IN_BPS = 50n;
const MOM_OUT_BPS = -40n;
// Trailing stop from the highest close since the buy, in basis points.
const TRAIL_BPS = 100n;
// Dip-recovery entry (basis points): how far below the 240-bar high the
// price must be, and how far above the 120-bar low it must have bounced.
const DIP_DROP_BPS = 200n;
const DIP_RECOVERY_BPS = 60n;
const DIP_HIGH_BARS = 240;
const DIP_LOW_BARS = 120;
// Wide open: the next open is one minute away, so fills stay near the close.
const MAX_SLIPPAGE_BPS = 10000;

const closes: bigint[] = [];
let peak = 0n;

await runBars({
  onBatch(state: BarsState): OrderInput[] {
    if (state.warmingUp) return [];
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);
    if (closes.length <= HISTORY_BARS) return [];
    const cur = closes[closes.length - 1];
    const ret60 = (cur * 10000n) / closes[closes.length - MOM_WIN - 1] - 10000n;
    if (!state.positions.has(SYMBOL)) {
      // Dip recovery: deep below the 240-bar high, bounced off the 120-bar low.
      let hi = 0n;
      for (let i = closes.length - DIP_HIGH_BARS - 1; i < closes.length; i++) if (closes[i] > hi) hi = closes[i];
      let lo = closes[closes.length - 1];
      for (let i = closes.length - DIP_LOW_BARS - 1; i < closes.length; i++) if (closes[i] < lo) lo = closes[i];
      const dipRecovery =
        cur <= (hi * (10000n - DIP_DROP_BPS)) / 10000n && cur >= (lo * (10000n + DIP_RECOVERY_BPS)) / 10000n;
      if (ret60 >= MOM_IN_BPS || dipRecovery) {
        peak = cur;
        return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }
    if (cur > peak) peak = cur;
    if (cur <= (peak * (10000n - TRAIL_BPS)) / 10000n || ret60 <= MOM_OUT_BPS) {
      peak = 0n;
      return [{ side: 'sell', symbol: SYMBOL, qty: state.positions.get(SYMBOL)!.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  },
});
