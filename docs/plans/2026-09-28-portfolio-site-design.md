# Portfolio Site — Design

**Date:** 2026-09-28
**Status:** Approved

## Goal

A personal portfolio site that positions Savitha as an **ML/AI Engineer** (applied ML + deployment, with data engineering as a supporting strength), hosted free on GitHub Pages at `https://iamsavitha.github.io`.

## Decisions

| Question | Decision |
|---|---|
| What | Portfolio website built from the master resume |
| Positioning | ML/AI Engineer |
| Hosting | GitHub Pages user site, repo `IamSavitha/iamsavitha.github.io` |
| Approach | Astro static site with Markdown case-study pages (chosen over a single hand-written page and a Jekyll theme) |

## 1. Site structure

**`/` — one scrolling home page**
1. Hero — name, one-line pitch ("ML/AI Engineer — edge AI, NLP, and models that ship"), buttons: Resume · GitHub · LinkedIn · Email
2. About — 3–4 sentences: LTI data-engineering background → SJSU M.S. → deployed-ML focus
3. Experience — compact timeline: IDX Exchange, SJSU ISA, HexasenseAI, LTI (two roles grouped); 2 bullets each
4. Featured projects — up to 6 cards: title, one-liner, one headline metric, tags, repo/case-study links
5. More projects — compact list of remaining *completed* projects
6. Skills — grouped, shown once
7. Footer — contact

**`/projects/<slug>`** — case-study pages for flagship projects.
**`/resume.pdf`** — cleaned-up resume.
**`/404`** — custom not-found page.

**Flagship case studies:** Wildfire Edge Sentinel, IDX semantic search (only if the internship permits publishing — otherwise it stays an experience entry and Amazon recsys takes its featured slot), GPT-style LM from scratch, VideoSense.
**Other featured cards:** Kayak travel system, Multimodal RAG.

**Out of scope (YAGNI):** blog, tag filtering, analytics, contact form, animations, theme toggle.

## 2. Content model

```
src/
  content/projects/*.md    one file per project
  content.config.ts        collection definition
  lib/projectSchema.ts     zod schema (unit-tested)
  lib/projects.ts          tier grouping + validation (unit-tested)
  data/profile.ts          name, pitch, about, links
  data/experience.ts       timeline entries
  data/skills.ts           grouped skills
  assets/projects/<slug>/  diagrams/screenshots (optimized by Astro)
public/resume.pdf
```

**Project frontmatter**

```yaml
title: string
summary: string          # one line
metric: string           # headline metric on the card
tags: string[]
repo: url?               # optional; button hidden if absent
demo: url?               # optional
tier: flagship | featured | listed
order: number
metrics: [{label, value}]   # required when tier = flagship
```

- `flagship` → card + case-study page; `featured` → card only; `listed` → "More projects" list.
- A project without a file does not appear. Plan-stage resume projects are simply not added.

**Case-study template (Markdown body, fixed headings)**
1. At a glance — metrics strip rendered from `metrics`, plus role/timeframe/stack
2. Problem
3. Approach — architecture diagram + key decisions and rejected alternatives
4. Results — before/after table
5. What I'd do next
6. Links

## 3. Visual design, build, testing

**Visual**
- Typographic, content-first; ~70ch text measure, responsive card grid.
- One accent color (wildfire orange) + neutrals as CSS custom properties; light/dark via `prefers-color-scheme`.
- Inter (body) + JetBrains Mono (metrics/tags), self-hosted via `@fontsource`.
- Plain CSS (scoped Astro styles + one global tokens file). No Tailwind, no UI framework, zero client JS.
- Diagrams as SVG. Layout works at 375px.

**Build & deploy**
- Fresh git repo in this folder (not the enclosing home-directory repo).
- GitHub Actions on push to `main`: `npm ci` → unit tests → `astro check` → `astro build` → placeholder check → internal link check (lychee, offline) → `actions/deploy-pages`. Pages source = "GitHub Actions". PRs run the same checks without deploying. Pages write + OIDC (`id-token: write`) permissions and the `pages` concurrency group are scoped to the deploy job, not the build job.

**Error handling** — fail at build time, never in production:
- Invalid frontmatter or missing image import fails `astro build`.
- A flagship without `metrics` fails the build (checked in `lib/projects.ts`).
- Any `TODO` left in `src/content` or `src/data` fails CI, so placeholders never ship.
- Missing optional links hide their buttons; no dead `#` links.

**Testing**
- Vitest unit tests for the project schema and tier grouping.
- CI: `astro check`, `astro build`, lychee internal link check.
- Manual pre-launch: Lighthouse Performance/Accessibility ≥ 95, 375px viewport, both color schemes.

## Content prerequisites (owner: Savitha)

1. Fix the resume PDF: the Wildfire entry is misplaced inside Technical Skills in a different font, and Technical Skills appears twice.
2. Confirm which resume projects are complete enough to list; entries worded as plans ("Lambda *or* Cloud Run", "Triton *or* TorchServe", "quantize *it*") stay off the site until they have artifacts.
3. Confirm what IDX Exchange work may be published.
4. Provide repo URLs, LinkedIn URL, architecture diagrams, and "What I'd do next" notes for case studies.
5. Keep the master resume (contains phone number) out of the public repo; publish only the curated `public/resume.pdf`.
