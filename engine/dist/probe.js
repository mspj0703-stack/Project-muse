import { audioSimilarity, clamp, latestRatings, signedWeight } from "./utils.js";
/** Choose next probe around uncertain preference boundaries, while avoiding repeats and near-duplicates. */
export function nextProbe(catalog, history) {
    const byId = new Map(catalog.map(s => [s.id, s]));
    const historyNow = latestRatings(history).filter(r => byId.has(r.songId));
    const seen = new Set(historyNow.map(r => r.songId));
    const positives = historyNow.filter(r => signedWeight[r.kind] > 0).map(r => byId.get(r.songId));
    const recentlySeen = historyNow.slice(-5).map(r => byId.get(r.songId));
    const choices = [...byId.values()].filter(s => !seen.has(s.id));
    if (!choices.length)
        return null;
    if (!positives.length)
        return choices.sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
    const scored = choices.map(song => {
        const match = Math.max(0, ...positives.map(s => audioSimilarity(song, s) ?? 0));
        const uncertain = 1 - Math.abs(match - 0.55) / 0.55;
        const diversity = recentlySeen.length ? 1 - Math.max(0, ...recentlySeen.map(s => audioSimilarity(song, s) ?? 0)) : 1;
        // Encourage probing ambiguous music but still near plausible preferences.
        return { song, value: clamp(uncertain) * 0.7 + clamp(diversity) * 0.3 };
    }).sort((a, b) => b.value - a.value || a.song.id.localeCompare(b.song.id));
    return scored[0]?.song ?? null;
}
