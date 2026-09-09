const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),audio=fs.readFileSync('stageplot-audio-v1.js','utf8'),playback=fs.readFileSync('stageplot-playback-v1.js','utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const connectors=['XLR','Klinke','Cinch','USB','Digital','Dante','MADI'];
const ctx={clone,projectText:(v,max)=>String(v??'').trim().slice(0,max),normalizeIoConnector:(v,f='XLR')=>connectors.includes(v)?v:f,ioConnectorValues:connectors,
 routeModes:new Set(['Mono','Stereo L','Stereo R','Mic','DI','Direct']),routeSignals:new Set(['Mic','Line','Instrument','Digital']),
 byId:{laptop:{instrument:true,category:'tech',short:'Playback-Laptop',name:'Playback-Laptop'},mic:{instrument:true,category:'audio',short:'Mic',name:'Mic'}},
 drumModel:{isDrums:()=>false},objects:[],stage:{routing:{inputs:[],outputs:[],disabledSources:[]}},token:0,sharedReadOnly:false,
 routeToken:()=>String(++ctx.token),queueDraftSave(){},say(){},reconcileCablesWithRouting(){},routeFrequency:()=>'',routeNeedsDi:(row,direction,box)=>direction==='inputs'&&row.connector==='Klinke'&&!box.comboJacks,
 esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),routingStageboxes:()=>[{id:'box',name:'Stagebox A',capacity:16}],
 $:()=>({textContent:''}),keepHistory:before=>ctx.saved.push(before),snapshot:()=>clone({stage:ctx.stage,objects:ctx.objects}),saved:[]};
