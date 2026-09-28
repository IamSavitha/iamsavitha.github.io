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
