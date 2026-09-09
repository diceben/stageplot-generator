// Embedded inside the editor closure. These helpers operate on the same routing
// records used by stagebox assignment, persistence and printing; physical I/O is only capacity.
// Plan first, then apply: a full stereo pair succeeds or nothing changes.
function audioOrderedGroup(rows,row){return audioGroup(rows,row).slice().sort((a,b)=>(a.mode==='Stereo R')-(b.mode==='Stereo R'));}
function planAudioPatch(rows,members,box,direction,{startPort=null,preserve=false,replace=false}={}){
  if(!box||!members.length)throw Error('Bitte eine Stagebox und ein Signal wählen.');
  if(members.some(row=>row.connector==='Dante'))throw Error('Dante wird über das Netzwerk übergeben, nicht über analoge XLR-Buchsen.');
  const capacity=box.capacity??box[direction],ids=new Set(members.map(row=>row.id));
  if(members.some(row=>routeNeedsDi(row,direction,box)))throw Error('DI-Box nötig: Unter „Abnahme“ DI-Box wählen oder eine Stagebox mit Kombibuchsen verwenden.');
  const occupied=new Map(rows.filter(row=>!ids.has(row.id)&&row.stagebox===box.id&&row.stageboxPort).map(row=>[Number(row.stageboxPort),row]));
  const ports=members.map(row=>preserve&&row.stagebox===box.id&&Number.isInteger(row.stageboxPort)&&row.stageboxPort>0&&row.stageboxPort<=capacity?row.stageboxPort:null),displaced=new Set();
  if(startPort!==null){if(!Number.isInteger(startPort)||startPort<1||startPort+members.length-1>capacity)throw Error(members.length>1?'Für Stereo werden zwei benachbarte freie Buchsen benötigt.':'Diese Buchse ist nicht verfügbar.');for(let i=0;i<ports.length;i++)ports[i]=startPort+i;}
  const used=new Set();
  for(const port of ports.filter(Boolean)){
    if(used.has(port))throw Error('Eine Buchse kann nur einmal belegt werden.');
    const occupant=occupied.get(port);if(occupant){if(!replace)throw Error(box.name+' · '+(direction==='inputs'?'IN ':'OUT ')+port+' ist bereits belegt.');for(const row of audioGroup(rows,occupant))displaced.add(row.id);}
    used.add(port);
  }
  for(const [port,row] of occupied)if(!displaced.has(row.id))used.add(port);
  const free=port=>port>=1&&port<=capacity&&!used.has(port);
  if(ports.length===2&&ports.every(port=>port===null)){
    let first=1;while(first<capacity&&(!free(first)||!free(first+1)))first++;
    if(first>=capacity)throw Error('Kein freies benachbartes Buchsenpaar für Stereo. Bestehende Zuordnungen bleiben erhalten.');ports[0]=first;ports[1]=first+1;
  }else for(let i=0;i<ports.length;i++)if(ports[i]===null){
    const neighbor=ports.length===2&&ports[1-i]?ports[1-i]+(i===0?-1:1):0;let port=free(neighbor)?neighbor:1;while(port<=capacity&&!free(port))port++;
    if(port>capacity)throw Error('Nicht genügend freie Buchsen. Bestehende Zuordnungen bleiben erhalten.');ports[i]=port;used.add(port);
  }
  return {assignments:members.map((row,i)=>({id:row.id,stagebox:box.id,stageboxPort:ports[i]})),displaced:[...displaced]};
}
function applyAudioPatchPlan(rows,plan){
  const changed=new Map(plan.assignments.map(item=>[item.id,item]));for(const row of rows){if(plan.displaced.includes(row.id)){row.stagebox='';row.stageboxPort=null;}const patch=changed.get(row.id);if(patch){row.stagebox=patch.stagebox;row.stageboxPort=patch.stageboxPort;}}
}
function audioPatchStatus(row,direction){
  if(row.connector==='Dante'){const source=routeSourceObject(row);return row.stagebox?'review':source?.playback?.target?'patched':'unpatched';}
  if(!row.stagebox||!row.stageboxPort)return 'unpatched';
  const box=routingStageboxes(direction).find(item=>item.id===row.stagebox);
  return !box||row.stageboxPort>box.capacity||routeNeedsDi(row,direction,box)?'review':'patched';
}
function audioSearchText(row,direction){return [row.instrument,row.generatedInstrument,row.number,row.microphone,row.notes,routeFrequency(row),stageboxRouteLocation(row,direction),row.pickup].filter(Boolean).join(' ').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function audioVisibleRows(rows,direction,query='',filter='all'){
  const words=query.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().split(/\s+/).filter(Boolean),matches=new Set();
  for(const row of rows){const status=audioPatchStatus(row,direction),match=filter==='all'||filter==='unnumbered'&&!row.number||filter==='unpatched'&&status!=='patched';if(match&&words.every(word=>audioSearchText(row,direction).includes(word)))for(const member of audioGroup(rows,row))matches.add(member.id);}
  return rows.filter(row=>matches.has(row.id));
}
function refreshAudioSurface(){
  if(view==='editor')renderEditor();else if(view==='routing')renderRouting();
  if($('sp-stagebox-io-dialog').open)renderStageboxIoDialog();
}

let audioQuery='',audioFilter='all',stageboxSourceOpen=false,stageboxPatchNext=false;
function renderAudioFind(){
  const panel=$('sp-audio-find');panel.hidden=routingTab==='stageboxes';
  $('sp-audio-undo').disabled=!history.length;$('sp-audio-redo').disabled=!future.length;
  if(panel.hidden)return;const rows=stage.routing[routingTab],visible=audioVisibleRows(rows,routingTab,audioQuery,audioFilter),ids=new Set(visible.map(row=>row.id));
  $('sp-routing-rows').querySelectorAll('[data-route-row]').forEach(node=>node.hidden=!ids.has(node.dataset.routeRow));
  for(const button of panel.querySelectorAll('[data-audio-filter]'))button.setAttribute('aria-pressed',String(button.dataset.audioFilter===audioFilter));
  $('sp-audio-filter-number').textContent='Ohne Nummer · '+rows.filter(row=>!row.number).length;
  $('sp-audio-filter-patch').textContent='Ohne Zuordnung · '+rows.filter(row=>audioPatchStatus(row,routingTab)!=='patched').length;
  $('sp-routing-empty').hidden=visible.length>0;$('sp-routing-empty').querySelector('strong').textContent=rows.length?'Keine passenden Signale':'Noch keine Signale';
  $('sp-routing-empty').querySelector('span').textContent=rows.length?'Suche oder Filter anpassen.':'Ein Instrument auf der Bühne platzieren oder mit „+ Signal“ selbst anlegen.';
  $('sp-audio-search-clear').hidden=!audioQuery&&audioFilter==='all';
  const direction=routingTab==='inputs'?'Inputs: von der Bühne zum Mischpult.':'Outputs: vom Mischpult zu Monitoren, IEM oder anderen Geräten.';
  $('sp-routing-status').textContent=direction+' '+visible.length+' von '+rows.length+' Kanälen · CH = Mischpultkanal, IN/OUT = Stagebox-Buchse.';
}
function audioSignalDescription(row,direction){
  const kind=direction==='inputs'?({Mic:'Mikrofon',DI:'DI-Box',Direct:'Direkt / Line',Digital:'Digital'}[row.pickup]||'Signal'):({monitor:'Monitor',iem:'IEM',line:'Line'}[audioKind(row)]);
  return [row.stereoGroup?'Stereo L/R':'Mono',kind,row.connector].filter(Boolean).join(' · ');
}
function audioInputConnector(row,pickup){
  if(['DI','Mic'].includes(pickup))return 'XLR';if(pickup==='Digital'){const source=routeSourceObject(row),connector=source?objectIo(source).outputs.connector:row.connector;return ['Dante','MADI','USB'].includes(connector)?connector:'Digital';}
  const source=routeSourceObject(row);if(source?.type==='percussion')return generatedInputSpecs().find(spec=>spec.sourceKey===row.sourceKey)?.connector||row.connector||'XLR';return source?objectIo(source).outputs.connector:row.connector||'XLR';
}
function audioPatchButton(row,direction){
  const source=routeSourceObject(row);if(row.connector==='Dante'&&source?.type==='laptop')return '<button class="sp-audio-patch-button" type="button" data-playback-open="'+esc(source.id)+'" aria-label="'+esc(row.instrument+' · Dante-Übergabe bearbeiten')+'">'+esc(playbackNetworkLocation(row))+'</button>';
  const status=audioPatchStatus(row,direction),label=status==='unpatched'?'Stagebox verbinden':stageboxRouteLocation(row,direction)+(status==='review'?' · prüfen':'');
  return '<button class="sp-audio-patch-button" type="button" data-audio-patch="'+row.id+'" data-patch-status="'+status+'" aria-label="'+esc(row.instrument+' · '+label)+'">'+esc(label)+'</button>';
}
function showAudioEditorPanel(name,{focus=false}={}){
  if(!['signal','chain','patch','more'].includes(name))name='signal';
  for(const button of $('sp-audio-editor-tabs').querySelectorAll('[data-audio-tab]')){
    const active=button.dataset.audioTab===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    $('sp-audio-panel-'+button.dataset.audioTab).hidden=!active;if(active&&focus)button.focus();
  }
  $('sp-audio-editor-body').scrollTop=0;
}
function revealAudioEditorField(field){
  const panel=field.closest('[data-audio-panel]');if(panel)showAudioEditorPanel(panel.dataset.audioPanel);
  const details=field.closest('details');if(details)details.open=true;
}
function audioEditorRightBox(){
  const box=$('sp-channel-stagebox').value;
  if(editingRoute?.patchRightBox!==undefined)return editingRoute.patchRightBox;
  return editingRoute?.partner&&box===editingRoute.stagebox&&$('sp-channel-direction').value===editingRoute.direction?editingRoute.partner.stagebox:box;
}
function audioEditorSummary(draft,boxes){
  const input=draft.direction==='inputs',prefix=input?'CH':'Mix / Output',socket=input?'IN':'OUT';
  const channel=value=>String(value||'').trim()==='#'?'automatisch':String(value||'').trim()||'offen';
  const location=(boxId,ports)=>boxId?(boxes.find(box=>box.id===boxId)?.name||'Stagebox')+' · '+socket+' '+ports.map(port=>port||'automatisch').join(' / '):'Keine Stagebox';
  const connect=(patch,numbers)=>input?patch+' → '+prefix+' '+numbers.map(channel).join(' / '):prefix+' '+numbers.map(channel).join(' / ')+' → '+patch;
  const split=draft.stereo&&draft.boxId!==draft.rightBoxId;
  return {name:draft.name.trim()||'Neues Signal',kind:(input?'Input':'Output')+' · '+(draft.stereo?'Stereo L/R':'Mono'),connections:split?[
    'L: '+connect(location(draft.boxId,[draft.port]),[draft.number]),'R: '+connect(location(draft.rightBoxId,[draft.rightPort]),[draft.rightNumber])
  ]:[connect(location(draft.boxId,[draft.port,...(draft.stereo?[draft.rightPort]:[])]),[draft.number,...(draft.stereo?[draft.rightNumber]:[])])]};
}
function renderAudioEditorContext(){
  if(!editingRoute)return;
  const direction=$('sp-channel-direction').value,stereo=$('sp-audio-format').value==='stereo',summary=audioEditorSummary({name:$('sp-channel-instrument').value,direction,stereo,boxId:$('sp-channel-stagebox').value,rightBoxId:audioEditorRightBox(),port:$('sp-audio-port').value,rightPort:$('sp-audio-right-port').value,number:$('sp-channel-number').value,rightNumber:$('sp-audio-right-number').value},routingStageboxes(direction));
  const numbers=[$('sp-channel-number').value,...(stereo?[$('sp-audio-right-number').value]:[])].map(number=>number==='#'?'Auto':number||'—');
  if(direction==='inputs'&&audioInputConnector(editingRoute,$('sp-audio-pickup').value)==='Dante')summary.connections=[playbackNetworkLocation(editingRoute)+' → CH '+numbers.join(' / ')];
  $('sp-channel-title').textContent=summary.name;
  $('sp-audio-context').innerHTML='<div class="sp-audio-channel-badge"><small>'+(direction==='inputs'?'INPUT · CH':'OUTPUT · MIX')+'</small><strong>'+esc(numbers.join(' / '))+'</strong></div><div class="sp-audio-context-copy"><strong>'+esc(summary.kind)+'</strong>'+summary.connections.map(text=>'<span>'+esc(text)+'</span>').join('')+'</div>';
  renderAudioChainPreview();
}
function audioPortCandidates(box,rows,excluded,stereo,selection){
  return Array.from({length:Math.max(0,box.capacity-(stereo?1:0))},(_,i)=>{
    const port=i+1,occupants=rows.filter(row=>!excluded.has(row.id)&&row.stagebox===box.id&&(row.stageboxPort===port||stereo&&row.stageboxPort===port+1));
    return {port,occupants,selected:Number(selection.port)===port&&(!stereo||selection.rightBoxId===box.id&&Number(selection.rightPort)===port+1)};
  });
}
function renderAudioPortChoices(){
  const host=$('sp-audio-port-choices'),boxId=$('sp-channel-stagebox').value,direction=$('sp-channel-direction').value,box=routingStageboxes(direction).find(item=>item.id===boxId);
  $('sp-audio-di-help').hidden=direction!=='inputs'||audioInputConnector(editingRoute,$('sp-audio-pickup').value)!=='Klinke'||!routingStageboxes(direction).some(item=>!item.comboJacks);
  host.hidden=false;$('sp-audio-manual-ports').hidden=true;
  if(direction==='inputs'&&audioInputConnector(editingRoute,$('sp-audio-pickup').value)==='Dante'){$('sp-audio-di-help').hidden=true;host.innerHTML='<div class="sp-audio-patch-summary"><div><h3>Dante · Netzwerkübergabe</h3><p>'+esc(playbackNetworkLocation(editingRoute))+'</p><p class="sp-muted">Alle Playback-Kanäle über 1 × CAT5e / CAT6 (RJ45). Ziel und Ausgangsnamen im Playback-Setup festlegen.</p></div></div>';return;}
  host.innerHTML='<div class="sp-audio-patch-summary"><div><h3>'+esc(box?.name||'Mit einer Stagebox verbinden')+'</h3><p class="sp-muted">'+(box?'Rosa markiert: die Buchsen dieses Signals.':'Stagebox auswählen und direkt auf eine freie Buchse klicken.')+'</p></div><button class="sp-button" type="button" data-audio-open-connect>'+(box?'Verbindung ändern':'Stagebox verbinden')+'</button></div>'+audioCurrentSocketsMarkup(direction);
}

function audioMembers(row){return [row,...(row.linkedSources||[])];}
function audioGroup(rows,row){return row?.stereoGroup?rows.filter(item=>item.stereoGroup===row.stereoGroup):row?[row]:[];}
function audioBaseName(row){return String(row.instrument||'').replace(/(?:\s*·)?\s+[LR]$/,'').trim();}
function audioKind(row){const source=routeSourceObject(row);return row.outputKind||(row.iemMode||row.iemTransport||['rack','iem-earphones'].includes(source?.type)?'iem':source?.type==='wedge'?'monitor':'line');}
function audioDefaultUsed(spec,direction){
  const o=routeSourceObject(spec);if(!o)return false;
  if(direction==='outputs')return ['wedge','rack','iem-earphones'].includes(o.type);
  const c=byId[o.type];if(c.ioDefaults&&Number(c.ioDefaults.inputs)>0)return false;
  return c.category==='keys'?spec.portIndex<=2:true;
}
function selectAudioSpecs(specs,direction){
  const rows=stage.routing[direction],existing=new Set(rows.map(row=>row.sourceKey)),linked=new Set(['inputs','outputs'].flatMap(key=>stage.routing[key].flatMap(row=>(row.linkedSources||[]).map(member=>member.sourceKey)))),disabled=new Set(stage.routing.disabledSources||[]);
  return specs.filter(spec=>!linked.has(spec.sourceKey)&&!disabled.has(spec.sourceKey)&&(existing.has(spec.sourceKey)||audioDefaultUsed(spec,direction)));
}
function audioObjectRows(o){return ['inputs','outputs'].flatMap(direction=>(stage?.routing?.[direction]||[]).filter(row=>audioMembers(row).some(member=>member.sourceKey.startsWith(o.id+':'))).map(row=>({row,direction})));}
function audioObjectChannels(o){
  const rows=audioObjectRows(o);return ['inputs','outputs'].map(direction=>{const list=rows.filter(item=>item.direction===direction).map(item=>item.row.number||'—');return list.length?(direction==='inputs'?'CH ':'OUT ')+[...new Set(list)].join(' / '):'';}).filter(Boolean).join(' · ');
}
function renderObjectAudio(o){
  const host=$('sp-audio-object'),rows=audioObjectRows(o),all=[...generatedInputSpecs().map(row=>({...row,direction:'inputs'})),...generatedOutputSpecs().map(row=>({...row,direction:'outputs'}))].filter(row=>row.sourceKey.startsWith(o.id+':'));
  host.hidden=!all.length&&!rows.length&&o.type!=='laptop';if(host.hidden)return;
  const used=new Set(['inputs','outputs'].flatMap(direction=>stage.routing[direction].flatMap(row=>audioMembers(row).map(member=>member.sourceKey)))),available=all.filter(row=>!used.has(row.sourceKey)),seen=new Set();
  host.innerHTML=(o.type==='laptop'?playbackShortcut(o):'')+'<strong>Audio · verwendete Signale</strong><p class="sp-muted">'+(rows.length?'Dieselben Kanäle stehen in Liste, Verkabelung und PDF.':'Noch kein Signal verwendet.')+'</p>'+rows.map(({row,direction})=>{const group=row.stereoGroup||row.id;if(seen.has(group))return '';seen.add(group);const partners=audioGroup(stage.routing[direction],row);return '<button type="button" class="sp-audio-object-row" data-audio-edit="'+row.id+'" data-audio-direction="'+direction+'"'+(o.locked?' disabled':'')+'><strong>'+esc(partners.length>1?audioBaseName(row):row.instrument)+'</strong><small>'+(direction==='inputs'?'CH ':'OUT ')+partners.map(item=>item.number||'—').join(' / ')+' · '+(partners.length>1?'Stereo L/R':'Mono')+' · bearbeiten</small></button>';}).join('')+(available.length?'<details><summary>+ Weitere Signale verwenden</summary><div class="sp-audio-available">'+available.map(row=>'<button class="sp-button" type="button" data-audio-use="'+esc(row.sourceKey)+'" data-audio-direction="'+row.direction+'"'+(o.locked?' disabled':'')+'>'+esc(row.instrument)+' <small>'+(row.direction==='inputs'?'→ Mischpult':'vom Mischpult')+'</small></button>').join('')+'</div></details>':'')+'<button type="button" class="sp-button" data-audio-overview>Audio &amp; Verkabelung öffnen</button>';
}
function audioRoutingRows(rows,direction){
  return rows.map(row=>{const stereo=Boolean(row.stereoGroup),patch=stageboxRouteLocation(row,direction),kind=direction==='inputs'?({Mic:'Mikrofon',DI:'DI-Box',Direct:'Direkt / Line',Digital:'Digital'}[row.pickup]||row.signalType):({monitor:'Monitor',iem:'IEM',line:'Line'}[audioKind(row)]),members=(row.linkedSources||[]).length;
    return '<tr tabindex="0" data-route-row="'+row.id+'" data-audio-stereo="'+stereo+'"><td><button class="sp-route-drag-handle" type="button" draggable="true" data-route-drag="'+row.id+'" aria-label="'+esc(row.instrument)+' verschieben" title="'+(stereo?'Stereopaar':'Signal')+' verschieben">⠿</button></td><td><button class="sp-route-number" type="button" data-route-number="'+row.id+'" aria-label="Kanalnummer bearbeiten">'+(row.number||'—')+'</button></td><td><strong>'+esc(row.instrument||'Unbenannt')+'</strong>'+(routeSourceObject(row)?.type==='laptop'?'<small>'+esc(playbackSourceHint(row))+'</small>':'')+(members?'<small>'+members+' weitere Bühnenobjekte im Signalweg</small>':'')+(routeFrequency(row)?'<small>Funk: '+esc(routeFrequency(row))+'</small>':'')+'</td><td>'+esc(stereo?row.mode:'Mono')+'</td><td>'+kind+'</td><td>'+esc(row.microphone||'—')+'</td><td>'+(direction==='inputs'&&row.connector!=='Dante'?'<button class="sp-routing-phantom" type="button" data-route-phantom="'+row.id+'" aria-pressed="'+row.phantom+'">48V</button>':'—')+'</td><td>'+audioPatchButton(row,direction)+'</td><td>'+esc(row.notes||'—')+'</td><td><button class="sp-button" type="button" data-route-edit="'+row.id+'">Bearbeiten</button></td></tr>';
  }).join('');
}
function moveAudioGroup(rows,sourceId,targetId,placement='before'){
  const source=rows.find(row=>row.id===sourceId),target=rows.find(row=>row.id===targetId);if(!source||!target)return rows.slice();
  const moving=audioGroup(rows,source),targets=audioGroup(rows,target),ids=new Set(moving.map(row=>row.id));if(ids.has(targetId))return rows.slice();
  const result=rows.filter(row=>!ids.has(row.id)),index=placement==='after'?Math.max(...targets.map(row=>result.indexOf(row)))+1:Math.min(...targets.map(row=>result.indexOf(row)));result.splice(index,0,...moving);return result;
}
function audioCanStereo(row,direction){
  if(row.stereoGroup||!row.sourceKey)return true;
  const o=routeSourceObject(row);if(!o)return true;if(direction==='outputs')return audioKind(row)==='iem';
  return objectIo(o).outputs.count>=(row.portIndex||1)+1;
}
function openAudioChannel(direction,id=null){
  if(sharedReadOnly)return;direction=direction==='outputs'?'outputs':'inputs';syncRoutingFromStage(false,false);
  const rows=stage.routing[direction],clicked=rows.find(row=>row.id===id),group=audioGroup(rows,clicked),row=group.find(item=>item.mode==='Stereo L')||clicked||normalizeRouteChannel({id:'route-'+routeToken(),manual:true,instrument:'Neues Signal',signalType:direction==='inputs'?'Mic':'Line',pickup:direction==='inputs'?'Mic':'Direct'},rows.length,direction),partner=group.find(item=>item.id!==row.id);
  editingRoute={...clone(row),direction,index:rows.indexOf(row),isNew:!id,partner:partner?clone(partner):null};
  audioPickupModels={[row.pickup]:{model:row.microphone,phantom:row.phantom}};audioLastPickup=row.pickup;
  $('sp-audio-order').hidden=!id;const orderGroup=new Set(group.map(item=>item.id)),first=rows.findIndex(item=>orderGroup.has(item.id)),last=rows.reduce((index,item,i)=>orderGroup.has(item.id)?i:index,-1);$('sp-audio-order').querySelector('[data-audio-move="up"]').disabled=first<=0;$('sp-audio-order').querySelector('[data-audio-move="down"]').disabled=last<0||last>=rows.length-1;
  $('sp-channel-title').textContent=id?'Signal bearbeiten':'Signal hinzufügen';$('sp-channel-number').setCustomValidity('');$('sp-audio-error').textContent='';
  $('sp-channel-number').value=id?(row.number||''):'#';$('sp-audio-right-number').value=partner?(partner.number||''):'#';
  setChannelPillValue('sp-channel-direction',direction);$('sp-channel-instrument').value=partner?audioBaseName(row):row.instrument;
  setChannelPillValue('sp-audio-format',partner?'stereo':'mono');setChannelPillValue('sp-audio-pickup',row.pickup);setChannelPillValue('sp-audio-kind',audioKind(row));setChannelPillValue('sp-audio-transport',row.iemTransport||'wireless');
  $('sp-channel-microphone').value=row.microphone;$('sp-channel-phantom').checked=row.phantom;$('sp-audio-wireless').checked=Boolean(routeFrequency(row));audioMicPickerReset=true;audioCustomModel=false;$('sp-audio-custom-model').value=row.microphone;$('sp-channel-notes').value=row.notes;$('sp-audio-frequency').value=routeFrequency(row);
  renderChannelStageboxPills(direction,row.stagebox);$('sp-audio-port').value=row.stageboxPort||'';$('sp-audio-right-port').value=partner?.stageboxPort||'';
  $('sp-audio-right-patch').textContent=partner?.stagebox&&partner.stagebox!==row.stagebox?'Rechts: '+stageboxRouteLocation(partner,direction)+'. Bleibt erhalten, solange die Stagebox nicht geändert wird.':'';
  const canMerge=direction==='inputs'&&!partner&&row.connector!=='Dante',options=canMerge?rows.filter(item=>item.connector!=='Dante'&&item.id!==row.id&&!item.stereoGroup&&(!item.sourceKey||!row.sourceKey.startsWith(item.sourceKey.split(':')[0]+':'))):[];
  $('sp-audio-chain').hidden=!canMerge&&!(row.linkedSources||[]).length;
  $('sp-audio-chain-current').innerHTML=(row.linkedSources||[]).map(member=>'<p>'+esc(member.instrument)+' · ursprünglicher CH '+(member.number||'—')+' · '+esc(stageboxRouteLocation(member,direction))+'</p>').join('')+((row.linkedSources||[]).length?'<button class="sp-button" type="button" id="sp-audio-unmerge">Ursprüngliche Kanäle wiederherstellen</button>':'');
  $('sp-audio-chain-options').innerHTML=options.length?options.map(item=>'<button type="button" class="sp-audio-merge-option" data-audio-merge="'+item.id+'" aria-pressed="false">'+audioObjectPicture(item)+'<span><strong>'+esc(item.instrument)+'</strong><small>CH '+(item.number||'—')+' · '+esc(stageboxRouteLocation(item,direction))+'</small><small data-merge-hint>Zum gemeinsamen Kanal hinzufügen</small></span><b aria-hidden="true">+</b></button>').join(''):'<p class="sp-muted">Weitere Mono-Signale auf der Bühne können hier demselben Signalweg zugeordnet werden.</p>';
  $('sp-channel-delete').hidden=!id;audioFormChanged();showAudioEditorPanel('signal');$('sp-channel-dialog').showModal();
}
function audioFormChanged(changed=''){
  if(!editingRoute)return;
  if(changed==='sp-audio-pickup'){const pickup=$('sp-audio-pickup').value;audioPickupModels[audioLastPickup]={model:$('sp-channel-microphone').value,phantom:$('sp-channel-phantom').checked};const cached=audioPickupModels[pickup]||{model:'',phantom:false};$('sp-channel-microphone').value=cached.model;$('sp-audio-custom-model').value=cached.model;$('sp-channel-phantom').checked=cached.phantom;audioLastPickup=pickup;audioCustomModel=pickup==='DI';}
  const source=routeSourceObject(editingRoute),dante=source?.type==='laptop'&&objectIo(source).outputs.connector==='Dante';
  if(dante)$('sp-audio-pickup').value='Digital';
  root.querySelectorAll('[data-channel-pill-group="sp-audio-pickup"] [data-channel-value]').forEach(button=>{button.disabled=dante&&button.dataset.channelValue!=='Digital';button.setAttribute('aria-pressed',String(button.dataset.channelValue===$('sp-audio-pickup').value));});
  const direction=$('sp-channel-direction').value,stereo=$('sp-audio-format').value==='stereo',iem=direction==='outputs'&&$('sp-audio-kind').value==='iem';
  $('sp-channel-dialog').dataset.audioDirection=direction;
  $('sp-audio-number-label').textContent=direction==='inputs'?(stereo?'Links · CH':'Mischpult · CH'):(stereo?'Links · Mix / Output':'Mix / Output');$('sp-audio-right-number-label').textContent=direction==='inputs'?'Rechts · CH':'Rechts · Mix / Output';$('sp-audio-pickup-field').hidden=direction!=='inputs';$('sp-audio-kind-field').hidden=direction!=='outputs';$('sp-audio-iem-fields').hidden=!iem;
  $('sp-audio-wireless-field').hidden=direction!=='inputs'||dante;$('sp-audio-frequency-field').hidden=direction==='inputs'?!$('sp-audio-wireless').checked:!iem||$('sp-audio-transport').value==='cable';$('sp-audio-mic-choices').hidden=$('sp-audio-pickup').value!=='Mic';
  $('sp-audio-right-number-field').hidden=!stereo;$('sp-audio-right-number').disabled=!stereo;$('sp-audio-right-port-field').hidden=!stereo;
  $('sp-channel-form').querySelector('.sp-channel-detail-row').hidden=direction!=='inputs'||dante;
  root.querySelector('[data-channel-pill-group="sp-audio-format"] [data-channel-value="stereo"]').disabled=!audioCanStereo(editingRoute,direction);
  if(changed==='sp-channel-direction'||changed==='sp-audio-pickup'){
    const current=$('sp-channel-stagebox').value,pickup=$('sp-audio-pickup').value,priorConnector=editingRoute.connector;
    editingRoute.connector=direction==='inputs'?audioInputConnector(editingRoute,pickup):priorConnector;
    renderChannelStageboxPills(direction,changed==='sp-channel-direction'?'':current);editingRoute.connector=priorConnector;
  }
  if(changed==='sp-channel-stagebox'||changed==='sp-channel-direction'){delete editingRoute.patchRightBox;$('sp-audio-port').value='';$('sp-audio-right-port').value='';$('sp-audio-right-patch').textContent='';}
  $('sp-audio-port').disabled=!$('sp-channel-stagebox').value;$('sp-audio-right-port').disabled=!stereo||!audioEditorRightBox();
  $('sp-audio-error').textContent='';renderAudioMicPicker();renderAudioPortChoices();renderAudioEditorContext();
}
function planAudioNumbers(rows,excluded,tokens){
  const used=new Set(rows.filter(row=>!excluded.has(row.id)).map(row=>row.number).filter(Boolean)),result=tokens.map(token=>token==='#'?null:token?Number(token):null);
  for(const number of result)if(number!==null){if(!Number.isInteger(number)||number<1||number>999)throw Error('Kanalnummer muss zwischen 1 und 999 liegen.');if(used.has(number))throw Error('CH '+number+' ist bereits vergeben.');used.add(number);}
  if(tokens.length===2&&tokens.every(token=>token==='#')){let n=1;while(n<999&&(used.has(n)||used.has(n+1)))n++;if(n===999)throw Error('Kein freies benachbartes Kanalpaar.');return [n,n+1];}
  for(let i=0;i<tokens.length;i++)if(tokens[i]==='#'){let n=i>0&&result[i-1]&&result[i-1]<999&&!used.has(result[i-1]+1)?result[i-1]+1:1;while(used.has(n)&&n<=999)n++;if(n>999)throw Error('Keine freie Kanalnummer.');result[i]=n;used.add(n);}
  return result;
}
function planAudioPorts(boxes,rows,excluded,requests){
  const used=new Map(boxes.map(box=>[box.id,new Set(rows.filter(row=>!excluded.has(row.id)&&row.stagebox===box.id).map(row=>row.stageboxPort).filter(Boolean))])),result=requests.map(request=>request.boxId&&request.port?Number(request.port):null);
  const reserve=(request,port)=>{const box=boxes.find(box=>box.id===request.boxId);if(!box)throw Error('Die Stagebox ist nicht mehr verfügbar.');if(!Number.isInteger(port)||port<1||port>box.capacity||used.get(box.id).has(port))throw Error(box.name+' · Port '+port+' ist nicht frei.');used.get(box.id).add(port);};
  if(requests.length===2&&requests[0].boxId&&requests[0].boxId===requests[1].boxId&&result.every(port=>port===null)){
    const box=boxes.find(box=>box.id===requests[0].boxId);if(!box)throw Error('Die Stagebox ist nicht mehr verfügbar.');let port=1;
    while(port<box.capacity&&(used.get(box.id).has(port)||used.get(box.id).has(port+1)))port++;
    if(port>=box.capacity)throw Error('Kein freies benachbartes Buchsenpaar. Bitte zwei Buchsen gezielt wählen.');return [port,port+1];
  }
  requests.forEach((request,i)=>{if(result[i]!==null)reserve(request,result[i]);});
  requests.forEach((request,i)=>{if(!request.boxId||result[i]!==null)return;const box=boxes.find(box=>box.id===request.boxId);if(!box)throw Error('Die Stagebox ist nicht mehr verfügbar.');let port=1;while(used.get(box.id).has(port)&&port<=box.capacity)port++;reserve(request,port);result[i]=port;});return result;
}
function saveAudioChannel(){
  if(!editingRoute)return;
  const invalid=[...$('sp-channel-form').elements].find(field=>field.willValidate&&!field.validity.valid);
  if(invalid){revealAudioEditorField(invalid);invalid.reportValidity();return;}
  const direction=$('sp-channel-direction').value==='outputs'?'outputs':'inputs',stereo=$('sp-audio-format').value==='stereo',before=snapshot(),original=editingRoute,rows=stage.routing[direction],oldPartner=original.partner,excluded=new Set([original.id,oldPartner?.id]),name=$('sp-channel-instrument').value.trim(),pickup=$('sp-audio-pickup').value,kind=$('sp-audio-kind').value,error=(message,panel='signal',fieldId='sp-channel-instrument')=>{showAudioEditorPanel(panel);const field=$(fieldId);revealAudioEditorField(field);field.focus();$('sp-audio-error').textContent=message;},nameChanged=name!==(oldPartner?audioBaseName(original):original.instrument),box=$('sp-channel-stagebox').value;
  if(!name)return error('Bitte einen Signalnamen eingeben.');
  let next,partner,errorPanel='patch',errorField='sp-channel-number';
  try{
    const rightBox=audioEditorRightBox(),numbers=planAudioNumbers(rows,excluded,[$('sp-channel-number').value.trim(),...(stereo?[$('sp-audio-right-number').value.trim()]:[])]);
    errorField='sp-audio-port';const ports=planAudioPorts(routingStageboxes(direction),rows,excluded,[{boxId:box,port:$('sp-audio-port').value},...(stereo?[{boxId:rightBox,port:$('sp-audio-right-port').value}]:[])]);
    const connector=direction==='inputs'?audioInputConnector(original,pickup):original.connector||'XLR',signalType=direction==='outputs'?'Line':pickup==='Mic'?'Mic':pickup==='DI'?'Line':pickup==='Digital'?'Digital':'Line',iem=direction==='outputs'&&kind==='iem';
    if(connector==='Dante'&&(box||rightBox))throw Error('Dante wird über das Netzwerk übergeben. Die analoge Stagebox-Zuordnung zuerst lösen.');
    const shared={edited:true,pickup,outputKind:direction==='outputs'?kind:'',connector,signalType,microphone:direction==='inputs'&&connector!=='Dante'?$('sp-channel-microphone').value:'',phantom:direction==='inputs'&&connector!=='Dante'&&$('sp-channel-phantom').checked,frequencyBand:direction==='inputs'?($('sp-audio-wireless').checked?$('sp-audio-frequency').value:''):iem&&$('sp-audio-transport').value==='wireless'?$('sp-audio-frequency').value:'',iemName:iem?name:'',iemMode:iem?(stereo?'stereo':'mono'):'',iemTransport:iem?$('sp-audio-transport').value:'',iemGroup:iem?(original.iemGroup||original.id):''};
    next=normalizeRouteChannel({...original,...shared,manual:original.manual||original.isNew||direction!==original.direction,number:numbers[0],instrument:stereo?(!nameChanged&&oldPartner?original.instrument:name+' · L'):name,mode:stereo?'Stereo L':'Mono',stereoGroup:stereo?(original.stereoGroup||'audio-'+original.id):'',stagebox:box,stageboxPort:ports[0],notes:$('sp-channel-notes').value},0,direction);
    if(stereo){
      let seed=oldPartner;
      if(!seed){const source=routeSourceObject(original),available=(direction==='inputs'?generatedInputSpecs():generatedOutputSpecs()).find(spec=>source&&spec.sourceKey.startsWith(source.id+':')&&spec.portIndex===(original.portIndex||1)+1&&!['inputs','outputs'].some(key=>stage.routing[key].some(row=>audioMembers(row).some(member=>member.sourceKey===spec.sourceKey))));seed=available?{...available,id:'route-'+routeToken(),manual:true}:{id:'route-'+routeToken(),manual:true,sourceKey:source?source.id+':audio-'+routeToken():'',portIndex:(original.portIndex||1)+1};}
      const partnerChanges=oldPartner?Object.fromEntries(Object.entries(shared).filter(([key,value])=>key==='edited'||value!==original[key])):shared;
      partner=normalizeRouteChannel({...seed,...partnerChanges,id:seed.id,number:numbers[1],instrument:!nameChanged&&oldPartner?oldPartner.instrument:name+' · R',mode:'Stereo R',stereoGroup:next.stereoGroup,stagebox:rightBox,stageboxPort:ports[1],notes:!oldPartner||oldPartner.notes===original.notes?next.notes:oldPartner.notes},1,direction);
    }
    errorPanel='signal';errorField='sp-audio-tab-signal';
    for(const row of [next,partner].filter(Boolean)){const target=routingStageboxes(direction).find(box=>box.id===row.stagebox);if(target&&routeNeedsDi(row,direction,target))throw Error('Dieses Klinkensignal braucht eine DI-Box vor der XLR-Stagebox. Unter Abnahme „DI-Box“ wählen.');}
  }catch(e){return error(e.message,errorPanel,errorField);}
  const merges=direction==='inputs'&&!stereo?[...$('sp-audio-chain-options').querySelectorAll('[data-audio-merge][aria-pressed="true"]')].map(input=>stage.routing.inputs.find(row=>row.id===input.dataset.audioMerge)).filter(Boolean):[];
  if(merges.length&&[next,...merges].some(row=>row.connector==='Dante'))return error('Dante-Sendekanäle werden einzeln über das Netzwerk übergeben und können hier nicht mit anderen Quellen zusammengeführt werden.');
  for(const merged of merges){next.linkedSources.push(...audioMembers(clone(merged)).map(row=>({...row,linkedSources:[]})));excluded.add(merged.id);}
  if(!next.sourceKey){const source=next.linkedSources.find(member=>member.sourceKey);if(source){next.sourceKey=source.sourceKey;next.portIndex=source.portIndex;next.adoptedSource=true;}}
  const commit=()=>{
    for(const key of ['inputs','outputs'])stage.routing[key]=stage.routing[key].filter(row=>!excluded.has(row.id));
    if(oldPartner&&!stereo)stage.routing.disabledSources.push(...audioMembers(oldPartner).map(row=>row.sourceKey).filter(Boolean));
    stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>key!==next.sourceKey&&key!==partner?.sourceKey);
    const index=direction===original.direction&&original.index>=0?Math.min(original.index,stage.routing[direction].length):stage.routing[direction].length;stage.routing[direction].splice(index,0,...[next,partner].filter(Boolean));
    const source=routeSourceObject(next);if(source&&nameChanged&&!merges.length&&!next.linkedSources.length){const sourceGroups=new Set(audioObjectRows(source).map(item=>item.row.stereoGroup||item.row.id));if(sourceGroups.size===1)source.label=name.slice(0,42);}if(source&&next.frequencyBand!==routeFrequency(original))source.wireless=next.frequencyBand;
    if(direction==='inputs')for(const row of [next,partner].filter(Boolean))StageplotMics.writeDrumRoute(objects,row,type=>drumModel.isDrums(type),config=>drumModel.normalizeDrums(config));
    reconcileCablesWithRouting();keepHistory(before);$('sp-channel-dialog').close();refreshAudioSurface();say('Signal gespeichert · Bühne, Patch und Druckliste aktualisiert');
  };
  if(oldPartner&&!stereo&&(oldPartner.number||oldPartner.stagebox||oldPartner.notes))return confirmSetupAction('Stereosignal auf Mono ändern?','Der rechte Kanal „'+oldPartner.instrument+'“ mit CH '+(oldPartner.number||'—')+' wird entfernt. Rückgängig stellt das Paar mit seinen Zuordnungen wieder her.','Auf Mono ändern',commit,true);
  commit();
}
function removeAudioChannel(){
  if(!editingRoute)return;const before=snapshot(),rows=stage.routing[editingRoute.direction],group=audioGroup(rows,rows.find(row=>row.id===editingRoute.id)),ids=new Set(group.map(row=>row.id));
  stage.routing.disabledSources.push(...group.flatMap(row=>audioMembers(row).map(member=>member.sourceKey)).filter(Boolean));stage.routing[editingRoute.direction]=rows.filter(row=>!ids.has(row.id));reconcileCablesWithRouting();keepHistory(before);$('sp-channel-dialog').close();renderRouting();say('Signal entfernt · in den Objekt-Eigenschaften wieder auswählbar');
}
function audioPrintTable(direction){
  const rows=stage?.routing?.[direction]||[];if(!rows.length)return '<p class="sp-paper-routing-empty">Keine Signale angelegt.</p>';
  const input=direction==='inputs',heads=input?['CH','Signal / Quelle','Mikrofon / DI','48V','Patch / Übergabe','Notizen']:['OUT','Ziel / Signal','Art / Format','Übertragung / Funk','Patch / Übergabe','Notizen'];
  return '<table class="sp-paper-routing-table sp-audio-print-table" data-audio-direction="'+direction+'"><thead><tr>'+heads.map(head=>'<th>'+head+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>{const playback=routeSourceObject(row)?.type==='laptop'&&row.connector!=='Dante'?playbackSourceHint(row):'',source=esc(row.instrument||'—')+(playback?'<small>'+esc(playback)+'</small>':'')+(routeFrequency(row)&&input?'<small>Funk: '+esc(routeFrequency(row))+'</small>':''),pickup=row.microphone||({Mic:'Mikrofon',DI:'DI-Box',Direct:'Direkt / Line',Digital:'Digital'}[row.pickup]||'—'),kind={monitor:'Monitor',iem:'IEM',line:'Line'}[audioKind(row)],format=row.stereoGroup?row.mode:'Mono',transfer=audioKind(row)==='iem'?[row.iemTransport==='wireless'?'Funk':row.iemTransport==='cable'?'Kabel':'',routeFrequency(row)].filter(Boolean).join(' · '):'';
    const cells=input?[row.number||'—',source,esc(pickup),row.phantom?'48V':'—',esc(stageboxRouteLocation(row,direction)),esc(row.notes||'—')]:[row.number||'—',source,kind+' · '+esc(format),esc(transfer||'—'),esc(stageboxRouteLocation(row,direction)),esc(row.notes||'—')];return '<tr>'+cells.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>';
  }).join('')+'</tbody></table>';
}
function audioPatchSections(){
  return allRoutingStageboxes().flatMap(box=>{
    const rows=['inputs','outputs'].flatMap(direction=>stage.routing[direction].filter(row=>row.stagebox===box.id&&row.stageboxPort).sort((a,b)=>a.stageboxPort-b.stageboxPort).map(row=>({row,direction})));if(!rows.length)return [];
    return [{title:'Stagebox-Patchliste · '+box.name,html:'<table class="sp-paper-routing-table sp-audio-patch-table"><thead><tr><th>Port</th><th>Mischpult</th><th>Signal / Quelle</th><th>Anschluss</th></tr></thead><tbody>'+rows.map(({row,direction})=>'<tr><td>'+(direction==='inputs'?'IN ':'OUT ')+row.stageboxPort+'</td><td>'+(direction==='inputs'?'CH ':'OUT ')+(row.number||'—')+'</td><td>'+esc(row.instrument)+'</td><td>'+esc(row.connector)+'</td></tr>').join('')+'</tbody></table>'}];
  });
}
// Every microphone entry point uses the same identities, photos and picker.
function audioMicPhoto(name){return StageplotMics.photo(name);}
function audioMicBrand(name){return StageplotMics.brand(name);}
function audioMicCatalog(){return StageplotMics.catalog;}
function audioMicSuggestions(name){return StageplotMics.suggestions(name);}
let audioCustomModel=false,audioQuickPatch=null,audioPickupModels={},audioLastPickup='Mic',audioMicPicker=null,audioMicPickerReset=true;
function renderAudioMicPicker(){
  const pickup=$('sp-audio-pickup').value,selected=$('sp-channel-microphone').value,mic=pickup==='Mic';
  $('sp-audio-model-heading').textContent=mic?'Mikrofon auswählen':pickup==='DI'?'DI-Box angeben':'Abnahme';
  $('sp-audio-mic-choices').hidden=!mic;$('sp-audio-mic-selected').hidden=pickup!=='DI';
  $('sp-audio-custom-model-field').hidden=pickup!=='DI'||!audioCustomModel;
  $('sp-audio-mic-selected').innerHTML='<div><small>DI-Box</small><strong>'+esc(selected||'Modell noch offen')+'</strong></div><button class="sp-button" type="button" data-audio-custom-model>Eigenes Modell</button>'+(selected?'<button class="sp-button" type="button" data-audio-clear-model aria-label="Modell entfernen">×</button>':'');
  if(!mic)return;
  const channel=$('sp-channel-number').value,context=(channel&&channel!=='#'?'CH '+channel+' · ':'')+$('sp-channel-instrument').value;
  const options={selected,context,suggestions:editingRoute?.sourceKey?.includes(':drum-')?StageplotMics.drumSuggestions(editingRoute.sourceKey.split(':drum-')[1]):audioMicSuggestions($('sp-channel-instrument').value),onSelect(model){$('sp-channel-microphone').value=model.name;$('sp-audio-custom-model').value=model.name;$('sp-channel-phantom').checked=model.phantom===true;renderAudioEditorContext();}};
  if(!audioMicPicker)audioMicPicker=StageplotMicPicker.mount($('sp-audio-mic-choices'),options);
  else if(audioMicPickerReset)audioMicPicker.reset(options);else audioMicPicker.update(options);
  audioMicPickerReset=false;
}
function audioObjectPicture(row){const source=routeSourceObject(row);return source&&byId[source.type]?'<span class="sp-audio-object-picture">'+icon(byId[source.type],source)+'</span>':'';}
function renderAudioChainPreview(){
  if(!editingRoute)return;
  const input=$('sp-channel-direction').value==='inputs',stereo=$('sp-audio-format').value==='stereo',selected=[...$('sp-audio-chain-options').querySelectorAll('[data-audio-merge][aria-pressed="true"]')].map(button=>stage.routing.inputs.find(row=>row.id===button.dataset.audioMerge)).filter(Boolean);
  $('sp-audio-chain').hidden=!input||stereo;
  $('sp-audio-chain-title').textContent=input?'Ein Weg zum Mischpult':'Vom Mischpult zur Bühne';
  $('sp-audio-chain-description').textContent=input?'Instrument, Verstärker und Mikrofon können zu einem gemeinsamen Kanal gehören.':'Der Output versorgt einen Monitor, ein IEM-System oder ein anderes Gerät.';
  const sources=[editingRoute,...(editingRoute.linkedSources||[]),...selected],steps=[{name:sources.map((row,i)=>i?row.instrument:$('sp-channel-instrument').value).join(' + '),detail:sources.length>1?'Bühnenobjekte · gemeinsamer Kanal':'Bühnenobjekt',picture:audioObjectPicture(editingRoute)}];
  if(input)steps.push({name:$('sp-channel-microphone').value||({Mic:'Mikrofon',DI:'DI-Box',Direct:'Direkt / Line',Digital:'Digital'}[$('sp-audio-pickup').value]),detail:'Abnahme'});
  const box=routingStageboxes($('sp-channel-direction').value).find(box=>box.id===$('sp-channel-stagebox').value);
  if(input&&audioInputConnector(editingRoute,$('sp-audio-pickup').value)==='Dante')steps.push({name:playbackNetworkLocation(editingRoute),detail:'1 × CAT5e / CAT6 · RJ45'});else steps.push({name:box?.name||'Stagebox offen',detail:box?(input?'IN ':'OUT ')+($('sp-audio-port').value||'automatisch'):'Verbindung unter Kanäle'});
  steps.push({name:(input?'CH ':'Mix / Output ')+($('sp-channel-number').value||'offen')+(stereo?' / '+($('sp-audio-right-number').value||'offen'):''),detail:'Mischpult'});
  if(!input)steps.reverse();
  $('sp-audio-chain-preview').innerHTML=steps.map(step=>'<div>'+ (step.picture||'')+'<small>'+esc(step.detail)+'</small><strong>'+esc(step.name)+'</strong></div>').join('<span aria-hidden="true">→</span>');
  for(const button of $('sp-audio-chain-options').querySelectorAll('[data-audio-merge]')){const hint=button.querySelector('[data-merge-hint]');if(hint)hint.textContent=button.getAttribute('aria-pressed')==='true'?'Wird in CH '+($('sp-channel-number').value||'offen')+' integriert':'Zum gemeinsamen Kanal hinzufügen';}
}
// Selection is a pure plan: opening, choosing and cancelling never change routing.
function audioStageboxChoices(rows,members,boxes,direction,source){
  const distance=box=>source?Math.hypot((box.x||0)-(source.x||0),(box.y||0)-(source.y||0)):0;
  const choices=boxes.map(box=>{try{return {box,plan:planAudioPatch(rows,members,box,direction,{preserve:true}),error:''};}catch(error){return {box,plan:null,error:error.message};}});
  choices.sort((a,b)=>Boolean(a.error)-Boolean(b.error)||Number(members.every(row=>row.stagebox===b.box.id))-Number(members.every(row=>row.stagebox===a.box.id))||distance(a.box)-distance(b.box));
  return choices;
}
function audioQuickMembers(){
  if(!audioQuickPatch)return [];
  if(!audioQuickPatch.draft){const rows=stage.routing[audioQuickPatch.direction],row=rows.find(item=>item.id===audioQuickPatch.id);return audioOrderedGroup(rows,row);}
  const base={...editingRoute,instrument:$('sp-channel-instrument').value,stagebox:$('sp-channel-stagebox').value,stageboxPort:Number($('sp-audio-port').value)||null,connector:audioQuickPatch.direction==='inputs'?audioInputConnector(editingRoute,$('sp-audio-pickup').value):editingRoute.connector};
  return [base,...($('sp-audio-format').value==='stereo'?[{...base,...(editingRoute.partner||{}),id:editingRoute.partner?.id||editingRoute.id+'-draft-right',connector:base.connector,stagebox:audioEditorRightBox(),stageboxPort:Number($('sp-audio-right-port').value)||null}]:[])];
}
function openAudioPatch(direction,id,{draft=false}={}){
  if(sharedReadOnly)return;
  audioQuickPatch={direction,id,draft,boxId:'',startPort:null,plan:null};const members=audioQuickMembers();if(!members.length){audioQuickPatch=null;return;}
  const choices=audioStageboxChoices(stage.routing[direction],members,routingStageboxes(direction),direction,routeSourceObject(members[0]));
  audioQuickPatch.choices=choices;audioQuickPatch.boxId=choices.find(choice=>choice.plan)?.box.id||choices[0]?.box.id||'';
  $('sp-audio-connect-title').textContent=members.length>1?audioBaseName(members[0]):members[0].instrument;
  const numbers=draft?[$('sp-channel-number').value,...(members.length>1?[$('sp-audio-right-number').value]:[])]:members.map(row=>row.number);
  $('sp-audio-connect-source').textContent=(direction==='inputs'?'CH ':'Mix / Output ')+numbers.map(number=>number||'offen').join(' / ')+' · '+(members.length>1?'Stereo L/R':'Mono');
  $('sp-audio-connect-disconnect').hidden=!members.some(row=>row.stagebox);
  renderAudioQuickBoxes();selectAudioQuickBox(audioQuickPatch.boxId);$('sp-audio-connect-dialog').showModal();
}
function renderAudioQuickBoxes(){
  const {choices,boxId,direction}=audioQuickPatch,first=choices.find(choice=>choice.plan),members=audioQuickMembers();
  $('sp-audio-connect-boxes').innerHTML=choices.length?choices.map(choice=>{
    const box=choice.box,source=objects.find(o=>o.id===box.id),picture=source&&byId[source.type]?icon(byId[source.type],source):'',current=choice.plan?.assignments.every(patch=>members.some(row=>row.id===patch.id&&row.stagebox===patch.stagebox&&row.stageboxPort===patch.stageboxPort));
    return '<button type="button" data-audio-connect-box="'+esc(box.id)+'" aria-pressed="'+(box.id===boxId)+'"'+'><span class="sp-audio-box-picture">'+picture+'</span><span><strong>'+esc(box.name)+'</strong><small>'+esc(choice.error||box.capacity+' '+(direction==='inputs'?'Inputs':'Outputs')+(current?' · bereits verbunden':' · Platz für dieses Signal'))+'</small>'+(current?'<em>Aktuelle Verbindung</em>':choice===first?'<em>Vorschlag</em>':'')+'</span></button>';
  }).join(''):'<p class="sp-muted">Noch keine passende Stagebox auf der Bühne. Füge zuerst unter „Audio“ eine Stagebox hinzu.</p>';
}
// The socket artwork and active-port sparkle are shared with Stagebox-Belegung.
function audioSocketMarkup(box,direction,{port,selected=false,occupant=null,disabled=false,reason='',side=''},attribute){
  const socket=direction==='inputs'?'IN':'OUT',name=selected?(side?side+' · gewählt':'Gewählt'):occupant?occupant.instrument||'Belegt':disabled?'Gesperrt':'frei';
  const label=box.name+' · '+socket+' '+port+' · '+(selected?(side?side+' · ':'')+'ausgewählt':occupant?'belegt: '+(occupant.instrument||'Signal')+(occupant.number?' · CH '+occupant.number:''):reason||'frei');
  return '<button type="button" '+attribute+' data-stagebox-direction="'+direction+'" data-active-port="'+selected+'" data-used="'+!!occupant+'" aria-pressed="'+selected+'" aria-label="'+esc(label)+'" title="'+esc(label)+(reason?' · '+esc(reason):'')+'"'+(disabled?' disabled':'')+'><span class="sp-stagebox-port-number">'+socket+' '+port+'</span><span class="sp-stagebox-socket" aria-hidden="true"></span><span class="sp-stagebox-port-name">'+esc(name)+'</span></button>';
}
function audioCurrentSocketsMarkup(direction){
  const stereo=$('sp-audio-format').value==='stereo',entries=[{boxId:$('sp-channel-stagebox').value,port:Number($('sp-audio-port').value),side:stereo?'L':''},...(stereo?[{boxId:audioEditorRightBox(),port:Number($('sp-audio-right-port').value),side:'R'}]:[])],boxes=routingStageboxes(direction);
  return '<div class="sp-audio-current-sockets">'+entries.filter(entry=>entry.boxId&&entry.port).map(entry=>{const box=boxes.find(box=>box.id===entry.boxId);if(!box)return '';return '<div class="sp-stagebox-card" data-combo-jacks="'+!!box.comboJacks+'"><span class="sp-audio-socket-box-name">'+esc(box.name)+'</span><div class="sp-stagebox-ports">'+audioSocketMarkup(box,direction,{port:entry.port,selected:true,side:entry.side},'data-audio-open-connect')+'</div></div>';}).join('')+'</div>';
}
function audioQuickSocketStates(rows,members,box,direction,plan){
  const ids=new Set(members.map(row=>row.id));
  return Array.from({length:box.capacity},(_,i)=>{
    const port=i+1,assignment=plan?.assignments.find(patch=>patch.stagebox===box.id&&patch.stageboxPort===port),index=assignment?members.findIndex(row=>row.id===assignment.id):-1;
    const occupant=rows.find(row=>row.stagebox===box.id&&Number(row.stageboxPort)===port&&!ids.has(row.id))||null;
    let reason='';if(!assignment)try{planAudioPatch(rows,members,box,direction,{startPort:port});}catch(error){reason=error.message;}
    return {port,selected:!!assignment,side:assignment&&members.length>1?(index===0?'L':'R'):'',occupant,disabled:!!reason,reason};
  });
}
function renderAudioQuickSockets(){
  const state=audioQuickPatch,host=$('sp-audio-connect-ports'),box=state?.choices.find(choice=>choice.box.id===state.boxId)?.box;
  host.hidden=!box;if(!box){host.innerHTML='';return;}
  const members=audioQuickMembers(),ports=audioQuickSocketStates(stage.routing[state.direction],members,box,state.direction,state.plan),label=state.direction==='inputs'?'INPUTS · ZUM MISCHPULT':'OUTPUTS · VOM MISCHPULT';
  host.innerHTML='<article class="sp-stagebox-card sp-audio-socket-board" data-combo-jacks="'+!!box.comboJacks+'"><div class="sp-audio-socket-board-head"><strong>'+esc(box.name)+'</strong><span>'+box.capacity+' '+(state.direction==='inputs'?'Inputs':'Outputs')+' · '+(box.comboJacks&&state.direction==='inputs'?'Combo XLR / Klinke':'XLR')+'</span></div><section><header><strong>'+label+'</strong></header><div class="sp-stagebox-ports">'+ports.map(port=>audioSocketMarkup(box,state.direction,port,'data-audio-connect-port="'+port.port+'"')).join('')+'</div></section></article><p class="sp-audio-socket-help">Rosa: für dieses Signal gewählt · Belegte Buchsen zeigen den Signalnamen.'+(members.length>1?' Für Stereo die linke Buchse wählen; rechts wird gemeinsam verbunden.':' Eine freie Buchse anklicken, dann verbinden.')+'</p>';
}
function selectAudioQuickBox(id){
  const choice=audioQuickPatch.choices.find(choice=>choice.box.id===id);audioQuickPatch.boxId=choice?.box.id||'';audioQuickPatch.preserve=true;audioQuickPatch.startPort=null;
  renderAudioQuickBoxes();validateAudioQuickPatch();
}
function selectAudioQuickPort(port){
  const state=audioQuickPatch;if(!state)return;
  if(state.plan?.assignments.some(patch=>patch.stageboxPort===port))return;
  const box=routingStageboxes(state.direction).find(box=>box.id===state.boxId);if(!box)return;
  try{planAudioPatch(stage.routing[state.direction],audioQuickMembers(),box,state.direction,{startPort:port});}
  catch(error){$('sp-audio-connect-error').textContent=error.message;return;}
  state.preserve=false;state.startPort=port;validateAudioQuickPatch();
  $('sp-audio-connect-ports').querySelector?.('[data-audio-connect-port="'+port+'"]')?.focus({preventScroll:true});
}
function validateAudioQuickPatch(){
  const state=audioQuickPatch;if(!state)return;
  const members=audioQuickMembers(),box=routingStageboxes(state.direction).find(box=>box.id===state.boxId);state.plan=null;
  $('sp-audio-connect-error').textContent='';$('sp-audio-connect-selection').textContent='';$('sp-audio-connect-save').disabled=true;$('sp-audio-connect-save').textContent='Verbinden';
  if(box)try{
    state.plan=planAudioPatch(stage.routing[state.direction],members,box,state.direction,state.preserve?{preserve:true}:{startPort:state.startPort});
    const ports=state.plan.assignments.map(row=>row.stageboxPort).join(' / '),socket=state.direction==='inputs'?'IN':'OUT';
    $('sp-audio-connect-selection').textContent=box.name+' · '+socket+' '+ports+' ausgewählt';
    $('sp-audio-connect-save').textContent=socket+' '+ports+' verbinden';$('sp-audio-connect-save').disabled=false;
  }catch(error){$('sp-audio-connect-error').textContent=error.message;}
  renderAudioQuickSockets();
}
function commitAudioQuickPatch(disconnect=false){
  if(sharedReadOnly||!audioQuickPatch)return;
  const state=audioQuickPatch,members=audioQuickMembers();if(!members.length)return;
  if(!disconnect){validateAudioQuickPatch();if(!state.plan)return;}
  const assignments=disconnect?members.map(row=>({id:row.id,stagebox:'',stageboxPort:null})):state.plan.assignments;
  if(state.draft){
    $('sp-channel-stagebox').value=assignments[0].stagebox;$('sp-audio-port').value=assignments[0].stageboxPort||'';
    editingRoute.patchRightBox=assignments[1]?.stagebox||'';$('sp-audio-right-port').value=assignments[1]?.stageboxPort||'';$('sp-audio-right-patch').textContent='';audioFormChanged();
  }else{const before=snapshot();applyAudioPatchPlan(stage.routing[state.direction],{assignments,displaced:[]});keepHistory(before);refreshAudioSurface();say(disconnect?'Stagebox-Verbindung gelöst':'Stagebox verbunden · Kanalnummern beibehalten');}
  $('sp-audio-connect-dialog').close();audioQuickPatch=null;
}

