
"use client";

import { useState } from 'react';
import { Entry } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic2, MapPin, Play, AlertCircle, ExternalLink, User, Music } from 'lucide-react';
import { VoteDialog } from '@/components/voting/VoteDialog';
import { getFlagUrl } from '@/lib/utils';
import { getEventLogo } from '@/lib/logos';
import Link from 'next/link';

function getEmbedUrl(url: string) {
  if (!url) return '';
  
  // YouTube Detection
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('/embed/')) return url;
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
    }
  }

  // Spotify Detection
  if (url.includes('spotify.com')) {
    if (url.includes('/embed/')) return url;
    const trackMatch = url.match(/track\/([^&?/\s]+)/);
    if (trackMatch && trackMatch[1]) {
      return `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator&theme=0`;
    }
    const albumMatch = url.match(/album\/([^&?/\s]+)/);
    if (albumMatch && albumMatch[1]) {
      return `https://open.spotify.com/embed/album/${albumMatch[1]}?utm_source=generator&theme=0`;
    }
  }

  return url;
}

export function EntryCard({ entry, onVote, hasVoted, userScore, usedPoints, isRestricted }: EntryCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const hasVideo = !!entry.videoUrl && entry.videoUrl.length > 5;
  const hasSpotify = !!entry.spotifyUrl && entry.spotifyUrl.length > 5;
  
  const embedUrl = hasVideo ? getEmbedUrl(entry.videoUrl) : (hasSpotify ? getEmbedUrl(entry.spotifyUrl!) : '');
  const flagUrl = entry.flagUrl || getFlagUrl(entry.country);
  const eventLogo = getEventLogo(entry.year, entry.stage);

  return (
    <Card className={`overflow-hidden group hover:shadow-2xl transition-all border-muted/50 rounded-2xl md:rounded-[1.5rem] bg-card/50 backdrop-blur-sm ${isRestricted ? 'opacity-80 grayscale-[0.5]' : ''}`}>
      <div className="relative aspect-video bg-muted overflow-hidden">
        {showPlayer && embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          ></iframe>
        ) : (
          <>
            <img
              src={entry.thumbnailUrl || flagUrl}
              alt={entry.songTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {(hasVideo || hasSpotify) && (
                <Button 
                  onClick={() => setShowPlayer(true)} 
                  variant="secondary" 
                  size="icon" 
                  className={`h-14 w-14 md:h-16 md:w-16 rounded-full text-white ${hasVideo ? 'bg-primary/90' : 'bg-green-500/90'}`}
                >
                  {hasVideo ? <Play className="h-6 w-6 md:h-8 md:w-8 fill-current" /> : <Music className="h-6 w-6 md:h-8 md:w-8" />}
                </Button>
              )}
            </div>
            
            {!logoError && (
              <div className="absolute top-2 left-2 h-10 w-16 md:h-12 md:w-20 z-10 drop-shadow-lg">
                <img 
                  src={eventLogo} 
                  alt="Event Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}

            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[9px] md:text-[10px] py-0 border-white/10 text-white font-bold">
                {entry.stage}
              </Badge>
            </div>
            
            {isRestricted && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-[2px]">
                <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl">
                  <AlertCircle className="h-4 w-4" />
                  Περιορισμός Χώρας
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 md:space-y-3 flex-1 min-w-0">
            <Link href={`/country/${encodeURIComponent(entry.country)}/`} prefetch={false}>
              <Badge variant="outline" className="flex items-center gap-1 border-accent/50 text-accent bg-accent/5 hover:bg-accent/10 transition-colors w-fit text-[9px] md:text-[11px] truncate px-2 cursor-pointer">
                <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" />
                <span className="truncate">{entry.country}</span>
              </Badge>
            </Link>
            
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
            <Link href={`/country/${encodeURIComponent(entry.country)}/`} className="h-10 w-14 md:h-12 md:w-16 bg-muted rounded border border-border/50 overflow-hidden shadow-sm hover:opacity-80 transition-opacity cursor-pointer" prefetch={false}>
              <img 
                src={flagUrl} 
                alt={`${entry.country} flag`} 
                className="w-full h-full object-cover" 
              />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-0 space-y-4">
        <div className="flex gap-2">
          {entry.bioUrl && (
            <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-widest border-primary/30 text-primary hover:bg-primary hover:text-white transition-all" asChild>
              <a href={entry.bioUrl} target="_blank" rel="noopener noreferrer">
                <User className="h-3 w-3 mr-1.5" /> Bio <ExternalLink className="h-2.5 w-2.5 ml-1" />
              </a>
            </Button>
          )}
          {hasSpotify && (
            <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-[9px] font-bold uppercase tracking-widest border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white transition-all" onClick={() => setShowPlayer(true)}>
              <Music className="h-3 w-3 mr-1.5" /> Play <Music className="h-2.5 w-2.5 ml-1" />
            </Button>
          )}
        </div>
        <VoteDialog 
          entry={entry} 
          onVote={onVote} 
          hasVoted={hasVoted} 
          userScore={userScore}
          usedPoints={usedPoints}
          disabled={isRestricted}
        />
      </CardContent>
    </Card>
  );
}

interface EntryCardProps {
  entry: Entry;
  onVote?: (score: number, feedback: string) => void;
  hasVoted?: boolean;
  userScore?: number;
  usedPoints?: Set<number>;
  isRestricted?: boolean;
}
