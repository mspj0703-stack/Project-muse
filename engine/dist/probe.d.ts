import { type Rating, type Song } from "./types.js";
/** Choose next probe around uncertain preference boundaries, while avoiding repeats and near-duplicates. */
export declare function nextProbe(catalog: readonly Song[], history: readonly Rating[]): Song | null;
