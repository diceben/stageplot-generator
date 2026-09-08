// Embedded inside the editor closure. These helpers operate on the same routing
// records used by cables, persistence and printing; physical I/O is only capacity.
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
  host.hidden=!all.length&&!rows.length;if(host.hidden)return;
  const used=new Set(['inputs','outputs'].flatMap(direction=>stage.routing[direction].flatMap(row=>audioMembers(row).map(member=>member.sourceKey)))),available=all.filter(row=>!used.has(row.sourceKey)),seen=new Set();
  host.innerHTML='<strong>Audio · verwendete Signale</strong><p class="sp-muted">'+(rows.length?'Dieselben Kanäle stehen in Liste, Verkabelung und PDF.':'Noch kein Signal verwendet.')+'</p>'+rows.map(({row,direction})=>{const group=row.stereoGroup||row.id;if(seen.has(group))return '';seen.add(group);const partners=audioGroup(stage.routing[direction],row);return '<button type="button" class="sp-audio-object-row" data-audio-edit="'+row.id+'" data-audio-direction="'+direction+'"'+(o.locked?' disabled':'')+'><strong>'+esc(partners.length>1?audioBaseName(row):row.instrument)+'</strong><small>'+(direction==='inputs'?'CH ':'OUT ')+partners.map(item=>item.number||'—').join(' / ')+' · '+(partners.length>1?'Stereo L/R':'Mono')+' · bearbeiten</small></button>';}).join('')+(available.length?'<details><summary>+ Weitere Signale verwenden</summary><div class="sp-audio-available">'+available.map(row=>'<button class="sp-button" type="button" data-audio-use="'+esc(row.sourceKey)+'" data-audio-direction="'+row.direction+'"'+(o.locked?' disabled':'')+'>'+esc(row.instrument)+' <small>'+(row.direction==='inputs'?'→ Mischpult':'vom Mischpult')+'</small></button>').join('')+'</div></details>':'')+'<button type="button" class="sp-button" data-audio-overview>Audio &amp; Verkabelung öffnen</button>';
}
function audioRoutingRows(rows,direction){
  return rows.map(row=>{const stereo=Boolean(row.stereoGroup),patch=stageboxRouteLocation(row,direction),kind=direction==='inputs'?({Mic:'Mikrofon',DI:'DI-Box',Direct:'Direkt / Line',Digital:'Digital'}[row.pickup]||row.signalType):({monitor:'Monitor',iem:'IEM',line:'Line'}[audioKind(row)]),members=(row.linkedSources||[]).length;
    return '<tr tabindex="0" data-route-row="'+row.id+'" data-audio-stereo="'+stereo+'"><td><button class="sp-route-drag-handle" type="button" draggable="true" data-route-drag="'+row.id+'" aria-label="'+esc(row.instrument)+' verschieben" title="'+(stereo?'Stereopaar':'Signal')+' verschieben">⠿</button></td><td><button class="sp-route-number" type="button" data-route-number="'+row.id+'" aria-label="Kanalnummer bearbeiten">'+(row.number||'—')+'</button></td><td><strong>'+esc(row.instrument||'Unbenannt')+'</strong>'+(members?'<small>'+members+' weitere Bühnenobjekte im Signalweg</small>':'')+(routeFrequency(row)?'<small>Funk: '+esc(routeFrequency(row))+'</small>':'')+'</td><td>'+esc(stereo?row.mode:'Mono')+'</td><td>'+kind+'</td><td>'+esc(row.microphone||'—')+'</td><td>'+(direction==='inputs'?'<button class="sp-routing-phantom" type="button" data-route-phantom="'+row.id+'" aria-pressed="'+row.phantom+'">48V</button>':'—')+'</td><td>'+esc(patch)+'</td><td>'+esc(row.notes||'—')+'</td><td><button class="sp-button" type="button" data-route-edit="'+row.id+'">Bearbeiten</button></td></tr>';
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
  $('sp-audio-order').hidden=!id;const orderGroup=new Set(group.map(item=>item.id)),first=rows.findIndex(item=>orderGroup.has(item.id)),last=rows.reduce((index,item,i)=>orderGroup.has(item.id)?i:index,-1);$('sp-audio-order').querySelector('[data-audio-move="up"]').disabled=first<=0;$('sp-audio-order').querySelector('[data-audio-move="down"]').disabled=last<0||last>=rows.length-1;
  $('sp-channel-title').textContent=id?'Signal bearbeiten':'Signal hinzufügen';$('sp-channel-number').setCustomValidity('');$('sp-audio-error').textContent='';
  $('sp-channel-number').value=id?(row.number||''):'#';$('sp-audio-right-number').value=partner?(partner.number||''):'#';
  setChannelPillValue('sp-channel-direction',direction);$('sp-channel-instrument').value=partner?audioBaseName(row):row.instrument;
  setChannelPillValue('sp-audio-format',partner?'stereo':'mono');setChannelPillValue('sp-audio-pickup',row.pickup);setChannelPillValue('sp-audio-kind',audioKind(row));setChannelPillValue('sp-audio-transport',row.iemTransport||'wireless');
  $('sp-channel-microphone').value=row.microphone;$('sp-channel-phantom').checked=row.phantom;$('sp-audio-wireless').checked=Boolean(routeFrequency(row));$('sp-audio-mic-choices').open=false;$('sp-channel-notes').value=row.notes;$('sp-audio-frequency').value=routeFrequency(row);
  renderChannelStageboxPills(direction,row.stagebox);$('sp-audio-port').value=row.stageboxPort||'';$('sp-audio-right-port').value=partner?.stageboxPort||'';
  $('sp-audio-right-patch').textContent=partner?.stagebox&&partner.stagebox!==row.stagebox?'Rechts: '+stageboxRouteLocation(partner,direction)+'. Bleibt erhalten, solange die Stagebox nicht geändert wird.':'';
  const canMerge=direction==='inputs'&&!partner,options=canMerge?rows.filter(item=>item.id!==row.id&&!item.stereoGroup&&(!item.sourceKey||!row.sourceKey.startsWith(item.sourceKey.split(':')[0]+':'))):[];
  $('sp-audio-chain').hidden=!canMerge&&!(row.linkedSources||[]).length;$('sp-audio-chain').open=false;
  $('sp-audio-chain-current').innerHTML=(row.linkedSources||[]).map(member=>'<p>'+esc(member.instrument)+' · ursprünglicher CH '+(member.number||'—')+' · '+esc(stageboxRouteLocation(member,direction))+'</p>').join('')+((row.linkedSources||[]).length?'<button class="sp-button" type="button" id="sp-audio-unmerge">Ursprüngliche Kanäle wiederherstellen</button>':'');
  $('sp-audio-chain-options').innerHTML=options.length?'<label class="sp-field">Signal suchen<input id="sp-audio-merge-search" type="search" placeholder="Gitarre, Amp, Mikrofon …"></label>'+options.map(item=>'<label class="sp-audio-merge-option"><input type="checkbox" data-audio-merge="'+item.id+'"><span><strong>'+esc(item.instrument)+'</strong><small>CH '+(item.number||'—')+' · '+esc(stageboxRouteLocation(item,direction))+'</small></span></label>').join(''):'<p class="sp-muted">Weitere Mono-Signale auf der Bühne können hier demselben Signalweg zugeordnet werden.</p>';
  $('sp-channel-delete').hidden=!id;audioFormChanged();$('sp-channel-dialog').showModal();
}
function audioFormChanged(changed=''){
  if(!editingRoute)return;const direction=$('sp-channel-direction').value,stereo=$('sp-audio-format').value==='stereo',iem=direction==='outputs'&&$('sp-audio-kind').value==='iem';
  $('sp-audio-number-label').textContent=direction==='inputs'?'Mischpult · CH':'Mix / Output';$('sp-audio-pickup-field').hidden=direction!=='inputs';$('sp-audio-kind-field').hidden=direction!=='outputs';$('sp-audio-iem-fields').hidden=!iem;
  $('sp-audio-wireless-field').hidden=direction!=='inputs';$('sp-audio-frequency-field').hidden=direction==='inputs'?!$('sp-audio-wireless').checked:!iem||$('sp-audio-transport').value==='cable';$('sp-audio-mic-choices').hidden=$('sp-audio-pickup').value!=='Mic';
  $('sp-audio-right-number-field').hidden=!stereo;$('sp-audio-right-port-field').hidden=!stereo;
  $('sp-channel-form').querySelector('.sp-channel-detail-row').hidden=direction!=='inputs';
  root.querySelector('[data-channel-pill-group="sp-audio-format"] [data-channel-value="stereo"]').disabled=!audioCanStereo(editingRoute,direction);
  if(changed==='sp-channel-direction'||changed==='sp-audio-pickup'){
    const current=$('sp-channel-stagebox').value,pickup=$('sp-audio-pickup').value,priorConnector=editingRoute.connector;
    editingRoute.connector=direction==='inputs'&&['Mic','DI'].includes(pickup)?'XLR':priorConnector;
    renderChannelStageboxPills(direction,changed==='sp-channel-direction'?'':current);editingRoute.connector=priorConnector;
  }
  if(changed==='sp-channel-stagebox'){$('sp-audio-port').value='';$('sp-audio-right-port').value='';$('sp-audio-right-patch').textContent='';}
  $('sp-audio-port').disabled=!$('sp-channel-stagebox').value;$('sp-audio-right-port').disabled=!$('sp-channel-stagebox').value;
  $('sp-audio-error').textContent='';
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
  requests.forEach((request,i)=>{if(result[i]!==null)reserve(request,result[i]);});
  requests.forEach((request,i)=>{if(!request.boxId||result[i]!==null)return;const box=boxes.find(box=>box.id===request.boxId);if(!box)throw Error('Die Stagebox ist nicht mehr verfügbar.');let port=1;while(used.get(box.id).has(port)&&port<=box.capacity)port++;reserve(request,port);result[i]=port;});return result;
}
function saveAudioChannel(){
  if(!editingRoute||!$('sp-channel-form').reportValidity())return;
  const direction=$('sp-channel-direction').value==='outputs'?'outputs':'inputs',stereo=$('sp-audio-format').value==='stereo',before=snapshot(),original=editingRoute,rows=stage.routing[direction],oldPartner=original.partner,excluded=new Set([original.id,oldPartner?.id]),name=$('sp-channel-instrument').value.trim(),pickup=$('sp-audio-pickup').value,kind=$('sp-audio-kind').value,error=message=>{$('sp-audio-error').textContent=message;},nameChanged=name!==(oldPartner?audioBaseName(original):original.instrument),box=$('sp-channel-stagebox').value,boxChanged=box!==original.stagebox||direction!==original.direction;
  if(!name)return error('Bitte einen Signalnamen eingeben.');
  let next,partner;
  try{
    const rightBox=oldPartner&&!boxChanged?oldPartner.stagebox:box,numbers=planAudioNumbers(rows,excluded,[$('sp-channel-number').value.trim(),...(stereo?[$('sp-audio-right-number').value.trim()]:[])]),ports=planAudioPorts(routingStageboxes(direction),rows,excluded,[{boxId:box,port:$('sp-audio-port').value},...(stereo?[{boxId:rightBox,port:$('sp-audio-right-port').value}]:[])]);
    const connector=direction==='inputs'&&['DI','Mic'].includes(pickup)?'XLR':pickup==='Digital'?'Digital':direction==='inputs'&&routeSourceObject(original)?objectIo(routeSourceObject(original)).outputs.connector:original.connector||'XLR',signalType=direction==='outputs'?'Line':pickup==='Mic'?'Mic':pickup==='DI'?'Line':pickup==='Digital'?'Digital':'Line',iem=direction==='outputs'&&kind==='iem';
    const shared={edited:true,pickup,outputKind:direction==='outputs'?kind:'',connector,signalType,microphone:direction==='inputs'?$('sp-channel-microphone').value:'',phantom:direction==='inputs'&&$('sp-channel-phantom').checked,frequencyBand:direction==='inputs'?($('sp-audio-wireless').checked?$('sp-audio-frequency').value:''):iem&&$('sp-audio-transport').value==='wireless'?$('sp-audio-frequency').value:'',iemName:iem?name:'',iemMode:iem?(stereo?'stereo':'mono'):'',iemTransport:iem?$('sp-audio-transport').value:'',iemGroup:iem?(original.iemGroup||original.id):''};
    next=normalizeRouteChannel({...original,...shared,manual:original.manual||original.isNew||direction!==original.direction,number:numbers[0],instrument:stereo?(!nameChanged&&oldPartner?original.instrument:name+' · L'):name,mode:stereo?'Stereo L':'Mono',stereoGroup:stereo?(original.stereoGroup||'audio-'+original.id):'',stagebox:box,stageboxPort:ports[0],notes:$('sp-channel-notes').value},0,direction);
    if(stereo){
      let seed=oldPartner;
      if(!seed){const source=routeSourceObject(original),available=(direction==='inputs'?generatedInputSpecs():generatedOutputSpecs()).find(spec=>source&&spec.sourceKey.startsWith(source.id+':')&&spec.portIndex===(original.portIndex||1)+1&&!['inputs','outputs'].some(key=>stage.routing[key].some(row=>audioMembers(row).some(member=>member.sourceKey===spec.sourceKey))));seed=available?{...available,id:'route-'+routeToken(),manual:true}:{id:'route-'+routeToken(),manual:true,sourceKey:source?source.id+':audio-'+routeToken():'',portIndex:(original.portIndex||1)+1};}
      const partnerChanges=oldPartner?Object.fromEntries(Object.entries(shared).filter(([key,value])=>key==='edited'||value!==original[key])):shared;
      partner=normalizeRouteChannel({...seed,...partnerChanges,id:seed.id,number:numbers[1],instrument:!nameChanged&&oldPartner?oldPartner.instrument:name+' · R',mode:'Stereo R',stereoGroup:next.stereoGroup,stagebox:rightBox,stageboxPort:ports[1],notes:!oldPartner||oldPartner.notes===original.notes?next.notes:oldPartner.notes},1,direction);
    }
    for(const row of [next,partner].filter(Boolean)){const target=routingStageboxes(direction).find(box=>box.id===row.stagebox);if(target&&routeNeedsDi(row,direction,target))throw Error('Dieses Klinkensignal braucht eine DI-Box vor der XLR-Stagebox. Unter Abnahme „DI-Box“ wählen.');}
  }catch(e){return error(e.message);}
  const merges=direction==='inputs'&&!stereo?[...$('sp-audio-chain-options').querySelectorAll('[data-audio-merge]:checked')].map(input=>stage.routing.inputs.find(row=>row.id===input.dataset.audioMerge)).filter(Boolean):[];
  for(const merged of merges){next.linkedSources.push(...audioMembers(clone(merged)).map(row=>({...row,linkedSources:[]})));excluded.add(merged.id);}
  if(!next.sourceKey){const source=next.linkedSources.find(member=>member.sourceKey);if(source){next.sourceKey=source.sourceKey;next.portIndex=source.portIndex;next.adoptedSource=true;}}
  const commit=()=>{
    for(const key of ['inputs','outputs'])stage.routing[key]=stage.routing[key].filter(row=>!excluded.has(row.id));
    if(oldPartner&&!stereo)stage.routing.disabledSources.push(...audioMembers(oldPartner).map(row=>row.sourceKey).filter(Boolean));
    stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>key!==next.sourceKey&&key!==partner?.sourceKey);
    const index=direction===original.direction&&original.index>=0?Math.min(original.index,stage.routing[direction].length):stage.routing[direction].length;stage.routing[direction].splice(index,0,...[next,partner].filter(Boolean));
    const source=routeSourceObject(next);if(source&&nameChanged&&!merges.length&&!next.linkedSources.length){const sourceGroups=new Set(audioObjectRows(source).map(item=>item.row.stereoGroup||item.row.id));if(sourceGroups.size===1)source.label=name.slice(0,42);}if(source&&next.frequencyBand!==routeFrequency(original))source.wireless=next.frequencyBand;
    reconcileCablesWithRouting();keepHistory(before);routingTab=direction;$('sp-channel-dialog').close();renderRouting();say('Signal gespeichert · Bühne, Patch und Druckliste aktualisiert');
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
  const input=direction==='inputs',heads=input?['CH','Signal / Quelle','Mikrofon / DI','48V','Patch · Stagebox-Port','Notizen']:['OUT','Ziel / Signal','Art / Format','Übertragung / Funk','Patch · Stagebox-Port','Notizen'];
  return '<table class="sp-paper-routing-table sp-audio-print-table" data-audio-direction="'+direction+'"><thead><tr>'+heads.map(head=>'<th>'+head+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>{const source=esc(row.instrument||'—')+(routeFrequency(row)&&input?'<small>Funk: '+esc(routeFrequency(row))+'</small>':''),pickup=row.microphone||({Mic:'Mikrofon',DI:'DI-Box',Direct:'Direkt / Line',Digital:'Digital'}[row.pickup]||'—'),kind={monitor:'Monitor',iem:'IEM',line:'Line'}[audioKind(row)],format=row.stereoGroup?row.mode:'Mono',transfer=audioKind(row)==='iem'?[row.iemTransport==='wireless'?'Funk':row.iemTransport==='cable'?'Kabel':'',routeFrequency(row)].filter(Boolean).join(' · '):'';
    const cells=input?[row.number||'—',source,esc(pickup),row.phantom?'48V':'—',esc(stageboxRouteLocation(row,direction)),esc(row.notes||'—')]:[row.number||'—',source,kind+' · '+esc(format),esc(transfer||'—'),esc(stageboxRouteLocation(row,direction)),esc(row.notes||'—')];return '<tr>'+cells.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>';
  }).join('')+'</tbody></table>';
}
function audioPatchSections(){
  return allRoutingStageboxes().flatMap(box=>{
    const rows=['inputs','outputs'].flatMap(direction=>stage.routing[direction].filter(row=>row.stagebox===box.id&&row.stageboxPort).sort((a,b)=>a.stageboxPort-b.stageboxPort).map(row=>({row,direction})));if(!rows.length)return [];
    return [{title:'Stagebox-Patchliste · '+box.name,html:'<table class="sp-paper-routing-table"><thead><tr><th>Port</th><th>Mischpult</th><th>Signal / Quelle</th><th>Anschluss</th><th>Kabelweg</th></tr></thead><tbody>'+rows.map(({row,direction})=>{const cable=(stage.cables||[]).find(item=>item.sourceKey===row.sourceKey&&item.direction===direction);return '<tr><td>'+(direction==='inputs'?'IN ':'OUT ')+row.stageboxPort+'</td><td>'+(direction==='inputs'?'CH ':'OUT ')+(row.number||'—')+'</td><td>'+esc(row.instrument)+'</td><td>'+esc(row.connector)+'</td><td>'+(cable?num(cable.length)+' m':'Nicht eingezeichnet')+'</td></tr>';}).join('')+'</tbody></table>'}];
  });
}
$('sp-audio-object').addEventListener('click',e=>{
  const edit=e.target.closest('[data-audio-edit]');if(edit){openChannelDialog(edit.dataset.audioDirection,edit.dataset.audioEdit);return;}
  if(e.target.closest('[data-audio-overview]')){show('routing');return;}
  const use=e.target.closest('[data-audio-use]');if(use){const direction=use.dataset.audioDirection,spec=(direction==='inputs'?generatedInputSpecs():generatedOutputSpecs()).find(row=>row.sourceKey===use.dataset.audioUse);if(!spec)return;const before=snapshot();stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>key!==spec.sourceKey);const row=normalizeRouteChannel({...spec,id:'route-'+routeToken(),generatedInstrument:spec.instrument},stage.routing[direction].length,direction);stage.routing[direction].push(row);keepHistory(before);renderEditor();openChannelDialog(direction,row.id);}
});
$('sp-audio-number').addEventListener('click',()=>{const before=snapshot();for(const direction of ['inputs','outputs'])for(const row of stage.routing[direction])if(!row.number)row.number=nextFreeChannelNumber(direction);keepHistory(before);renderRouting();say('Freie Kanalnummern ergänzt · vorhandene Nummern beibehalten');});
$('sp-audio-chain').addEventListener('input',e=>{if(e.target.id==='sp-audio-merge-search'){const query=e.target.value.toLocaleLowerCase('de');$('sp-audio-chain-options').querySelectorAll('.sp-audio-merge-option').forEach(option=>option.hidden=!option.textContent.toLocaleLowerCase('de').includes(query));}});
$('sp-audio-chain').addEventListener('click',e=>{if(e.target.id!=='sp-audio-unmerge'||!editingRoute)return;const direction=editingRoute.direction,row=stage.routing[direction].find(item=>item.id===editingRoute.id);if(!row)return;const before=snapshot(),restored=(row.linkedSources||[]).map(member=>({...member,manual:true})),usedNumbers=new Set(stage.routing[direction].map(item=>item.number).filter(Boolean));for(const member of restored){if(usedNumbers.has(member.number))member.number=null;if(member.number)usedNumbers.add(member.number);if(stage.routing[direction].some(item=>member.stagebox&&item.stagebox===member.stagebox&&item.stageboxPort===member.stageboxPort)){member.stagebox='';member.stageboxPort=null;}}row.linkedSources=[];if(row.adoptedSource){row.sourceKey='';row.portIndex=null;row.adoptedSource=false;}stage.routing[direction].splice(stage.routing[direction].indexOf(row)+1,0,...restored);reconcileCablesWithRouting();keepHistory(before);$('sp-channel-dialog').close();renderRouting();say('Ursprüngliche Kanäle wiederhergestellt · zwischenzeitlich belegte Nummern und Ports bleiben frei');});

$('sp-audio-wireless').addEventListener('change',()=>audioFormChanged());

$('sp-audio-order').addEventListener('click',e=>{const move=e.target.closest('[data-audio-move]');if(!move||!editingRoute)return;const direction=editingRoute.direction,rows=stage.routing[direction],row=rows.find(row=>row.id===editingRoute.id),group=audioGroup(rows,row),indices=group.map(row=>rows.indexOf(row)),up=move.dataset.audioMove==='up',target=rows[up?Math.min(...indices)-1:Math.max(...indices)+1];if(!target)return;const before=snapshot();stage.routing[direction]=moveAudioGroup(rows,row.id,target.id,up?'before':'after');keepHistory(before);const movedRows=stage.routing[direction],movedGroup=audioGroup(movedRows,movedRows.find(item=>item.id===row.id));editingRoute.index=movedRows.findIndex(item=>item.id===row.id);$('sp-audio-order').querySelector('[data-audio-move="up"]').disabled=Math.min(...movedGroup.map(item=>movedRows.indexOf(item)))<=0;$('sp-audio-order').querySelector('[data-audio-move="down"]').disabled=Math.max(...movedGroup.map(item=>movedRows.indexOf(item)))>=movedRows.length-1;renderRouting();say('Signal verschoben · Kanalnummern beibehalten');});

$('sp-audio-more').addEventListener('click',()=>{const panel=$('sp-audio-more-actions');panel.hidden=!panel.hidden;$('sp-audio-more').setAttribute('aria-expanded',String(!panel.hidden));});
