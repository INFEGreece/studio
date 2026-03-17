
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
import { Button } from '@/components/ui/button';
import { Star, CheckCircle2, Info } from 'lucide-react';
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
          className="flex-1 flex items-center gap-2" 
          variant={hasVoted ? "secondary" : "default"}
        >
          {hasVoted ? <CheckCircle2 className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          {hasVoted ? `Voted (${userScore} pts)` : "Vote"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            Vote for {entry.country}
            {hasVoted && <Badge variant="outline" className="ml-2">Editing</Badge>}
          </DialogTitle>
          <DialogDescription>
            Assign a point value to {entry.artist}'s "{entry.title}". Remember: you can only give each point value once per year!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              <Info className="h-3 w-3" />
              <span>Greyed out numbers have already been given to other countries.</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {points.map((p) => {
                const isUsedByOther = usedPoints.has(p) && p !== userScore;
                return (
                  <Button
                    key={p}
                    disabled={isUsedByOther}
                    variant={score === p ? "default" : "outline"}
                    className={`h-12 w-full text-lg font-bold relative ${score === p ? "bg-primary" : "hover:border-primary hover:text-primary"}`}
                    onClick={() => setScore(p)}
                  >
                    {p}
                    {isUsedByOther && <div className="absolute inset-0 bg-background/50 cursor-not-allowed rounded-md" />}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Why this score? (Optional)</label>
            <Textarea
              placeholder="The vocals were stunning..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] bg-secondary/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={score === 0 || (usedPoints.has(score) && score !== userScore)} className="w-full h-12 text-lg">
            {hasVoted ? "Update Vote" : "Submit Vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
