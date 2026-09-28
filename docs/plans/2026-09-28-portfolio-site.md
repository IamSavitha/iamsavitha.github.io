# Portfolio Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `development/reference/executing-plans-guide.md` to implement this plan task-by-task.

**Goal:** Build and deploy an Astro portfolio site at `https://iamsavitha.github.io` that positions Savitha as an ML/AI Engineer, with Markdown case studies for flagship projects.

**Architecture:** Static Astro site, zero client JS. Projects are Markdown files in an Astro content collection validated by a zod schema; profile/experience/skills are typed TS data files. A pure `groupByTier` helper splits projects into cards vs. list and enforces flagship rules at build time. GitHub Actions runs tests, type checks, build, and an internal link check, then deploys to GitHub Pages.

**Tech Stack:** Astro 7 (content layer: `src/content.config.ts`, `glob` loader, `render()`), TypeScript strict, Vitest, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`, GitHub Actions, lychee.

**Design doc:** `docs/plans/2026-09-28-portfolio-site-design.md`

**Conventions**
- Working directory for every command: `/Users/savithavijayarangan/Desktop/Savitha_Porfolio` (its own git repo, branch `main`).
- Commit messages: conventional prefix (`feat:`, `chore:`, `content:`, `ci:`). **No `Co-Authored-By` or Claude attribution lines.**
- Never invent facts about projects. Anything not stated in the master resume is written as `TODO: …`; CI refuses to deploy while any `TODO` remains in `src/content` or `src/data`.
- If an Astro API in this plan errors (the plan targets the Astro 5+ content-layer API), check https://docs.astro.build for the current equivalent rather than guessing.

---

### Task 1: Scaffold Astro, Vitest, and fonts

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro` (temporary)

**Step 1: Create `package.json`**

```json
{
  "name": "iamsavitha.github.io",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

**Step 2: Install dependencies**

Run:
```bash
npm install astro @fontsource-variable/inter @fontsource/jetbrains-mono
npm install -D vitest @astrojs/check typescript
```
Expected: `package-lock.json` created, no errors.

**Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iamsavitha.github.io',
});
```

**Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

**Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

**Step 6: Create a temporary `src/pages/index.astro`**

```astro
<h1>Scaffold OK</h1>
```

**Step 7: Verify build**

Run: `npm run build`
Expected: `dist/index.html` exists; output ends with `Complete!`.

**Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts src/pages/index.astro
git commit -m "chore: scaffold Astro with Vitest and fonts"
```

---

### Task 2: Project schema (TDD)

**Files:**
- Create: `src/lib/projectSchema.ts`
- Test: `src/lib/projectSchema.test.ts`

**Step 1: Write the failing test** — `src/lib/projectSchema.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { projectSchema } from './projectSchema';

const flagship = {
  title: 'Wildfire Edge Sentinel',
  summary: 'Offline-first smoke detection on edge hardware.',
  metric: 'VLM calls 266 → 11',
  tags: ['YOLO11'],
  tier: 'flagship',
  order: 1,
  metrics: [{ label: 'VLM calls', value: '266 → 11' }],
};

const listed = {
  title: 'IMDB Sentiment',
  summary: 'BiLSTM vs CNN-BiLSTM sentiment classification.',
  tags: ['PyTorch'],
  tier: 'listed',
  order: 1,
};

