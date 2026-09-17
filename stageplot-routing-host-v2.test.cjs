const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),audio=fs.readFileSync('stageplot-audio-v1.js','utf8'),host=fs.readFileSync('stageplot-routing-host-v2.js','utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
function extract(name){
  const start=(name==='bounds'?html.lastIndexOf('  function '+name+'('):html.indexOf('  function '+name+'('));assert(start>=0,'Missing host function '+name);
  const end=html.indexOf('\n',start),line=html.slice(start,end);
  if(line.trimEnd().endsWith('}'))return line;
  const close=html.indexOf('\n  }',end);assert(close>=0,'Missing closing brace '+name);return html.slice(start,close+4);
}
const fixture=(id,type,connector='XLR',count=1)=>({id,type,label:id,x:1,y:1,angle:0,io:{inputs:{count:0,connector:'XLR'},outputs:{count,connector},stereoPairs:count>1?[1]:[],aliases:{inputs:[],outputs:[]}}});
function harness(list=[]){
  const nodes=new Map(),ctx={StageplotRoutingModel:require('./stageplot-routing-model-v2.js'),StageplotMics:require('./stageplot-mics-v1.js'),StageplotIem:require('./stageplot-iem-v1.js'),
    stage:{title:'Routing QA',w:8,d:6,routing:{inputs:[],outputs:[],devices:[],disabledSources:[]},cables:[]},objects:clone(list),history:[],future:[],sharedReadOnly:false,routingTab:'inputs',activeStageboxId:'',nextId:20,token:0,renders:0,saves:0,undoCalls:0,autoCalls:0,
    byId:{guitar:{instrument:true,category:'guitars',short:'Guitar',name:'Gitarre'},keys:{instrument:true,category:'keys',short:'Keys',name:'Keys'},'keys-wave2':{instrument:true,category:'keys',short:'Wave 2',name:'Nord Wave 2'},'keys-stage4':{instrument:true,category:'keys',short:'Stage 4',name:'Nord Stage 4'},'keys-bassstation2':{instrument:true,category:'keys',short:'Bass Station',name:'Bass Station'},mic:{instrument:true,name:'Mic'},di:{name:'DI'},rack:{name:'IEM Rack'},wedge:{name:'Wedge'},'iem-earphones':{},'stagebox-8':{short:'Stagebox A'}},
    stageboxCapacity:{'stagebox-8':{inputs:8,outputs:4}},routeModes:new Set(['Mono','Stereo L','Stereo R','Mic','DI','Direct']),routeSignals:new Set(['Mic','Line','Instrument','Digital']),
    projectText:(value,max)=>String(value??'').slice(0,max),normalizeIoConnector:(value,fallback='XLR')=>['XLR','Klinke','USB','Digital','MADI','Dante'].includes(value)?value:fallback,
    ioConnectorValues:['XLR','Klinke','USB','Digital','MADI','Dante'],
    drumModel:{isDrums:()=>false},routeToken:()=>String(++ctx.token),queueDraftSave(){},reconcileCablesWithRouting(){},say(){},isObjectUnlocked:()=>true,
    objectSize:o=>o.type==='di'?{w:.1,d:.16}:{w:1.2,d:.4},
    makeObject:(type,position,id)=>({...fixture(id,type),angle:0,...position,...(type==='rack'?{iemMixes:[{id:'main',name:'IEM 1',mode:'stereo',transport:'wireless',ports:['iem-l','iem-r']}]}:{})}),
    $:id=>{if(!nodes.has(id))nodes.set(id,{disabled:false});return nodes.get(id);},
    Date:{now:()=>1000},
  };
  ctx.snapshot=()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects});
  ctx.persistDraft=()=>{ctx.saves++;if(ctx.saveError)throw Error('Speichern fehlgeschlagen');return true;};
  ctx.undo=()=>ctx.undoCalls++;ctx.autoAssignRouting=()=>ctx.autoCalls++;
  vm.createContext(ctx);
  vm.runInContext(audio.slice(0,audio.indexOf("$('sp-audio-object').addEventListener")),ctx);
  vm.runInContext(['bounds','rectanglesOverlap','outside','normalizeRouteChannel','normalizeRouting','parseIoValue','defaultObjectIo','normalizeObjectIo','objectOutputPortKey','objectOutputBaseName','objectOutputSignal','generatedInputSpecs','generatedOutputSpecs','reconcileRouteList','syncRoutingFromStage','routingStageboxes','routeSourceObject','keepHistory','detachConnectionsForObject'].map(extract).join('\n'),ctx);
  for(const name of ['normalizeIemConfig','routeNeedsDi','routeStageboxCompatible','routeSpec','ioValueText','parseOutsValue','ioAliasText','normalizeIoAliasList','objectIo','ioAliasAt'])vm.runInContext(html.match(new RegExp('^  const '+name+'=[^\\n]+','m'))[0],ctx);
  vm.runInContext(host,ctx);vm.runInContext('renderRouting=()=>{renders++};',ctx);
  ctx.syncRoutingFromStage(false,false);return ctx;
}
const getRow=(ctx,id,direction='inputs')=>ctx.stage.routing[direction].find(row=>row.id===id);
const runFailures=[];
function test(name,fn){try{fn();}catch(error){runFailures.push(name);console.error('FAIL ROUTING HOST: '+name+'\n'+error.stack);}}

test('Patch transactions preserve channel metadata and reject collisions without writes',()=>{
  const c=harness([fixture('keys','keys','XLR',2),fixture('voice','guitar'),fixture('box','stagebox-8')]),[left,right,busy]=c.stage.routing.inputs;
  Object.assign(left,{number:11,microphone:'Left',notes:'Behalten'});Object.assign(right,{number:12,microphone:'Right'});Object.assign(busy,{stagebox:'box',stageboxPort:4});
  const before=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:3}),/belegt/);assert.equal(c.snapshot(),before);assert.equal(c.saves,0);assert.equal(c.history.length,0);
  c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:6});
  assert.deepEqual(clone(c.stage.routing.inputs.slice(0,2)).map(row=>[row.stageboxPort,row.number,row.microphone]),[[6,11,'Left'],[7,12,'Right']]);assert.equal(getRow(c,left.id).notes,'Behalten');assert.equal(c.saves,1);
  const patched=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:8}),/Stereo/);assert.equal(c.snapshot(),patched);
  assert.throws(()=>c.dispatchRoutingWorkspace({type:'editChannel',rowId:left.id,fields:{number:12,notes:'Nicht speichern'}}),/belegt/);assert.equal(c.snapshot(),patched);
});

test('Editing one member patches and disconnects its whole stereo pair with an L anchor',()=>{
  const c=harness([fixture('keys','keys','XLR',2),fixture('box','stagebox-8')]),[left,right]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'patch',rowIds:[right.id],boxId:'box',port:2});assert.deepEqual(clone(c.stage.routing.inputs).map(row=>[row.id,row.stageboxPort]),[[left.id,2],[right.id,3]]);
  c.dispatchRoutingWorkspace({type:'unpatch',rowIds:[left.id]});assert(c.stage.routing.inputs.every(row=>row.stagebox===''&&row.stageboxPort===null));
});

test('An exception during save restores document and undo state',()=>{
  const c=harness([fixture('guitar','guitar')]),row=c.stage.routing.inputs[0],before=c.snapshot();c.future=['redo-entry'];c.saveError=true;
  assert.throws(()=>c.dispatchRoutingWorkspace({type:'editChannel',rowId:row.id,fields:{number:27,notes:'Changed'}}),/Speichern/);
  assert.equal(c.snapshot(),before);assert.deepEqual(clone(c.history),[],'A failed action must not add an undo entry.');assert.deepEqual(clone(c.future),['redo-entry'],'A failed action must not clear redo.');
});

test('Unavailable local storage retains pending edits for retry',()=>{
  const c=harness([fixture('guitar','guitar')]),row=c.stage.routing.inputs[0];c.persistDraft=()=>false;
  c.dispatchRoutingWorkspace({type:'editChannel',rowId:row.id,fields:{number:27,notes:'Still in memory'}});
  assert.equal(getRow(c,row.id).number,27);assert.equal(getRow(c,row.id).notes,'Still in memory');assert.equal(c.history.length,1,'Unsaved changes remain undoable.');
});

