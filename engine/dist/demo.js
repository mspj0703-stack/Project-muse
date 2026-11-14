import { buildTasteProfile, nextProbe, recommend } from "./index.js";
// FICTIONAL TEST CATALOG: descriptive tags are test data, not assertions about real songs.
const items = [
    ["Aurora Run", "Fiction A", "jpop", "j-rock", "electric-guitar", .95, .75, .30, .65, .20, .45],
    ["Afterglow", "Fiction B", "anime", "j-rock", "electric-guitar", .85, .60, .58, .58, .30, .40],
    ["Pulse Signal", "Fiction C", "vocaloid", "electronic", "synth", .91, .83, .25, .72, .05, .97],
    ["Forgotten Pier", "Fiction D", "game_ost", "orchestral", "piano", .36, .19, .90, .54, .91, .15],
    ["Glass Moon", "Fiction E", "jpop", "ballad", "piano", .30, .28, .81, .45, .81, .20],
    ["Silver Oath", "Fiction F", "anime", "j-rock", "electric-guitar", .91, .70, .40, .64, .28, .50],
    ["Midnight Engine", "Fiction G", "jpop", "j-rock", "electric-guitar", .88, .59, .46, .75, .16, .56],
    ["Blue Comet", "Fiction H", "vocaloid", "electronic", "synth", .97, .75, .29, .82, .09, .95],
    ["Night Garden", "Fiction I", "jpop", "ballad", "piano", .34, .36, .78, .51, .83, .15],
    ["Distant Star", "Fiction J", "game_ost", "orchestral", "strings", .43, .17, .92, .64, .90, .06],
    ["Candy Voltage", "Fiction K", "anime", "j-pop", "synth", .81, .93, .12, .42, .12, .77],
    ["Gold Circuit", "Fiction L", "jpop", "j-rock", "electric-guitar", .87, .78, .25, .63, .18, .43],
    ["Quiet Archive", "Fiction M", "game_ost", "ambient", "piano", .16, .27, .77, .40, .86, .13],
    ["Rainy Console", "Fiction N", "doujin", "electronic", "synth", .66, .28, .82, .71, .24, .87],
    ["Dawn Chord", "Fiction O", "anime", "j-rock", "electric-guitar", .82, .61, .55, .72, .36, .39],
    ["Night Sails", "Fiction P", "jpop", "ballad", "piano", .41, .33, .70, .58, .72, .21],
    ["Clockwork", "Fiction Q", "game_ost", "orchestral", "strings", .58, .50, .67, .87, .75, .33],
    ["Beacon", "Fiction R", "vocaloid", "electronic", "synth", .72, .68, .49, .74, .09, .91]
];
const catalog = items.map(([title, artist, domain, genre, tag, energy, brightness, melancholy, complexity, acoustic, electronic], i) => ({
    id: `demo-${i + 1}`, title, artist, domains: [domain], genres: [genre], tags: [tag],
    features: { energy, brightness, melancholy, complexity, acoustic, electronic },
    vocal: domain === 'game_ost' ? 'instrumental' : domain === 'vocaloid' ? 'synthetic' : 'female',
    popularity: Math.round(((i * 7) % 13) / 13 * 100) / 100
}));
const history = [
    { songId: "demo-1", kind: "seed" }, { songId: "demo-2", kind: "seed" },
    { songId: "demo-3", kind: "seed" }, { songId: "demo-4", kind: "seed" },
    { songId: "demo-5", kind: "seed" }, { songId: "demo-11", kind: "dislike" }
];
const edges = [
    { sourceId: "demo-1", targetId: "demo-12", strength: .9 },
    { sourceId: "demo-3", targetId: "demo-8", strength: .82 }
];
const recs = recommend(catalog, history, edges, 10);
console.log("\n[FICTIONAL TEST SONGS / 실제 음악 아님]");
console.log("Profile:", JSON.stringify(buildTasteProfile(catalog, history), null, 2));
console.log("\nNext adaptive probe:", nextProbe(catalog, history)?.title);
console.log("\nTop recommendations:");
for (const rec of recs)
    console.log(`${rec.song.title.padEnd(21)} ${rec.score.score.toFixed(3)} ${rec.bucket.padEnd(8)} ${rec.reasons.join(" · ")}`);
