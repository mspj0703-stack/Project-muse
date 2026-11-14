import { FEATURE_KEYS } from "./types.js";
import { isUnit, latestRatings, signedWeight } from "./utils.js";
function top(entries, n) {
    return [...entries].map(([value, weight]) => ({ value, weight: Math.round(weight * 100) / 100 }))
        .sort((a, b) => b.weight - a.weight || a.value.localeCompare(b.value)).slice(0, n);
}
export function buildTasteProfile(catalog, history) {
    const byId = new Map(catalog.map(song => [song.id, song]));
    const ratings = latestRatings(history);
    const positive = ratings.filter(r => signedWeight[r.kind] > 0 && byId.has(r.songId));
    const negative = ratings.filter(r => signedWeight[r.kind] < 0 && byId.has(r.songId));
    const numerators = {};
    const denominators = {};
    const genres = new Map(), tags = new Map(), domains = new Map();
    for (const r of positive) {
        const song = byId.get(r.songId);
        const weight = signedWeight[r.kind];
        for (const key of FEATURE_KEYS) {
            const v = song.features[key];
            if (isUnit(v)) {
                numerators[key] = (numerators[key] ?? 0) + v * weight;
                denominators[key] = (denominators[key] ?? 0) + weight;
            }
        }
        for (const [items, map] of [[song.genres, genres], [song.tags, tags], [song.domains, domains]]) {
            for (const term of new Set(items))
                map.set(term, (map.get(term) ?? 0) + weight);
        }
    }
    const averages = {};
    for (const key of FEATURE_KEYS)
        if (denominators[key])
            averages[key] = Math.round((numerators[key] / denominators[key]) * 1000) / 1000;
    return {
        likedCount: positive.length,
        dislikedCount: negative.length,
        averages,
        topGenres: top(genres, 8),
        topTags: top(tags, 8),
        domains: top(domains, 6)
    };
}
