/**
 * @fileOverview Utilities for resolving event logos based on year and stage.
 */

import { ContestStage } from './types';

/**
 * Returns the path to the event logo based on year and stage.
 * Naming convention:
 * - Eurovision: /assets/logos/YYYY.png
 * - Eurodromio: /assets/logos/EDYY.png
 * - Be.So.: /assets/logos/BEYY.png
 * - Mu.Si.Ka.: /assets/logos/MUYY.png
 */
export function getEventLogo(year: number, stage: ContestStage): string {
  const yearStr = year.toString();
  const suffix = yearStr.slice(-2);

  if (stage === 'Eurodromio') return `/assets/logos/ED${suffix}.png`;
  if (stage === 'Be.So.') return `/assets/logos/BE${suffix}.png`;
  if (stage === 'Mu.Si.Ka.') return `/assets/logos/MU${suffix}.png`;
  
  // Default to Eurovision logo for Final/Semis/Prequalification
  return `/assets/logos/${yearStr}.png`;
}
