
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { YEAR_INFO } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Music, Loader2, Layers, Info, CheckCircle2, Sparkles, Lock, Trophy, ArrowLeft, Pencil, Trash2, Youtube, User, ImageIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote, ContestStage, YearMetadata } from '@/lib/types';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { getEventLogo } from '@/lib/logos';
import { getFlagUrl } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
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

interface YearViewProps {
  year: string;
}

export function YearView({ year }: YearViewProps) {
  const selectedYear = parseInt(year);
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const urlStage = searchParams?.get('stage');
  const [selectedStage, setSelectedStage] = useState<string>(urlStage || "All");
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Admin Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEntryForEdit, setCurrentEntryForEdit] = useState<Entry | null>(null);
  const [editFormData, setEditFormData] = useState({
    country: '',
    flagUrl: '',
    year: 2026,
    artist: '',
    songTitle: '',
    videoUrl: '',
    thumbnailUrl: '',
    bioUrl: '',
    stage: 'Final' as ContestStage
  });

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_name) setUserCountry(data.country_name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const s = searchParams?.get('stage');
    if (s && s !== selectedStage) {
      setSelectedStage(s);
    }
  }, [searchParams, selectedStage]);

  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);
  const { data: adminData } = useDoc(adminDocRef);
  const isAdmin = !!adminData;

  const entriesRef = useMemoFirebase(() => {
    return query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
  }, [db, selectedYear]);
  const { data: allYearEntries, isLoading } = useCollection<Entry>(entriesRef);

  const yearMetaRef = useMemoFirebase(() => doc(db, 'year_metadata', selectedYear.toString()), [db, selectedYear]);
  const { data: dynamicYearMeta } = useDoc<YearMetadata>(yearMetaRef);

  const userVotesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users', user.uid, 'votes'), where('year', '==', selectedYear));
  }, [db, user, selectedYear]);
  const { data: userVotes } = useCollection<Vote>(userVotesRef);

  const userVotesMap = (userVotes || []).reduce((acc, v) => ({ ...acc, [v.eurovisionEntryId]: v.points }), {} as Record<string, number>);
  const usedPoints = (userVotes || []).reduce((acc, v) => acc.add(v.points), new Set<number>());

  const yearDescription = dynamicYearMeta?.description || YEAR_INFO[selectedYear] || `Αρχείο συμμετοχών για το έτος ${selectedYear}.`;
  const isVotingOpen = dynamicYearMeta?.isVotingOpen ?? true;
  const yearLogoUrl = dynamicYearMeta?.logoUrl || getEventLogo(selectedYear, 'Final');
  
  const populatedStages = useMemo(() => {
    const stages = new Set<string>();
    if (allYearEntries) allYearEntries.forEach(e => stages.add(e.stage));
    return stages;
  }, [allYearEntries]);

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) {
      toast({ title: "Απαιτείται σύνδεση", variant: "destructive" });
      return;
    }
    if (!isVotingOpen) {
      toast({ title: "Η ψηφοφορία είναι κλειστή", variant: "destructive" });
      return;
    }

    const isInfeEvent = ["Eurodromio", "Be.So.", "Mu.Si.Ka."].includes(entry.stage);
    if (!isInfeEvent && selectedYear === 2026 && entry.country === userCountry && score !== 0) {
      toast({ title: "Περιορισμός Χώρας", description: "Δεν μπορείτε να ψηφίσετε τη χώρα σας σε ESC events.", variant: "destructive" });
      return;
    }
    
    const voteId = `${selectedYear}-${entry.id}`;
    const voteRef = doc(db, 'users', user.uid, 'votes', voteId);

    if (score === 0) {
      deleteDocumentNonBlocking(voteRef);
      toast({ title: "Η ψήφος αφαιρέθηκε", description: `Αφαιρέσατε τους πόντους από την συμμετοχή ${entry.country}.` });
    } else {
      setDocumentNonBlocking(voteRef, { 
        id: voteId, 
        userId: user.uid, 
        eurovisionEntryId: entry.id, 
        year: selectedYear, 
        points: score, 
        votedAt: new Date().toISOString(), 
        feedback 
      }, { merge: true });
      toast({ title: "Η ψήφος καταχωρήθηκε", description: `Δώσατε ${score} πόντους στην συμμετοχή ${entry.country}!` });
    }
  };

  const openEditDialog = (entry: Entry) => {
    setCurrentEntryForEdit(entry);
    setEditFormData({ 
      country: entry.country, 
      flagUrl: entry.flagUrl || '', 
      year: entry.year, 
      artist: entry.artist, 
      songTitle: entry.songTitle, 
      videoUrl: entry.videoUrl || '', 
      thumbnailUrl: entry.thumbnailUrl || '', 
      bioUrl: entry.bioUrl || '', 
      stage: entry.stage 
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!currentEntryForEdit) return;
    const entryRef = doc(db, 'eurovision_entries', currentEntryForEdit.id);
    setDocumentNonBlocking(entryRef, { ...editFormData, id: currentEntryForEdit.id, flagUrl: editFormData.flagUrl || getFlagUrl(editFormData.country) }, { merge: true });
    setIsEditDialogOpen(false);
    toast({ title: "Ενημερώθηκε!" });
  };

  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container px-4 py-12">
        <Button variant="ghost" asChild className="mb-8 -ml-2 text-muted-foreground hover:text-primary h-10 rounded-xl font-bold">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Πίσω στην Αρχική
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          <div className="lg:col-span-5 bg-card border-2 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 w-full max-w-[280px] aspect-square flex items-center justify-center">
              {!logoError ? (
                <img 
                  src={yearLogoUrl} 
                  alt={`Logo`} 
                  className="w-full h-full object-contain drop-shadow-2xl"
                  onError={() => setLogoError(true)} 
                />
              ) : (
                <Music className="h-20 w-20 text-muted-foreground/20" />
              )}
            </div>
            <div className="relative z-10">
              <span className="text-7xl font-black text-foreground/5 absolute -top-16 left-1/2 -translate-x-1/2 select-none">{selectedYear}</span>
              <h3 className="text-4xl font-headline font-black text-primary uppercase">EUROVISION {selectedYear}</h3>
            </div>
          </div>

          <div className="lg:col-span-7 bg-primary/5 border-2 border-primary/10 rounded-[2.5rem] p-10 flex flex-col justify-center space-y-8 relative shadow-inner">
            <div className="absolute top-8 right-8">
              {isVotingOpen ? (
                <CheckCircle2 className="h-10 w-10 text-green-500/30" />
              ) : (
                <Lock className="h-10 w-10 text-destructive/30" />
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-primary/70">
                <Info className="h-4 w-4" /> Πληροφορίες Έτους
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
                "{yearDescription}"
              </p>
              {!isVotingOpen && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold flex items-center gap-2 mt-4">
                  <Lock className="h-5 w-5" /> Η ψηφοφορία για αυτό το έτος έχει ολοκληρωθεί.
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="rounded-full h-14 px-8 font-bold" onClick={() => document.getElementById('entries-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                <Music className="mr-2 h-5 w-5" /> Δείτε τις Συμμετοχές
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 font-bold" asChild>
                <Link href={`/scoreboard/?year=${selectedYear}`}>
                  <Trophy className="mr-2 h-5 w-5" /> Scoreboard {selectedYear}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <section id="entries-grid" className="space-y-12">
          <div className="p-6 md:p-8 rounded-[2rem] bg-card border shadow-2xl space-y-8">
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Layers className="h-6 w-6" /> Φάση Διαγωνισμού
            </div>
            <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
              <TabsList className="flex flex-wrap h-auto bg-muted/30 p-2 rounded-2xl gap-2">
                <TabsTrigger value="All" className="h-10 md:h-12 rounded-xl px-6">Όλα</TabsTrigger>
                {stages.filter(s => populatedStages.has(s)).map(s => (
                  <TabsTrigger key={s} value={s} className="h-10 md:h-12 rounded-xl px-6">{s}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
              <p className="text-xl font-headline font-bold text-muted-foreground">Φόρτωση συμμετοχών...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
              {(allYearEntries || [])
                .filter(e => selectedStage === "All" || e.stage === selectedStage)
                .sort((a, b) => {
                  const isInfeEvent = ["Eurodromio", "Be.So.", "Mu.Si.Ka."].includes(selectedStage);
                  if (isInfeEvent) {
                    return a.songTitle.localeCompare(b.songTitle);
                  }
                  return a.country.localeCompare(b.country);
                })
                .map((entry) => (
                  <div key={entry.id} className="relative group">
                    <EntryCard 
                      entry={entry} 
                      onVote={(score, feedback) => handleVote(entry, score, feedback)}
                      hasVoted={!!userVotesMap[entry.id]}
                      userScore={userVotesMap[entry.id]}
                      usedPoints={usedPoints}
                      isRestricted={(selectedYear === 2026 && entry.country === userCountry && !["Eurodromio", "Be.So.", "Mu.Si.Ka."].includes(entry.stage)) || !isVotingOpen}
                    />
                    {isAdmin && (
                      <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg bg-white/90" onClick={() => openEditDialog(entry)}><Pencil className="h-4 w-4 text-primary" /></Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg bg-destructive/90" onClick={() => { if(confirm("Διαγραφή;")) deleteDocumentNonBlocking(doc(db, 'eurovision_entries', entry.id)); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] overflow-y-auto max-h-[90vh] p-8">
            <DialogHeader><DialogTitle>Επεξεργασία Συμμετοχής</DialogTitle></DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Χώρα</Label><Input value={editFormData.country} onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })} className="rounded-xl h-11" /></div>
                <div className="space-y-2"><Label>Έτος</Label><Input type="number" value={editFormData.year} onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) })} className="rounded-xl h-11" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Καλλιτέχνης</Label><Input value={editFormData.artist} onChange={(e) => setEditFormData({ ...editFormData, artist: e.target.value })} className="rounded-xl h-11" /></div>
                <div className="space-y-2"><Label>Τίτλος</Label><Input value={editFormData.songTitle} onChange={(e) => setEditFormData({ ...editFormData, songTitle: e.target.value })} className="rounded-xl h-11" /></div>
              </div>
              <div className="space-y-2"><Label>Φάση</Label>
                <Select value={editFormData.stage} onValueChange={(v) => setEditFormData({ ...editFormData, stage: v as ContestStage })}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> Video URL</Label>
                <Input value={editFormData.videoUrl} onChange={(e) => setEditFormData({ ...editFormData, videoUrl: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Thumbnail / Image URL</Label>
                <Input value={editFormData.thumbnailUrl} onChange={(e) => setEditFormData({ ...editFormData, thumbnailUrl: e.target.value })} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Artist Bio URL (infegreece.com)</Label>
                <Input value={editFormData.bioUrl} onChange={(e) => setEditFormData({ ...editFormData, bioUrl: e.target.value })} className="rounded-xl h-11" />
              </div>
            </div>
            <DialogFooter><Button onClick={handleSaveEdit} className="w-full h-12 rounded-xl font-bold">Αποθήκευση</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
