const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),audio=fs.readFileSync('stageplot-audio-v1.js','utf8'),clone=value=>JSON.parse(JSON.stringify(value));
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const fixture=(id,type,count=1)=>({id,type,label:id,io:{inputs:{count:0,connector:'XLR'},outputs:{count,connector:'XLR'},stereoPairs:count>=2?[1]:[],aliases:{inputs:[],outputs:[]}}});
const ctx={StageplotMics:require('./stageplot-mics-v1.js'),projectText:(value,max)=>String(value??'').slice(0,max),normalizeIoConnector:value=>value||'XLR',routeModes:new Set(['Mono','Stereo L','Stereo R','Mic','DI','Direct']),routeSignals:new Set(['Mic','Line','Instrument','Digital']),
 byId:{'keys-stage4':{category:'keys',instrument:true,short:'Keys',name:'Keyboard'},guitar:{instrument:true,category:'guitars',short:'Guitar'},amp:{instrument:true,category:'amps',short:'Amp'},mixer:{instrument:true,ioDefaults:{inputs:8,outputs:4}},wedge:{},rack:{}},
 drumModel:{isDrums:()=>false},objectIo:o=>o.io,ioAliasText:value=>value||'',objects:[fixture('keys','keys-stage4',4),fixture('guitar','guitar'),fixture('amp','amp'),fixture('mixer','mixer',4)],stage:{routing:{inputs:[],outputs:[]}},routeToken:()=>String(++ctx.token),token:0,queueDraftSave(){},say(){},reconcileCablesWithRouting(){},esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;')};
ctx.routeSourceObject=row=>ctx.objects.find(o=>o.id===String(row?.sourceKey||'').split(':')[0]);ctx.routeSpec=(o,port,instrument,mode,signalType,extra)=>({sourceKey:o.id+':'+port,instrument,mode,signalType,...extra});ctx.ioAliasAt=()=>'';
vm.createContext(ctx);vm.runInContext(audio.slice(0,audio.indexOf("$('sp-audio-object').addEventListener")),ctx);
vm.runInContext(['normalizeRouteChannel','normalizeRouting','objectOutputPortKey','objectOutputBaseName','objectOutputSignal','generatedInputSpecs','generatedOutputSpecs','reconcileRouteList','syncRoutingFromStage'].map(extract).join('\n'),ctx);
ctx.syncRoutingFromStage(false,false);assert.equal(ctx.stage.routing.inputs.length,4,'New keyboards use two channels; mixer sockets do not become channels.');
assert.equal(ctx.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('keys:')).length,2);const ids=ctx.stage.routing.inputs.map(row=>row.id);ctx.syncRoutingFromStage(false,false);assert.deepEqual(ctx.stage.routing.inputs.map(row=>row.id),ids,'Repeated reconciliation keeps IDs.');
let left=ctx.stage.routing.inputs[0];Object.assign(left,{edited:true,instrument:'Flügel L',number:17,stagebox:'box',stageboxPort:3,pickup:'DI',connector:'XLR',microphone:'J48',phantom:true,notes:'Unverändert'});ctx.syncRoutingFromStage(false,false);left=ctx.stage.routing.inputs[0];assert.equal(left.number,17);assert.equal(left.stageboxPort,3);assert.equal(left.instrument,'Flügel L');assert.equal(left.pickup,'DI');assert.equal(left.microphone,'J48');
ctx.stage.routing.disabledSources.push(ctx.stage.routing.inputs[1].sourceKey);ctx.stage.routing.inputs.splice(1,1);ctx.syncRoutingFromStage(false,false);assert.equal(ctx.stage.routing.inputs.length,3,'Deleted automatic signals stay disabled.');
const guitar=ctx.stage.routing.inputs.find(row=>row.sourceKey==='guitar:main'),amp=ctx.stage.routing.inputs.find(row=>row.sourceKey==='amp:cabinet');guitar.linkedSources=[amp];ctx.stage.routing.inputs=ctx.stage.routing.inputs.filter(row=>row.id!==amp.id);ctx.syncRoutingFromStage(false,false);assert.equal(ctx.stage.routing.inputs.length,2,'Merged source does not regenerate.');assert(ctx.audioObjectChannels(ctx.objects[2]).startsWith('CH '),'Member objects refer to the canonical channel.');
// Existing legacy four-output keyboards keep every channel and their metadata.
const legacy=ctx.generatedInputSpecs().filter(row=>row.sourceKey.startsWith('keys:')).map((row,i)=>({...row,id:'route-old-'+i,number:31+i,microphone:'Legacy '+i,stagebox:'old-box',stageboxPort:i+1}));ctx.stage.routing={inputs:legacy,outputs:[]};ctx.syncRoutingFromStage(false,false);assert.equal(ctx.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('keys:')).length,4);assert.equal(ctx.stage.routing.inputs[3].number,34);
// Import / copy remaps source keys, stereo groups, patches, disabled sources and originals.
const migrated=ctx.normalizeRouting({inputs:[{...legacy[0],edited:true,adoptedSource:true,stereoGroup:'keys:stereo-out-1',linkedSources:[{...amp,number:55,notes:'Original behalten'}]}],outputs:[],disabledSources:['keys:out-4']},new Map([['keys','station-1'],['amp','station-2'],['old-box','station-3']]));assert.equal(migrated.inputs[0].adoptedSource,true);assert.equal(migrated.inputs[0].sourceKey,'station-1:out-1');assert.equal(migrated.inputs[0].stereoGroup,'station-1:stereo-out-1');assert.equal(migrated.inputs[0].stagebox,'station-3');assert.equal(migrated.inputs[0].linkedSources[0].sourceKey,'station-2:cabinet');assert.equal(migrated.inputs[0].linkedSources[0].number,55);assert.equal(migrated.disabledSources[0],'station-1:out-4');assert.deepEqual(clone(ctx.normalizeRouting(migrated)),clone(migrated));
const rows=[{id:'a',number:7,stereoGroup:'pair'},{id:'b',number:8,stereoGroup:'pair'},{id:'c',number:2},{id:'d',number:3}];const moved=ctx.moveAudioGroup(rows,'b','d','after');assert.deepEqual(clone(moved).map(row=>[row.id,row.number]),[['c',2],['d',3],['a',7],['b',8]]);
assert.deepEqual(clone(ctx.planAudioNumbers(rows,new Set(['a','b']),['#','#'])),[4,5]);assert.deepEqual(clone(ctx.planAudioNumbers(rows,new Set(['a','b']),['#','1'])),[4,1]);assert.deepEqual(clone(ctx.planAudioNumbers(rows,new Set(['a','b']),['7','8'])),[7,8]);assert.throws(()=>ctx.planAudioNumbers(rows,new Set(),['7']),/bereits/);
const boxes=[{id:'box',name:'A',capacity:4}],patchRows=[{id:'a',stagebox:'box',stageboxPort:1}];assert.deepEqual(clone(ctx.planAudioPorts(boxes,patchRows,new Set(),[{boxId:'box',port:''},{boxId:'box',port:2}])),[3,2]);assert.throws(()=>ctx.planAudioPorts(boxes,patchRows,new Set(),[{boxId:'box',port:1}]),/nicht frei/);
ctx.stage={routing:{inputs:[{number:7,instrument:'<Gitarre>',pickup:'DI',microphone:'J48',phantom:true,stagebox:'box',stageboxPort:3,notes:'Kabel stellt Band'}],outputs:[{number:2,instrument:'Monitor',outputKind:'monitor',mode:'Mono'}]}};ctx.stageboxRouteLocation=row=>row.stagebox?'Stagebox A IN '+row.stageboxPort:'Kein Stagebox-Patch';ctx.routeFrequency=()=>'';
const table=ctx.audioPrintTable('inputs');assert(table.includes('&lt;Gitarre>'));assert(table.includes('<td>48V</td>'));assert(table.includes('Stagebox A IN 3'));assert(!ctx.audioPrintTable('outputs').includes('IEM ·'));
assert(!html.includes('id="sp-iem-output-dialog"'),'Only one editor remains.');
console.log('PASS AUDIO: active signals, legacy migration, stable metadata, linked sources, stereo moves, explicit channel/port allocation and canonical print tables.');

