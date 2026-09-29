import { z } from 'astro/zod';

export const metricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

/** One stage of a project's architecture diagram; lengths keep text inside a diagram node. */
export const stageSchema = z.object({
  label: z.string().min(1).max(18),
  detail: z.string().min(1).max(22).optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(140),
  metric: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).min(1),
  repo: z.url().optional(),
  demo: z.url().optional(),
  tier: z.enum(['flagship', 'featured', 'listed']),
  order: z.number().int(),
  role: z.string().min(1).optional(),
  timeframe: z.string().min(1).optional(),
  metrics: z.array(metricSchema).optional(),
  pipeline: z.array(stageSchema).min(3).max(6).optional(),
});

export type Metric = z.infer<typeof metricSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
