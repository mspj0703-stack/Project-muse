import { type Rating, type RatingKind, type Song } from "./types.js";
export declare const clamp: (n: number, low?: number, high?: number) => number;
export declare const isUnit: (n: number | undefined) => n is number;
export declare function normalizedTerms(value: readonly string[]): Set<string>;
export declare function jaccard(a: readonly string[], b: readonly string[]): number | null;
export declare function latestRatings(ratings: readonly Rating[]): Rating[];
export declare const signedWeight: Record<RatingKind, number>;
export declare function audioSimilarity(a: Song, b: Song): number | null;
export declare function categorySimilarity(a: Song, b: Song): number | null;
