---
title: Kepler : Full Stack Engineer
date: 2026-05-01
description: Kepler - Full Stack Engineer - New York, NY - ONSITE - $230K-$260K + equity We're building the trust layer for AI in high-stakes industries. LLMs…
author: eddiehammond
authorUrl: https://news.ycombinator.com/item?id=47999884
byline: eddiehammond
section: may-2026
tags:
  - may-2026
---

Kepler - Full Stack Engineer - New York, NY - ONSITE - $230K-$260K + equity

We&#x27;re building the trust layer for AI in high-stakes industries. <a href="https:&#x2F;&#x2F;kepler.ai" rel="nofollow">https:&#x2F;&#x2F;kepler.ai</a>

LLMs hallucinate, so they can&#x27;t be the thing producing your numbers. In Kepler, the LLM orchestrates (decides what data to gather, what to compute, how to structure the output), but the model never touches the data itself. Every actual value flows through deterministic code pipelines with provenance metadata back to source. Verification loops cross-check outputs before users see them.

We started in finance because tolerance for wrong answers is zero. First product is a research platform for buy-side analysts: pull comparables, build models, research filings. Same architecture extends to chemicals, legal, healthcare. Models are commoditizing fast; the trust layer is what&#x27;s missing.

If you want the deeper architecture writeup, Anthropic just published a case study on Kepler: <a href="https:&#x2F;&#x2F;claude.com&#x2F;blog&#x2F;how-kepler-built-verifiable-ai-for-financial-services-with-claude" rel="nofollow">https:&#x2F;&#x2F;claude.com&#x2F;blog&#x2F;how-kepler-built-verifiable-ai-for-f...</a>

What you&#x27;d build:

- Source-explorer UI that traces any value back to its exact origin in the original document
- Extraction pipeline for a data source we don&#x27;t yet handle, with provenance and verification from day one
- Agent orchestrator that handles partial failures so a bad extraction from one source doesn&#x27;t block parallel work
- Verification rules that cross-check values across multiple sources and surface conflicts with provenance on both sides

Stack: Rust backend (orchestration, extraction, computation), TypeScript&#x2F;React frontend, PostgreSQL, AWS. Model-agnostic, currently Claude + GPT. We don&#x27;t require Rust experience; we hire on fundamentals.

Looking for 5 years production experience, strong in TypeScript&#x2F;React, comfortable in backend work. Bonus if you&#x27;ve built systems where correctness mattered (payments, data infra, healthcare, anything where a wrong output has consequences). Distributed systems basics: concurrency, fault tolerance, retries, idempotency.

Founding team is 40+ combined years at Palantir building Foundry&#x27;s core systems (Ontology, Fusion, Workshop, FoundryML). CEO scaled a data company to $15M ARR, sold it, then ran Business Engineering at Citadel. Backed by founders of OpenAI, Meta AI Research, MotherDuck, dbt Labs.

In-office NYC.

Apply: <a href="https:&#x2F;&#x2F;jobs.ashbyhq.com&#x2F;kepler-ai&#x2F;52624a4e-33e3-4f16-8028-026c94fb2eb8" rel="nofollow">https:&#x2F;&#x2F;jobs.ashbyhq.com&#x2F;kepler-ai&#x2F;52624a4e-33e3-4f16-8028-0...</a>, or email me: eddie.hammond@kepler.ai
[[form:apply]]
