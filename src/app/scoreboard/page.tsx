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
import { Trophy, TrendingUp, Users, Loader2, ListOrdered, Calendar, AlertCircle, Info } from 'lucide-react';
import { getFlagUrl, cn } from '@/lib/utils';
import { getEventLogo } from '@/lib/logos';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

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

  useEffect(() => {
    // Reset logo error state when year changes to try loading new logo
    setLogoError(false);
  }, [selectedYear]);

  const updateYear = (year: number) => {
    setSelectedYear(year);
    router.push(`/scoreboard/?year=${year}`, { scroll: false });
  };

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: entries, isLoading: isEntriesLoading, error: entriesError } = useCollection<Entry>(entriesQuery);

  const votesQuery = useMemoFirebase(() => {
    return query(collectionGroup(db, 'votes'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: allVotes, isLoading: isVotesLoading, error: votesError } = useCollection<Vote>(votesQuery);

  const scoreboardData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    const validEntryIds = new Set(entries.map(e => e.id));
    const aggregation: Record<string, { totalPoints: number; voteCount: number }> = {};
    
    (allVotes || []).forEach(vote => {
      if (vote && vote.eurovisionEntryId && Number(vote.year) === selectedYear) {
        if (validEntryIds.has(vote.eurovisionEntryId)) {
          if (!aggregation[vote.eurovisionEntryId]) {
            aggregation[vote.eurovisionEntryId] = { totalPoints: 0, voteCount: 0 };
          }
          const pts = Number(vote.points) || 0;
          aggregation[vote.eurovisionEntryId].totalPoints += pts;
          aggregation[vote.eurovisionEntryId].voteCount += 1;
        }
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
        flagUrl: e.flagUrl || getFlagUrl(e.country),
        stage: e.stage
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [entries, allVotes, selectedYear]);

  const top3 = scoreboardData.slice(0, 3);
  const isLoading = isEntriesLoading || isVotesLoading;
  const eventLogo = getEventLogo(selectedYear, 'Final');

  if (votesError || entriesError) {
    const isPermissionError = votesError?.message?.includes('permissions') || entriesError?.message?.includes('permissions');
    
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="bg-destructive/10 p-6 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-headline font-bold mb-4">
            Πρόβλημα Φόρτωσης Δεδομένων
          </h2>
          <div className="text-muted-foreground max-w-md mb-8 space-y-4">
            <p>Δεν μπορέσαμε να ανακτήσουμε τα αποτελέσματα για το {selectedYear}.</p>
            {isPermissionError && (
              <div className="bg-card border p-6 rounded-[2rem] text-left space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Info className="h-5 w-5" /> Οδηγίες για τον Διαχειριστή:
                </div>
                <p className="text-xs leading-relaxed">
                  Αυτό το σφάλμα οφείλεται συνήθως σε έλλειψη Index στο Firebase για τα Collection Groups.
                </p>
                <ol className="text-[10px] space-y-2 list-decimal pl-4">
                  <li>Μεταβείτε στο Firebase Console &rarr; Firestore &rarr; Indexes.</li>
                  <li>Επιλέξτε την καρτέλα <strong>Single Field</strong>.</li>
                  <li>Πατήστε <strong>Add exemption</strong>.</li>
                  <li>Collection ID: <code>votes</code> | Field: <code>year</code>.</li>
                  <li>Query scope: <strong>Collection Group</strong> (Enable Asc/Desc).</li>
                </ol>
              </div>
            )}
          </div>
          <Button onClick={() => window.location.reload()} className="h-12 rounded-xl px-8 bg-primary font-bold">Δοκιμάστε Ξανά</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container px-4 py-8 md:py-12">
        <header className="mb-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              {!logoError && (
                <div className="h-16 w-24 md:h-20 md:w-32 relative shrink-0">
                  <img 
                    src={eventLogo} 
                    alt="Event Logo" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                    onError={() => setLogoError(true)}
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-5xl font-headline font-extrabold tracking-tight">
                  Scoreboard {selectedYear}
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground font-medium">Ζωντανή κατάταξη κοινότητας INFE Greece</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 px-6 py-4 rounded-[1.5rem] shadow-inner">
               <div className="bg-primary/20 p-2.5 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Συνολικοί Πόντοι</p>
                  <p className="text-2xl font-black text-primary">
                    {scoreboardData.reduce((sum, item) => sum + item.score, 0)}
                  </p>
               </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border rounded-[2rem] p-6 md:p-8 space-y-8 shadow-sm">
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
                      currentDecadeLabel === d.label ? "bg-primary text-primary-foreground shadow-lg scale-105" : "hover:bg-primary/10 hover:text-primary"
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
                        ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-105" 
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
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <p className="text-muted-foreground font-bold text-lg animate-pulse">Υπολογισμός αποτελεσμάτων...</p>
          </div>
        ) : scoreboardData.length === 0 ? (
          <div className="text-center py-20 md:py-32 bg-muted/20 rounded-[2rem] border-4 border-dashed">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
            <p className="text-2xl font-headline font-bold text-muted-foreground">Δεν υπάρχουν δεδομένα για το {selectedYear}</p>
            <p className="text-sm text-muted-foreground mt-2">Μόλις ξεκινήσει η ψηφοφορία, τα αποτελέσματα θα εμφανιστούν εδώ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-14 items-start">
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Hall of Fame {selectedYear}
                </h2>
                <div className="grid grid-cols-1 gap-5">
                  {top3.map((item, idx) => (
                    <div key={item.id} className="relative bg-card/60 border-2 rounded-[1.5rem] p-5 md:p-7 group hover:border-primary/50 transition-all shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={`h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center font-black text-xl shrink-0 shadow-2xl ${
                          idx === 0 ? 'bg-yellow-500 text-white' : 
                          idx === 1 ? 'bg-slate-400 text-white' : 
                          'bg-amber-600 text-white'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/country/${encodeURIComponent(item.name)}/`} className="flex items-center gap-3 group/link">
                            <img src={item.flagUrl} alt="" className="h-4 w-7 md:h-5 md:w-8 object-cover rounded shadow-lg shrink-0" />
                            <h3 className="font-extrabold text-lg md:text-xl truncate group-hover/link:text-primary transition-colors underline-offset-4 group-hover/link:underline">{item.name}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground truncate font-medium mt-1">{item.artist} — {item.title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xl md:text-3xl font-black text-primary">{item.score}</span>
                          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border-2 rounded-[2rem] p-6 md:p-8 shadow-xl">
                <h2 className="text-xl md:text-2xl font-headline font-bold mb-8 flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Top 10 Chart
                </h2>
                <div className="h-[300px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreboardData.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border)/0.5)" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90} 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11} 
                          tick={{ fontWeight: 'bold' }}
                        />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border-2 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                  <p className="font-black text-primary text-sm mb-1">{data.name}</p>
                                  <p className="text-xs font-bold">{data.score} Πόντοι</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">{data.votes} Ψήφοι</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                          {scoreboardData.slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-card border-2 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-6 md:p-8 border-b bg-muted/20 flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3">
                    <ListOrdered className="h-6 w-6 text-primary" />
                    Πλήρης Κατάταξη
                  </h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-3">{scoreboardData.length} Χώρες</Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[100px] font-bold py-6">Θέση</TableHead>
                        <TableHead className="font-bold py-6">Συμμετοχή</TableHead>
                        <TableHead className="font-bold py-6">Πόντοι</TableHead>
                        <TableHead className="text-right font-bold py-6">Ψήφοι</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scoreboardData.map((item, idx) => (
                        <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-b-muted/50">
                          <TableCell className="py-5">
                            {idx + 1 === 1 ? <Badge className="bg-yellow-500 text-white border-none px-3 font-black">1ος</Badge> : 
                             idx + 1 === 2 ? <Badge className="bg-slate-400 text-white border-none px-3 font-black">2ος</Badge> :
                             idx + 1 === 3 ? <Badge className="bg-amber-600 text-white border-none px-3 font-black">3ος</Badge> : 
                             <span className="font-bold text-muted-foreground ml-3">#{idx + 1}</span>}
                          </TableCell>
                          <TableCell className="py-5">
                            <Link href={`/country/${encodeURIComponent(item.name)}/`} className="flex items-center gap-4 group">
                              <img src={item.flagUrl} alt="" className="h-5 w-8 md:h-6 md:w-10 object-cover rounded shadow-md flex-shrink-0 transition-transform group-hover:scale-110" />
                              <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-none">
                                <span className="font-extrabold text-foreground truncate text-sm md:text-base group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">{item.name}</span>
                                <span className="text-[10px] md:text-xs text-muted-foreground truncate font-medium">{item.artist}</span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="py-5">
                            <span className="text-lg font-black text-primary">{item.score}</span>
                          </TableCell>
                          <TableCell className="text-right py-5">
                            <span className="text-sm font-bold text-muted-foreground">{item.votes}</span>
                          </TableCell>
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