describe('projectSchema', () => {
  it('accepts a complete flagship project', () => {
    expect(projectSchema.safeParse(flagship).success).toBe(true);
  });

  it('accepts a listed project with no metric, metrics, or links', () => {
    expect(projectSchema.safeParse(listed).success).toBe(true);
  });

  it('rejects an unknown tier', () => {
    expect(projectSchema.safeParse({ ...listed, tier: 'hero' }).success).toBe(false);
  });

  it('rejects a repo that is not a URL', () => {
    expect(projectSchema.safeParse({ ...listed, repo: 'github.com/x' }).success).toBe(false);
  });

  it('rejects a summary longer than 140 characters', () => {
    expect(projectSchema.safeParse({ ...listed, summary: 'x'.repeat(141) }).success).toBe(false);
  });

  it('requires at least one tag', () => {
    expect(projectSchema.safeParse({ ...listed, tags: [] }).success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./projectSchema`.

**Step 3: Write minimal implementation** — `src/lib/projectSchema.ts`

```ts
import { z } from 'astro/zod';

export const metricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(140),
  metric: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).min(1),
  repo: z.string().url().optional(),
  demo: z.string().url().optional(),
  tier: z.enum(['flagship', 'featured', 'listed']),
  order: z.number().int(),
  role: z.string().min(1).optional(),
  timeframe: z.string().min(1).optional(),
  metrics: z.array(metricSchema).optional(),
});

export type Metric = z.infer<typeof metricSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: 6 passed.

**Step 5: Commit**

```bash
git add src/lib/projectSchema.ts src/lib/projectSchema.test.ts
git commit -m "feat: add project content schema"
```

---

### Task 3: Tier grouping and flagship rules (TDD)

**Files:**
- Create: `src/lib/projects.ts`
- Test: `src/lib/projects.test.ts`

**Step 1: Write the failing test** — `src/lib/projects.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { groupByTier, type ProjectEntry } from './projects';
import type { ProjectData } from './projectSchema';

function entry(id: string, data: Partial<ProjectData>): ProjectEntry {
  return {
    id,
    data: { title: id, summary: 's', metric: 'm', tags: ['t'], tier: 'featured', order: 0, ...data },
  };
}

const someMetrics = [{ label: 'x', value: '1' }];

describe('groupByTier', () => {
  it('splits cards from listed and sorts each by order', () => {
    const { cards, listed } = groupByTier([
      entry('c', { tier: 'listed', order: 2 }),
      entry('b', { tier: 'featured', order: 2 }),
      entry('a', { tier: 'flagship', order: 1, metrics: someMetrics }),
      entry('d', { tier: 'listed', order: 1 }),
    ]);
    expect(cards.map((e) => e.id)).toEqual(['a', 'b']);
    expect(listed.map((e) => e.id)).toEqual(['d', 'c']);
  });

  it('throws when a flagship has no metrics', () => {
    expect(() => groupByTier([entry('x', { tier: 'flagship' })])).toThrow(/Flagship project "x"/);
  });

  it('throws when a flagship has an empty metrics list', () => {
    expect(() => groupByTier([entry('x', { tier: 'flagship', metrics: [] })])).toThrow(/Flagship project "x"/);
  });

  it('throws when a card has no headline metric', () => {
    expect(() => groupByTier([entry('y', { tier: 'featured', metric: undefined })])).toThrow(
      /needs a headline metric/,
    );
  });

  it('allows listed projects without a headline metric', () => {
    expect(() => groupByTier([entry('z', { tier: 'listed', metric: undefined })])).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./projects`.

**Step 3: Write minimal implementation** — `src/lib/projects.ts`

```ts
import type { ProjectData } from './projectSchema';

export interface ProjectEntry {
  id: string;
  data: ProjectData;
}

/** Splits projects into home-page cards (flagship + featured) and the compact list, sorted by `order`.
 *  Throws on content that would render badly, so problems fail the build instead of shipping. */
export function groupByTier<T extends ProjectEntry>(entries: T[]): { cards: T[]; listed: T[] } {
  for (const { id, data } of entries) {
    if (data.tier === 'flagship' && !data.metrics?.length) {
      throw new Error(`Flagship project "${id}" needs a non-empty metrics list`);
    }
    if (data.tier !== 'listed' && !data.metric) {
      throw new Error(`Project "${id}" is ${data.tier} and needs a headline metric`);
    }
  }
  const sorted = [...entries].sort((a, b) => a.data.order - b.data.order);
  return {
    cards: sorted.filter((e) => e.data.tier !== 'listed'),
    listed: sorted.filter((e) => e.data.tier === 'listed'),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: 11 passed (6 schema + 5 grouping).

**Step 5: Commit**

```bash
git add src/lib/projects.ts src/lib/projects.test.ts
git commit -m "feat: add tier grouping with flagship validation"
```

---

### Task 4: Content collection + first project file

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/projects/wildfire-edge-sentinel.md`

**Step 1: Create `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectSchema } from './lib/projectSchema';

export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: projectSchema,
  }),
};
```

**Step 2: Create `src/content/projects/wildfire-edge-sentinel.md`**

All facts below come from the master resume. `TODO`s are for Savitha to fill.

```md
---
title: Wildfire Edge Sentinel
summary: Offline-first wildfire smoke detection on an HP ZGX Nano that sends alerts, not video, to the cloud.
metric: VLM calls 266 → 11 on a 6-tower run
tags: [YOLO11, Qwen2.5-VL, LoRA, ONNX, Docker, Edge AI]
tier: flagship
order: 1
role: "TODO: your role on the team"
timeframe: "TODO: HP Edge AI SJSU Hackathon, month year"
metrics:
  - { label: "Detector mAP50 (D-Fire)", value: "0.002 → 0.748" }
  - { label: "VLM calls per run", value: "266 → 11" }
  - { label: "VLM tokens per run", value: "447K → 3K" }
  - { label: "Video uploaded", value: "23 MB → 0 B" }
---

## Problem

Wildfire lookout cameras produce continuous video from remote towers with unreliable connectivity. Sending every frame to a cloud model is slow and costly, and detection must keep working when the network drops.

## Approach

<!-- TODO: export architecture diagram to src/assets/projects/wildfire-edge-sentinel/architecture.svg and replace this comment with:
![Wildfire Edge Sentinel architecture](../../assets/projects/wildfire-edge-sentinel/architecture.svg) -->

- **Detect on the edge.** A fine-tuned YOLO11 detector runs on the HP ZGX Nano.
- **Confirm with a distilled VLM.** A Qwen2.5-VL-7B model, LoRA fine-tuned on labels distilled from a 32B teacher, classifies the smoke source for detector hits.
- **Escalate alerts, not video.** Video stays on-device and only alerts go upstream. During network outages the pipeline keeps detecting and queues alerts.

TODO: key design decisions and the alternatives you rejected.

## Results

| Measure | Before | After |
|---|---|---|
| Detector mAP50, D-Fire | 0.002 | 0.748 |
| Detector mAP50, lookout-tower smoke | 0.198 | 0.718 |
| VLM source-type agreement (500 held-out crops) | 45.0% | 73.6% |
| VLM calls (266-frame, 6-tower run) | 266 | 11 |
| VLM tokens (same run) | 447K | 3K |
| Video uploaded (same run) | 23 MB | 0 B |

## What I'd do next

TODO
```

**Step 3: Verify the schema accepts it**

Run: `npm run build`
Expected: build succeeds (the collection syncs; no schema errors). To confirm validation is wired, temporarily change `tier: flagship` to `tier: hero`, rebuild, see an `InvalidContentEntryDataError`, then revert.

**Step 4: Commit**

```bash
git add src/content.config.ts src/content/projects/wildfire-edge-sentinel.md
git commit -m "content: add projects collection and Wildfire case study draft"
```

---

### Task 5: Global styles, base layout, favicon

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `public/favicon.svg`

**Step 1: Create `src/styles/global.css`**

```css
:root {
  --bg: #ffffff;
  --surface: #f6f7f9;
  --text: #16181d;
  --muted: #555c69;
  --border: #e2e5ea;
  --accent: #c2410c;
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --measure: 70ch;
  --wide: 1040px;
  --radius: 10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1115;
    --surface: #171a21;
    --text: #e8eaf0;
    --muted: #a0a7b4;
    --border: #2a2f3a;
    --accent: #fb923c;
  }
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 1rem/1.65 var(--font-sans); }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
img { max-width: 100%; height: auto; }

.container { max-width: var(--wide); margin-inline: auto; padding-inline: 16px; }
.section { padding-block: 3rem; border-top: 1px solid var(--border); }
.section > h2 {
  margin: 0 0 1.5rem; font-size: 0.8rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted);
}

.tags { display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; padding: 0; margin: 0; }
.tags li {
  padding: 0.35rem 0.5rem; border: 1px solid var(--border); border-radius: 6px;
  font: 0.75rem/1 var(--font-mono); color: var(--muted);
}

.btn {
  display: inline-block; padding: 0.55rem 1rem; border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); text-decoration: none; font-weight: 500;
}
.btn:hover { border-color: var(--accent); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--bg); }

.prose { max-width: var(--measure); }
.prose h2 { margin-top: 2.5rem; font-size: 1.35rem; }
.prose table { display: block; overflow-x: auto; border-collapse: collapse; font-size: 0.95rem; }
.prose th, .prose td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); text-align: left; }
.prose td { font-variant-numeric: tabular-nums; }
.prose img { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
```

**Step 2: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Step 3: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#c2410c"/>
  <text x="16" y="21.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#fff">SV</text>
</svg>
```

**Step 4: Point the temporary index at the layout**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Savitha Vijayarangan" description="ML/AI Engineer">
  <main class="container"><h1>Layout OK</h1></main>
</BaseLayout>
```

**Step 5: Verify**

Run: `npx astro check && npm run build`
Expected: `0 errors`; build completes. Run `npm run dev`, open http://localhost:4321, confirm Inter renders and the page follows the OS light/dark setting.

**Step 6: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro public/favicon.svg src/pages/index.astro
git commit -m "feat: add base layout, design tokens, and favicon"
```

---

### Task 6: Profile, experience, and skills data

**Files:**
- Create: `src/data/profile.ts`, `src/data/experience.ts`, `src/data/skills.ts`

**Step 1: Create `src/data/profile.ts`**

```ts
export const profile = {
  name: 'Savitha Vijayarangan',
  pitch: 'ML/AI Engineer — edge AI, NLP, and models that ship.',
  location: 'Fremont, CA',
  about: [
    'I build machine-learning systems and the infrastructure that gets them into production. Before my M.S. in Applied Data Intelligence at San José State University, I spent nearly four years at LTI as a software and data engineer, building Python services and Airflow/Snowflake ETL pipelines that moved 1M+ records a day.',
    'Now I focus on deploying models where they are used: wildfire smoke detection that runs offline on edge hardware, sub-100ms semantic search over real-estate listings, and PyTorch models compiled for NPUs.',
    'I am also an Instructional Student Assistant for SJSU’s graduate Deep Learning and Generative AI courses.',
  ],
  links: {
    resume: '/resume.pdf',
    github: 'https://github.com/IamSavitha',
    linkedin: 'TODO: LinkedIn profile URL',
    email: 'savitha.vijayarangan09@gmail.com',
  },
};
```

Verify `https://github.com/IamSavitha` is the correct public GitHub profile before committing; fix it if not.

**Step 2: Create `src/data/experience.ts`**

```ts
export interface Role {
  title: string;
  dates: string;
}

export interface Job {
  company: string;
  location: string;
  roles: Role[];
  bullets: string[];
}

export const experience: Job[] = [
  {
    company: 'IDX Exchange',
    location: 'Remote, US',
    roles: [{ title: 'NLP Engineer Intern', dates: 'Sep 2026 – Present' }],
    bullets: [
      'Built semantic search over 10,000+ listings with sentence-transformer embeddings and FAISS, evaluated against BM25 and served by an 8-endpoint FastAPI service at sub-100ms latency.',
      'Built an entity extractor and a natural-language query parser with parameterized SQL generation, reaching 87% extraction F1 and 92% query-parsing accuracy.',
    ],
  },
  {
    company: 'San José State University',
    location: 'San Jose, CA',
    roles: [
      {
        title: 'Instructional Student Assistant — Deep Learning (DATA 255) & Generative AI (DATA 266)',
        dates: 'Jul 2026 – Present',
      },
    ],
    bullets: [
      'Develop curriculum and mentor 100+ graduate students on model deployment and distributed training.',
      'Automated grading pipelines and submission-management scripts for high-enrollment courses.',
    ],
  },
  {
    company: 'HexasenseAI',
    location: 'Austin, TX (Remote)',
    roles: [{ title: 'ML Engineer Intern', dates: 'Jun 2025 – Aug 2025' }],
    bullets: [
      'Deployed optimized ML pipelines that cut inference latency by 30%.',
      'Built clinical risk-prediction models on healthcare data, applying Responsible AI practices across the ML lifecycle.',
    ],
  },
  {
    company: 'Larsen & Toubro Infotech (LTI)',
    location: 'India',
    roles: [
      { title: 'System Consultant (Data & Analytics Engineer)', dates: 'Jan 2020 – May 2021' },
      { title: 'Software Engineer', dates: 'Sep 2017 – Dec 2019' },
    ],
    bullets: [
      'Built Python/SQL/Airflow ETL pipelines handling 1M+ records/day and integrated 5+ sources into a Snowflake warehouse.',
      'Built Python backend services handling 50K+ transactions/day and shipped 10+ production features via REST APIs.',
    ],
  },
];
```

**Step 3: Create `src/data/skills.ts`** (ordered for the ML/AI positioning)

```ts
export const skills: { group: string; items: string[] }[] = [
  { group: 'ML / DL', items: ['PyTorch', 'Scikit-Learn', 'TensorFlow', 'ONNX'] },
  { group: 'AI / NLP / GenAI', items: ['LLMs', 'RAG', 'Transformers', 'LangChain', 'OpenAI API', 'NLTK', 'Vector databases'] },
  { group: 'Deployment', items: ['FastAPI', 'Docker', 'MLflow', 'ONNX / NPU deployment', 'AWS S3', 'REST APIs'] },
  { group: 'Data engineering', items: ['PySpark', 'Kafka', 'Airflow', 'dbt', 'Snowflake', 'Data warehousing'] },
  { group: 'Languages', items: ['Python', 'SQL'] },
  { group: 'Databases', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'] },
  { group: 'Visualization', items: ['Tableau', 'Streamlit', 'React'] },
];
```

**Step 4: Verify**

Run: `npx astro check`
Expected: `0 errors`.

**Step 5: Commit**

```bash
git add src/data
git commit -m "content: add profile, experience, and skills data"
```

---

### Task 7: Home-page sections (hero, about, experience, skills, footer)

**Files:**
- Create: `src/components/Hero.astro`, `src/components/About.astro`, `src/components/Experience.astro`, `src/components/Skills.astro`, `src/components/Footer.astro`

**Step 1: `src/components/Hero.astro`**

```astro
---
import { profile } from '../data/profile';
const { name, pitch, location, links } = profile;
---

<header class="hero container">
  <p class="location">{location}</p>
  <h1>{name}</h1>
  <p class="pitch">{pitch}</p>
  <nav class="actions" aria-label="Profile links">
    <a class="btn primary" href={links.resume}>Resume</a>
    <a class="btn" href={links.github}>GitHub</a>
    {links.linkedin && <a class="btn" href={links.linkedin}>LinkedIn</a>}
    <a class="btn" href={`mailto:${links.email}`}>Email</a>
  </nav>
</header>

<style>
  .hero { padding-block: 5rem 3rem; }
  .location { margin: 0; font: 0.85rem var(--font-mono); color: var(--muted); }
  h1 { margin: 0.5rem 0; font-size: clamp(2.2rem, 6vw, 3.5rem); line-height: 1.1; letter-spacing: -0.02em; }
  .pitch { max-width: 40ch; margin: 0 0 2rem; font-size: 1.25rem; color: var(--muted); }
  .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
</style>
```

**Step 2: `src/components/About.astro`**

```astro
---
import { profile } from '../data/profile';
---

<section class="section container" id="about">
  <h2>About</h2>
  <div class="prose">
    {profile.about.map((paragraph) => <p>{paragraph}</p>)}
  </div>
</section>
```

**Step 3: `src/components/Experience.astro`**

```astro
---
import { experience } from '../data/experience';
---

<section class="section container" id="experience">
  <h2>Experience</h2>
  <ol class="timeline">
    {experience.map((job) => (
      <li>
        <div class="head">
          <h3>{job.company}</h3>
          <span class="where">{job.location}</span>
        </div>
        {job.roles.map((role) => (
          <p class="role">
            <span>{role.title}</span>
            <span class="dates">{role.dates}</span>
          </p>
        ))}
        <ul>
          {job.bullets.map((bullet) => <li>{bullet}</li>)}
        </ul>
      </li>
    ))}
  </ol>
</section>

<style>
  .timeline { display: grid; gap: 2rem; max-width: var(--measure); margin: 0; padding: 0; list-style: none; }
  .head, .role { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0.25rem 1rem; }
  h3 { margin: 0; font-size: 1.1rem; }
  .where { font-size: 0.9rem; color: var(--muted); }
  .role { margin: 0.25rem 0 0; font-weight: 500; }
  .dates { font: 0.8rem var(--font-mono); color: var(--muted); white-space: nowrap; }
  ul { margin: 0.5rem 0 0; padding-left: 1.1rem; color: var(--muted); }
</style>
```

**Step 4: `src/components/Skills.astro`**

```astro
---
import { skills } from '../data/skills';
---

<section class="section container" id="skills">
  <h2>Skills</h2>
  <dl class="skills">
    {skills.map(({ group, items }) => (
      <div>
        <dt>{group}</dt>
        <dd>{items.join(' · ')}</dd>
      </div>
    ))}
  </dl>
</section>

<style>
  .skills { display: grid; gap: 0.75rem; max-width: var(--measure); margin: 0; }
  .skills div { display: grid; grid-template-columns: 1fr; gap: 0.1rem; }
  dt { font-weight: 600; }
  dd { margin: 0; color: var(--muted); }
  @media (min-width: 640px) {
    .skills div { grid-template-columns: 11rem 1fr; gap: 1rem; }
  }
</style>
```

**Step 5: `src/components/Footer.astro`**

```astro
---
import { profile } from '../data/profile';
const { name, links } = profile;
---

<footer class="section container">
  <p>
    <a href={`mailto:${links.email}`}>{links.email}</a> ·
    <a href={links.github}>GitHub</a>
    {links.linkedin && <> · <a href={links.linkedin}>LinkedIn</a></>}
  </p>
  <p class="copy">© {new Date().getFullYear()} {name}</p>
</footer>

<style>
  footer { font-size: 0.9rem; }
  p { margin: 0 0 0.5rem; }
  .copy { color: var(--muted); }
</style>
```

**Step 6: Verify**

Run: `npx astro check`
Expected: `0 errors`.

**Step 7: Commit**

```bash
git add src/components
git commit -m "feat: add hero, about, experience, skills, and footer sections"
```

---

### Task 8: Project card, project list, and home page

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/ProjectList.astro`
- Modify: `src/pages/index.astro` (full replace)

**Step 1: `src/components/ProjectCard.astro`**

```astro
---
import type { ProjectData } from '../lib/projectSchema';

interface Props {
  id: string;
  data: ProjectData;
}

const { id, data } = Astro.props;
const caseStudy = data.tier === 'flagship' ? `/projects/${id}/` : undefined;
---

<article class="card">
  <h3>{caseStudy ? <a href={caseStudy}>{data.title}</a> : data.title}</h3>
  <p class="summary">{data.summary}</p>
  <p class="metric">{data.metric}</p>
  <ul class="tags">{data.tags.map((tag) => <li>{tag}</li>)}</ul>
  <p class="links">
    {caseStudy && <a href={caseStudy}>Case study →</a>}
    {data.repo && <a href={data.repo}>Code</a>}
    {data.demo && <a href={data.demo}>Demo</a>}
  </p>
</article>

<style>
  .card {
    display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem;
    border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);
  }
  h3 { margin: 0; font-size: 1.1rem; }
  h3 a { color: var(--text); text-decoration: none; }
  h3 a:hover { color: var(--accent); }
  .summary { margin: 0; color: var(--muted); }
  .metric { margin: 0; font: 600 0.9rem/1.4 var(--font-mono); color: var(--accent); }
  .links { display: flex; gap: 1rem; margin: auto 0 0; font-weight: 500; }
  .links:empty { display: none; }
</style>
```

**Step 2: `src/components/ProjectList.astro`**

```astro
---
import type { ProjectEntry } from '../lib/projects';

interface Props {
  projects: ProjectEntry[];
}

const { projects } = Astro.props;
---

<ul class="list">
  {projects.map(({ data }) => (
    <li>
      <h3>{data.repo ? <a href={data.repo}>{data.title}</a> : data.title}</h3>
      <p>{data.summary}</p>
      <ul class="tags">{data.tags.map((tag) => <li>{tag}</li>)}</ul>
    </li>
  ))}
</ul>

<style>
  .list { display: grid; gap: 1.5rem; max-width: var(--measure); margin: 0; padding: 0; list-style: none; }
  h3 { margin: 0; font-size: 1rem; }
  p { margin: 0.25rem 0 0.5rem; color: var(--muted); }
</style>
```

**Step 3: Replace `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import About from '../components/About.astro';
import Experience from '../components/Experience.astro';
import ProjectCard from '../components/ProjectCard.astro';
import ProjectList from '../components/ProjectList.astro';
import Skills from '../components/Skills.astro';
import Footer from '../components/Footer.astro';
import { groupByTier } from '../lib/projects';
import { profile } from '../data/profile';

const { cards, listed } = groupByTier(await getCollection('projects'));
---

<BaseLayout title={`${profile.name} — ML/AI Engineer`} description={profile.pitch}>
  <Hero />
  <main>
    <About />
    <Experience />
    <section class="section container" id="projects">
      <h2>Featured projects</h2>
      <div class="grid">
        {cards.map(({ id, data }) => <ProjectCard id={id} data={data} />)}
      </div>
    </section>
    {listed.length > 0 && (
      <section class="section container" id="more-projects">
        <h2>More projects</h2>
        <ProjectList projects={listed} />
      </section>
    )}
    <Skills />
  </main>
  <Footer />
</BaseLayout>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 1rem; }
</style>
```

**Step 4: Verify**

Run: `npx astro check && npm run build`
Expected: `0 errors`; build succeeds; `dist/index.html` contains `Wildfire Edge Sentinel`.
Run: `grep -c "Wildfire Edge Sentinel" dist/index.html` → `1` or more.

**Step 5: Verify the build-time guard**

Temporarily delete the `metrics:` block from `wildfire-edge-sentinel.md`, run `npm run build`, confirm it fails with `Flagship project "wildfire-edge-sentinel" needs a non-empty metrics list`, then restore the file (`git checkout src/content/projects/wildfire-edge-sentinel.md`).

**Step 6: Commit**

```bash
git add src/components/ProjectCard.astro src/components/ProjectList.astro src/pages/index.astro
git commit -m "feat: assemble home page with project cards and list"
```

---

### Task 9: Case-study pages

**Files:**
- Create: `src/components/MetricStrip.astro`, `src/pages/projects/[slug].astro`

**Step 1: `src/components/MetricStrip.astro`**

```astro
---
import type { Metric } from '../lib/projectSchema';

