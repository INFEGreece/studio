
"use client";

import { Suspense, useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, collectionGroup } from 'firebase/firestore';
import { Entry, Vote, ContestStage } from '@/lib/types';
import { Loader2, History, ArrowLeft, Trophy, Pencil, Trash2, Image as ImageIcon, Star, TrendingUp, Music, User, Youtube } from 'lucide-react';
import { getFlagUrl } from '@/lib/utils';
import { getEventLogo } from '@/lib/logos';
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
import { Badge } from '@/components/ui/badge';

function CountryContent({ name }: { name: string }) {
  const countryName = decodeURIComponent(name);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [logoError, setLogoError] = useState(false);

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
    spotifyUrl: '',
    bioUrl: '',
    thumbnailUrl: '',
    stage: 'Final' as ContestStage
  });

  // Fetch all entries for this country
  const entriesRef = useMemoFirebase(() => {
    return query(
      collection(db, 'eurovision_entries'),
      where('country', '==', countryName)
    );
  }, [db, countryName]);
  const { data: countryEntries, isLoading: isEntriesLoading } = useCollection<Entry>(entriesRef);

  // Fetch all votes globally to calculate stats for this country
  const allVotesRef = useMemoFirebase(() => {
    return query(collectionGroup(db, 'votes'));
  }, [db]);
  const { data: allVotes, isLoading: isVotesLoading } = useCollection<Vote>(allVotesRef);

  const sortedEntries = useMemo(() => {
    return (countryEntries || [])
      .slice()
      .sort((a, b) => b.year - a.year);
  }, [countryEntries]);

  const stats = useMemo(() => {
    if (!countryEntries) return { totalPoints: 0, participations: 0, bestScore: 0, avgPoints: 0 };
    
    const entryIds = new Set(countryEntries.map(e => e.id));
    const countryVotes = (allVotes || []).filter(v => entryIds.has(v.eurovisionEntryId));
    
    const totalPoints = countryVotes.reduce((sum, v) => sum + (Number(v.points) || 0), 0);
    const participations = countryEntries.length;
    const avgPoints = participations > 0 ? (totalPoints / participations).toFixed(1) : 0;

    const pointsPerYear: Record<number, number> = {};
    countryVotes.forEach(v => {
      pointsPerYear[v.year] = (pointsPerYear[v.year] || 0) + v.points;
    });
    const bestScore = Object.values(pointsPerYear).length > 0 ? Math.max(...Object.values(pointsPerYear)) : 0;

    return { totalPoints, participations, bestScore, avgPoints };
  }, [countryEntries, allVotes]);

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
      toast({ title: "Σύνδεση Απαραίτητη", description: "Συνδεθείτε για να ψηφίσετε!", variant: "destructive" });
      return;
    }
    const voteId = `${entry.year}-${entry.id}`;
    const voteRef = doc(db, 'users', user.uid, 'votes', voteId);

    if (score === 0) {
      deleteDocumentNonBlocking(voteRef);
      toast({ title: "Η ψήφος αφαιρέθηκε", description: `Αφαιρέσατε τους πόντους από την συμμετοχή του ${entry.year}.` });
    } else {
      setDocumentNonBlocking(voteRef, {
        id: voteId,
        userId: user.uid,
        eurovisionEntryId: entry.id,
        year: entry.year,
        points: score,
        votedAt: new Date().toISOString(),
        feedback: feedback
      }, { merge: true });
      toast({ title: "Η ψήφος καταχωρήθηκε", description: `Δώσατε ${score} πόντους στη συμμετοχή του ${entry.year}!` });
    }
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
      videoUrl: entry.videoUrl || '',
      spotifyUrl: entry.spotifyUrl || '',
      bioUrl: entry.bioUrl || '',
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

  if (isEntriesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const flagUrl = sortedEntries[0]?.flagUrl || getFlagUrl(countryName);
  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];
  
  const latestEntry = sortedEntries[0];
  const eventLogo = latestEntry ? getEventLogo(latestEntry.year, latestEntry.stage) : null;

  return (
    <main className="flex-1 container px-4 py-8 md:py-16">
      <div className="mb-12">
        <Button variant="ghost" asChild className="mb-6 -ml-2 text-muted-foreground hover:text-primary h-10 rounded-xl font-bold">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Πίσω στην Αρχική
          </Link>
        </Button>
        
        <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border-2 shadow-2xl bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 blur-3xl bg-primary pointer-events-none" />
          
          <div className="relative p-8 md:p-14 flex flex-col lg:flex-row items-center gap-10">
            <div className="relative h-40 w-60 md:h-56 md:w-80 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 group">
              <img src={flagUrl} alt={countryName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              {eventLogo && !logoError && (
                <div className="absolute top-4 left-4 h-12 w-20 z-10 drop-shadow-lg">
                  <img 
                    src={eventLogo} 
                    alt="Event Logo" 
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                </div>
              )}
            </div>
            
            <div className="text-center lg:text-left space-y-6 flex-1">
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
                  Country Profile
                </Badge>
                <h1 className="text-5xl md:text-8xl font-headline font-extrabold tracking-tighter">
                  {countryName}
                </h1>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-background/50 backdrop-blur-md border p-4 rounded-2xl text-center lg:text-left">
                  <div className="text-primary mb-1"><History className="h-5 w-5" /></div>
                  <p className="text-2xl font-bold">{stats.participations}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Συμμετοχές</p>
                </div>
                <div className="bg-background/50 backdrop-blur-md border p-4 rounded-2xl text-center lg:text-left">
                  <div className="text-yellow-500 mb-1"><Trophy className="h-5 w-5" /></div>
                  <p className="text-2xl font-bold">{stats.totalPoints}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Συν. Πόντοι</p>
                </div>
                <div className="bg-background/50 backdrop-blur-md border p-4 rounded-2xl text-center lg:text-left">
                  <div className="text-accent mb-1"><Star className="h-5 w-5" /></div>
                  <p className="text-2xl font-bold">{stats.bestScore}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Top Year Score</p>
                </div>
                <div className="bg-background/50 backdrop-blur-md border p-4 rounded-2xl text-center lg:text-left">
                  <div className="text-green-500 mb-1"><TrendingUp className="h-5 w-5" /></div>
                  <p className="text-2xl font-bold">{stats.avgPoints}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Μ.Ο. Πόντων</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-headline font-bold flex items-center gap-3">
          <Music className="h-8 w-8 text-primary" />
          Ιστορικό Συμμετοχών
        </h2>
        <Badge variant="secondary" className="font-bold">{sortedEntries.length} Εγγραφές</Badge>
      </div>

      {sortedEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
          {sortedEntries.map((entry) => (
            <div key={entry.id} className="relative group">
              <EntryCard 
                entry={entry} 
                onVote={(score, feedback) => handleVote(entry, score, feedback)}
                hasVoted={!!userVotesMap[entry.id]}
                userScore={userVotesMap[entry.id]}
              />
              {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg bg-white/90" onClick={() => openEditDialog(entry)}>
                    <Pencil className="h-4 w-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg bg-destructive/90" onClick={() => handleDeleteEntry(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-secondary/5 rounded-[3rem] border-4 border-dashed border-muted/20">
          <History className="h-20 w-20 text-muted-foreground/20 mb-6" />
          <p className="text-2xl font-headline font-bold text-muted-foreground">Δεν βρέθηκαν συμμετοχές για: {countryName}</p>
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
              <Label htmlFor="videoUrl" className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" /> Video URL (YouTube)
              </Label>
              <Input id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="rounded-xl h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spotifyUrl" className="flex items-center gap-2">
                <Music className="h-4 w-4 text-green-500" /> Spotify URL
              </Label>
              <Input id="spotifyUrl" placeholder="https://open.spotify.com/track/..." value={formData.spotifyUrl} onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })} className="rounded-xl h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bioUrl" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Artist Bio URL (infegreece.com)
              </Label>
              <Input id="bioUrl" placeholder="https://infegreece.com/bio-slug" value={formData.bioUrl} onChange={(e) => setFormData({ ...formData, bioUrl: e.target.value })} className="rounded-xl h-11" />
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
