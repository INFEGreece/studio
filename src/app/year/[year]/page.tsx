
import { YearView } from '@/components/year/YearView';
import { DECADES } from '@/lib/data';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <YearView year={year} />
    </Suspense>
  );
}
