
"use client";

import { useState, useEffect } from 'react';
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
import { Star, CheckCircle2, Trophy, ShieldAlert, Lock, AlertTriangle, RotateCcw } from 'lucide-react';
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

  // Synchronize internal state when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setScore(userScore || 0);
      setFeedback(""); 
    }
  }, [isOpen, userScore]);

  const handleSubmit = () => {
    onVote?.(score, feedback);
    setIsOpen(false);
  };

  const points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  if (disabled) {
    return (
      <Button 
        className="w-full flex items-center gap-2 h-11 rounded-xl font-bold opacity-70 cursor-not-allowed bg-muted text-muted-foreground border-dashed border-2 hover:bg-muted" 
        variant="outline"
        disabled
      >
        <Lock className="h-4 w-4" />
        {hasVoted ? `Ψηφίσατε (${userScore} π.)` : "Η ψηφοφορία έκλεισε"}
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
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Επιλέξτε Βαθμολογία</label>
            <Select value={score.toString()} onValueChange={(v) => setScore(parseInt(v))}>
              <SelectTrigger className="h-14 rounded-2xl border-2 text-lg font-bold">
                <SelectValue placeholder="Πόντοι" />
              </SelectTrigger>
              <SelectContent>
                {points.map((p) => (
                  <SelectItem 
                    key={p} 
                    value={p.toString()} 
                    disabled={p !== 0 && usedPoints.has(p) && p !== userScore}
                  >
                    <div className="flex items-center gap-2">
                      {p === 0 ? <RotateCcw className="h-4 w-4 text-muted-foreground" /> : <Trophy className="h-4 w-4 text-primary" />}
                      <span>
                        {p === 0 ? "0 Πόντοι (Αφαίρεση Ψήφου)" : `${p} Πόντοι`}
                        {p !== 0 && usedPoints.has(p) && p !== userScore && " (Χρησιμοποιήθηκε)"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {score === 0 && hasVoted && (
              <p className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-1 ml-1">
                <AlertTriangle className="h-3 w-3" /> Προσοχή: Η ψήφος σας θα διαγραφεί.
              </p>
            )}
          </div>
          <Textarea 
            placeholder="Προσθέστε ένα σχόλιο για την εμφάνιση (προαιρετικά)..." 
            value={feedback} 
            onChange={(e) => setFeedback(e.target.value)} 
            className="min-h-[100px] rounded-2xl" 
          />
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            className={`w-full h-14 text-xl font-bold rounded-2xl ${score === 0 ? 'bg-destructive hover:bg-destructive/90' : ''}`}
          >
            {score === 0 ? "Αφαίρεση Ψήφου" : "Υποβολή Βαθμολογίας"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
