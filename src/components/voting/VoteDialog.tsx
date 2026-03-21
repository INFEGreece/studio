
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
import { Star, CheckCircle2, Trophy, ShieldAlert, Lock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface VoteDialogProps {
  entry: Entry;
  onVote?: (score: number, feedback: string) => void;
  hasVoted?: boolean;
  userScore?: number;
  usedPoints?: Set<number>;
  disabled?: boolean;
}

export function VoteDialog({ entry, onVote, hasVoted, userScore, usedPoints = new Set(), disabled }: VoteDialogProps) {
  const [score, setScore] = useState<number>(userScore || 0);
  const [feedback, setFeedback] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (score === 0) return;
    onVote?.(score, feedback);
    setIsOpen(false);
  };

  const points = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  if (disabled) {
    return (
      <Button 
        className="w-full flex items-center gap-2 h-11 rounded-xl font-bold opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-dashed border-2" 
        variant="outline"
        disabled
      >
        <Lock className="h-4 w-4" />
        Voting Closed
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="flex-1 flex items-center gap-2 h-11 rounded-xl font-bold transition-all hover:scale-[1.02] w-full" 
          variant={hasVoted ? "secondary" : "default"}
        >
          {hasVoted ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Star className="h-4 w-4" />}
          {hasVoted ? `Ψηφίσατε (${userScore} π.)` : "Ψηφίστε Τώρα"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Ψήφος: {entry.country}
          </DialogTitle>
          <DialogDescription>
            {entry.artist} - {entry.songTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Βαθμοί</label>
            <Select value={score > 0 ? score.toString() : ""} onValueChange={(v) => setScore(parseInt(v))}>
              <SelectTrigger className="h-14 rounded-2xl border-2 text-lg font-bold"><SelectValue placeholder="Πόντοι" /></SelectTrigger>
              <SelectContent>
                {points.map((p) => (
                  <SelectItem key={p} value={p.toString()} disabled={usedPoints.has(p) && p !== userScore}>
                    {p} Πόντοι {usedPoints.has(p) && p !== userScore && "(Χρησιμοποιήθηκε)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Σχόλια..." value={feedback} onChange={(e) => setFeedback(e.target.value)} className="min-h-[100px] rounded-2xl" />
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={score === 0} className="w-full h-14 text-xl font-bold rounded-2xl">Υποβολή</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
