---
title: "AquaShift (Hackathon)"
summary: "Agents that relocate inference workloads based on a Water Stress Index built from hourly wet-bulb temperature data."
tags: ["Python", "Agents", "Climate Tech"]
repo: https://github.com/IamSavitha/Aquashift
tier: listed
order: 9
pipeline:
  - { label: "Jua AI API", detail: "hourly weather" }
  - { label: "Water Stress Index", detail: "wet-bulb temps" }
  - { label: "Guild.ai agents", detail: "governance" }
  - { label: "Render + Composio", detail: "suspend or scale" }
  - { label: "Cooler regions", detail: "inference moves" }
---