$('sp-audio-object').addEventListener('click',e=>{
  const edit=e.target.closest('[data-audio-edit]');if(edit){openChannelDialog(edit.dataset.audioDirection,edit.dataset.audioEdit);return;}
  if(e.target.closest('[data-audio-overview]')){show('routing');return;}
  const use=e.target.closest('[data-audio-use]');if(use){const direction=use.dataset.audioDirection,spec=(direction==='inputs'?generatedInputSpecs():generatedOutputSpecs()).find(row=>row.sourceKey===use.dataset.audioUse);if(!spec)return;const before=snapshot();stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>key!==spec.sourceKey);const row=normalizeRouteChannel({...spec,id:'route-'+routeToken(),generatedInstrument:spec.instrument},stage.routing[direction].length,direction);stage.routing[direction].push(row);keepHistory(before);renderEditor();openChannelDialog(direction,row.id);}
});
$('sp-audio-number').addEventListener('click',()=>{
  if(sharedReadOnly)return;const before=snapshot(),plans=[];
  try{for(const direction of ['inputs','outputs']){const rows=clone(stage.routing[direction]),seen=new Set();for(const row of rows){if(seen.has(row.id))continue;const members=audioOrderedGroup(rows,row);members.forEach(member=>seen.add(member.id));if(members.every(member=>member.number))continue;const numbers=planAudioNumbers(rows,new Set(members.map(member=>member.id)),members.map(member=>member.number?String(member.number):'#'));members.forEach((member,i)=>member.number=numbers[i]);}plans.push({direction,rows});}}
  catch(error){say(error.message);return;}
  for(const plan of plans)stage.routing[plan.direction]=plan.rows;keepHistory(before);refreshAudioSurface();say('Kanalnummern ergänzt · vorhandene Nummern beibehalten');
});
$('sp-audio-chain').addEventListener('click',e=>{const choice=e.target.closest('[data-audio-merge]');if(choice){const selected=choice.getAttribute('aria-pressed')!=='true';choice.setAttribute('aria-pressed',String(selected));choice.querySelector('b').textContent=selected?'✓':'+';renderAudioChainPreview();return;}if(e.target.id!=='sp-audio-unmerge'||!editingRoute)return;const direction=editingRoute.direction,row=stage.routing[direction].find(item=>item.id===editingRoute.id);if(!row)return;const before=snapshot(),restored=(row.linkedSources||[]).map(member=>({...member,manual:true})),usedNumbers=new Set(stage.routing[direction].map(item=>item.number).filter(Boolean));for(const member of restored){if(usedNumbers.has(member.number))member.number=null;if(member.number)usedNumbers.add(member.number);if(stage.routing[direction].some(item=>member.stagebox&&item.stagebox===member.stagebox&&item.stageboxPort===member.stageboxPort)){member.stagebox='';member.stageboxPort=null;}}row.linkedSources=[];if(row.adoptedSource){row.sourceKey='';row.portIndex=null;row.adoptedSource=false;}stage.routing[direction].splice(stage.routing[direction].indexOf(row)+1,0,...restored);reconcileCablesWithRouting();keepHistory(before);$('sp-channel-dialog').close();renderRouting();say('Ursprüngliche Kanäle wiederhergestellt · zwischenzeitlich belegte Nummern und Ports bleiben frei');});