test('Read-only and locked object guards prevent writes from direct dispatch',()=>{
  const c=harness([fixture('guitar','guitar'),fixture('box','stagebox-8')]),row=c.stage.routing.inputs[0],before=c.snapshot();c.sharedReadOnly=true;
  for(const action of [{type:'editChannel',rowId:row.id,fields:{number:7}},{type:'addPickup',sourceId:'guitar',kind:'Mic'},{type:'undo'},{type:'autoPatch'},{type:'editStagebox',boxId:'box',fields:{name:'New'}}])assert.throws(()=>c.dispatchRoutingWorkspace(action),/schreibgeschützt/);
  assert.equal(c.snapshot(),before);assert.equal(c.saves+c.undoCalls+c.autoCalls,0);c.dispatchRoutingWorkspace({type:'selectTab',tab:'stageboxes'});assert.equal(c.routingTab,'stageboxes');
  c.sharedReadOnly=false;c.objects[0].locked=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'setPickup',rowId:row.id,kind:'DI'}),/gesperrt/);assert.equal(c.saves,0);
});

test('Mono sources share one stereo DI and occupied DI inputs remain atomic',()=>{
  const c=harness([fixture('guitar','guitar','Klinke'),fixture('bass','guitar','Klinke')]),[guitar,bass]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:guitar.id,modelId:'radial-prod2'});const deviceId=getRow(c,guitar.id).diDeviceId;
  assert.equal(c.stage.routing.devices.length,1);assert.equal(c.StageplotRoutingModel.occupancy(c.stage.routing,deviceId)[1].free,true);
  c.dispatchRoutingWorkspace({type:'assignDi',rowId:bass.id,deviceId,channel:2});assert.equal(c.stage.routing.devices.length,1);assert(c.stage.routing.inputs.every(row=>!row.stereoGroup));
  const before=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'assignDi',rowId:bass.id,deviceId,channel:1}),/belegt/);assert.equal(c.snapshot(),before);
  c.dispatchRoutingWorkspace({type:'updateDi',deviceId,fields:{name:'Gemeinsame DI'}});assert(c.stage.routing.inputs.every(row=>row.microphone==='Gemeinsame DI'));
});

test('Stereo DI capability preserves old mono drafts and excludes mic, guitar and digital sources',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke'),fixture('guitar','guitar','Klinke'),fixture('mic','mic'),fixture('digital','keys-wave2','Dante',2),fixture('bassstation','keys-bassstation2','Klinke')]);
  c.allRoutingStageboxes=()=>[];c.draftState='saved';const before=c.snapshot(),capability=c.routingWorkspaceState().diStereoSources;
  assert.equal(capability.wave,true);assert.equal(capability.guitar,false);assert.equal(capability.mic,false);assert.equal(capability.digital,false);assert.equal(capability.bassstation,false);
  assert.equal(c.snapshot(),before);c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('wave:')).length,1);assert.equal(c.objects.find(o=>o.id==='wave').io.outputs.count,1);
});

test('Connect L and R expands a saved mono Wave onto the same physical DI in one undo step',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke'),fixture('box','stagebox-8')]),id=c.stage.routing.inputs[0].id;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:id,modelId:'radial-prod2'});const deviceId=getRow(c,id).diDeviceId;
  c.dispatchRoutingWorkspace({type:'patch',rowIds:[id],boxId:'box',port:4});c.dispatchRoutingWorkspace({type:'editChannel',rowId:id,fields:{number:12,instrument:'Mein Wave links',notes:'CH bleibt'}});
  const before=c.snapshot(),count=c.history.length,saves=c.saves;c.future=['redo-entry'];
  c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:id,deviceId});
  const rows=c.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('wave:')).sort((a,b)=>a.portIndex-b.portIndex),left=getRow(c,id),right=rows[1];
  assert.equal(rows.length,2);assert.equal(left.sourceKey,'wave:out-1');assert.equal(right.sourceKey,'wave:out-2');assert.equal(left.diDeviceId,deviceId);assert.equal(right.diDeviceId,deviceId);assert.equal(c.stage.routing.devices.length,1);
  assert.deepEqual(clone(rows.map(row=>[row.diChannel,row.mode])),[[1,'Stereo L'],[2,'Stereo R']]);assert(left.stereoGroup&&left.stereoGroup===right.stereoGroup);
  assert.deepEqual([left.number,left.instrument,left.notes,left.stagebox,left.stageboxPort],[12,'Mein Wave links','CH bleibt','box',4]);assert.equal(right.number,null);assert.equal(right.stagebox,'');assert.equal(right.stageboxPort,null);
  assert.equal(c.objects.find(o=>o.id==='wave').io.outputs.count,2);assert.deepEqual(clone(c.objects.find(o=>o.id==='wave').io.stereoPairs),[1]);assert.equal(c.objects.find(o=>o.id==='wave').outs,'2 Outs · Klinke');
  assert.equal(c.history.length,count+1);assert.equal(c.history.at(-1),before);assert.equal(c.saves,saves+1);assert.deepEqual(clone(c.future),[]);
  const connected=c.snapshot();c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:right.id,deviceId});assert.equal(c.snapshot(),connected);assert.equal(c.history.length,count+1,'Repeating the completed action is a no-op.');
  c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.length,2);assert.equal(c.stage.routing.devices.length,1);
  const undo=JSON.parse(c.history.at(-1));c.stage=undo.stage;c.objects=undo.objects;c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.length,1);assert.equal(getRow(c,id).stageboxPort,4);assert.equal(c.objects[0].io.outputs.count,1);
});

test('A disabled native right output is reactivated without duplicating a DI or changing other outputs',()=>{
  const source=fixture('wave','keys-wave2','Klinke',4);source.io.outputKeyStyle='configured';source.io.stereoPairs=[3];source.io.aliases.outputs=['Lead L','Lead R','Extra L','Extra R'];
  const c=harness([source]),left=c.stage.routing.inputs[0],right=c.stage.routing.inputs[1];
  c.dispatchRoutingWorkspace({type:'removePickup',rowId:right.id});c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-j48-stereo'});
  const deviceId=getRow(c,left.id).diDeviceId;c.stage.routing.disabledSources.push('unrelated:out-1');
  c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:left.id,deviceId});
  const rows=c.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('wave:'));
  assert.deepEqual(clone(rows.map(row=>row.sourceKey)),['wave:configured-out-1','wave:configured-out-2']);assert.equal(new Set(rows.map(row=>row.diDeviceId)).size,1);assert.equal(c.stage.routing.devices.length,1);assert(rows.every(row=>row.phantom));
  assert.deepEqual(clone(c.stage.routing.disabledSources),['unrelated:out-1']);assert.equal(c.objects[0].io.outputs.count,4);assert.deepEqual(clone(c.objects[0].io.stereoPairs),[1,3]);assert.deepEqual(clone(c.objects[0].io.aliases.outputs),source.io.aliases.outputs);assert.equal(c.objects[0].io.outputKeyStyle,'configured');
});

test('Existing left and right channels keep their IDs and patches while DI ports become 1 and 2',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke',2),fixture('box','stagebox-8')]),[left,right]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});const deviceId=getRow(c,left.id).diDeviceId;
  c.StageplotRoutingModel.assignDevice(c.stage.routing,[left.id,right.id],deviceId,[2,1]);
  c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:5});
  c.dispatchRoutingWorkspace({type:'editChannel',rowId:left.id,fields:{number:15,notes:'Links'}});c.dispatchRoutingWorkspace({type:'editChannel',rowId:right.id,fields:{number:16,notes:'Rechts'}});
  const prior=c.stage.routing.inputs.map(row=>[row.id,row.sourceKey,row.number,row.stagebox,row.stageboxPort,row.notes]);
  c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:right.id,deviceId});
  assert.deepEqual(c.stage.routing.inputs.map(row=>[row.id,row.sourceKey,row.number,row.stagebox,row.stageboxPort,row.notes]),prior);assert.deepEqual(clone(c.stage.routing.inputs.map(row=>row.diChannel)),[1,2]);assert.equal(c.stage.routing.devices.length,1);
});

