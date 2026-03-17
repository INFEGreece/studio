
import { Entry } from './types';

// Helper to generate years for a decade
const generateYears = (start: number, end: number) => {
  const years = [];
  for (let y = end; y >= start; y--) {
    years.push(y);
  }
  return years;
};

export const DECADES = [
  { label: '2020s', years: generateYears(2020, 2026) },
  { label: '2010s', years: generateYears(2010, 2019) },
  { label: '2000s', years: generateYears(2000, 2009) },
  { label: '1990s', years: generateYears(1990, 1999) },
  { label: '1980s', years: generateYears(1980, 1989) },
  { label: '1970s', years: generateYears(1970, 1979) },
  { label: '1960s', years: generateYears(1960, 1969) },
  { label: '1950s', years: generateYears(1956, 1959) },
];

export const MOCK_ENTRIES: Entry[] = [
  {
    id: '2024-che',
    country: 'Switzerland',
    artist: 'Nemo',
    songTitle: 'The Code',
    year: 2024,
    stage: 'Final',
    videoUrl: 'https://www.youtube.com/embed/kiGDvM14Kwg',
  }
];
