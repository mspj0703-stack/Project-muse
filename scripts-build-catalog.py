from pathlib import Path
import json
root=Path(__file__).parent
PRESETS={
'bright-rock': [.89,.82,.30,.56,.18,.78],
'dark-rock': [.90,.25,.72,.70,.35,.68],
'electro-pop': [.81,.72,.40,.64,.89,.12],
'electro-dark': [.89,.30,.72,.76,.94,.11],
'upbeat-pop': [.88,.90,.25,.52,.61,.38],
'soft': [.35,.65,.78,.44,.16,.76],
'dramatic': [.77,.42,.81,.82,.52,.62],
'jazz': [.74,.75,.34,.82,.36,.64],
'vocaloid-fast': [.94,.63,.47,.74,.94,.08],
'vocaloid-melancholy': [.78,.44,.82,.73,.71,.35],
'game-electronic': [.81,.52,.43,.77,.98,.09],
'game-orchestral': [.71,.40,.67,.87,.29,.72],
'ambient': [.23,.47,.72,.53,.60,.58]
}
KEYS=['energy','brightness','melancholy','complexity','electronic','acoustic']
TAGS={'bright-rock':['guitar','upbeat','band'],'dark-rock':['guitar','intense','dark'],'electro-pop':['synth','rhythmic','pop'],'electro-dark':['synth','intense','dark'],'upbeat-pop':['rhythmic','bright','pop'],'soft':['melodic','soft','emotional'],'dramatic':['dramatic','cinematic','emotional'],'jazz':['rhythmic','groovy','complex'],'vocaloid-fast':['synthetic-vocal','fast','electronic'],'vocaloid-melancholy':['synthetic-vocal','emotional','electronic'],'game-electronic':['instrumental','synth','game'],'game-orchestral':['instrumental','cinematic','game'],'ambient':['instrumental','atmospheric','soft']}
ARTIST_ALIASES={'YOASOBI':['요아소비'],'Ado':['아도'],'Eve':['이브'],'Vaundy':['바운디'],'Aimer':['에메'],'LiSA':['리사'],'King Gnu':['킹누'],'Creepy Nuts':['크리피 너츠'],'DECO*27':['데코니나'],'Toby Fox':['토비 폭스'],'HOYO-MiX':['호요믹스'],'Mitsukiyo':['미츠키요'],'Kanaria':['카나리아']}
data=[]
for i,line in enumerate((root/'catalog-source.tsv').read_text(encoding='utf-8').splitlines(),1):
    title,artist,domains,genre,preset,vocal,aliases,ko_title=line.split('|')
    data.append({'id':f'muse-{i:03d}','title':title,'titleKo':ko_title or None,'artist':artist,'aliases':list(dict.fromkeys(([ko_title] if ko_title else [])+aliases.split(';')+ARTIST_ALIASES.get(artist,[]))),'domains':domains.split(','),'genres':[genre],'tags':TAGS[preset], 'features':dict(zip(KEYS,PRESETS[preset])),'vocal':vocal})
assert len(data)==52,len(data)
(root/'catalog-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'catalog.js').write_text('export const CATALOG = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('records',len(data),'domains', {d:sum(d in s['domains'] for s in data) for d in ['jpop','anime','vocaloid','game_ost','doujin']})
