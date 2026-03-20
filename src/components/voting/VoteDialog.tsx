
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
import { Star, CheckCircle2, Trophy, ShieldAlert } from 'lucide-react';
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
    toast({
      title: "Η ψήφος καταχωρήθηκε!",
      description: `Δώσατε ${score} πόντους στην συμμετοχή: ${entry.country}!`,
    });
  };

  const points = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  if (disabled) {
    return (
      <Button 
        className="w-full flex items-center gap-2 h-11 rounded-xl font-bold opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-dashed border-2" 
        variant="outline"
        disabled
      >
        <ShieldAlert className="h-4 w-4" />
        Μη Διαθέσιμο
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