test('Stereo DI conflicts and save failures restore source IO, routing and undo state together',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke'),fixture('bass','guitar','Klinke')]),[wave,bass]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:wave.id,modelId:'radial-prod2'});const deviceId=getRow(c,wave.id).diDeviceId;
  c.dispatchRoutingWorkspace({type:'assignDi',rowId:bass.id,deviceId,channel:2});c.future=['redo-entry'];
  const before=c.snapshot(),history=clone(c.history),saves=c.saves;
  assert.throws(()=>c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:wave.id,deviceId}),/belegt/);assert.equal(c.snapshot(),before);assert.deepEqual(clone(c.history),history);assert.deepEqual(clone(c.future),['redo-entry']);assert.equal(c.saves,saves);
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:bass.id,kind:'Direct'});const free=c.snapshot(),freeHistory=clone(c.history);c.future=['retry-redo'];c.saveError=true;
  assert.throws(()=>c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:wave.id,deviceId}),/Speichern/);assert.equal(c.snapshot(),free);assert.deepEqual(clone(c.history),freeHistory);assert.deepEqual(clone(c.future),['retry-redo']);assert.equal(c.stage.routing.devices.length,1);
});

test('Stereo DI rejects readonly, source/physical DI locks, digital rows and mono DI capacity',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke'),fixture('physical','di')]),id=c.stage.routing.inputs[0].id;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:id,modelId:'radial-prod2'});const deviceId=getRow(c,id).diDeviceId,action={type:'connectStereoDi',rowId:id,deviceId};
  c.sharedReadOnly=true;assert.throws(()=>c.dispatchRoutingWorkspace(action),/schreibgeschützt/);c.sharedReadOnly=false;
  c.objects[0].locked=true;assert.throws(()=>c.dispatchRoutingWorkspace(action),/gesperrt/);c.objects[0].locked=false;
  c.stage.routing.devices.find(d=>d.id===deviceId).objectId='physical';c.objects[1].locked=true;assert.throws(()=>c.dispatchRoutingWorkspace(action),/gesperrt/);c.objects[1].locked=false;c.stage.routing.devices.find(d=>d.id===deviceId).objectId='';
  getRow(c,id).pickup='Digital';getRow(c,id).connector='USB';const digital=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace(action),/digitales Signal/);assert.equal(c.snapshot(),digital);
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:id,kind:'DI'});c.dispatchRoutingWorkspace({type:'createDi',rowId:id,modelId:'radial-j48'});const mono=c.snapshot();
  assert.throws(()=>c.dispatchRoutingWorkspace({...action,deviceId:getRow(c,id).diDeviceId}),/zwei Eingängen/);assert.equal(c.snapshot(),mono);
});

test('Stereo DI never duplicates merged native outputs or repurposes an extra pickup',()=>{
  for(const merged of ['right-under-another-route','source-has-linked-route','extra-pickup']){
    const c=harness([fixture('wave','keys-wave2','Klinke'),fixture('voice','mic')]),id=c.stage.routing.inputs[0].id;
    c.dispatchRoutingWorkspace({type:'createDi',rowId:id,modelId:'radial-prod2'});const deviceId=getRow(c,id).diDeviceId;let selected=id;
    if(merged==='right-under-another-route')c.stage.routing.inputs.find(row=>row.sourceKey==='voice:mic').linkedSources=[{id:'merged-right',sourceKey:'wave:out-2',instrument:'Wave R',manual:true}];
    else if(merged==='source-has-linked-route')getRow(c,id).linkedSources=[{id:'merged-other',sourceKey:'other:main',instrument:'Andere Quelle',manual:true}];
    else {c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'wave',kind:'DI'});selected=c.stage.routing.inputs.find(row=>row.origin==='pickup').id;}
    const before=c.snapshot(),history=clone(c.history),saves=c.saves;
    assert.throws(()=>c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:selected,deviceId}),/Signalweg trennen|Geräteausgänge auswählen/);
    assert.equal(c.snapshot(),before);assert.deepEqual(clone(c.history),history);assert.equal(c.saves,saves);assert.equal(c.stage.routing.devices.length,1);
  }
});

test('Nord Stage 4 routes Piano and Synth through two distinct physical stereo DIs',()=>{
  const source=fixture('nord','keys-stage4','Klinke',4);source.io.aliases.outputs=['Piano','Piano','Synth','Synth'];source.io.stereoPairs=[1,3];
  const c=harness([source,{...fixture('box','stagebox-8'),comboJacks:true}]);c.allRoutingStageboxes=()=>[];c.draftState='saved';
  const beforeRead=c.snapshot();assert.deepEqual(clone(c.routingWorkspaceState().diStereoPairs.nord),[{start:1,ports:[1,2],sourceKeys:['nord:out-1','nord:out-2']},{start:3,ports:[3,4],sourceKeys:['nord:out-3','nord:out-4']}]);assert.equal(c.snapshot(),beforeRead);
  c.dispatchRoutingWorkspace({type:'setSourceOutputStereo',sourceId:'nord',start:3,linked:true});
  const [pianoL,pianoR,synthL,synthR]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'patch',rowIds:[pianoL.id],boxId:'box',port:1});c.dispatchRoutingWorkspace({type:'patch',rowIds:[synthR.id],boxId:'box',port:3});
  c.dispatchRoutingWorkspace({type:'editChannel',rowId:pianoL.id,fields:{number:11,notes:'Piano behalten'}});c.dispatchRoutingWorkspace({type:'editChannel',rowId:synthR.id,fields:{number:14,notes:'Synth behalten'}});
  c.dispatchRoutingWorkspace({type:'createDi',rowId:pianoL.id,modelId:'radial-prod2'});const pianoDi=getRow(c,pianoL.id).diDeviceId;
  assert.equal(getRow(c,pianoR.id).diDeviceId,pianoDi,'Choosing a stereo DI on either native stereo member connects both outputs.');
  const savedPiano=clone(c.stage.routing.inputs.slice(0,2)),beforeSynth=c.snapshot(),history=c.history.length;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:synthR.id,modelId:'radial-prod2'});const synthDi=getRow(c,synthR.id).diDeviceId;
  assert.notEqual(pianoDi,synthDi,'The same catalog model can represent two different physical DI boxes.');assert.equal(c.stage.routing.devices.length,2);assert.equal(c.stage.routing.inputs.length,4);
  assert.deepEqual(clone(c.stage.routing.inputs.map(row=>[row.portIndex,row.diDeviceId,row.diChannel,row.mode,row.stageboxPort])),[[1,pianoDi,1,'Stereo L',1],[2,pianoDi,2,'Stereo R',2],[3,synthDi,1,'Stereo L',3],[4,synthDi,2,'Stereo R',4]]);
  assert.deepEqual(clone(c.stage.routing.inputs.slice(0,2)),savedPiano);assert.deepEqual(clone(c.objects[0].io.aliases.outputs),['Piano','Piano','Synth','Synth']);assert.equal(getRow(c,synthR.id).number,14);assert.equal(getRow(c,synthR.id).notes,'Synth behalten');assert.equal(c.history.length,history+1);assert.equal(c.history.at(-1),beforeSynth);
  const connected=c.snapshot();c.syncRoutingFromStage(false,false);assert.equal(c.snapshot(),connected,'Reconciliation preserves both physical boxes and all channel details.');
  const undo=JSON.parse(c.history.at(-1));c.stage=undo.stage;c.objects=undo.objects;c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.devices.length,1);assert.equal(getRow(c,pianoR.id).diDeviceId,pianoDi);assert.equal(getRow(c,synthL.id).diDeviceId||'','');assert.equal(getRow(c,synthR.id).diDeviceId||'','');
});

