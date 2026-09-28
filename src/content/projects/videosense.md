---
title: "VideoSense: Multimodal Human Activity Recognition"
summary: 3D CNNs, two-stream RGB + optical-flow fusion, and a Siamese few-shot model for recognizing human activities in video.
metric: "TODO: headline top-k accuracy on UCF101"
tags: [PyTorch, 3D CNNs, Optical Flow, Siamese Networks, Grad-CAM]
tier: flagship
order: 4
role: "TODO: your role (solo / team of N)"
timeframe: "TODO: course and term, e.g. DATA 255, Spring 2026"
metrics:
  - { label: "Dataset", value: "UCF101" }
  - { label: "Architectures", value: "C3D, R(2+1)D" }
  - { label: "Streams", value: "RGB + optical flow" }
  - { label: "Top-1 accuracy", value: "TODO" }
---

## Problem

TODO: the activity-recognition problem and why a single RGB model wasn't enough.

## Approach

- Trained C3D and R(2+1)D 3D CNNs on UCF101 to classify human movements.
- Built a two-stream late-fusion model combining RGB features with dense Farneback optical-flow motion features.
- Built a Siamese network trained with contrastive loss for few-shot video similarity on sparse-data classes.
- Used Grad-CAM saliency maps to inspect what the models attend to.

## Results

TODO: top-k accuracy per model and for the fused model; one Grad-CAM figure.

## What I'd do next

TODO
