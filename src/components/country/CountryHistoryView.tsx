
"use client";

import { Suspense, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote, ContestStage } from '@/lib/types';
import { Loader2, History, ArrowLeft, Trophy, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { getFlagUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Inner component to handle data fetching and interaction
 */
function CountryContent({ name }: { name: string }) {
  const countryName = decodeURIComponent(name);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Admin Check
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  const { data: adminData } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [formData, setFormData] = useState({
    country: '',
    flagUrl: '',
    year: 2026,
    artist: '',
    songTitle: '',
    videoUrl: '',
    thumbnailUrl: '',
    stage: 'Final' as ContestStage
  });

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

  const handleDeleteEntry = (entryId: string) => {
    if (confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συμμετοχή;")) {
      deleteDocumentNonBlocking(doc(db, 'eurovision_entries', entryId));
      toast({ title: "Η συμμετοχή διαγράφηκε" });
    }
  };

  const openEditDialog = (entry: Entry) => {
    setCurrentEntry(entry);
    setFormData({
      country: entry.country,
      flagUrl: entry.flagUrl || '',
      year: entry.year,
      artist: entry.artist,
      songTitle: entry.songTitle,
      videoUrl: entry.videoUrl,
      thumbnailUrl: entry.thumbnailUrl || '',
      stage: entry.stage
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!currentEntry) return;
    const entryRef = doc(db, 'eurovision_entries', currentEntry.id);
    setDocumentNonBlocking(entryRef, {
      ...formData,
      id: currentEntry.id,
      flagUrl: formData.flagUrl || getFlagUrl(formData.country)
    }, { merge: true });
    setIsEditDialogOpen(false);
    toast({ title: "Η συμμετοχή ενημερώθηκε επιτυχώς!" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const flagUrl = sortedEntries[0]?.flagUrl || getFlagUrl(countryName);
  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

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
            <div key={entry.id} className="relative group">
              <EntryCard 
                entry={entry} 
                onVote={(score, feedback) => handleVote(entry, score, feedback)}
                hasVoted={!!userVotesMap[entry.id]}
                userScore={userVotesMap[entry.id]}
              />
              {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg" onClick={() => openEditDialog(entry)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg" onClick={() => handleDeleteEntry(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-secondary/5 rounded-[3rem] border-4 border-dashed border-muted/20">
          <p className="text-3xl font-headline font-bold text-muted-foreground">No records found for {countryName}</p>
        </div>
      )}

      {/* Admin Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[1.5rem] md:rounded-[2rem] overflow-y-auto max-h-[95vh] p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-headline font-bold">
              Επεξεργασία Συμμετοχής
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Χώρα</Label>
                <Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Έτος</Label>
                <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="rounded-xl h-11" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artist">Καλλιτέχνης</Label>
                <Input id="artist" value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="songTitle">Τίτλος Τραγουδιού</Label>
                <Input id="songTitle" value={formData.songTitle} onChange={(e) => setFormData({ ...formData, songTitle: e.target.value })} className="rounded-xl h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Φάση / Event</Label>
              <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as ContestStage })}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (YouTube)</Label>
              <Input id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Φωτογραφία Καλλιτέχνη
                </Label>
                <Input id="thumbnailUrl" placeholder="URL εικόνας" value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flagUrl" className="flex items-center gap-2">
                  Σημαία (Προαιρετικά)
                </Label>
                <Input id="flagUrl" placeholder="Custom URL σημαίας" value={formData.flagUrl} onChange={(e) => setFormData({ ...formData, flagUrl: e.target.value })} className="rounded-xl h-11" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} className="w-full h-12 md:h-14 rounded-xl text-lg font-bold">Αποθήκευση Αλλαγών</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