test('Connect L and R on outputs 3 and 4 expands only that native pair and preserves Piano',()=>{
  const source=fixture('nord','keys-stage4','Klinke',3);source.io.outputKeyStyle='configured';source.io.aliases.outputs=['Piano','Piano','Synth'];
  const c=harness([source]);c.dispatchRoutingWorkspace({type:'createDi',rowId:c.stage.routing.inputs[0].id,modelId:'radial-prod2'});const piano=clone(c.stage.routing.inputs),pianoDi=piano[0].diDeviceId;
  c.dispatchRoutingWorkspace({type:'setSourceOutputUsed',sourceId:'nord',port:3,used:true});const synth=c.stage.routing.inputs.find(row=>row.portIndex===3);
  c.dispatchRoutingWorkspace({type:'createDi',rowId:synth.id,modelId:'radial-prod2'});const synthDi=getRow(c,synth.id).diDeviceId;
  const beforeConflict=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:synth.id,deviceId:pianoDi}),/belegt/);assert.equal(c.snapshot(),beforeConflict);
  const history=c.history.length;c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:synth.id,deviceId:synthDi});
  assert.deepEqual(clone(c.stage.routing.inputs.slice(0,2)),piano);assert.equal(c.stage.routing.devices.length,2);assert.equal(c.objects[0].io.outputs.count,4);assert.deepEqual(clone(c.objects[0].io.stereoPairs),[1,3]);assert.deepEqual(clone(c.objects[0].io.aliases.outputs),['Piano','Piano','Synth','']);
  const synthRows=c.stage.routing.inputs.slice(2);assert.deepEqual(clone(synthRows.map(row=>[row.sourceKey,row.portIndex,row.diChannel,row.mode])),[['nord:configured-out-3',3,1,'Stereo L'],['nord:configured-out-4',4,2,'Stereo R']]);assert(synthRows[0].stereoGroup&&synthRows[0].stereoGroup===synthRows[1].stereoGroup);assert.notEqual(synthRows[0].stereoGroup,piano[0].stereoGroup);assert.equal(c.history.length,history+1);
  const connected=c.snapshot();c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:synthRows[1].id,deviceId:synthDi});assert.equal(c.snapshot(),connected);assert.equal(c.history.length,history+1);
});

test('One shared DI card changes model, pickup and removal atomically for its two channels',()=>{
  const source=fixture('nord','keys-stage4','Klinke',4);source.io.stereoPairs=[1,3];
  const c=harness([source]);c.dispatchRoutingWorkspace({type:'setSourceOutputStereo',sourceId:'nord',start:3,linked:true});
  const [pianoL,pianoR,synthL,synthR]=c.stage.routing.inputs,ids=[synthL.id,synthR.id];
  c.dispatchRoutingWorkspace({type:'createDi',rowId:pianoL.id,modelId:'radial-prod2'});c.dispatchRoutingWorkspace({type:'createDi',rowId:synthL.id,modelId:'radial-prod2'});const piano=clone(c.stage.routing.inputs.slice(0,2)),oldDi=getRow(c,synthL.id).diDeviceId;
  for(const rowIds of [undefined,ids]){const before=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'createDi',rowId:synthL.id,rowIds,modelId:'radial-j48'}),/zwei Eingängen/);assert.equal(c.snapshot(),before,'A mono choice cannot silently detach the other output.');}
  const beforeReplacement=c.snapshot(),history=c.history.length;c.dispatchRoutingWorkspace({type:'createDi',rowId:synthL.id,rowIds:ids,modelId:'radial-j48-stereo'});const newDi=getRow(c,synthL.id).diDeviceId;
  assert.equal(newDi,oldDi,'Changing the model keeps the same physical box.');assert.equal(getRow(c,synthR.id).diDeviceId,newDi);assert(ids.every(id=>getRow(c,id).phantom));assert.equal(c.history.length,history+1);assert.equal(c.history.at(-1),beforeReplacement);
  c.dispatchRoutingWorkspace({type:'createDi',rowId:synthL.id,rowIds:ids,modelId:'radial-prod2'});assert.deepEqual(ids.map(id=>[getRow(c,id).diDeviceId,getRow(c,id).diChannel,getRow(c,id).phantom]),[[oldDi,1,false],[oldDi,2,false]]);
  const beforeBusy=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'assignDi',rowId:synthL.id,rowIds:ids,deviceId:getRow(c,pianoL.id).diDeviceId,channel:1}),/belegt/);assert.equal(c.snapshot(),beforeBusy);
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:synthL.id,rowIds:ids,kind:'Direct'});assert(ids.every(id=>getRow(c,id).pickup==='Direct'&&getRow(c,id).diDeviceId===''));
  c.dispatchRoutingWorkspace({type:'removePickup',rowId:synthL.id,rowIds:ids});assert.deepEqual(clone(c.stage.routing.inputs),piano);assert.deepEqual(clone(c.objects[0].io.stereoPairs),[1]);assert.deepEqual(clone(c.stage.routing.disabledSources),['nord:out-3','nord:out-4']);
});

test('Changing a shared dual-mono DI preserves the occupied input order',()=>{
  const c=harness([fixture('guitar','guitar','Klinke')]),native=c.stage.routing.inputs[0];c.dispatchRoutingWorkspace({type:'createDi',rowId:native.id,modelId:'radial-prod2'});const firstDi=getRow(c,native.id).diDeviceId;
  c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'guitar',kind:'DI'});const pickup=c.stage.routing.inputs.find(row=>row.origin==='pickup');c.dispatchRoutingWorkspace({type:'assignDi',rowId:pickup.id,deviceId:firstDi,channel:2});
  c.dispatchRoutingWorkspace({type:'createDi',rowId:pickup.id,rowIds:[pickup.id,native.id],modelId:'generic-active-stereo'});
  assert.equal(getRow(c,native.id).diChannel,1);assert.equal(getRow(c,pickup.id).diChannel,2);assert.equal(getRow(c,native.id).diDeviceId,getRow(c,pickup.id).diDeviceId);assert(c.stage.routing.inputs.every(row=>!row.stereoGroup));
});

test('Replacing a shared native stereo DI preserves deliberately reversed physical inputs',()=>{
  for(const explicit of [false,true]){
    const c=harness([fixture('nord','keys-stage4','Klinke',2)]),[left,right]=c.stage.routing.inputs;
    c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});const priorDi=getRow(c,left.id).diDeviceId;
    c.StageplotRoutingModel.assignDevice(c.stage.routing,[left.id,right.id],priorDi,[2,1]);
    c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,...(explicit?{rowIds:[left.id,right.id]}:{}),modelId:'radial-j48-stereo'});
    assert.equal(getRow(c,left.id).diChannel,2);assert.equal(getRow(c,right.id).diChannel,1);assert.equal(getRow(c,left.id).diDeviceId,getRow(c,right.id).diDeviceId);assert.equal(getRow(c,left.id).diDeviceId,priorDi);
    assert.equal(getRow(c,left.id).mode,'Stereo L');assert.equal(getRow(c,right.id).mode,'Stereo R');assert.equal(getRow(c,left.id).stereoGroup,getRow(c,right.id).stereoGroup);
  }
});

test('A physical DI patches only its own outputs even when stereo partners use another box',()=>{
  const source=fixture('nord','keys-stage4','Klinke',4);source.io.stereoPairs=[1,3];
  const c=harness([source,fixture('box','stagebox-8')]);c.dispatchRoutingWorkspace({type:'setSourceOutputStereo',sourceId:'nord',start:3,linked:true});
  const [one,two,three,four]=c.stage.routing.inputs;c.dispatchRoutingWorkspace({type:'createDi',rowId:one.id,modelId:'radial-prod2'});const diA=getRow(c,one.id).diDeviceId;c.dispatchRoutingWorkspace({type:'createDi',rowId:three.id,modelId:'radial-prod2'});const diB=getRow(c,three.id).diDeviceId;
  c.StageplotRoutingModel.clearDevice(c.stage.routing,[one.id,two.id,three.id,four.id]);c.StageplotRoutingModel.assignDevice(c.stage.routing,[one.id,three.id],diA,[1,2]);c.StageplotRoutingModel.assignDevice(c.stage.routing,[two.id,four.id],diB,[1,2]);
  c.dispatchRoutingWorkspace({type:'patch',rowIds:[two.id,four.id],boxId:'box',port:5,exactRows:true});const otherBox=[two.id,four.id].map(id=>clone(getRow(c,id)));
  const history=c.history.length;c.dispatchRoutingWorkspace({type:'patch',rowIds:[one.id,three.id],boxId:'box',port:1,exactRows:true});assert.deepEqual([one.id,three.id].map(id=>getRow(c,id).stageboxPort),[1,2]);assert.deepEqual([two.id,four.id].map(id=>clone(getRow(c,id))),otherBox);assert.equal(c.history.length,history+1);
  c.dispatchRoutingWorkspace({type:'unpatch',rowIds:[one.id,three.id],exactRows:true});assert([one.id,three.id].every(id=>getRow(c,id).stagebox===''));assert.deepEqual([two.id,four.id].map(id=>clone(getRow(c,id))),otherBox);
  const before=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'patch',rowIds:[one.id,three.id],boxId:'box',port:5,exactRows:true}),/belegt/);assert.equal(c.snapshot(),before);
});

