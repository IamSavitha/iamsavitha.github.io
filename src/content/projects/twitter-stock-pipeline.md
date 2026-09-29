---
title: "Twitter Sentiment & Stock Pipeline"
summary: "Airflow + Snowflake + dbt pipeline with VADER sentiment and a LinearSVC price-trend model."
tags: ["Airflow", "Snowflake", "dbt", "NLTK"]
repo: https://github.com/IamSavitha/Tweet-stock-sentiment-pipeline
tier: listed
order: 10
pipeline:
  - { label: "Twitter + stocks", detail: "API ingestion" }
  - { label: "Airflow", detail: "orchestration" }
  - { label: "Snowflake", detail: "warehouse" }
  - { label: "dbt", detail: "SQL transforms" }
  - { label: "VADER + LinearSVC", detail: "price-trend model" }
---
