---
title: "Image Super-Resolution on NPU"
summary: "Custom DNN that reconstructs high-quality images from low-resolution inputs, deployed to NPU via ONNX → MXQ."
tags: ["PyTorch", "ONNX", "NPU"]
tier: listed
order: 3
pipeline:
  - { label: "Low-res input", detail: "degraded images" }
  - { label: "Custom DNN", detail: "PyTorch" }
  - { label: "ONNX", detail: "model export" }
  - { label: "MXQ compile", detail: "for the NPU" }
  - { label: "NPU", detail: "high-res output" }
---
