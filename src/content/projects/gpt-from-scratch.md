---
title: GPT-Style Language Model from Scratch
summary: A ~4.8M-parameter decoder-only Transformer built and trained from scratch in PyTorch on TinyStories.
metric: Validation loss 0.6438 on 110K stories
tags: [PyTorch, Transformers, Attention, NLP]
tier: flagship
order: 3
metrics:
  - { label: "Parameters", value: "~4.8M" }
  - { label: "Training stories", value: "110,000" }
  - { label: "Validation loss", value: "0.6438" }
  - { label: "Vocabulary (char-level)", value: "110" }
---

## Problem

TODO: why you built a language model from scratch instead of fine-tuning a pretrained one.

## Approach

- Implemented a decoder-only GPT-style Transformer in PyTorch, including attention and positional components, without pretrained embeddings.
- Used character-level tokenization (vocabulary size 110).
- Trained on 110,000 synthetic stories from the TinyStories dataset.

TODO: architecture details (layers, heads, context length) and key training decisions.

## Results

| Measure | Value |
|---|---|
| Validation loss | 0.6438 |
| Parameters | ~4.8M |

Generation quality was analyzed across sampling temperatures from T=0 to T=1.2.

TODO: sample outputs at low and high temperature and the failure modes you documented.

## What I'd do next

TODO
