
"use client";

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Trophy, Share2, Facebook, Twitter, Mail, MessageCircle, Copy, Check, Download, ImageIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Vote, Entry } from '@/lib/types';
import { toPng } from 'html-to-image';
import Image from 'next/image';

interface ShareResultsDialogProps {
  year: number;
  userVotes: Vote[];
  entries: Entry[];
}

export function ShareResultsDialog({ year, userVotes, entries }: ShareResultsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sortedVotes = [...userVotes].sort((a, b) => b.points - a.points).slice(0, 10);

  const downloadImage = async () => {
    if (scoreboardRef.current === null) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(scoreboardRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `INFE-GR-Poll-${year}-Top10.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Εικόνα Έτοιμη!", description: "Το Top 10 σας κατέβηκε επιτυχώς." });
    } catch (err) {
      toast({ title: "Σφάλμα", description: "Δεν ήταν δυνατή η δημιουργία της εικόνας.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const getShareText = () => {
    const voteList = sortedVotes.map(v => {
      const entry = entries.find(e => e.id === v.eurovisionEntryId);
      return `${v.points} pts: ${entry?.country || 'Unknown'}`;
    }).join('\n');
    return `Οι ψήφοι μου για την Eurovision ${year} στο INFE Greece Poll:\n\n${voteList}\n\nΨήφισε κι εσύ εδώ:`;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://infepoll.infegreece.com';
  const fullText = getShareText();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold rounded-full h-14 px-8 shadow-xl shadow-primary/20 animate-pulse">
          <Share2 className="mr-2 h-5 w-5" /> Κοινοποίηση Top 10 {year}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-bold text-center">Μοιραστείτε το Top 10 σας!</DialogTitle>
          <DialogDescription className="text-center">
            Δημιουργήστε μια εικόνα για τα Social Media ή αντιγράψτε το κείμενο.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden Scoreboard for Image Generation */}
        <div className="absolute -left-[9999px] top-0">
          <div 
            ref={scoreboardRef}
            className="w-[500px] bg-background p-10 rounded-none flex flex-col items-center space-y-6 border-[12px] border-primary"
            style={{ backgroundImage: 'radial-gradient(circle at center, hsl(var(--primary)/0.1) 0%, transparent 70%)' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-16 w-28">
                <img src="https://infegreece.com/wp-content/uploads/2023/04/Infe-Greece.jpg" alt="Logo" className="object-contain rounded-xl" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">My Top 10 <span className="text-primary">{year}</span></h2>
              <p className="text-[10px] font-bold tracking-[0.4em] text-muted-foreground uppercase">Official INFE Greece Fan Poll</p>
            </div>

            <div className="w-full space-y-2">
              {sortedVotes.map((v, idx) => {
                const entry = entries.find(e => e.id === v.eurovisionEntryId);
                return (
                  <div key={v.id} className="flex items-center justify-between bg-card/50 border p-3 rounded-xl">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-black text-primary w-8">{v.points}</span>
                      <img src={entry?.flagUrl} className="h-5 w-8 object-cover rounded shadow" alt="" />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm leading-none">{entry?.country}</span>
                        <span className="text-[10px] text-muted-foreground">{entry?.artist} - {entry?.songTitle}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground opacity-30">#{idx+1}</div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 text-center">
              <p className="text-[9px] font-bold text-primary/60 tracking-widest">infepoll.infegreece.com</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 py-4">
          <div className="relative group cursor-pointer" onClick={downloadImage}>
            <div className="aspect-[4/5] bg-card border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center hover:bg-primary/5 transition-colors overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-2">
                   <Download className="h-10 w-10 text-primary animate-bounce" />
                   <span className="font-bold">Λήψη Εικόνας</span>
                </div>
              </div>
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-bold text-sm">Προεπισκόπηση Εικόνας Top 10</p>
              <p className="text-xs text-muted-foreground mt-2">Πατήστε για λήψη PNG (υψηλή ανάλυση)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <Button onClick={downloadImage} disabled={isGenerating} className="h-12 rounded-xl font-bold">
               {isGenerating ? "Δημιουργία..." : <><Download className="mr-2 h-4 w-4" /> Λήψη PNG</>}
             </Button>
             <Button variant="outline" onClick={() => {
               navigator.clipboard.writeText(`${fullText} ${shareUrl}`);
               setCopied(true);
               setTimeout(() => setCopied(false), 2000);
               toast({ title: "Αντιγράφηκε κείμενο!" });
             }} className="h-12 rounded-xl font-bold">
               {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
               Αντιγραφή Text
             </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full h-10 rounded-xl">Κλείσιμο</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