interface Props {
  metrics: Metric[];
}

const { metrics } = Astro.props;
---

<dl class="metrics">
  {metrics.map(({ label, value }) => (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ))}
</dl>

<style>
  .metrics {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
    gap: 1px; margin: 2rem 0; overflow: hidden;
    border: 1px solid var(--border); border-radius: var(--radius); background: var(--border);
  }
  .metrics div { padding: 1rem; background: var(--surface); }
  dt { font-size: 0.8rem; color: var(--muted); }
  dd { margin: 0.25rem 0 0; font: 600 1.15rem/1.3 var(--font-mono); }
</style>
```

**Step 2: `src/pages/projects/[slug].astro`**

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import MetricStrip from '../../components/MetricStrip.astro';
import Footer from '../../components/Footer.astro';
import { profile } from '../../data/profile';

export async function getStaticPaths() {
  const flagships = await getCollection('projects', (p) => p.data.tier === 'flagship');
  return flagships.map((project) => ({ params: { slug: project.id }, props: { project } }));
}

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;
const { data } = project;
const { Content } = await render(project);
---

<BaseLayout title={`${data.title} — ${profile.name}`} description={data.summary}>
  <main class="container">
    <a class="back" href="/#projects">← All projects</a>
    <header>
      <h1>{data.title}</h1>
      <p class="summary">{data.summary}</p>
      <dl class="facts">
        {data.role && <div><dt>Role</dt><dd>{data.role}</dd></div>}
        {data.timeframe && <div><dt>When</dt><dd>{data.timeframe}</dd></div>}
        <div><dt>Stack</dt><dd>{data.tags.join(' · ')}</dd></div>
      </dl>
      <MetricStrip metrics={data.metrics ?? []} />
    </header>
    <article class="prose">
      <Content />
    </article>
    {(data.repo || data.demo) && (
      <p class="links">
        {data.repo && <a class="btn" href={data.repo}>Code</a>}
        {data.demo && <a class="btn" href={data.demo}>Demo</a>}
      </p>
    )}
  </main>
  <Footer />
</BaseLayout>

<style>
  main { padding-block: 2.5rem 3rem; }
  .back { font-size: 0.9rem; }
  h1 { margin: 1.5rem 0 0.5rem; font-size: clamp(1.9rem, 5vw, 2.75rem); line-height: 1.15; letter-spacing: -0.02em; }
  .summary { max-width: var(--measure); margin: 0 0 1.5rem; font-size: 1.15rem; color: var(--muted); }
  .facts { display: grid; gap: 0.35rem; margin: 0; font-size: 0.9rem; }
  .facts div { display: flex; gap: 0.75rem; }
  .facts dt { min-width: 3.5rem; font-weight: 600; }
  .facts dd { margin: 0; color: var(--muted); }
  .links { display: flex; gap: 0.6rem; margin-top: 2.5rem; }
</style>
```

