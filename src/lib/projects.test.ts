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
