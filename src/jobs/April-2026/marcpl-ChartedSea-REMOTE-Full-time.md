---
title: "Charted Sea : REMOTE"
author:
  name: marcpl
  url: https://news.ycombinator.com/item?id=47602068
---
Charted Sea - JavaScript Deobfuscation &#x2F; Reverse Engineering - REMOTE - Full-time - <a href="https:&#x2F;&#x2F;chartedsea.com&#x2F;about" rel="nofollow">https:&#x2F;&#x2F;chartedsea.com&#x2F;about</a>

We build a SaaS to extract data from complex platforms like Shopee. They use heavy obfuscation &amp; anti-bot systems, and our job is to break them.

We are working on a deobfuscator that turns obfuscated JavaScript into readable code. It behaves like a decompiler:

- restore strings (e.g. `f(42)` → &quot;my-string&quot;)

- simplify control flow (`a &amp;&amp; b -- !a &amp;&amp; c` → `if (a) { b } else { c }`)

- unpack sequence expressions (`var a = (c=1, b=1+c, 3+b+c)`)

- decompile a custom bytecode VM (70K instructions)

This is not typical web&#x2F;backend work. The target platforms evolve constantly.

We&#x27;re looking for someone who:

- enjoys understanding complex systems by experimentation

- is comfortable with partially understood code

- has built non-trivial tools (parser, interpreter, RE tool, etc.)

You will:

- own the deobfuscator

- work directly with the founder

- have time to go deep (long-term problem)

Stack: TypeScript, Babel

Compensation:
$40k–$80k USD + monthly bonus (10% of net revenue shared with team)

Apply: marc.plouhinec@chartedsea.com (short intro + CV&#x2F;GitHub)
<JobApplication />