$('sp-audio-wireless').addEventListener('change',()=>audioFormChanged());

$('sp-audio-order').addEventListener('click',e=>{const move=e.target.closest('[data-audio-move]');if(!move||!editingRoute)return;const direction=editingRoute.direction,rows=stage.routing[direction],row=rows.find(row=>row.id===editingRoute.id),group=audioGroup(rows,row),indices=group.map(row=>rows.indexOf(row)),up=move.dataset.audioMove==='up',target=rows[up?Math.min(...indices)-1:Math.max(...indices)+1];if(!target)return;const before=snapshot();stage.routing[direction]=moveAudioGroup(rows,row.id,target.id,up?'before':'after');keepHistory(before);const movedRows=stage.routing[direction],movedGroup=audioGroup(movedRows,movedRows.find(item=>item.id===row.id));editingRoute.index=movedRows.findIndex(item=>item.id===row.id);$('sp-audio-order').querySelector('[data-audio-move="up"]').disabled=Math.min(...movedGroup.map(item=>movedRows.indexOf(item)))<=0;$('sp-audio-order').querySelector('[data-audio-move="down"]').disabled=Math.max(...movedGroup.map(item=>movedRows.indexOf(item)))>=movedRows.length-1;renderRouting();say('Signal verschoben · Kanalnummern beibehalten');});

