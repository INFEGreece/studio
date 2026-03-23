import { CountryHistoryView } from '@/components/country/CountryHistoryView';

/**
 * List of all countries that have participated in Eurovision (1956-today)
 * updated with active, inactive, ineligible, and former lists.
 * We return raw names as Next.js handles encoding of segments.
 */
export async function generateStaticParams() {
  const countries = [
    // Active
    "Albania", "Armenia", "Australia", "Austria", "Azerbaijan", "Belgium", "Bulgaria", 
    "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", 
    "Georgia", "Germany", "Greece", "Israel", "Italy", "Latvia", "Lithuania", 
    "Luxembourg", "Malta", "Moldova", "Montenegro", "Norway", "Poland", "Portugal", 
    "Romania", "San Marino", "Serbia", "Sweden", "Switzerland", "Ukraine", "United Kingdom",
    // Inactive
    "Andorra", "Bosnia and Herzegovina", "Hungary", "Iceland", "Ireland", "Monaco", 
    "Morocco", "Netherlands", "North Macedonia", "Slovakia", "Slovenia", "Spain", "Turkey",
    // Ineligible
    "Belarus", "Russia",
    // Former
    "Serbia and Montenegro", "Yugoslavia"
  ];
  return countries.map((name) => ({ name }));
}

export default async function CountryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // name is already decoded by Next.js from the URL segment
  return <CountryHistoryView name={name} />;
}
