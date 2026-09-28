---
title: Wildfire Edge Sentinel
summary: Offline-first wildfire smoke detection on an HP ZGX Nano that sends alerts, not video, to the cloud.
metric: VLM calls 266 → 11 on a 6-tower run
tags: [YOLO11, Qwen2.5-VL, LoRA, ONNX, Docker, Edge AI]
tier: flagship
order: 1
role: "TODO: your role on the team"
timeframe: "TODO: HP Edge AI SJSU Hackathon, month year"
metrics:
  - { label: "Detector mAP50 (D-Fire)", value: "0.002 → 0.748" }
  - { label: "VLM calls per run", value: "266 → 11" }
  - { label: "VLM tokens per run", value: "447K → 3K" }
  - { label: "Video uploaded", value: "23 MB → 0 B" }
---

## Problem

Wildfire lookout cameras produce continuous video from remote towers with unreliable connectivity. Sending every frame to a cloud model is slow and costly, and detection must keep working when the network drops.

## Approach

<!-- TODO: export architecture diagram to src/assets/projects/wildfire-edge-sentinel/architecture.svg and replace this comment with:
![Wildfire Edge Sentinel architecture](../../assets/projects/wildfire-edge-sentinel/architecture.svg) -->

- **Detect on the edge.** A fine-tuned YOLO11 detector runs on the HP ZGX Nano.
- **Confirm with a distilled VLM.** A Qwen2.5-VL-7B model, LoRA fine-tuned on labels distilled from a 32B teacher, classifies the smoke source for detector hits.
- **Escalate alerts, not video.** Video stays on-device and only alerts go upstream. During network outages the pipeline keeps detecting and queues alerts.

TODO: key design decisions and the alternatives you rejected.

## Results

| Measure | Before | After |
|---|---|---|
| Detector mAP50, D-Fire | 0.002 | 0.748 |
| Detector mAP50, lookout-tower smoke | 0.198 | 0.718 |
| VLM source-type agreement (500 held-out crops) | 45.0% | 73.6% |
| VLM calls (266-frame, 6-tower run) | 266 | 11 |
| VLM tokens (same run) | 447K | 3K |
| Video uploaded (same run) | 23 MB | 0 B |

## What I'd do next

TODO
