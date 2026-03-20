import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps Eurovision country names to their ISO 3166-1 alpha-2 codes for FlagCDN.
 * Includes historical and modern participants.
 */
export function getFlagUrl(countryName: string): string {
  const name = countryName.toLowerCase().trim();
  
  // Custom flag for Yugoslavia
  if (name === "yugoslavia") {
    return "https://infegreece.com/wp-content/uploads/2025/08/Yugoslavia.png";
  }

  const mapping: Record<string, string> = {
    "albania": "al", "armenia": "am", "australia": "au", "austria": "at", "azerbaijan": "az",
    "belgium": "be", "bulgaria": "bg", "croatia": "hr", "cyprus": "cy", "czechia": "cz",
    "denmark": "dk", "estonia": "ee", "finland": "fi", "france": "fr", "georgia": "ge",
    "germany": "de", "greece": "gr", "israel": "il", "italy": "it", "latvia": "lv",
    "lithuania": "lt", "luxembourg": "lu", "malta": "mt", "moldova": "md", "montenegro": "me",
    "norway": "no", "poland": "pl", "portugal": "pt", "romania": "ro", "san marino": "sm",
    "serbia": "rs", "sweden": "se", "switzerland": "ch", "ukraine": "ua", "united kingdom": "gb",
    "andorra": "ad", "bosnia and herzegovina": "ba", "hungary": "hu", "iceland": "is",
    "ireland": "ie", "monaco": "mc", "morocco": "ma", "netherlands": "nl", "north macedonia": "mk",
    "slovakia": "sk", "slovenia": "si", "spain": "es", "turkey": "tr", "belarus": "by",
    "russia": "ru", "serbia and montenegro": "cs"
  };

  const code = mapping[name];
  if (code) {
    return `https://flagcdn.com/w160/${code}.png`;
  }
  
  return `https://flagcdn.com/w160/un.png`;
}
