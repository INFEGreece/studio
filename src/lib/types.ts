
export interface Entry {
  id: string;
  country: string;
  artist: string;
  title: string;
  year: number;
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface Vote {
  id: string;
  userId: string;
  entryId: string;
  year: number;
  score: number;
  feedback?: string;
  createdAt: string;
}

export interface ScoreboardItem {
  entryId: string;
  entry: Entry;
  totalPoints: number;
  voteCount: number;
  averageScore: number;
  rank: number;
}
