---
title: Multimodal RAG for Macroeconomics Documents
summary: Retrieval over text, figures, and tables from a macroeconomics PDF using hybrid cosine-similarity search.
metric: Grounded answers across 15 evaluation questions
tags: [LLMs, RAG, Vector Database, Python]
tier: featured
order: 6
pipeline:
  - { label: "Macro PDF", detail: "text·figures·tables" }
  - { label: "Extract", detail: "chunks + images" }
  - { label: "Embed", detail: "text and images" }
  - { label: "Vector database", detail: "indexed store" }
  - { label: "Hybrid retrieval", detail: "cosine similarity" }
  - { label: "LLM answer", detail: "grounded response" }
---
