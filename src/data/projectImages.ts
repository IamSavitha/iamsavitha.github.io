import type { ImageMetadata } from 'astro';
import wildfireOutage from '../assets/projects/wildfire-edge-sentinel/edge-vs-cloud-outage.png';

/** Real screenshots shown on project cards, keyed by project id. Projects without one render text-only. */
export const projectImages: Record<string, { src: ImageMetadata; alt: string }> = {
  'wildfire-edge-sentinel': {
    src: wildfireOutage,
    alt: 'Sentinel console during a network outage: the edge pipeline decides on the device and queues the alert, while cloud-only stops at the network boundary',
  },
};
