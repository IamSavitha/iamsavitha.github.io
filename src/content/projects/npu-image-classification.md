---
title: "Image Classification with NPU Deployment"
summary: "Custom CNN for ImageNet classification, converted PyTorch → ONNX → MXQ for real-time NPU inference."
tags: ["PyTorch", "CNN", "ONNX", "NPU"]
tier: listed
order: 2
pipeline:
  - { label: "ImageNet", detail: "multi-class images" }
  - { label: "Custom CNN", detail: "PyTorch" }
  - { label: "ONNX", detail: "model export" }
  - { label: "MXQ compile", detail: "for the NPU" }
  - { label: "NPU", detail: "real-time inference" }
---
