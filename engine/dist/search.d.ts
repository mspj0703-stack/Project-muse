import { type Song } from "./types.js";
/** Local title/artist/alias search: no live API or automatic transliteration. */
export declare function normalizeSearchText(input: string): string;
export declare function searchCatalog(catalog: readonly Song[], query: string, limit?: number): Song[];
