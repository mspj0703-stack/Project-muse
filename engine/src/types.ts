export const FEATURE_KEYS = ["energy", "brightness", "melancholy", "complexity", "acoustic", "electronic"] as const;
export type FeatureKey = typeof FEATURE_KEYS[number];
export type Domain = "jpop" | "anime" | "vocaloid" | "game_ost" | "doujin" | "other";
export type Vocal = "female" | "male" | "synthetic" | "mixed" | "instrumental";
export type RatingKind = "seed" | "love" | "like" | "neutral" | "dislike" | "skip";

export interface Song {
  id: string;
  title: string;
  /** Korean display name (translation or commonly used transliteration), if available. */
  titleKo?: string | null;
  artist: string;
  aliases?: string[];
  domains: Domain[];
  genres: string[];
  tags: string[];
  features: Partial<Record<FeatureKey, number>>;
  vocal?: Vocal;
  /** 0=least popular among a defined source set, 1=most popular. Missing is undefined. */
  popularity?: number;
}

export interface Rating { songId: string; kind: RatingKind; }
export interface SimilarEdge { sourceId: string; targetId: string; strength: number; }
export type ScorePart = "audio" | "graph" | "category" | "discovery";
export interface ScoreDetails {
  audio: number | null;
  graph: number | null;
  category: number | null;
  discovery: number | null;
  penalty: number;
  score: number;
  /** These are not calibrated probabilities. */
  activeComponents: ScorePart[];
}
export interface Recommendation {
  song: Song;
  score: ScoreDetails;
  bucket: "match" | "adjacent" | "explore";
  reasons: string[];
}
export interface TasteProfile {
  likedCount: number;
  dislikedCount: number;
  averages: Partial<Record<FeatureKey, number>>;
  topGenres: { value: string; weight: number }[];
  topTags: { value: string; weight: number }[];
  domains: { value: Domain; weight: number }[];
}
