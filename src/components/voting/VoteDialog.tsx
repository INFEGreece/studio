
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
import { Star, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { suggestVoteFeedback } from '@/ai/flows/vote-feedback-suggester';
import { useToast } from '@/hooks/use-toast';

interface VoteDialogProps {
  entry: Entry;
  onVote?: (score: number, feedback: string) => void;
  hasVoted?: boolean;
}

export function VoteDialog({ entry, onVote, hasVoted }: VoteDialogProps) {
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (score === 0) {
      toast({
        title: "Selection required",
        description: "Please pick a score first to get an AI insight.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await suggestVoteFeedback({
        entry: {
          title: entry.title,
          artist: entry.artist,
          country: entry.country,
          year: entry.year,
        },
        score: score,
      });
      setFeedback(result.suggestion);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI insight.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
          disabled={hasVoted}
          variant={hasVoted ? "secondary" : "default"}
        >
          {hasVoted ? <CheckCircle2 className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          {hasVoted ? "Voted" : "Vote"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Vote for {entry.country}</DialogTitle>
          <DialogDescription>
            How many points would you give {entry.artist}'s "{entry.title}"?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-5 gap-2">
            {points.map((p) => (
              <Button
                key={p}
                variant={score === p ? "default" : "outline"}
                className={`h-12 w-full text-lg font-bold ${score === p ? "bg-primary" : "hover:border-primary hover:text-primary"}`}
                onClick={() => setScore(p)}
              >
                {p}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Why this score? (Optional)</label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-accent hover:text-accent/80 p-0 h-auto"
                onClick={handleSuggest}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-3 w-3 mr-1" />
                )}
                AI Suggestion
              </Button>
            </div>
            <Textarea
              placeholder="The vocals were stunning..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] bg-secondary/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={score === 0} className="w-full h-12 text-lg">
            Submit Vote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
