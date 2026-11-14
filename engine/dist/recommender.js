import { audioSimilarity, categorySimilarity, clamp, isUnit, latestRatings, signedWeight } from "./utils.js";
const WEIGHTS = { audio: 0.55, graph: 0.20, category: 0.15, discovery: 0.10 };
function bestWeightedSimilarity(candidate, positive, fn) {
    const similarities = positive.flatMap(p => {
        const score = fn(candidate, p.song);
        return score === null ? [] : [{ score, weight: Math.sqrt(p.weight) }];
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    if (!similarities.length)
        return null;
    return clamp(similarities.reduce((sum, x) => sum + x.score * x.weight, 0) / similarities.reduce((sum, x) => sum + x.weight, 0));
}
function graphStrength(candidate, likedIds, edges) {
    let best = null;
    for (const e of edges) {
        if (!isUnit(e.strength))
            continue;
        if ((e.targetId === candidate.id && likedIds.has(e.sourceId)) || (e.sourceId === candidate.id && likedIds.has(e.targetId))) {
            best = Math.max(best ?? 0, e.strength);
        }
    }
    return best;
}
function scoreCandidate(candidate, positives, negatives, edges) {
    const likedIds = new Set(positives.map(p => p.song.id));
    const audio = bestWeightedSimilarity(candidate, positives, audioSimilarity);
    const category = bestWeightedSimilarity(candidate, positives, categorySimilarity);
    const graph = graphStrength(candidate, likedIds, edges);
    const discovery = isUnit(candidate.popularity) ? 1 - candidate.popularity : null;
    // Never recommend from novelty alone, and never infer a missing feature.
    if ((audio ?? 0) <= 0 && (category ?? 0) <= 0 && (graph ?? 0) <= 0)
        return null;
    const possibleComponents = [
        { name: "audio", value: audio }, { name: "graph", value: graph }, { name: "category", value: category }, { name: "discovery", value: discovery }
    ];
    const components = possibleComponents.filter((x) => x.value !== null);
    const weighted = components.reduce((sum, x) => sum + x.value * WEIGHTS[x.name], 0);
    const totalWeight = components.reduce((sum, x) => sum + WEIGHTS[x.name], 0);
    const penalty = Math.max(0, ...negatives.map(n => audioSimilarity(candidate, n) ?? 0)) * 0.22;
    return {
        audio, graph, category, discovery, penalty: +penalty.toFixed(4),
        score: +clamp(weighted / totalWeight - penalty).toFixed(4),
        activeComponents: components.map(x => x.name)
    };
}
function bucketFor(x) {
    if (x.audio !== null)
        return x.audio >= 0.72 ? "match" : x.audio >= 0.45 ? "adjacent" : "explore";
    return (x.graph ?? 0) >= 0.6 ? "adjacent" : "explore";
}
function reasonsFor(song, details, positives) {
    const reasons = [];
    if (details.audio !== null && details.audio >= 0.65)
        reasons.push("선호곡과 음악적 특징이 비슷함");
    const common = [...new Set(positives.flatMap(x => x.genres))].filter(t => song.genres.includes(t));
    if (common.length)
        reasons.push(`선호 장르: ${common.slice(0, 2).join(", ")}`);
    if (details.graph !== null && details.graph >= 0.5)
        reasons.push("유사곡 관계에서 연결된 곡");
    if (details.discovery !== null && details.discovery >= 0.75)
        reasons.push("상대적으로 덜 알려진 곡 탐색");
    if (!reasons.length)
        reasons.push("새로운 음악 스타일 탐색");
    return reasons.slice(0, 3);
}
/** Pure recommendation function: no network, storage, or AI service required. */
export function recommend(catalog, history, edges = [], limit = 10) {
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100)
        throw new RangeError("limit must be an integer in 1..100");
    const unique = new Map(catalog.map(s => [s.id, s]));
    const ratings = latestRatings(history);
    const positive = ratings.filter(r => signedWeight[r.kind] > 0 && unique.has(r.songId))
        .map(r => ({ song: unique.get(r.songId), weight: signedWeight[r.kind] }));
    if (!positive.length)
        return [];
    const negative = ratings.filter(r => signedWeight[r.kind] < 0 && unique.has(r.songId)).map(r => unique.get(r.songId));
    const seen = new Set(ratings.map(r => r.songId));
    const all = [...unique.values()].filter(s => !seen.has(s.id)).flatMap(song => {
        const score = scoreCandidate(song, positive, negative, edges);
        return score === null ? [] : [{ song, score, bucket: bucketFor(score), reasons: reasonsFor(song, score, positive.map(x => x.song)) }];
    });
    all.sort((a, b) => b.score.score - a.score.score || a.song.id.localeCompare(b.song.id));
    // 60% strong matches / 30% adjacent / 10% exploration. Fill any missing quota by score.
    const desired = {
        match: Math.floor(limit * 0.6),
        adjacent: Math.floor(limit * 0.3),
        explore: limit - Math.floor(limit * 0.6) - Math.floor(limit * 0.3)
    };
    const chosen = [];
    const used = new Set(), artistCounts = new Map();
    function take(song) {
        if (used.has(song.song.id))
            return false;
        const key = song.song.artist.normalize("NFKC").toLocaleLowerCase();
        if ((artistCounts.get(key) ?? 0) >= 2)
            return false;
        chosen.push(song);
        used.add(song.song.id);
        artistCounts.set(key, (artistCounts.get(key) ?? 0) + 1);
        return true;
    }
    for (const bucket of ["match", "adjacent", "explore"]) {
        let picked = 0;
        for (const song of all) {
            if (picked >= desired[bucket])
                break;
            if (song.bucket === bucket && take(song))
                picked++;
        }
    }
    for (const song of all) {
        if (chosen.length >= limit)
            break;
        take(song);
    }
    return chosen.sort((a, b) => b.score.score - a.score.score || a.song.id.localeCompare(b.song.id));
}
