// Embedded in the editor closure. One IEM editor for placement, object and routing.
let iemEditingId=null;
function dialogBody(){return $('sp-iem-monitor-dialog').querySelector('.sp-iem-set-body');}
function iemSetRows(o){return StageplotIem.read(o,stage.routing.outputs);}
function iemMonitorShortcut(o){
  const mixes=iemSetRows(o),stereo=mixes.filter(m=>m.mode==='stereo').length;
  return '<button type="button" class="sp-iem-shortcut" data-iem-monitors="'+esc(o.id)+'"'+(o.locked?' disabled':'')+'><span><strong>IEM-Monitore einrichten</strong><small>'+mixes.length+' IEM · '+(mixes.length-stereo)+' Mono · '+stereo+' Stereo</small></span><b aria-hidden="true">→</b></button>';
}
function commitIemSet(o,mixes){
  if(!o||o.locked||sharedReadOnly)return false;
  const before=snapshot();
  try{
    const result=StageplotIem.apply(o,stage.routing.outputs,mixes,routeToken);
    o.iemMixes=result.mixes;o.iem={...result.mixes[0]};
    if(/^(IEM(?:-Rack|-Monitore)?|\d+ IEM-Monitore)$/.test(o.label))o.label=result.mixes.length+' IEM-Monitore';
    stage.routing.outputs=result.rows.map((row,i)=>normalizeRouteChannel(row,i,'outputs'));
    stage.routing.disabledSources=stage.routing.disabledSources.filter(key=>!key.startsWith(o.id+':'));
    reconcileCablesWithRouting();keepHistory(before);refreshAudioSurface();return true;
  }catch(error){$('sp-iem-set-error').textContent=error.message;$('sp-iem-set-error').hidden=false;return false;}
}
function openIemMonitors(id,mixKey=null){
  const o=objects.find(o=>o.id===id&&o.type==='rack');if(!o||o.locked||sharedReadOnly)return false;
  finishEdit();iemEditingId=id;renderIemMonitors();
  if(!$('sp-iem-monitor-dialog').open)$('sp-iem-monitor-dialog').showModal();
  const mix=iemSetRows(o).find(m=>m.ports.some(port=>id+':'+port===mixKey));
  if(mix)requestAnimationFrame(()=>document.getElementById('sp-iem-mix-'+mix.id)?.scrollIntoView({block:'nearest'}));
  else requestAnimationFrame(()=>{$('sp-iem-set-heading').focus({preventScroll:true});dialogBody().scrollTop=0;});return false;
}
function renderIemMonitors(){
  const o=objects.find(o=>o.id===iemEditingId);if(!o){$('sp-iem-monitor-dialog').close();return;}
  const mixes=iemSetRows(o),channels=mixes.reduce((sum,m)=>sum+(m.mode==='stereo'?2:1),0);
  $('sp-iem-set-count').textContent=mixes.length;$('sp-iem-count-less').disabled=mixes.length<=1;$('sp-iem-count-more').disabled=mixes.length>=16;
  $('sp-iem-set-summary').textContent=channels+' AUX-Mixe / Ausgangskanäle · Mono braucht einen, Stereo zwei.';
  $('sp-iem-set-error').hidden=true;
  const choice=(m,field,value,text)=>'<button type="button" data-iem-field="'+field+'" data-iem-value="'+value+'" aria-pressed="'+(m[field]===value)+'">'+text+'</button>';
  $('sp-iem-set-mixes').innerHTML=mixes.map((m,i)=>{
    const rows=m.ports.map(port=>stage.routing.outputs.find(row=>row.sourceKey===o.id+':'+port)).slice(0,m.mode==='stereo'?2:1);
    const aux=rows.map((row,side)=>'<label class="sp-field">'+(m.mode==='stereo'?(side?'Rechts · AUX':'Links · AUX'):'Mono · AUX')+'<input type="number" inputmode="numeric" min="1" max="999" step="1" data-iem-aux="'+side+'" value="'+(row?.number||'')+'" placeholder="Freier Mix" aria-label="IEM '+(i+1)+' '+(side?'rechts':'links')+' AUX"></label>').join('');
    const patch=rows.map((row,side)=>'<span><b>'+(m.mode==='stereo'?(side?'R':'L'):'Mono')+'</b> '+esc(row?stageboxRouteLocation(row,'outputs'):'Ausgang noch offen')+'</span>').join('');
    return '<section class="sp-iem-mix" id="sp-iem-mix-'+m.id+'" data-iem-mix="'+m.id+'"><header><span class="sp-iem-mix-number">'+(i+1)+'</span><label class="sp-field">Musiker:in / Monitor<input data-iem-name maxlength="80" value="'+esc(m.name)+'" aria-label="IEM '+(i+1)+' Name"></label></header><div class="sp-iem-mix-options"><div><span>Monitor-Mix</span><div role="group" aria-label="IEM '+(i+1)+' Mono oder Stereo">'+choice(m,'mode','mono','Mono')+choice(m,'mode','stereo','Stereo L / R')+'</div></div><div><span>Verbindung zum Musiker</span><div role="group" aria-label="IEM '+(i+1)+' Funk oder Kabel">'+choice(m,'transport','wireless','Funk')+choice(m,'transport','cable','Kabel')+'</div></div></div>'+(m.transport==='wireless'?'<label class="sp-field sp-iem-frequency">Frequenzbereich · optional<input data-iem-frequency maxlength="100" value="'+esc(m.frequencyBand)+'" placeholder="z. B. 470–526 MHz" aria-label="IEM '+(i+1)+' Frequenzbereich"></label>':'')+'<div class="sp-iem-connection"><div class="sp-iem-aux">'+aux+'</div><div class="sp-iem-patch"><span class="sp-iem-section-label">Physischer Ausgang</span>'+patch+'<button type="button" class="sp-button" data-iem-patch="'+m.id+'">'+(rows.some(row=>row?.stagebox)?'Ausgänge ändern':'Ausgänge verbinden')+' →</button></div></div></section>';
  }).join('');
  $('sp-iem-set-undo').disabled=!history.length;
}
function initializeIemMonitorEditor(){
  const dialog=document.createElement('dialog');dialog.id='sp-iem-monitor-dialog';dialog.className='sp-iem-monitor-dialog';dialog.setAttribute('aria-labelledby','sp-iem-set-heading');
  dialog.innerHTML='<header class="sp-iem-set-head"><div><span class="sp-eyebrow">MONITORING</span><h2 id="sp-iem-set-heading" tabindex="-1">IEM-Monitore</h2><p>Ein eigener Mix pro Musiker:in – direkt mit dem Routing verbunden.</p></div><button type="button" id="sp-iem-set-close" aria-label="IEM-Monitore schließen">×</button></header><div class="sp-iem-set-body"><section class="sp-iem-set-quantity"><div><strong>Wie viele IEMs?</strong><small>Ein IEM steht für einen Monitor-Mix.</small></div><div><button type="button" id="sp-iem-count-less" aria-label="Ein IEM weniger">−</button><output id="sp-iem-set-count" aria-live="polite">1</output><button type="button" id="sp-iem-count-more" aria-label="Ein IEM mehr">+</button></div></section><p id="sp-iem-set-summary" class="sp-muted"></p><p id="sp-iem-set-error" class="sp-error" role="alert" hidden></p><div id="sp-iem-set-mixes"></div></div><footer><span id="sp-iem-set-save-status" role="status"></span><button type="button" id="sp-iem-set-undo" class="sp-button">Rückgängig</button><button type="button" id="sp-iem-set-done" class="sp-button sp-primary">Fertig</button></footer>';
  root.appendChild(dialog);
  const syncSaveStatus=()=>{const source=$('sp-header-draft-status'),status=$('sp-iem-set-save-status');status.textContent=source.textContent;status.title=source.parentElement.title;status.dataset.state=source.parentElement.dataset.state;};
  new MutationObserver(syncSaveStatus).observe($('sp-header-draft-status'),{childList:true,subtree:true,characterData:true});syncSaveStatus();
  const finish=()=>{if(dialog.querySelector('[aria-invalid="true"]')){$('sp-iem-set-error').hidden=false;return;}dialog.close();};
  $('sp-iem-set-close').addEventListener('click',finish);$('sp-iem-set-done').addEventListener('click',finish);
  dialog.addEventListener('cancel',e=>{if(dialog.querySelector('[aria-invalid="true"]')){e.preventDefault();$('sp-iem-set-error').hidden=false;}});
  dialog.addEventListener('click',e=>{
    const o=objects.find(o=>o.id===iemEditingId);if(!o)return;
    if(e.target.closest('#sp-iem-set-undo')){undo(false);renderIemMonitors();return;}
    if(dialog.querySelector('[aria-invalid="true"]'))return;
    const count=e.target.closest('#sp-iem-count-less,#sp-iem-count-more');
    if(count){if(commitIemSet(o,StageplotIem.resize(iemSetRows(o),iemSetRows(o).length+(count.id==='sp-iem-count-more'?1:-1))))renderIemMonitors();return;}
    const card=e.target.closest('[data-iem-mix]'),button=e.target.closest('[data-iem-field]');
    if(button&&card){const mixes=iemSetRows(o),mix=mixes.find(m=>m.id===card.dataset.iemMix);mix[button.dataset.iemField]=button.dataset.iemValue;if(commitIemSet(o,mixes))renderIemMonitors();return;}
    const patch=e.target.closest('[data-iem-patch]');
    if(patch){const mixes=iemSetRows(o);if(!commitIemSet(o,mixes))return;const mix=mixes.find(m=>m.id===patch.dataset.iemPatch),row=stage.routing.outputs.find(row=>row.sourceKey===o.id+':'+mix.ports[0]);openAudioPatch('outputs',row.id);}
  });
  dialog.addEventListener('change',e=>{
    const field=e.target,card=field.closest('[data-iem-mix]'),o=objects.find(o=>o.id===iemEditingId);if(!card||!o)return;
    if(!field.checkValidity()){field.setAttribute('aria-invalid','true');$('sp-iem-set-error').textContent=field.validationMessage;$('sp-iem-set-error').hidden=false;return;}
    const mixes=iemSetRows(o),mix=mixes.find(m=>m.id===card.dataset.iemMix);if(field.hasAttribute('data-iem-name'))mix.name=field.value;else if(field.hasAttribute('data-iem-frequency'))mix.frequencyBand=field.value;else if(field.hasAttribute('data-iem-aux'))mix.aux[Number(field.dataset.iemAux)]=field.value;else return;
    if(commitIemSet(o,mixes)){field.removeAttribute('aria-invalid');$('sp-iem-set-error').hidden=true;const saved=iemSetRows(o).find(m=>m.id===mix.id);if(field.hasAttribute('data-iem-aux'))field.value=saved.aux[Number(field.dataset.iemAux)]||'';if(field.hasAttribute('data-iem-name'))field.value=saved.name;}else field.setAttribute('aria-invalid','true');
  });
  $('sp-audio-connect-dialog').addEventListener('close',()=>{if(dialog.open)renderIemMonitors();});
  root.addEventListener('click',e=>{const button=e.target.closest('[data-iem-monitors]');if(button)openIemMonitors(button.dataset.iemMonitors);});
}
initializeIemMonitorEditor();