// Patch allocation must be atomic and preserve a deliberate patch when drawing again.
ctx.routeNeedsDi=(row,direction,box)=>direction==='inputs'&&row.connector==='Klinke'&&!box.comboJacks;
const patchBox={id:'box',name:'Stagebox A',capacity:8},pair=[{id:'l',mode:'Stereo L',stereoGroup:'s',connector:'XLR',stagebox:'box',stageboxPort:5},{id:'r',mode:'Stereo R',stereoGroup:'s',connector:'XLR',stagebox:'box',stageboxPort:6}],busy=[{id:'other',stagebox:'box',stageboxPort:1}];
assert.deepEqual(clone(ctx.planAudioPatch([...pair,...busy],pair,patchBox,'inputs',{preserve:true})).assignments.map(row=>row.stageboxPort),[5,6]);
const emptyPair=pair.map(row=>({...row,stagebox:'',stageboxPort:null}));assert.deepEqual(clone(ctx.planAudioPatch([...emptyPair,...busy],emptyPair,patchBox,'inputs')).assignments.map(row=>row.stageboxPort),[2,3]);
const full=[...pair,{id:'u',stagebox:'small',stageboxPort:1}],unchanged=clone(full);assert.throws(()=>ctx.planAudioPatch(full,pair,{id:'small',name:'Kleine Stagebox',capacity:2},'inputs'),/Stereo|Buchsen/);assert.deepEqual(full,unchanged,'Planning failure must not erase the old stereo patch.');
assert.throws(()=>ctx.planAudioPatch(emptyPair,emptyPair,patchBox,'inputs',{startPort:8}),/Stereo/);
const otherPair=[{id:'x',stereoGroup:'other',stagebox:'box',stageboxPort:3},{id:'y',stereoGroup:'other',stagebox:'box',stageboxPort:4}];const replacement=ctx.planAudioPatch([...emptyPair,...otherPair],emptyPair,patchBox,'inputs',{startPort:2,replace:true});assert.deepEqual(clone(replacement).displaced,['x','y'],'Replacing half of another pair must identify the whole displaced signal.');
assert.throws(()=>ctx.planAudioPatch([{id:'k',connector:'Klinke'}],[{id:'k',connector:'Klinke'}],patchBox,'inputs'),/DI-Box/);
const applied=clone([...emptyPair,...otherPair]);ctx.applyAudioPatchPlan(applied,replacement);assert.deepEqual(applied.slice(0,2).map(row=>row.stageboxPort),[2,3]);assert(applied.slice(2).every(row=>!row.stagebox));
console.log('PASS AUDIO PATCH: atomic stereo allocation, preservation, capacity failures, compatibility and explicit replacement plans.');

