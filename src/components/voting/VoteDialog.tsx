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
import { Star, CheckCircle2, Info, Trophy } from 'lucide-react';
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
  const { toast } = useToast();

  const handleSubmit = () => {
    if (score === 0) return;
    onVote?.(score, feedback);
    setIsOpen(false);
    toast({
      title: "Vote Cast!",
      description: `You gave ${score} points to ${entry.country}!`,
    });
  };

  const points = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="flex-1 flex items-center gap-2 h-11 rounded-xl font-bold transition-all hover:scale-[1.02]" 
          variant={hasVoted ? "secondary" : "default"}
        >
          {hasVoted ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Star className="h-4 w-4" />}
          {hasVoted ? `Voted (${userScore} pts)` : "Cast Vote"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            Vote for {entry.country}
            {hasVoted && <Badge variant="outline" className="ml-2 border-primary text-primary bg-primary/5">Editing</Badge>}
          </DialogTitle>
          <DialogDescription className="text-base">
            Assign points to {entry.artist}'s performance. You can only use each score once per year.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Points</label>
            <Select 
              value={score > 0 ? score.toString() : ""} 
              onValueChange={(v) => setScore(parseInt(v))}
            >
              <SelectTrigger className="h-14 rounded-2xl border-2 bg-muted/20 text-lg font-bold">
                <SelectValue placeholder="How many points?" />
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
                          {p} Points
                        </span>
                        {isUsedByOther && <span className="text-[10px] uppercase tracking-tighter opacity-50 italic">Already Assigned</span>}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-muted/50 p-3 rounded-xl">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Eurovision standard points: 1-8, 10, and the legendary 12 points!</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Comments (Optional)</label>
            <Textarea
              placeholder="What did you think of the staging and vocals?"
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
            {hasVoted ? "Update My Vote" : "Submit Score"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
