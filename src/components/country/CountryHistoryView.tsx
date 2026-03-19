
"use client";

import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote } from '@/lib/types';
import { Loader2, History, ArrowLeft, Trophy } from 'lucide-react';
import { getFlagUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

/**
 * Inner component to handle data fetching and interaction
 */
function CountryContent({ name }: { name: string }) {
  const countryName = decodeURIComponent(name);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const entriesRef = useMemoFirebase(() => {
    return query(
      collection(db, 'eurovision_entries'),
      where('country', '==', countryName)
    );
  }, [db, countryName]);

  const { data: countryEntries, isLoading } = useCollection<Entry>(entriesRef);

  const sortedEntries = (countryEntries || [])
    .slice()
    .sort((a, b) => b.year - a.year);

  const userVotesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'votes');
  }, [db, user]);

  const { data: userVotes } = useCollection<Vote>(userVotesRef);

  const userVotesMap = (userVotes || []).reduce((acc, vote) => {
    acc[vote.eurovisionEntryId] = vote.points;
    return acc;
  }, {} as Record<string, number>);

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Log in to save your history!", variant: "destructive" });
      return;
    }
    const voteId = `${entry.year}-${entry.id}`;
    const voteRef = doc(db, 'users', user.uid, 'votes', voteId);
    setDocumentNonBlocking(voteRef, {
      id: voteId,
      userId: user.uid,
      eurovisionEntryId: entry.id,
      year: entry.year,
      points: score,
      votedAt: new Date().toISOString(),
      feedback: feedback
    }, { merge: true });
    toast({ title: "Vote Saved", description: `You gave ${score} pts to ${entry.year}!` });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const flagUrl = sortedEntries[0]?.flagUrl || getFlagUrl(countryName);

  return (
    <main className="flex-1 container px-4 py-12 md:py-20">
      <div className="mb-12 md:mb-16">
        <Button variant="ghost" asChild className="mb-8 -ml-2 text-muted-foreground hover:text-primary h-12 rounded-xl">
          <Link href="/">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to entries
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14 bg-card border rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative h-32 w-48 md:h-44 md:w-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 shrink-0">
            <img src={flagUrl} alt={countryName} className="w-full h-full object-cover" />
          </div>
          
          <div className="text-center md:text-left space-y-4 relative z-10">
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight">
              {countryName}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-muted-foreground">
              <span className="flex items-center gap-3 text-lg md:text-xl font-medium">
                <History className="h-6 w-6 text-accent" />
                {sortedEntries.length} Participations
              </span>
              <span className="flex items-center gap-3 text-lg md:text-xl font-medium">
                <Trophy className="h-6 w-6 text-yellow-500" />
                {sortedEntries.reduce((sum, e) => sum + (e.totalPoints || 0), 0)} Total Points
              </span>
            </div>
          </div>
        </div>
      </div>

      {sortedEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 md:gap-14">
          {sortedEntries.map((entry) => (
            <EntryCard 
              key={entry.id} 
              entry={entry} 
              onVote={(score, feedback) => handleVote(entry, score, feedback)}
              hasVoted={!!userVotesMap[entry.id]}
              userScore={userVotesMap[entry.id]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-secondary/5 rounded-[3rem] border-4 border-dashed border-muted/20">
          <p className="text-3xl font-headline font-bold text-muted-foreground">No records found for {countryName}</p>
        </div>
      )}
    </main>
  );
}

export function CountryHistoryView({ name }: { name: string }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <CountryContent name={name} />
      </Suspense>
    </div>
  );
}
