import { type Rating, type Recommendation, type SimilarEdge, type Song } from "./types.js";
/** Pure recommendation function: no network, storage, or AI service required. */
export declare function recommend(catalog: readonly Song[], history: readonly Rating[], edges?: readonly SimilarEdge[], limit?: number): Recommendation[];
