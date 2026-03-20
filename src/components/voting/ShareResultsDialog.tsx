
"use client";

import { useState } from 'react';
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
import { Trophy, Share2, Facebook, Twitter, Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Vote, Entry } from '@/lib/types';

interface ShareResultsDialogProps {
  year: number;
  userVotes: Vote[];
  entries: Entry[];
}

export function ShareResultsDialog({ year, userVotes, entries }: ShareResultsDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getShareText = () => {
    // Sort votes: 12, 10, 8, 7, ...
    const sortedVotes = [...userVotes].sort((a, b) => b.points - a.points);
    const voteList = sortedVotes.map(v => {
      const entry = entries.find(e => e.id === v.eurovisionEntryId);
      return `${v.points} pts: ${entry?.country || 'Unknown'}`;
    }).join('\n');

    return `Οι ψήφοι μου για την Eurovision ${year} στο INFE Greece Poll:\n\n${voteList}\n\nΨήφισε κι εσύ εδώ:`;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://infepoll.infegreece.com';
  const fullText = getShareText();
  const encodedText = encodeURIComponent(fullText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    viber: `viber://forward?text=${encodedText}%20${encodedUrl}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=Eurovision ${year} Poll Results&body=${encodedText}%20${encodedUrl}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${fullText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Αντιγράφηκε!", description: "Οι ψήφοι σας αντιγράφηκαν στο πρόχειρο." });
  };

  // SVGs for missing icons
  const BlueSkyIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 10.8c-1.32-2.34-4.57-5.11-7.14-6.3C3.39 3.79 2 4.38 2 6c0 1.2 1.1 4.7 2.1 6.1 1.1 1.5 3.1 1.9 4.4 1.7-1.3.2-3.3.6-4.4 2.1-1 1.4-2.1 4.9-2.1 6.1 0 1.62 1.39 2.21 2.86 1.5 2.57-1.19 5.82-3.96 7.14-6.3 1.32 2.34 4.57 5.11 7.14 6.3 1.47.71 2.86.12 2.86-1.5 0-1.2-1.1-4.7-2.1-6.1-1.1-1.5-3.1-1.9-4.4-1.7 1.3-.2 3.3-.6 4.4-2.1 1-1.4 2.1-4.9 2.1-6.1 0-1.62-1.39-2.21-2.86-1.5-2.57 1.19-5.82 3.96-7.14 6.3z" />
    </svg>
  );

  const ViberIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M17.51 19.19a14.16 14.16 0 0 1-3.66 1.11c-.55.1-1.1.13-1.66.1a14.12 14.12 0 0 1-5.32-1.58A15.35 15.35 0 0 1 2.38 13.9a14.07 14.07 0 0 1-1.57-5.31c-.03-.56 0-1.11.1-1.67a14.2 14.2 0 0 1 1.11-3.66A1 1 0 0 1 3 2.62a1 1 0 0 1 1.19.38 12.2 12.2 0 0 0 1.38 2c.28.32.19.82-.18 1L4.2 6.84a12.08 12.08 0 0 0 5 5c.28.28.66.18.84-.19l.84-1.19c.2-.37.7-.46 1-.18a12.2 12.2 0 0 0 2 1.38 1 1 0 0 1 .38 1.19 1 1 0 0 1-.64.64zM16.5 2a5.5 5.5 0 0 1 5.5 5.5 1 1 0 0 1-2 0 3.5 3.5 0 0 0-3.5-3.5 1 1 0 0 1 0-2zm3 0a8.5 8.5 0 0 1 8.5 8.5 1 1 0 0 1-2 0 6.5 6.5 0 0 0-6.5-6.5 1 1 0 0 1 0-2z" />
    </svg>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold rounded-full h-14 px-8 shadow-xl shadow-green-500/20 animate-bounce">
          <Share2 className="mr-2 h-5 w-5" /> Κοινοποίηση Αποτελεσμάτων {year}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 text-center">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline font-bold">Μοιραστείτε το Top 10 σας!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Συγχαρητήρια! Συμπληρώσατε όλους τους βαθμούς για το {year}. 
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 p-4 rounded-xl text-left text-xs font-mono my-4 max-h-[150px] overflow-y-auto border">
          <pre className="whitespace-pre-wrap">{fullText}</pre>
        </div>

        <div className="grid grid-cols-4 gap-4 py-4">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-blue-600 hover:text-white" asChild>
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5" /></a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-black hover:text-white" asChild>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5" /></a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-blue-400 hover:text-white" asChild>
            <a href={shareLinks.bluesky} target="_blank" rel="noopener noreferrer"><BlueSkyIcon /></a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-green-500 hover:text-white" asChild>
            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-5 w-5" /></a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-purple-600 hover:text-white" asChild>
            <a href={shareLinks.viber} target="_blank" rel="noopener noreferrer"><ViberIcon /></a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-primary hover:text-white" asChild>
            <a href={shareLinks.email}><Mail className="h-5 w-5" /></a>
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={copyToClipboard}>
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>

        <DialogFooter>
          <DialogTrigger asChild>
            <Button className="w-full h-12 rounded-xl font-bold">Κλείσιμο</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
