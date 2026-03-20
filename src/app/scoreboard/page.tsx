
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Entry, Vote } from '@/lib/types';
import { DECADES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Trophy, TrendingUp, Users, Loader2, ListOrdered, Calendar } from 'lucide-react';
import { getFlagUrl, cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * ScoreboardContent handles the actual logic of aggregating votes for a specific year.
 */
function ScoreboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [mounted, setMounted] = useState(false);

  // Sync year from URL on mount and param change
  useEffect(() => {
    setMounted(true);
    const urlYear = searchParams?.get('year');
    if (urlYear) {
      const parsed = parseInt(urlYear);
      if (!isNaN(parsed)) {
        setSelectedYear(parsed);
      }
    }
  }, [searchParams]);

  const updateYear = (year: number) => {
    setSelectedYear(year);
    router.push(`/scoreboard/?year=${year}`, { scroll: false });
  };

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  // Fetch entries for the selected year
  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: entries, isLoading: isEntriesLoading } = useCollection<Entry>(entriesQuery);

  // Fetch ALL votes for the selected year across all users using Collection Group
  const votesQuery = useMemoFirebase(() => {
    return query(collectionGroup(db, 'votes'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: allVotes, isLoading: isVotesLoading } = useCollection<Vote>(votesQuery);

  /**
   * Aggregates points while ensuring absolute isolation per year.
   */
  const scoreboardData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    const validEntryIds = new Set(entries.map(e => e.id));
    const aggregation: Record<string, { totalPoints: number; voteCount: number }> = {};
    
    const safeVotes = (allVotes || []).filter(v => v && typeof v === 'object' && v.eurovisionEntryId);

    safeVotes.forEach(vote => {
      const entryId = vote.eurovisionEntryId;
      // Double validation: Check both entry ownership and year match
      if (validEntryIds.has(entryId) && vote.year === selectedYear) {
        if (!aggregation[entryId]) {
          aggregation[entryId] = { totalPoints: 0, voteCount: 0 };
        }
        const pts = Number(vote.points) || 0;
        aggregation[entryId].totalPoints += pts;
        aggregation[entryId].voteCount += 1;
      }
    });

    return entries
      .map(e => ({
        id: e.id,
        name: e.country,
        score: aggregation[e.id]?.totalPoints || 0,
        votes: aggregation[e.id]?.voteCount || 0,
        artist: e.artist,
        title: e.songTitle,
        flagUrl: e.flagUrl || getFlagUrl(e.country)
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [entries, allVotes, selectedYear]);

  const top3 = scoreboardData.slice(0, 3);
  const isLoading = isEntriesLoading || isVotesLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container px-4 py-8 md:py-12">
        <header className="mb-12 space-y-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg shrink-0">
              <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight">Eurovision Scoreboard {selectedYear}</h1>
              <p className="text-sm md:text-base text-muted-foreground">Ζωντανή κατάταξη κοινότητας για το {selectedYear}</p>
            </div>
          </div>

          <div className="bg-card border rounded-[2rem] p-6 md:p-8 space-y-8 shadow-sm">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Δεκαετίες
              </span>
              <div className="flex flex-wrap gap-2">
                {DECADES.map(d => (
                  <Button
                    key={d.label}
                    variant={currentDecadeLabel === d.label ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                      "rounded-full px-5 h-9 font-bold transition-all",
                      currentDecadeLabel === d.label ? "bg-primary text-primary-foreground shadow-lg" : ""
                    )}
                    onClick={() => updateYear(d.years[0])}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent ml-2">Έτος</span>
              <div className="flex flex-wrap gap-2">
                {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                  <Button
                    key={y}
                    variant={selectedYear === y ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-full px-4 h-9 font-bold transition-all min-w-[56px]",
                      selectedYear === y 
                        ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20" 
                        : "border-accent/30 text-accent hover:bg-accent/10"
                    )}
                    onClick={() => updateYear(y)}
                  >
                    {y}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium text-sm md:text-base">Υπολογισμός αποτελεσμάτων για το {selectedYear}...</p>
          </div>
        ) : scoreboardData.length === 0 ? (
          <div className="text-center py-20 md:py-32 bg-muted/20 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed">
            <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg md:text-xl font-headline font-bold text-muted-foreground">Δεν υπάρχουν δεδομένα για το {selectedYear}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Μόλις ξεκινήσει η ψηφοφορία, τα αποτελέσματα θα εμφανιστούν εδώ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-headline font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Hall of Fame
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {top3.map((item, idx) => (
                    <div key={item.id} className="relative bg-card border rounded-2xl p-4 md:p-6 group hover:border-primary/50 transition-all shadow-sm">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shrink-0 ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' : 
                          idx === 1 ? 'bg-slate-400/20 text-slate-500 border border-slate-400/30' : 
                          'bg-amber-600/20 text-amber-700 border border-amber-600/30'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/country/${encodeURIComponent(item.name)}/`} className="flex items-center gap-2 group/link">
                            <img src={item.flagUrl} alt="" className="h-3 w-5 md:h-4 md:w-6 object-cover rounded shadow-sm shrink-0" />
                            <h3 className="font-bold text-base md:text-lg truncate group-hover/link:text-primary transition-colors underline-offset-4 group-hover/link:underline">{item.name}</h3>
                          </Link>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{item.artist} — {item.title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xl md:text-2xl font-extrabold text-primary">{item.score}</span>
                          <p className="text-[8px] md:text-[10px] uppercase font-bold text-muted-foreground">Pts</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-4 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-xl font-headline font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top 10 Chart
                </h2>
                <div className="h-[250px] md:h-[300px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreboardData.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80} 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10} 
                          tick={{ fontWeight: 'bold' }}
                        />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border p-3 rounded-xl shadow-xl">
                                  <p className="font-bold text-primary text-xs md:text-sm">{data.name}</p>
                                  <p className="text-[10px] font-bold">{data.score} Πόντοι</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {scoreboardData.slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 border-b bg-muted/10">
                  <h2 className="text-lg md:text-xl font-headline font-bold flex items-center gap-2">
                    <ListOrdered className="h-5 w-5 text-primary" />
                    Πλήρης Κατάταξη
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[80px]">Θέση</TableHead>
                        <TableHead>Συμμετοχή</TableHead>
                        <TableHead>Πόντοι</TableHead>
                        <TableHead className="text-right">Ψήφοι</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scoreboardData.map((item, idx) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-bold">
                            {idx + 1 === 1 ? <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 px-1 md:px-2">1ος</Badge> : 
                             idx + 1 === 2 ? <Badge className="bg-slate-400/20 text-slate-500 border-slate-400/30 px-1 md:px-2">2ος</Badge> :
                             idx + 1 === 3 ? <Badge className="bg-amber-600/20 text-amber-700 border-amber-600/30 px-1 md:px-2">3ος</Badge> : 
                             `#${idx + 1}`}
                          </TableCell>
                          <TableCell>
                            <Link href={`/country/${encodeURIComponent(item.name)}/`} className="flex items-center gap-2 md:gap-3 group">
                              <img src={item.flagUrl} alt="" className="h-3 w-5 md:h-4 md:w-6 object-cover rounded-sm flex-shrink-0" />
                              <div className="flex flex-col min-w-0 max-w-[120px] sm:max-w-none">
                                <span className="font-bold text-foreground truncate text-xs md:text-sm group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">{item.name}</span>
                                <span className="text-[9px] md:text-[10px] text-muted-foreground truncate">{item.artist}</span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="font-bold text-primary text-xs md:text-sm">{item.score}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs md:text-sm">{item.votes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ScoreboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ScoreboardContent />
    </Suspense>
  );
}
