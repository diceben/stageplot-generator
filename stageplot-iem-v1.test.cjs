const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),IEM=require('./stageplot-iem-v1.js');
let seq=0;const token=()=>String(++seq),obj={id:'iem-rack',type:'rack',label:'Altes Rack',iem:{name:'Vocals',mode:'stereo',transport:'wireless',frequencyBand:'470–526 MHz'}};
const original=[{id:'wedge-out',sourceKey:'wedge:monitor',number:1,instrument:'Wedge',notes:'Unverändert'},{id:'left',sourceKey:'iem-rack:iem-l',stereoGroup:'iem-rack:iem',mode:'Stereo L',number:3,instrument:'IEM · Vocals L',iemName:'Vocals',iemMode:'stereo',iemTransport:'wireless',stagebox:'box',stageboxPort:5,notes:'FOH links'},{id:'right',sourceKey:'iem-rack:iem-r',stereoGroup:'iem-rack:iem',mode:'Stereo R',number:4,instrument:'IEM · Vocals R',iemName:'Vocals',iemMode:'stereo',iemTransport:'wireless',stagebox:'box',stageboxPort:6,notes:'FOH rechts'}];
const clone=x=>JSON.parse(JSON.stringify(x)),snapshot=clone(original),legacy=IEM.read(obj,original);
assert.equal(legacy.length,1);assert.equal(legacy[0].name,'Vocals');assert.deepEqual(legacy[0].aux,[3,4]);
let mixes=IEM.resize(legacy,4);mixes[1].mode='mono';mixes[1].transport='cable';mixes[2].mode='mono';mixes[2].name='Drums';mixes[3].name='Bass';mixes[3].frequencyBand='606–648 MHz';
let result=IEM.apply(obj,original,mixes,token);assert.equal(result.rows.length,7);assert.deepEqual(original,snapshot,'Planning never mutates current routing');assert.deepEqual(result.rows[0],original[0]);
for(const row of original.slice(1)){const retained=result.rows.find(r=>r.id===row.id);for(const key of ['id','number','sourceKey','stagebox','stageboxPort','notes'])assert.equal(retained[key],row[key],key+' survives migration');}
assert.deepEqual(result.rows.map(r=>r.number),[1,3,4,2,5,6,7]);
obj.iemMixes=result.mixes;let read=IEM.read(obj,result.rows);assert.equal(read[1].transport,'cable');assert.equal(read[3].frequencyBand,'606–648 MHz');assert.equal(IEM.specs(obj).length,6);
// Mode changes preserve the left channel identity/patch and free only the right.
read[0].mode='mono';let mono=IEM.apply(obj,result.rows,read,token);assert.equal(mono.rows.find(r=>r.id==='left').stageboxPort,5);assert(!mono.rows.some(r=>r.id==='right'));assert.equal(mono.rows.length,6);
obj.iemMixes=mono.mixes;read=IEM.read(obj,mono.rows);read[0].mode='stereo';let stereo=IEM.apply(obj,mono.rows,read,token);assert.equal(stereo.rows.find(r=>r.id==='left').number,3);const added=stereo.rows.find(r=>r.sourceKey==='iem-rack:iem-r');assert.equal(added.number,4);assert.equal(added.stagebox,'');
// Wiring stays in canonical output rows, including edits from Stagebox-Belegung.
added.stagebox='other-box';added.stageboxPort=8;obj.iemMixes=stereo.mixes;read=IEM.read(obj,stereo.rows);read[0].transport='cable';const wired=IEM.apply(obj,stereo.rows,read,token);assert.equal(wired.rows.find(r=>r.id===added.id).stageboxPort,8);assert.equal(wired.rows.find(r=>r.id==='left').frequencyBand,'');
read[0].aux=[1,8];assert.throws(()=>IEM.apply(obj,stereo.rows,read,token),/AUX 1 ist bereits/);read[0].aux=[2.5,8];assert.throws(()=>IEM.apply(obj,stereo.rows,read,token),/ganze Zahl/);
// Legacy mono and custom stereo-source keys retain their IDs on subsequent edits.
const custom=clone(original.slice(1));custom[1].sourceKey='iem-rack:audio-custom';delete obj.iemMixes;const migrated=IEM.read(obj,custom);assert.equal(migrated[0].ports[1],'audio-custom');assert.equal(IEM.apply(obj,custom,migrated,token).rows[1].id,'right');
const monoLegacy=IEM.read({...obj,iem:{mode:'mono'}},[{id:'m',sourceKey:'iem-rack:iem-mono',mode:'Mono',number:9,iemTransport:'cable'}]);assert.equal(monoLegacy[0].mode,'mono');assert.equal(monoLegacy[0].ports[0],'iem-mono');
const duplicate=IEM.normalize([{id:'same',ports:['same','same']},{id:'same',ports:['same','same']}]);assert.equal(new Set(duplicate.flatMap(m=>m.ports)).size,4);assert.equal(IEM.resize(migrated,100).length,16);
// Per-monitor frequencies do not inherit the old global rack frequency.
const html=fs.readFileSync('stageplot-studio.html','utf8');
const frequencyContext={audioMembers:r=>[r],routeSourceObject:()=>({type:'rack',wireless:'old rack band',iemMixes:[]})};vm.createContext(frequencyContext);vm.runInContext(html.match(/  function routeFrequency\(row\)\{[^\n]+/)[0],frequencyContext);assert.equal(frequencyContext.routeFrequency({iemTransport:'cable',frequencyBand:'old band'}),'');assert.equal(frequencyContext.routeFrequency({iemTransport:'wireless',frequencyBand:'per-mix band'}),'per-mix band');
console.log('PASS IEM: legacy migration, 1–16 monitor mixes, mono/stereo, wireless/cable, AUX allocation/conflicts, preserved routing IDs/patches/notes, canonical socket changes and safe frequency display.');
