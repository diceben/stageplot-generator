const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const drumSource=fs.readFileSync('stageplot-drums-v12.js','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));

for(const marker of [
  `data-release-version="${packageJson.version}"`,
  'id="sp-cable-view-toggle"',
  'stageplot-studio:cable-view:v1',
  'data-cable-visible',
  'id="sp-io-aliases"',
  'id="sp-io-alias-list"',
  'data-io-alias-kind',
  'function ioAliasGroups(',
  'const ioAliasAt=',
  'data-drum-pickup=',
  'data-drum-mic-channel',
  'id="sp-drum-mic-popup"',
  'data-drum-mic-filter="all"',
  'data-drum-mic-filter="typical"',
  'data-drum-mic-clear',
  'id="sp-drum-output-summary"',
  'id="sp-drum-output-list"',
  'Wird von OH L &amp; R abgenommen',
  'Abnahme / Outputs'
])assert.ok(html.includes(marker),marker+' fehlt in der gebauten App.');

assert.equal(packageJson.version,'0.1.0-beta.6','Paketversion und sichtbare Release-Version laufen auseinander.');
assert.match(html,/if\(cablesVisible\)cables\.forEach/,'Der Kabel-Tab blendet vorhandene Kabel nicht aus.');
assert.match(html,/mode==='editor'&&cableViewEnabled&&o\.id===selected&&!o\.locked/,'Ausgeblendete Verkabelung lässt die Instrumentbuchsen aktiv.');
assert.match(html,/io\.aliases\[kind\]\[port-1\]=value/,'Signal-Aliase werden nicht an den gewählten Port geschrieben.');
assert.match(html,/io\.aliases\.outputs\[start-1\]=alias;io\.aliases\.outputs\[start\]=alias/,'Stereo-Links teilen ihren Alias nicht.');
assert.match(html,/syncRoutingFromStage\(false\);\},'Drumset übernommen'/,'Geänderte Drum-Abnahmen werden nicht ins Routing übernommen.');
assert.doesNotMatch(html,/sp-drum-pickup-row[^\n]{0,600}<select/,'Die Drum-Mikrofonwahl verwendet noch ein Dropdown.');

const context={};
vm.runInNewContext(drumSource+'\nthis.model=createStageplotDrumModel();',context,{filename:'stageplot-drums-v12.js'});
const model=context.model,defaults=model.drumDefaults(),channels=model.drumChannels('drums',defaults);
const byId=Object.fromEntries(channels.map(channel=>[channel.id,channel]));

assert.equal(defaults.overheadPickup.crash1,true,'Becken sind nicht standardmäßig den Overheads zugeordnet.');
assert.equal(defaults.overheadPickup.hihat,false,'Die Hi-Hat ist fälschlich standardmäßig den Overheads zugeordnet.');
assert.equal(defaults.mics.hihat.model,'Shure SM57','Die Hi-Hat startet nicht mit dem typischen SM57.');
assert.equal(byId['kick1-in'].model,'Grenzflächenmikrofon','Kick In hat nicht das vorgesehene Grenzflächenmikrofon.');
assert.equal(byId['kick1-out'].model,'Generisches Kick-Mikrofon','Kick Out hat kein sinnvolles Standardmikrofon.');
assert.ok(byId['snare-up']&&byId['snare-down'],'Snare Top und Bottom fehlen.');
assert.equal(byId.rack1.model,'Generisches Drum-Mikrofon','Toms starten nicht mit einem generischen Drum-Mikrofon.');
assert.ok(byId['oh-l']&&byId['oh-r'],'Die Standardbecken erzeugen keine OH-L/R-Kanäle.');

const disabledTom=model.normalizeDrums({...defaults,mics:{...defaults.mics,rack1:{...defaults.mics.rack1,enabled:false}}});
assert.ok(!model.drumChannels('drums',disabledTom).some(channel=>channel.id==='rack1'),'"Kein Mikro" entfernt den Tom-Kanal nicht aus dem Routing.');
assert.equal(model.drumChannels('drums',disabledTom,true).find(channel=>channel.id==='rack1').enabled,false,'Die deaktivierte Tom-Abnahme fehlt in der bearbeitbaren Gesamtliste.');

const noOverheads=model.normalizeDrums({...defaults,overheadPickup:Object.fromEntries(Object.keys(defaults.overheadPickup).map(id=>[id,false]))});
assert.ok(!model.drumChannels('drums',noOverheads).some(channel=>channel.id==='oh-l'||channel.id==='oh-r'),'Abgewählte Becken lassen leere OH-Kanäle im Routing.');

const closeCrash=model.normalizeDrums({...defaults,overheadPickup:{...defaults.overheadPickup,crash1:false},mics:{...defaults.mics,crash1:{enabled:true,model:'Neumann KM 184',phantom:true}}});
assert.equal(model.drumChannels('drums',closeCrash).find(channel=>channel.id==='crash1').model,'Neumann KM 184','Ein Becken ohne OH-Zuordnung kann kein eigenes Mikrofon erhalten.');
const exclusiveCrash=model.normalizeDrums({...closeCrash,overheadPickup:{...closeCrash.overheadPickup,crash1:true}});
assert.ok(!model.drumChannels('drums',exclusiveCrash).some(channel=>channel.id==='crash1'),'OH-Zuordnung und eigenes Beckenmikrofon sind nicht gegenseitig exklusiv.');

const migrated=model.normalizeDrums({rackToms:[{diameter:10,depth:8,mount:'kick'}],floorToms:[],crashes:[]});
assert.equal(migrated.mics.rack1.enabled,true,'Alte Drumsets erhalten keine aktive Standardabnahme.');
assert.equal(migrated.mics.rack1.model,'Generisches Drum-Mikrofon','Alte Drumsets erhalten kein Standardmikrofon.');

console.log('PASS V69: Kabel-Tab, I/O-Aliase und bauteilbezogene Drum-Abnahmen.');
