
"use client";

import { useState } from 'react';
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
import { History, Filter, Loader2, Layers, Music } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStage, setSelectedStage] = useState<string>("All");

  const entriesRef = useMemoFirebase(() => {
    let baseQuery = query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
    if (selectedStage !== "All") {
      baseQuery = query(baseQuery, where('stage', '==', selectedStage));
    }
    return baseQuery;
  }, [db, selectedYear, selectedStage]);

  const { data: rawEntries, isLoading } = useCollection<Entry>(entriesRef);

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
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to cast your vote.",
        variant: "destructive"
      });
      return;
    }

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
        {/* Responsive Hero Section */}
        <section className="relative w-full py-16 md:py-32 lg:py-40 overflow-hidden bg-secondary/20">
          <div className="container relative z-10 px-4 flex flex-col items-center text-center">
            <div className="mb-10 md:mb-20 w-full flex justify-center">
              <div className="relative w-48 h-24 md:w-96 md:h-48">
                <Image 
                  src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                  alt="INFE Greece" 
                  fill
                  className="object-contain drop-shadow-2xl rounded-xl"
                  priority
                />
              </div>
            </div>
            
            <div className="space-y-8 md:space-y-10 max-w-4xl">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-headline font-extrabold tracking-tighter text-foreground leading-tight md:leading-none">
                THE INFE GR <br/><span className="text-primary italic">Eurovision Poll</span>
              </h1>
              <p className="max-w-[700px] text-base md:text-2xl text-muted-foreground mx-auto font-medium px-4">
                70 Years of Eurovision History. Your Voice. Your Vote. Our Community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-10 md:pt-12 justify-center w-full max-w-md mx-auto sm:max-w-none">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg md:text-xl px-8 md:px-12 h-14 md:h-16 rounded-full shadow-lg shadow-primary/20" onClick={() => {
                  const element = document.getElementById('browser-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Music className="mr-2 h-5 w-5" /> Start Voting
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg md:text-xl px-8 md:px-12 h-14 md:h-16 rounded-full border-2" asChild>
                  <a href="/scoreboard">Live Scoreboard</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Responsive Filter/Browser Section */}
        <section id="browser-section" className="container px-4 py-12 md:py-20">
          <div className="flex flex-col gap-8 md:gap-12 mb-12 md:mb-16">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-headline font-bold flex items-center gap-3">
                  <History className="h-8 w-8 md:h-10 md:w-10 text-accent" />
                  Explore History
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl">Select a year to see entries and cast your 12 points.</p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 md:gap-8">
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Decade</span>
                  <Tabs value={currentDecadeLabel} className="w-full sm:w-auto overflow-x-auto">
                    <TabsList className="bg-secondary/50 p-1 rounded-full w-full sm:w-auto whitespace-nowrap overflow-x-auto scrollbar-hide">
                      {DECADES.map(d => (
                        <TabsTrigger 
                          key={d.label} 
                          value={d.label} 
                          className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 md:px-6"
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

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Year</span>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(v) => {
                      setSelectedYear(parseInt(v));
                      setSelectedStage("All");
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-none h-12 font-bold rounded-full text-lg">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl">
                      {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                        <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-card border border-border/50 shadow-2xl">
              <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">
                <Layers className="h-5 w-5" />
                Competition Phase
              </div>
              <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/30 h-auto md:h-14 p-1.5 rounded-xl gap-1">
                  <TabsTrigger value="All" className="h-10 md:h-11 rounded-lg text-sm md:text-base">All Entries</TabsTrigger>
                  <TabsTrigger value="Final" className="h-10 md:h-11 rounded-lg text-sm md:text-base">Grand Final</TabsTrigger>
                  <TabsTrigger value="Semi-Final 1" className="h-10 md:h-11 rounded-lg text-sm md:text-base">Semi 1</TabsTrigger>
                  <TabsTrigger value="Semi-Final 2" className="h-10 md:h-11 rounded-lg text-sm md:text-base">Semi 2</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 md:py-40">
              <Loader2 className="h-16 w-16 md:h-20 md:w-20 animate-spin text-primary mb-8" />
              <p className="text-xl md:text-2xl font-headline font-bold text-muted-foreground animate-pulse">Loading Contest Data...</p>
            </div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
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
            <div className="flex flex-col items-center justify-center py-20 md:py-32 bg-secondary/5 rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-muted/20">
              <Filter className="h-16 w-16 md:h-24 md:w-24 text-muted-foreground/30 mb-8" />
              <p className="text-2xl md:text-3xl font-headline font-bold text-muted-foreground text-center px-4">No records found for {selectedYear}</p>
              <p className="text-muted-foreground mt-2 text-center px-4">Try selecting a different year or competition stage.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 py-12 md:py-20 mt-12 md:mt-20">
        <div className="container px-4 text-center space-y-8 md:space-y-10">
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <div className="relative h-10 w-16 md:h-12 md:w-20 opacity-90">
              <Image 
                src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                alt="INFE Greece Logo" 
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <span className="text-2xl md:text-3xl font-headline font-bold tracking-tight">INFE <span className="text-primary italic">GR Poll</span></span>
          </div>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed px-4">
            Celebrating 70 years of music, culture, and unity. Created by fans, for fans, at INFE Greece.
          </p>
          <div className="pt-8 border-t border-white/5">
            <p className="text-[10px] md:text-sm text-muted-foreground/50 tracking-widest uppercase">
              &copy; {new Date().getFullYear()} INFE GREECE OFFICIAL FAN POLL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
