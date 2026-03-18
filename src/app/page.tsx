"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { DECADES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Filter, Loader2, Layers } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote } from '@/lib/types';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function Home() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStage, setSelectedStage] = useState<string>("All");

  useEffect(() => {
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const entriesRef = useMemoFirebase(() => {
    let baseQuery = query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
    if (selectedStage !== "All") {
      baseQuery = query(baseQuery, where('stage', '==', selectedStage));
    }
    return baseQuery;
  }, [db, selectedYear, selectedStage]);

  const { data: rawEntries, isLoading } = useCollection<Entry>(entriesRef);

  // Sort alphabetically by country name for easy browsing
  const filteredEntries = (rawEntries || [])
    .slice()
    .sort((a, b) => a.country.localeCompare(b.country));

  const userVotesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'votes'),
      where('year', '==', selectedYear)
    );
  }, [db, user, selectedYear]);

  const { data: userVotes } = useCollection<Vote>(userVotesRef);

  const userVotesMap = (userVotes || []).reduce((acc, vote) => {
    acc[vote.eurovisionEntryId] = vote.points;
    return acc;
  }, {} as Record<string, number>);

  const usedPoints = (userVotes || []).reduce((acc, vote) => {
    acc.add(vote.points);
    return acc;
  }, new Set<number>());

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) return;

    const voteId = `${selectedYear}-${entry.id}`;
    const voteRef = doc(db, 'users', user.uid, 'votes', voteId);
    
    const voteData: Vote = {
      id: voteId,
      userId: user.uid,
      eurovisionEntryId: entry.id,
      year: selectedYear,
      points: score,
      votedAt: new Date().toISOString(),
      feedback: feedback
    };

    setDocumentNonBlocking(voteRef, voteData, { merge: true });

    const entryRef = doc(db, 'eurovision_entries', entry.id);
    setDocumentNonBlocking(entryRef, {
      totalPoints: (entry.totalPoints || 0) + score,
      voteCount: (entry.voteCount || 0) + 1
    }, { merge: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 overflow-hidden bg-secondary/20">
          <div className="container relative z-10 px-4 flex flex-col items-center text-center space-y-8">
            <div className="relative w-48 h-24 md:w-64 md:h-32 mb-4">
              <Image 
                src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                alt="INFE Greece" 
                width={256}
                height={128}
                className="object-contain drop-shadow-2xl rounded-lg"
                priority
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-headline font-extrabold tracking-tighter text-foreground">
                The INFE GR <br/><span className="text-primary">Eurovision Poll</span>
              </h1>
              <p className="max-w-[700px] text-lg md:text-xl text-muted-foreground mx-auto">
                Celebrating 70 years of Eurovision. Vote for your favorite entries and see how the community ranks the best contest on Earth.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-10 h-14" onClick={() => {
                const element = document.getElementById('browser-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Start Voting
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-10 h-14" asChild>
                <a href="/scoreboard">View Scoreboard</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="browser-section" className="container px-4 py-16">
          <div className="flex flex-col gap-10 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-headline font-bold flex items-center gap-3">
                  <History className="h-8 w-8 text-accent" />
                  Browse Entries
                </h2>
                <p className="text-muted-foreground text-lg">Explore 70 years of musical history, from 1956 to 2026.</p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Decade:</span>
                  <Tabs value={currentDecadeLabel} className="w-auto">
                    <TabsList className="bg-secondary/50 p-1">
                      {DECADES.map(d => (
                        <TabsTrigger 
                          key={d.label} 
                          value={d.label} 
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                          onClick={() => {
                            setSelectedYear(d.years[0]);
                            setSelectedStage("All");
                          }}
                        >
                          {d.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Year:</span>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(v) => {
                      setSelectedYear(parseInt(v));
                      setSelectedStage("All");
                    }}
                  >
                    <SelectTrigger className="w-[140px] bg-secondary/50 border-none h-10 font-bold">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                        <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-inner">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                <Layers className="h-4 w-4" />
                Competition Stage
              </div>
              <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/30 h-12 p-1">
                  <TabsTrigger value="All" className="h-10">All entries</TabsTrigger>
                  <TabsTrigger value="Final" className="h-10">Grand Final</TabsTrigger>
                  <TabsTrigger value="Semi-Final 1" className="h-10">Semi-Final 1</TabsTrigger>
                  <TabsTrigger value="Semi-Final 2" className="h-10">Semi-Final 2</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
              <p className="text-xl font-bold text-muted-foreground animate-pulse">Retrieving {selectedYear} data...</p>
            </div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredEntries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onVote={(score, feedback) => handleVote(entry, score, feedback)}
                  hasVoted={!!userVotesMap[entry.id]}
                  userScore={userVotesMap[entry.id]}
                  usedPoints={usedPoints}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-secondary/10 rounded-3xl border-2 border-dashed border-muted/50">
              <Filter className="h-16 w-16 text-muted-foreground mb-6" />
              <p className="text-2xl font-bold text-muted-foreground">No records for {selectedYear} {selectedStage !== "All" ? `(${selectedStage})` : ""}</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 py-16">
        <div className="container px-4 text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-10 w-16 opacity-80">
              <Image 
                src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                alt="INFE Greece Logo" 
                fill
                className="object-contain rounded"
              />
            </div>
            <span className="text-2xl font-headline font-bold tracking-tight">INFE <span className="text-primary">GR Poll</span></span>
          </div>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Celebrating 70 years of Eurovision history. Created for fans by INFE Greece.
          </p>
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} INFE Greece. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
