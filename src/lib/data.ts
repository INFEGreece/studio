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

/**
 * Provides metadata and descriptions for Eurovision years.
 */
export const YEAR_INFO: Record<number, string> = {
  2026: "Ο διαγωνισμός του 2026 αναμένεται να είναι ένας από τους πιο εντυπωσιακούς στην ιστορία του θεσμού, γιορτάζοντας τη μουσική ενότητα στην Ευρώπη.",
  2025: "Η Eurovision 2025 στη Βασιλεία της Ελβετίας φέρνει τη λάμψη και την καινοτομία σε μια από τις πιο παραδοσιακές πόλεις της Ευρώπης.",
  2024: "Το Μάλμε φιλοξένησε έναν διαγωνισμό γεμάτο ανατροπές, με το Nemo από την Ελβετία να κερδίζει τις εντυπώσεις με το 'The Code'.",
  2023: "Το Λίβερπουλ διοργάνωσε έναν μοναδικό διαγωνισμό εκ μέρους της Ουκρανίας, με τη Loreen να γράφει ιστορία κερδίζοντας για δεύτερη φορά.",
  2022: "Το Τορίνο υποδέχτηκε την Ευρώπη με ένα μήνυμα ειρήνης, σε μια χρονιά που σημαδεύτηκε από τη μεγάλη νίκη της Ουκρανίας.",
  2021: "Μετά από ένα χρόνο παύσης, το Ρότερνταμ έφερε ξανά τη μουσική στις ζωές μας με τους Måneskin να στέφονται νικητές.",
  2020: "Παρόλο που ο διαγωνισμός ακυρώθηκε λόγω της πανδημίας, οι συμμετοχές του 2020 παραμένουν αγαπημένες στην καρδιά των fans.",
  2005: "Η χρονιά της Ελλάδας! Η Έλενα Παπαρίζου χάρισε στη χώρα μας την πρώτη της νίκη με το θρυλικό 'My Number One'.",
};

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