test('Grouped DI changes preserve mono routing and reject invalid selections and failed saves',()=>{
  const source=fixture('nord','keys-stage4','Klinke',4);source.io.stereoPairs=[];
  const c=harness([source,fixture('guitar','guitar','Klinke')]);const [left,right,guitar]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});assert.equal(getRow(c,right.id).diDeviceId||'','','An unlinked mono source does not acquire a second DI input automatically.');
  const before=c.snapshot(),history=clone(c.history);c.future=['redo-entry'];
  for(const rowIds of [[left.id,left.id],[left.id,guitar.id],[right.id]])assert.throws(()=>c.dispatchRoutingWorkspace({type:'setPickup',rowId:left.id,rowIds,kind:'Mic'}),/erneut auswählen|derselben Quelle/);
  assert.equal(c.snapshot(),before);assert.deepEqual(clone(c.history),history);assert.deepEqual(clone(c.future),['redo-entry']);
  c.saveError=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,rowIds:[left.id,right.id],modelId:'radial-j48-stereo'}),/Speichern/);assert.equal(c.snapshot(),before);assert.deepEqual(clone(c.history),history);assert.deepEqual(clone(c.future),['redo-entry']);
});

test('Source output summaries are normalized read-only views including inactive configured ports',()=>{
  const source=fixture('wave','keys-wave2','Klinke',4);source.io.outputKeyStyle='configured';source.io.aliases.outputs=['Piano'];
  const c=harness([source]);c.allRoutingStageboxes=()=>[];c.draftState='saved';const before=c.snapshot(),info=c.routingWorkspaceState().sourceOutputs.wave;
  assert.deepEqual(clone(info.connectors),['XLR','Klinke','USB','Digital','MADI','Dante']);assert.equal(info.count,4);assert.equal(info.connector,'Klinke');assert.deepEqual(clone(info.aliases),['Piano','','','']);assert.equal(info.editable,true);assert.equal(info.locked,false);
  assert.deepEqual(clone(info.ports.map(port=>[port.number,port.sourceKey,port.active])),[[1,'wave:configured-out-1',true],[2,'wave:configured-out-2',true],[3,'wave:configured-out-3',false],[4,'wave:configured-out-4',false]]);
  assert.equal(c.snapshot(),before,'Reading source controls must not migrate old drafts or activate ports.');
});

test('Adding physical outputs activates each added port while preserving DI routes and prior disabled ports',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke',2),fixture('box','stagebox-8')]),[left,right]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});const deviceId=getRow(c,left.id).diDeviceId;
  c.dispatchRoutingWorkspace({type:'assignDi',rowId:right.id,deviceId,channel:2});c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:2});
  c.dispatchRoutingWorkspace({type:'editChannel',rowId:left.id,fields:{number:9,instrument:'Eigener Kanalname',notes:'Notiz'}});
  const savedLeft=clone(getRow(c,left.id));c.dispatchRoutingWorkspace({type:'setSourceOutputUsed',sourceId:'wave',port:2,used:false});
  const before=c.snapshot(),history=c.history.length,saves=c.saves;
  c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:4}});
  assert.deepEqual(clone(c.stage.routing.inputs.map(row=>row.portIndex)),[1,3,4]);assert(c.stage.routing.disabledSources.includes('wave:out-2'));assert.equal(c.stage.routing.devices.length,1);
  const current=getRow(c,left.id);assert.deepEqual([current.diDeviceId,current.diChannel,current.number,current.instrument,current.notes,current.stagebox,current.stageboxPort],[deviceId,1,savedLeft.number,savedLeft.instrument,savedLeft.notes,savedLeft.stagebox,savedLeft.stageboxPort]);
  assert.equal(c.history.length,history+1);assert.equal(c.history.at(-1),before);assert.equal(c.saves,saves+1);assert.equal(c.objects[0].outs,'4 Outs · Klinke');
  c.syncRoutingFromStage(false,false);assert.deepEqual(clone(c.stage.routing.inputs.map(row=>row.portIndex)),[1,3,4]);
});

test('Reducing physical outputs removes only native ports and retains microphone pickups and undo data',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke',2),fixture('box','stagebox-8')]),[left,right]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});const deviceId=getRow(c,left.id).diDeviceId;
  c.dispatchRoutingWorkspace({type:'assignDi',rowId:right.id,deviceId,channel:2});c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:5});
  c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'wave',kind:'Mic'});const extra=c.stage.routing.inputs.find(row=>row.origin==='pickup');
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:extra.id,kind:'Mic',microphone:'Shure Beta 91A'});c.dispatchRoutingWorkspace({type:'editChannel',rowId:extra.id,fields:{number:21,notes:'Extra Mic'}});
  const micBefore=clone(getRow(c,extra.id)),before=c.snapshot(),count=c.history.length;
  c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:1}});
  assert.equal(getRow(c,right.id),undefined);assert.equal(getRow(c,left.id).stereoGroup,'');assert.equal(getRow(c,left.id).stageboxPort,5);assert.deepEqual(clone(getRow(c,extra.id)),micBefore);assert.equal(c.StageplotRoutingModel.occupancy(c.stage.routing,deviceId)[1].free,true);
  assert.equal(c.history.length,count+1);assert.equal(c.history.at(-1),before);
  c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:0}});assert.deepEqual(clone(c.stage.routing.inputs.map(row=>row.id)),[extra.id]);assert.equal(c.routingSourceOutputs(c.objects[0]).count,0);assert.equal(c.routingSourceOutputs(c.objects[0]).editable,true);
  c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:2}});assert.equal(c.stage.routing.inputs.filter(row=>row.sourceKey==='wave:out-1'||row.sourceKey==='wave:out-2').length,2);assert.deepEqual(clone(getRow(c,extra.id)),micBefore);
});

test('Changing native outputs to digital releases their analog DI and patch but preserves separate microphone pickup',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke',2),fixture('box','stagebox-8')]),[left,right]=c.stage.routing.inputs;
  c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});const deviceId=getRow(c,left.id).diDeviceId;c.dispatchRoutingWorkspace({type:'connectStereoDi',rowId:left.id,deviceId});c.dispatchRoutingWorkspace({type:'patch',rowIds:[left.id,right.id],boxId:'box',port:3});
  c.dispatchRoutingWorkspace({type:'editChannel',rowId:left.id,fields:{number:18,instrument:'Custom left',notes:'Keep'}});c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'wave',kind:'Mic'});const mic=c.stage.routing.inputs.find(row=>row.origin==='pickup'),micBefore=clone(mic);
  for(const connector of ['Dante','USB','MADI','Digital']){
    c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{connector}});
    const rows=c.stage.routing.inputs.filter(row=>row.id!==mic.id);assert(rows.every(row=>row.pickup==='Digital'&&row.connector===connector&&row.signalType==='Digital'&&row.diDeviceId===''&&row.diChannel===null&&!row.phantom&&row.stagebox===''&&row.stageboxPort===null));
    assert.equal(getRow(c,left.id).number,18);assert.equal(getRow(c,left.id).instrument,'Custom left');assert.equal(getRow(c,left.id).notes,'Keep');assert.deepEqual(clone(getRow(c,mic.id)),micBefore);assert.equal(c.stage.routing.devices.length,1);
  }
  c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{connector:'XLR'}});assert.equal(getRow(c,left.id).pickup,'Direct');assert.equal(getRow(c,left.id).connector,'XLR');assert.equal(getRow(c,left.id).diDeviceId,'');
});

