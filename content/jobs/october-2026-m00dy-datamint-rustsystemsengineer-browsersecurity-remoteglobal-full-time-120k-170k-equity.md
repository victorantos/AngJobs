---
title: "Datamint : Rust Systems Engineer, Browser Security"
date: 2026-10-01
description: Datamint - Rust Systems Engineer, Browser Security - Remote (Global) - Full-time - $120k–$170k + Equity - We build high-throughput crawling and structured…
author: m00dy
authorUrl: https://news.ycombinator.com/item?id=49928677
byline: m00dy
section: october-2026
tags:
  - october-2026
---
Datamint - Rust Systems Engineer, Browser Security - Remote (Global) - Full-time - $120k–$170k + Equity - <a href="https:&#x2F;&#x2F;datamint.xyz" rel="nofollow">https:&#x2F;&#x2F;datamint.xyz</a>

We build high-throughput crawling and structured data extraction infra designed for AI agents and LLM pipelines.

If you’ve built scrapers recently, you already know the state of the market:

- Traditional proxy providers (Bright Data, Oxylabs, Smartproxy, Proxybase) give you raw IPs or massive unparsed HTML blobs, leaving you to deal with DOM bloat, token waste, and brittle parsing pipelines.

- Modern tools like Firecrawl or Jina made clean Markdown extraction easy for hobby setups, but they often struggle when you throw heavy SPAs, high-concurrency jobs, or hardened anti-bot walls (Cloudflare Under-Attack &#x2F; Turnstile, Kasada, DataDome) at them.

- Rolling your own Playwright &#x2F; Puppeteer cluster works until target sites deploy new JA4&#x2F;TLS fingerprints, and your data team ends up spending 30% of their sprints fixing broken crawlers instead of shipping product.

We&#x27;re tackling this by combining a low-latency Rust fast-fetch engine (JA4&#x2F;TLS and HTTP&#x2F;2 frame emulation) with an isolated stealth browser fleet, zero-code schema validation (JSON Schema&#x2F;Pydantic), and native Model Context Protocol (MCP) support.

Trade-offs &#x2F; where we fit: If you just need to curl a few static Wikipedia pages, a 10-line Python script is better and cheaper. But if you need reliable, structured data out of bot-defended sites without babying headless browsers, that&#x27;s what we do.

We&#x27;re looking for:

1. Rust Systems Engineer: High-concurrency network I&#x2F;O, Axum&#x2F;Tokio, TLS&#x2F;BoringSSL fingerprinting, proxy routing matrices, and low-latency data pipelines.

2. Browser Security Engineer: Deep familiarity with browser internals (Firefox&#x2F;Chromium source), canvas&#x2F;WebGL&#x2F;audio fingerprint evasion, CDP&#x2F;WebDriver stealth, and familarity with anti-bot defenses.

Our stack: Rust, Next.js 16&#x2F;React 19, TypeScript, hardened Firefox&#x2F;dwx_crawler, Linux&#x2F;Xvfb, SQLite WAL&#x2F;Postgres.

If interested, shoot an email to jobs@datamint.xyz (or founders@datamint.xyz) with your GitHub, a project you built or broke, and what you find interesting in this space. No formal cover letter needed.
[[form:apply]]