ctx.routingStageboxes=()=>[patchBox];ctx.stageboxRouteLocation=row=>row.stagebox?'Stagebox A IN '+row.stageboxPort:'Kein Stagebox-Patch';ctx.routeFrequency=()=>'';
const searchable=[{id:'a',instrument:'Keyboard L',number:4,stereoGroup:'pair',notes:'Bühne links'},{id:'b',instrument:'Keyboard R',number:5,stereoGroup:'pair',notes:''},{id:'c',instrument:'Gesang',microphone:'SM58',number:null,stagebox:'box',stageboxPort:2}];
assert.deepEqual(clone(ctx.audioVisibleRows(searchable,'inputs','buhne links')).map(row=>row.id),['a','b'],'Search keeps stereo partners together.');
assert.deepEqual(clone(ctx.audioVisibleRows(searchable,'inputs','sm58','unnumbered')).map(row=>row.id),['c']);
assert.deepEqual(clone(ctx.audioVisibleRows(searchable,'inputs','','unpatched')).map(row=>row.id),['a','b']);
assert.deepEqual(clone(ctx.planAudioPorts([patchBox],[{id:'x',stagebox:'box',stageboxPort:2}],new Set(),[{boxId:'box',port:''},{boxId:'box',port:''}])),[3,4],'Automatic signal-editor patch uses adjacent stereo ports.');
// Legacy drawings still round-trip; routing edits never depend on them.
ctx.objects=[{id:'src'},{id:'box'},{id:'second'}];ctx.stage={routing:{inputs:[{id:'signal',sourceKey:'src:1',stagebox:'box',stageboxPort:7}],outputs:[]},cables:[{id:'cable-test',direction:'inputs',sourceKey:'src:1',sourceId:'src',targetId:'box',targetPort:1,length:10,route:[{x:0,y:0},{x:1,y:2},{x:3,y:0}],bundleId:'bundle-old'}]};
vm.runInContext([extract('normalizeCables'),extract('reconcileCablesWithRouting')].join('\n'),ctx);const legacyDrawing=clone(ctx.stage.cables);ctx.reconcileCablesWithRouting();assert.deepEqual(clone(ctx.stage.cables),legacyDrawing);
ctx.stage.routing.inputs[0].stagebox='second';ctx.reconcileCablesWithRouting();assert.deepEqual(clone(ctx.stage.cables),legacyDrawing,'Stagebox edits preserve archived drawing data without creating a new route.');
const copiedCables=ctx.normalizeCables(ctx.stage.cables,new Map([['src','new-source'],['box','new-box']]),[{id:'new-source'},{id:'new-box'}]);assert.equal(copiedCables[0].sourceKey,'new-source:1');assert.equal(copiedCables[0].targetId,'new-box');assert.equal(copiedCables[0].length,10);
for(const removed of ['sp-cable-view-toggle','sp-cable-popover','sp-print-cables','data-cable-source','data-cable-target','data-cable-layer','data-stagebox-draw','finishCableDrag','syncCableForPatchedRow'])assert(!html.includes(removed),removed+' must not expose a separate cable-drawing workflow.');
ctx.allRoutingStageboxes=()=>[{id:'box',name:'Stagebox A'}];ctx.stage.routing.inputs[0]={...ctx.stage.routing.inputs[0],stagebox:'box',instrument:'Gesang',connector:'XLR',number:4};const patchPrint=ctx.audioPatchSections()[0].html;assert.equal((patchPrint.match(/<th>/g)||[]).length,4);assert(patchPrint.includes('Gesang'));assert(patchPrint.includes('IN 7'));assert(!/Kabelweg|Nicht eingezeichnet/.test(patchPrint));
console.log('PASS AUDIO USABILITY: search, stereo-aware filters, direct port allocation, preserved legacy drafts and patch lists without drawing state.');

// Exercise the real bulk assignment and repatching handlers, beyond the planner.
const flow={stage:null,objects:[],sharedReadOnly:false,selected:null,token:0,messages:[],saves:[],
 routeToken:()=>String(++flow.token),routeNeedsDi:ctx.routeNeedsDi,routeSourceObject:row=>flow.objects.find(o=>o.id===row.sourceKey?.split(':')[0]),
 routingStageboxes:direction=>flow.boxes.filter(box=>box[direction]>0).map(box=>({...box,capacity:box[direction]})),
 snapshot:()=>JSON.stringify(flow.stage),syncRoutingFromStage(){},reconcileCablesWithRouting(){},refreshAudioSurface(){},renderEditor(){},
 say:message=>flow.messages.push(message),keepHistory:before=>flow.saves.push(before)};