test('Source stereo, aliases and usage remain coherent with native route format buttons',()=>{
  const source=fixture('wave','keys-wave2','XLR',2);source.io.stereoPairs=[];
  const c=harness([source]),[left,right]=c.stage.routing.inputs;c.dispatchRoutingWorkspace({type:'editChannel',rowId:left.id,fields:{number:8,instrument:'Custom signal',notes:'Left'}});
  c.dispatchRoutingWorkspace({type:'setSourceOutputAlias',sourceId:'wave',port:1,value:'  Piano   Solo  '});assert.equal(c.objects[0].io.aliases.outputs[0],'Piano Solo');assert.equal(getRow(c,left.id).instrument,'Custom signal');
  c.dispatchRoutingWorkspace({type:'linkStereo',rowIds:[right.id,left.id]});assert.deepEqual(clone(c.objects[0].io.stereoPairs),[1]);assert.equal(getRow(c,left.id).mode,'Stereo L');assert.equal(getRow(c,right.id).mode,'Stereo R');assert.deepEqual(clone(c.objects[0].io.aliases.outputs),['Piano Solo','Piano Solo']);
  c.dispatchRoutingWorkspace({type:'setSourceOutputAlias',sourceId:'wave',port:2,value:'Keys'});assert.deepEqual(clone(c.objects[0].io.aliases.outputs),['Keys','Keys']);assert.match(getRow(c,right.id).instrument,/Keys/);assert.equal(getRow(c,left.id).instrument,'Custom signal');assert.equal(getRow(c,left.id).number,8);assert.equal(getRow(c,left.id).notes,'Left');
  c.dispatchRoutingWorkspace({type:'unlinkStereo',rowIds:[left.id,right.id]});assert.deepEqual(clone(c.objects[0].io.stereoPairs),[]);assert(c.stage.routing.inputs.every(row=>row.mode==='Mono'&&!row.stereoGroup));
  c.dispatchRoutingWorkspace({type:'setSourceOutputUsed',sourceId:'wave',port:2,used:false});assert.equal(c.stage.routing.inputs.length,1);
  c.dispatchRoutingWorkspace({type:'setSourceOutputStereo',sourceId:'wave',start:1,linked:true});assert.equal(c.stage.routing.inputs.length,2,'Explicitly linking a native pair also activates its missing member.');assert.equal(c.routingSourceOutputs(c.objects[0]).ports[1].active,true);assert.equal(getRow(c,left.id).number,8);
});

test('Reactivating an old disabled stereo output repairs both native sides, and removal clears the IO pair',()=>{
  const c=harness([fixture('wave','keys-wave2','XLR',2)]),[left,right]=c.stage.routing.inputs;
  c.StageplotRoutingModel.removeInput(c.stage.routing,right.id);Object.assign(getRow(c,left.id),{mode:'Mono',stereoGroup:'',edited:true,number:10,notes:'Old draft'});c.syncRoutingFromStage(false,false);
  assert.deepEqual(clone(c.objects[0].io.stereoPairs),[1]);assert.equal(c.stage.routing.inputs.length,1);
  c.dispatchRoutingWorkspace({type:'setSourceOutputUsed',sourceId:'wave',port:2,used:true});
  const rows=c.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('wave:'));assert.deepEqual(clone(rows.map(row=>row.mode)),['Stereo L','Stereo R']);assert.equal(rows[0].stereoGroup,rows[1].stereoGroup);assert(rows[0].stereoGroup);assert.equal(getRow(c,left.id).number,10);assert.equal(getRow(c,left.id).notes,'Old draft');
  c.dispatchRoutingWorkspace({type:'removePickup',rowId:rows[1].id});assert.deepEqual(clone(c.objects[0].io.stereoPairs),[]);assert.equal(c.objects[0].io.outputs.count,2);assert.equal(getRow(c,left.id).mode,'Mono');assert.equal(getRow(c,left.id).stereoGroup,'');assert.equal(c.routingSourceOutputs(c.objects[0]).ports[1].active,false);
});

test('Output edits preserve mixed native and synthetic stereo groups and reject replacing their link',()=>{
  const c=harness([fixture('wave','keys-wave2','XLR')]),left=c.stage.routing.inputs[0];c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'wave',kind:'Mic'});const mic=c.stage.routing.inputs.find(row=>row.origin==='pickup');c.dispatchRoutingWorkspace({type:'linkStereo',rowIds:[left.id,mic.id]});
  const group=getRow(c,left.id).stereoGroup,micBefore=clone(getRow(c,mic.id));c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:2}});
  assert.equal(getRow(c,left.id).stereoGroup,group);assert.deepEqual(clone(getRow(c,mic.id)),micBefore);
  const before=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'setSourceOutputStereo',sourceId:'wave',start:1,linked:true}),/anderen Abnahme/);assert.equal(c.snapshot(),before);
  c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:0}});assert.equal(getRow(c,mic.id).stereoGroup,'');assert.equal(getRow(c,mic.id).mode,'Mono');assert.equal(c.stage.routing.inputs.length,1);
});

test('Invalid, locked or merged output changes roll back without altering history or source IO',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke',2),fixture('voice','mic')]),left=c.stage.routing.inputs[0];
  const invalid=[{type:'setSourceOutputs',fields:{count:65}},{type:'setSourceOutputs',fields:{count:-1}},{type:'setSourceOutputs',fields:{connector:'RCA'}},{type:'setSourceOutputStereo',start:2,linked:true},{type:'setSourceOutputAlias',port:3,value:'Invalid'},{type:'setSourceOutputUsed',port:0,used:true}];
  const before=c.snapshot();c.future=['redo'];for(const action of invalid){assert.throws(()=>c.dispatchRoutingWorkspace({sourceId:'wave',...action}));assert.equal(c.snapshot(),before);assert.equal(c.saves,0);assert.equal(c.history.length,0);assert.deepEqual(clone(c.future),['redo']);}
  c.objects[0].locked=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:3}}),/gesperrt/);c.objects[0].locked=false;c.sharedReadOnly=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'setSourceOutputUsed',sourceId:'wave',port:1,used:false}),/schreibgeschützt/);c.sharedReadOnly=false;
  getRow(c,left.id).linkedSources=[{id:'merged',sourceKey:'other:main',instrument:'Other'}];const merged=c.snapshot();assert.equal(c.routingSourceOutputs(c.objects[0]).ports[0].locked,true);assert.throws(()=>c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:3}}),/Signalweg trennen/);assert.equal(c.snapshot(),merged);
  getRow(c,left.id).linkedSources=[];c.saveError=true;const failed=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:'wave',fields:{count:4}}),/Speichern/);assert.equal(c.snapshot(),failed);assert.equal(c.history.length,0);assert.deepEqual(clone(c.future),['redo']);
});

test('Special source setups open their existing modals without changing the active workspace',()=>{
  const c=harness();c.byId.laptop={instrument:true,name:'Playback'};c.byId.drums={instrument:true,name:'Drums'};c.byId.percussion={instrument:true,name:'Percussion'};c.byId.orchestra={instrument:true,name:'Orchestra'};
  c.drumModel={isDrums:type=>type==='drums',drumChannels:()=>[]};c.percussionModel={channels:()=>[]};c.orchestraModel={channels:()=>[]};c.objects=[fixture('laptop','laptop','Klinke',2),fixture('kit','drums'),fixture('perc','percussion'),fixture('orch','orchestra')];
  const opened=[];c.openPlaybackDialog=id=>opened.push(['playback',id]);c.openSelectedDrumDesigner=()=>opened.push(['setup',c.selected]);c.show=()=>{throw Error('Must stay in routing');};
  for(const [id,editor] of [['laptop','playback'],['kit','drums'],['perc','percussion'],['orch','orchestra']]){
    const info=c.routingSourceOutputs(c.objects.find(o=>o.id===id));assert.equal(info.editor,editor);assert.equal(info.editable,false);assert.throws(()=>c.dispatchRoutingWorkspace({type:'setSourceOutputs',sourceId:id,fields:{count:2}}),/Geräte-Setup/);c.dispatchRoutingWorkspace({type:'openSourceEditor',sourceId:id});
  }
  assert.deepEqual(opened,[['playback','laptop'],['setup','kit'],['setup','perc'],['setup','orch']]);assert.equal(c.saves,0);assert.equal(c.history.length,0);
  c.sharedReadOnly=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'openSourceEditor',sourceId:'kit'}),/schreibgeschützt/);
  c.sharedReadOnly=false;c.objects[1].locked=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'openSourceEditor',sourceId:'kit'}),/gesperrt/);
});

test('The inspector shortcut opens source output controls even with zero active routes',()=>{
  const c=harness([fixture('wave','keys-wave2','Klinke',0)]),opened=[];c.show=view=>opened.push(view);c.outputOpened=id=>opened.push(id);vm.runInContext('routingWorkspaceV2={openSourceOutputs:id=>outputOpened(id)};',c);
  assert.equal(c.stage.routing.inputs.length,0);c.routingTab='outputs';c.openRoutingObjectOutputs('wave');assert.equal(c.routingTab,'inputs');assert.deepEqual(opened,['routing','wave']);assert.equal(c.saves,0);
});

