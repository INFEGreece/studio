
export type ContestStage = 'Final' | 'Semi-Final 1' | 'Semi-Final 2';

export interface Entry {
  id: string;
  country: string;
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

export interface ScoreboardItem {
  entryId: string;
  entry: Entry;
  totalPoints: number;
  voteCount: number;
  averageScore: number;
  rank: number;
}
