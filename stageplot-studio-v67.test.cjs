const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const drumSource=fs.readFileSync('stageplot-drums-v12.js','utf8');
const symbolSource=fs.readFileSync('stageplot-symbols-v3.js','utf8');
const packIssuerSource=fs.readFileSync('scripts/issue-pack-code.cjs','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const context={};vm.createContext(context);vm.runInContext(drumSource+'\nthis.model=createStageplotDrumModel();',context);
const model=context.model;
const symbolContext={};vm.createContext(symbolContext);vm.runInContext(symbolSource+'\nthis.render=createStageplotSymbolV3;',symbolContext);

const layered=model.normalizeDrums({zOrder:['ride','snare','ride','invalid','kick1']});
assert.deepEqual(JSON.parse(JSON.stringify(layered.zOrder)),['ride','snare','kick1'],'Die Drum-Ebenen werden nicht sicher normalisiert.');
const layout=model.drumLayout('drums',layered),ids=layout.parts.map(part=>part.id);
assert.ok(ids.indexOf('ride')<ids.indexOf('snare')&&ids.indexOf('snare')<ids.indexOf('kick1'),'Die gespeicherte Drum-Ebenenreihenfolge wird im Layout nicht angewendet.');
assert.deepEqual(JSON.parse(JSON.stringify(model.normalizeDrums({}).zOrder)),[],'Alte Drum-Konfigurationen migrieren nicht auf eine leere Ebenenliste.');

for(const marker of [
  'data-release-version="0.1.0-beta.3"',
  'data-grid-scale-label',
  '1 Kästchen = ',
  'data-rotate-hold="-1"',
  'data-rotate-zero',
  'id="sp-stairs-width-popover"',
  'id="sp-stairs-depth-popover"',
  'function normalizeExtraStairs(',
  'function duplicateSelectedStairs(',
  'data-drum-rotate-hold="-1"',
  'data-drum-zero=',
  'data-drum-behind=',
  'data-drum-duplicate=',
  'sp-drum-design-load-preview',
  'id="sp-stagebox-tab"',
  'id="sp-stagebox-view"',
  'function renderStageboxView(',
  'id="sp-cable-popover"',
  'data-cable-source',
  'data-cable-target',
  'function finishCableDrag(',
  'function reconcileCablesWithRouting(',
  'stage.cables=[]',
  'function dashboardPreviewMarkup(',
  'id="sp-project-delete-dialog"',
  'id="sp-project-delete-input"',
  'data-project-download=',
  'function downloadDashboardProject(',
  'function deleteDashboardProject(',
  'id="sp-library-packs-tab"',
  'id="sp-library-packs"',
  'id="sp-pack-dialog"',
  'id="sp-pack-code-form"',
  'id="sp-pack-feedback-form"',
  'id="sp-pack-newsletter-form"',
  "const packStorageKey='stageplot-studio:object-packs:v1'",
  "{id:'light-lab'",
  "{id:'stage-builder'",
  "{id:'pro-crew'",
  "{id:'crew-rewards'",
  "{id:'production-bundle'",
  'function normalizePackState(',
  'function isObjectUnlocked(',
  'async function verifyPackLicense(',
  'window.crypto.subtle.verify(',
  'function submitReward(',
  'id="sp-project-rename-form"',
  'id="sp-project-rename-input"',
  'function beginProjectRename(',
  'function finishProjectRename(',
  'id="sp-stage-popover"',
  'id="sp-np-stage-mode"',
  "{id:'stage-module'",
  'function snapStageModule(',
  'function addStageExtensionModule(',
  'data-stage-extension'
])assert.ok(html.includes(marker),marker+' fehlt in der gebauten App.');

assert.equal(packageJson.version,'0.1.0-beta.3','Paketversion und sichtbare Release-Version laufen auseinander.');

assert.match(html,/record\.stairsAlong=Math\.max\(0,Math\.min\(1,center\/drag\.maxW\)\);record\.stairsOffset=record\.stairsAlong;record\.stairsWidth=w/,'Beim Ziehen der Treppenbreite bleibt die gegenüberliegende Seite nicht verankert.');
assert.match(html,/stairsDepth:finite\(source\.stairsDepth,\.45,3\)\?source\.stairsDepth:\.9/,'Die Treppentiefe wird beim Projektimport nicht migriert.');
assert.match(html,/path:'M'.{0,180}\+'C'/,'Bühnenkabel werden nicht als weiche Bézierkurven gezeichnet.');
assert.match(html,/nearest\.distance<=Math\.max\(/,'Die Stagebox-Ziele besitzen keinen magnetischen Fangbereich.');
assert.match(html,/sp-project-delete-input'\)\.value!==pendingProjectDelete\.name/,'Das endgültige Projektlöschen verlangt nicht den exakten Projektnamen.');
assert.match(html,/createSetupExport\(name,entry\.document/,'Projektkacheln laden keine portable Projektdatei herunter.');
assert.match(html,/if\(!raw&&hasPriorStageplotData\(storage\)\)\{packState\.betaPass=true/,'Bestehende Beta-Nutzer erhalten keinen kompatiblen Beta Crew Pass.');
assert.match(html,/if\(!isObjectUnlocked\(type\)\)\{cancelPlacement\(false\);lockedObjectPack\(type\);return;\}/,'Gesperrte Pack-Objekte können über den Platzierungsweg eingefügt werden.');
assert.match(html,/if\(!isObjectUnlocked\('stage-module'\)\)\{openPackDialog\('stage-builder'\);return;\}/,'Komplexe Bühnenmodule umgehen das Stage Builder Pack.');
assert.match(html,/packState\.outbox\.push\(\{id:'reward-'/,'Lokale Reward-Vormerkungen besitzen keine Offline-Warteschlange.');
assert.doesNotMatch(html,/packLicensePublicKey=\{[^}]*\bd:/,'Der Browser enthält versehentlich einen privaten Lizenzschlüssel.');
assert.match(html,/#sp-project-rename-form \{ position:absolute;/,'Das Umbenennen würde das feste Menüband verschieben.');
assert.match(html,/stage\.title=name;stage\.project=normalizeProjectInfo\(\{\.\.\.stage\.project,name\},name\)/,'Der klickbare Projektname aktualisiert nicht Projekt und automatische Entwürfe gemeinsam.');
assert.match(html,/complex:source\.complex===true/,'Komplexe Bühnen werden beim Import nicht migriert.');
assert.match(packIssuerSource,/allowedPacks=new Set\(\['light-lab','stage-builder','pro-crew','production-bundle'\]\)/,'Der Code-Issuer kennt die verkaufbaren Packs nicht.');
assert.match(packIssuerSource,/Der private Schlüssel muss außerhalb des Repositorys gespeichert werden/,'Der Code-Issuer schützt nicht vor versehentlich eingecheckten privaten Schlüsseln.');
assert.match(packIssuerSource,/webcrypto\.subtle\.sign\(\{name:'ECDSA',hash:'SHA-256'\}/,'Freischaltcodes werden nicht passend zum Browser-Verifier signiert.');

const equipment={
  wedge:'cm14-wedge-top-view',
  teleprompter:'stage-teleprompter-top-view',
  'light-moving-spot':'spot-moving-head-top-view',
  'light-spark':'spark-effect-top-view',
  'light-moving-wash':'moving-head-top-view',
  'light-flightcase':'lighting-flightcase-top-view',
  'light-fog':'fog-machine-top-view',
  'light-wave-bar':'moving-wave-bar-top-view'
};
for(const [type,part] of Object.entries(equipment)){
  const markup=symbolContext.render(type);
  assert.ok(markup.includes('data-equipment="'+type+'"'),type+' wird nicht als Bühnensymbol gerendert.');
  assert.ok(markup.includes(part),type+' besitzt keine erkennbare Topview-Geometrie.');
  assert.ok(html.includes("{id:'"+type+"'"),type+' fehlt im Objektkatalog.');
}

const clapstackMarkup=symbolContext.render('drums',{drumLayout:model.drumLayout('drums',model.drumDefaults())});
assert.ok(clapstackMarkup.includes('data-part="clapstack-discs"'),'Der Clapstack besitzt keine eigene dreilagige Draufsicht.');
assert.equal((clapstackMarkup.match(/clapstack-bronze/g)||[]).length>=6,true,'Der Clapstack verwendet keine drei realistischen Rohbronze-Lagen.');
assert.ok(clapstackMarkup.includes('#d3a27e')&&clapstackMarkup.includes('#322824'),'Der Clapstack bildet die helle und dunkle Patina der Herstellerreferenz nicht ab.');

console.log('PASS V67: Rastermaß, Treppen, Dreh-/Ebenensteuerung, Stagebox-View, Bühnenkabel, Object Packs und neue technische Topview-Symbole.');
