---
title: "Chorus One : Platforms Engineer"
author:
  name: ruuda
  url: https://news.ycombinator.com/item?id=43244997
---
Chorus One - <a href="https:&#x2F;&#x2F;chorus.one&#x2F;careers" rel="nofollow">https:&#x2F;&#x2F;chorus.one&#x2F;careers</a> - Platforms Engineer - REMOTE (Switzerland ± 6 hours)

Chorus One operates validators on many proof-of-stake blockchains (the ones where security is based on a Byzantine fault-tolerant consensus algorithm rather than wasting energy). We are hiring for several roles, but the one I will highlight is what we call Platforms Engineer. Some companies call this Site Reliability Engineering or Devops.

The main thing we do is take upstream software, build it, run it on our infrastructure, and then monitor it and optimize that setup. Some things that make this interesting are:

<pre><code>    * Building automation that enables us to do this for many networks (70+ currently).
    * Doing this with high uptime, building automation for failover, etc.
    * Working with software that is on the one hand cutting-edge and doing interesting things (consensus algorithms, distributed systems, cryptography), but on the other hand that means it’s immature and often not easy to operate and monitor. Often we have to build custom tools, and dive into the source code of the project. We contribute patches upstream when it makes sense.
    * Some of these projects are exercising the limits of what a machine can do, we have to do some low-level investigation that requires understanding of what the Linux kernel and network hardware are doing to properly identify what’s going on.
</code></pre>
We do have a small cloud footprint, but run primarily on bare metal. We are looking for people who can not just configure services offered by the public clouds, but who deeply understand what lies below; people who could build their own cloud. That sounds a bit pretentious and it’s not exactly what we do, but it does involve many of the same aspects.

A very recent example of what I personally find fascinating: last week Ethereum’s Holesky testnet experienced loss of liveness. This is a real-world, globally distributed system that implements Byzantine fault tolerance, with multiple independent implementations of the protocol. Several of these implementations had a bug in an update, which caused a split in the network. The protocol is designed to handle this situation in theory, but in practice it is triggering previously unexplored failure modes in the implementations, that are hard to test for in synthetic small-scale tests. I think there are very few places where you get to be involved in a planet-scale distributed system exhibiting “interesting” behavior, especially one that is not in control of a single entity. Of course, there is also the less fun part that the testnet is now broken, alerts are firing, and it’s hard and chaotic to coordinate a fix when the network is not controlled by a single entity. Fortunately it’s a testnet.

Apply at <a href="https:&#x2F;&#x2F;careers.chorus.one&#x2F;o&#x2F;platforms-engineer-remote" rel="nofollow">https:&#x2F;&#x2F;careers.chorus.one&#x2F;o&#x2F;platforms-engineer-remote</a>.
<JobApplication />