$('sp-audio-more').addEventListener('click',()=>{const panel=$('sp-audio-more-actions');panel.hidden=!panel.hidden;$('sp-audio-more').setAttribute('aria-expanded',String(!panel.hidden));});

$('sp-audio-search').addEventListener('input',e=>{audioQuery=e.target.value;renderAudioFind();});
$('sp-audio-find').addEventListener('click',e=>{const button=e.target.closest('[data-audio-filter]');if(button){audioFilter=button.dataset.audioFilter;renderAudioFind();}if(e.target.closest('#sp-audio-search-clear')){audioQuery='';audioFilter='all';$('sp-audio-search').value='';renderAudioFind();$('sp-audio-search').focus();}});
$('sp-audio-undo').addEventListener('click',()=>undo());$('sp-audio-redo').addEventListener('click',()=>undo(true));
$('sp-audio-port-choices').addEventListener('click',e=>{if(e.target.closest('[data-audio-open-connect]'))openAudioPatch($('sp-channel-direction').value,editingRoute.id,{draft:true});});
$('sp-audio-port').addEventListener('input',renderAudioPortChoices);
$('sp-audio-right-port').addEventListener('input',renderAudioPortChoices);
$('sp-audio-di-help').addEventListener('click',()=>{setChannelPillValue('sp-audio-pickup','DI');audioFormChanged('sp-audio-pickup');showAudioEditorPanel('signal');});

