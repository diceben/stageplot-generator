const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),audio=fs.readFileSync('stageplot-audio-v1.js','utf8'),host=fs.readFileSync('stageplot-routing-host-v2.js','utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
function extract(name){
  const start=html.indexOf('  function '+name+'(');assert(start>=0,'Missing host function '+name);
  const end=html.indexOf('\n',start),line=html.slice(start,end);
  if(line.trimEnd().endsWith('}'))return line;
  const close=html.indexOf('\n  }',end);assert(close>=0,'Missing closing brace '+name);return html.slice(start,close+4);
}
const fixture=(id,type,connector='XLR',count=1)=>({id,type,label:id,x:1,y:1,io:{inputs:{count:0,connector:'XLR'},outputs:{count,connector},stereoPairs:count>1?[1]:[],aliases:{inputs:[],outputs:[]}}});
function harness(list=[]){
  const nodes=new Map(),ctx={StageplotRoutingModel:require('./stageplot-routing-model-v2.js'),StageplotMics:require('./stageplot-mics-v1.js'),StageplotIem:require('./stageplot-iem-v1.js'),
    stage:{title:'Routing QA',w:8,d:6,routing:{inputs:[],outputs:[],devices:[],disabledSources:[]},cables:[]},objects:clone(list),history:[],future:[],sharedReadOnly:false,routingTab:'inputs',activeStageboxId:'',nextId:20,token:0,renders:0,saves:0,undoCalls:0,autoCalls:0,
    byId:{guitar:{instrument:true,category:'guitars',short:'Guitar',name:'Gitarre'},keys:{instrument:true,category:'keys',short:'Keys',name:'Keys'},'keys-wave2':{instrument:true,category:'keys',short:'Wave 2',name:'Nord Wave 2'},'keys-bassstation2':{instrument:true,category:'keys',short:'Bass Station',name:'Bass Station'},mic:{instrument:true,name:'Mic'},di:{name:'DI'},rack:{name:'IEM Rack'},wedge:{name:'Wedge'},'iem-earphones':{},'stagebox-8':{short:'Stagebox A'}},
    stageboxCapacity:{'stagebox-8':{inputs:8,outputs:4}},routeModes:new Set(['Mono','Stereo L','Stereo R','Mic','DI','Direct']),routeSignals:new Set(['Mic','Line','Instrument','Digital']),
    projectText:(value,max)=>String(value??'').slice(0,max),normalizeIoConnector:(value,fallback='XLR')=>['XLR','Klinke','USB','Digital','MADI','Dante'].includes(value)?value:fallback,
    objectIo:o=>o.io||{inputs:{count:0,connector:'XLR'},outputs:{count:0,connector:'XLR'},stereoPairs:[],aliases:{inputs:[],outputs:[]}},ioAliasText:value=>value||'',ioAliasAt:()=>'',
    drumModel:{isDrums:()=>false},routeToken:()=>String(++ctx.token),queueDraftSave(){},reconcileCablesWithRouting(){},say(){},isObjectUnlocked:()=>true,
    makeObject:(type,position,id)=>({...fixture(id,type),...position,...(type==='rack'?{iemMixes:[{id:'main',name:'IEM 1',mode:'stereo',transport:'wireless',ports:['iem-l','iem-r']}]}:{})}),
    $:id=>{if(!nodes.has(id))nodes.set(id,{disabled:false});return nodes.get(id);},
    Date:{now:()=>1000},
  };
  ctx.snapshot=()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects});
  ctx.persistDraft=()=>{ctx.saves++;if(ctx.saveError)throw Error('Speichern fehlgeschlagen');return true;};
  ctx.undo=()=>ctx.undoCalls++;ctx.autoAssignRouting=()=>ctx.autoCalls++;
  vm.createContext(ctx);
  vm.runInContext(audio.slice(0,audio.indexOf("$('sp-audio-object').addEventListener")),ctx);
  vm.runInContext(['normalizeRouteChannel','normalizeRouting','defaultObjectIo','objectOutputPortKey','objectOutputBaseName','objectOutputSignal','generatedInputSpecs','generatedOutputSpecs','reconcileRouteList','syncRoutingFromStage','routingStageboxes','routeSourceObject','keepHistory'].map(extract).join('\n'),ctx);
  for(const name of ['normalizeIemConfig','routeNeedsDi','routeStageboxCompatible','routeSpec','ioValueText'])vm.runInContext(html.match(new RegExp('^  const '+name+'=[^\\n]+','m'))[0],ctx);
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
  c.dispatchRoutingWorkspace({type:'assignDi',rowId:left.id,deviceId,channel:2});c.dispatchRoutingWorkspace({type:'assignDi',rowId:right.id,deviceId,channel:1});
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
  c.stage.routing.devices[0].objectId='physical';c.objects[1].locked=true;assert.throws(()=>c.dispatchRoutingWorkspace(action),/gesperrt/);c.objects[1].locked=false;c.stage.routing.devices[0].objectId='';
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

if(runFailures.length)throw Error(runFailures.length+' routing host tests failed: '+runFailures.join('; '));
console.log('PASS ROUTING HOST: actual dispatch, atomic patch conflicts, undo rollback, readonly/lock guards, shared DI capacity, custom DI defaults, combo sockets, migration/remapping and monitoring formats.');
