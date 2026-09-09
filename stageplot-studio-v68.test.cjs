const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));

for(const marker of [
  `data-release-version="${packageJson.version}"`,
  'id="sp-ins-count"',
  'id="sp-outs-count"',
  'id="sp-ins-connector-options"',
  'id="sp-outs-connector-options"',
  'id="sp-stereo-link-options"',
  'data-stereo-start',
  'function normalizeObjectIo(',
  'function defaultObjectIo(',
  'function objectOutputPortKey(',
  'id="sp-stagebox-combo-jacks"',
  'Kombibuchsen (XLR + Klinke)',
  'const routeNeedsDi=',
  'DI-Box dazwischenschalten',
  'sp-stagebox-port-sparkles'
])assert.ok(html.includes(marker),marker+' fehlt in der gebauten App.');

assert.equal(packageJson.version,html.match(/data-release-version="([^"]+)"/)?.[1],'Paketversion und sichtbare Release-Version laufen auseinander.');
assert.match(html,/stereoPairs=\[\.\.\.new Set\(pairs\.map\(Number\)\.filter\(start=>Number\.isInteger\(start\)&&start>0&&start%2===1&&start<outputs\.count\)\)\]/,'Stereo-Links werden nicht auf ungerade linke Kanäle mit rechtem Nachbarn begrenzt.');
assert.match(html,/io\.stereoPairs=io\.stereoPairs\.filter\(start=>start<io\.outputs\.count\)/,'Das Ändern der Instrument-Inputs würde gültige Output-Stereo-Links löschen.');
assert.match(html,/if\(context\?\.candidate&&routeNeedsDi\(context\.candidate,context\.patch\.direction,context\.box\)\)\{renderStageboxSurface\(surface\);return;\}applyStageboxPatch\(\)/,'Die Stagebox-Quellenauswahl lässt inkompatible Klinke-zu-XLR-Patches zu.');
assert.match(html,/item\.io=normalizeObjectIo\(o\.io,\{\.\.\.o,type,drums:item\.drums\|\|o\.drums\}\)/,'Bestehende lokale Instrumente erhalten beim Import keine migrationssichere I/O-Struktur.');
assert.match(html,/if\(stageboxCapacity\[type\]\)item\.comboJacks=o\.comboJacks===true/,'Die Stagebox-Kombibuchsen werden beim Import nicht erhalten.');
assert.match(html,/source\.outputKeyStyle==='configured'\|\|\(!source\.outputs&&legacy\.count\)\?'configured':'native'/,'Alte Freitext-Outs behalten ihre bisherigen Routing-Keys nicht.');
assert.match(html,/if\(io\)for\(let index=0;index<io\.inputs\.count;index\+\+\)/,'Definierte Instrument-Inputs werden nicht als Stagebox-Outputs in das Routing übernommen.');
assert.match(html,/comboJacks:o\.comboJacks===true/,'Stagebox-Ansichten kennen den Kombibuchsen-Status nicht.');

console.log('PASS V68: Instrument-I/O, Stereo-Zuordnung, DI-Warnung und Stagebox-Kombibuchsen.');
