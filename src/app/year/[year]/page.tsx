
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { DECADES, YEAR_INFO } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { History, Music, Loader2, Layers, Info, CheckCircle2, MapPin, Sparkles, Lock, Trophy } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote, ContestStage, YearMetadata } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn, getFlagUrl } from '@/lib/utils';
import { getEventLogo } from '@/lib/logos';
import { useParams } from 'next/navigation';

function YearPageContent() {
  const { year } = useParams();
  const selectedYear = parseInt(year as string);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => data.country_name && setUserCountry(data.country_name))
      .catch(() => {});
  }, []);

  const entriesRef = useMemoFirebase(() => query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear)), [db, selectedYear]);
  const { data: allYearEntries, isLoading } = useCollection<Entry>(entriesRef);

  const yearMetaRef = useMemoFirebase(() => doc(db, 'year_metadata', selectedYear.toString()), [db, selectedYear]);
  const { data: dynamicYearMeta } = useDoc<YearMetadata>(yearMetaRef);

  const userVotesRef = useMemoFirebase(() => user ? query(collection(db, 'users', user.uid, 'votes'), where('year', '==', selectedYear)) : null, [db, user, selectedYear]);
  const { data: userVotes } = useCollection<Vote>(userVotesRef);

  const userVotesMap = (userVotes || []).reduce((acc, v) => ({ ...acc, [v.eurovisionEntryId]: v.points }), {} as Record<string, number>);
  const usedPoints = (userVotes || []).reduce((acc, v) => acc.add(v.points), new Set<number>());

  const yearDescription = dynamicYearMeta?.description || YEAR_INFO[selectedYear] || `Αρχείο συμμετοχών για το έτος ${selectedYear}.`;
  const isVotingOpen = dynamicYearMeta?.isVotingOpen ?? true;
  
  const yearLogoUrl = getEventLogo(selectedYear, 'Final');
  const populatedStages = new Set(allYearEntries?.map(e => e.stage) || []);

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) return toast({ title: "Απαιτείται σύνδεση", variant: "destructive" });
    if (!isVotingOpen) return toast({ title: "Η ψηφοφορία είναι κλειστή", variant: "destructive" });
    if (selectedYear === 2026 && entry.country === userCountry) return toast({ title: "Περιορισμός Χώρας", variant: "destructive" });
    
    const voteId = `${selectedYear}-${entry.id}`;
    setDocumentNonBlocking(doc(db, 'users', user.uid, 'votes', voteId), { id: voteId, userId: user.uid, eurovisionEntryId: entry.id, year: selectedYear, points: score, votedAt: new Date().toISOString(), feedback }, { merge: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          <div className="lg:col-span-5 bg-card border-2 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 w-full max-w-[280px] aspect-square flex items-center justify-center">
              {!logoError ? (
                <img src={yearLogoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" onError={() => setLogoError(true)} />
              ) : (
                <Music className="h-20 w-20 text-muted-foreground/20" />
              )}
            </div>
            <div className="relative z-10">
              <span className="text-7xl font-black text-foreground/5 absolute -top-16 left-1/2 -translate-x-1/2 select-none">{selectedYear}</span>
              <h3 className="text-4xl font-headline font-black text-primary">EUROVISION {selectedYear}</h3>
            </div>
          </div>

          <div className="lg:col-span-7 bg-primary/5 border-2 border-primary/10 rounded-[2.5rem] p-10 flex flex-col justify-center space-y-8 relative shadow-inner">
            <div className="absolute top-8 right-8">
              {isVotingOpen ? <CheckCircle2 className="h-10 w-10 text-green-500/30" /> : <Lock className="h-10 w-10 text-destructive/30" />}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-primary/70"><Info className="h-4 w-4" /> Πληροφορίες</div>
              <p className="text-xl text-muted-foreground leading-relaxed italic">"{yearDescription}"</p>
              {!isVotingOpen && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Η ψηφοφορία για αυτό το έτος έχει ολοκληρωθεί ή είναι ανενεργή.
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <Link href={`/scoreboard/?year=${selectedYear}`}><Trophy className="mr-2 h-5 w-5" /> Δείτε τα Αποτελέσματα</Link>
              </Button>
            </div>
          </div>
        </div>

        <section className="space-y-12">
          <div className="p-6 rounded-[2rem] bg-card border shadow-2xl space-y-8">
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground"><Layers className="h-6 w-6" /> Φάση Διαγωνισμού</div>
            <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
              <TabsList className="flex flex-wrap h-auto bg-muted/30 p-2 rounded-2xl gap-2">
                <TabsTrigger value="All" className="h-10 rounded-xl px-4">Όλα</TabsTrigger>
                {['Final', 'Semi-Final 1', 'Semi-Final 2', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'].filter(s => populatedStages.has(s as ContestStage)).map(s => (
                  <TabsTrigger key={s} value={s} className="h-10 rounded-xl px-4">{s}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(allYearEntries || []).filter(e => selectedStage === "All" || e.stage === selectedStage).map(entry => (
                <EntryCard key={entry.id} entry={entry} onVote={handleVote} hasVoted={!!userVotesMap[entry.id]} userScore={userVotesMap[entry.id]} usedPoints={usedPoints} isRestricted={(selectedYear === 2026 && entry.country === userCountry) || !isVotingOpen} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function YearPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <YearPageContent />
    </Suspense>
  );
}
