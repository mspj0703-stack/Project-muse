import { type Rating, type Song, type TasteProfile } from "./types.js";
export declare function buildTasteProfile(catalog: readonly Song[], history: readonly Rating[]): TasteProfile;