vm.createContext(flow);vm.runInContext(audio.slice(0,audio.indexOf("$('sp-audio-object').addEventListener")),flow);
// Rendering is tested in-browser; no DOM is needed for the data transitions here.
vm.runInContext('refreshAudioSurface=()=>{}',flow);
vm.runInContext(['autoAssignRouting'].map(extract).join('\n'),flow);
const flowRows=()=>[{id:'l',sourceKey:'keys:l',mode:'Stereo L',stereoGroup:'pair',connector:'XLR',stagebox:'',stageboxPort:null},{id:'r',sourceKey:'keys:r',mode:'Stereo R',stereoGroup:'pair',connector:'XLR',stagebox:'',stageboxPort:null}];
flow.objects=[{id:'keys',x:0,y:0},{id:'near',x:1,y:0},{id:'far',x:8,y:0}];flow.boxes=[{...flow.objects[1],name:'Nah',inputs:2,outputs:0},{...flow.objects[2],name:'Fern',inputs:8,outputs:0}];
flow.stage={routing:{inputs:[...flowRows(),{id:'used',stagebox:'near',stageboxPort:1}],outputs:[]},cables:[]};
flow.autoAssignRouting();assert.deepEqual(clone(flow.stage.routing.inputs.slice(0,2)).map(row=>[row.stagebox,row.stageboxPort]),[['far',1],['far',2]],'Auto assignment skips a near box without room for the complete pair.');assert.equal(flow.stage.routing.inputs[2].stageboxPort,1);
flow.stage.routing.inputs[0].stageboxPort=5;flow.stage.routing.inputs[1].stagebox='';flow.stage.routing.inputs[1].stageboxPort=null;flow.autoAssignRouting();assert.equal(flow.stage.routing.inputs[0].stageboxPort,5);assert.equal(flow.stage.routing.inputs[1].stageboxPort,6,'A missing stereo partner prefers the adjacent free port, without moving the first channel.');
flow.stage.routing.inputs.push({id:'line',sourceKey:'keys:line',connector:'Klinke',stagebox:'',stageboxPort:null});flow.autoAssignRouting();assert.equal(flow.stage.routing.inputs.at(-1).stagebox,'','Auto assignment does not invent a DI box.');
ctx.objects=[{id:'keys',io:{outputs:{connector:'Klinke'}}}];assert.equal(ctx.audioInputConnector({sourceKey:'keys:1',connector:'XLR'},'Direct'),'Klinke');assert.equal(ctx.audioInputConnector({sourceKey:'keys:1',connector:'Klinke'},'DI'),'XLR');
console.log('PASS AUDIO FLOW: auto assignment preserves occupied ports, keeps stereo together and validates DI.');

flow.stageboxPatchContext=()=>flow.patchContext;flow.$=()=>({open:false});flow.stageboxPatchCandidateId='l';flow.view='routing';flow.confirmSetupAction=(title,message,label,commit)=>{flow.confirmation={title,message,commit};};
vm.runInContext(extract('applyStageboxPatch'),flow);
const selectedPair=flowRows().map((row,i)=>({...row,stagebox:'near',stageboxPort:i+1}));flow.stage={routing:{inputs:selectedPair,outputs:[]},cables:[]};flow.patchContext={rows:selectedPair,box:flow.boxes[0],patch:{boxId:'near',direction:'inputs',port:2},occupant:selectedPair[1],candidate:selectedPair[0]};
flow.applyStageboxPatch();assert.deepEqual(clone(flow.stage.routing.inputs).map(row=>row.stageboxPort),[1,2]);assert(!flow.confirmation,'Selecting the current stereo signal on its right port is a no-op, including the last port.');
const replacementRows=[...selectedPair,{id:'voice',instrument:'Gesang',connector:'XLR',stagebox:'far',stageboxPort:7}];flow.stage.routing.inputs=replacementRows;flow.stageboxPatchCandidateId='voice';flow.patchContext={...flow.patchContext,rows:replacementRows,candidate:replacementRows[2]};const beforeReplace=clone(replacementRows);flow.applyStageboxPatch();assert(flow.confirmation?.message.includes('Gesang'));assert.deepEqual(clone(replacementRows),beforeReplace,'Choosing an already used port does not change records until the user selects Umstecken.');flow.confirmation.commit();assert.deepEqual(clone(replacementRows).map(row=>[row.stagebox,row.stageboxPort]),[['',null],['',null],['near',2]],'An explicit replacement frees the full displaced pair.');
console.log('PASS AUDIO REPATCH: current stereo choice stays unchanged; explicit reassignment names the affected signal and updates the complete pair only after confirmation.');

// The editor must also work with no selected object after removing cable selection.
const inspectorNodes=new Map(),inspectorCtx={objects:[],selected:null,inspectorTab:'audio',setInspectorTab(){},$:id=>{if(!inspectorNodes.has(id))inspectorNodes.set(id,{setAttribute(){}});return inspectorNodes.get(id);}};
vm.createContext(inspectorCtx);vm.runInContext(extract('inspector'),inspectorCtx);inspectorCtx.inspector();assert.equal(inspectorCtx.$('sp-no-selection').hidden,false);inspectorCtx.selected='stage-zone';inspectorCtx.inspector();assert.equal(inspectorCtx.$('sp-no-selection').hidden,true);
console.log('PASS AUDIO EDITOR: empty and stage selection do not depend on removed cable state.');

