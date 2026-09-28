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
