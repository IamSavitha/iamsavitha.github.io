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
  repo: z.url().optional(),
  demo: z.url().optional(),
  tier: z.enum(['flagship', 'featured', 'listed']),
  order: z.number().int(),
  role: z.string().min(1).optional(),
  timeframe: z.string().min(1).optional(),
  metrics: z.array(metricSchema).optional(),
});

export type Metric = z.infer<typeof metricSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
