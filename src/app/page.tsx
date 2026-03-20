
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { History, Filter, Loader2, Layers, Music, RotateCcw, Calendar, Info, AlertTriangle, Star, CheckCircle2, MapPin } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote, ContestStage } from '@/lib/types';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { ShareResultsDialog } from '@/components/voting/ShareResultsDialog';

function HomeContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const urlYear = searchParams?.get('year');
  const [selectedYear, setSelectedYear] = useState<number>(urlYear ? parseInt(urlYear) : 2026);
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    
    // IP detection to restrict local voting for 2026 entries
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_name) {
          setUserCountry(data.country_name);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const y = searchParams?.get('year');
    if (y) {
      const parsed = parseInt(y);
      if (!isNaN(parsed) && parsed !== selectedYear) {
        setSelectedYear(parsed);
      }
    }
  }, [searchParams, selectedYear]);

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

  const populatedStages = useMemo(() => {
    const stages = new Set<string>();
    if (allYearEntries) {
      allYearEntries.forEach(e => stages.add(e.stage));
    }
    return stages;
  }, [allYearEntries]);

  const filteredEntries = useMemo(() => {
    if (!allYearEntries) return [];
    return allYearEntries
      .filter(e => selectedStage === "All" || e.stage === selectedStage)
      .sort((a, b) => a.country.localeCompare(b.country));
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

  const isVotingComplete = usedPoints.size === 10;

  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) {
      toast({
        title: "Απαιτείται σύνδεση",
        description: "Παρακαλώ συνδεθείτε για να ψηφίσετε.",
        variant: "destructive"
      });
      return;
    }

    // Eurovision Rule: Can't vote for your own country of residence
    if (selectedYear === 2026 && entry.country === userCountry) {
      toast({
        title: "Περιορισμός Ψηφοφορίας",
        description: "Σύμφωνα με τους κανονισμούς της Eurovision, δεν μπορείτε να ψηφίσετε τη χώρα στην οποία βρίσκεστε.",
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
  };

  const handleResetVotes = () => {
    if (!user || !userVotes || userVotes.length === 0) return;

    if (confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε όλες τις ψήφους σας για το έτος ${selectedYear};`)) {
      userVotes.forEach(vote => {
        const voteRef = doc(db, 'users', user.uid, 'votes', vote.id);
        deleteDocumentNonBlocking(voteRef);
      });
      toast({ title: "Οι ψήφοι μηδενίστηκαν", description: `Ο πίνακας βαθμολογίας σας για το ${selectedYear} είναι πλέον κενός.` });
    }
  };

  const regionalEvents: ContestStage[] = ["Eurodromio", "Be.So.", "Mu.Si.Ka."];

  const mainStages = [
    { value: "All", label: "Όλα" },
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
                <Image 
                  src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                  alt="INFE Greece" 
                  fill
                  className="object-contain drop-shadow-2xl rounded-2xl"
                  priority
                />
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
                  <MapPin className="h-3 w-3" />
                  Τοποθεσία: {userCountry}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-10 md:pt-16 justify-center w-full max-w-md mx-auto sm:max-w-none">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg md:text-xl px-10 md:px-14 h-16 md:h-20 rounded-full shadow-lg shadow-primary/20" onClick={() => {
                  const element = document.getElementById('browser-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Music className="mr-2 h-6 w-6" /> Έναρξη Ψηφοφορίας
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg md:text-xl px-10 md:px-14 h-16 md:h-20 rounded-full border-2" asChild>
                  <Link href={`/scoreboard/?year=${selectedYear}`} prefetch={false}>Live Scoreboard {selectedYear}</Link>
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
                <p className="text-muted-foreground text-xl md:text-2xl">Επιλέξτε δεκαετία και έτος για να δείτε τις συμμετοχές.</p>
              </div>

              <div className="flex flex-col gap-8 w-full xl:max-w-3xl">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Δεκαετία</span>
                  <div className="flex flex-wrap gap-2">
                    {DECADES.map(d => (
                      <Button
                        key={d.label}
                        variant={currentDecadeLabel === d.label ? "default" : "secondary"}
                        className={cn(
                          "rounded-full px-6 h-10 md:h-12 font-bold transition-all",
                          currentDecadeLabel === d.label ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => {
                          setSelectedYear(d.years[0]);
                          setSelectedStage("All");
                        }}
                      >
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent ml-2">Έτος</span>
                  <div className="flex flex-wrap gap-2">
                    {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                      <Button
                        key={y}
                        variant={selectedYear === y ? "default" : "outline"}
                        className={cn(
                          "rounded-full px-5 h-10 font-bold transition-all min-w-[64px]",
                          selectedYear === y 
                            ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-105" 
                            : "border-accent/30 text-accent hover:bg-accent/10"
                        )}
                        onClick={() => {
                          setSelectedYear(y);
                          setSelectedStage("All");
                        }}
                      >
                        {y}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedYear === 2020 && (
              <div className="bg-destructive/10 border-2 border-destructive/20 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-destructive/20 p-6 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center md:text-left space-y-2">
                  <h3 className="text-2xl md:text-3xl font-headline font-bold text-destructive">Eurovision 2020: Cancelled</h3>
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    Ο διαγωνισμός του 2020 στο Ρότερνταμ ακυρώθηκε λόγω της πανδημίας COVID-19. Ωστόσο, μπορείτε ακόμα να δείτε και να ψηφίσετε τα τραγούδια που είχαν επιλεγεί!
                  </p>
                </div>
              </div>
            )}

            {isVotingComplete && userVotes && allYearEntries && (
              <div className="bg-green-500/10 border-2 border-green-500/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500/20 p-4 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-green-700">Η ψηφοφορία σας ολοκληρώθηκε!</h3>
                    <p className="text-sm text-muted-foreground">Έχετε δώσει και τους 10 βαθμούς για το {selectedYear}.</p>
                  </div>
                </div>
                <ShareResultsDialog year={selectedYear} userVotes={userVotes} entries={allYearEntries} />
              </div>
            )}

            <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-card border border-border/50 shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <Layers className="h-6 w-6" />
                  Φάση Διαγωνισμού / Events
                </div>
                
                {user && userVotes && userVotes.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResetVotes}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-10 px-5 font-bold"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Μηδενισμός Ψήφων {selectedYear}
                  </Button>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Eurovision Contest</span>
                  <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                    <TabsList className="flex flex-wrap h-auto bg-muted/30 p-2 rounded-2xl gap-2 overflow-x-auto">
                      {mainStages.filter(opt => opt.value === "All" || populatedStages.has(opt.value) || isAdmin).map(opt => (
                        <TabsTrigger 
                          key={opt.value} 
                          value={opt.value} 
                          className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4 data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                          {opt.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                {selectedYear >= 2000 && (
                  <div className="flex flex-col gap-4 border-t pt-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70 ml-1">
                      <Star className="h-3 w-3" /> INFE GR Events
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {regionalEvents.filter(stage => populatedStages.has(stage) || isAdmin).map(stage => (
                        <Button
                          key={stage}
                          variant={selectedStage === stage ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "rounded-xl h-10 px-6 font-bold",
                            selectedStage === stage ? "bg-primary shadow-lg shadow-primary/20" : "hover:border-primary hover:text-primary"
                          )}
                          onClick={() => setSelectedStage(stage)}
                        >
                          {stage}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {userVotes && userVotes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  <div className="w-full flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Οι βαθμοί σας για το {selectedYear}:</span>
                    <Badge variant="outline" className="text-[9px] h-5 bg-primary/10 border-primary/20 text-primary">Κατάσταση Πίνακα</Badge>
                  </div>
                  {[12, 10, 8, 7, 6, 5, 4, 3, 2, 1].map(p => (
                    <Badge 
                      key={p} 
                      variant={usedPoints.has(p) ? "default" : "outline"}
                      className={`h-8 w-12 flex items-center justify-center font-bold text-sm rounded-lg transition-all ${usedPoints.has(p) ? 'bg-primary shadow-lg shadow-primary/20' : 'opacity-30 border-dashed'}`}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 md:py-48">
              <Loader2 className="h-20 w-20 md:h-28 md:w-28 animate-spin text-primary mb-10" />
              <p className="text-2xl md:text-3xl font-headline font-bold text-muted-foreground animate-pulse">Φόρτωση Δεδομένων...</p>
            </div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-14">
              {filteredEntries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onVote={(score, feedback) => handleVote(entry, score, feedback)}
                  hasVoted={!!userVotesMap[entry.id]}
                  userScore={userVotesMap[entry.id]}
                  usedPoints={usedPoints}
                  isRestricted={selectedYear === 2026 && entry.country === userCountry}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 md:py-40 bg-secondary/5 rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-muted/20">
              <History className="h-20 w-20 md:h-32 md:w-32 text-muted-foreground/30 mb-10" />
              <p className="text-3xl md:text-4xl font-headline font-bold text-muted-foreground text-center px-6">Δεν βρέθηκαν συμμετοχές για το {selectedYear}</p>
              <p className="text-muted-foreground mt-4 text-center px-6 text-lg">Δοκιμάστε να επιλέξετε διαφορετικό έτος ή φάση.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 py-16 md:py-28 mt-20 md:mt-32">
        <div className="container px-4 text-center space-y-12 md:space-y-16">
          <div className="flex flex-col items-center gap-6 md:gap-8">
            <div className="relative h-12 w-20 md:h-16 md:w-28 opacity-90 transition-opacity hover:opacity-100">
              <Image 
                src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                alt="INFE Greece Logo" 
                fill
                className="object-contain rounded-xl"
              />
            </div>
            <span className="text-3xl md:text-4xl font-headline font-bold tracking-tight">INFE <span className="text-primary italic">GR Poll</span></span>
          </div>
          <div className="space-y-4">
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed px-6">
              Γιορτάζουμε 70 χρόνια μουσικής, πολιτισμού και ενότητας. Δημιουργήθηκε από fans, για fans, στο INFE Greece.
            </p>
            <div className="pt-4 space-y-1">
              <p className="text-sm font-medium text-primary/80">
                App Creator: <span className="font-bold text-foreground">Konstantinos Gkiokoglou</span>
              </p>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5">
            <p className="text-[10px] md:text-xs text-muted-foreground/40 tracking-[0.3em] uppercase">
              &copy; {currentYear} INFE GREECE OFFICIAL FAN POLL • PROUDLY SERVING EUROFANS
            </p>
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
