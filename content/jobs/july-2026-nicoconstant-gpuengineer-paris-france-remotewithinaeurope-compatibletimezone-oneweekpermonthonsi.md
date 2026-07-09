---
title: GPU Engineer : Paris, France
date: 2026-07-01
description: Kog ( ) - GPU Engineer - Paris, France - REMOTE within a Europe-compatible timezone, one week per month onsite in Paris We are hiring a GPU Engineer to…
author: NicoConstant
authorUrl: https://news.ycombinator.com/item?id=48762916
byline: NicoConstant
section: july-2026
tags:
  - july-2026
---

Kog (<a href="https:&#x2F;&#x2F;kog.ai" rel="nofollow">https:&#x2F;&#x2F;kog.ai</a>) - GPU Engineer - Paris, France - REMOTE within a Europe-compatible timezone, one week per month onsite in Paris

We are hiring a GPU Engineer to work on the fastest LLM inference engine on standard datacenter GPUs.

You would own low-level kernel work in CUDA&#x2F;PTX or HIP&#x2F;CDNA ISA, the monokernel pipeline, profiling infrastructure inside it, scaling to the frontier MoE models that run in production, and building our own agents that optimize kernels and inference autonomously.

We generate 3,000 tokens&#x2F;s per request on 8x AMD MI300X and 2,100 on 8x NVIDIA H200, at batch size 1, FP16, no speculative decoding.

At batch size 1, the decode is GEMV, so it is memory bandwidth bound, and MBU is what counts.

We rewrote the whole hot path ourselves, from the assembly on the chip up to the Transformer we designed around it, with the full decode running as a single persistent GPU kernel.

Try it at <a href="https:&#x2F;&#x2F;playground.kog.ai" rel="nofollow">https:&#x2F;&#x2F;playground.kog.ai</a>

Showing your code is part of the process.

If you are outside a Europe-compatible timezone, relocation to one is required.

Apply: <a href="https:&#x2F;&#x2F;jobs.ashbyhq.com&#x2F;kog&#x2F;e3950334-a2a6-43cc-a744-df6c38683166" rel="nofollow">https:&#x2F;&#x2F;jobs.ashbyhq.com&#x2F;kog&#x2F;e3950334-a2a6-43cc-a744-df6c386...</a>

Questions, email me at nicolas.constant@kog.ai
[[form:apply]]
