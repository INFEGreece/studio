
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, collectionGroup, doc } from 'firebase/firestore';
import { Entry, Vote, YearMetadata } from '@/lib/types';
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
import { Trophy, TrendingUp, Users, Loader2, ListOrdered, Calendar, AlertCircle, Info, Layers, EyeOff, Lock } from 'lucide-react';
import { getFlagUrl, cn } from '@/lib/utils';
import { getEventLogo } from '@/lib/logos';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const urlYear = searchParams?.get('year');
    const urlStage = searchParams?.get('stage');
    
    if (urlYear) {
      const parsed = parseInt(urlYear);
      if (!isNaN(parsed)) {
        setSelectedYear(parsed);
      }
    }
    
    if (urlStage) {
      setSelectedStage(urlStage);
    }
  }, [searchParams]);

  useEffect(() => {
    setLogoError(false);
  }, [selectedYear]);

  const updateYear = (year: number) => {
    setSelectedYear(year);
    router.push(`/scoreboard/?year=${year}&stage=${selectedStage}`, { scroll: false });
  };

  const updateStage = (stage: string) => {
    setSelectedStage(stage);
    router.push(`/scoreboard/?year=${selectedYear}&stage=${stage}`, { scroll: false });
  };

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  // Admin Check
  const adminDocRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminData } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  // Metadata check for visibility
  const yearMetaRef = useMemoFirebase(() => doc(db, 'year_metadata', selectedYear.toString()), [db, selectedYear]);
  const { data: yearMeta, isLoading: isMetaLoading } = useDoc<YearMetadata>(yearMetaRef);

  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: entries, isLoading: isEntriesLoading, error: entriesError } = useCollection<Entry>(entriesQuery);

  const votesQuery = useMemoFirebase(() => {
    return query(collectionGroup(db, 'votes'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: allVotes, isLoading: isVotesLoading, error: votesError } = useCollection<Vote>(votesQuery);

  const populatedStages = useMemo(() => {
    const stages = new Set<string>();
    if (entries) {
      entries.forEach(e => stages.add(e.stage));
    }
    return Array.from(stages).sort();
  }, [entries]);

  const scoreboardData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    let filteredEntries: Entry[] = [];
    if (selectedStage === "All") {
      const escStages = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification'];
      filteredEntries = entries.filter(e => escStages.includes(e.stage));
    } else {
      filteredEntries = entries.filter(e => e.stage === selectedStage);
    }
    
    const validEntryIds = new Set(filteredEntries.map(e => e.id));
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

    return filteredEntries
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
  }, [entries, allVotes, selectedYear, selectedStage]);

  const top3 = scoreboardData.slice(0, 3);
  const isLoading = isEntriesLoading || isVotesLoading || isMetaLoading;
  const eventLogo = yearMeta?.logoUrl || getEventLogo(selectedYear, 'Final');

  // Check if results should be hidden
  const isHiddenForUser = yearMeta && yearMeta.isScoreboardVisible === false && !isAdmin;

  if (votesError || entriesError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="bg-destructive/10 p-6 rounded-full mb-6"><AlertCircle className="h-12 w-12 text-destructive" /></div>
          <h2 className="text-2xl font-headline font-bold mb-4">Πρόβλημα Φόρτωσης Δεδομένων</h2>
          <Button onClick={() => window.location.reload()} className="h-12 rounded-xl px-8 font-bold">Δοκιμάστε Ξανά</Button>
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
                  <img src={eventLogo} alt="Event Logo" className="w-full h-full object-contain drop-shadow-2xl" onError={() => setLogoError(true)} />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-5xl font-headline font-extrabold tracking-tight">Scoreboard {selectedYear}</h1>
                <p className="text-sm md:text-lg text-muted-foreground font-medium">Ζωντανή κατάταξη κοινότητας INFE Greece</p>
              </div>
            </div>

            {isAdmin && yearMeta?.isScoreboardVisible === false && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold">
                <Lock className="h-4 w-4" /> Λειτουργία Διαχειριστή: Τα αποτελέσματα είναι κρυφά για τους χρήστες.
              </div>
            )}
          </div>

          <div className="bg-card/50 backdrop-blur-sm border rounded-[2rem] p-6 md:p-8 space-y-8 shadow-sm">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 flex items-center gap-2"><Calendar className="h-3 w-3" /> Δεκαετίες</span>
              <div className="flex flex-wrap gap-2">
                {DECADES.map(d => (
                  <Button key={d.label} variant={currentDecadeLabel === d.label ? "default" : "secondary"} size="sm" className={cn("rounded-full px-5 h-9 font-bold transition-all", currentDecadeLabel === d.label && "bg-primary shadow-lg")} onClick={() => updateYear(d.years[0])}>{d.label}</Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent ml-2">Έτος</span>
              <div className="flex flex-wrap gap-2">
                {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                  <Button key={y} variant={selectedYear === y ? "default" : "outline"} size="sm" className={cn("rounded-full px-4 h-9 font-bold transition-all min-w-[56px]", selectedYear === y && "bg-accent border-accent shadow-lg shadow-accent/20")} onClick={() => updateYear(y)}>{y}</Button>
                ))}
              </div>
            </div>

            {populatedStages.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary ml-2 flex items-center gap-2"><Layers className="h-3 w-3" /> Φίλτρο Φάσης</span>
                <Tabs value={selectedStage} onValueChange={updateStage} className="w-full">
                  <TabsList className="flex flex-wrap h-auto bg-muted/30 p-1.5 rounded-xl gap-1.5">
                    <TabsTrigger value="All" className="h-9 px-4 rounded-lg text-xs font-bold">Όλα (ESC)</TabsTrigger>
                    {populatedStages.map(stage => (
                      <TabsTrigger key={stage} value={stage} className="h-9 px-4 rounded-lg text-xs font-bold">{stage}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24"><Loader2 className="h-16 w-16 animate-spin text-primary mb-6" /><p className="text-muted-foreground font-bold text-lg animate-pulse">Υπολογισμός...</p></div>
        ) : isHiddenForUser ? (
          <div className="text-center py-32 bg-card/40 border-4 border-dashed rounded-[3rem] space-y-8">
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <EyeOff className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-4 max-w-lg mx-auto px-4">
               <h2 className="text-3xl font-headline font-bold">Αποτελέσματα Υπό Επεξεργασία</h2>
               <p className="text-muted-foreground leading-relaxed">
                 Το Scoreboard για το {selectedYear} είναι προσωρινά κρυφό. Η κατάταξη θα ανακοινωθεί σύντομα μετά την ολοκλήρωση της διαδικασίας.
               </p>
               <Button asChild variant="outline" className="rounded-xl h-12 mt-4">
                 <Link href={`/?year=${selectedYear}`}>Επιστροφή στην Ψηφοφορία</Link>
               </Button>
            </div>
          </div>
        ) : scoreboardData.length === 0 ? (
          <div className="text-center py-24 bg-muted/20 rounded-[2rem] border-4 border-dashed">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
            <p className="text-2xl font-headline font-bold text-muted-foreground">Δεν υπάρχουν δεδομένα για το {selectedYear}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-14 items-start">
            {/* Top 3 & Chart Section */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3"><Trophy className="h-6 w-6 text-yellow-500" /> Hall of Fame {selectedYear}</h2>
                <div className="grid grid-cols-1 gap-5">
                  {top3.map((item, idx) => (
                    <div key={item.id} className="relative bg-card/60 border-2 rounded-[1.5rem] p-5 md:p-7 group hover:border-primary/50 transition-all shadow-xl">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : 'bg-amber-600 text-white'}`}>{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/country/${encodeURIComponent(item.name)}/`} className="flex items-center gap-3 group/link">
                            <img src={item.flagUrl} alt="" className="h-4 w-7 object-cover rounded shadow" />
                            <h3 className="font-extrabold text-lg truncate group-hover/link:text-primary transition-colors">{item.name}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground truncate mt-1">{item.artist} — {item.title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xl font-black text-primary">{item.score}</span>
                          <p className="text-[10px] uppercase font-black text-muted-foreground">Points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border-2 rounded-[2rem] p-6 shadow-xl">
                <h2 className="text-xl font-headline font-bold mb-8 flex items-center gap-3"><TrendingUp className="h-6 w-6 text-primary" /> Top 10 Chart</h2>
                <div className="h-[300px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreboardData.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={90} fontSize={11} tick={{ fontWeight: 'bold' }} stroke="hsl(var(--muted-foreground))" />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return <div className="bg-popover border-2 p-3 rounded-xl shadow-2xl"><p className="font-black text-primary text-xs">{data.name}</p><p className="text-xs font-bold">{data.score} Πόντοι</p></div>;
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                          {scoreboardData.slice(0, 10).map((e, i) => <Cell key={`c-${i}`} fill={i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Full List Section */}
            <div className="lg:col-span-7">
              <div className="bg-card border-2 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-6 md:p-8 border-b bg-muted/20 flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3"><ListOrdered className="h-6 w-6 text-primary" /> Πλήρης Κατάταξη</h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-3">{scoreboardData.length} Συμμετοχές</Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow><TableHead>Θέση</TableHead><TableHead>Συμμετοχή</TableHead><TableHead>Πόντοι</TableHead><TableHead className="text-right">Ψήφοι</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {scoreboardData.map((item, idx) => (
                        <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="py-5 font-bold">#{idx + 1}</TableCell>
                          <TableCell className="py-5">
                            <Link href={`/country/${encodeURIComponent(item.name)}/`} className="flex items-center gap-4 group">
                              <img src={item.flagUrl} alt="" className="h-5 w-8 object-cover rounded shadow-md group-hover:scale-110 transition-transform" />
                              <div className="flex flex-col min-w-0"><span className="font-extrabold group-hover:text-primary transition-colors truncate">{item.name}</span><span className="text-[10px] text-muted-foreground truncate">{item.artist}</span></div>
                            </Link>
                          </TableCell>
                          <TableCell className="py-5"><span className="text-lg font-black text-primary">{item.score}</span></TableCell>
                          <TableCell className="text-right py-5 text-muted-foreground font-bold">{item.votes}</TableCell>
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
