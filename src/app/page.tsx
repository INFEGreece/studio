
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { EntryCard } from '@/components/entries/EntryCard';
import { MOCK_ENTRIES, DECADES } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, History, Filter } from 'lucide-react';

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [votedEntries, setVotedEntries] = useState<Set<string>>(new Set());

  const filteredEntries = MOCK_ENTRIES.filter(e => e.year === selectedYear);
  const currentDecadeLabel = DECADES.find(d => d.years.includes(selectedYear))?.label || "Archive";

  const handleVote = (entryId: string) => {
    setVotedEntries(prev => new Set(prev).add(entryId));
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
              Your Eurovision <br/><span className="text-primary">Journey Starts Here</span>
            </h1>
            <p className="max-w-[700px] text-lg md:text-xl text-muted-foreground">
              Vote for your favorite entries, discover new musical gems, and see how the world ranks the best contest on Earth.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                Start Voting
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 backdrop-blur">
                View Scoreboard
              </Button>
            </div>
          </div>
        </section>

        {/* Browser Section */}
        <section className="container px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
                <History className="h-7 w-7 text-accent" />
                Browse Entries
              </h2>
              <p className="text-muted-foreground">Explore over 60 years of musical history.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Decade:</span>
                <Tabs defaultValue="2020s" className="w-auto">
                  <TabsList className="bg-secondary/50">
                    {DECADES.map(d => (
                      <TabsTrigger key={d.label} value={d.label} onClick={() => setSelectedYear(d.years[0])}>
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
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="w-[120px] bg-secondary/50">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {DECADES.find(d => d.label === currentDecadeLabel)?.years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEntries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onVote={() => handleVote(entry.id)}
                  hasVoted={votedEntries.has(entry.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-xl border-2 border-dashed border-muted">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">No entries found for {selectedYear}</p>
              <Button variant="link" onClick={() => setSelectedYear(2024)}>Return to 2024</Button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-card/50 py-12">
        <div className="container px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold">EuroVisionary</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Created for fans by fans. Eurovision Song Contest results and assets are property of EBU.
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
