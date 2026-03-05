---
title: "ayeeye1careers"
author:
  name: ayeeye1careers
  url: https://news.ycombinator.com/item?id=47221438
---
We’re a start-up company, we are building a local-AI camera OS that replaces cloud CCTV: SigmaStar cameras → RTSP&#x2F;ONVIF → HDMI node → on-device AI (offline-first).

1. Hiring: OS &#x2F; Device Lifecycle Engineer (Secure Boot &#x2F; OTA &#x2F; Identity) (Remote, UK&#x2F;EU preferred)

We already run RTSP + inference. Now we need the person who owns several year device reality.

You will own (single layer ownership):
Secure boot &#x2F; trust chain (ROM → U-Boot → kernel → rootfs)
OTA updates + rollback strategy (A&#x2F;B, recovery modes)
Device identity &amp; lifecycle (provisioning, key rotation)
Failure recovery (power loss, corrupted SD, watchdogs)

You must be able to answer directly:
SD vs eMMC vs NVMe tradeoffs + corruption mitigation
Brown-out behavior, thermal throttling, BSP maturity
Camera ISP&#x2F;NPU concurrency constraints + vendor SDK realities

2. Hiring: Independent Embedded&#x2F;Firmware Engineer (Bring-up Audit &amp; Stability) (Remote UK&#x2F;EU preferred)

We’re shipping on real hardware. Reliability beats elegance. We need a senior embedded engineer to audit and validate our assumptions and prevent single-point-of-failure risk.

You will own:
Independent review of firmware&#x2F;bring-up assumptions
Validation of performance, thermals, power behavior, stability
Reproducible test plans (what breaks, how to detect, how to recover)
Documentation that prevents knowledge living in one head

If you’ve shipped embedded systems that survive ugly reality (packet loss, unplugging, thermal throttling, storage corruption), we want to talk.

Competitive salary, flexible working environment &amp; location, if you are interested, feel free to email: ayeeye.careers@gmail.com (subject: “HN – Role”)
<JobApplication />