**Step 3: Verify**

Run: `npx astro check && npm run build`
Expected: `0 errors`; `dist/projects/wildfire-edge-sentinel/index.html` exists.
Run `npm run dev`, open http://localhost:4321/projects/wildfire-edge-sentinel/ and check: metric strip shows 4 tiles, results table scrolls horizontally at 375px width instead of widening the page, "← All projects" returns to the projects section.

**Step 4: Commit**

```bash
git add src/components/MetricStrip.astro src/pages/projects
git commit -m "feat: add case-study page template"
```

---

### Task 10: Remaining project content

**Files:**
- Create: `src/content/projects/gpt-from-scratch.md`, `src/content/projects/videosense.md`, `src/content/projects/kayak-travel-system.md`, `src/content/projects/multimodal-rag.md`, plus one file per listed project (table below)

**Step 1: `src/content/projects/gpt-from-scratch.md`**

```md
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
```

**Step 2: `src/content/projects/videosense.md`**

```md
---
title: "VideoSense: Multimodal Human Activity Recognition"
summary: 3D CNNs, two-stream RGB + optical-flow fusion, and a Siamese few-shot model for recognizing human activities in video.
metric: "TODO: headline top-k accuracy on UCF101"
tags: [PyTorch, 3D CNNs, Optical Flow, Siamese Networks, Grad-CAM]
tier: flagship
order: 4
metrics:
  - { label: "Dataset", value: "UCF101" }
  - { label: "Architectures", value: "C3D, R(2+1)D" }
  - { label: "Streams", value: "RGB + optical flow" }
  - { label: "Top-1 accuracy", value: "TODO" }
---

## Problem

TODO: the activity-recognition problem and why a single RGB model wasn't enough.

## Approach

- Trained C3D and R(2+1)D 3D CNNs on UCF101 to classify human movements.
- Built a two-stream late-fusion model combining RGB features with dense Farneback optical-flow motion features.
- Built a Siamese network trained with contrastive loss for few-shot video similarity on sparse-data classes.
- Used Grad-CAM saliency maps to inspect what the models attend to.

## Results

TODO: top-k accuracy per model and for the fused model; one Grad-CAM figure.

## What I'd do next

TODO
```

