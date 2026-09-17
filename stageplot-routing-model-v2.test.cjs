const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const model=require('./stageplot-routing-model-v2.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const row=(id,sourceKey,extra={})=>({id,sourceKey,instrument:sourceKey.split(':')[0],pickup:'DI',connector:'Klinke',signalType:'Instrument',microphone:'',phantom:false,manual:false,edited:false,stagebox:'station-box',stageboxPort:4,number:9,stereoGroup:'',linkedSources:[],...extra});
const routing=(inputs=[])=>({version:2,inputs,outputs:[],disabledSources:[],devices:[]});

// One instrument uses one physical input; a second instrument can use the other.
const r=routing([row('route-guitar','station-guitar:main'),row('route-bass','station-bass:main'),row('route-keys','station-keys:out-1')]);
const prod=model.createDevice(r,{modelId:'radial-prod2',name:'ProD2 rechts',channels:1,active:true,power:'48V'});
assert.equal(prod.channels,2);assert.equal(prod.active,false);assert.equal(prod.phantom,false);
model.assignDevice(r,['route-guitar'],prod.id,[1]);
assert.deepEqual(model.occupancy(r,prod.id).map(port=>port.free),[false,true]);
assert.equal(r.inputs.length,3,'A spare DI port does not create a signal');
assert.equal(r.inputs[0].stageboxPort,4);assert.equal(r.inputs[0].number,9);
assert.equal(r.inputs[0].sourceConnector,'Klinke');assert.equal(r.inputs[0].connector,'XLR');
model.assignDevice(r,['route-bass'],prod.id,[2]);
assert.deepEqual(model.occupancy(r,prod.id).map(port=>port.rowId),['route-guitar','route-bass']);
let before=clone(r);assert.throws(()=>model.assignDevice(r,['route-keys'],prod.id,[2]),/belegt/);assert.deepEqual(r,before);
assert.throws(()=>model.assignDevice(r,['route-guitar','route-keys'],prod.id,[1,2]),/belegt/);assert.deepEqual(r,before);
assert.throws(()=>model.assignDevice(r,['route-guitar','route-bass'],prod.id,[1,1]),/einmal/);assert.deepEqual(r,before);
assert.throws(()=>model.assignDevice(r,['route-guitar'],prod.id,[3]),/DI-Eingänge/);assert.deepEqual(r,before);
model.assignDevice(r,['route-guitar','route-bass'],prod.id,[2,1]);
assert.deepEqual(model.occupancy(r,prod.id).map(port=>port.rowId),['route-bass','route-guitar']);

// Fixed manufacturer capacities/power cannot be overridden by arbitrary fields.
const active=model.createDevice(r,{modelId:'radial-j48-stereo',channels:7,active:false,power:'none'});
assert.equal(active.channels,2);assert.equal(active.active,true);assert.equal(active.power,'48V');
model.assignDevice(r,['route-guitar','route-bass'],active.id);
assert(r.inputs.slice(0,2).every(row=>row.phantom&&row.pickup==='DI'&&row.edited));
const mono=model.createDevice(r,{modelId:'radial-j48'});assert.equal(mono.channels,1);
before=clone(r);assert.throws(()=>model.assignDevice(r,['route-guitar','route-bass'],mono.id),/genügend/);assert.deepEqual(r,before);
const custom=model.createDevice(r,{modelId:'custom',name:'Tour DI',channels:4,active:true,power:'battery'});
model.assignDevice(r,['route-keys'],custom.id,[4]);assert.equal(r.inputs[2].phantom,false);
before=clone(r);assert.throws(()=>model.updateDevice(r,custom.id,{channels:2}),/belegter/);assert.deepEqual(r,before);
model.updateDevice(r,custom.id,{name:'Tour DI neu',power:'48V'});assert.equal(r.inputs[2].microphone,'Tour DI neu');assert.equal(r.inputs[2].phantom,true);
model.updateDevice(r,custom.id,{active:false});assert.equal(custom.power,'none');assert.equal(r.inputs[2].phantom,false);
model.updateDevice(r,custom.id,{active:true});assert.equal(custom.power,'48V','Switching a passive custom DI to active supplies a coherent default');assert.equal(custom.phantom,true);assert.equal(r.inputs[2].phantom,true,'The occupied channel follows the active DI power requirement');
model.updateDevice(r,custom.id,{active:false});model.updateDevice(r,custom.id,{active:true,power:'external'});assert.equal(custom.power,'external','An explicit power choice wins over the default');assert.equal(r.inputs[2].phantom,false);
before=clone(r);assert.throws(()=>model.createDevice(r,{modelId:'custom',channels:0}),/1 bis 32/);assert.deepEqual(r,before);
assert.throws(()=>model.updateDevice(r,custom.id,{power:'mains-invalid'}),/Stromversorgung/);assert.deepEqual(r,before);
model.clearDevice(r,['route-keys']);model.ensure(r,[]);assert.equal(r.inputs[2].diDeviceId,'','Explicit clear survives migration');
assert.equal(model.occupancy(r,custom.id).filter(port=>!port.free).length,0);

// Generic models keep physical capacity independent of source format and allow
// active power options without making phantom-powered products configurable.
const generic=routing([row('generic-guitar','station-guitar:main'),row('generic-bass','station-bass:main')]);
for(const [id,name,channels,isActive] of [
  ['generic-passive-mono','DI passiv · Mono',1,false],
  ['generic-passive-stereo','DI passiv · Stereo',2,false],
  ['generic-active-mono','DI aktiv · Mono',1,true],
  ['generic-active-stereo','DI aktiv · Stereo',2,true]
]){
  const device=model.createDevice(generic,{modelId:id,channels:8,active:!isActive});
  assert.equal(device.modelId,id);assert.equal(device.name,name);assert.equal(device.channels,channels);assert.equal(device.active,isActive);
  assert.equal(device.power,isActive?'48V':'none');assert.equal(device.phantom,isActive);
  assert.equal(model.normalizeDevices([{name}])[0].modelId,id,'A generic catalog name retains its model during legacy normalization');
  assert.deepEqual(model.normalizeDevices(clone([device])),[device],'A generic model retains its identity after serialization');
}
const genericStereo=generic.devices.find(device=>device.modelId==='generic-passive-stereo');
model.assignDevice(generic,['generic-guitar'],genericStereo.id,[1]);
assert.equal(model.occupancy(generic,genericStereo.id)[1].free,true,'One mono source leaves the other stereo DI input free');
model.assignDevice(generic,['generic-bass'],genericStereo.id,[2]);
assert.deepEqual(model.occupancy(generic,genericStereo.id).map(port=>port.rowId),['generic-guitar','generic-bass']);
before=clone(generic);assert.throws(()=>model.updateDevice(generic,genericStereo.id,{modelId:'generic-passive-mono'}),/belegter/);assert.deepEqual(generic,before);
model.updateDevice(generic,genericStereo.id,{modelId:'generic-active-stereo'});
assert.equal(genericStereo.power,'48V','Changing a passive model to generic active replaces its inherited no-power setting');
assert(generic.inputs.every(row=>row.phantom));
for(const power of ['battery','external','48V']){
  model.updateDevice(generic,genericStereo.id,{power});assert.equal(genericStereo.power,power);
  assert(generic.inputs.every(row=>row.phantom===(power==='48V')),'Assigned signals follow the selected power requirement');
  const loaded=clone(generic);model.ensure(loaded,[]);assert.deepEqual(loaded.devices,generic.devices);
  assert.deepEqual(loaded.inputs.map(row=>[row.diDeviceId,row.diChannel,row.phantom]),generic.inputs.map(row=>[row.diDeviceId,row.diChannel,row.phantom]));
}
model.updateDevice(generic,genericStereo.id,{modelId:'generic-passive-stereo'});
model.updateDevice(generic,genericStereo.id,{modelId:'generic-active-stereo',power:'external'});
assert.equal(genericStereo.power,'external','An explicit valid power choice wins when changing the model');
assert(generic.inputs.every(row=>!row.phantom));
for(const power of ['none','invalid']){
  before=clone(generic);assert.throws(()=>model.updateDevice(generic,genericStereo.id,{power}),/Stromversorgung/);assert.deepEqual(generic,before);
  assert.throws(()=>model.createDevice(generic,{modelId:'generic-active-mono',power}),/Stromversorgung/);assert.deepEqual(generic,before);
}
const battery=model.createDevice(generic,{modelId:'generic-active-mono',power:'battery'});assert.equal(battery.power,'battery');assert.equal(battery.phantom,false);
assert.equal(model.normalizeDevices([{modelId:'generic-active-mono',power:'none'}])[0].power,'48V','Invalid imported generic active power falls back coherently');
model.updateDevice(generic,genericStereo.id,{modelId:'radial-j48-stereo',power:'battery'});
assert.equal(genericStereo.power,'48V','Named Radial hardware retains its manufacturer power requirement');
assert(generic.inputs.every(row=>row.phantom));

// Persistent pickup origin survives reconciliation-style normalization and deletion.
const p=model.additionalPickup(r,'station-guitar','Mic','test-token');
assert.equal(p.sourceKey,'station-guitar:pickup-test-token');assert(p.manual&&p.edited);assert.equal(p.origin,'pickup');
assert.equal(p.number,null);assert.equal(p.stagebox,'');assert.equal(p.stageboxPort,null);
assert.equal(model.rowExtras(clone(p)).origin,'pickup');
const p2=model.additionalPickup(r,'station-guitar','Mic',()=> 'test-token');assert.notEqual(p.id,p2.id);assert.notEqual(p.sourceKey,p2.sourceKey);
model.removeInput(r,p.id);assert(!r.disabledSources.includes(p.sourceKey));
model.removeInput(r,'route-guitar');assert(r.disabledSources.includes('station-guitar:main'));
assert.equal(model.occupancy(r,active.id).filter(port=>!port.free).length,1);
const merged=row('route-merged','station-sax:main',{linkedSources:[row('route-di','station-di:main'),{...p,id:'route-old-pickup'}]});
const remove=routing([merged]);model.removeInput(remove,merged.id);assert.deepEqual(remove.disabledSources,['station-sax:main','station-di:main']);

// Legacy linked DI rows keep their backups; their physical object becomes one device.
const backup=row('route-di-old','station-di:main',{microphone:'Radial ProD2',notes:'Keep the original backup'});
const legacy=routing([row('route-source','station-guitar:main',{microphone:'Radial ProD2',linkedSources:[backup]})]);
const objects=[{id:'station-di',type:'di',label:'DI Bühne'},{id:'station-guitar',type:'guitar'}];
model.ensure(legacy,objects);assert.equal(legacy.devices.length,1);assert.equal(legacy.devices[0].objectId,'station-di');
assert.equal(legacy.inputs[0].diChannel,1);assert.equal(legacy.inputs[0].linkedSources[0].notes,backup.notes);
assert.equal(legacy.inputs[0].linkedSources[0].sourceKey,backup.sourceKey);
before=clone(legacy);model.ensure(legacy,objects);assert.deepEqual(legacy,before,'Migration is idempotent');

const stereo=routing([row('route-l','station-keys:out-1',{microphone:'Radial J48 Stereo',stereoGroup:'station-keys:stereo-out-1',mode:'Stereo L'}),row('route-r','station-keys:out-2',{microphone:'Radial J48 Stereo',stereoGroup:'station-keys:stereo-out-1',mode:'Stereo R'})]);
model.ensure(stereo,[]);assert.equal(stereo.devices.length,1);assert.deepEqual(stereo.inputs.map(row=>row.diChannel),[1,2]);assert(stereo.inputs.every(row=>row.phantom));
const independent=routing([row('route-a','station-a:main',{microphone:'Radial ProD2'}),row('route-b','station-b:main',{microphone:'Radial ProD2'})]);
model.ensure(independent,[]);assert.equal(independent.devices.length,2,'Matching model names do not merge physical units');
const directPads=routing([row('route-pad-l','station-drums:drum-pad-l',{microphone:'Direktausgang'}),row('route-pad-r','station-drums:drum-pad-r',{microphone:'DI / Line'})]);
model.ensure(directPads,[]);assert.equal(directPads.devices.length,0,'Legacy direct-output placeholders are not physical DI devices');
const explicitlyNamed=model.createDevice(directPads,{modelId:'custom',name:'DI / Line',channels:1});model.assignDevice(directPads,['route-pad-r'],explicitlyNamed.id,[1]);model.ensure(directPads,[]);assert.equal(directPads.inputs[1].diDeviceId,explicitlyNamed.id,'An explicitly chosen custom device can have the same name as a legacy placeholder');assert.equal(directPads.devices.length,1);
const linkedPlaceholder=routing([row('route-linked-pad','station-pad:main',{microphone:'Direktausgang',linkedSources:[row('route-linked-di','station-di:main')]})]);model.ensure(linkedPlaceholder,[{id:'station-di',type:'di',label:'Vorhandene DI'}]);assert.equal(linkedPlaceholder.devices.length,1,'A concrete linked DI object remains a physical device even with an old direct-output label');

// ID remapping handles devices and pickup references while retaining device identity.
const idMap=new Map([['station-di','station-1'],['station-guitar','station-2']]);
const mapped=model.normalizeDevices(legacy.devices,idMap);assert.equal(mapped[0].objectId,'station-1');assert.equal(mapped[0].id,legacy.devices[0].id);
const extras=model.rowExtras({...p,acquisitionId:p.sourceKey,sourcePortKey:'station-guitar:main',monitorDeviceName:'Sender',monitorReceiverName:'Empfänger'},idMap);
assert.equal(extras.acquisitionId,'station-2:pickup-test-token');assert.equal(extras.sourcePortKey,'station-2:main');
assert.equal(extras.monitorDeviceName,'Sender');assert.equal(extras.monitorReceiverName,'Empfänger');
assert(!Object.hasOwn(model.rowExtras(row('route-legacy','station-x:main')),'diDeviceId'));
assert.equal(model.rowExtras({diDeviceId:'',diChannel:null}).diDeviceId,'');
assert.deepEqual(model.normalizeDevices(clone(mapped)),mapped,'DI devices survive JSON and normalizer roundtrips');
const duplicates=routing([row('route-first','station-1:main',{diDeviceId:prod.id,diChannel:1}),row('route-next','station-2:main',{diDeviceId:prod.id,diChannel:1})]);duplicates.devices=[clone(prod)];
model.ensure(duplicates,[]);assert.equal(duplicates.inputs[0].diDeviceId,prod.id);assert.equal(duplicates.inputs[1].diDeviceId,'');assert.equal(duplicates.devices.length,1);
before=clone(duplicates);model.ensure(duplicates,[]);assert.deepEqual(duplicates,before);
const digital=routing([row('route-network','station-laptop:main',{pickup:'Digital',connector:'Dante',linkedSources:[backup]})]);
model.ensure(digital,objects);assert.equal(digital.devices.length,0);assert.equal(digital.inputs[0].connector,'Dante');
const long=model.additionalPickup(r,'x'.repeat(100),'Mic','token'.repeat(20));assert(long.sourceKey.length<=140);

// UMD standalone browser loading requires no document or Node globals.
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('./stageplot-routing-model-v2.js'),'utf8'),context);
assert.equal(context.StageplotRoutingModel.diModels.length,8);
console.log('PASS: shared DI devices, atomic occupancy, pickup persistence and legacy routing migration.');

assert.equal(model.normalizeDevices([{id:'di-missing',modelId:'radial-prod2',objectId:'removed'}],new Map([['other','station-1']]))[0].objectId,'','Missing physical symbols cannot attach to an unrelated renumbered object.');
