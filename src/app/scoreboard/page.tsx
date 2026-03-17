
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Entry } from '@/lib/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Trophy, TrendingUp, Users, Loader2 } from 'lucide-react';
import { getFlagUrl } from '@/lib/utils';

export default function ScoreboardPage() {
  const db = useFirestore();
  const [selectedYear, setSelectedYear] = useState(2026);

  // Fetch real data from Firestore
  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: entries, isLoading } = useCollection<Entry>(entriesQuery);

  // Process data for the scoreboard
  const scoreboardData = useMemo(() => {
    if (!entries) return [];
    return entries
      .map(e => ({
        id: e.id,
        name: e.country,
        score: e.totalPoints || 0,
        votes: e.voteCount || 0,
        artist: e.artist,
        title: e.songTitle,
        flagUrl: e.flagUrl || getFlagUrl(e.country)
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [entries]);

  const top3 = scoreboardData.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container px-4 py-12">
        <header className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight">Global Scoreboard</h1>
              <p className="text-muted-foreground">Live community rankings for {selectedYear}</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Calculating scores...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats / Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {top3.length > 0 ? top3.map((item, idx) => (
                <div key={item.id} className="relative bg-card border rounded-xl p-6 overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                    <Trophy className={`h-24 w-24 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-600'}`} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={item.flagUrl} alt="" className="h-4 w-6 object-cover rounded-sm shadow-sm" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rank #{idx + 1}</span>
                    </div>
                    <h3 className="text-2xl font-headline font-bold text-primary">{item.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium truncate">{item.artist}</p>
                    <div className="pt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground">{item.score}</span>
                      <span className="text-sm text-muted-foreground uppercase">Points</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                  No voting data available for {selectedYear} yet.
                </div>
              )}
            </div>

            {/* Chart Section */}
            {scoreboardData.length > 0 && (
              <div className="bg-card border rounded-xl p-6 mb-12 shadow-sm">
                <h2 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Points Distribution
                </h2>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreboardData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <RechartsTooltip 
                        cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border p-3 rounded-lg shadow-xl ring-1 ring-black/5">
                                <p className="font-bold text-primary">{data.name}</p>
                                <p className="text-xs text-muted-foreground mb-1">{data.artist}</p>
                                <div className="flex items-center gap-4 pt-2 border-t mt-2">
                                  <span className="text-sm font-bold">{data.score} Pts</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {data.votes} votes
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {scoreboardData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Table Section */}
            {scoreboardData.length > 0 && (
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Country & Artist</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoreboardData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold">
                          {idx + 1 === 1 ? <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">1st</Badge> : 
                           idx + 1 === 2 ? <Badge className="bg-slate-400/20 text-slate-400 border-slate-400/30">2nd</Badge> :
                           idx + 1 === 3 ? <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">3rd</Badge> : 
                           `#${idx + 1}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={item.flagUrl} alt="" className="h-4 w-6 object-cover rounded-sm shadow-xs flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{item.name}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.artist} - {item.title}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{item.score}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.votes > 0 ? (item.score / item.votes).toFixed(1) : '0.0'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.votes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
