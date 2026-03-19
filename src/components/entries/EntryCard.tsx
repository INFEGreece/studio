"use client";

import { useState } from 'react';
import { Entry } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic2, MapPin, Play } from 'lucide-react';
import { VoteDialog } from '@/components/voting/VoteDialog';
import { getFlagUrl } from '@/lib/utils';

interface EntryCardProps {
  entry: Entry;
  onVote?: (score: number, feedback: string) => void;
  hasVoted?: boolean;
  userScore?: number;
  usedPoints?: Set<number>;
}

function getEmbedUrl(url: string) {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
  }
  return url;
}

export function EntryCard({ entry, onVote, hasVoted, userScore, usedPoints }: EntryCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const embedUrl = getEmbedUrl(entry.videoUrl);
  const flagUrl = entry.flagUrl || getFlagUrl(entry.country);

  return (
    <Card className="overflow-hidden group hover:shadow-2xl transition-all border-muted/50 rounded-2xl md:rounded-[1.5rem]">
      {/* Aspect ratio preserved for responsive layout */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {showVideo ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <>
            <img
              src={entry.thumbnailUrl || flagUrl}
              alt={entry.songTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                onClick={() => setShowVideo(true)} 
                variant="secondary" 
                size="icon" 
                className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/90 text-white"
              >
                <Play className="h-6 w-6 md:h-8 md:w-8 fill-current" />
              </Button>
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[9px] md:text-[10px] py-0 border-white/10 text-white">
                {entry.stage}
              </Badge>
            </div>
          </>
        )}
      </div>
      
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 md:space-y-3 flex-1 min-w-0">
            <Badge variant="outline" className="flex items-center gap-1 border-accent/50 text-accent bg-accent/5 w-fit text-[9px] md:text-[11px] truncate px-2">
              <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" />
              <span className="truncate">{entry.country}</span>
            </Badge>
            
            <div className="space-y-0.5 md:space-y-1">
              <h3 className="text-lg md:text-xl font-headline font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {entry.songTitle}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                <Mic2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary/70 shrink-0" />
                <span className="truncate">{entry.artist}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className="bg-primary text-primary-foreground font-bold text-[10px] md:text-xs px-2 py-0.5">
              {entry.year}
            </Badge>
            <div className="h-10 w-14 md:h-12 md:w-16 bg-muted rounded border border-border/50 overflow-hidden shadow-sm">
              <img 
                src={flagUrl} 
                alt={`${entry.country} flag`} 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-0">
        <VoteDialog 
          entry={entry} 
          onVote={onVote} 
          hasVoted={hasVoted} 
          userScore={userScore}
          usedPoints={usedPoints}
        />
      </CardContent>
    </Card>
  );
}