test('Custom DI starts with one editable port when no extra fields are provided',()=>{
  const c=harness([fixture('guitar','guitar','Klinke')]),row=c.stage.routing.inputs[0];c.dispatchRoutingWorkspace({type:'createDi',rowId:row.id,modelId:'custom',name:'Meine DI'});
  assert.equal(c.stage.routing.devices.length,1);assert.equal(c.stage.routing.devices[0].channels,1);assert.equal(getRow(c,row.id).diChannel,1);
});

test('Combo jacks accept direct Klinke and cannot be disabled under an occupied input',()=>{
  const c=harness([fixture('keys','keys','Klinke'),fixture('box','stagebox-8')]),row=c.stage.routing.inputs[0];
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:row.id,kind:'Direct'});const before=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'patch',rowIds:[row.id],boxId:'box',port:2}),/DI-Box/);assert.equal(c.snapshot(),before);
  c.dispatchRoutingWorkspace({type:'editStagebox',boxId:'box',fields:{comboJacks:true}});c.dispatchRoutingWorkspace({type:'patch',rowIds:[row.id],boxId:'box',port:2});assert.equal(getRow(c,row.id).stageboxPort,2);
  const plugged=c.snapshot();assert.throws(()=>c.dispatchRoutingWorkspace({type:'editStagebox',boxId:'box',fields:{comboJacks:false}}),/abstecken/);assert.equal(c.snapshot(),plugged);
  c.dispatchRoutingWorkspace({type:'unpatch',rowIds:[row.id]});c.dispatchRoutingWorkspace({type:'editStagebox',boxId:'box',fields:{comboJacks:false}});assert.equal(c.objects.find(o=>o.id==='box').comboJacks,false);
});

test('Additional pickups and DI identities survive normalization and copied object IDs',()=>{
  const c=harness([fixture('guitar','guitar','Klinke'),fixture('box','stagebox-8')]);c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'guitar',kind:'DI'});
  const pickup=c.stage.routing.inputs.find(row=>row.origin==='pickup');c.dispatchRoutingWorkspace({type:'createDi',rowId:pickup.id,modelId:'radial-j48-stereo'});c.dispatchRoutingWorkspace({type:'patch',rowIds:[pickup.id],boxId:'box',port:2});
  const live=getRow(c,pickup.id),device=c.stage.routing.devices.find(d=>d.id===live.diDeviceId);device.objectId='physical-di';live.linkedSources=[{...live,id:'route-original',sourceKey:'original:main'}];
  const saved=clone(c.stage.routing),ids=new Map([['guitar','station-1'],['box','station-2'],['physical-di','station-3'],['original','station-4']]),copied=c.normalizeRouting(saved,ids),result=copied.inputs.find(row=>row.id===pickup.id);
  assert.equal(result.sourceKey,live.sourceKey.replace('guitar:','station-1:'));assert.equal(result.acquisitionId,result.sourceKey);assert.equal(result.sourcePortKey,'station-1:main');assert.equal(result.stagebox,'station-2');assert.equal(result.diDeviceId,device.id);assert.equal(result.diChannel,1);assert.equal(result.linkedSources[0].sourceKey,'station-4:main');assert.equal(copied.devices.find(d=>d.id===device.id).objectId,'station-3');
  assert.deepEqual(clone(c.normalizeRouting(copied)),clone(copied));c.syncRoutingFromStage(false,false);assert(c.stage.routing.inputs.some(row=>row.id===pickup.id));
});

test('Removing one stereo pickup leaves one independent mono path',()=>{
  const c=harness([fixture('guitar','guitar')]);c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'guitar',kind:'Mic'});
  const [left,right]=c.stage.routing.inputs;c.dispatchRoutingWorkspace({type:'linkStereo',rowIds:[left.id,right.id]});c.dispatchRoutingWorkspace({type:'removePickup',rowId:right.id});
  c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.length,1);assert.equal(c.stage.routing.inputs[0].id,left.id);assert.equal(c.stage.routing.inputs[0].stereoGroup,'');assert.equal(c.stage.routing.inputs[0].mode,'Mono');
});

test('Imported manual sources can gain a second pickup without silently discarding it',()=>{
  const c=harness();c.stage.routing.inputs=[c.normalizeRouteChannel({id:'route-imported',instrument:'Gastgitarre',manual:true,pickup:'Direct',connector:'Klinke'},0,'inputs')];
  c.dispatchRoutingWorkspace({type:'addPickup',sourceId:'route-imported',kind:'Mic'});
  assert.equal(c.stage.routing.inputs.length,2,'A source without a stage object still needs its additional pickup.');assert.equal(c.stage.routing.inputs[0].id,'route-imported');c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.length,2);
});

test('IEM mono/stereo changes retain mix, equipment and existing patches',()=>{
  const rack={...fixture('rack','rack'),iemMixes:[{id:'lead',name:'Lead',mode:'mono',transport:'wireless',frequencyBand:'470–526 MHz',ports:['lead-l','lead-r']}]},c=harness([rack,fixture('box','stagebox-8')]),left=c.stage.routing.outputs[0];
  c.dispatchRoutingWorkspace({type:'editMonitor',rowIds:[left.id],fields:{iemName:'Vocals',monitorDeviceName:'PSM 900',monitorReceiverName:'Lead',monitorDeviceKind:'iem',monitorActive:true}});
  c.dispatchRoutingWorkspace({type:'patch',direction:'outputs',rowIds:[left.id],boxId:'box',port:1});c.dispatchRoutingWorkspace({type:'editChannel',direction:'outputs',rowId:left.id,fields:{number:7}});
  c.dispatchRoutingWorkspace({type:'setMonitorFormat',rowIds:[left.id],format:'stereo'});assert.equal(c.stage.routing.outputs.length,2);assert.equal(getRow(c,left.id,'outputs').stageboxPort,1);assert.equal(getRow(c,left.id,'outputs').number,7);
  assert(c.stage.routing.outputs.every(row=>row.monitorDeviceName==='PSM 900'&&row.monitorReceiverName==='Lead'),'Both paths belong to the same configured transmitter and recipient.');
  const pair=c.stage.routing.outputs.map(row=>row.id);c.dispatchRoutingWorkspace({type:'editMonitor',rowIds:pair,fields:{iemTransport:'cable'}});assert(c.stage.routing.outputs.every(row=>row.frequencyBand===''));assert.equal(c.objects[0].iemMixes[0].transport,'cable');
  c.dispatchRoutingWorkspace({type:'setMonitorFormat',rowIds:pair,format:'mono'});assert.equal(c.stage.routing.outputs.length,1);assert.equal(c.stage.routing.outputs[0].id,left.id);assert.equal(c.stage.routing.outputs[0].number,7);
});

test('Wedge stereo conversion remains stable through reconciliation and returns to mono',()=>{
  const c=harness([fixture('wedge','wedge')]),left=c.stage.routing.outputs[0];c.dispatchRoutingWorkspace({type:'setMonitorFormat',rowIds:[left.id],format:'stereo'});assert.equal(c.stage.routing.outputs.length,2);const pair=c.stage.routing.outputs.map(row=>row.id);c.syncRoutingFromStage(false,false);assert.deepEqual(c.stage.routing.outputs.map(row=>row.id),pair);
  c.dispatchRoutingWorkspace({type:'setMonitorFormat',rowIds:pair,format:'mono'});c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.outputs.length,1);assert.equal(c.stage.routing.outputs[0].mode,'Mono');assert.equal(c.stage.routing.outputs[0].id,left.id);
});

