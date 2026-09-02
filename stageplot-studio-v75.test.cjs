const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const drumSource=fs.readFileSync('stageplot-drums-v12.js','utf8');
const symbolSource=fs.readFileSync('stageplot-symbols-v3.js','utf8');
const drumContext={};vm.createContext(drumContext);vm.runInContext(drumSource+'\nthis.model=createStageplotDrumModel();',drumContext);
const symbolContext={};vm.createContext(symbolContext);vm.runInContext(symbolSource+'\nthis.render=createStageplotSymbolV3;',symbolContext);
const model=drumContext.model;

const legacy=model.normalizeDrums({});
assert.equal(legacy.snare,true,'Bestehende Drumsets verlieren bei der Migration ihre Snare.');
assert.equal(legacy.throne,true,'Bestehende Drumsets verlieren bei der Migration ihren Hocker.');

const reduced=model.normalizeDrums({splash:99,snare:false,throne:false,rackToms:[],floorToms:[],hihat:false,ride:false,crashes:[],china:0,clapstack:false,pad:false,bongos:false});
assert.equal(reduced.splash,4,'Mehrere Splash-Becken werden nicht bis zum neuen Limit unterstützt.');
const reducedLayout=model.drumLayout('drums',reduced),reducedIds=reducedLayout.parts.map(part=>part.id);
assert.equal(reducedIds.includes('snare'),false,'Eine entfernte Snare bleibt im Drumlayout.');
assert.equal(reducedIds.includes('throne'),false,'Ein entfernter Hocker bleibt im Drumlayout.');
assert.deepEqual(JSON.parse(JSON.stringify(reducedIds.filter(id=>id.startsWith('splash')))),['splash1','splash2','splash3','splash4'],'Vier Splash-Becken werden nicht einzeln angelegt.');
assert.equal(model.drumChannels('drums',reduced,true).some(row=>row.part==='snare'),false,'Entfernte Snare-Kanäle bleiben im Routingmodell.');

const defaults=model.drumDefaults(),layout=model.drumLayout('drums',defaults);
const withoutMic=symbolContext.render('drums',{drumLayout:layout}),withMic=symbolContext.render('drums',{drumLayout:layout,drumMicParts:['kick1']});
assert.equal(withoutMic.includes('data-part="mic-indicator"'),false,'Mic-Markierungen erscheinen außerhalb des Drum-Designers.');
assert.equal((withMic.match(/data-part="mic-indicator"/g)||[]).length,1,'Der Drum-Designer markiert abgenommene Teile nicht eindeutig.');
assert.ok(withMic.includes('#d62f47'),'Die Mic-Markierung ist nicht rot.');

for(const marker of ['Alle Teile löschen','Object.assign(d,{kickCount:1,throne:false,snare:false','drumMicParts,idPrefix:',"draft?.splash<4?'splash':''","d.snare=true;id='snare'","d.throne=true;id='throne'"])assert.ok(html.includes(marker),marker+' fehlt im Drum-Designer-Workflow.');
assert.equal(html.includes("drumChoicePills('Montage'"),false,'Die entfernte Montageart wird noch im Drum-Designer angeboten.');
assert.match(html,/\(enabled\?drumMicIcon\(choice\):''\).*Mic wählen/,'Nach „kein Mic“ bleibt die Mic-Grafik sichtbar.');
assert.match(html,/const before=snapshot\(\),activeTab=inspectorTab;o\.locked=!o\.locked;keepHistory\(before\);renderEditor\(\);setInspectorTab\(activeTab\)/,'Das Ebenen-Schloss bewahrt den aktiven Inspector-Tab nicht.');

console.log('PASS V75: Drum-Teile löschen, vier Splashes, Mic-Indikatoren, monochromes Clapstack und stabiles Ebenen-Schloss.');
