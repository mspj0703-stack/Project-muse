import { CATALOG } from './catalog.js';
import { recommend, nextProbe, buildTasteProfile, searchCatalog } from './engine/dist/index.js';

const STORAGE_KEY = 'project-muse-alpha02-session-v1';
const STEP_TITLES = {select:'선호곡 선택',probe:'취향 테스트',results:'추천 결과'};
const DOMAIN_NAMES = {jpop:'J-POP',anime:'애니송',vocaloid:'보컬로이드',game_ost:'게임 OST',doujin:'동인 음악',other:'기타'};
const FEATURE_NAMES = {energy:'에너지',brightness:'밝은 분위기',melancholy:'감성적인 분위기',complexity:'복합적인 구성',electronic:'전자음',acoustic:'어쿠스틱'};
const GENRE_NAMES = {'j-rock':'J-ROCK','j-pop':'J-POP','electro-pop':'일렉트로 팝','electro-rock':'일렉트로 록','ballad':'발라드','hip-hop':'힙합','vocaloid-pop':'보컬로이드 팝','vocaloid-rock':'보컬로이드 록','game-electronic':'게임 전자음악','game-orchestral':'게임 오케스트라','ambient':'앰비언트','jazz':'재즈'};
const RATINGS = [{kind:'love',label:'매우 좋아요',symbol:'♥'},{kind:'like',label:'좋아요',symbol:'↗'},{kind:'neutral',label:'보통이에요',symbol:'─'},{kind:'dislike',label:'별로예요',symbol:'×'}];
const CATALOG_IDS = new Set(CATALOG.map(x=>x.id));
const app = document.querySelector('#app');
const steps = document.querySelector('#steps');
const initialSession = () => ({seeds:[], probes:[], feedback:[]});
let session = readSession();
let query = '';
let category = 'all';
let pageLimit = 18;

function readSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !Array.isArray(parsed.seeds) || !Array.isArray(parsed.probes) || !Array.isArray(parsed.feedback)) return initialSession();
    const seeds = [...new Set(parsed.seeds)].filter(id=>typeof id==='string' && CATALOG_IDS.has(id)).slice(0,10);
    const clean = entries => entries.filter(x=>x && CATALOG_IDS.has(x.songId) && ['love','like','neutral','dislike','skip'].includes(x.kind)).slice(0,100);
    return { seeds, probes:clean(parsed.probes).slice(0,10), feedback:clean(parsed.feedback) };
  } catch { return initialSession(); }
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* Private/blocked storage: session still works in memory */ } }
function history() {
  return [...session.seeds.map(songId=>({songId,kind:'seed'})),...session.probes,...session.feedback];
}
function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function route() { const raw = location.hash.replace(/^#/, '').replace(/^\//,''); return ['select','probe','results'].includes(raw) ? raw : 'select'; }
function navigate(next) { if(location.hash !== '#'+next) location.hash = '#'+next; render(); window.scrollTo({top:0,behavior:'instant'}); }
function songById(id) { return CATALOG.find(s=>s.id===id); }
function prettyDomain(song) { return DOMAIN_NAMES[song.domains.find(d=>d!=='jpop')] || 'J-POP'; }
function art(song) { const main= song.domains.includes('vocaloid') ? 'vocaloid' : song.domains.includes('game_ost')?'game_ost':song.domains.includes('anime')?'anime':'jpop'; const symbol = ({jpop:'♪',anime:'✧',vocaloid:'♮',game_ost:'◈'})[main]; return `<span class="artwork art-${main}" aria-hidden="true"><span class="art-symbol">${symbol}</span></span>`; }
function listenUrl(song) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(song.artist+' '+song.title+' official'); }
function navRender(active) {
  const ids=['select','probe','results'];
  steps.innerHTML=ids.map((s,i)=>{
    const st=ids.indexOf(active);
    const cls=i===st?'active':i<st?'done':'';
    const canGo=s==='select'||(s==='probe'&&session.seeds.length>=5)||(s==='results'&&session.probes.length>=10);
    return `${i?'<span class="step-line" aria-hidden="true"></span>':''}<a class="step-link ${cls}" href="${canGo?'#'+s:'#'+active}" aria-current="${i===st?'step':'false'}"><span class="step-number">0${i+1}</span><span>${STEP_TITLES[s]}</span></a>`;
  }).join('');
}
function filterCatalog() {
  let items = query.trim() ? searchCatalog(CATALOG,query,100) : CATALOG;
  if(category!=='all') items=items.filter(s=>s.domains.includes(category));
  return items;
}
function tilesRender() {
  const items=filterCatalog();
  const visible=items.slice(0,pageLimit);
  const selected=new Set(session.seeds);
  return `<div class="catalog-note"><span>${query?'검색 결과':'수록 곡'} <strong>${items.length}</strong>곡</span><span>곡명을 누르면 선택돼요</span></div>
  ${visible.length?`<div class="song-grid">${visible.map(song => `<button class="song-tile ${selected.has(song.id)?'selected':''}" type="button" data-action="toggle" data-id="${song.id}" aria-pressed="${selected.has(song.id)}">
    ${art(song)}<span class="song-body"><span class="song-title" title="${esc(song.title)}">${esc(song.title)}</span><span class="song-artist">${esc(song.artist)}</span><span class="song-type">${esc(prettyDomain(song))}</span></span><span class="checkmark">✓</span>
  </button>`).join('')}</div>`:`<div class="empty-results">검색 결과가 없어요.<br>다른 표기나 아티스트명으로 찾아보세요.</div>`}
  ${items.length>pageLimit?`<div style="text-align:center;margin-top:20px"><button class="secondary-btn" type="button" data-action="more">더 보기 <span style="color:var(--muted)">${items.length-pageLimit}곡 남음</span></button></div>`:''}`;
}
function selectionDetail() {
  const n=session.seeds.length;
  return `<div class="side-top"><h3>내가 고른 노래</h3><span class="side-count">${n} / 10</span></div>
    <div class="meter"><div class="meter-fill" style="width:${Math.min(n/5*100,100)}%"></div></div>
    <p class="small-muted">${n<5?`최소 5곡이 필요해요. <strong>${5-n}곡</strong> 더 골라주세요.`:'준비됐어요. 최대 10곡까지 고를 수 있어요.'}</p>
    <div class="selected-list">${n?session.seeds.map((id,i)=>{const s=songById(id);return `<div class="selected-item"><span class="selected-num">${String(i+1).padStart(2,'0')}</span><span class="selected-name" title="${esc(s.title)}">${esc(s.title)}</span><button class="remove-btn" type="button" data-action="toggle" data-id="${id}" aria-label="${esc(s.title)} 선택 해제">×</button></div>`;}).join(''):`<div class="empty-selection">고른 노래가 여기에 표시돼요.</div>`}</div>
    <button class="primary-btn full" data-action="start" type="button" ${n<5?'disabled':''}>다음: 취향 테스트 <span aria-hidden="true">→</span></button>
    <p class="rule-note">로그인 없이 진행할 수 있어요. 선택 내역은 이 브라우저에만 저장됩니다.</p>`;
}
function renderSelect() {
  app.innerHTML=`<section class="hero"><div class="eyebrow">FIND YOUR FREQUENCY</div><h1>좋아하는 노래에서<br><em>다음 최애곡</em>까지.</h1>
    <p class="lead">익숙한 곡 5개부터 시작해요. 작은 선택들이 모여 당신만의 음악 취향 지도가 됩니다.</p>
    <div class="info-line"><span>파일럿 카탈로그 <strong>${CATALOG.length}곡</strong></span><span><strong>J-POP / 애니송 / 보컬로이드 / OST</strong></span><span>가입 필요 없음</span></div>
  </section>
  <div class="main-grid"><section aria-label="좋아하는 노래 검색">
    <div class="section-label"><div><div class="eyebrow">STEP 01</div><h2>좋아하는 곡을 골라주세요</h2></div></div>
    <label class="search-field"><span class="search-icon" aria-hidden="true">⌕</span><input id="song-search" type="search" placeholder="곡명, 아티스트, 한국어 표기 검색" autocomplete="off" value="${esc(query)}" aria-label="곡 검색"></label>
    <div class="chips" aria-label="카테고리 필터">${[['all','전체'],['jpop','J-POP'],['anime','애니송'],['vocaloid','보컬로이드'],['game_ost','게임 OST']].map(([id,label])=>`<button type="button" class="chip ${category===id?'active':''}" data-action="category" data-id="${id}" aria-pressed="${category===id}">${label}</button>`).join('')}</div>
    <div id="catalog-results">${tilesRender()}</div>
  </section><aside class="side-panel" aria-label="선택한 노래" id="selected-summary">${selectionDetail()}</aside></div>
  <div class="mobile-cta"><div class="mobile-meta"><strong>${session.seeds.length}</strong><span> / 10곡 선택<br>최소 5곡</span></div><button class="primary-btn" data-action="start" type="button" ${session.seeds.length<5?'disabled':''}>취향 테스트 →</button></div>`;
}
function renderProbe() {
  const n=session.probes.length;
  const probe=nextProbe(CATALOG,history());
  if(!probe) { app.innerHTML='<div class="empty-results">추가 테스트에 사용할 곡이 없습니다. 선택한 노래를 변경해 주세요.<br><a href="#select">처음으로</a></div>'; return; }
  app.innerHTML=`<div class="center-stage">
    <header class="stage-head"><div class="eyebrow">STEP 02 / TASTE CHECK</div><h1>조금 더 <em>알아볼까요?</em></h1><p class="lead" style="margin:0 auto">취향이 비슷할 수도, 전혀 다를 수도 있는 노래들이에요.<br>잘 모르겠다면 건너뛰어도 괜찮아요.</p></header>
    <div class="progress-head"><span>취향 테스트</span><strong>${String(n+1).padStart(2,'0')} / 10</strong></div>
    <div class="progress-track"><div style="width:${n/10*100}%"></div></div>
    <article class="probe-card"><div class="track-number">TRACK ${String(n+1).padStart(2,'0')}</div>${art(probe)}
      <div class="probe-title">${esc(probe.title)}</div><div class="probe-artist">${esc(probe.artist)}</div><span class="pill-label">${esc(prettyDomain(probe))}</span>
      <a class="listen-link" href="${listenUrl(probe)}" target="_blank" rel="noopener noreferrer">유튜브에서 이 곡 듣기 ↗</a>
    </article>
    <div class="quiz-question">이 곡은 얼마나 마음에 드나요?</div>
    <div class="rating-grid">${RATINGS.map(x=>`<button class="rating-btn" data-action="rate-probe" data-id="${probe.id}" data-kind="${x.kind}" type="button"><span class="rating-icon" aria-hidden="true">${x.symbol}</span><span>${x.label}</span></button>`).join('')}</div>
    <div class="skip-wrap"><button class="skip-btn" data-action="rate-probe" data-id="${probe.id}" data-kind="skip" type="button">아직 안 들어봤어요 / 판단 보류 →</button></div>
    <button class="secondary-btn back-btn" data-action="back-select" type="button">← 이전: 선호곡 선택</button>
    <div class="callout">곡은 자동 재생되지 않습니다. 재생 링크는 유튜브 검색 결과로 이동하며, 음원 자체는 제공하지 않아요.</div>
  </div>`;
}
function tasteHtml(profile) {
 const entries=Object.entries(profile.averages).filter(([,value])=>Number.isFinite(value));
 const top=profile.topGenres.slice(0,4);
 return `<section class="profile-panel"><div class="eyebrow">YOUR MUSIC DNA</div><div class="profile-title">내 취향의 윤곽</div>
   <div class="small-muted">좋아요 ${profile.likedCount}곡 · 별로 ${profile.dislikedCount}곡</div>
   <div class="profile-rows">${entries.length?entries.map(([key,value])=>`<div><div class="profile-line"><span>${FEATURE_NAMES[key]||esc(key)}</span><strong>${Math.round(value*100)}</strong></div><div class="profile-bar"><div style="width:${Math.round(value*100)}%"></div></div></div>`).join(''):'평가가 더 필요합니다.'}</div>
   <div class="small-muted">선호 장르</div><div class="genre-tags">${top.length?top.map(x=>`<span class="genre-tag">${esc(GENRE_NAMES[x.value]||x.value)}</span>`).join(''):'<span class="genre-tag">분석 중</span>'}</div>
   <div class="callout">이 수치는 실제 음원 측정치가 아닌 파일럿용 수동 태그 기반 취향 지수입니다. 음악적 정확도를 보장하지 않습니다.</div>
 </section>`;
}
function recommendationCard(rec,index) {
 const s=rec.song;
 return `<article class="rec-card"><span class="rec-rank">${String(index+1).padStart(2,'0')}</span>${art(s)}
 <div class="rec-info"><div class="rec-song" title="${esc(s.title)}">${esc(s.title)}</div><div class="rec-artist">${esc(s.artist)} · ${esc(prettyDomain(s))}</div><div class="rec-reason">${esc(rec.reasons.join(' · '))}</div></div>
 <div class="rec-actions"><span class="score-badge" title="적중 확률이 아닌 상대적 추천 점수">지수 ${Math.round(rec.score.score*100)}</span>
 <a class="action-btn listen-action" href="${listenUrl(s)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.title)} 유튜브에서 검색">듣기 ↗</a>
 <button class="action-btn" data-action="rate-result" data-id="${s.id}" data-kind="love" type="button" title="추천에 반영하기">♥ 좋아요</button>
 <button class="action-btn" data-action="rate-result" data-id="${s.id}" data-kind="dislike" type="button" title="추천에 반영하기">× 별로</button></div>
 </article>`;
}
function renderResults() {
 const userHistory=history();
 const profile=buildTasteProfile(CATALOG,userHistory);
 const recommendations=recommend(CATALOG,userHistory,[],10);
 app.innerHTML=`<header class="results-intro"><div class="eyebrow">STEP 03 / YOUR DISCOVERY</div><h1>아직 만나지 못한<br><em>취향의 다음 장.</em></h1>
 <p class="lead">선택과 평가를 바탕으로 추천한 곡이에요. 마음에 드는 곡과 아닌 곡을 표시하면 다음 목록에 즉시 반영됩니다.</p></header>
 <div class="results-layout">${tasteHtml(profile)}
   <section class="rec-section"><div class="rec-section-head"><div><h2>추천 트랙</h2><p>총 ${recommendations.length}곡 · 이미 평가한 곡은 제외</p></div><span class="alpha-chip">FOR YOU</span></div>
   <div class="rec-list">${recommendations.length?recommendations.map(recommendationCard).join(''):'<div class="empty-results">현재 조건에서 추천 가능한 곡이 없습니다. 선택한 곡을 바꿔서 다시 시도해 주세요.</div>'}</div>
   <div class="results-bottom"><button class="secondary-btn" type="button" data-action="back-select">선호곡 다시 선택</button><button class="secondary-btn" type="button" data-action="reset">모든 취향 데이터 초기화</button></div>
   <div class="callout">추천 지수는 적중 확률이 아닙니다. 유사곡 외부 API, 계정 연동, 자동 음원 분석은 아직 연결되지 않았습니다.</div></section>
 </div>`;
}
function render() {
 let current=route();
 if(current!=='select'&&session.seeds.length<5){navigate('select');return;}
 if(current==='results'&&session.probes.length<10){navigate('probe');return;}
 if(current==='probe'&&session.probes.length>=10){navigate('results');return;}
 navRender(current);
 if(current==='select')renderSelect();
 else if(current==='probe')renderProbe();
 else renderResults();
}
function updateSelect(keepSearchFocus=false) {
 renderSelect();
 if(keepSearchFocus){const input=document.querySelector('#song-search');input?.focus({preventScroll:true});input?.setSelectionRange(query.length,query.length);}
}
document.addEventListener('input', (event)=>{
 if(event.target?.id==='song-search'){
   query=event.target.value;
   pageLimit=18;
   const list=document.querySelector('#catalog-results');
   if(list) list.innerHTML=tilesRender();
 }
});
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');
 if(!button)return;
 const {action,id,kind}=button.dataset;
 if(action==='category'){ category=id;pageLimit=18;updateSelect();return; }
 if(action==='more'){ pageLimit=Math.min(100,pageLimit+18);updateSelect();return; }
 if(action==='toggle'){
   if(session.seeds.includes(id))session.seeds=session.seeds.filter(x=>x!==id);
   else if(session.seeds.length<10)session.seeds.push(id);
   else { alert('최대 10곡까지 선택할 수 있어요.');return; }
   session.probes=[]; session.feedback=[]; save();updateSelect();return;
 }
 if(action==='start'){
   if(session.seeds.length>=5)navigate('probe');return;
 }
 if(action==='rate-probe'){
   if(!CATALOG_IDS.has(id)||!['love','like','neutral','dislike','skip'].includes(kind))return;
   if(session.probes.length>=10)return;
   if(session.probes.some(r=>r.songId===id))return;
   // Prevent forged stale clicks from recording another than the current probe.
   const now=nextProbe(CATALOG,history());
   if(now?.id!==id)return;
   session.probes.push({songId:id,kind});save();
   if(session.probes.length>=10)navigate('results');else {render();window.scrollTo({top:0,behavior:'instant'});}
   return;
 }
 if(action==='rate-result'){
   if(!CATALOG_IDS.has(id)||!['love','dislike'].includes(kind))return;
   session.feedback=session.feedback.filter(r=>r.songId!==id);
   session.feedback.push({songId:id,kind});save();render();return;
 }
 if(action==='back-select'){ navigate('select');return; }
 if(action==='reset'){
   if(window.confirm('선택곡과 테스트 결과를 이 브라우저에서 모두 지울까요?')){
     session=initialSession();query='';category='all';pageLimit=18;
     try{localStorage.removeItem(STORAGE_KEY);}catch{}
     navigate('select');
   }
 }
});
window.addEventListener('hashchange',render);
if(!location.hash)location.replace('#select');
render();
