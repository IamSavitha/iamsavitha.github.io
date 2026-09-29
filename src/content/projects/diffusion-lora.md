---
title: "Domain-Specific Diffusion Fine-Tuning"
summary: "SDXL fine-tuned with LoRA/QLoRA, comparing compute, memory, and quality trade-offs via Inception Score and CLIP similarity."
tags: ["Stable Diffusion", "LoRA", "QLoRA", "CLIP"]
repo: https://github.com/IamSavitha/Diffusion-Model-Fine-Tuning-
tier: listed
order: 4
pipeline:
  - { label: "Domain dataset", detail: "captioned images" }
  - { label: "SDXL base", detail: "Stable Diffusion" }
  - { label: "LoRA / QLoRA", detail: "fine-tuning" }
  - { label: "Generate", detail: "domain images" }
  - { label: "Evaluate", detail: "IS · CLIP similarity" }
---
