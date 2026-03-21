
export type ContestStage = 'Final' | 'Semi-Final 1' | 'Semi-Final 2' | 'Prequalification' | 'Eurodromio' | 'Be.So.' | 'Mu.Si.Ka.';

export interface Entry {
  id: string;
  country: string;
  flagUrl?: string;
  artist: string;
  songTitle: string;
  year: number;
  videoUrl: string;
  stage: ContestStage;
  thumbnailUrl?: string;
  totalPoints?: number;
  voteCount?: number;
}

export interface Vote {
  id: string;
  userId: string;
  eurovisionEntryId: string;
  year: number;
  points: number;
  votedAt: string;
  feedback?: string;
}

export interface YearMetadata {
  id: string; // The year as string
  description: string;
  isVotingOpen?: boolean; // Admin toggle
  logoUrl?: string; // Custom logo override
}

export interface ScoreboardItem {
  entryId: string;
  entry: Entry;
  totalPoints: number;
  voteCount: number;
  averageScore: number;
  rank: number;
}