$('sp-audio-editor-tabs').addEventListener('click',e=>{const button=e.target.closest('[data-audio-tab]');if(button)showAudioEditorPanel(button.dataset.audioTab);});
$('sp-audio-editor-tabs').addEventListener('keydown',e=>{
  const tabs=[...$('sp-audio-editor-tabs').querySelectorAll('[data-audio-tab]')],index=tabs.indexOf(e.target);if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;showAudioEditorPanel(tabs[next].dataset.audioTab,{focus:true});
});
$('sp-channel-form').addEventListener('input',()=>{$('sp-audio-error').textContent='';renderAudioEditorContext();});

$('sp-audio-mic-selected').addEventListener('click',e=>{if(e.target.closest('[data-audio-custom-model]')){audioCustomModel=true;renderAudioMicPicker();$('sp-audio-custom-model').focus();}if(e.target.closest('[data-audio-clear-model]')){$('sp-channel-microphone').value='';$('sp-audio-custom-model').value='';renderAudioMicPicker();renderAudioEditorContext();}});
$('sp-audio-custom-model').addEventListener('input',e=>{$('sp-channel-microphone').value=e.target.value;renderAudioEditorContext();});
$('sp-audio-custom-model').addEventListener('change',renderAudioMicPicker);
$('sp-audio-connect-boxes').addEventListener('click',e=>{const button=e.target.closest('[data-audio-connect-box]');if(button)selectAudioQuickBox(button.dataset.audioConnectBox);});
$('sp-audio-connect-ports').addEventListener('click',e=>{const button=e.target.closest('[data-audio-connect-port]');if(button&&!button.disabled)selectAudioQuickPort(Number(button.dataset.audioConnectPort));});
$('sp-audio-connect-save').addEventListener('click',()=>commitAudioQuickPatch());
$('sp-audio-connect-disconnect').addEventListener('click',()=>commitAudioQuickPatch(true));
$('sp-audio-connect-close').addEventListener('click',()=>$('sp-audio-connect-dialog').close());
$('sp-audio-connect-dialog').addEventListener('close',()=>{audioQuickPatch=null;});
