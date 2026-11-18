# btc-race-24h-20261118-1444

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/Kimtigrn/btc-race-24h-20261118-1444/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/Kimtigrn/btc-race-24h-20261118-1444/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

A deterministic CBBTC momentum + dip-recovery trading bot for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $250 in USDC. It trades Coinbase Wrapped BTC against USDC minute by minute on 1-minute Orca Whirlpool bars: it waits for four hours of history, buys all cash on a 60-minute momentum breakout (+50 bps) or a confirmed dip recovery (200+ bps below the 240-bar high, bounced 60+ bps off the 120-bar low), and exits on a 100 bp trailing stop or a momentum reversal. Long only, no leverage, no shorts; integer arithmetic only, no clock, no randomness, no network. Node 22, standard library only plus the vendored make.fun bars SDK.

On the published 24-hour dev window it nets **+8.41 USDC** (4 trades, max drawdown 1.1%, guardrails met) — against −31.63 for buy-and-hold and negative PnL for every house baseline (momentum −23.87, EMA-cross −148.17, RSI-Bollinger −39.92, ADX-momentum −75.57).

## Run it

```sh
node cli/makefun.mjs grade-local --kit <unpacked kit dir> --bot . --driver process
```

`main.ts` speaks the `agent-fun/bars-replay/v1` protocol on stdin/stdout (hello, one batch per minute, done) via the vendored SDK in `vendor/makefun-bars.ts`, a byte-identical copy of the kit's `sdk/makefun-bars.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
