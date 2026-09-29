---
title: "CycleGAN Style Transfer"
summary: "CycleGAN from scratch translating between Monet paintings and photos with ResNet generators and PatchGAN discriminators."
tags: ["PyTorch", "GANs", "Computer Vision"]
repo: https://github.com/IamSavitha/Image-Style-Transfer-using-GAN
tier: listed
order: 6
pipeline:
  - { label: "Unpaired images", detail: "Monet ↔ photos" }
  - { label: "ResNet generators", detail: "both directions" }
  - { label: "PatchGAN", detail: "discriminators" }
  - { label: "Losses", detail: "adversarial·cycle·ID" }
  - { label: "Translated images", detail: "style transfer" }
---
