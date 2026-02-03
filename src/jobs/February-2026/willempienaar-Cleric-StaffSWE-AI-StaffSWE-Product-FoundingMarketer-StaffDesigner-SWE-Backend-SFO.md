---
title: "Cleric : Staff SWE, AI"
author:
  name: willempienaar
  url: https://news.ycombinator.com/item?id=46859424
---
Cleric - <a href="https:&#x2F;&#x2F;cleric.ai" rel="nofollow">https:&#x2F;&#x2F;cleric.ai</a> - Staff SWE, AI - Staff SWE, Product - Founding Marketer - Staff Designer - SWE, Backend - SF Onsite (Designer Remote)

Engineers can&#x27;t keep up with their production environments: dozens of services, dashboards everywhere, alerts firing constantly. The information to diagnose most issues already exists, but finding it takes longer than fixing the problem. And the more AI-generated code ships, the more services get deployed by people who won&#x27;t be around to debug them.

Cleric connects to your existing observability stack, autonomously investigates production incidents, and tells engineers what&#x27;s wrong. We&#x27;re well funded with years of runway, a small team of AI and infrastructure veterans in SF, growing quickly. Stack: Python, Go, LLMs, Kubernetes.

Some of the problems we work on:

There&#x27;s no test suite in production. When the AI says &quot;the root cause is X,&quot; how do you verify that? You can&#x27;t A&#x2F;B test diagnoses. Ground truth labels don&#x27;t exist. We build evaluation systems that track resolution outcomes over weeks and correlate fixes with diagnoses to build statistical confidence.

When something breaks, everything looks broken. Database latency spikes, five services throw errors, CPU goes up, logs explode. When an agent sees 47 anomalies at once, it needs to figure out which one is the root cause and which are symptoms, across systems with feedback loops, hidden dependencies, and non-obvious temporal relationships.

A single investigation might need six hours of metrics across 50 services, 10GB of logs, 10,000 distributed traces, the last 30 deployments, and the relevant runbooks. LLMs have finite context windows. What&#x27;s relevant isn&#x27;t known until you investigate. Getting retrieval wrong means wrong conclusions or exploding costs.

We&#x27;re hiring:

- Staff Software Engineer, AI: You build the core agent. Reasoning, evals, self-improving feedback loops. You debug agent behavior by tracing reasoning and tool choices to understand why the agent made a specific decision. You build the systems that make a non-deterministic agent reliable, and push it to handle increasingly complex incidents.

- Staff Software Engineer, Product: You define what an AI SRE should actually be. When AI handles the reasoning, how do engineers stay sharp for cases it can&#x27;t handle? How do you build trust when someone needs to verify agent conclusions at 2AM? You answer these by embedding with customers during real incidents, running experiments, and making the technical calls to ship what works.

- Software Engineer, Backend: You build and scale the investigation platform alongside our senior engineers. Integrations with Datadog, PagerDuty, and dozens of observability tools. Agent reasoning pipelines. Runtime systems that handle real-time data streaming at scale. You&#x27;ll ship customer-facing functionality across the stack.

- Founding Marketer: Software engineers are allergic to AI hype. Our users already love the product. The challenge is reaching the next thousand teams without setting off their BS detectors. You build the marketing function from scratch: programs, pipeline, infrastructure. You need a technical foundation and the ability to hold a 30-minute conversation with a platform engineering lead without getting lost.

- Staff Designer (Remote): The interfaces for AI agents don&#x27;t exist yet. How do you make autonomous reasoning legible without overwhelming? You own design across brand, product, and marketing, defining the visual language for a new category.

Apply: <a href="https:&#x2F;&#x2F;jobs.ashbyhq.com&#x2F;cleric" rel="nofollow">https:&#x2F;&#x2F;jobs.ashbyhq.com&#x2F;cleric</a> - Email: willem-hn@cleric.ai

Willem, Co-founder &amp; CTO
<JobApplication />
