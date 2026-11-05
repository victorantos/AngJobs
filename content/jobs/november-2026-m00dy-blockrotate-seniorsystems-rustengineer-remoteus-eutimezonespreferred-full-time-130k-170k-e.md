---
title: "Blockrotate : Senior Systems / Rust Engineer"
date: 2026-11-01
description: Blockrotate- Senior Systems / Rust Engineer - Remote (US/EU timezones preferred) - Full-time - $130k - $170k + Equity Blockrotate ( ) builds low-latency…
author: m00dy
authorUrl: https://news.ycombinator.com/item?id=50349000
byline: m00dy
section: november-2026
tags:
  - november-2026
---
Blockrotate- Senior Systems &#x2F; Rust Engineer - Remote (US&#x2F;EU timezones preferred) - Full-time - $130k - $170k + Equity

Blockrotate (<a href="https:&#x2F;&#x2F;blockrotate.com" rel="nofollow">https:&#x2F;&#x2F;blockrotate.com</a>) builds low-latency copy-trading and execution infrastructure for Polymarket and prediction markets.

Copy trading on prediction markets has strange market microstructure. Unlike deep perp DEXes (Binance, Hyperliquid), Polymarket orderbooks are bounded, often thin, and subject to severe adverse selection. When a high-volume leader buys, the book moves immediately. If followers lag by a few hundred milliseconds, or if a platform taxes every order with a 50bps fee, follower alpha drops to zero.

Most existing tools in this space either hit users with high per-trade taker fees or ask them to export and paste their master private key into a database. We took a different approach: isolated per-bot deposit wallets (non-custodial via EIP-1967&#x2F;1271 proxies) and co-located autonomous Rust workers running delta-sync loops directly against the Polymarket CLOB.

Stack:

- Backend: Rust, Tokio, Axum, Protobuf over WebSockets, SQLite (WAL mode)

- Trading Engine: Custom Polymarket CLOB &amp; Data API clients, EIP-712 signing, dynamic slippage ladders, momentum filters, circuit breakers

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS

What you’d actually work on:

- Squeezing latency out of the execution hot path (delta position calculation, order placement, nonce handling, fill verification).

- Building better execution protection: momentum filters to dodge toxic order flow, fill stabilization windows, and handling thin book liquidity without moving the market against yourself.

- Scaling worker orchestration: our C2 server talks Protobuf to distributed bot workers with monotonic sequence IDs and autonomous reconnect failover. As bot volume scales, we need to keep state reconciliation bulletproof.

- Investigating and exploiting prediction market quirks (rebate structures, orderbook snapshotting, MEV&#x2F;relayer bottlenecks).

What we look for:

- Strong async Rust experience (Tokio, concurrency, practical memory management).

- Experience dealing with websockets, exchange orderbooks, or trading infrastructure

shoot an email to jobs@blockrotate.com and tell us why you would be a good fit for us.
[[form:apply]]
