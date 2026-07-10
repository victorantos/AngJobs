---
title: "Syntropic (thesyntropic.com) : Founding CTO / GPU Systems Engineer"
date: 2026-07-01
description: Syntropic (thesyntropic.com) - Founding CTO / GPU Systems Engineer - Remote (US) - Equity-heavy We compress LLM KV cache. Measured: 8× at 3-bit with 0.43%…
author: josefeli1
authorUrl: https://news.ycombinator.com/item?id=48797747
byline: josefeli1
section: july-2026
tags:
  - july-2026
---
Syntropic (thesyntropic.com) - Founding CTO &#x2F; GPU Systems Engineer - Remote (US) - Equity-heavy

We compress LLM KV cache. Measured: 8× at 3-bit with 0.43% quality delta (GPU-validated); 22× live end-to-end on a 5-tenant workload, GPU-verified this week (quantization × prefix dedup, decomposition always stated); 16.89× tenant density on a single V100-32GB. Validated across Mistral&#x2F;Qwen&#x2F;Llama with zero re-tuning. 90+ patents pending; design-partner pipeline; seed round in motion.

The gap: our throughput path is a reference implementation. First job is the fused Triton&#x2F;CUDA dequant+attention kernel — turning a validated 22× memory result into production speed. Then you own the serving stack.

Process: call → NDA → paid 1–2 week trial on the real kernel → decide together. We report negative results straight; you should want to work somewhere that does.

Contact: josef@podosai.com (Yosef Elimlich, founder — PODOS AI is our affiliated hardware company; the compression IP is Syntropic)
[[form:apply]]