ctx.allRoutingStageboxes=ctx.routingStageboxes;
ctx.routeSourceObject=row=>ctx.objects.find(o=>o.id===String(row?.sourceKey||'').split(':')[0]);
ctx.routeSpec=(o,port,instrument,mode='Mono',signalType='Mic',extra={})=>({sourceKey:o.id+':'+port,instrument,mode,signalType,microphone:'',phantom:false,stagebox:'',notes:'',...extra});
ctx.ioAliasText=value=>String(value??'').replace(/\s+/g,' ').trim().slice(0,60);
ctx.normalizeIoAliasList=(values,count)=>Array.from({length:count},(_,i)=>ctx.ioAliasText(Array.isArray(values)?values[i]:''));
ctx.ioAliasAt=(io,kind,port)=>ctx.ioAliasText(io.aliases?.[kind]?.[port-1]);ctx.parseOutsValue=value=>ctx.parseIoValue(value,'outs');
ctx.objectIo=o=>ctx.normalizeObjectIo(o.io,o);ctx.ioValueText=(port)=>port.count+' Outs · '+port.connector;
vm.createContext(ctx);
vm.runInContext(audio.slice(0,audio.indexOf("$('sp-audio-object').addEventListener"))+'\n'+playback.slice(0,playback.indexOf('// Playback DOM bindings.')),ctx);
vm.runInContext(['parseIoValue','defaultObjectIo','normalizeObjectIo','normalizeRouteChannel','normalizeRouting','objectOutputPortKey','objectOutputBaseName','objectOutputSignal','generatedInputSpecs','generatedOutputSpecs','reconcileRouteList','syncRoutingFromStage','stageboxRouteLocation'].map(extract).join('\n'),ctx);
vm.runInContext('refreshAudioSurface=()=>{};playbackDialog={close(){}};',ctx);
const reset=io=>{ctx.objects=[{id:'station-1',type:'laptop',label:'Playback-Laptop',...(io?{io}: {})},{id:'station-2',type:'mic',label:'Gesang'}];ctx.stage={routing:{inputs:[],outputs:[],disabledSources:[]}};ctx.saved=[];ctx.syncRoutingFromStage(false,false);};
const begin=()=>vm.runInContext('playbackDraft=playbackDraftFromObject(objects[0])',ctx);
const rows=()=>ctx.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('station-1:'));
reset();const original=ctx.snapshot();let draft=begin();assert.deepEqual(ctx.snapshot(),original,'Opening a legacy laptop does not migrate or mutate its draft.');assert.equal(draft.mode,'stereo');assert.equal(rows().length,2);
Object.assign(rows()[0],{number:21,notes:'Linke Seite',edited:true,pickup:'DI',connector:'XLR',microphone:'J48',phantom:true,stagebox:'box',stageboxPort:3});Object.assign(rows()[1],{number:22,notes:'Rechte Seite',edited:true,pickup:'DI',connector:'XLR',stagebox:'box',stageboxPort:4});const ids=rows().map(row=>row.id);
ctx.playbackChooseMode(draft,'playaudio');draft.io.aliases.outputs[0]=draft.io.aliases.outputs[1]='Intro';draft.io.aliases.outputs[2]=draft.io.aliases.outputs[3]='Percussion';
ctx.playbackSetPairFormat(draft,11,false);draft.io.aliases.outputs[10]='Click';draft.io.aliases.outputs[11]='Cue';draft.enabled[11]=false;
assert.equal(ctx.playbackChangeImpact(ctx.objects[0],draft).mixed,false);ctx.savePlaybackDialog();assert.equal(ctx.saved.length,1);assert.equal(rows().length,11);assert.equal(ctx.objects[0].io.outputs.count,12,'Unused mono signals do not change physical capacity.');
assert.deepEqual(clone(rows().slice(0,2).map(row=>[row.id,row.number,row.stageboxPort,row.notes])),[[ids[0],21,3,'Linke Seite'],[ids[1],22,4,'Rechte Seite']]);assert(rows().every(row=>row.connector==='XLR'&&row.pickup==='Direct'&&!row.phantom&&!row.microphone));
assert.match(rows()[0].instrument,/Intro · L$/);assert.match(rows()[2].instrument,/Percussion · L$/);assert.equal(rows().at(-1).stereoGroup,'');assert.match(rows().at(-1).instrument,/Click$/);assert.equal(ctx.stage.routing.disabledSources[0],'station-1:io-out-12');
const stored=ctx.snapshot();ctx.syncRoutingFromStage(false,false);assert.deepEqual(clone(rows().map(row=>row.id)),stored.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('station-1:')).map(row=>row.id));
// Saved mode choices and transport data survive normalization; output IDs remain native or configured.
assert.deepEqual(clone(ctx.normalizePlayback({mode:'dante',target:'  FOH <A>  ',secret:'drop'})),{version:1,mode:'dante',target:'FOH <A>'});assert.equal(ctx.normalizePlayback({mode:'bogus',target:'x'.repeat(300)}).target.length,120);
draft=begin();ctx.playbackChooseMode(draft,'stereo');ctx.playbackChooseMode(draft,'playaudio');assert.equal(draft.io.aliases.outputs[2],'Percussion','Switching options within the dialog retains the working labels.');assert.equal(draft.enabled[11],false);assert.deepEqual(clone(ctx.objects),stored.objects,'Uncommitted mode changes remain isolated.');
// Dante uses one Ethernet handoff while preserving mixer identity and notes, releasing only its analog patch.
ctx.stage.routing.inputs.find(row=>row.sourceKey.startsWith('station-2:')).stagebox='box';ctx.stage.routing.inputs.find(row=>row.sourceKey.startsWith('station-2:')).stageboxPort=16;
ctx.playbackChooseMode(draft,'dante');assert(!draft.io.stereoPairs.includes(11),'Changing transport preserves separate Click/Cue mono channels.');ctx.playbackSetChannelCount(draft,16);draft.target='FOH · Dante-Switch';assert.equal(ctx.playbackChangeImpact(ctx.objects[0],draft).unpatch,2);ctx.savePlaybackDialog();assert.equal(rows().length,15);assert(rows().every(row=>row.connector==='Dante'&&row.pickup==='Digital'&&!row.stagebox&&!row.stageboxPort));assert.equal(rows()[0].number,21);assert.equal(rows()[0].notes,'Linke Seite');assert.equal(ctx.stage.routing.inputs.find(row=>row.sourceKey.startsWith('station-2:')).stageboxPort,16);
assert.equal(ctx.audioInputConnector(rows()[0],'Digital'),'Dante');assert.equal(ctx.audioPatchStatus(rows()[0],'inputs'),'patched');assert.throws(()=>ctx.planAudioPatch(rows(),rows().slice(0,2),{id:'box',capacity:16},'inputs'),/Dante.*Netzwerk/);
assert.match(ctx.audioPrintTable('inputs'),/Dante · Tx 1/);assert.match(ctx.audioPrintTable('inputs'),/Dante · Tx 1 · FOH · Dante-Switch/);assert.match(ctx.audioRoutingRows(rows(),'inputs'),/Dante Virtual Soundcard · Tx 1/);assert(!ctx.audioRoutingRows(rows(),'inputs').includes('data-route-phantom'));
const preReduce=ctx.snapshot();draft=begin();ctx.playbackSetChannelCount(draft,2);ctx.savePlaybackDialog();assert.equal(rows().length,2,'Reducing transport capacity also removes edited orphan channels.');assert.deepEqual(ctx.saved.at(-1),preReduce,'One undo snapshot includes hardware, labels and every original patch.');
ctx.objects=clone(preReduce.objects);ctx.stage=clone(preReduce.stage);ctx.syncRoutingFromStage(false,false);assert.equal(rows().length,15,'Undo restores disabled states as well as active channels.');
// Odd legacy capacities can expand to valid odd-index stereo starts.
draft=begin();draft.io.outputs.count=3;draft.io.stereoPairs=[1];ctx.playbackSetChannelCount(draft,8);assert.deepEqual(clone(draft.io.stereoPairs),[1,3,5,7]);ctx.playbackSetChannelCount(draft,99);assert.equal(draft.io.outputs.count,8);
reset({outputs:{count:4,connector:'XLR'},stereoPairs:[],outputKeyStyle:'configured'});draft=begin();assert.equal(draft.mode,'custom');const legacyIds=rows().map(row=>row.id);ctx.playbackChooseMode(draft,'playaudio');ctx.savePlaybackDialog();assert(rows().every(row=>row.sourceKey.includes(':configured-out-')));assert.deepEqual(clone(rows().slice(0,4).map(row=>row.id)),clone(legacyIds));
// Shared analog signal paths cannot be silently turned into a different transport.
reset();draft=begin();const voice=ctx.stage.routing.inputs.find(row=>row.sourceKey.startsWith('station-2:'));rows()[0].linkedSources=[clone(voice)];rows()[0].instrument='Gemeinsamer Signalweg';ctx.stage.routing.inputs=ctx.stage.routing.inputs.filter(row=>row.id!==voice.id);ctx.playbackChooseMode(draft,'dante');const mixedBefore=ctx.snapshot();assert.equal(ctx.playbackChangeImpact(ctx.objects[0],draft).mixed,true);ctx.savePlaybackDialog();assert.deepEqual(ctx.snapshot(),mixedBefore);assert.equal(ctx.saved.length,0);
draft=begin();draft.io.aliases.outputs[0]='Intro';ctx.savePlaybackDialog();assert.equal(rows()[0].instrument,'Gemeinsamer Signalweg','Renaming a physical port preserves a deliberately merged signal name.');
draft=begin();draft.enabled[0]=false;ctx.savePlaybackDialog();assert(ctx.stage.routing.inputs.some(row=>row.linkedSources?.some(member=>member.sourceKey===voice.sourceKey)),'Disabling playback must retain other members in its former shared channel.');
reset();draft=begin();ctx.playbackChooseMode(draft,'playaudio');ctx.objects[0].locked=true;const locked=ctx.snapshot();ctx.savePlaybackDialog();assert.deepEqual(ctx.snapshot(),locked);ctx.objects[0].locked=false;ctx.sharedReadOnly=true;const shared=ctx.snapshot();ctx.savePlaybackDialog();assert.deepEqual(ctx.snapshot(),shared);
assert(!/<select\b|<details\b/.test(playback),'Playback options remain direct and visible.');
console.log('PASS PLAYBACK: transport choices, physical labels, mono/stereo, disabled ports, immutable drafts, stable CH/patch/notes, Dante isolation, legacy keys, shared sources and full undo snapshots.');
