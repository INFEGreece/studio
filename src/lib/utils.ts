import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps Eurovision country names to their ISO 3166-1 alpha-2 codes for FlagCDN.
 */
export function getFlagUrl(countryName: string): string {
  const mapping: Record<string, string> = {
    "albania": "al", "andorra": "ad", "armenia": "am", "australia": "au", "austria": "at",
    "azerbaijan": "az", "belarus": "by", "belgium": "be", "bosnia and herzegovina": "ba",
    "bulgaria": "bg", "croatia": "hr", "cyprus": "cy", "czechia": "cz", "czech republic": "cz",
    "denmark": "dk", "estonia": "ee", "finland": "fi", "france": "fr", "georgia": "ge",
    "germany": "de", "greece": "gr", "hungary": "hu", "iceland": "is", "ireland": "ie",
    "israel": "il", "italy": "it", "latvia": "lv", "lithuania": "lt", "luxembourg": "lu",
    "malta": "mt", "moldova": "md", "monaco": "mc", "montenegro": "me", "morocco": "ma",
    "netherlands": "nl", "north macedonia": "mk", "norway": "no", "poland": "pl",
    "portugal": "pt", "romania": "ro", "russia": "ru", "san marino": "sm", "serbia": "rs",
    "slovakia": "sk", "slovenia": "si", "spain": "es", "sweden": "se", "switzerland": "ch",
    "turkey": "tr", "ukraine": "ua", "united kingdom": "gb", "uk": "gb"
  };

  const code = mapping[countryName.toLowerCase().trim()];
  if (code) {
    return `https://flagcdn.com/w160/${code}.png`;
  }
  
  // Fallback to a generic globe if not found
  return `https://flagcdn.com/w160/un.png`;
}
