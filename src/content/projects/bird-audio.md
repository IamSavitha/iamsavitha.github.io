---
title: "Biodiversity Audio Classification (Kaggle)"
summary: "Bird-species identification from Pantanal field recordings using mel-spectrograms, EfficientNet, and audio transformers."
tags: ["PyTorch", "Librosa", "EfficientNet"]
repo: https://github.com/IamSavitha/KaggleBirdClef2026
tier: listed
order: 8
pipeline:
  - { label: "Field recordings", detail: "Pantanal wetlands" }
  - { label: "Mel-spectrograms", detail: "Librosa" }
  - { label: "Augmentation", detail: "long recordings" }
  - { label: "EfficientNet + AST", detail: "audio models" }
  - { label: "Ensemble", detail: "bird species" }
---
