import { FEATURE_KEYS } from "./types.js";
export const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
export const isUnit = (n) => n !== undefined && Number.isFinite(n) && n >= 0 && n <= 1;
export function normalizedTerms(value) {
    return new Set(value.map(v => v.normalize("NFKC").trim().toLocaleLowerCase()).filter(Boolean));
}
export function jaccard(a, b) {
    const x = normalizedTerms(a), y = normalizedTerms(b);
    if (!x.size || !y.size)
        return null;
    let matched = 0;
    for (const t of x)
        if (y.has(t))
            matched++;
    return matched / (x.size + y.size - matched);
}
export function latestRatings(ratings) {
    const latest = new Map();
    for (const rating of ratings)
        latest.set(rating.songId, rating);
    return [...latest.values()];
}
export const signedWeight = {
    seed: 3, love: 3, like: 1.5, neutral: 0, dislike: -2, skip: 0
};
export function audioSimilarity(a, b) {
    const diffs = [];
    for (const key of FEATURE_KEYS) {
        const x = a.features[key], y = b.features[key];
        if (isUnit(x) && isUnit(y))
            diffs.push(Math.abs(x - y));
    }
    const values = [];
    if (diffs.length >= 2)
        values.push({ value: 1 - diffs.reduce((x, y) => x + y, 0) / diffs.length, weight: 0.7 });
    const tags = jaccard(a.tags, b.tags);
    if (tags !== null)
        values.push({ value: tags, weight: 0.2 });
    if (a.vocal && b.vocal)
        values.push({ value: a.vocal === b.vocal ? 1 : 0, weight: 0.1 });
    if (!values.length)
        return null;
    return clamp(values.reduce((sum, x) => sum + x.value * x.weight, 0) / values.reduce((sum, x) => sum + x.weight, 0));
}
export function categorySimilarity(a, b) {
    const domains = jaccard(a.domains, b.domains);
    const genres = jaccard(a.genres, b.genres);
    const values = [{ value: domains, weight: 0.4 }, { value: genres, weight: 0.6 }]
        .filter((x) => x.value !== null);
    if (!values.length)
        return null;
    return values.reduce((s, x) => s + x.value * x.weight, 0) / values.reduce((s, x) => s + x.weight, 0);
}
