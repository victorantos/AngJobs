---
title: "BOSS-IQ : CTO Partner"
date: 2026-09-01
description: BOSS-IQ - CTO Partner - REMOTE (worldwide) - Full-time - Istanbul-based company - BOSS-IQ is an AI strategic-planning product for owner-operators of small…
author: ahmet_boss-iq
authorUrl: https://news.ycombinator.com/item?id=49598051
byline: ahmet_boss-iq
section: september-2026
tags:
  - september-2026
---
BOSS-IQ - CTO Partner - REMOTE (worldwide) - Full-time - Istanbul-based company - <a href="https:&#x2F;&#x2F;boss-iq.com" rel="nofollow">https:&#x2F;&#x2F;boss-iq.com</a>

BOSS-IQ is an AI strategic-planning product for owner-operators of small and medium businesses. The boss describes an idea that has been stuck for years; a research-and-question session returns an implementation-ready plan. In production since June, hand-onboarding our first paying customers since August, invitation-only.

I am looking for a partner rather than a first hire, and I need two things in one person. An experienced developer who has genuinely run software in production — deployments, incidents, on-call. And a black-belt prompter. I mean that as a level, not a flourish. The tell: if you watch other developers work in AI environments and feel real frustration — everyone prompts, most prompt badly — and you have quietly built your own standing rule files, your own context discipline, your own reusable prompt library, then you already know what I am describing. That is the rarer of the two skills, and the one I weight hardest.

Under the product, 60+ specialist agents run continuous extraction over each customer&#x27;s documents and sessions into a persistent, per-company memory: every fact dated and traced to its source sentence, contradictions kept rather than overwritten — a discipline we call Total Capture. Patent-pending since July, in context engineering.

Stack: TypeScript throughout. A NestJS API plus a separate NestJS worker on Railway, Next.js 16 &#x2F; React 19 on Vercel, Postgres with Prisma, Redis and BullMQ, Pinecone, S3-compatible storage. Agents are LangChain.js &#x2F; LangGraph ReAct agents on Anthropic Claude across three model tiers, with OpenAI embeddings. Every prompt body and model config lives in one versioned master file synced to LangSmith, never hardcoded in TypeScript.

I am the founder, and not an engineer — thirty years a strategy consultant, first terminal at the end of 2022. A contract developer built the first ~20,000 lines between December and February. Since February I have been the only developer, and it is now about 264,000 lines of TypeScript. I wrote the prompts first, 18,500 lines across 79 agent files, and the code came after to serve them.

That was the environment, not me: 45 interconnected instruction files deploying sub-agents, around 300,000 words of standing rules, orchestrated by one always-on kernel that classifies each session, auto-attaches the rules matching the files being touched, and generates sub-agentic plans for the work.

Compensation is the honest startup shape: generous equity, austerity salary. No number here — it is set against what you currently earn, and that is a conversation rather than a billboard.

Full posting: <a href="https:&#x2F;&#x2F;boss-iq.com&#x2F;cto-partner.html" rel="nofollow">https:&#x2F;&#x2F;boss-iq.com&#x2F;cto-partner.html</a>

Apply: <a href="https:&#x2F;&#x2F;boss-iq.com&#x2F;apply-cto.html" rel="nofollow">https:&#x2F;&#x2F;boss-iq.com&#x2F;apply-cto.html</a> — one question at a time, ending by asking you to write the prompts you would use on day one, not code. I read every one myself.

Or write to me directly: ahmet@boss-iq.com
[[form:apply]]
