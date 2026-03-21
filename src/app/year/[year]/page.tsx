
import { YearView } from '@/components/year/YearView';
import { DECADES } from '@/lib/data';

/**
 * Generates static paths for all Eurovision years (1956-2026) for static export.
 */
export async function generateStaticParams() {
  const allYears = DECADES.flatMap(d => d.years);
  return allYears.map((year) => ({
    year: year.toString(),
  }));
}

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  return <YearView year={year} />;
}
