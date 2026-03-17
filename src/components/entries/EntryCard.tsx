
"use client";

import { useState } from 'react';
import { Entry } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic2, MapPin, Play, Layers } from 'lucide-react';
import { VoteDialog } from '@/components/voting/VoteDialog';

interface EntryCardProps {
  entry: Entry;
  onVote?: (score: number, feedback: string) => void;
  hasVoted?: boolean;
}

export function EntryCard({ entry, onVote, hasVoted }: EntryCardProps) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <Card className="overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all border-muted/50">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {showVideo ? (
          <iframe
            src={entry.videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <>
            <img
              src={entry.thumbnailUrl || `https://picsum.photos/seed/${entry.id}/600/338`}
              alt={entry.songTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                onClick={() => setShowVideo(true)} 
                variant="secondary" 
                size="icon" 
                className="h-16 w-16 rounded-full bg-primary/90 hover:bg-primary text-white"
              >
                <Play className="h-8 w-8 fill-current" />
              </Button>
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[10px] py-0">
                {entry.stage}
              </Badge>
            </div>
          </>
        )}
      </div>
      
      <CardHeader className="p-4 space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="flex items-center gap-1.5 border-accent text-accent">
            <MapPin className="h-3 w-3" />
            {entry.country}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">{entry.year}</span>
        </div>
        <h3 className="text-xl font-headline font-bold leading-tight line-clamp-1">{entry.songTitle}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Mic2 className="h-3.5 w-3.5" />
          {entry.artist}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2">
          <VoteDialog entry={entry} onVote={onVote} hasVoted={hasVoted} />
        </div>
      </CardContent>
    </Card>
  );
}
