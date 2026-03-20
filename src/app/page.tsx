
"use client";

import { useState, useEffect } from 'react';
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
import { History, Filter, Loader2, Layers, Music, RotateCcw } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Entry, Vote } from '@/lib/types';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

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

  const handleVote = (entry: Entry, score: number, feedback: string) => {
    if (!user) {
      toast({
        title: "Απαιτείται σύνδεση",
        description: "Παρακαλώ συνδεθείτε για να ψηφίσετε.",
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
              <div className="flex flex-col sm:flex-row gap-4 pt-10 md:pt-16 justify-center w-full max-w-md mx-auto sm:max-w-none">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg md:text-xl px-10 md:px-14 h-16 md:h-20 rounded-full shadow-lg shadow-primary/20" onClick={() => {
                  const element = document.getElementById('browser-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Music className="mr-2 h-6 w-6" /> Έναρξη Ψηφοφορίας
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg md:text-xl px-10 md:px-14 h-16 md:h-20 rounded-full border-2" asChild>
                  <Link href="/scoreboard">Live Scoreboard</Link>
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
                <p className="text-muted-foreground text-xl md:text-2xl">Επιλέξτε έτος για να δείτε τις συμμετοχές και να δώσετε το 12άρι σας.</p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-6 md:gap-10">
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Δεκαετία</span>
                  <Tabs value={currentDecadeLabel} className="w-full sm:w-auto">
                    <TabsList className="bg-secondary/50 p-1.5 rounded-full w-full sm:w-auto overflow-x-auto">
                      {DECADES.map(d => (
                        <TabsTrigger 
                          key={d.label} 
                          value={d.label} 
                          className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 md:px-8 h-10 md:h-12"
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
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Έτος</span>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(v) => {
                      setSelectedYear(parseInt(v));
                      setSelectedStage("All");
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-none h-12 md:h-14 font-bold rounded-full text-xl">
                      <SelectValue placeholder="Έτος" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-2xl">
                      {(DECADES.find(d => d.label === currentDecadeLabel)?.years || []).map(y => (
                        <SelectItem key={y} value={y.toString()} className="font-bold py-3">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-card border border-border/50 shadow-2xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <Layers className="h-6 w-6" />
                  Φάση Διαγωνισμού / Event
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
              
              <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-muted/30 p-2 rounded-2xl gap-2 overflow-x-auto">
                  <TabsTrigger value="All" className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Όλα</TabsTrigger>
                  <TabsTrigger value="Final" className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Τελικός</TabsTrigger>
                  <TabsTrigger value="Semi-Final 1" className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Ημιτ. 1</TabsTrigger>
                  <TabsTrigger value="Semi-Final 2" className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Ημιτ. 2</TabsTrigger>
                  <TabsTrigger value="Eurodromio" className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Eurodromio</TabsTrigger>
                  <TabsTrigger value="Be.So." className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Be.So.</TabsTrigger>
                  <TabsTrigger value="Mu.Si.Ka." className="h-10 md:h-12 rounded-xl text-xs md:text-sm px-4">Mu.Si.Ka.</TabsTrigger>
                </TabsList>
              </Tabs>

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
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 md:py-40 bg-secondary/5 rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-muted/20">
              <Filter className="h-20 w-20 md:h-32 md:w-32 text-muted-foreground/30 mb-10" />
              <p className="text-3xl md:text-4xl font-headline font-bold text-muted-foreground text-center px-6">Δεν βρέθηκαν συμμετοχές για το {selectedYear}</p>
              <p className="text-muted-foreground mt-4 text-center px-6 text-lg">Δοκιμάστε να επιλέξετε διαφορετικό έτος ή φάση.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 py-16 md:py-28 mt-20 md:mt-32">
        <div className="container px-4 text-center space-y-12 md:space-y-16">
          <div className="flex flex-col items-center gap-6 md:gap-8">
            <Link href="/" className="relative h-12 w-20 md:h-16 md:w-28 opacity-90 transition-opacity hover:opacity-100">
              <Image 
                src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" 
                alt="INFE Greece Logo" 
                fill
                className="object-contain rounded-xl"
              />
            </Link>
            <span className="text-3xl md:text-4xl font-headline font-bold tracking-tight">INFE <span className="text-primary italic">GR Poll</span></span>
          </div>
          <div className="space-y-4">
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed px-6">
              Γιορτάζουμε 70 χρόνια μουσικής, πολιτισμού και ενότητας. Δημιουργήθηκε από fans, για fans, στο INFE Greece.
            </p>
            <p className="text-sm font-medium text-primary/80">
              App Creator: <span className="font-bold">Konstantinos Gkiokoglou</span>
            </p>
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
