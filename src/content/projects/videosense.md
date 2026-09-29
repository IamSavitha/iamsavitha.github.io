---
title: "VideoSense: Multimodal Human Activity Recognition"
summary: 3D CNNs, two-stream RGB + optical-flow fusion, and a Siamese few-shot model for recognizing human activities in video.
tags: [PyTorch, 3D CNNs, Optical Flow, Siamese Networks, Grad-CAM]
tier: listed
order: 0
pipeline:
  - { label: "UCF101 clips", detail: "human activities" }
  - { label: "RGB stream", detail: "C3D · R(2+1)D" }
  - { label: "Optical flow", detail: "Farneback motion" }
  - { label: "Late fusion", detail: "two-stream" }
  - { label: "Siamese network", detail: "few-shot similarity" }
  - { label: "Grad-CAM", detail: "saliency maps" }
---
