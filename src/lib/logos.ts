/**
 * @fileOverview Utilities for resolving event logos based on year and stage.
 */

import { ContestStage } from './types';

/**
 * Returns the path to the event logo based on year and stage.
 * Per user request:
 * - Eurovision (ESC): /assets/logos/YYYY.jpg
 * - Eurodromio: /assets/logos/EDYY.png
 * - Be.So.: /assets/logos/BEYY.png
 * - Mu.Si.Ka.: /assets/logos/MUYY.png
 */
export function getEventLogo(year: number, stage: ContestStage): string {
  const yearStr = year.toString();
  const suffix = yearStr.slice(-2);

  // Other events use .png as requested
  if (stage === 'Eurodromio') return `/assets/logos/ED${suffix}.png`;
  if (stage === 'Be.So.') return `/assets/logos/BE${suffix}.png`;
  if (stage === 'Mu.Si.Ka.') return `/assets/logos/MU${suffix}.png`;
  
  // Eurovision (Final, Semis, Prequalification) use .jpg as requested
  // Note: Ensure your files on the server are named exactly like this (e.g. 2024.jpg)
  return `/assets/logos/${yearStr}.jpg`;
}
