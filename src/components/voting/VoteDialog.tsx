
"use client";

import { useState } from 'react';
import { Entry } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Star, CheckCircle2, Info, Trophy, Share2, Facebook, Twitter, Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface VoteDialogProps {
  entry: Entry;
  onVote?: (score: number, feedback: string) => void;
  hasVoted?: boolean;
  userScore?: number;
  usedPoints?: Set<number>;
}

export function VoteDialog({ entry, onVote, hasVoted, userScore, usedPoints = new Set() }: VoteDialogProps) {
  const [score, setScore] = useState<number>(userScore || 0);
  const [feedback, setFeedback] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (score === 0) return;
    onVote?.(score, feedback);
    setShowShare(true);
    toast({
      title: "Η ψήφος καταχωρήθηκε!",
      description: `Δώσατε ${score} πόντους στην συμμετοχή: ${entry.country}!`,
    });
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setShowShare(false), 300);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://infepoll.infegreece.com';
  const shareText = `Μόλις έδωσα ${score} πόντους στο τραγούδι "${entry.songTitle}" (${entry.artist}) για την ${entry.country} στο INFE Greece Eurovision Poll! Ψήφισε κι εσύ εδώ:`;
  
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    viber: `viber://forward?text=${encodedText}%20${encodedUrl}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=Eurovision Poll Vote&body=${encodedText}%20${encodedUrl}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Αντιγράφηκε!", description: "Το κείμενο κοινοποίησης αντιγράφηκε στο πρόχειρο." });
  };

  const points = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  // Inline SVGs for missing brand icons in lucide
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

  if (showShare) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 text-center">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-headline font-bold">Ευχαριστούμε για την ψήφο!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Δώσατε <strong>{score} πόντους</strong> στην {entry.country}. Μοιραστείτε το με την παρέα σας!
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4 py-8">
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
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:bg-pink-600 hover:text-white" onClick={() => toast({ title: "Instagram/TikTok", description: "Αντιγράψτε το σύνδεσμο και επικολλήστε τον στο story σας!" })}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => handleClose(false)} className="w-full h-12 rounded-xl font-bold">
              Κλείσιμο
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button 
          className="flex-1 flex items-center gap-2 h-11 rounded-xl font-bold transition-all hover:scale-[1.02]" 
          variant={hasVoted ? "secondary" : "default"}
        >
          {hasVoted ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Star className="h-4 w-4" />}
          {hasVoted ? `Ψηφίσατε (${userScore} π.)` : "Ψηφίστε Τώρα"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            Ψήφος για: {entry.country}
            {hasVoted && <Badge variant="outline" className="ml-2 border-primary text-primary bg-primary/5">Επεξεργασία</Badge>}
          </DialogTitle>
          <DialogDescription className="text-base">
            Επιλέξτε βαθμολογία για την εμφάνιση: {entry.artist}. Κάθε βαθμός χρησιμοποιείται μία φορά ανά έτος.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Βαθμοί</label>
            <Select 
              value={score > 0 ? score.toString() : ""} 
              onValueChange={(v) => setScore(parseInt(v))}
            >
              <SelectTrigger className="h-14 rounded-2xl border-2 bg-muted/20 text-lg font-bold">
                <SelectValue placeholder="Πόσους πόντους;" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                {points.map((p) => {
                  const isUsedByOther = usedPoints.has(p) && p !== userScore;
                  return (
                    <SelectItem 
                      key={p} 
                      value={p.toString()} 
                      disabled={isUsedByOther}
                      className="h-12 font-bold focus:bg-primary focus:text-primary-foreground"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="flex items-center gap-2">
                          <Trophy className={`h-4 w-4 ${p === 12 ? 'text-yellow-500' : p === 10 ? 'text-slate-400' : 'text-muted-foreground'}`} />
                          {p} Πόντοι
                        </span>
                        {isUsedByOther && <span className="text-[10px] uppercase tracking-tighter opacity-50 italic">Έχει χρησιμοποιηθεί</span>}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Σχόλια (Προαιρετικά)</label>
            <Textarea
              placeholder="Πώς σας φάνηκε η σκηνική παρουσία και τα φωνητικά;"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] bg-muted/20 border-2 rounded-2xl p-4 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSubmit} 
            disabled={score === 0 || (usedPoints.has(score) && score !== userScore)} 
            className="w-full h-14 text-xl font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            {hasVoted ? "Ενημέρωση Ψήφου" : "Υποβολή Βαθμολογίας"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
