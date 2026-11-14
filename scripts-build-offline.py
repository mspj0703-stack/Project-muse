from pathlib import Path
import re
root=Path(__file__).parent
order=['engine/dist/types.js','engine/dist/utils.js','engine/dist/profile.js','engine/dist/probe.js','engine/dist/search.js','engine/dist/recommender.js','catalog.js','app.js']
parts=[]
for rel in order:
    t=(root/rel).read_text(encoding='utf-8')
    # Preserve only source modules under our control. Collapse module exports to global script scope.
    t=re.sub(r'^import\s+[^;\n]+;\s*$', '', t, flags=re.M)
    t=re.sub(r'^export\s+(?=(const|function|class|async|let|var)\b)', '', t, flags=re.M)
    parts.append('// FILE: '+rel+'\n'+t)
js='(function(){\n\"use strict\";\n' + '\n'.join(parts) + '\n})();'
assert not re.search(r'^\s*(?:import|export)\s',js,re.M), 'source changed; update bundler'
html=(root/'index.html').read_text(encoding='utf-8')
html=re.sub(r'^\s*<link rel="stylesheet" href="./styles.css"[^>]*>\n','',html,flags=re.M)
html=re.sub(r'^\s*<script type="module" src="./app.js"[^>]*></script>\n','',html,flags=re.M)
html=html.replace('</head>','<style>\n'+(root/'styles.css').read_text(encoding='utf-8')+'\n</style>\n</head>')
html=html.replace('</body>','<script>\n'+js.replace('</script>','<\\/script>')+'\n</script>\n</body>')
(root/'MUSE_Offline_Demo.html').write_text(html,encoding='utf-8')
print('created offline HTML',round(len(html)/1024),'KiB')
