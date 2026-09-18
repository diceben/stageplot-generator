/* Properties controls, in the editor's closure. No new persisted fields. */
function inspectorSinglePercussion(o) {
  return o.type === 'percussion' && o.percussion?.parts?.length === 1 ? o.percussion.parts[0] : null;
}
function inspectorAssembly(o) {
  return drumModel.isDrums(o.type) || o.type === 'percussion' && !inspectorSinglePercussion(o) || o.type === 'orchestra' && !singleOrchestraPart(o);
}
function inspectorCanSize(o) {
  return editableObjectSize(o) || !!inspectorSinglePercussion(o) || inspectorAssembly(o) || ['riser','foh'].includes(o.type) || !!byId[o.type]?.stageAccess;
}
function inspectorObjectSize(o) {
  const part = singleOrchestraPart(o);
  return part ? orchestraModel.dimensions(part) : inspectorSinglePercussion(o) ? percussionModel.dimensions(inspectorSinglePercussion(o)) : objectSize(o);
}
// Resize an assembly's footprint by moving its parts. Drum diameters, microphone
// assignments and signal IDs remain physical data, shared with the designers.
function inspectorSpreadAssembly(o, axis, factor) {
  const next = clone(o), horizontal = axis === 'w', key = horizontal ? 'x' : 'y';
  if (drumModel.isDrums(o.type)) {
    const layout = drumModel.drumLayout(o.type, o.drums), index = horizontal ? 0 : 1;
    next.drums = drumModel.normalizeDrums(o.type, o.drums);
    const center = layout.vb[index] / 2;
    for (const part of layout.parts) {
      const point = next.drums.positions[part.id] || {x:(part.x+layout.origin.x)/layout.positionVb[0],y:(part.y+layout.origin.y)/layout.positionVb[1]};
      point[key] = (layout.origin[key] + center + (part[key] - center) * factor) / layout.positionVb[index];
      next.drums.positions[part.id] = point;
    }
  } else {
    const model = o.type === 'percussion' ? percussionModel : orchestraModel;
    const layout = model.layout(o[o.type]), center = layout[horizontal ? 'minX' : 'minY'] + layout[axis]/2;
    next[o.type] = model.normalize(o[o.type]);
    for (const part of next[o.type].parts) part[key] = center + (part[key] - center) * factor;
  }
  return next;
}
function inspectorResizedObject(o, desired, axis = null) {
  if (!inspectorCanSize(o) || !normalizedObjectDimensions(desired)) return null;
  let next = clone(o);
  if (inspectorAssembly(o)) {
    for (const key of axis ? [axis] : ['w','d']) {
      if (Math.abs(objectSize(next)[key] - desired[key]) < .0005) continue;
      let low = 0, high = 32;
      const min = objectSize(inspectorSpreadAssembly(next,key,low))[key], max = objectSize(inspectorSpreadAssembly(next,key,high))[key];
      if (desired[key] < min - .0005 || desired[key] > max + .0005) return null;
      for (let n = 0; n < 32; n++) {
        const middle = (low+high)/2, size = objectSize(inspectorSpreadAssembly(next,key,middle))[key];
        if (size < desired[key]) low = middle; else high = middle;
      }
      next = inspectorSpreadAssembly(next,key,(low+high)/2);
      // Persist the same normalized coordinates that the designer will read.
      if (drumModel.isDrums(next.type)) next.drums = drumModel.normalizeDrums(next.type,next.drums);
      else next[next.type] = (next.type === 'percussion' ? percussionModel : orchestraModel).normalize(next[next.type]);
      if (Math.abs(objectSize(next)[key] - desired[key]) > .002) return null;
    }
  } else if (['riser','foh'].includes(o.type) || byId[o.type]?.stageAccess) {
    if (desired.w < .3 || desired.d < .3) return null;
    next.width = desired.w; next.depth = desired.d;
  } else {
    const solo = singleOrchestraPart(next), percussion = inspectorSinglePercussion(next), frame = stageplotTechFrame(byId[o.type].art||o.type,o);
    desired = {...desired};
    if (frame && axis) {
      if (axis === 'w') desired.d = desired.w*frame.height/frame.width;
      else desired.w = desired.d*frame.width/frame.height;
    }
    if (percussion && percussionModel.byId[percussion.type].sizes && axis) desired[axis === 'w' ? 'd' : 'w'] = desired[axis];
    if (!normalizedObjectDimensions(desired)) return null;
    if (percussion) {
      if (desired.w < .02 || desired.d < .02 || desired.w > 3 || desired.d > 3) return null;
      const automaticLabel = percussionModel.isDefaultCymbalLabel(percussion);
      percussion.width = desired.w; percussion.depth = desired.d;
      if (automaticLabel) percussion.label = percussionModel.cymbalLabel(percussion);
    } else if (solo) {
      // Orchestra normalization allows instrument dimensions from 2 cm to 5 m.
      if (desired.w < .02 || desired.d < .02 || desired.w > 5 || desired.d > 5) return null;
      solo.width = desired.w; solo.depth = desired.d;
    } else next.dimensions = desired;
  }
  return next;
}
function syncInspectorKnob(o) {
  const angle = ((Math.round(o.angle)%360)+360)%360, knob = $('sp-rotation-knob');
  knob.style.setProperty('--sp-knob-angle',angle+'deg');
  knob.setAttribute('aria-valuenow',String(angle));knob.setAttribute('aria-valuetext',angle+' Grad');
  knob.disabled = !!o.locked || sharedReadOnly;
  $('sp-rotation-reset').disabled = knob.disabled;
}
$('sp-rotation-reset').addEventListener('click',()=>{
  const o=objects.find(item=>item.id===selected);
  if(!o||o.locked||sharedReadOnly||o.angle===0)return;
  change(()=>{o.angle=0;constrain(o,false);},'Drehung: 0°');
});
function syncInspectorControls(o) {
  syncInspectorKnob(o);
  const canSize = inspectorCanSize(o), size = inspectorObjectSize(o), locked = !!o.locked || sharedReadOnly;
  $('sp-object-size-fields').hidden = !canSize;
  if (canSize) {
    for (const [id,key] of [['sp-object-width','w'],['sp-object-depth','d']]) {$(id).value=Number((size[key]*100).toFixed(2));$(id).disabled=locked;$(id).setCustomValidity('');}
    $('sp-object-size-fields').querySelector('h4').textContent = o.type === 'mic' ? 'Darstellungsgröße' : 'Größe';
    const hint = inspectorAssembly(o) ? 'Gesamter Aufbau · Instrumentmaße bleiben erhalten.' : o.type === 'mic' ? 'Rahmen einschließlich Boom; Proportionen bleiben erhalten.' : '';
    $('sp-object-size-hint').textContent=hint;$('sp-object-size-hint').hidden=!hint;
    const solo = singleOrchestraPart(o) || inspectorSinglePercussion(o);
    $('sp-object-size-reset').hidden = (!editableObjectSize(o) && !solo) || !(solo ? solo.width || solo.depth : normalizedObjectDimensions(o.dimensions));
    $('sp-object-size-reset').disabled=locked;
  }
  root.querySelectorAll('[data-inspector-scale]').forEach(button=>button.disabled=locked||!canSize);
  // Structural dimensions use the same compact controls; retain height, step
  // count and FOH requirements in their original object-specific sections.
  for (const id of ['sp-riser-fields','sp-access-fields','sp-foh-fields']) $(id).classList.add('sp-shared-dimensions');
  if (byId[o.type]?.family && compactModelFamilies.has(byId[o.type].family)) $('sp-variant-field').hidden=true;
  const routing=$('sp-inspector-routing');
  if(routing.dataset.object!==o.id){routing.dataset.object=o.id;routing.open=o.type==='di';}
  routing.querySelector('summary').textContent=o.type==='di'?'Anschlüsse':'Routing';
  routing.hidden=$('sp-audio-object').hidden&&$('sp-audio-device').hidden;
  const showOutputs=byId[o.type]?.category==='keys';
  $('sp-inspector-outputs').hidden=!showOutputs;
  if(showOutputs){
    const io=objectIo(o);
    $('sp-inspector-outputs-summary').textContent=io.outputs.count+' × '+io.outputs.connector;
    const groups=ioAliasGroups(io).filter(group=>group.kind==='outputs');
    $('sp-inspector-output-pairs').innerHTML=groups.map(group=>{
      const alias=group.ports.map(port=>io.aliases.outputs[port-1]).find(Boolean),format=group.ports.length===2?'Stereo L / R':'Mono';
      return '<button type="button" data-inspector-output aria-label="Ausgang '+group.ports.join(' und ')+' bearbeiten"'+(locked?' disabled':'')+'><strong>'+group.ports.join('–')+'</strong><span>'+esc(alias?alias+' · '+format:format)+'</span><span aria-hidden="true">↗</span></button>';
    }).join('')||'<button type="button" data-inspector-output'+(locked?' disabled':'')+'>Ausgänge einstellen →</button>';
  }
}
$('sp-inspector-output-pairs').addEventListener('click',event=>{if(event.target.closest('[data-inspector-output]:not(:disabled)'))openRoutingObjectOutputs(selected);});
for(const [id,key] of [['sp-object-width','w'],['sp-object-depth','d']]) {
  $(id).addEventListener('input',()=>{
    const o=objects.find(item=>item.id===selected),input=$(id);input.setCustomValidity('');
    if(!o||o.locked||sharedReadOnly||!input.value||!input.validity.valid)return;
    const size=inspectorObjectSize(o),next=inspectorResizedObject(o,{w:size.w,d:size.d,[key]:Number(input.value)/100},key);
    if(!next){input.setCustomValidity('Dieses Maß ist für den Aufbau nicht möglich.');return;}
    if(!editBefore)editBefore=snapshot();Object.assign(o,next);
    const actual=inspectorObjectSize(o),other=key==='w'?'d':'w';
    $(key==='w'?'sp-object-depth':'sp-object-width').value=Number((actual[other]*100).toFixed(2));
    $('sp-object-size-reset').hidden=!editableObjectSize(o)&&!inspectorSinglePercussion(o);updateInspectorIdentity(o);queueDraw();queueDraftSave();
  });
  $(id).addEventListener('change',finishEdit);
  $(id).addEventListener('blur',()=>{finishEdit();inspector();});
}
$('sp-object-size-reset').addEventListener('click',()=>{
  const o=objects.find(item=>item.id===selected);if(!o||o.locked||sharedReadOnly||(!editableObjectSize(o)&&!inspectorSinglePercussion(o)))return;
  finishEdit();change(()=>{const solo=singleOrchestraPart(o)||inspectorSinglePercussion(o);if(solo){delete solo.width;delete solo.depth;}else delete o.dimensions;},'Standardmaße wiederhergestellt');
});
$('sp-object-size-fields').addEventListener('click',event=>{
  const button=event.target.closest('[data-inspector-scale]'),o=objects.find(item=>item.id===selected);
  if(!button||button.disabled||!o||o.locked||sharedReadOnly)return;
  finishEdit();const size=inspectorObjectSize(o),factor=button.dataset.inspectorScale==='up'?1.1:1/1.1;
  const next=inspectorResizedObject(o,{w:size.w*factor,d:size.d*factor});
  if(!next){say('Größengrenze des Aufbaus erreicht.');return;}
  change(()=>{Object.assign(o,next);},'Größe angepasst');
});
let inspectorGesture=null,inspectorSuppressClick=false;
function endInspectorGesture(cancel=false,pointerId=null) {
  const gesture=inspectorGesture;if(!gesture||pointerId!==null&&pointerId!==gesture.pointer)return;
  inspectorGesture=null;
  if(gesture.moved){
    if(cancel){for(const key of Object.keys(gesture.object))delete gesture.object[key];Object.assign(gesture.object,gesture.original);persistDraft();}
    else keepHistory(gesture.before);
    inspectorSuppressClick=true;setTimeout(()=>{inspectorSuppressClick=false;},0);
    renderEditor();
  }
  if(gesture.capture.hasPointerCapture(gesture.pointer))gesture.capture.releasePointerCapture(gesture.pointer);
}
$('sp-selected').addEventListener('pointerdown',event=>{
  const knob=event.target.closest('#sp-rotation-knob'),field=event.target.closest('input[data-inspector-scrub]')||event.target.closest('.sp-scrub-mark')?.parentElement.querySelector('input'),o=objects.find(item=>item.id===selected);
  if(!knob&&!field||event.button!==0||!o||o.locked||sharedReadOnly||field?.disabled)return;
  finishEdit();const control=knob||field,box=control.getBoundingClientRect(),cx=box.x+box.width/2,cy=box.y+box.height/2;
  inspectorGesture={pointer:event.pointerId,capture:control,object:o,original:clone(o),before:snapshot(),field:field?.id,knob:!!knob,startX:event.clientX,startY:event.clientY,cx,cy,lastAngle:Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI,total:0,startValue:Number(field?.value)||0,step:Number(field?.dataset.inspectorScrub)||1,moved:false};
  control.setPointerCapture(event.pointerId);
  if(knob)event.preventDefault();
});
window.addEventListener('pointermove',event=>{
  const g=inspectorGesture;if(!g||event.pointerId!==g.pointer)return;
  if(selected!==g.object.id||g.object.locked||sharedReadOnly){endInspectorGesture(true);return;}
  if(!g.moved&&Math.hypot(event.clientX-g.startX,event.clientY-g.startY)<4)return;
  if(!g.moved){document.activeElement?.blur();g.moved=true;}
  event.preventDefault();
  if(g.knob){
    const angle=Math.atan2(event.clientY-g.cy,event.clientX-g.cx)*180/Math.PI,delta=(angle-g.lastAngle+540)%360-180;
    g.total+=delta;g.lastAngle=angle;g.object.angle=normalizeAngle(g.original.angle+g.total);
    $('sp-angle-number').value=g.object.angle;$('sp-angle').value=g.object.angle;$('sp-angle-label').textContent=g.object.angle+'°';syncInspectorKnob(g.object);
  }else{
    const value=Number((g.startValue+(event.clientX-g.startX)*g.step*(event.shiftKey ? .1 : 1)).toFixed(3));
    if(g.field==='sp-pos-x'||g.field==='sp-pos-y')g.object[g.field==='sp-pos-x'?'x':'y']=Math.max(-10000,Math.min(10000,value));
    else {
      const key=g.field==='sp-object-width'?'w':'d',size=inspectorObjectSize(g.original),next=inspectorResizedObject(g.original,{w:size.w,d:size.d,[key]:value/100},key);
      if(!next)return;Object.assign(g.object,next);
      const actual=inspectorObjectSize(g.object);$('sp-object-width').value=Number((actual.w*100).toFixed(2));$('sp-object-depth').value=Number((actual.d*100).toFixed(2));
    }
    if(g.field.startsWith('sp-pos-'))$(g.field).value=g.object[g.field==='sp-pos-x'?'x':'y'];
  }
  updateInspectorIdentity(g.object);queueDraw();queueDraftSave();
},{passive:false});
window.addEventListener('pointerup',event=>endInspectorGesture(false,event.pointerId));
window.addEventListener('pointercancel',event=>endInspectorGesture(true,event.pointerId));
$('sp-selected').addEventListener('lostpointercapture',event=>endInspectorGesture(true,event.pointerId));
$('sp-selected').addEventListener('click',event=>{if(inspectorSuppressClick){event.preventDefault();event.stopImmediatePropagation();}},true);
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspectorGesture){event.preventDefault();event.stopImmediatePropagation();endInspectorGesture(true);}},true);
window.addEventListener('blur',()=>endInspectorGesture(true));
$('sp-rotation-knob').addEventListener('keydown',event=>{
  const o=objects.find(item=>item.id===selected);if(!o||o.locked||sharedReadOnly)return;
  const delta={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1,PageUp:45,PageDown:-45}[event.key];
  if(delta===undefined&&!['Home','End'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();finishEdit();
  change(()=>{o.angle=event.key==='Home'?0:event.key==='End'?359:normalizeAngle(o.angle+delta*(event.shiftKey&&Math.abs(delta)===1?15:1));},'Drehung angepasst');
});