// The compact editor must describe the actual patch, including split stereo.
const summaryDraft={name:'Keys',direction:'inputs',stereo:true,boxId:'a',rightBoxId:'a',port:'7',rightPort:'8',number:'14',rightNumber:'15'},summaryBoxes=[{id:'a',name:'Stagebox A',capacity:16},{id:'b',name:'Stagebox B',capacity:8}];
assert.deepEqual(clone(ctx.audioEditorSummary(summaryDraft,summaryBoxes).connections),['Stagebox A · IN 7 / 8 → CH 14 / 15']);
assert.deepEqual(clone(ctx.audioEditorSummary({...summaryDraft,rightBoxId:'b',rightPort:'3'},summaryBoxes).connections),['L: Stagebox A · IN 7 → CH 14','R: Stagebox B · IN 3 → CH 15']);
assert.deepEqual(clone(ctx.audioEditorSummary({...summaryDraft,direction:'outputs'},summaryBoxes).connections),['Mix / Output 14 / 15 → Stagebox A · OUT 7 / 8']);
assert.deepEqual(clone(ctx.audioEditorSummary({...summaryDraft,stereo:false,boxId:'',number:'#'},summaryBoxes).connections),['Keine Stagebox → CH automatisch']);
const candidates=ctx.audioPortCandidates(patchBox,[...pair,...busy],new Set(['l','r']),true,{port:5,rightPort:6,rightBoxId:'box'});
assert.equal(candidates.length,7,'An 8-port box has seven valid adjacent stereo starts, never OUT 8 / 9.');assert(candidates[0].occupants.length);assert(!candidates[4].occupants.length,'Both halves of the current signal remain selectable.');assert(candidates[4].selected);
assert(!ctx.audioPortCandidates(patchBox,pair,new Set(['l','r']),true,{port:5,rightPort:7,rightBoxId:'box'}).some(item=>item.selected),'Nonadjacent stereo is not shown as a selected adjacent pair.');
assert(!ctx.audioPortCandidates(patchBox,pair,new Set(['l','r']),true,{port:5,rightPort:6,rightBoxId:'other'}).some(item=>item.selected),'A split-box patch is not shown as an adjacent pair on the left box.');
assert.equal(ctx.audioPortCandidates({...patchBox,capacity:1},[],new Set(),true,{}).length,0);

// Run the real tab handlers and save function with persistent form controls.
const dialogNodes=new Map(),dialogCtx={StageplotMics:ctx.StageplotMics,objects:[],drumModel:ctx.drumModel,clone,editingRoute:{id:'l'},esc:ctx.esc,stage:{routing:{inputs:[],outputs:[],disabledSources:[]}},saved:0,routeSourceObject:()=>null,routeNeedsDi:()=>false,normalizeRouteChannel:row=>({...row,linkedSources:row.linkedSources||[]}),routingStageboxes:()=>summaryBoxes,reconcileCablesWithRouting(){},say(){},snapshot:()=>JSON.stringify(dialogCtx.stage),keepHistory:()=>dialogCtx.saved++};
dialogCtx.$=id=>{if(!dialogNodes.has(id))dialogNodes.set(id,{id,value:'',attributes:{},handlers:{},validity:{valid:true},hidden:false,querySelectorAll:()=>[],setAttribute(key,value){this.attributes[key]=value;},addEventListener(type,handler){this.handlers[type]=handler;},focus(){dialogCtx.focused=id;},close(){this.open=false;},closest:()=>null});return dialogNodes.get(id);};
const tabs=['signal','chain','patch','more'].map(key=>Object.assign(dialogCtx.$('sp-audio-tab-'+key),{dataset:{audioTab:key}}));
dialogCtx.$('sp-audio-editor-tabs').querySelectorAll=()=>tabs;
for(const key of ['signal','chain','patch','more'])dialogCtx.$('sp-audio-panel-'+key).dataset={audioPanel:key};
vm.createContext(dialogCtx);vm.runInContext(audio,dialogCtx);vm.runInContext('refreshAudioSurface=()=>{}',dialogCtx);
const tabClick=key=>dialogCtx.$('sp-audio-editor-tabs').handlers.click({target:{closest:()=>tabs.find(tab=>tab.dataset.audioTab===key)}});
const field=(id,value,panel='patch',manual=false)=>Object.assign(dialogCtx.$(id),{value,willValidate:true,closest:selector=>selector==='[data-audio-panel]'?dialogCtx.$('sp-audio-panel-'+panel):manual?dialogCtx.$('sp-audio-manual-ports'):null,reportValidity(){dialogCtx.reported=id;}});
const nameField=field('sp-channel-instrument','Keys','more'),numberField=field('sp-channel-number','14'),rightField=field('sp-audio-right-number','15'),portField=field('sp-audio-port','7','patch',false);
dialogCtx.$('sp-channel-form').elements=[nameField,numberField,rightField,portField];
tabClick('more');assert.equal(dialogCtx.$('sp-audio-panel-more').hidden,false);assert.equal(dialogCtx.$('sp-audio-panel-signal').hidden,true);assert.equal(numberField.value,'14');assert.equal(dialogCtx.saved,0,'Changing tabs cannot commit edits.');
dialogCtx.$('sp-audio-editor-tabs').handlers.keydown({target:tabs[3],key:'ArrowRight',preventDefault(){}});assert.equal(tabs[0].attributes['aria-selected'],'true');assert.equal(dialogCtx.focused,'sp-audio-tab-signal');
nameField.validity.valid=false;numberField.validity.valid=false;dialogCtx.saveAudioChannel();assert.equal(dialogCtx.reported,'sp-channel-instrument');assert.equal(dialogCtx.$('sp-audio-panel-more').hidden,false,'The first invalid field stays visible even when another tab also has an error.');
nameField.validity.valid=true;numberField.validity.valid=true;portField.validity.valid=false;tabClick('signal');dialogCtx.saveAudioChannel();assert.equal(dialogCtx.reported,'sp-audio-port');assert.equal(dialogCtx.$('sp-audio-panel-patch').hidden,false);assert.equal(dialogCtx.saved,0);
portField.validity.valid=true;
const dialogPair=[{id:'l',sourceKey:'keys:l',instrument:'Keys · L',number:14,mode:'Stereo L',stereoGroup:'keys',stagebox:'a',stageboxPort:7,pickup:'DI',microphone:'J48',notes:'Links'}, {id:'r',sourceKey:'keys:r',instrument:'Keys · R',number:15,mode:'Stereo R',stereoGroup:'keys',stagebox:'b',stageboxPort:3,pickup:'DI',microphone:'JDI',notes:'Rechts separat'}];
dialogCtx.stage.routing.inputs=clone(dialogPair);dialogCtx.editingRoute={...clone(dialogPair[0]),direction:'inputs',index:0,partner:clone(dialogPair[1])};
for(const [id,value] of Object.entries({'sp-channel-direction':'inputs','sp-audio-format':'stereo','sp-channel-stagebox':'a','sp-audio-right-port':'3','sp-audio-pickup':'DI','sp-channel-microphone':'J48','sp-channel-notes':'Neue Notiz'}))dialogCtx.$(id).value=value;
tabClick('more');dialogCtx.saveAudioChannel();assert.equal(dialogCtx.saved,1);assert.deepEqual(clone(dialogCtx.stage.routing.inputs).map(row=>[row.number,row.stagebox,row.stageboxPort,row.microphone,row.notes]),[[14,'a',7,'J48','Neue Notiz'],[15,'b',3,'JDI','Rechts separat']],'Saving from another tab preserves split stereo, channel numbers and independent right-channel metadata.');
const savedPatch=clone(dialogCtx.stage.routing);dialogCtx.$('sp-channel-number').value='15';tabClick('signal');dialogCtx.saveAudioChannel();assert.equal(dialogCtx.saved,1);assert.deepEqual(clone(dialogCtx.stage.routing),savedPatch,'Invalid allocation does not partially commit changes.');assert.equal(dialogCtx.$('sp-audio-panel-patch').hidden,false);assert.match(dialogCtx.$('sp-audio-error').textContent,/bereits vergeben/);
console.log('PASS SIGNAL DIALOG: stereo summaries, valid port choices, keyboard tabs, draft retention, hidden-field validation and atomic saves with split stereo metadata.');

