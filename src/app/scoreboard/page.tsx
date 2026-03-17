
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MOCK_ENTRIES } from '@/lib/data';
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
import { Trophy, TrendingUp, Users } from 'lucide-react';

export default function ScoreboardPage() {
  const [selectedYear, setSelectedYear] = useState(2026);

  // Simulated aggregation logic - filtered by selected year
  const scoreboardData = MOCK_ENTRIES
    .filter(e => e.year === selectedYear)
    .map((e, idx) => ({
      name: e.country,
      score: [120, 115, 98, 85][idx] || Math.floor(Math.random() * 50) + 10,
      votes: Math.floor(Math.random() * 20) + 5,
      artist: e.artist,
      title: e.songTitle,
    }))
    .sort((a, b) => b.score - a.score);

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {top3.length > 0 ? top3.map((item, idx) => (
            <div key={item.name} className="relative bg-card border rounded-xl p-6 overflow-hidden">
              <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                <Trophy className={`h-24 w-24 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-600'}`} />
              </div>
              <div className="space-y-2 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rank #{idx + 1}</span>
                <h3 className="text-2xl font-headline font-bold text-primary">{item.name}</h3>
                <p className="text-sm text-muted-foreground font-medium">{item.artist}</p>
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
          <div className="bg-card border rounded-xl p-6 mb-12">
            <h2 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
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
                          <div className="bg-popover border p-3 rounded-lg shadow-xl">
                            <p className="font-bold text-primary">{data.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">{data.artist}</p>
                            <div className="flex items-center gap-4 pt-2 border-t">
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
          <div className="bg-card border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
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
                  <TableRow key={item.name} className="hover:bg-muted/30">
                    <TableCell className="font-bold">
                      {idx + 1 === 1 ? <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">1st</Badge> : 
                       idx + 1 === 2 ? <Badge className="bg-slate-400/20 text-slate-400 border-slate-400/30">2nd</Badge> :
                       idx + 1 === 3 ? <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">3rd</Badge> : 
                       `#${idx + 1}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.artist} - {item.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">{item.score}</TableCell>
                    <TableCell className="text-muted-foreground">{(item.score / item.votes).toFixed(1)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.votes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
