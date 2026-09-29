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

  it('accepts a pipeline of 3 to 6 stages with optional detail', () => {
    const pipeline = [{ label: 'Frames' }, { label: 'YOLO11', detail: 'every frame' }, { label: 'Alert' }];
    expect(projectSchema.safeParse({ ...listed, pipeline }).success).toBe(true);
  });

  it('rejects a pipeline with fewer than 3 or more than 6 stages', () => {
    const stage = { label: 'Stage' };
    expect(projectSchema.safeParse({ ...listed, pipeline: [stage, stage] }).success).toBe(false);
    expect(projectSchema.safeParse({ ...listed, pipeline: Array(7).fill(stage) }).success).toBe(false);
  });

  it('rejects pipeline text too long to fit a diagram node', () => {
    const longLabel = [{ label: 'x'.repeat(19) }, { label: 'b' }, { label: 'c' }];
    const longDetail = [{ label: 'a', detail: 'x'.repeat(23) }, { label: 'b' }, { label: 'c' }];
    expect(projectSchema.safeParse({ ...listed, pipeline: longLabel }).success).toBe(false);
    expect(projectSchema.safeParse({ ...listed, pipeline: longDetail }).success).toBe(false);
  });
});
