
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { DECADES, YEAR_INFO } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { History, Filter, Loader2, Layers, Music, RotateCcw, Calendar, Info, AlertTriangle, Star, CheckCircle2, MapPin, Pencil, Trash2, Image as ImageIcon, Sparkles, User, Youtube, HelpCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote, ContestStage, YearMetadata } from '@/lib/types';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn, getFlagUrl } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { ShareResultsDialog } from '@/components/voting/ShareResultsDialog';
import { getEventLogo } from '@/lib/logos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function HomeContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const urlYear = searchParams?.get('year');
  const urlStage = searchParams?.get('stage');
  
  const [selectedYear, setSelectedYear] = useState<number>(urlYear ? parseInt(urlYear) : 2026);
  const [selectedStage, setSelectedStage] = useState<string>(urlStage || "All");
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
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
    bioUrl: '',
    thumbnailUrl: '',
    stage: 'Final' as ContestStage
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setLogoError(false);
    
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_name) {
          setUserCountry(data.country_name);
        }
      })
      .catch(() => {});
  }, [selectedYear]);

  useEffect(() => {
    const y = searchParams?.get('year');
    const s = searchParams?.get('stage');
    
    if (y) {
      const parsed = parseInt(y);
      if (!isNaN(parsed) && parsed !== selectedYear) {
        setSelectedYear(parsed);
      }
    }
    
    if (s && s !== selectedStage) {
      setSelectedStage(s);
    } else if (!s && urlStage) {
      setSelectedStage("All");
    }
  }, [searchParams, selectedYear, selectedStage, urlStage]);

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

  const populatedStages = useMemo(() => {
    const stages = new Set<string>();
    if (allYearEntries) {
      allYearEntries.forEach(e => stages.add(e.stage));
    }
    return stages;
  }, [allYearEntries]);

  const filteredEntries = useMemo(() => {
    if (!allYearEntries) return [];
    
    const infeEvents = ["Eurodromio", "Be.So.", "Mu.Si.Ka."];

    if (selectedStage === "All") {
      const escStages = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification'];
      return allYearEntries
        .filter(e => escStages.includes(e.stage))
        .sort((a, b) => a.country.localeCompare(b.country));
    }
    
    const entries = allYearEntries.filter(e => e.stage === selectedStage);

    if (infeEvents.includes(selectedStage)) {
      return entries.sort((a, b) => a.songTitle.localeCompare(b.songTitle));
    }
    
    return entries.sort((a, b) => a.country.localeCompare(b.country));
  }, [allYearEntries, selectedStage]);

  const userVotesRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'votes'),
      where('year', '==', selectedYear)
    );
  }, [db, user, selectedYear]);

  const { data: userVotes } = useCollection<Vote>(userVotesRef);

  const userVotesMap = (userVotes || []).reduce((acc, vote) => {
    if (vote.eurovisionEntryId) {
      acc[vote.eurovisionEntryId] = vote.points;
    }
    return acc;
  }, {} as Record<string, number>);

  const usedPoints = (userVotes || []).reduce((acc, vote) => {
    acc.add(vote.points);
    return acc;
  }, new Set<number>());

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";
  
  const yearLogoUrl = dynamicYearMeta?.logoUrl || getEventLogo(selectedYear, 'Final');
  
  const yearDescription = dynamicYearMeta?.description || YEAR_INFO[selectedYear] || `Εξερευνήστε τις συμμετοχές του διαγωνισμού για το έτος ${selectedYear}.`;

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) {
      toast({ title: "Απαιτείται σύνδεση", variant: "destructive" });
      return;
    }
    if (dynamicYearMeta && dynamicYearMeta.isVotingOpen === false) {
      toast({ title: "Η ψηφοφορία είναι κλειστή", variant: "destructive" });
      return;
    }
    
    const isSpecialEvent = ["Eurodromio", "Be.So.", "Mu.Si.Ka."].includes(entry.stage);
    if (!isSpecialEvent && selectedYear === 2026 && entry.country === userCountry && score !== 0) {
      toast({ title: "Περιορισμός Ψηφοφορίας", description: "Δεν μπορείτε να ψηφίσετε τη χώρα σας.", variant: "destructive" });
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
        feedback: feedback 
      }, { merge: true });
      toast({ title: "Η ψήφος καταχωρήθηκε", description: `Δώσατε ${score} πόντους στην συμμετοχή ${entry.country}!` });
    }
  };

  const handleResetVotes = () => {
    if (!user || !userVotes || userVotes.length === 0) return;
    if (confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε όλες τις ψήφους σας για το έτος ${selectedYear};`)) {
      userVotes.forEach(vote => {
        const voteRef = doc(db, 'users', user.uid, 'votes', vote.id);
        deleteDocumentNonBlocking(voteRef);
      });
      toast({ title: "Οι ψήφοι μηδενίστηκαν" });
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
      bioUrl: entry.bioUrl || '',
      thumbnailUrl: entry.thumbnailUrl || '', 
      stage: entry.stage 
    });
    setIsEditDialogOpen(true);
  };

  const slugify = (text: string) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\u0370-\u03FF\u1F00-\u1FFF\w\s-]/g, "") // Keep Greek and Alpha
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSaveEdit = () => {
    if (!currentEntryForEdit) return;
    const entryRef = doc(db, 'eurovision_entries', currentEntryForEdit.id);
    setDocumentNonBlocking(entryRef, { ...editFormData, id: currentEntryForEdit.id, flagUrl: editFormData.flagUrl || getFlagUrl(editFormData.country) }, { merge: true });
    setIsEditDialogOpen(false);
    toast({ title: "Η συμμετοχή ενημερώθηκε!" });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm("Οριστική διαγραφή;")) {
      deleteDocumentNonBlocking(doc(db, 'eurovision_entries', entryId));
      toast({ title: "Διαγράφηκε", variant: "destructive" });
    }
  };

  const regionalEvents: ContestStage[] = ["Eurodromio", "Be.So.", "Mu.Si.Ka."];
  const stages: ContestStage[] = ['Final', 'Semi-Final 1', 'Semi-Final 2', 'Prequalification', 'Eurodromio', 'Be.So.', 'Mu.Si.Ka.'];

  const mainStages = [
    { value: "All", label: "Όλα (ESC)" },
    { value: "Final", label: "Τελικός" },
    { value: "Semi-Final 1", label: "Ημιτ. 1" },
    { value: "Semi-Final 2", label: "Ημιτ. 2" },
    ...(selectedYear === 1993 ? [{ value: "Prequalification", label: "Προκριματικός" }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-40 lg:py-56 overflow-hidden bg-secondary/20">
          <div className="container relative z-10 px-4 flex flex-col items-center text-center">
            <div className="mb-16 md:mb-24 flex justify-center w-full">
              <div className="relative w-56 h-28 md:w-[450px] md:h-56">
                <Image src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" alt="INFE Greece" fill className="object-contain drop-shadow-2xl rounded-2xl" priority />
              </div>
            </div>
            <div className="space-y-8 md:space-y-12 max-w-4xl relative z-20">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-headline font-extrabold tracking-tighter text-foreground leading-tight md:leading-none">
                THE INFE GR <br/><span className="text-primary italic">Eurovision Poll</span>
              </h1>
              <p className="max-w-[750px] text-base md:text-2xl text-muted-foreground mx-auto font-medium px-4">
                70 Χρόνια Ιστορίας της Eurovision. Η φωνή σου. Η ψήφος σου. Η κοινότητά μας.
              </p>
              {userCountry && (
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-xs font-bold text-primary animate-pulse">
                  <MapPin className="h-3 w-3" /> Τοποθεσία: {userCountry}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 pt-10 md:pt-16 justify-center w-full max-w-md mx-auto sm:max-w-none">
                <Button size="lg" className="w-full sm:w-auto h-16 md:h-20 rounded-full shadow-lg" onClick={() => {
                  document.getElementById('browser-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Music className="mr-2 h-6 w-6" /> Έναρξη Ψηφοφορίας
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 md:h-20 rounded-full" asChild>
                  <Link href={`/scoreboard/?year=${selectedYear}`}>Live Scoreboard {selectedYear}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="browser-section" className="container px-4 py-16 md:py-24">
          <div className="flex flex-col gap-10 md:gap-14 mb-16 md:mb-20">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-headline font-bold flex items-center gap-4">
                  <History className="h-10 w-10 md:h-14 md:w-14 text-accent" />
                  Εξερευνήστε την Ιστορία
                </h2>
              </div>
              <div className="flex flex-col gap-8 w-full xl:max-w-3xl">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Δεκαετία</span>
                  <div className="flex flex-wrap gap-2">
                    {DECADES.map(d => (
                      <Button key={d.label} variant={currentDecadeLabel === d.label ? "default" : "secondary"} className={cn("rounded-full px-6 h-10 md:h-12 font-bold", currentDecadeLabel === d.label && "bg-primary text-white shadow-lg")} onClick={() => { setSelectedYear(d.years[0]); setSelectedStage("All"); }}>{d.label}</Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent ml-2">Έτος</span>
                  <div className="flex flex-wrap gap-2">
                    {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                      <Button key={y} variant={selectedYear === y ? "default" : "outline"} className={cn("rounded-full px-5 h-10 font-bold", selectedYear === y ? "bg-accent text-accent-foreground border-accent shadow-lg" : "border-accent/30 text-accent")} onClick={() => { setSelectedYear(y); setSelectedStage("All"); }}>{y}</Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-10">
              <div className="lg:col-span-5 bg-card border-2 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group shadow-2xl">
                <div className="relative z-10 w-full max-w-[280px] aspect-square flex items-center justify-center">
                  {!logoError ? (
                    <img src={yearLogoUrl} alt={`Eurovision ${selectedYear} Logo`} className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-700" onError={() => setLogoError(true)} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 rounded-full border-4 border-dashed border-muted/50">
                      <Music className="h-20 w-20 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="relative z-10">
                  <span className="text-7xl md:text-9xl font-black text-foreground/5 absolute -top-16 md:-top-24 left-1/2 -translate-x-1/2 select-none tracking-tighter">{selectedYear}</span>
                  <h3 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-primary">EUROVISION {selectedYear}</h3>
                </div>
              </div>

              <div className="lg:col-span-7 bg-primary/5 border-2 border-primary/10 rounded-[2.5rem] p-8 md:p-14 flex flex-col justify-center space-y-8 shadow-inner relative">
                <div className="absolute top-8 right-8"><Sparkles className="h-10 w-10 text-primary/20" /></div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-primary/70"><Info className="h-4 w-4" /> Πληροφορίες Έτους</div>
                  <h4 className="text-2xl md:text-4xl font-headline font-bold leading-tight">Ματιά στο {selectedYear}</h4>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed italic whitespace-pre-wrap">"{yearDescription}"</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-1"><p className="text-[10px] font-bold uppercase text-muted-foreground">Συμμετοχές</p><p className="text-2xl font-black">{allYearEntries?.length || 0}</p></div>
                  <div className="space-y-1"><p className="text-[10px] font-bold uppercase text-muted-foreground">Φάσεις</p><p className="text-2xl font-black">{populatedStages.size}</p></div>
                  <div className="space-y-1 hidden md:block"><p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p><p className="text-2xl font-black text-green-500"><CheckCircle2 className="h-5 w-5 inline mr-1" /> Active</p></div>
                </div>
              </div>
            </div>

            {user && userVotes && userVotes.length >= 10 && (
              <div className="flex justify-center py-6">
                <ShareResultsDialog 
                  year={selectedYear} 
                  userVotes={userVotes} 
                  entries={allYearEntries || []} 
                />
              </div>
            )}

            <div className="p-6 md:p-10 rounded-[2rem] bg-card border shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground"><Layers className="h-6 w-6" /> Φάση Διαγωνισμού / Events</div>
                {user && userVotes && userVotes.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleResetVotes} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-10 px-5 font-bold">
                    <RotateCcw className="h-4 w-4 mr-2" /> Μηδενισμός Ψήφων {selectedYear}
                  </Button>
                )}
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                    <TabsList className="flex flex-wrap h-auto bg-muted/30 p-2 rounded-2xl gap-2">
                      {mainStages.filter(opt => opt.value === "All" || populatedStages.has(opt.value) || isAdmin).map(opt => (
                        <TabsTrigger key={opt.value} value={opt.value} className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">{opt.label}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                {selectedYear >= 2000 && (
                  <div className="flex flex-col gap-4 border-t pt-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1"><Star className="h-3 w-3" /> INFE GR Events</div>
                    <div className="flex flex-wrap gap-2">
                      {regionalEvents.filter(stage => populatedStages.has(stage) || isAdmin).map(stage => (
                        <Button key={stage} variant={selectedStage === stage ? "default" : "outline"} size="sm" className={cn("rounded-xl h-10 px-6 font-bold", selectedStage === stage && "bg-primary shadow-lg")} onClick={() => setSelectedStage(stage)}>{stage}</Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32"><Loader2 className="h-20 w-20 animate-spin text-primary mb-10" /><p className="text-2xl font-headline font-bold text-muted-foreground animate-pulse">Φόρτωση...</p></div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-14">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="relative group">
                  <EntryCard entry={entry} onVote={(score, feedback) => handleVote(entry, score, feedback)} hasVoted={!!userVotesMap[entry.id]} userScore={userVotesMap[entry.id]} usedPoints={usedPoints} isRestricted={(selectedYear === 2026 && entry.country === userCountry && !["Eurodromio", "Be.So.", "Mu.Si.Ka."].includes(entry.stage)) || (dynamicYearMeta && dynamicYearMeta.isVotingOpen === false)} />
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg bg-white/90" onClick={() => openEditDialog(entry)}><Pencil className="h-4 w-4 text-primary" /></Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg bg-destructive/90" onClick={() => handleDeleteEntry(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-secondary/5 rounded-[3rem] border-4 border-dashed border-muted/20"><History className="h-20 w-20 text-muted-foreground/30 mb-10" /><p className="text-3xl font-headline font-bold text-muted-foreground">Δεν βρέθηκαν συμμετοχές</p></div>
          )}
        </section>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] overflow-y-auto max-h-[95vh] p-8">
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

      <footer className="border-t bg-card/50 py-16 mt-20">
        <div className="container px-4 text-center space-y-12">
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-12 w-20 opacity-90 transition-opacity hover:opacity-100">
              <Image src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" alt="INFE Greece Logo" fill className="object-contain rounded-xl" />
            </div>
            <span className="text-3xl font-headline font-bold">INFE <span className="text-primary italic">GR Poll</span></span>
          </div>
          <div className="pt-12 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground/40 tracking-[0.3em] uppercase">&copy; {currentYear} INFE GREECE OFFICIAL FAN POLL</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
