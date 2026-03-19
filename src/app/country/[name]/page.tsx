
import { CountryHistoryView } from '@/components/country/CountryHistoryView';

// Static params for Eurovision countries to satisfy 'output: export' build requirement
export async function generateStaticParams() {
  const countries = [
    "Albania", "Andorra", "Armenia", "Australia", "Austria", "Azerbaijan", "Belarus", "Belgium", 
    "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", 
    "Finland", "France", "Georgia", "Germany", "Greece", "Hungary", "Iceland", "Ireland", 
    "Israel", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", 
    "Montenegro", "Morocco", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", 
    "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", 
    "Switzerland", "Turkey", "Ukraine", "United Kingdom"
  ];
  return countries.map((name) => ({ name: encodeURIComponent(name) }));
}

export default async function CountryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <CountryHistoryView name={name} />;
}