**Step 3: `src/content/projects/kayak-travel-system.md`** (featured — card only, no body)

```md
---
title: Kayak Travel Simulation System
summary: 3-tier FastAPI + Kafka microservices for travel booking, with a LangChain chatbot for intent detection.
metric: +25% chatbot response accuracy
tags: [FastAPI, Kafka, LangChain, OpenAI API, MySQL, MongoDB, Redis, React]
tier: featured
order: 5
---
```

**Step 4: `src/content/projects/multimodal-rag.md`** (featured)

```md
---
title: Multimodal RAG for Macroeconomics Documents
summary: Retrieval over text, figures, and tables from a macroeconomics PDF using hybrid cosine-similarity search.
metric: Grounded answers across 15 evaluation questions
tags: [LLMs, RAG, Vector Database, Python]
tier: featured
order: 6
---
```

**Step 5: Confirm the listed projects with Savitha, then create them**

Ask Savitha which of these are complete (have code or results she can link to). Create a file only for confirmed ones. Plan-stage resume entries (Rapid Customer Integration Simulator, RAG Evaluation Framework, Unfamiliar-Domain Dashboard, Cloud-Train Edge-Deploy, Distributed Training & Serving, Multi-Runtime Edge Benchmark, Lakehouse Streaming, MLOps CI/CD, Data Quality Framework) and the in-progress Sign Language Translation project are **not** added.

