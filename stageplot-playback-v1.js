// Playback hardware uses the existing object I/O and canonical audio rows.
// Only the transport choice and Ethernet destination need extra project metadata.
function normalizePlayback(value){
  const source=value&&typeof value==='object'?value:{};
  return {version:1,mode:['stereo','playaudio','dante','custom'].includes(source.mode)?source.mode:'stereo',target:projectText(source.target,120)};
}
function playbackMode(o){
  const io=objectIo(o);
  if(io.outputs.connector==='Dante')return 'dante';
  if(io.outputs.connector==='XLR'&&io.outputs.count===12)return 'playaudio';
  if(io.outputs.connector==='Klinke'&&io.outputs.count===2)return 'stereo';
  return 'custom';
}
function playbackOutputLabel(o){
  const io=objectIo(o),mode=playbackMode(o);
  return mode==='playaudio'?'PLAYAUDIO1U · 12 × XLR':mode==='dante'?'Dante · '+io.outputs.count+' Ch · 1 × RJ45':mode==='stereo'?'Stereo L/R · Klinke':ioValueText(io.outputs,'outputs');
}
function playbackSourceHint(row){
  const o=routeSourceObject(row);if(o?.type!=='laptop')return '';
  const mode=playbackMode(o),port=row.portIndex||'—';
  return mode==='playaudio'?'PLAYAUDIO1U · XLR Out '+port:mode==='dante'?'Dante Virtual Soundcard · Tx '+port:'Playback · Out '+port+' · '+objectIo(o).outputs.connector;
}
function playbackNetworkLocation(row){
  const o=routeSourceObject(row),target=o?.type==='laptop'?normalizePlayback(o.playback).target:'';
  return 'Dante · Tx '+(row.portIndex||'—')+' · '+(target||'Netzwerkziel offen');
}
function playbackShortcut(o){
  return '<button type="button" class="sp-playback-shortcut" data-playback-open="'+esc(o.id)+'"'+(o.locked?' disabled':'')+'><span><strong>Playback-Ausgänge</strong><small>'+esc(playbackOutputLabel(o))+'</small></span><span aria-hidden="true">↗</span></button>';
}
function playbackDraftFromObject(o){
  const io=objectIo(o),disabled=new Set(stage.routing.disabledSources||[]);
  return {id:o.id,mode:playbackMode(o),target:normalizePlayback(o.playback).target,io:clone(io),enabled:Array.from({length:64},(_,i)=>!disabled.has(o.id+':'+objectOutputPortKey(o,i))),banks:{}};
}
function playbackChooseMode(draft,mode){
  if(!['stereo','playaudio','dante'].includes(mode)||mode===draft.mode)return;
  draft.banks[draft.mode]={io:clone(draft.io),enabled:[...draft.enabled]};
  if(draft.banks[mode]){draft.io=clone(draft.banks[mode].io);draft.enabled=[...draft.banks[mode].enabled];}
  else {
    const previousCount=draft.io.outputs.count,count=mode==='stereo'?2:mode==='playaudio'?12:Math.max(2,Math.ceil(previousCount/2)*2);
    const pairs=mode==='stereo'?[1]:[...draft.io.stereoPairs.filter(start=>start<count),...Array.from({length:Math.floor(count/2)},(_,i)=>i*2+1).filter(start=>start>=previousCount)];
    draft.io.outputs={count,connector:mode==='stereo'?'Klinke':mode==='playaudio'?'XLR':'Dante'};
    draft.io.stereoPairs=[...new Set(pairs)];
    draft.io.aliases.outputs=Array.from({length:64},(_,i)=>draft.io.aliases.outputs[i]||'');
    for(const start of draft.io.stereoPairs){const a=draft.io.aliases.outputs[start-1],b=draft.io.aliases.outputs[start];if(a!==b){const name=ioAliasText(a&&b?a+' / '+b:a||b);draft.io.aliases.outputs[start-1]=name;draft.io.aliases.outputs[start]=name;}}
  }
  draft.mode=mode;
}
function playbackSetChannelCount(draft,count){
  if(draft.mode!=='dante'||!Number.isInteger(count)||count<2||count>64||count%2)return;
  const old=draft.io.outputs.count;draft.io.outputs.count=count;
  for(let start=1;start<count;start+=2)if(start>=old)if(!draft.io.stereoPairs.includes(start))draft.io.stereoPairs.push(start);
}
function playbackSetPairFormat(draft,start,stereo){
  if(!Number.isInteger(start)||start<1||start%2!==1||start>=draft.io.outputs.count)return;
  const pairs=new Set(draft.io.stereoPairs);
  if(stereo){pairs.add(start);const a=draft.io.aliases.outputs[start-1]||'',b=draft.io.aliases.outputs[start]||'',name=ioAliasText(a&&b&&a!==b?a+' / '+b:a||b);draft.io.aliases.outputs[start-1]=name;draft.io.aliases.outputs[start]=name;}else pairs.delete(start);
  draft.io.stereoPairs=[...pairs].sort((a,b)=>a-b);
}
function playbackPortMarkup(port,connector){
  const drawing=connector==='XLR'?'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#424a47" stroke="#b6bdb8" stroke-width="2"/><circle cx="16" cy="16" r="10" fill="#171d1a"/><path d="M13 3h6v5h-6z" fill="#b6bdb8"/><g fill="#e0e5df"><circle cx="11" cy="13" r="2"/><circle cx="21" cy="13" r="2"/><circle cx="16" cy="22" r="2"/></g></svg>':'<span class="sp-playback-port-symbol" aria-hidden="true">'+(connector==='Dante'?'Tx':'↗')+'</span>';
  return '<span class="sp-playback-port">'+drawing+'<b>'+port+'</b></span>';
}
function playbackPairMarkup(draft,start){
  const count=draft.io.outputs.count,ports=[start,...(start<count?[start+1]:[])],stereo=draft.io.stereoPairs.includes(start)&&ports.length===2,active=ports.some(port=>draft.enabled[port-1]),range=ports.join('–'),examples=['Intro','Percussion','Synths','Chöre','Click','Cue'],placeholder=examples[Math.floor((start-1)/2)]||'Signalname';
  const usedButton=group=>{const enabled=group.some(port=>draft.enabled[port-1]);return '<button class="sp-playback-used" type="button" data-playback-used="'+group.join(',')+'" aria-label="Ausgänge '+group.join('–')+' verwenden" aria-pressed="'+enabled+'">'+(enabled?'✓ Aktiv':'Verwenden')+'</button>';};
  const names=(stereo?[ports]:ports.map(port=>[port])).map(group=>{const value=draft.io.aliases.outputs[group[0]-1]||'',label=(draft.mode==='dante'?'Tx ':'Out ')+group.join('–')+(stereo?' · Stereo L/R':' · Mono'),id='sp-playback-name-'+group[0];return '<div class="sp-playback-name"><div class="sp-playback-name-heading"><label for="'+id+'">'+label+'</label>'+(!stereo?usedButton(group):'')+'</div><input id="'+id+'" data-playback-name="'+group.join(',')+'" aria-label="Signalname '+label+'" maxlength="60" placeholder="z. B. '+placeholder+'" value="'+esc(value)+'"></div>';}).join('');
  return '<section class="sp-playback-pair" data-active="'+active+'"><div class="sp-playback-pair-head"><div class="sp-playback-sockets" aria-label="'+esc(draft.io.outputs.connector+' Ausgänge '+range)+'">'+ports.map(port=>playbackPortMarkup(port,draft.io.outputs.connector)).join('')+'</div><div class="sp-playback-format" role="group" aria-label="Format Ausgänge '+range+'">'+(ports.length===2?'<button type="button" data-playback-format="'+start+'" data-stereo="true" aria-pressed="'+stereo+'">Stereo L/R</button><button type="button" data-playback-format="'+start+'" data-stereo="false" aria-pressed="'+!stereo+'">2 × Mono</button>':'<span>Mono</span>')+'</div>'+(stereo?usedButton(ports):'<span class="sp-playback-active-count">'+ports.filter(port=>draft.enabled[port-1]).length+' / '+ports.length+' aktiv</span>')+'</div><div class="sp-playback-names">'+names+'</div></section>';
}
function playbackChangeImpact(o,draft){
  const before=objectIo(o),oldSpecs=generatedInputSpecs().filter(spec=>spec.sourceKey.startsWith(o.id+':')),oldKeys=new Set(oldSpecs.map(spec=>spec.sourceKey)),rows=audioObjectRows(o).flatMap(({row})=>audioMembers(row)).filter(row=>oldKeys.has(row.sourceKey)),newCount=draft.io.outputs.count;
  const removed=rows.filter(row=>row.portIndex>newCount||!draft.enabled[row.portIndex-1]).length;
  const unpatch=draft.mode==='dante'?rows.filter(row=>row.stagebox&&row.stageboxPort).length:0;
  const structural=before.outputs.count!==newCount||before.outputs.connector!==draft.io.outputs.connector||JSON.stringify(before.stereoPairs)!==JSON.stringify(draft.io.stereoPairs.filter(start=>start<newCount));
  const mixed=structural&&audioObjectRows(o).some(({row})=>audioMembers(row).some(member=>oldKeys.has(member.sourceKey))&&audioMembers(row).some(member=>!oldKeys.has(member.sourceKey)));
  return {removed,unpatch,mixed};
}
let playbackDraft=null,playbackReturnFocus=null,playbackDialog=null;
function renderPlaybackDialog(){
  if(!playbackDraft||!playbackDialog)return;const draft=playbackDraft,o=objects.find(item=>item.id===draft.id);if(!o)return;
  const modes=[['stereo','Stereo L/R','2 Ausgänge · Klinke'],['playaudio','PLAYAUDIO1U','12 symmetrische XLR-Ausgänge'],['dante','Dante','Virtual Soundcard · Ethernet']];
  $('sp-playback-source').innerHTML=icon(byId.laptop,o)+'<div><strong>'+esc(o.label||'Playback-Laptop')+'</strong><span>Ausgänge und Signalnamen festlegen</span></div>';
  $('sp-playback-modes').innerHTML=modes.map(([mode,name,detail])=>'<button type="button" data-playback-mode="'+mode+'" aria-pressed="'+(mode===draft.mode)+'"><strong>'+(mode==='playaudio'?'PLAYAUDIO<wbr>1U':name)+'</strong><small>'+detail+'</small></button>').join('');
  $('sp-playback-network').hidden=draft.mode!=='dante';$('sp-playback-target').value=draft.target;
  $('sp-playback-counts').innerHTML=[2,4,8,12,16,24,32,64].map(count=>'<button type="button" data-playback-count="'+count+'" aria-pressed="'+(count===draft.io.outputs.count)+'">'+count+'</button>').join('');
  $('sp-playback-custom').hidden=draft.mode!=='custom';
  $('sp-playback-rows').innerHTML=Array.from({length:Math.ceil(draft.io.outputs.count/2)},(_,i)=>playbackPairMarkup(draft,i*2+1)).join('');
  const active=draft.enabled.slice(0,draft.io.outputs.count).filter(Boolean).length;
  $('sp-playback-summary').textContent=active+' von '+draft.io.outputs.count+' Kanälen im Audioplan'+(draft.mode==='dante'?' · über 1 Netzwerkkabel':'');
  const impact=playbackChangeImpact(o,draft);$('sp-playback-impact').textContent=[impact.removed?impact.removed+' bisherige Kanäle werden entfernt.':'',impact.unpatch?impact.unpatch+' analoge Stagebox-Verbindungen werden für Dante gelöst.':'',impact.mixed?'Dieses Playback ist mit anderen Quellen zu einem Signalweg zusammengefasst. Zum Wechsel des Ausgangsformats zuerst die ursprünglichen Kanäle im Signal-Editor wiederherstellen.':''].filter(Boolean).join(' ');$('sp-playback-save').disabled=impact.mixed;
}
function openPlaybackDialog(id,returnFocus=document.activeElement){
  const o=objects.find(item=>item.id===id&&item.type==='laptop');if(!o||o.locked||sharedReadOnly)return;
  cancelPlacement(false);finishEdit();spaceHeld=false;syncViewControls();playbackDraft=playbackDraftFromObject(o);playbackReturnFocus=returnFocus;
  if(!playbackDialog){
    playbackDialog=document.createElement('dialog');playbackDialog.id='sp-playback-dialog';playbackDialog.className='sp-playback-dialog';playbackDialog.setAttribute('aria-labelledby','sp-playback-title');
    playbackDialog.innerHTML='<header><div><span class="sp-playback-eyebrow">PLAYBACK · SIGNALÜBERGABE</span><h2 id="sp-playback-title">Playback-Ausgänge</h2></div><button type="button" data-playback-cancel aria-label="Playback-Ausgänge schließen">×</button></header><div id="sp-playback-source" class="sp-playback-source"></div><div id="sp-playback-modes" class="sp-playback-modes" role="group" aria-label="Playback-Ausgabe"></div><div class="sp-playback-body"><p id="sp-playback-custom" class="sp-muted" hidden>Deine bisherigen Gerätebuchsen bleiben erhalten. Wähle oben ein Setup, um auf Stereo, PLAYAUDIO1U oder Dante umzustellen.</p><section id="sp-playback-network" class="sp-playback-network" hidden><div><strong>1 × Netzwerkkabel · RJ45</strong><p>CAT5e / CAT6 zum Dante-Netzwerk. Alle Sendekanäle laufen über dieses Kabel; keine Internetverbindung erforderlich.</p></div><label>Übergabe / Ziel<input id="sp-playback-target" maxlength="120" placeholder="z. B. FOH · Dante-Switch"></label><div><span>Genutzte Dante-Sendekanäle</span><div id="sp-playback-counts" class="sp-playback-counts" role="group" aria-label="Anzahl Dante-Sendekanäle"></div><small>Standard-DVS bis 64 Kanäle bei 44,1 / 48 kHz. In DVS eine entsprechend große Kanalzahl einstellen.</small></div></section><div class="sp-playback-list-heading"><strong>Ausgänge beschriften</strong><span>Die Namen erscheinen auch im Audioplan und im Export.</span></div><div id="sp-playback-rows" class="sp-playback-rows"></div></div><footer><div><strong id="sp-playback-summary"></strong><p id="sp-playback-impact" role="status"></p><p id="sp-playback-error" role="alert"></p></div><div><button type="button" data-playback-cancel>Abbrechen</button><button type="button" id="sp-playback-save">Übernehmen</button></div></footer>';
    root.appendChild(playbackDialog);
    playbackDialog.addEventListener('close',()=>{playbackDraft=null;const focus=playbackReturnFocus;playbackReturnFocus=null;if(focus?.isConnected)focus.focus({preventScroll:true});});
    playbackDialog.addEventListener('click',handlePlaybackClick);
    playbackDialog.addEventListener('input',handlePlaybackInput);
  }
  $('sp-playback-error').textContent='';renderPlaybackDialog();playbackDialog.showModal();
}
function handlePlaybackInput(e){
  if(!playbackDraft)return;const input=e.target;
  if(input.id==='sp-playback-target')playbackDraft.target=input.value;
  if(input.matches('[data-playback-name]'))for(const port of input.dataset.playbackName.split(',').map(Number))playbackDraft.io.aliases.outputs[port-1]=ioAliasText(input.value);
}
function handlePlaybackClick(e){
  if(e.target.closest('[data-playback-cancel]')){playbackDialog.close();return;}if(!playbackDraft)return;
  const mode=e.target.closest('[data-playback-mode]'),count=e.target.closest('[data-playback-count]'),format=e.target.closest('[data-playback-format]'),used=e.target.closest('[data-playback-used]');
  if(mode)playbackChooseMode(playbackDraft,mode.dataset.playbackMode);
  if(count)playbackSetChannelCount(playbackDraft,Number(count.dataset.playbackCount));
  if(format)playbackSetPairFormat(playbackDraft,Number(format.dataset.playbackFormat),format.dataset.stereo==='true');
  if(used){const ports=used.dataset.playbackUsed.split(',').map(Number),enable=!ports.some(port=>playbackDraft.enabled[port-1]);for(const port of ports)playbackDraft.enabled[port-1]=enable;}
  if(mode||count||format||used){const scroll=$('sp-playback-rows').parentElement.scrollTop;renderPlaybackDialog();$('sp-playback-rows').parentElement.scrollTop=mode?0:scroll;}
  if(e.target.closest('#sp-playback-save'))savePlaybackDialog();
}
function savePlaybackDialog(){
  const draft=playbackDraft,o=objects.find(item=>item.id===draft?.id);if(!draft||!o||o.locked||sharedReadOnly)return;
  const impact=playbackChangeImpact(o,draft);if(impact.mixed){$('sp-playback-error').textContent='Zuerst die ursprünglichen Kanäle im Signal-Editor wiederherstellen.';return;}
  const before=snapshot(),oldIo=objectIo(o),oldSpecs=new Map(generatedInputSpecs().filter(spec=>spec.sourceKey.startsWith(o.id+':')).map(spec=>[spec.sourceKey,spec]));
  o.io=normalizeObjectIo(draft.io,o);o.playback=normalizePlayback({mode:draft.mode,target:draft.target});o.outs=ioValueText(o.io.outputs,'outputs');
  const specs=new Map(generatedInputSpecs().filter(spec=>spec.sourceKey.startsWith(o.id+':')).map(spec=>[spec.sourceKey,spec])),allKeys=new Set([...oldSpecs.keys(),...specs.keys()]);
  const update=member=>{
    if(!allKeys.has(member.sourceKey))return member;
    const spec=specs.get(member.sourceKey);if(!spec||!draft.enabled[spec.portIndex-1])return null;
    const old=oldSpecs.get(member.sourceKey),nameChanged=ioAliasAt(oldIo,'outputs',spec.portIndex)!==ioAliasAt(o.io,'outputs',spec.portIndex),formatChanged=old?.connector!==spec.connector||old?.mode!==spec.mode||old?.stereoGroup!==spec.stereoGroup;
    const next={...member,portIndex:spec.portIndex,generatedInstrument:spec.instrument};
    if((nameChanged&&!member.linkedSources?.length)||!member.instrument||member.instrument===member.generatedInstrument)next.instrument=spec.instrument;
    if(formatChanged){next.mode=spec.mode;next.stereoGroup=spec.stereoGroup;next.signalType=spec.signalType;next.pickup=spec.connector==='Dante'?'Digital':spec.connector==='Klinke'&&member.pickup==='DI'?'DI':'Direct';next.connector=next.pickup==='DI'?'XLR':spec.connector;if(next.pickup!=='DI'){next.microphone='';next.phantom=false;}}
    if(spec.connector==='Dante'){next.stagebox='';next.stageboxPort=null;}
    return next;
  };
  for(const direction of ['inputs','outputs'])stage.routing[direction]=stage.routing[direction].flatMap(row=>{
    const member=update(row),linked=(row.linkedSources||[]).map(update).filter(Boolean);
    if(member)return [{...member,linkedSources:linked}];
    // If only the playback member is disabled, keep other merged sources and their channel.
    return linked.length?[{...row,sourceKey:'',portIndex:null,manual:true,adoptedSource:false,instrument:linked.map(item=>item.instrument).join(' + '),linkedSources:linked}]:[];
  });
  stage.routing.disabledSources=(stage.routing.disabledSources||[]).filter(key=>!allKeys.has(key));
  for(const spec of specs.values())if(!draft.enabled[spec.portIndex-1])stage.routing.disabledSources.push(spec.sourceKey);
  syncRoutingFromStage(false,false);keepHistory(before);playbackDialog.close();refreshAudioSurface();say('Playback-Ausgänge übernommen · Audioplan und Export aktualisiert');
}
// Playback DOM bindings.
root.addEventListener('click',e=>{const button=e.target.closest('[data-playback-open]');if(button&&!button.disabled)openPlaybackDialog(button.dataset.playbackOpen,button);});
