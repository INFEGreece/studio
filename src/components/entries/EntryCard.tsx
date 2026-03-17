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
}

/**
 * Transforms a standard YouTube URL into an embeddable URL.
 */
function getEmbedUrl(url: string) {
  if (!url) return '';
  
  // If it's already an embed URL, return it
  if (url.includes('/embed/')) return url;

  // Handle watch?v= format
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
  }

  return url;
}

export function EntryCard({ entry, onVote, hasVoted }: EntryCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const embedUrl = getEmbedUrl(entry.videoUrl);
  const flagUrl = entry.flagUrl || getFlagUrl(entry.country);

  return (
    <Card className="overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all border-muted/50">
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
              <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[10px] py-0 border-white/10 text-white">
                {entry.stage}
              </Badge>
            </div>
          </>
        )}
      </div>
      
      <CardHeader className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={flagUrl} 
              alt="" 
              className="h-4 w-6 object-cover rounded-sm shadow-sm border border-border/50" 
            />
            <Badge variant="outline" className="flex items-center gap-1 border-accent/50 text-accent bg-accent/5">
              <MapPin className="h-3 w-3" />
              {entry.country}
            </Badge>
          </div>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none font-bold text-xs px-2 py-0">
            {entry.year}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-headline font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {entry.songTitle}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mic2 className="h-3.5 w-3.5 text-primary/70" />
            {entry.artist}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2">
          <VoteDialog entry={entry} onVote={onVote} hasVoted={hasVoted} />
        </div>
      </CardContent>
    </Card>
  );
}