Each listed file follows this pattern (`tier: listed`, no `metric`, add `repo:` if one exists):

```md
---
title: Amazon Product Recommendation & BI System
summary: PySpark ALS recommendations, Naive Bayes sentiment, and K-Means segmentation behind a FastAPI + Streamlit app.
tags: [PySpark, ALS, MLflow, FastAPI, Streamlit]
tier: listed
order: 1
---
```

| File | title | summary | tags | order |
|---|---|---|---|---|
| `amazon-recsys.md` | Amazon Product Recommendation & BI System | *(as above)* | PySpark, ALS, MLflow, FastAPI, Streamlit | 1 |
| `npu-image-classification.md` | Image Classification with NPU Deployment | Custom CNN for ImageNet classification, converted PyTorch → ONNX → MXQ for real-time NPU inference. | PyTorch, CNN, ONNX, NPU | 2 |
| `super-resolution.md` | Image Super-Resolution on NPU | Custom DNN that reconstructs high-quality images from low-resolution inputs, deployed to NPU via ONNX → MXQ. | PyTorch, ONNX, NPU | 3 |
| `diffusion-lora.md` | Domain-Specific Diffusion Fine-Tuning | SDXL fine-tuned with LoRA/QLoRA, comparing compute, memory, and quality trade-offs via IS and CLIP similarity. | Stable Diffusion, LoRA, QLoRA, CLIP | 4 |
| `multimodal-agents.md` | Multimodal Multi-Agent Image Pipeline | Four agents — vision understanding, prompt engineering, generation, and CLIP-based critique — collaborating on image tasks. | VLMs, LLMs, CLIP, Orchestration | 5 |
| `cyclegan.md` | CycleGAN Style Transfer | CycleGAN from scratch translating between Monet paintings and photos with ResNet generators and PatchGAN discriminators. | PyTorch, GANs, Computer Vision | 6 |
| `imdb-sentiment.md` | IMDB Sentiment: BiLSTM vs CNN-BiLSTM | Two from-scratch sequence models on 50K reviews, 86%+ accuracy; the hybrid reached 0.8872 precision. | PyTorch, BiLSTM, CNN, NLP | 7 |
| `bird-audio.md` | Biodiversity Audio Classification (Kaggle) | Bird-species identification from Pantanal field recordings using mel-spectrograms, EfficientNet, and audio transformers. | PyTorch, Librosa, EfficientNet | 8 |
| `aquashift.md` | AquaShift (Hackathon) | Agents that relocate inference workloads by a Water Stress Index built from hourly wet-bulb temperature data. | Python, Agents, Climate Tech | 9 |
| `twitter-stock-pipeline.md` | Twitter Sentiment & Stock Pipeline | Airflow + Snowflake + dbt pipeline with VADER sentiment and a LinearSVC price-trend model. | Airflow, Snowflake, dbt, NLTK | 10 |
| `brazil-ecommerce.md` | Brazilian E-Commerce Analytics | SQL + Tableau analysis finding 38% revenue concentration in São Paulo and a freight/delivery “double penalty” up north. | SQL, Tableau | 11 |
| `airbnb-booking.md` | Airbnb Booking Platform | MVC booking app with a dependency-enforcing relational schema, Redux state, and Postman test suites. | Python, SQL, Redux | 12 |

