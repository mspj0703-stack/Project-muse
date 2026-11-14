import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../catalog.js';
import { searchCatalog, nextProbe, buildTasteProfile, recommend } from '../engine/dist/index.js';

test('pilot contains at least 50 unique songs in target categories',()=>{
  assert.ok(CATALOG.length>=50);
  assert.equal(new Set(CATALOG.map(x=>x.id)).size,CATALOG.length);
  for(const d of ['jpop','anime','vocaloid','game_ost']) assert.ok(CATALOG.some(x=>x.domains.includes(d)));
});
test('pilot feature scores are finite 0..1 and labels present',()=>{
 for(const song of CATALOG){
  assert.ok(song.id && song.title && song.artist && song.genres.length && song.domains.length);
  for (const score of Object.values(song.features)) assert.ok(score>=0&&score<=1);
 }
});
test('multilingual searches find demo songs',()=>{
  assert.ok(searchCatalog(CATALOG,'푸름과 여름').some(x=>x.title==='青と夏'));
  assert.ok(searchCatalog(CATALOG,'Yorushika').some(x=>x.artist==='ヨルシカ'));
  assert.ok(searchCatalog(CATALOG,'원신').some(x=>x.title==='Rex Incognito'));
});
test('end-to-end engine journey: choose 5, probe 10, recommend up to 10',()=>{
 const seeds=CATALOG.slice(0,5).map(x=>({songId:x.id,kind:'seed'}));
 const ratings=[...seeds];
 for(let i=0;i<10;i++){
  const next=nextProbe(CATALOG,ratings);
  assert.ok(next,'test catalog should be large enough');
  assert.ok(!ratings.some(r=>r.songId===next.id));
  ratings.push({songId:next.id,kind:i===1?'skip':'like'});
 }
 const profile=buildTasteProfile(CATALOG,ratings);
 const recs=recommend(CATALOG,ratings,[],10);
 assert.ok(profile.likedCount>=5);
 assert.equal(recs.length,10);
 assert.ok(recs.every(r=>!ratings.some(x=>x.songId===r.song.id)));
 assert.ok(recs.every(r=>r.score.score>=0 && r.score.score<=1));
});
