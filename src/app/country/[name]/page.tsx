
"use client";

import { use } from 'react';
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

export default function CountryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
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

  // Get user votes for all entries of this country to pass to EntryCard
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
      toast({ title: "Sign in required", variant: "destructive" });
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
    toast({ title: "Vote Cast!" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const flagUrl = sortedEntries[0]?.flagUrl || getFlagUrl(countryName);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-8 md:py-16">
        <div className="mb-8 md:mb-12">
          <Button variant="ghost" asChild className="mb-6 -ml-2 text-muted-foreground hover:text-primary">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Entries
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-card border rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative h-24 w-36 md:h-32 md:w-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 shrink-0">
              <img src={flagUrl} alt={countryName} className="w-full h-full object-cover" />
            </div>
            
            <div className="text-center md:text-left space-y-3">
              <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
                {countryName}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground">
                <span className="flex items-center gap-2 font-medium">
                  <History className="h-5 w-5 text-accent" />
                  {sortedEntries.length} Participations in Poll
                </span>
                <span className="flex items-center gap-2 font-medium">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {sortedEntries.reduce((sum, e) => sum + (e.totalPoints || 0), 0)} Total Points
                </span>
              </div>
            </div>
          </div>
        </div>

        {sortedEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
          <div className="text-center py-24 bg-muted/20 rounded-[2rem] border-2 border-dashed">
            <p className="text-2xl font-headline font-bold text-muted-foreground">No entries found for {countryName}</p>
          </div>
        )}
      </main>
    </div>
  );
}
