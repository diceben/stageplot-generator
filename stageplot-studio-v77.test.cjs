const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const symbolSource=fs.readFileSync('stageplot-symbols-v3.js','utf8');
const context={};vm.createContext(context);vm.runInContext(symbolSource+'\nthis.render=createStageplotSymbolV3;',context);

for(const category of ['all','instruments','stage','lights','tech'])assert.ok(html.includes('data-category="'+category+'"'),category+' fehlt in den kompakten Bibliothekskategorien.');
assert.match(html,/\.sp-category-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(5,/s,'Die fünf Kategorie-Icons passen nicht in eine kompakte Reihe.');

for(const marker of [
  "id:'mic-wireless-ewd'.*w:.536,d:.1,physicalW:.268,physicalD:.05,planScale:2",
  "id:'mic-sm57'.*w:.314,d:.064,physicalW:.157,physicalD:.032,planScale:2",
  "id:'mixer-xr18'.*w:.333,d:.149",
  "id:'mixer-wing-compact'.*w:.5743,d:.45337",
  "id:'mixer-wing-rack'.*w:.486,d:.326",
  "id:'piano-bench'",
  "id:'drum-throne'",
  "id:'guitar-tree-empty'.*w:.7,d:.7",
  "id:'stage-ramp'",
  "id:'stage-railing'",
  "id:'stage-truss-tower'",
  "id:'stage-cable-ramp'",
  "id:'stage-barrier'"
])assert.match(html,new RegExp(marker),marker+' fehlt im Katalog.');

const renders={
  'mic-wireless-ewd':'sennheiser-ewd-skm-top-view',
  'mic-sm57':'shure-sm57-top-view',
  'mixer-xr18':'behringer-xr18-top-view',
  'mixer-wing-compact':'behringer-wing-compact-top-view',
  'mixer-wing-rack':'behringer-wing-rack-top-view',
  'piano-bench':'piano-bench-top-view',
  'drum-throne':'drum-throne-top-view',
  'stage-ramp':'stage-ramp-top-view',
  'stage-railing':'stage-railing-top-view',
  'stage-truss-tower':'stage-truss-tower-top-view',
  'stage-cable-ramp':'stage-cable-ramp-top-view',
  'stage-barrier':'crowd-barrier-top-view'
};
for(const [type,part] of Object.entries(renders))assert.ok(context.render(type).includes('data-part="'+part+'"'),type+' besitzt keine eigene technische Topview.');

const xr18=context.render('mixer-xr18');
assert.equal((xr18.match(/data-part="input-socket"/g)||[]).length,16,'XR18 zeigt nicht seine 16 Combo-Eingänge.');
assert.equal((xr18.match(/data-part="output-socket"/g)||[]).length,8,'XR18 zeigt nicht seine acht analogen Ausgänge.');
const wingRack=context.render('mixer-wing-rack');
assert.equal((wingRack.match(/data-part="input-socket"/g)||[]).length,24,'WING Rack zeigt nicht seine 24 Preamps.');
assert.equal((wingRack.match(/data-part="output-socket"/g)||[]).length,8,'WING Rack zeigt nicht seine acht Ausgänge.');

for(const marker of [
  "mixers:'Mixermodell'",
  "compactModelFamilies=new Set(['keys','electric-guitars','electric-basses','stageboxes','mixers'])",
  "if(c.ioDefaults)",
  "objectIds:['stage-module','riser-2','riser-3','rug','stage-ramp','stage-railing','stage-truss-tower','stage-cable-ramp','stage-barrier']",
  "['instruments','stage','lights','tech'].includes(category)",
  'sp-pack-pink-sparkle',
  "const gap=2,cx=",
  "stroke:'#aeb5ae','stroke-width':.7",
  "fill:stageFill,stroke"
])assert.ok(html.includes(marker),marker+' fehlt im Bibliotheks-/Darstellungsworkflow.');

console.log('PASS V77: kompakte Objektkategorien, pinke Packs, neue Produktionsobjekte, reale Maße und nähere Outline-Labels.');
