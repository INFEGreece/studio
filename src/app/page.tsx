
"use client";

import { useState, useEffect } from 'react';
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
import { Trophy, History, Filter, Loader2, Layers } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote } from '@/lib/types';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';

export default function Home() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStage, setSelectedStage] = useState<string>("All");

  // Ensure user is signed in anonymously to track votes
  useEffect(() => {
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  // Fetch entries for the selected year and stage
  const entriesRef = useMemoFirebase(() => {
    let baseQuery = query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
    if (selectedStage !== "All") {
      baseQuery = query(baseQuery, where('stage', '==', selectedStage));
    }
    return baseQuery;
  }, [db, selectedYear, selectedStage]);

  const { data: filteredEntries, isLoading } = useCollection<Entry>(entriesRef);

  // Fetch current user's votes for this year to prevent duplicate points
  const userVotesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'votes'),
      where('year', '==', selectedYear)
    );
  }, [db, user, selectedYear]);

  const { data: userVotes } = useCollection<Vote>(userVotesRef);

  // Map of entryId -> points for the current user
  const userVotesMap = (userVotes || []).reduce((acc, vote) => {
    acc[vote.eurovisionEntryId] = vote.points;
    return acc;
  }, {} as Record<string, number>);

  // Set of points already used for other entries in this year
  const usedPoints = (userVotes || []).reduce((acc, vote) => {
    acc.add(vote.points);
    return acc;
  }, new Set<number>());

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) return;

    // Save vote to user's collection
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

    // Update global entry stats (optional, could be handled by a cloud function for production)
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
        {/* Hero Section */}
        <section className="relative w-full py-12 md:py-24 overflow-hidden bg-[url('https://picsum.photos/seed/eschero/1920/1080')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          <div className="container relative z-10 px-4 flex flex-col items-center text-center space-y-6">
            <h1 className="text-4xl md:text-7xl font-headline font-extrabold tracking-tighter text-white">
              The INFE GR <br/><span className="text-primary">Eurovision Poll</span>
            </h1>
            <p className="max-w-[700px] text-lg md:text-xl text-muted-foreground">
              Celebrating 70 years of Eurovision. Vote for your favorite entries and see how the community ranks the best contest on Earth.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8" onClick={() => {
                const element = document.getElementById('browser-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Start Voting
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 backdrop-blur" asChild>
                <a href="/scoreboard">View Scoreboard</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Browser Section */}
        <section id="browser-section" className="container px-4 py-12">
          <div className="flex flex-col gap-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
                  <History className="h-7 w-7 text-accent" />
                  Browse Entries
                </h2>
                <p className="text-muted-foreground">Explore 70 years of musical history, from 1956 to 2026.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Decade:</span>
                  <Tabs value={currentDecadeLabel} className="w-auto">
                    <TabsList className="bg-secondary/50">
                      {DECADES.map(d => (
                        <TabsTrigger key={d.label} value={d.label} onClick={() => {
                          setSelectedYear(d.years[0]);
                          setSelectedStage("All");
                        }}>
                          {d.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Year:</span>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(v) => {
                      setSelectedYear(parseInt(v));
                      setSelectedStage("All");
                    }}
                  >
                    <SelectTrigger className="w-[120px] bg-secondary/50">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Stage Filter */}
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                <Layers className="h-4 w-4" />
                Select Competition Stage:
              </div>
              <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/30">
                  <TabsTrigger value="All">All Entries</TabsTrigger>
                  <TabsTrigger value="Final">Grand Final</TabsTrigger>
                  <TabsTrigger value="Semi-Final 1">Semi-Final 1</TabsTrigger>
                  <TabsTrigger value="Semi-Final 2">Semi-Final 2</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Loading entries for {selectedYear}...</p>
            </div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-xl border-2 border-dashed border-muted">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">No entries found for {selectedYear} {selectedStage !== "All" ? `(${selectedStage})` : ""}</p>
              <Button variant="link" onClick={() => {
                setSelectedYear(2026);
                setSelectedStage("All");
              }}>Return to 2026</Button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 py-12">
        <div className="container px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold">INFE GR Poll</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Celebrating 70 years of Eurovision. Created for fans by INFE Greece. Eurovision Song Contest results and assets are property of EBU.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
