import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, buildTasteProfile, nextProbe, audioSimilarity, latestRatings } from '../dist/index.js';

const song = (id,opts={}) => ({ id, title:id, artist:opts.artist ?? id, domains:opts.domains ?? ['jpop'], genres:opts.genres ?? ['j-rock'], tags:opts.tags ?? ['guitar'], features:opts.features ?? { energy:.9, brightness:.8, melancholy:.3, complexity:.5, electronic:.4, acoustic:.2 }, vocal:opts.vocal ?? 'female', ...opts});

const a=song('a'), b=song('b',{features:{energy:.88,brightness:.82,melancholy:.32,complexity:.55,electronic:.45,acoustic:.22}}),
 c=song('c',{genres:['ambient'],tags:['piano'],features:{energy:.12,brightness:.1,melancholy:.9,complexity:.2,electronic:.1,acoustic:.99},vocal:'instrumental'}),
 d=song('d',{features:{energy:.85,brightness:.78,melancholy:.28,complexity:.49,electronic:.42,acoustic:.21}});

test('closer music is ranked above unrelated music',()=>{
 const x=recommend([a,b,c],[{songId:'a',kind:'seed'}],[],10);
 assert.equal(x[0].song.id,'b');
});
test('rated songs, including neutral and skipped, are not recommended again',()=>{
 const x=recommend([a,b,c,d],[{songId:'a',kind:'seed'},{songId:'b',kind:'neutral'},{songId:'c',kind:'skip'}]);
 assert.deepEqual(x.map(x=>x.song.id),['d']);
});
test('negative feedback lowers score for similar candidates',()=>{
 const before=recommend([a,b,c,d],[{songId:'a',kind:'seed'}]);
 const after=recommend([a,b,c,d],[{songId:'a',kind:'seed'},{songId:'d',kind:'dislike'}]);
 assert.ok(after.find(r=>r.song.id==='b').score.score < before.find(r=>r.song.id==='b').score.score);
});
test('latest rating supersedes earlier feedback',()=>{
 assert.deepEqual(latestRatings([{songId:'a',kind:'like'},{songId:'a',kind:'dislike'}]),[{songId:'a',kind:'dislike'}]);
});
test('skip is not a negative preference signal',()=>{
 const x=buildTasteProfile([a,b],[{songId:'a',kind:'seed'},{songId:'b',kind:'skip'}]);
 assert.equal(x.dislikedCount,0); assert.equal(x.likedCount,1);
});
test('no invented numeric features when data missing',()=>{
 const one=song('one',{features:{},tags:[],vocal:undefined});
 const two=song('two',{features:{},tags:[],vocal:undefined});
 assert.equal(audioSimilarity(one,two),null);
 const x=recommend([one,two],[{songId:'one',kind:'seed'}]);
 // Category alone may still support a recommendation, but audio must remain null.
 assert.equal(x[0].score.audio,null);
});
test('novelty alone cannot create recommendation',()=>{
 const empty=song('empty',{features:{},genres:[],tags:[],domains:[],vocal:undefined,popularity:0});
 const x=recommend([a,empty],[{songId:'a',kind:'seed'}]);
 assert.deepEqual(x,[]);
});
test('recommendation can use graph without audio features',()=>{
 const x=song('x',{features:{},tags:[],genres:[],domains:[],vocal:undefined});
 const out=recommend([a,x],[{songId:'a',kind:'seed'}],[{sourceId:'a',targetId:'x',strength:.9}]);
 assert.equal(out[0].score.graph,.9);
 assert.equal(out[0].score.audio,null);
});
test('catalog has at most 2 recommendations per artist',()=>{
 const others=[1,2,3,4,5].map(n=>song('same'+n,{artist:'SAME'}));
 const out=recommend([a,...others],[{songId:'a',kind:'seed'}],[],10);
 assert.equal(out.length,2);
});
test('multiple separate liked styles are retained in profile and selection',()=>{
 const p=buildTasteProfile([a,c],[{songId:'a',kind:'seed'},{songId:'c',kind:'seed'}]);
 assert.equal(p.likedCount,2);
 assert.equal(p.topGenres.length,2);
 const out=recommend([a,b,c,song('ambient2',{genres:['ambient'],tags:['piano'],features:c.features,vocal:'instrumental'})],[{songId:'a',kind:'seed'},{songId:'c',kind:'seed'}]);
 assert.equal(out.length,2);
});
test('probe excludes anything already seen and returns null if exhausted',()=>{
 assert.equal(nextProbe([a,b],[{songId:'a',kind:'seed'}]).id,'b');
 assert.equal(nextProbe([a,b],[{songId:'a',kind:'seed'},{songId:'b',kind:'skip'}]),null);
});
test('limit input rejects invalid sizes',()=>{
 assert.throws(()=>recommend([a,b],[{songId:'a',kind:'seed'}],[],0),RangeError);
});

test('search recognizes curated Korean, Japanese, and romaji aliases',async()=>{
 const {searchCatalog}=await import('../dist/index.js');
 const item=song('x',{title:'夜に駆ける',aliases:['밤을 달리다','Yoru ni Kakeru']});
 assert.equal(searchCatalog([item],'夜に駆ける')[0].id,'x');
 assert.equal(searchCatalog([item],'밤 을 달리다')[0].id,'x');
 assert.equal(searchCatalog([item],'yorunikakeru')[0].id,'x');
});
test('search returns nothing for blank query',async()=>{
 const {searchCatalog}=await import('../dist/index.js');
 assert.deepEqual(searchCatalog([a],'  '),[]);
});