**Step 6: Verify**

Run: `npm test && npx astro check && npm run build`
Expected: tests pass, `0 errors`, build succeeds; `dist/projects/` contains `wildfire-edge-sentinel`, `gpt-from-scratch`, `videosense`.

**Step 7: Commit**

```bash
git add src/content/projects
git commit -m "content: add flagship, featured, and listed projects"
```

---

### Task 11: 404 page

**Files:**
- Create: `src/pages/404.astro`

**Step 1: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { profile } from '../data/profile';
---

<BaseLayout title={`Not found — ${profile.name}`} description="Page not found">
  <main class="container">
    <h1>Page not found</h1>
    <p>That page doesn't exist. <a href="/">Back to the home page</a>.</p>
  </main>
</BaseLayout>

<style>
  main { padding-block: 6rem; }
</style>
```

**Step 2: Verify**

Run: `npm run build`
Expected: `dist/404.html` exists (GitHub Pages serves it automatically).

**Step 3: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: add 404 page"
```

---

### Task 12: CI and GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Build and deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Refuse placeholder content
        run: |
          if grep -rn "TODO" src/content src/data; then
            echo "::error::Resolve every TODO above before deploying."
            exit 1
          fi
      - run: npm test
      - run: npx astro check
      - run: npm run build
      - name: Check internal links
        uses: lycheeverse/lychee-action@v2
        with:
          args: --offline --no-progress --root-dir ${{ github.workspace }}/dist dist
          fail: true
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Verify the checks locally**