// Manufacturer photos have exact model mappings, offline files and auditable provenance.
const crypto=require('node:crypto'),photoSources=JSON.parse(fs.readFileSync('stageplot-assets/mics/original-sources.json','utf8'));
for(const photo of photoSources){
  const bytes=fs.readFileSync('stageplot-assets/mics/'+photo.file);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),photo.sha256,photo.model+' must keep the downloaded original bytes.');
  assert.equal(photo.originalManufacturerPhoto,true);assert.equal(bytes.length,photo.bytes);
  assert.equal(ctx.audioMicPhoto(photo.model),'stageplot-assets/mics/'+photo.file);
  assert.match(new URL(photo.productPage).hostname,/shure\.com|telefunken-elektroakustik\.com|beyerdynamic\.com|neumann\.com|seelectronics\.com|audixusa\.com|sennheiser\.com/);
}
assert.equal(photoSources.length,19);assert.notEqual(ctx.audioMicPhoto('Telefunken M80-SH'),ctx.audioMicPhoto('Telefunken M80'),'Short and full-length versions have their own original photos.');
assert.equal(ctx.audioMicPhoto('Sennheiser MD 421'),'','A legacy model must not silently receive a different revision’s product photo.');
const micCatalog=ctx.audioMicCatalog();assert(micCatalog.some(mic=>mic.name==='Shure SM58'));assert.equal(ctx.audioMicBrand('sE Electronics V7'),'sE Electronics');assert.equal(ctx.audioMicBrand('Audio-Technica ATM230'),'Audio-Technica');
for(const name of ['Snare Top','Kick In','Hi-Hat','Drums · OH L','Congas','Gitarre','Lead Vocals'])for(const model of ctx.audioMicSuggestions(name))assert(micCatalog.some(mic=>mic.name===model),model+' is selectable for '+name);
assert(ctx.audioMicSuggestions('Snare Top').includes('Shure SM57'));assert(ctx.audioMicSuggestions('Lead Vocals').includes('sE Electronics V7'));
const dialogMarkup=html.slice(html.indexOf('<dialog id="sp-channel-dialog"'),html.indexOf('<dialog id="sp-audio-connect-dialog"'));
assert(!/<details\b|<select\b/.test(dialogMarkup),'The signal workspace has direct choices without dropdowns or folded headers.');
assert.match(dialogMarkup,/id="sp-channel-microphone" type="hidden"/);