test('Microphone edits write back to drum and independent Cajon pickup positions',()=>{
  const c=harness();c.drumModel=vm.runInNewContext(fs.readFileSync('stageplot-drums-v12.js','utf8')+';createStageplotDrumModel()');c.byId.drums={instrument:true,category:'drums'};
  c.objects=[{id:'kit',type:'drums',drums:c.drumModel.normalizeDrums({})}];c.syncRoutingFromStage(false,false);const kick=c.stage.routing.inputs.find(row=>row.sourceKey==='kit:drum-kick1-in');assert(kick);
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:kick.id,kind:'Mic',microphone:'Shure Beta 91A'});assert.equal(c.objects[0].drums.mics['kick1-in'].model,'Shure Beta 91A');assert.equal(c.objects[0].drums.mics['kick1-in'].phantom,true);
  const prior=clone(c.objects[0].drums),after=clone(prior);after.mics['kick1-in'].model='Shure SM57';after.mics['kick1-in'].phantom=false;c.StageplotMics.applyDrumChanges(c.stage.routing,'kit',prior,after);c.objects[0].drums=after;c.syncRoutingFromStage(false,false);assert.equal(getRow(c,kick.id).microphone,'Shure SM57');assert.equal(getRow(c,kick.id).phantom,false);
  const p=harness();p.percussionModel=require('./stageplot-percussion-v1.js')();p.byId.percussion={instrument:true,category:'percussion'};p.objects=[{id:'perc',type:'percussion',percussion:p.percussionModel.normalize({parts:[{...p.percussionModel.part('cajon','custom-part'),pickup:'both'}]})}];p.syncRoutingFromStage(false,false);const [front,back]=p.stage.routing.inputs;
  p.dispatchRoutingWorkspace({type:'setPickup',rowId:front.id,kind:'Mic',microphone:'Shure SM57'});p.dispatchRoutingWorkspace({type:'setPickup',rowId:back.id,kind:'Mic',microphone:'Shure Beta 91A'});
  assert.deepEqual(clone(p.objects[0].percussion.parts[0].mics),[{model:'Shure SM57',phantom:false},{model:'Shure Beta 91A',phantom:true}]);assert.deepEqual(clone(p.stage.routing.inputs.map(row=>row.id)),[front.id,back.id]);
});

test('Inline fields accept the actual workspace microphone, mix name and notes actions',()=>{
  const c=harness([fixture('guitar','guitar'),{...fixture('rack','rack'),iemMixes:[{id:'lead',name:'Lead',mode:'stereo',transport:'wireless',ports:['lead-l','lead-r']}]}]),input=c.stage.routing.inputs[0];
  c.dispatchRoutingWorkspace({type:'setPickup',rowId:input.id,kind:'Mic'});c.dispatchRoutingWorkspace({type:'editChannel',direction:'inputs',rowId:input.id,fields:{microphone:'Eigenes Mikrofon'}});assert.equal(getRow(c,input.id).microphone,'Eigenes Mikrofon');
  const rowIds=c.stage.routing.outputs.map(row=>row.id);c.dispatchRoutingWorkspace({type:'editMonitor',rowIds,fields:{name:'Gesang',notes:'Mehr Stimme, weniger Bass'}});
  assert(c.stage.routing.outputs.every(row=>row.iemName==='Gesang'&&row.notes==='Mehr Stimme, weniger Bass'));assert.equal(c.objects.find(o=>o.id==='rack').iemMixes[0].name,'Gesang');
});

test('Every assigned DI has one movable object; model changes and save rollback retain identity',()=>{
  const c=harness([fixture('nord','keys-stage4','Klinke',4)]),source=c.objects[0],left=c.stage.routing.inputs[0];
  source.io.aliases.outputs=['Piano','Piano','Synth','Synth'];c.syncRoutingFromStage(false,false);
  const before=c.snapshot(),history=c.history.length;c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2'});
  const device=c.stage.routing.devices[0],physical=c.objects.find(o=>o.id===device.objectId);assert(physical);assert.equal(physical.type,'di');assert.equal(physical.label,'Piano');assert.equal(c.objects.filter(o=>o.type==='di').length,1);assert(!c.rectanglesOverlap(source,physical));assert(!c.outside(physical,c.stage));assert.equal(c.history[history],before);
  Object.assign(physical,{x:6,y:4,angle:90});const id=physical.id;c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-j48-stereo'});
  assert.equal(c.stage.routing.devices[0].objectId,id);assert.equal(c.objects.filter(o=>o.type==='di').length,1);assert.deepEqual(clone(c.objects.find(o=>o.id===id)),clone(physical));
  c.syncRoutingFromStage(false,false);assert.equal(c.objects.find(o=>o.id===id).x,6);assert(!c.stage.routing.inputs.some(row=>row.sourceKey.startsWith(id+':')));
  const stable=c.snapshot(),nextId=c.nextId;c.saveError=true;assert.throws(()=>c.dispatchRoutingWorkspace({type:'createDi',rowId:left.id,modelId:'radial-prod2',newDevice:true}),/Speichern/);assert.equal(c.snapshot(),stable);assert.equal(c.nextId,nextId);
});
test('Manual DI placement supplies free hardware and removal releases assignments without deleting channels',()=>{
  const c=harness([fixture('nord','keys-stage4','Klinke',2),fixture('placed','di','XLR',2)]),device=c.stage.routing.devices[0],rows=c.stage.routing.inputs;
  assert.equal(device.objectId,'placed');assert.equal(device.channels,2);assert.equal(rows.length,2);assert(c.StageplotRoutingModel.occupancy(c.stage.routing,device.id).every(port=>port.free));
  Object.assign(rows[0],{number:11,stagebox:'box',stageboxPort:5,notes:'Piano'});
  c.dispatchRoutingWorkspace({type:'assignDi',rowId:rows[0].id,deviceId:device.id,autoPair:true});assert(c.stage.routing.inputs.every(row=>row.diDeviceId===device.id));assert.equal(c.objects.filter(o=>o.type==='di').length,1);
  c.detachConnectionsForObject('placed');c.objects=c.objects.filter(o=>o.id!=='placed');c.syncRoutingFromStage(false,false);
  assert.equal(c.stage.routing.devices.length,0);assert.equal(c.objects.filter(o=>o.type==='di').length,0);assert.equal(c.stage.routing.inputs.length,2);assert.equal(c.stage.routing.inputs[0].number,11);assert.equal(c.stage.routing.inputs[0].stageboxPort,5);assert(!c.stage.routing.inputs[0].diDeviceId);
});
test('Old DI placeholders migrate without losing configured channels or creating duplicate hardware',()=>{
  const c=harness([fixture('placed','di')]);
  c.stage.routing.inputs=[{id:'route-placeholder',sourceKey:'placed:io-out-1',instrument:'placed',generatedInstrument:'placed',pickup:'DI',connector:'XLR',number:null,notes:'',manual:false}];
  c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.length,0);assert.equal(c.objects.length,1);assert.equal(c.stage.routing.devices.length,1);
  c.stage.routing.inputs=[{id:'route-legacy-patch',sourceKey:'placed:io-out-1',instrument:'placed',generatedInstrument:'placed',pickup:'DI',connector:'XLR',number:17,stagebox:'existing-box',stageboxPort:7,notes:'Keep wiring',manual:false}];
  c.syncRoutingFromStage(false,false);const row=c.stage.routing.inputs[0];assert.equal(row.id,'route-legacy-patch');assert.equal(row.sourceKey,'');assert.equal(row.number,17);assert.equal(row.stageboxPort,7);assert.equal(row.notes,'Keep wiring');assert.equal(c.stage.routing.devices.length,1);c.syncRoutingFromStage(false,false);assert.equal(c.stage.routing.inputs.length,1);assert.equal(c.objects.length,1);
});
test('Unassigned imported DIs stay available on stage and copied boxes retain their model',()=>{
  const c=harness([fixture('placed','di')]),first=c.stage.routing.devices[0];
  c.StageplotRoutingModel.updateDevice(c.stage.routing,first.id,{modelId:'radial-prod2'});
  c.StageplotRoutingModel.createDevice(c.stage.routing,{modelId:'radial-j48-stereo',name:'Spare DI'});c.syncRoutingFromStage(false,false);
  assert.equal(c.stage.routing.devices.length,2);assert.equal(c.objects.filter(o=>o.type==='di').length,2);assert(c.objects.some(o=>o.label==='Spare DI'));
  const original=c.objects[0],copy={...clone(original),id:'copy',x:4,y:3};c.cloneRoutingDiObject(original,copy);c.objects.push(copy);c.syncRoutingFromStage(false,false);
  const copied=c.stage.routing.devices.find(device=>device.objectId==='copy');assert.equal(copied.modelId,'radial-prod2');assert(c.StageplotRoutingModel.occupancy(c.stage.routing,copied.id).every(port=>port.free));assert.notEqual(copy.label,original.label);
});
if(runFailures.length)throw Error(runFailures.length+' routing host tests failed: '+runFailures.join('; '));
console.log('PASS ROUTING HOST: actual dispatch, atomic patch conflicts, undo rollback, readonly/lock guards, shared DI capacity, custom DI defaults, combo sockets, migration/remapping and monitoring formats.');