Run: `grep -rn "TODO" src/content src/data`
Expected (at this point): lists the remaining TODOs — this is the content checklist for Task 13.
Run: `npm test && npx astro check && npm run build`
Expected: all pass.

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build, check, and deploy to GitHub Pages"
```

---

### Task 13: Content completion (Savitha)

Not code — these unblock deploy. Work through them with Savitha:

1. Resolve every item from `grep -rn "TODO" src/content src/data` (LinkedIn URL, roles/timeframes, rejected alternatives, "What I'd do next", VideoSense accuracy, GPT sample outputs, Wildfire diagram).
2. Add `repo:` / `demo:` URLs to project files where public repos exist.
3. Fix the resume PDF (move the Wildfire entry into Projects in the same font; remove the duplicate Technical Skills section), then save the public version as `public/resume.pdf`.
4. Run `npm run build && npx lychee --offline --root-dir "$PWD/dist" dist` (or rely on CI) — expect 0 broken internal links; `/resume.pdf` must resolve.
5. Commit: `git add public/resume.pdf src && git commit -m "content: complete case studies and add resume"`.

---

### Task 14: Create the GitHub repo and deploy

**Requires Savitha's explicit go-ahead** — this publishes the site.

**Step 1: Create and push the repo**

```bash
gh repo create IamSavitha/iamsavitha.github.io --public --source . --remote origin --push
```

**Step 2: Set the Pages source to GitHub Actions**

```bash
gh api -X POST repos/IamSavitha/iamsavitha.github.io/pages -f build_type=workflow
```
Expected: JSON with `"build_type": "workflow"`. (If Pages already exists, use `-X PUT` with the same field.)

**Step 3: Watch the deploy**

```bash
gh run watch --repo IamSavitha/iamsavitha.github.io
```
Expected: `build` and `deploy` jobs succeed; site live at https://iamsavitha.github.io.

---

### Task 15: Launch checks (manual)

1. Chrome DevTools → Lighthouse (mobile) on `/` and `/projects/wildfire-edge-sentinel/`: Performance ≥ 95, Accessibility ≥ 95. Fix any contrast or tap-target issues it reports.
2. DevTools device toolbar at 375px: no horizontal page scroll on any page; results tables scroll inside their box.
3. Toggle OS dark mode: both schemes readable, accent buttons legible.
4. Click every button/link on the home page and each case study.
5. Check the shared-link preview by pasting the URL into a LinkedIn post draft (title + description show).

---

### Task 16 (gated): IDX semantic-search case study

Only after Savitha confirms what IDX Exchange allows her to publish. If allowed, create `src/content/projects/idx-semantic-search.md` as a `flagship` with `order: 2`, using only approved details, and follow the Wildfire template. If not allowed, change `amazon-recsys.md` to `tier: featured`, `order: 2`, and add `metric: "TODO: headline metric"` for Savitha to fill.
