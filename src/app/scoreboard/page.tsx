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
import { Trophy, TrendingUp, Users, Loader2, ListOrdered } from 'lucide-react';
import { getFlagUrl } from '@/lib/utils';

export default function ScoreboardPage() {
  const db = useFirestore();
  const [selectedYear, setSelectedYear] = useState(2026);

  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, 'eurovision_entries'), where('year', '==', selectedYear));
  }, [db, selectedYear]);

  const { data: entries, isLoading } = useCollection<Entry>(entriesQuery);

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
            <div className="bg-primary/20 p-2 rounded-lg">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight">Eurovision Scoreboard</h1>
              <p className="text-muted-foreground">Community rankings for the {selectedYear} season</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Calculating final scores...</p>
          </div>
        ) : scoreboardData.length === 0 ? (
          <div className="text-center py-32 bg-muted/20 rounded-[2rem] border-2 border-dashed">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl font-headline font-bold text-muted-foreground">No voting data yet</p>
            <p className="text-sm text-muted-foreground">Entries will appear here once users start voting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
            {/* Column 1: Visual Highlights */}
            <div className="xl:col-span-5 space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Podium Finishers
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {top3.map((item, idx) => (
                    <div key={item.id} className="relative bg-card border rounded-2xl p-6 group hover:border-primary/50 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' : 
                          idx === 1 ? 'bg-slate-400/20 text-slate-500 border border-slate-400/30' : 
                          'bg-amber-600/20 text-amber-700 border border-amber-600/30'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <img src={item.flagUrl} alt="" className="h-4 w-6 object-cover rounded shadow-sm" />
                            <h3 className="font-bold text-lg">{item.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.artist} — {item.title}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-primary">{item.score}</span>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Pts</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Points Distribution
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreboardData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        tick={{ fontWeight: 'bold' }}
                      />
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border p-3 rounded-xl shadow-xl">
                                <p className="font-bold text-primary">{data.name}</p>
                                <p className="text-[10px] font-bold">{data.score} Points</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {scoreboardData.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Column 2: Detailed Table */}
            <div className="xl:col-span-7">
              <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b bg-muted/10">
                  <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                    <ListOrdered className="h-5 w-5 text-primary" />
                    Detailed Rankings
                  </h2>
                </div>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Country & Artist</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoreboardData.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold">
                          {idx + 1 === 1 ? <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">1st</Badge> : 
                           idx + 1 === 2 ? <Badge className="bg-slate-400/20 text-slate-500 border-slate-400/30">2nd</Badge> :
                           idx + 1 === 3 ? <Badge className="bg-amber-600/20 text-amber-700 border-amber-600/30">3rd</Badge> : 
                           `#${idx + 1}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={item.flagUrl} alt="" className="h-4 w-6 object-cover rounded-sm flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground truncate">{item.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{item.artist}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{item.score}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.votes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