// Exercise the actual compact picker, including draft cancellation and full stereo saves.
Object.assign(dialogCtx,{sharedReadOnly:false,objects:[{id:'keys',x:0,y:0},{id:'a',x:1,y:0,type:'stagebox'},{id:'b',x:8,y:0,type:'stagebox'}],byId:{stagebox:{}},icon:()=>'<svg></svg>',routeSourceObject:row=>dialogCtx.objects.find(o=>o.id===row.sourceKey?.split(':')[0]),routeNeedsDi:ctx.routeNeedsDi,objectIo:()=>({outputs:{connector:'XLR'}}),routeFrequency:row=>row.frequencyBand||'',setChannelPillValue:(id,value)=>dialogCtx.$(id).value=value});
// Keep the real form change handler for a separate renderer pass below.
vm.runInContext('this.realAudioFormChanged=audioFormChanged;audioFormChanged=()=>{};',dialogCtx);
for(const id of ['sp-audio-connect-dialog','sp-channel-dialog'])dialogCtx.$(id).showModal=function(){this.open=true;};
const quickRows=()=>[{id:'l',sourceKey:'keys:l',instrument:'Keys · L',number:14,mode:'Stereo L',stereoGroup:'pair',connector:'XLR',stagebox:'',stageboxPort:null,microphone:'J48',notes:'Links'},{id:'r',sourceKey:'keys:r',instrument:'Keys · R',number:15,mode:'Stereo R',stereoGroup:'pair',connector:'XLR',stagebox:'',stageboxPort:null,microphone:'JDI',notes:'Rechts'}];
const quickBoxes=[{id:'a',name:'Nah',x:1,y:0,capacity:2},{id:'b',name:'Fern',x:8,y:0,capacity:8}];dialogCtx.routingStageboxes=()=>quickBoxes;
dialogCtx.stage.routing.inputs=[...quickRows(),{id:'busy',stagebox:'a',stageboxPort:1}];dialogCtx.saved=0;
const quickBefore=clone(dialogCtx.stage);dialogCtx.openAudioPatch('inputs','l');assert.deepEqual(clone(dialogCtx.stage),quickBefore);assert.equal(dialogCtx.saved,0);
assert.equal(vm.runInContext('audioQuickPatch.boxId',dialogCtx),'b','The complete stereo pair skips a closer stagebox with one occupied socket.');
assert.match(dialogCtx.$('sp-audio-connect-boxes').innerHTML,/<svg>/);assert.match(dialogCtx.$('sp-audio-connect-save').textContent,/IN 1 \/ 2/);
dialogCtx.$('sp-audio-connect-dialog').handlers.close();assert.deepEqual(clone(dialogCtx.stage),quickBefore,'Closing without connecting never changes routing.');
dialogCtx.openAudioPatch('inputs','l');vm.runInContext('audioQuickPatch.preserve=false;audioQuickPatch.startPort=8;',dialogCtx);dialogCtx.commitAudioQuickPatch();assert.deepEqual(clone(dialogCtx.stage),quickBefore,'A stereo pair cannot partially occupy the last socket.');assert.equal(dialogCtx.saved,0);
dialogCtx.$('sp-audio-connect-ports').handlers.click({target:{closest:()=>({dataset:{audioConnectPort:'5'},disabled:false})}});dialogCtx.commitAudioQuickPatch();assert.equal(dialogCtx.saved,1);assert.deepEqual(clone(dialogCtx.stage.routing.inputs.slice(0,2)).map(row=>[row.stagebox,row.stageboxPort,row.number,row.microphone,row.notes]),[['b',5,14,'J48','Links'],['b',6,15,'JDI','Rechts']]);
// The current patch is recommended, even when a different stagebox is closer and available.
dialogCtx.stage.routing.inputs.pop();dialogCtx.openAudioPatch('inputs','r');assert.equal(vm.runInContext('audioQuickPatch.boxId',dialogCtx),'b');assert.equal(vm.runInContext('audioQuickPatch.plan.assignments[0].stageboxPort',dialogCtx),5);
dialogCtx.commitAudioQuickPatch(true);assert(dialogCtx.stage.routing.inputs.every(row=>!row.stagebox));assert.deepEqual(clone(dialogCtx.stage.routing.inputs).map(row=>row.number),[14,15]);
// A draft connection only changes form fields, and the full save moves both halves together.
dialogCtx.stage.routing.inputs=clone(dialogPair);dialogCtx.editingRoute={...clone(dialogPair[0]),direction:'inputs',index:0,partner:clone(dialogPair[1])};
for(const [id,value] of Object.entries({'sp-channel-direction':'inputs','sp-audio-format':'stereo','sp-channel-stagebox':'a','sp-audio-port':'1','sp-audio-right-port':'3','sp-channel-number':'14','sp-audio-right-number':'15','sp-audio-pickup':'DI','sp-channel-microphone':'J48','sp-channel-notes':'Links'}))dialogCtx.$(id).value=value;
const beforeDraft=clone(dialogCtx.stage),savesBefore=dialogCtx.saved;dialogCtx.openAudioPatch('inputs','l',{draft:true});dialogCtx.selectAudioQuickBox('b');dialogCtx.commitAudioQuickPatch();assert.deepEqual(clone(dialogCtx.stage),beforeDraft);assert.equal(dialogCtx.saved,savesBefore);assert.equal(dialogCtx.audioEditorRightBox(),'b');
dialogCtx.saveAudioChannel();assert.equal(dialogCtx.saved,savesBefore+1);assert(dialogCtx.stage.routing.inputs.every(row=>row.stagebox==='b'));assert.equal(dialogCtx.stage.routing.inputs[1].microphone,'JDI');
// Compatibility checks never fabricate a DI box; no stageboxes remains a clear empty state.
dialogCtx.stage.routing.inputs=[{id:'line',instrument:'Synth',sourceKey:'keys:line',connector:'Klinke'}];dialogCtx.openAudioPatch('inputs','line');assert.equal(dialogCtx.$('sp-audio-connect-save').disabled,true);assert.match(dialogCtx.$('sp-audio-connect-boxes').innerHTML,/DI-Box nötig/);
dialogCtx.routingStageboxes=()=>[];dialogCtx.openAudioPatch('inputs','line');assert.match(dialogCtx.$('sp-audio-connect-boxes').innerHTML,/Noch keine passende Stagebox/);assert.equal(dialogCtx.$('sp-audio-connect-save').disabled,true);
console.log('PASS AUDIO V2: original manufacturer photos, model recommendations, compact patch picker, cancellation, occupied ports, atomic stereo, draft isolation and unchanged mixer metadata.');

