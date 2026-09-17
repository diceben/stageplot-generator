// Embedded in the app closure. All workspace edits use the existing draft, undo and export state.
let routingWorkspaceV2=null;
function routingWorkspaceState(){
  return {tab:routingTab,readonly:sharedReadOnly,saveState:{text:$('sp-header-draft-status').textContent,state:draftState},stage,objects,routing:stage.routing,boxes:allRoutingStageboxes(),catalog:byId,microphones:StageplotMics.catalog,diModels:StageplotRoutingModel.diModels,diStereoSources:Object.fromEntries(objects.map(o=>[o.id,routingDiStereoSource(o)]))};
}
function routingDiStereoSource(o){
  const c=byId[o?.type];if(!c?.instrument||drumModel.isDrums(o.type)||['percussion','orchestra','di'].includes(o.type))return false;
  const io=objectIo(o),defaults=defaultObjectIo(o);
  return ['XLR','Klinke'].includes(io.outputs.connector)&&objectOutputSignal(o,io.outputs.connector)==='Line'&&Math.max(io.outputs.count,defaults.outputs.count)>=2;
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
function routingWorkspaceMembers(direction,ids){
  const rows=stage.routing[direction],selected=(ids||[]).map(id=>routingEditableRow(direction,id)),members=[];
  for(const row of selected)for(const member of audioOrderedGroup(rows,row))if(!members.some(item=>item.id===member.id)){routingEditableRow(direction,member.id);members.push(member);}
  if(!members.length)throw Error('Bitte ein Signal wählen.');return members;
}
function connectRoutingStereoDi(action){
  const selected=routingEditableRow('inputs',action.rowId),source=routeSourceObject(selected);
  if(!routingDiStereoSource(source))throw Error('Diese Quelle hat keine zwei analogen Line-Ausgänge.');
  const device=stage.routing.devices?.find(item=>item.id===action.deviceId);
  if(!device||device.channels<2)throw Error('Für L und R wird eine DI-Box mit zwei Eingängen benötigt.');
  if(device.objectId&&objects.find(o=>o.id===device.objectId)?.locked)throw Error('Die DI-Box ist gesperrt.');
  const keys=[0,1].map(index=>source.id+':'+objectOutputPortKey(source,index)),keySet=new Set(keys);
  if(!keySet.has(selected.sourceKey))throw Error('Bitte einen der beiden Geräteausgänge auswählen.');
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
  if(io.outputs.count>=2&&io.stereoPairs.includes(1)&&pair.every((row,index)=>row&&row.diDeviceId===device.id&&Number(row.diChannel)===index+1&&row.mode==='Stereo '+(index?'R':'L'))&&pair[0].stereoGroup&&pair[0].stereoGroup===pair[1].stereoGroup)return false;
  const originals=new Map(current.map(row=>[row.sourceKey,{...row}]));
  source.io={...io,outputs:{...io.outputs,count:Math.max(2,io.outputs.count)},stereoPairs:[...new Set([1,...io.stereoPairs])].sort((a,b)=>a-b),aliases:{...io.aliases,outputs:Array.from({length:Math.max(2,io.outputs.count)},(_,index)=>io.aliases.outputs[index]||'')}};
  source.outs=ioValueText(source.io.outputs,'outputs');
  stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>!keySet.has(key));
  // Reconciliation owns physical output IDs, including legacy configured-out keys.
  // It replaces stage.routing, so all rows and the device are looked up again below.
  syncRoutingFromStage(false,false);
  const routing=stage.routing,rows=keys.map(key=>routing.inputs.find(row=>row.sourceKey===key));
  if(rows.some(row=>!row))throw Error('Die Geräteausgänge konnten nicht aktiviert werden.');
  const group=pair[0]?.stereoGroup&&pair[0].stereoGroup===pair[1]?.stereoGroup?pair[0].stereoGroup:source.id+':stereo-out-1';
  rows.forEach((row,index)=>{
    const original=originals.get(row.sourceKey),generatedInstrument=row.generatedInstrument;
    if(original)Object.assign(row,original,{generatedInstrument});
    Object.assign(row,{portIndex:index+1,mode:'Stereo '+(index?'R':'L'),stereoGroup:group,edited:true});
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
  if(action.type==='csvImport'){if(routingTab==='stageboxes')routingTab='inputs';$('sp-routing-csv-file').click();return;}
  const before=snapshot(),transactionHistory=history.slice(),transactionFuture=future.slice(),transactionNextId=nextId,direction=action.direction==='outputs'?'outputs':'inputs',routing=stage.routing;
  try{
    switch(action.type){
      case 'editSource':{const o=objects.find(o=>o.id===action.sourceId),name=projectText(action.fields?.label,42).trim();if(o?.locked)throw Error('Die Quelle kann nicht geändert werden.');if(!name)throw Error('Bitte einen Namen eingeben.');if(o)o.label=name;else {const rows=routing.inputs.filter(row=>row.id===action.sourceId||row.sourceKey.startsWith(action.sourceId+':'));if(!rows.length)throw Error('Die Quelle ist nicht mehr verfügbar.');for(const row of rows)row.instrument=name;}break;}
      case 'addPickup':{const o=objects.find(o=>o.id===action.sourceId);if(o?.locked)throw Error('Das Bühnenobjekt ist gesperrt.');const seed=routing.inputs.find(row=>row.id===action.sourceId&&!row.sourceKey),added=StageplotRoutingModel.additionalPickup(routing,action.sourceId,action.kind,routeToken);if(seed){added.instrument=audioBaseName(seed);added.sourceConnector=seed.sourceConnector||seed.connector;added.sourceSignalType=seed.sourceSignalType||seed.signalType;}else if(o&&!routing.inputs.some(row=>row.id!==added.id&&row.sourceKey.startsWith(o.id+':')))added.instrument=o.label||byId[o.type]?.name||'Abnahme';break;}
      case 'removePickup':{const row=routingEditableRow('inputs',action.rowId),group=row.stereoGroup;StageplotRoutingModel.removeInput(routing,action.rowId);if(group)for(const remaining of routing.inputs.filter(r=>r.stereoGroup===group))Object.assign(remaining,{stereoGroup:'',mode:'Mono',edited:true});break;}
      case 'setPickup':{const row=routingEditableRow('inputs',action.rowId);if(!['Mic','DI','Direct','Digital'].includes(action.kind))throw Error('Ungültige Abnahme.');
        if(row.pickup!==action.kind){StageplotRoutingModel.clearDevice(routing,[row.id]);row.microphone='';row.phantom=false;}
        Object.assign(row,{pickup:action.kind,connector:audioInputConnector(row,action.kind),signalType:action.kind==='Mic'?'Mic':action.kind==='Digital'?'Digital':'Line',edited:true});
        if(action.microphone!==undefined){row.microphone=projectText(action.microphone,80);const mic=StageplotMics.find(row.microphone);if(mic)row.phantom=!!mic.phantom;}
        if(action.phantom!==undefined)row.phantom=action.phantom===true;
        const box=routingStageboxes('inputs').find(box=>box.id===row.stagebox);if(box&&!routeStageboxCompatible(row,'inputs',box)){row.stagebox='';row.stageboxPort=null;}writeRoutingPickup(row);break;}
      case 'createDi':{const row=routingEditableRow('inputs',action.rowId),device=StageplotRoutingModel.createDevice(routing,Object.fromEntries(Object.entries({modelId:action.modelId,name:action.name,channels:action.channels,active:action.active,power:action.power||(action.phantom===false?'none':undefined)}).filter(([,value])=>value!==undefined)));StageplotRoutingModel.assignDevice(routing,[row.id],device.id,[1]);writeRoutingPickup(row);break;}
      case 'assignDi':{const row=routingEditableRow('inputs',action.rowId);StageplotRoutingModel.assignDevice(routing,[row.id],action.deviceId,[Number(action.channel)]);writeRoutingPickup(row);break;}
      case 'connectStereoDi':if(connectRoutingStereoDi(action)===false)return;break;
      case 'updateDi':{const occupants=routing.inputs.filter(row=>row.diDeviceId===action.deviceId);occupants.forEach(row=>routingEditableRow('inputs',row.id));StageplotRoutingModel.updateDevice(routing,action.deviceId,action.fields);occupants.forEach(writeRoutingPickup);break;}
      case 'patch':{const rows=routing[direction],members=routingWorkspaceMembers(direction,action.rowIds),box=routingStageboxes(direction).find(box=>box.id===action.boxId);if(!box)throw Error('Stagebox nicht gefunden.');applyAudioPatchPlan(rows,planAudioPatch(rows,members,box,direction,{startPort:Number(action.port)}));break;}
      case 'unpatch':for(const row of routingWorkspaceMembers(direction,action.rowIds))Object.assign(row,{stagebox:'',stageboxPort:null});break;
      case 'editChannel':{const row=routingEditableRow(direction,action.rowId),fields=action.fields||{};
        if(Object.hasOwn(fields,'number')){const number=fields.number===''||fields.number===null?null:Number(fields.number);if(number!==null&&(!Number.isInteger(number)||number<1||number>999))throw Error('Kanalnummer muss zwischen 1 und 999 liegen.');if(number&&routing[direction].some(other=>other.id!==row.id&&other.number===number))throw Error('Kanal '+number+' ist bereits belegt.');row.number=number;}
        for(const key of ['instrument','notes','frequencyBand','connector','microphone'])if(Object.hasOwn(fields,key))row[key]=projectText(fields[key],key==='notes'?240:100);
        if(Object.hasOwn(fields,'connector')){const box=routingStageboxes(direction).find(box=>box.id===row.stagebox);if(box&&!routeStageboxCompatible(row,direction,box)){row.stagebox='';row.stageboxPort=null;}}
        if(Object.hasOwn(fields,'notes')&&Array.isArray(action.rowIds))for(const id of action.rowIds)routingEditableRow(direction,id).notes=projectText(fields.notes,240);
        if(Object.hasOwn(fields,'phantom'))row.phantom=fields.phantom===true;row.edited=true;if(direction==='inputs')writeRoutingPickup(row);break;}
      case 'linkStereo':{const rows=action.rowIds.map(id=>routingEditableRow('inputs',id));if(rows.length!==2||rows[0].id===rows[1].id)throw Error('Für Stereo zwei unterschiedliche Abnahmen auswählen.');if(rows.some(row=>row.stereoGroup))throw Error('Diese Abnahme ist bereits mit einem Stereokanal verbunden.');const group='stereo-'+routeToken();rows.forEach((row,i)=>Object.assign(row,{stereoGroup:group,mode:i?'Stereo R':'Stereo L',edited:true}));break;}
      case 'unlinkStereo':{const ids=new Set(action.rowIds),groups=new Set(routing.inputs.filter(row=>ids.has(row.id)).map(row=>row.stereoGroup).filter(Boolean));for(const row of routing.inputs.filter(row=>ids.has(row.id)||groups.has(row.stereoGroup))){routingEditableRow('inputs',row.id);Object.assign(row,{stereoGroup:'',mode:'Mono',edited:true});}break;}
      case 'editMonitor':routingMonitorFields(action.rowIds.map(id=>routingEditableRow('outputs',id)),action.fields||{});break;
      case 'setMonitorFormat':setRoutingMonitorFormat(action.rowIds.map(id=>routingEditableRow('outputs',id)),action.format);break;
      case 'addMonitor':{const kind=['iem','monitor','line'].includes(action.kind)?action.kind:'iem';
        if(kind==='line')routing.outputs.push(normalizeRouteChannel({id:'route-'+routeToken(),manual:true,instrument:'Line Out',outputKind:'line',pickup:'Direct',signalType:'Line',connector:'XLR',edited:true},routing.outputs.length,'outputs'));
        else {const type=kind==='iem'?'rack':'wedge';if(!isObjectUnlocked(type))throw Error('Dieses Gerät gehört zu einem noch gesperrten Paket.');const o=makeObject(type,{x:stage.w/2,y:Math.max(.5,stage.d-1)},'station-'+nextId++);objects.push(o);}routingTab='outputs';break;}
      case 'editStagebox':{const o=objects.find(o=>o.id===action.boxId&&stageboxCapacity[o.type]);if(!o||o.locked)throw Error('Die Stagebox kann nicht geändert werden.');if(Object.hasOwn(action.fields,'name')){const name=projectText(action.fields.name,42).trim();if(!name)throw Error('Bitte einen Namen eingeben.');o.label=name;}if(Object.hasOwn(action.fields,'comboJacks')){if(!action.fields.comboJacks&&routing.inputs.some(row=>row.stagebox===o.id&&row.connector==='Klinke'))throw Error('Die Klinkensignale zuerst auf DI umstellen oder abstecken.');o.comboJacks=action.fields.comboJacks===true;}break;}
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
