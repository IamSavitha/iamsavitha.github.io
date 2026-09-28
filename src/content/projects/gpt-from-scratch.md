---
title: GPT-Style Language Model from Scratch
summary: A ~4.8M-parameter decoder-only Transformer built and trained from scratch in PyTorch on TinyStories.
metric: Validation loss 0.6438 with a small train–val gap
tags: [PyTorch, Transformers, Attention, NLP]
repo: https://github.com/IamSavitha/GPT-Style-LLM-from-Scratch
tier: flagship
order: 3
role: "TODO: your role (solo / team of N)"
timeframe: "TODO: course and term, e.g. DATA 266, Spring 2026"
metrics:
  - { label: "Parameters", value: "~4.8M" }
  - { label: "Train / val stories", value: "100K / 10K" }
  - { label: "Validation loss", value: "0.6438" }
  - { label: "Vocabulary (char-level)", value: "110" }
---

## Problem

Fine-tuning a pretrained model hides how autoregressive language models actually work. The goal was to build a GPT-style model from first principles, with no pretrained weights or embeddings, and see what a small model trained on a narrow dataset can and can't do.

## Approach

A decoder-only Transformer, written from scratch in PyTorch:

| Component | Value |
|---|---|
| Transformer blocks | 6 |
| Attention heads | 8 |
| Embedding dimension | 256 |
| Feed-forward dimension | 1024 (GELU) |
| Context length | 128 characters |
| Dropout | 0.1 |
| Parameters | ~4.8M |

- **Data:** 100,000 training and 10,000 validation stories from TinyStories, with character-level tokenization (vocabulary of 110).
- **Training:** AdamW (learning rate 3e-3, weight decay 1e-2), batch size 128, 20 epochs, gradient clipping at 1.0.
- **Schedule:** linear warmup for the first 200 steps, then cosine decay to 3e-4.

## Results

| Measure | Value |
|---|---|
| Final training loss | 0.6057 |
| Final validation loss | 0.6438 |

Training converged stably over 20 epochs with a small train–validation gap. Sampling temperature changed the output clearly:

- **T = 0:** fluent, coherent and deterministic stories.
- **T = 0.8:** more varied and still mostly coherent.
- **T = 1.2:** noticeably random, with occasional nonsense.

**Failure modes I documented:**

- **Repetition:** loops such as "She tried to pull it out, but it was too hard..." repeating without end.
- **Loss of coherence:** sudden shifts of topic or character mid-story.
- **Invented words:** non-words such as "ductors" and "wugged", a side effect of predicting one character at a time.

## What I'd do next

- **Move to subword tokenization.** Character-level tokens limit how much meaning the model can capture per step and cause the invented words above.
- **Extend the context window.** At 128 characters, the model loses track of longer stories, which feeds the coherence failures.