const savedSpecs=ctx.generatedInputSpecs;ctx.generatedInputSpecs=()=>[{sourceKey:'perc:perc-pad-l',connector:'Klinke'}];ctx.objects=[{id:'perc',type:'percussion'}];
assert.equal(ctx.audioInputConnector({sourceKey:'perc:perc-pad-l',connector:'XLR'},'Direct'),'Klinke','Switching a percussion pad from DI back to Direct restores its real jack output.');
assert.equal(ctx.audioInputConnector({sourceKey:'perc:perc-pad-l',connector:'Klinke'},'DI'),'XLR');ctx.generatedInputSpecs=savedSpecs;

// Physical sockets: every real port is visible; stereo ends, occupancy and highlights are explicit.
const sockets=ctx.audioQuickSocketStates([...pair,...busy],pair,patchBox,'inputs',{assignments:[{id:'l',stagebox:'box',stageboxPort:5},{id:'r',stagebox:'box',stageboxPort:6}]});
assert.equal(sockets.length,8,'All physical sockets remain visible, including the last stereo-incompatible start.');
assert.equal(sockets[7].disabled,true);assert.equal(sockets[4].selected,true);assert.equal(sockets[4].side,'L');assert.equal(sockets[5].selected,true);assert.equal(sockets[5].side,'R');assert.equal(sockets[5].disabled,false,'The active right side can be clicked without moving the pair.');assert(sockets[0].occupant);assert(sockets[0].disabled);
const socketHtml=ctx.audioSocketMarkup(patchBox,'outputs',{port:4,selected:true,side:'R'},'data-audio-connect-port="4"');
assert.match(socketHtml,/data-stagebox-direction="outputs"/);assert.match(socketHtml,/data-active-port="true"/);assert.match(socketHtml,/class="sp-stagebox-socket"/);assert.match(socketHtml,/OUT 4/);assert.match(socketHtml,/R · gewählt/);
const quickMarkup=html.slice(html.indexOf('<dialog id="sp-audio-connect-dialog"'),html.indexOf('</dialog>',html.indexOf('<dialog id="sp-audio-connect-dialog"')));
assert(!/<input|<select/.test(quickMarkup),'Connecting a stagebox never exposes abstract port input fields.');
assert.match(dialogMarkup,/id="sp-audio-port" type="hidden"/);assert.match(dialogMarkup,/id="sp-audio-right-port" type="hidden"/);
// Actual socket click handlers: unavailable/occupied ports do not lose the current valid choice.
dialogCtx.routingStageboxes=()=>quickBoxes;dialogCtx.stage.routing.inputs=[...quickRows(),{id:'busy',instrument:'Gesang',stagebox:'b',stageboxPort:3}];
dialogCtx.openAudioPatch('inputs','l');dialogCtx.selectAudioQuickBox('b');
const clickSocket=(port,disabled=false)=>dialogCtx.$('sp-audio-connect-ports').handlers.click({target:{closest:()=>({dataset:{audioConnectPort:String(port)},disabled})}});
let priorPlan=clone(vm.runInContext('audioQuickPatch.plan',dialogCtx));clickSocket(3,true);clickSocket(8);assert.deepEqual(clone(vm.runInContext('audioQuickPatch.plan',dialogCtx)),priorPlan);
clickSocket(5);priorPlan=clone(vm.runInContext('audioQuickPatch.plan',dialogCtx));clickSocket(6);assert.deepEqual(clone(vm.runInContext('audioQuickPatch.plan',dialogCtx)),priorPlan,'Clicking active R is a no-op.');
assert.equal((dialogCtx.$('sp-audio-connect-ports').innerHTML.match(/data-active-port="true"/g)||[]).length,2);assert.match(dialogCtx.$('sp-audio-connect-ports').innerHTML,/Gesang/);
// Revalidate at commit, even if another update occupied a proposed socket after opening.
const beforeBusySave=dialogCtx.saved;dialogCtx.stage.routing.inputs.push({id:'late',stagebox:'b',stageboxPort:5});const lateSnapshot=clone(dialogCtx.stage);dialogCtx.commitAudioQuickPatch();assert.equal(dialogCtx.saved,beforeBusySave);assert.deepEqual(clone(dialogCtx.stage),lateSnapshot);assert.equal(dialogCtx.$('sp-audio-connect-save').disabled,true);
// Output uses male XLR artwork and preserves mixer numbers when changing the physical port.
dialogCtx.stage.routing.outputs=[{id:'out',instrument:'Monitor Gesang',number:7,connector:'XLR',stagebox:'b',stageboxPort:2}];dialogCtx.openAudioPatch('outputs','out');assert.match(dialogCtx.$('sp-audio-connect-ports').innerHTML,/OUTPUTS · VOM MISCHPULT/);clickSocket(8);dialogCtx.commitAudioQuickPatch();assert.equal(dialogCtx.stage.routing.outputs[0].stageboxPort,8);assert.equal(dialogCtx.stage.routing.outputs[0].number,7);
// A full or incompatible box remains inspectable without allowing an invalid connection.
dialogCtx.stage.routing.inputs=[...quickRows(),{id:'full1',stagebox:'a',stageboxPort:1},{id:'full2',stagebox:'a',stageboxPort:2}];dialogCtx.openAudioPatch('inputs','l');dialogCtx.selectAudioQuickBox('a');assert.equal(dialogCtx.$('sp-audio-connect-save').disabled,true);assert.equal((dialogCtx.$('sp-audio-connect-ports').innerHTML.match(/data-audio-connect-port=/g)||[]).length,2);
console.log('PASS PHYSICAL PATCH: real input/output sockets, stereo L/R pink selection, occupied/invalid ports, right-side no-op, commit revalidation, full-box inspection and hidden legacy storage fields.');
