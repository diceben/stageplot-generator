// Embedded in the app closure. All workspace edits use the existing draft, undo and export state.
let routingWorkspaceV2=null;
function routingWorkspaceState(){
  const specs=generatedInputSpecs();
  return {tab:routingTab,readonly:sharedReadOnly,saveState:{text:$('sp-header-draft-status').textContent,state:draftState},stage,objects,routing:stage.routing,boxes:allRoutingStageboxes(),catalog:byId,microphones:StageplotMics.catalog,diModels:StageplotRoutingModel.diModels,diStereoSources:Object.fromEntries(objects.map(o=>[o.id,routingDiStereoSource(o)])),diStereoPairs:Object.fromEntries(objects.map(o=>[o.id,routingDiStereoPairs(o)])),sourceOutputs:Object.fromEntries(objects.filter(o=>byId[o.type]?.instrument||byId[o.type]?.category==='amps'&&o.io).map(o=>[o.id,routingSourceOutputs(o,specs)]))};
}
// A physical DI has one routing device and one movable stage object.
function routingDiObject(device){return objects.find(o=>o.id===device?.objectId&&o.type==='di');}
function routingAssertDiEditable(device){if(routingDiObject(device)?.locked)throw Error('Die DI-Box ist gesperrt.');}
function routingUniqueDiLabel(value){
  const base=value.slice(0,36);let name=base,index=2;while(objects.some(o=>o.type==='di'&&o.label===name))name=base+' '+index++;return name;
}
function cloneRoutingDiObject(original,copy){
  if(original.type!=='di')return;
  const device=stage.routing.devices.find(device=>device.objectId===original.id);if(!device)return;
  copy.label=routingUniqueDiLabel(original.label||'DI');StageplotRoutingModel.createDevice(stage.routing,{...device,id:undefined,objectId:copy.id});
}
function routingDiLabel(device,rows){
  const model=StageplotRoutingModel.diModels.find(model=>model.id===device.modelId);
  if(device.name&&device.name!==model?.name&&device.name!=='DI-Box')return device.name.slice(0,42);
  const source=routeSourceObject(rows[0]),io=source&&objectIo(source),aliases=[...new Set(rows.map(row=>io?.aliases.outputs[Number(row.portIndex)-1]).filter(Boolean))];
  const name=aliases.length===1?aliases[0]:source?.label||byId[source?.type]?.short;
  return (name?(aliases.length===1?name:name+' · DI'):'DI '+(objects.filter(o=>o.type==='di').length+1)).slice(0,42);
}
function routingPlaceDi(device,rows){
  const source=routeSourceObject(rows[0]),center=source||{x:stage.w/2,y:stage.d/2,angle:0},size=typeof bounds==='function'&&source?bounds(source):{hw:.6,hd:.4};
  let id;do{id='station-'+nextId++;}while(objects.some(o=>o.id===id));
  const o=makeObject('di',{x:center.x,y:center.y},id),own=typeof bounds==='function'?bounds(o):{hw:.08,hd:.12};
  const occupied=objects.filter(other=>!byId[other.type]?.underlay&&other.type!=='text'),candidates=[];
  for(let ring=0;ring<24;ring++){
    const dx=size.hw+own.hw+.18+ring*.25,dy=size.hd+own.hd+.18+ring*.25;
    for(const [x,y] of [[dx,0],[-dx,0],[0,dy],[0,-dy],[dx,dy],[-dx,dy],[dx,-dy],[-dx,-dy]])candidates.push({x:center.x+x,y:center.y+y});
  }
  const score=position=>{Object.assign(o,position);const off=typeof outside==='function'?outside(o,stage):o.x<own.hw||o.y<own.hd||o.x>stage.w-own.hw||o.y>stage.d-own.hd;const overlap=occupied.filter(other=>typeof rectanglesOverlap==='function'?rectanglesOverlap(o,other):Math.abs(o.x-other.x)<.35&&Math.abs(o.y-other.y)<.35).length;return Number(off)*1000+overlap;};
  let chosen=candidates[0],best=Infinity;
  for(const position of candidates){const value=score(position);if(value<best){best=value;chosen=position;}if(value===0)break;}
  Object.assign(o,chosen,{label:routingUniqueDiLabel(routingDiLabel(device,rows)),showLabel:true,showOuts:false});objects.push(o);device.objectId=o.id;return o;
}
function syncRoutingDiObjects(){
  if(!stage)return false;
  const routing=stage.routing,diIds=new Set(objects.filter(o=>o.type==='di').map(o=>o.id));let changed=false;
  // Old DI placeholder rows are equipment, not extra sound sources. Keep any
  // configured channel as an unassigned source rather than losing its patch.
  for(const direction of ['inputs','outputs'])routing[direction]=routing[direction].filter(row=>{
    const owner=String(row.sourceKey||'').split(':')[0];
    const real=(row.linkedSources||[]).filter(member=>!diIds.has(String(member.sourceKey||'').split(':')[0]));
    if(!diIds.has(owner)){if(real.length!==(row.linkedSources||[]).length){row.linkedSources=real;changed=true;}return true;}
    changed=true;
    if(real.length){const first=real.shift();Object.assign(row,{sourceKey:first.sourceKey,portIndex:first.portIndex,sourceConnector:first.sourceConnector||first.connector,sourceSignalType:first.sourceSignalType||first.signalType,generatedInstrument:first.generatedInstrument||first.instrument,instrument:first.instrument||row.instrument,linkedSources:real,manual:true});return true;}
    const physical=objects.find(o=>o.id===owner),custom=row.instrument&&![physical?.label,'DI-Box',row.generatedInstrument].includes(row.instrument);
    routing.disabledSources=[...new Set([...routing.disabledSources,row.sourceKey])];
    if(row.number||row.stagebox||row.notes||custom){Object.assign(row,{sourceKey:'',linkedSources:[],manual:true,instrument:custom?row.instrument:'Signal an '+(physical?.label||'DI'),generatedInstrument:'',portIndex:null});return true;}
    return false;
  });
  for(const o of objects.filter(o=>o.type==='di'))if(!routing.devices.some(device=>device.objectId===o.id)){
    if(!o.label||['DI','DI-Box'].includes(o.label))o.label=routingUniqueDiLabel('DI');
    const io=objectIo(o);StageplotRoutingModel.createDevice(routing,{modelId:io.outputs.count>1?'generic-passive-stereo':'generic-passive-mono',name:o.label||'DI-Box',objectId:o.id});changed=true;
  }
  const claimed=new Set();
  for(const device of routing.devices){
    let o=routingDiObject(device);if(o&&claimed.has(o.id)){device.objectId='';o=null;changed=true;}
    if(!o){o=routingPlaceDi(device,routing.inputs.filter(row=>row.diDeviceId===device.id));changed=true;}
    claimed.add(o.id);
    const count=device.channels,io=objectIo(o);
    if(io.inputs.count!==count||io.outputs.count!==count||io.inputs.connector!=='Klinke'||io.outputs.connector!=='XLR'){
      o.io={...io,inputs:{count,connector:'Klinke'},outputs:{count,connector:'XLR'},stereoPairs:[],aliases:{inputs:normalizeIoAliasList(io.aliases.inputs,count),outputs:normalizeIoAliasList(io.aliases.outputs,count)}};o.outs=count+' '+(count===1?'Out':'Outs')+' · XLR';changed=true;
    }
  }
  return changed;
}
function routingChooseDiModel(action){
  const routing=stage.routing,requested=routingPickupRows(action),paired=routingDiSelectionRows(action),model=StageplotRoutingModel.diModels.find(model=>model.id===action.modelId);
  if(!model)throw Error('DI-Modell nicht gefunden.');
  const current=routing.devices.find(device=>device.id===requested[0].diDeviceId),shared=current&&paired.length===2&&paired.every(row=>row.diDeviceId===current.id),rows=(model.channels||action.channels||1)>=2?paired:requested;
  if((model.channels||action.channels||1)<2&&(requested.length>1||shared))throw Error('Für beide Ausgänge wird eine DI-Box mit zwei Eingängen benötigt.');
  const ids=new Set(rows.map(row=>row.id)),replace=current&&!action.newDevice&&routing.inputs.filter(row=>row.diDeviceId===current.id).every(row=>ids.has(row.id));
  const fields=Object.fromEntries(Object.entries({modelId:action.modelId,name:action.name||model.name,channels:action.channels,active:action.active,power:action.power||(action.phantom===false?'none':undefined)}).filter(([,value])=>value!==undefined));
  if(replace)routingAssertDiEditable(current);
  const device=replace?StageplotRoutingModel.updateDevice(routing,current.id,fields):StageplotRoutingModel.createDevice(routing,fields);
  StageplotRoutingModel.assignDevice(routing,rows.map(row=>row.id),device.id,rows.map((_,index)=>index+1));rows.forEach(writeRoutingPickup);
}
function routingSourceOutputEditor(o){return drumModel.isDrums(o?.type)?'drums':o?.type==='percussion'?'percussion':o?.type==='orchestra'?'orchestra':o?.type==='laptop'?'playback':'';}
function routingSourceOutputs(o,specs=generatedInputSpecs()){
  const io=objectIo(o),editor=routingSourceOutputEditor(o),locked=sharedReadOnly||o.locked===true,all=[...stage.routing.inputs,...stage.routing.outputs];
  const own=specs.filter(spec=>spec.sourceKey.startsWith(o.id+':'));
  return {count:io.outputs.count,connector:io.outputs.connector,connectors:[...ioConnectorValues],stereoPairs:[...io.stereoPairs],aliases:[...io.aliases.outputs],editor,locked,editable:!locked&&!editor&&o.type!=='di',ports:own.map(spec=>{
    const row=all.find(row=>audioMembers(row).some(member=>member.sourceKey===spec.sourceKey)),mixed=!!row&&(row.sourceKey!==spec.sourceKey||(row.linkedSources||[]).length>0||stage.routing.outputs.includes(row));
    return {number:spec.portIndex,sourceKey:spec.sourceKey,rowId:row?.id||'',active:!!row,locked:locked||mixed||!!routeSourceObject(row)?.locked};
  })};
}
function routingEditableSourceOutputs(sourceId){
  const o=objects.find(o=>o.id===sourceId);
  if(!o||!(byId[o.type]?.instrument||byId[o.type]?.category==='amps'&&o.io))throw Error('Die Quelle ist nicht mehr verfügbar.');
  if(o.locked)throw Error('Das Bühnenobjekt ist gesperrt.');
  if(routingSourceOutputEditor(o)||o.type==='di')throw Error('Die Ausgänge werden im zugehörigen Geräte-Setup eingestellt.');
  return o;
}
function openRoutingObjectOutputs(sourceId){
  if(!objects.some(o=>o.id===sourceId))return;
  routingTab='inputs';show('routing');routingWorkspaceV2?.openSourceOutputs(sourceId);
}
function openRoutingSourceEditor(sourceId){
  const o=objects.find(o=>o.id===sourceId);if(!o)throw Error('Die Quelle ist nicht mehr verfügbar.');
  if(o.locked)throw Error('Das Bühnenobjekt ist gesperrt.');
  const editor=routingSourceOutputEditor(o);if(!editor)throw Error('Für diese Quelle ist kein weiteres Geräte-Setup nötig.');
  const focus=typeof document==='undefined'?null:document.activeElement;
  if(editor==='playback'){openPlaybackDialog(o.id,focus);return;}
  selected=o.id;openSelectedDrumDesigner({currentTarget:focus});
}
function routingAssertNativeOutputs(keys){
  const all=[...stage.routing.inputs,...stage.routing.outputs];
  if(all.some(row=>(row.linkedSources||[]).some(member=>keys.has(member.sourceKey)))||stage.routing.inputs.some(row=>keys.has(row.sourceKey)&&(row.linkedSources||[]).length))throw Error('Diese Ausgänge sind mit weiteren Signalen verbunden. Zuerst den gemeinsamen Signalweg trennen.');
  if(stage.routing.outputs.some(row=>keys.has(row.sourceKey)))throw Error('Ein Geräteausgang wird bereits in einem anderen Signalweg verwendet.');
  for(const row of stage.routing.inputs.filter(row=>keys.has(row.sourceKey)))routingEditableRow('inputs',row.id);
}
function setRoutingSourceOutputs(action){
  const source=routingEditableSourceOutputs(action.sourceId),beforeIo=objectIo(source),io=JSON.parse(JSON.stringify(beforeIo));
  const oldSpecs=new Map(generatedInputSpecs().filter(spec=>spec.sourceKey.startsWith(source.id+':')).map(spec=>[spec.sourceKey,spec]));
  const keyFor=port=>source.id+':'+objectOutputPortKey(source,port-1),activate=new Set(),deactivate=new Set(),formatKeys=new Set();
  let connectorChanged=false;
  if(action.type==='setSourceOutputs'){
    const fields=action.fields||{},count=fields.count===undefined?io.outputs.count:Number(fields.count),connector=fields.connector===undefined?io.outputs.connector:fields.connector;
    if(!Number.isInteger(count)||count<0||count>64)throw Error('Die Anzahl der Ausgänge muss zwischen 0 und 64 liegen.');
    if(!ioConnectorValues.includes(connector))throw Error('Bitte einen gültigen Anschluss wählen.');
    if(count===io.outputs.count&&connector===io.outputs.connector)return false;
    routingAssertNativeOutputs(new Set(oldSpecs.keys()));
    for(let port=io.outputs.count+1;port<=count;port++)activate.add(keyFor(port));
    for(let port=count+1;port<=io.outputs.count;port++)deactivate.add(keyFor(port));
    connectorChanged=connector!==io.outputs.connector;
    io.outputs={count,connector};io.aliases.outputs=normalizeIoAliasList(io.aliases.outputs,count);io.stereoPairs=io.stereoPairs.filter(start=>start<count);
    for(const start of beforeIo.stereoPairs)if(!io.stereoPairs.includes(start)){formatKeys.add(keyFor(start));formatKeys.add(keyFor(start+1));}
  }else{
    const port=Number(action.type==='setSourceOutputStereo'?action.start:action.port);
    if(!Number.isInteger(port)||port<1||port>io.outputs.count)throw Error('Diesen Geräteausgang gibt es nicht.');
    if(action.type==='setSourceOutputStereo'){
      if(port%2!==1||port>=io.outputs.count||typeof action.linked!=='boolean')throw Error('Für Stereo zwei benachbarte Ausgänge auswählen.');
      const keys=[keyFor(port),keyFor(port+1)],keySet=new Set(keys);routingAssertNativeOutputs(keySet);
      const rows=stage.routing.inputs.filter(row=>keySet.has(row.sourceKey));
      if(action.linked&&rows.some(row=>row.stereoGroup&&stage.routing.inputs.some(other=>other.stereoGroup===row.stereoGroup&&!keySet.has(other.sourceKey))))throw Error('Ein Ausgang ist bereits mit einer anderen Abnahme verbunden. Diese Stereo-Verbindung zuerst lösen.');
      io.stereoPairs=action.linked?[...new Set([...io.stereoPairs,port])].sort((a,b)=>a-b):io.stereoPairs.filter(start=>start!==port);
      for(const key of keys){formatKeys.add(key);if(action.linked)activate.add(key);}
      if(action.linked){const alias=io.aliases.outputs[port-1]||io.aliases.outputs[port]||'';io.aliases.outputs[port-1]=alias;io.aliases.outputs[port]=alias;}
    }else if(action.type==='setSourceOutputUsed'){
      if(typeof action.used!=='boolean')throw Error('Bitte den Ausgang aktivieren oder deaktivieren.');
      const key=keyFor(port);routingAssertNativeOutputs(new Set([key]));
      const active=stage.routing.inputs.some(row=>row.sourceKey===key),disabled=stage.routing.disabledSources.includes(key);
      if(action.used===active&&(action.used?!disabled:disabled))return false;
      (action.used?activate:deactivate).add(key);
      const pair=io.stereoPairs.find(start=>port===start||port===start+1);
      if(pair){
        const pairKeys=new Set([keyFor(pair),keyFor(pair+1)]);routingAssertNativeOutputs(pairKeys);
        if(action.used&&stage.routing.inputs.some(row=>pairKeys.has(row.sourceKey)&&row.stereoGroup&&stage.routing.inputs.some(other=>other.stereoGroup===row.stereoGroup&&!pairKeys.has(other.sourceKey))))throw Error('Ein Ausgang ist bereits mit einer anderen Abnahme verbunden. Diese Stereo-Verbindung zuerst lösen.');
        if(!action.used)io.stereoPairs=io.stereoPairs.filter(start=>start!==pair);
        for(const pairKey of pairKeys)formatKeys.add(pairKey);
      }
    }else if(action.type==='setSourceOutputAlias'){
      const pair=io.stereoPairs.find(start=>port===start||port===start+1),ports=pair?[pair,pair+1]:[port],value=ioAliasText(action.value);
      routingAssertNativeOutputs(new Set(ports.map(keyFor)));
      if(ports.every(number=>io.aliases.outputs[number-1]===value))return false;
      for(const number of ports)io.aliases.outputs[number-1]=value;
    }
  }
  source.io=io;source.outs=ioValueText(io.outputs,'outputs').replace(/^Keine Outs$/,'');
  const specs=new Map(generatedInputSpecs().filter(spec=>spec.sourceKey.startsWith(source.id+':')).map(spec=>[spec.sourceKey,spec]));
  const removedGroups=new Set(stage.routing.inputs.filter(row=>deactivate.has(row.sourceKey)).map(row=>row.stereoGroup).filter(Boolean));
  stage.routing.inputs=stage.routing.inputs.filter(row=>!deactivate.has(row.sourceKey));
  const disabled=new Set(stage.routing.disabledSources);for(const key of deactivate)disabled.add(key);for(const key of activate)disabled.delete(key);stage.routing.disabledSources=[...disabled];
  for(const key of activate){
    const spec=specs.get(key);if(!spec)throw Error('Der Geräteausgang konnte nicht aktiviert werden.');
    if(stage.routing.inputs.some(row=>row.sourceKey===key))continue;
    if(stage.routing.inputs.length>=512)throw Error('Es können höchstens 512 Eingangssignale angelegt werden.');
    stage.routing.inputs.push(normalizeRouteChannel({...spec,id:'route-'+routeToken(),generatedInstrument:spec.instrument},stage.routing.inputs.length,'inputs'));
  }
  for(const row of stage.routing.inputs){
    const spec=specs.get(row.sourceKey),old=oldSpecs.get(row.sourceKey);if(!spec)continue;
    if(!row.instrument||row.instrument===row.generatedInstrument||row.instrument===old?.instrument)row.instrument=spec.instrument;
    row.generatedInstrument=spec.instrument;row.portIndex=spec.portIndex;
    if(connectorChanged){
      row.sourceConnector=spec.connector;row.sourceSignalType=spec.signalType;
      if(['Dante','MADI','USB','Digital'].includes(spec.connector))Object.assign(row,{pickup:'Digital',connector:spec.connector,signalType:'Digital',diDeviceId:'',diChannel:null,microphone:'',phantom:false});
      else if(row.pickup==='Digital')Object.assign(row,{pickup:spec.signalType==='Mic'?'Mic':spec.signalType==='Instrument'?'DI':'Direct',connector:spec.signalType==='Mic'?'XLR':spec.connector,signalType:spec.signalType,diDeviceId:'',diChannel:null,microphone:'',phantom:false});
      else row.connector=['Mic','DI'].includes(row.pickup)?'XLR':spec.connector;
      const box=routingStageboxes('inputs').find(item=>item.id===row.stagebox);if(box&&!routeStageboxCompatible(row,'inputs',box)){row.stagebox='';row.stageboxPort=null;}
      row.edited=true;writeRoutingPickup(row);
    }
    if(formatKeys.has(row.sourceKey)){
      const members=row.stereoGroup?stage.routing.inputs.filter(other=>other.stereoGroup===row.stereoGroup):[];
      if(members.some(member=>!formatKeys.has(member.sourceKey)))continue;
      Object.assign(row,{mode:spec.stereoGroup?spec.mode:'Mono',stereoGroup:spec.stereoGroup||'',edited:true});
    }
  }
  for(const group of removedGroups){
    const remaining=stage.routing.inputs.filter(row=>row.stereoGroup===group);
    if(remaining.length===1){routingEditableRow('inputs',remaining[0].id);Object.assign(remaining[0],{stereoGroup:'',mode:'Mono',edited:true});}
  }
  return true;
}
function routingNativeOutputPair(rows){
  if(rows.length!==2)return null;
  const source=routeSourceObject(rows[0]);if(!source||routeSourceObject(rows[1])?.id!==source.id||routingSourceOutputEditor(source)||source.type==='di')return null;
  const ordered=rows.slice().sort((a,b)=>a.portIndex-b.portIndex),start=Number(ordered[0].portIndex),io=objectIo(source);
  if(!Number.isInteger(start)||start%2!==1||start>=io.outputs.count||Number(ordered[1].portIndex)!==start+1||ordered.some((row,index)=>row.sourceKey!==source.id+':'+objectOutputPortKey(source,start+index-1)))return null;
  return {source,start};
}
function routingDiStereoSource(o){
  const c=byId[o?.type];if(!c?.instrument||drumModel.isDrums(o.type)||['percussion','orchestra','di'].includes(o.type))return false;
  const io=objectIo(o),defaults=defaultObjectIo(o);
  return ['XLR','Klinke'].includes(io.outputs.connector)&&objectOutputSignal(o,io.outputs.connector)==='Line'&&Math.max(io.outputs.count,defaults.outputs.count)>=2;
}
function routingDiStereoPairs(o){
  if(!routingDiStereoSource(o))return [];
  const count=Math.max(objectIo(o).outputs.count,defaultObjectIo(o).outputs.count);
  return Array.from({length:Math.floor(count/2)},(_,index)=>{
    const start=index*2+1,ports=[start,start+1];
    return {start,ports,sourceKeys:ports.map(port=>o.id+':'+objectOutputPortKey(o,port-1))};
  });
}
function routingPickupRows(action){
  const ids=Array.isArray(action.rowIds)?action.rowIds:[action.rowId];
  if(!ids.length||ids.length>2||new Set(ids).size!==ids.length||!ids.includes(action.rowId))throw Error('Bitte die Abnahme erneut auswählen.');
  const rows=ids.map(id=>routingEditableRow('inputs',id)),sourceId=row=>routeSourceObject(row)?.id||row.sourceKey?.split(':')[0]||row.id;
  rows.forEach(row=>routingAssertDiEditable(stage.routing.devices.find(device=>device.id===row.diDeviceId)));
  if(rows.length>1&&rows.some(row=>sourceId(row)!==sourceId(rows[0])))throw Error('Eine gemeinsame Abnahme gehört zu derselben Quelle.');
  const sharedDevice=rows[0].diDeviceId&&rows.every(row=>row.diDeviceId===rows[0].diDeviceId);
  return rows.slice().sort((a,b)=>sharedDevice?Number(a.diChannel)-Number(b.diChannel):(Number(a.portIndex)||Infinity)-(Number(b.portIndex)||Infinity));
}
function routingDiSelectionRows(action){
  const rows=routingPickupRows(action);if(rows.length>1)return rows;
  const row=rows[0],members=row.stereoGroup?stage.routing.inputs.filter(other=>other.stereoGroup===row.stereoGroup):[];
  if(routingNativeOutputPair(members))return routingPickupRows({...action,rowIds:members.map(member=>member.id)});
  return rows;
}
function drawRoutingStage(host,ids=[]){
  if(!stage)return;
  const W=Math.floor(host.getBoundingClientRect().width),H=Math.max(160,Math.floor(host.getBoundingClientRect().height)||200);if(W<80)return;
  const area=workspaceBounds(stage,objects,false),scale=Math.min((W-24)/(area.maxX-area.minX),(H-30)/(area.maxY-area.minY));
  const fixed={H,scale,mx:(W-(area.maxX-area.minX)*scale)/2-area.minX*scale,top:(H-(area.maxY-area.minY)*scale)/2-area.minY*scale};
  drawFloor(host,stage,objects.map(o=>({...o,showLabel:false,showOuts:false})),'routing',fixed);
  host.querySelectorAll('[data-label-layer],.sp-dimension,.sp-orientation,[data-stage-measure],[data-stage-measure-tick],[data-stage-side],[data-stage-grid],[data-grid-scale-label]').forEach(node=>node.remove());
  const svg=host.querySelector('svg');if(!svg)return;svg.setAttribute('aria-label','Bühne in Draufsicht · ausgewähltes Objekt grün markiert');
  host.querySelector('[data-canvas-background]')?.setAttribute('fill','transparent');
  const selectedIds=new Set(ids);
  for(const node of host.querySelectorAll('[data-object-visual]')){
    const active=selectedIds.has(node.dataset.objectVisual);node.dataset.routingSelected=String(active);
    node.style.filter=active?'drop-shadow(0 0 3px #5ad788) drop-shadow(0 0 6px #5ad788)':'';
    node.style.opacity=active||!selectedIds.size?'1':'.62';
  }
}
function renderRouting(){
  if(!stage)return;syncRoutingFromStage(false,false);
  const host=$('sp-routing-workspace-v2');if(!host)return;
  if(!routingWorkspaceV2)routingWorkspaceV2=StageplotRoutingWorkspace.create(host,{getState:routingWorkspaceState,objectIcon:value=>{const o=typeof value==='string'?objects.find(o=>o.type===value)||{type:value}:value;return o&&byId[o.type]?icon(objectCatalog(o),o):'';},microphoneIcon:name=>{const photo=StageplotMics.photo(name);return photo?'<img src="'+esc(photo)+'" alt="'+esc(name)+'" loading="lazy">':'';},renderStage:drawRoutingStage,dispatch:dispatchRoutingWorkspace,announce:say});
  $('sp-routing').dataset.workspaceV2='true';routingWorkspaceV2.render();
}
function openRoutingSource(direction,rowId){
  routingTab=direction==='outputs'?'outputs':'inputs';show('routing');
  const row=stage.routing[routingTab].find(row=>row.id===rowId),id=direction==='outputs'?row?.id:row?.sourceKey?.split(':')[0]||row?.id;
  if(id)routingWorkspaceV2.selectSource(id);
}
function routingEditableRow(direction,id){
  const row=stage.routing[direction]?.find(row=>row.id===id);if(!row)throw Error('Das Signal ist nicht mehr verfügbar.');
  if(routeSourceObject(row)?.locked)throw Error('Das Bühnenobjekt ist gesperrt.');return row;
}
function routingWorkspaceMembers(direction,ids,exactRows=false){
  const rows=stage.routing[direction],selected=(ids||[]).map(id=>routingEditableRow(direction,id)),members=[];
  for(const row of selected)for(const member of exactRows?[row]:audioOrderedGroup(rows,row))if(!members.some(item=>item.id===member.id)){routingEditableRow(direction,member.id);members.push(member);}
  if(!members.length)throw Error('Bitte ein Signal wählen.');return members;
}
function connectRoutingStereoDi(action){
  const selected=routingEditableRow('inputs',action.rowId),source=routeSourceObject(selected);
  if(!routingDiStereoSource(source))throw Error('Diese Quelle hat keine zwei analogen Line-Ausgänge.');
  const device=stage.routing.devices?.find(item=>item.id===action.deviceId);
  if(!device||device.channels<2)throw Error('Für L und R wird eine DI-Box mit zwei Eingängen benötigt.');
  if(device.objectId&&objects.find(o=>o.id===device.objectId)?.locked)throw Error('Die DI-Box ist gesperrt.');
  const nativePair=routingDiStereoPairs(source).find(pair=>pair.sourceKeys.includes(selected.sourceKey));
  if(!nativePair)throw Error('Bitte einen der beiden Geräteausgänge auswählen.');
  const {start,sourceKeys:keys}=nativePair,keySet=new Set(keys);
  const all=[...stage.routing.inputs,...stage.routing.outputs];
  if(all.some(row=>(row.linkedSources||[]).some(member=>keySet.has(member.sourceKey)))||stage.routing.inputs.some(row=>keySet.has(row.sourceKey)&&(row.linkedSources||[]).length))throw Error('Die Geräteausgänge sind mit weiteren Signalen verbunden. Zuerst den gemeinsamen Signalweg trennen.');
  if(stage.routing.outputs.some(row=>keySet.has(row.sourceKey)))throw Error('Ein Geräteausgang wird bereits in einem anderen Signalweg verwendet.');
  const current=stage.routing.inputs.filter(row=>keySet.has(row.sourceKey));
  if(new Set(current.map(row=>row.sourceKey)).size!==current.length)throw Error('Ein Geräteausgang wird bereits mehrfach verwendet.');
  for(const row of current){
    routingEditableRow('inputs',row.id);
    if(row.pickup==='Digital'||['Dante','MADI','USB','Digital'].includes(row.connector))throw Error('Ein digitales Signal kann nicht durch eine analoge DI-Box geführt werden.');
    if(row.stereoGroup&&stage.routing.inputs.some(other=>other.stereoGroup===row.stereoGroup&&!keySet.has(other.sourceKey)))throw Error('Ein Geräteausgang ist bereits mit einem anderen Stereosignal verbunden.');
  }
  const selectedIds=new Set(current.map(row=>row.id));
  if(stage.routing.inputs.some(row=>row.diDeviceId===device.id&&[1,2].includes(Number(row.diChannel))&&!selectedIds.has(row.id)))throw Error('Ein benötigter DI-Eingang ist bereits belegt.');
  const io=objectIo(source),pair=keys.map(key=>current.find(row=>row.sourceKey===key));
  if(io.outputs.count>=start+1&&io.stereoPairs.includes(start)&&pair.every((row,index)=>row&&row.diDeviceId===device.id&&Number(row.diChannel)===index+1&&row.mode==='Stereo '+(index?'R':'L'))&&pair[0].stereoGroup&&pair[0].stereoGroup===pair[1].stereoGroup)return false;
  const originals=new Map(current.map(row=>[row.sourceKey,{...row}]));
  source.io={...io,outputs:{...io.outputs,count:Math.max(start+1,io.outputs.count)},stereoPairs:[...new Set([start,...io.stereoPairs])].sort((a,b)=>a-b),aliases:{...io.aliases,outputs:Array.from({length:Math.max(start+1,io.outputs.count)},(_,index)=>io.aliases.outputs[index]||'')}};
  source.outs=ioValueText(source.io.outputs,'outputs');
  stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>!keySet.has(key));
  // Native outputs beyond the default active pair need explicit activation.
  const specs=generatedInputSpecs();
  for(const key of keys)if(!stage.routing.inputs.some(row=>row.sourceKey===key)){
    const spec=specs.find(item=>item.sourceKey===key);if(!spec)throw Error('Der Geräteausgang konnte nicht aktiviert werden.');
    if(stage.routing.inputs.length>=512)throw Error('Es können höchstens 512 Eingangssignale angelegt werden.');
    stage.routing.inputs.push(normalizeRouteChannel({...spec,id:'route-'+routeToken(),generatedInstrument:spec.instrument},stage.routing.inputs.length,'inputs'));
  }
  // Reconciliation owns physical output IDs, including legacy configured-out keys.
  // It replaces stage.routing, so all rows and the device are looked up again below.
  syncRoutingFromStage(false,false);
  const routing=stage.routing,rows=keys.map(key=>routing.inputs.find(row=>row.sourceKey===key));
  if(rows.some(row=>!row))throw Error('Die Geräteausgänge konnten nicht aktiviert werden.');
  const group=pair[0]?.stereoGroup&&pair[0].stereoGroup===pair[1]?.stereoGroup?pair[0].stereoGroup:source.id+':stereo-out-'+start;
  rows.forEach((row,index)=>{
    const original=originals.get(row.sourceKey),generatedInstrument=row.generatedInstrument;
    if(original)Object.assign(row,original,{generatedInstrument});
    Object.assign(row,{portIndex:start+index,mode:'Stereo '+(index?'R':'L'),stereoGroup:group,edited:true});
  });
  StageplotRoutingModel.assignDevice(routing,rows.map(row=>row.id),device.id,[1,2]);
  rows.forEach(writeRoutingPickup);
  return true;
}
function writeRoutingPickup(row){
  StageplotMics.writeDrumRoute(objects,row,type=>drumModel.isDrums(type),config=>drumModel.normalizeDrums(config));
  const o=routeSourceObject(row);if(o?.type==='percussion'){
    const channel=percussionModel.channels(o.percussion).find(ch=>o.id+':perc-'+ch.id===row.sourceKey);
    if(channel&&!channel.electronic){const match=/-(\d+)$/.exec(channel.id),part=o.percussion.parts.find(p=>p.id===channel.partId);if(part){const index=Number(match?.[1]||1)-1;part.mics=Array.isArray(part.mics)?part.mics:[];while(part.mics.length<=index)part.mics.push({model:'',phantom:false});Object.assign(part.mics[index],{model:row.microphone,phantom:row.phantom});}}
  }
}
function routingMonitorFields(rows,fields){
  if(fields.name!==undefined)fields={...fields,...(audioKind(rows[0])==='iem'?{iemName:fields.name}:{instrument:fields.name})};
  const allowed=['notes','instrument','iemName','iemTransport','frequencyBand','monitorDeviceName','monitorReceiverName','monitorAmplifierName','monitorDeviceKind','monitorActive','outputKind'];
  for(const row of rows){for(const key of allowed)if(Object.hasOwn(fields,key))row[key]=key==='monitorActive'?fields[key]===true:projectText(fields[key],key==='notes'?240:key==='frequencyBand'?100:80);row.edited=true;
    if(fields.iemName!==undefined)row.instrument='IEM · '+row.iemName+(row.stereoGroup?' · '+(row.mode==='Stereo R'?'R':'L'):'');
    if(row.iemTransport==='cable')row.frequencyBand='';
  }
  const o=routeSourceObject(rows[0]);if(o?.type==='rack'&&audioKind(rows[0])==='iem'){
    const mixes=StageplotIem.read(o,stage.routing.outputs),mix=mixes.find(m=>m.ports.some(p=>o.id+':'+p===rows[0].sourceKey));
    if(mix){if(fields.iemName!==undefined)mix.name=fields.iemName;if(fields.iemTransport!==undefined)mix.transport=fields.iemTransport;if(fields.frequencyBand!==undefined)mix.frequencyBand=fields.frequencyBand;o.iemMixes=StageplotIem.normalize(mixes);o.iem={...o.iemMixes[0]};}
  }
}
function setRoutingMonitorFormat(rows,format){
  if(!['mono','stereo'].includes(format))throw Error('Ungültiges Monitorformat.');
  const o=routeSourceObject(rows[0]);
  if(o?.type==='rack'&&audioKind(rows[0])==='iem'){
    const mixes=StageplotIem.read(o,stage.routing.outputs),mix=mixes.find(m=>m.ports.some(p=>o.id+':'+p===rows[0].sourceKey));
    if(mix){mix.mode=format;const oldIds=new Set(stage.routing.outputs.map(row=>row.id)),shared=Object.fromEntries(['monitorDeviceName','monitorReceiverName','monitorAmplifierName','monitorDeviceKind','monitorActive'].map(key=>[key,rows[0][key]]));const result=StageplotIem.apply(o,stage.routing.outputs,mixes,routeToken);for(const row of result.rows)if(!oldIds.has(row.id)&&mix.ports.some(port=>o.id+':'+port===row.sourceKey))Object.assign(row,shared);o.iemMixes=result.mixes;o.iem={...result.mixes[0]};stage.routing.outputs=result.rows;return;}
  }
  const left=rows.find(row=>row.mode!=='Stereo R')||rows[0],base=audioBaseName(left),group=left.iemGroup||left.stereoGroup||'monitor-'+routeToken();
  if(format==='mono'){
    for(const right of rows.filter(row=>row!==left)){if(right.sourceKey)stage.routing.disabledSources.push(right.sourceKey);stage.routing.outputs=stage.routing.outputs.filter(row=>row.id!==right.id);}
    Object.assign(left,{mode:'Mono',stereoGroup:'',iemMode:audioKind(left)==='iem'?'mono':'',edited:true,instrument:base});return;
  }
  let right=rows.find(row=>row!==left);
  if(!right){right=normalizeRouteChannel({...left,id:'route-'+routeToken(),sourceKey:o?o.id+':monitor-'+routeToken():'',manual:true,number:null,stagebox:'',stageboxPort:null},stage.routing.outputs.length,'outputs');stage.routing.outputs.splice(stage.routing.outputs.indexOf(left)+1,0,right);}
  [left,right].forEach((row,index)=>Object.assign(row,{mode:'Stereo '+(index?'R':'L'),stereoGroup:group,iemGroup:audioKind(row)==='iem'?group:'',iemMode:audioKind(row)==='iem'?'stereo':'',edited:true,instrument:base+' · '+(index?'R':'L')}));
}
function dispatchRoutingWorkspace(action){
  if(action.type==='selectTab'){routingTab=['inputs','outputs','stageboxes'].includes(action.tab)?action.tab:'inputs';renderRouting();return;}
  if(action.type==='exportPatch'){exportRoutingWorkspace(action.direction);return;}
  if(action.type==='pdf'){show('print');setExportIntent('technical');setPdfPreset('plan');$('sp-print-inputs').checked=true;$('sp-print-routing').checked=true;renderPrint();return;}
  if(action.type==='xlsx'){exportRoutingXlsx();return;}
  if(sharedReadOnly)throw Error('Diese Freigabe ist schreibgeschützt.');
  if(action.type==='undo'||action.type==='redo'){undo(action.type==='redo');return;}
  if(action.type==='autoPatch'){autoAssignRouting();return;}
  if(action.type==='openPlayback'){openPlaybackDialog(action.sourceId);return;}
  if(action.type==='openSourceEditor'){openRoutingSourceEditor(action.sourceId);return;}
  if(action.type==='csvImport'){if(routingTab==='stageboxes')routingTab='inputs';$('sp-routing-csv-file').click();return;}
  const before=snapshot(),transactionHistory=history.slice(),transactionFuture=future.slice(),transactionNextId=nextId,direction=action.direction==='outputs'?'outputs':'inputs',routing=stage.routing;
  try{
    switch(action.type){
      case 'setSourceOutputs':case 'setSourceOutputStereo':case 'setSourceOutputUsed':case 'setSourceOutputAlias':if(setRoutingSourceOutputs(action)===false)return;break;
      case 'editSource':{const o=objects.find(o=>o.id===action.sourceId),name=projectText(action.fields?.label,42).trim();if(o?.locked)throw Error('Die Quelle kann nicht geändert werden.');if(!name)throw Error('Bitte einen Namen eingeben.');if(o)o.label=name;else {const rows=routing.inputs.filter(row=>row.id===action.sourceId||row.sourceKey.startsWith(action.sourceId+':'));if(!rows.length)throw Error('Die Quelle ist nicht mehr verfügbar.');for(const row of rows)row.instrument=name;}break;}
      case 'addPickup':{const o=objects.find(o=>o.id===action.sourceId);if(o?.locked)throw Error('Das Bühnenobjekt ist gesperrt.');const seed=routing.inputs.find(row=>row.id===action.sourceId&&!row.sourceKey),added=StageplotRoutingModel.additionalPickup(routing,action.sourceId,action.kind,routeToken);if(seed){added.instrument=audioBaseName(seed);added.sourceConnector=seed.sourceConnector||seed.connector;added.sourceSignalType=seed.sourceSignalType||seed.signalType;}else if(o&&!routing.inputs.some(row=>row.id!==added.id&&row.sourceKey.startsWith(o.id+':')))added.instrument=o.label||byId[o.type]?.name||'Abnahme';break;}
      case 'removePickup':{const rows=routingPickupRows(action);for(const row of rows){const group=row.stereoGroup,source=routeSourceObject(row),port=Number(row.portIndex);if(source&&!routingSourceOutputEditor(source)&&Number.isInteger(port)&&port>0&&row.sourceKey===source.id+':'+objectOutputPortKey(source,port-1)){const io=objectIo(source);if(io.stereoPairs.some(start=>port===start||port===start+1))source.io={...io,stereoPairs:io.stereoPairs.filter(start=>port!==start&&port!==start+1)};}StageplotRoutingModel.removeInput(routing,row.id);if(group)for(const remaining of routing.inputs.filter(r=>r.stereoGroup===group)){routingEditableRow('inputs',remaining.id);Object.assign(remaining,{stereoGroup:'',mode:'Mono',edited:true});}}break;}
      case 'setPickup':{const rows=routingPickupRows(action);if(!['Mic','DI','Direct','Digital'].includes(action.kind))throw Error('Ungültige Abnahme.');
        for(const row of rows){if(row.pickup!==action.kind){StageplotRoutingModel.clearDevice(routing,[row.id]);row.microphone='';row.phantom=false;}
          Object.assign(row,{pickup:action.kind,connector:audioInputConnector(row,action.kind),signalType:action.kind==='Mic'?'Mic':action.kind==='Digital'?'Digital':'Line',edited:true});
          if(action.microphone!==undefined){row.microphone=projectText(action.microphone,80);const mic=StageplotMics.find(row.microphone);if(mic)row.phantom=!!mic.phantom;}
          if(action.phantom!==undefined)row.phantom=action.phantom===true;
          const box=routingStageboxes('inputs').find(box=>box.id===row.stagebox);if(box&&!routeStageboxCompatible(row,'inputs',box)){row.stagebox='';row.stageboxPort=null;}writeRoutingPickup(row);}break;}
      case 'createDi':routingChooseDiModel(action);break;
      case 'assignDi':{const device=routing.devices.find(device=>device.id===action.deviceId);if(!device)throw Error('DI-Box nicht gefunden.');routingAssertDiEditable(device);const rows=action.autoPair&&device.channels>=2?routingDiSelectionRows(action):routingPickupRows(action),start=Number(action.channel||1);StageplotRoutingModel.assignDevice(routing,rows.map(row=>row.id),device.id,rows.map((_,index)=>start+index));rows.forEach(writeRoutingPickup);break;}
      case 'connectStereoDi':if(connectRoutingStereoDi(action)===false)return;break;
      case 'updateDi':{const device=routing.devices.find(device=>device.id===action.deviceId);routingAssertDiEditable(device);const occupants=routing.inputs.filter(row=>row.diDeviceId===action.deviceId);occupants.forEach(row=>routingEditableRow('inputs',row.id));StageplotRoutingModel.updateDevice(routing,action.deviceId,action.fields);const physical=routingDiObject(device);if(physical&&action.fields?.name)physical.label=action.fields.name.slice(0,42);occupants.forEach(writeRoutingPickup);break;}
      case 'patch':{const rows=routing[direction],members=routingWorkspaceMembers(direction,action.rowIds,action.exactRows===true),box=routingStageboxes(direction).find(box=>box.id===action.boxId);if(!box)throw Error('Stagebox nicht gefunden.');applyAudioPatchPlan(rows,planAudioPatch(rows,members,box,direction,{startPort:Number(action.port)}));break;}
      case 'unpatch':for(const row of routingWorkspaceMembers(direction,action.rowIds,action.exactRows===true))Object.assign(row,{stagebox:'',stageboxPort:null});break;
      case 'editChannel':{const row=routingEditableRow(direction,action.rowId),fields=action.fields||{};
        if(Object.hasOwn(fields,'number')){const number=fields.number===''||fields.number===null?null:Number(fields.number);if(number!==null&&(!Number.isInteger(number)||number<1||number>999))throw Error('Kanalnummer muss zwischen 1 und 999 liegen.');if(number&&routing[direction].some(other=>other.id!==row.id&&other.number===number))throw Error('Kanal '+number+' ist bereits belegt.');row.number=number;}
        for(const key of ['instrument','notes','frequencyBand','connector','microphone'])if(Object.hasOwn(fields,key))row[key]=projectText(fields[key],key==='notes'?240:100);
        if(Object.hasOwn(fields,'connector')){const box=routingStageboxes(direction).find(box=>box.id===row.stagebox);if(box&&!routeStageboxCompatible(row,direction,box)){row.stagebox='';row.stageboxPort=null;}}
        if(Object.hasOwn(fields,'notes')&&Array.isArray(action.rowIds))for(const id of action.rowIds)routingEditableRow(direction,id).notes=projectText(fields.notes,240);
        if(Object.hasOwn(fields,'phantom'))row.phantom=fields.phantom===true;row.edited=true;if(direction==='inputs')writeRoutingPickup(row);break;}
      case 'linkStereo':{const rows=action.rowIds.map(id=>routingEditableRow('inputs',id));if(rows.length!==2||rows[0].id===rows[1].id)throw Error('Für Stereo zwei unterschiedliche Abnahmen auswählen.');if(rows.some(row=>row.stereoGroup))throw Error('Diese Abnahme ist bereits mit einem Stereokanal verbunden.');const pair=routingNativeOutputPair(rows);if(pair){setRoutingSourceOutputs({type:'setSourceOutputStereo',sourceId:pair.source.id,start:pair.start,linked:true});break;}const group='stereo-'+routeToken();rows.forEach((row,i)=>Object.assign(row,{stereoGroup:group,mode:i?'Stereo R':'Stereo L',edited:true}));break;}
      case 'unlinkStereo':{const ids=new Set(action.rowIds),groups=new Set(routing.inputs.filter(row=>ids.has(row.id)).map(row=>row.stereoGroup).filter(Boolean)),rows=routing.inputs.filter(row=>ids.has(row.id)||groups.has(row.stereoGroup));for(const members of [rows,...[...groups].map(group=>rows.filter(row=>row.stereoGroup===group))]){const pair=routingNativeOutputPair(members);if(pair){const io=objectIo(pair.source);pair.source.io={...io,stereoPairs:io.stereoPairs.filter(start=>start!==pair.start)};}}for(const row of rows){routingEditableRow('inputs',row.id);Object.assign(row,{stereoGroup:'',mode:'Mono',edited:true});}break;}
      case 'editMonitor':routingMonitorFields(action.rowIds.map(id=>routingEditableRow('outputs',id)),action.fields||{});break;
      case 'setMonitorFormat':setRoutingMonitorFormat(action.rowIds.map(id=>routingEditableRow('outputs',id)),action.format);break;
      case 'addMonitor':{const kind=['iem','monitor','line'].includes(action.kind)?action.kind:'iem';
        if(kind==='line')routing.outputs.push(normalizeRouteChannel({id:'route-'+routeToken(),manual:true,instrument:'Line Out',outputKind:'line',pickup:'Direct',signalType:'Line',connector:'XLR',edited:true},routing.outputs.length,'outputs'));
        else {const type=kind==='iem'?'rack':'wedge';if(!isObjectUnlocked(type))throw Error('Dieses Gerät gehört zu einem noch gesperrten Paket.');const o=makeObject(type,{x:stage.w/2,y:Math.max(.5,stage.d-1)},'station-'+nextId++);objects.push(o);}routingTab='outputs';break;}
      case 'editStagebox':{const o=objects.find(o=>o.id===action.boxId&&stageboxCapacity[o.type]);if(!o||o.locked)throw Error('Die Stagebox kann nicht geändert werden.');if(Object.hasOwn(action.fields,'name')){const name=projectText(action.fields.name,42).trim();if(!name)throw Error('Bitte einen Namen eingeben.');o.label=name;}if(Object.hasOwn(action.fields,'comboJacks')){if(stageboxCapacity[o.type].comboJacks!==undefined)throw Error('Die Buchsenart ist bei diesem Modell festgelegt.');if(!action.fields.comboJacks&&routing.inputs.some(row=>row.stagebox===o.id&&row.connector==='Klinke'))throw Error('Die Klinkensignale zuerst auf DI umstellen oder abstecken.');o.comboJacks=action.fields.comboJacks===true;}break;}
      case 'addStagebox':{if(!stageboxCapacity[action.objectType])throw Error('Ungültige Stagebox.');if(!isObjectUnlocked(action.objectType))throw Error('Diese Stagebox gehört zu einem noch gesperrten Paket.');const o=makeObject(action.objectType,{x:Math.max(.5,stage.w-1),y:Math.max(.5,stage.d-1)},'station-'+nextId++);objects.push(o);activeStageboxId=o.id;routingTab='stageboxes';break;}
      case 'number':{const used=new Set(routing[direction].map(row=>row.number).filter(Boolean));let number=1;for(const row of routing[direction])if(!row.number){while(used.has(number))number++;if(number>999)throw Error('Keine freie Kanalnummer verfügbar.');row.number=number;used.add(number);}break;}
      default:throw Error('Diese Routing-Aktion ist nicht verfügbar.');
    }
    syncRoutingFromStage(false,false);reconcileCablesWithRouting();keepHistory(before);
  }catch(error){const old=JSON.parse(before);stage=old.stage;objects=old.objects;history=transactionHistory;future=transactionFuture;nextId=transactionNextId;throw error;}
  renderRouting();
}
function exportRoutingWorkspace(direction='all'){
  const headers=['Richtung','Kanal','Signal','Format','Abnahme','DI-Eingang','48V','Stagebox','Buchse','Gerät','Empfänger','Übertragung','Frequenz','Notizen'];
  const directions=direction==='all'?['inputs','outputs']:[direction==='outputs'?'outputs':'inputs'];
  const boxes=new Map(allRoutingStageboxes().map(box=>[box.id,box.name]));
  const data=directions.flatMap(key=>stage.routing[key].map(row=>{const device=stage.routing.devices?.find(d=>d.id===row.diDeviceId);return [key==='inputs'?'Input':'Output',row.number||'',row.instrument,row.stereoGroup?row.mode:'Mono',device?.name||row.microphone||row.pickup,device?row.diChannel||'':'',row.phantom?'48V':'',boxes.get(row.stagebox)||'',row.stageboxPort||'',row.monitorDeviceName||'',row.monitorReceiverName||row.iemName||'',row.iemTransport==='wireless'?'Funk':row.iemTransport==='cable'?'Kabel':'',routeFrequency(row),row.notes];}));
  const csv='\ufeff'+[headers,...data].map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n';downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),exportModel.safeFilename(stage.title+'-Patch',{extension:'csv'}));say('Patchliste exportiert');
}
