import { type Song } from "./types.js";

/** Local title/artist/alias search: no live API or automatic transliteration. */
export function normalizeSearchText(input: string): string {
  return input.normalize("NFKC").toLocaleLowerCase().replace(/[\p{P}\p{S}\p{Z}\s]+/gu, "").trim();
}

export function searchCatalog(catalog: readonly Song[], query: string, limit = 20): Song[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError("limit must be 1..100");
  const key = normalizeSearchText(query);
  if (!key) return [];
  return catalog.flatMap(song => {
    const fields = [song.title, song.titleKo ?? "", song.artist, ...(song.aliases ?? [])].map(normalizeSearchText);
    const exact = fields.some(field=>field===key);
    const prefix = fields.some(field=>field.startsWith(key));
    const contains = fields.some(field=>field.includes(key));
    const rank = exact ? 3 : prefix ? 2 : contains ? 1 : 0;
    return rank ? [{ song, rank }] : [];
  }).sort((a,b)=>b.rank-a.rank || a.song.title.localeCompare(b.song.title) || a.song.id.localeCompare(b.song.id))
    .slice(0,limit).map(x=>x.song);
}
