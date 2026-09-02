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
  'function cableSourceGroups(',
  'function cableHandleLayout(',
  'data-cable-keys',
  'data-cable-port-rail',
  'id="sp-stagebox-combo-jacks"',
  'Kombibuchsen (XLR + Klinke)',
  'const routeNeedsDi=',
  'DI-Box dazwischenschalten',
  'sp-stagebox-port-sparkles'
])assert.ok(html.includes(marker),marker+' fehlt in der gebauten App.');

assert.equal(packageJson.version,'0.1.0-beta.6','Paketversion und sichtbare Release-Version laufen auseinander.');
assert.match(html,/stereoPairs=\[\.\.\.new Set\(pairs\.map\(Number\)\.filter\(start=>Number\.isInteger\(start\)&&start>0&&start%2===1&&start<outputs\.count\)\)\]/,'Stereo-Links werden nicht auf ungerade linke Kanäle mit rechtem Nachbarn begrenzt.');
assert.match(html,/io\.stereoPairs=io\.stereoPairs\.filter\(start=>start<io\.outputs\.count\)/,'Das Ändern der Instrument-Inputs würde gültige Output-Stereo-Links löschen.');
assert.match(html,/group\.rows\.map\(row=>row\.sourceKey\)\.join\('\|'\)/,'Ein Stereo-Link übergibt seine beiden Quellkanäle nicht gemeinsam an den Kabelzug.');
assert.match(html,/cableHandleRowGap=22,cableHandleColumnGap=24/,'Die Kabel-Startpunkte stehen noch zu eng zusammen.');
assert.match(html,/\*cableHandleRowGap,x=side\*\(w\/2\+12\+column\*cableHandleColumnGap\)/,'Das Buchsenlayout verwendet die größeren Abstände nicht.');
assert.match(html,/rows=cableSourceSpecs\(sourceId\)\.filter\(row=>!keys\.size\|\|keys\.has\(row\.sourceKey\)\)/,'Die Kanalbuchse filtert den Kabelzug nicht auf Mono- beziehungsweise Stereo-Kanäle.');
assert.match(html,/current\.rows\.some\(row=>routeNeedsDi\(row,row\.direction,target\)\)/,'Direkt gezogene Klinkenkabel umgehen die DI-Prüfung.');
assert.match(html,/if\(context\?\.candidate&&routeNeedsDi\(context\.candidate,context\.patch\.direction,context\.box\)\)\{renderStageboxSurface\(surface\);return;\}applyStageboxPatch\(\)/,'Die Stagebox-Quellenauswahl lässt inkompatible Klinke-zu-XLR-Patches zu.');
assert.match(html,/item\.io=normalizeObjectIo\(o\.io,\{\.\.\.o,type,drums:item\.drums\|\|o\.drums\}\)/,'Bestehende lokale Instrumente erhalten beim Import keine migrationssichere I/O-Struktur.');
assert.match(html,/if\(stageboxCapacity\[type\]\)item\.comboJacks=o\.comboJacks===true/,'Die Stagebox-Kombibuchsen werden beim Import nicht erhalten.');
assert.match(html,/source\.outputKeyStyle==='configured'\|\|\(!source\.outputs&&legacy\.count\)\?'configured':'native'/,'Alte Freitext-Outs behalten ihre bisherigen Routing-Keys nicht.');
assert.match(html,/if\(io\)for\(let index=0;index<io\.inputs\.count;index\+\+\)/,'Definierte Instrument-Inputs werden nicht als Stagebox-Outputs in das Routing übernommen.');
assert.match(html,/comboJacks:o\.comboJacks===true/,'Stagebox-Ansichten kennen den Kombibuchsen-Status nicht.');
assert.doesNotMatch(html,/data-cable-source[^\n]{0,500}cableSpecs\.length\+' Kabel'/,'Der alte gemeinsame Kabel-Nupsi ist noch aktiv.');

console.log('PASS V68: Instrument-I/O, Stereo-Link-Buchsen, DI-Warnung und Stagebox-Kombibuchsen.');
