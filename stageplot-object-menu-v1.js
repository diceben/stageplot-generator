/* Object actions share the host's selection, history and existing editors.
 * No project data or storage is owned by this view. */
const StageplotObjectMenu = (() => {
  const angle = value => ((Number(value) || 0) % 360 + 360) % 360;
  const delta = (a, b) => ((a - b + 540) % 360) - 180;
  // Physical artwork layers remain fixed: podiums below equipment, mic feet
  // below equipment and mic arms above it. Reorder only within the same layer.
  function previous(list, object, catalog) {
    const band = o => catalog[o.type]?.underlay ? 'floor' : o.type === 'mic' ? 'mic' : 'equipment';
    for (let i = list.indexOf(object) - 1; i >= 0; i--) if (band(list[i]) === band(object)) return list[i];
    return null;
  }
  function snap(value, held = null, fine = false) {
    if (held !== null && Math.abs(delta(value, held)) <= (fine ? 2 : 5.4)) return {value:angle(held), held};
    const nearest = Math.round(value / 45) * 45;
    return Math.abs(delta(value, nearest)) <= (fine ? 1 : 3) ? {value:angle(nearest), held:nearest} : {value:angle(value), held:null};
  }
  function mount(host, api) {
    const el = document.createElement('div');
    el.id = 'sp-object-menu'; el.hidden = true; el.setAttribute('role','group'); el.setAttribute('aria-label','Objektaktionen');
    const paths = {
      edit:'<path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14z"/>',
      rotate:'<path d="M20 8V3l-3 3a8 8 0 1 0 3 9M20 8h-5"/>',
      label:'<path d="M3 5h18v14H3zM7 15l3-6 3 6m-5-2h4m4-1h2m-2 3h2"/>',
      duplicate:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5V4H4v12h1"/>',
      lock:'<path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10"/><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M12 14v3"/>',
      close:'<path d="m6 6 12 12M6 18 18 6"/>',
      delete:'<path d="M5 7h14M9 7V4h6v3m2 0-.7 13H7.7L7 7M10 11v5m4-5v5"/>'
    };
    const icon = key => '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[key]+'</svg>';
    const actions = [['edit','Bearbeiten'],['rotate','Drehen'],['label','Label'],['duplicate','Duplizieren'],['lock','Sperren'],['backward','Ebene zurück']];
    el.innerHTML = actions.map(([key,text],i)=>'<div class="som-orbit" style="--i:'+i+'"><button type="button" class="som-orb" data-action="'+key+'">'+(key==='backward'?'<img src="./stageplot-assets/toolbar/send-backward-v1.png" alt="" width="34" height="30">':icon(key))+'<span>'+text+'</span></button></div>').join('')+
      '<div class="som-dial" hidden><div class="som-track"></div>'+Array.from({length:8},(_,i)=>'<i class="som-tick" style="--tick:'+i*45+'deg"></i>').join('')+'<button type="button" class="som-dial-hit" aria-label="Objekt mit dem Drehring drehen"></button><button type="button" class="som-grip" role="slider" aria-label="Drehwinkel" aria-valuemin="0" aria-valuemax="359"></button><button type="button" class="som-reset" data-action="reset" aria-label="Drehung zurücksetzen">0°</button></div>'+
      '<form class="som-editor" hidden aria-label="Objekt bearbeiten"><h3></h3><label>Beschriftung<textarea name="label" rows="2"></textarea></label><label class="som-steps" hidden>Stufen<input name="steps" type="number" min="1" max="24" step="1" inputmode="numeric"></label><button type="button" data-action="model" hidden>Modell wechseln</button><button type="button" data-action="special" hidden></button><button type="button" data-action="properties">Alle Eigenschaften</button><div class="som-edit-actions"><button type="button" data-action="back">Zurück</button><button type="submit">Übernehmen</button></div></form>'+
      '<div class="som-edge"><button type="button" data-action="close">'+icon('close')+'<span>Schließen</span></button><button type="button" class="som-delete" data-action="delete">'+icon('delete')+'<span>Löschen</span></button></div>';
    const glitter = document.createElement('div');
    glitter.className='som-glitter-plane';glitter.setAttribute('aria-hidden','true');
    host.append(el,glitter);
    const $ = selector => el.querySelector(selector), button = key => $('[data-action="'+key+'"]');
    const dial = $('.som-dial'), grip = $('.som-grip'), form = $('.som-editor'), orbits = [...el.querySelectorAll('.som-orbit')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current = null, dismissed = null, mode = 'main', gesture = null, suppressedClick = false, ignoreTimer = 0, dialRadius = 104;
    const active = () => !el.hidden && current;
    function paintAngle() {
      const a = angle(current.angle), r = dialRadius, t = a * Math.PI / 180;
      grip.style.transform = 'translate('+Math.sin(t)*r+'px,'+(r-Math.cos(t)*r)+'px)';
      grip.textContent = Math.round(a)+'°'; grip.setAttribute('aria-valuenow',String(Math.round(a)%360));
      grip.setAttribute('aria-valuetext',Math.round(a)+' Grad');
      grip.dataset.snapped = String(gesture?.held !== null && !!gesture);
      el.querySelectorAll('.som-tick').forEach((tick,i)=>tick.dataset.active=String(Math.abs(delta(a,i*45))<.1));
    }
    function endGesture(cancel = false) {
      if (!gesture) return;
      const g = gesture; gesture = null;
      if (g.target.hasPointerCapture(g.pointer)) g.target.releasePointerCapture(g.pointer);
      api.endRotation(g.token,cancel); if (current) paintAngle();
    }
    function setMode(next, focus = false, refresh = true) {
      endGesture(); const prior=mode; mode = next;
      if(prior!==next)orbits.forEach(orbit=>orbit.getAnimations().forEach(a=>a.cancel()));
      el.dataset.mode = mode;
      dial.hidden = mode !== 'rotate'; form.hidden = mode !== 'edit';
      orbits.forEach(orbit=>{orbit.hidden=mode!=='main';});
      if (mode === 'rotate') { paintAngle(); if(focus)grip.focus({preventScroll:true}); }
      if (mode === 'edit') {
        form.querySelector('h3').textContent = current.kind;
        form.elements.label.value = current.label; form.elements.label.maxLength=current.type==='text'?240:42;
        $('.som-steps').hidden = current.type !== 'stage-stairs'; form.elements.steps.value = current.steps || 5;
        button('special').hidden=!current.special; button('special').textContent=current.special||'';
        button('model').hidden=!current.modelFamily;
        if(focus)form.elements.label.focus({preventScroll:true});
      }
      if (mode === 'main' && focus) button('edit').focus({preventScroll:true});
      if(current&&refresh)sync(current);
      if(refresh&&prior!==mode&&!el.hidden&&!reduced.matches){
        if(mode==='main')animateOpen();
        else if(mode==='rotate')dial.animate([{transform:'scale(.78)',opacity:0},{transform:'scale(1.035)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:300,easing:'ease-out'});
      }
    }
    function dismiss() { endGesture();if(current)setMode('main',false,false);dismissed=current?.id;el.hidden=true;api.focusCanvas(); }
    function animateOpen() {
      orbits.forEach((orbit,i)=>{
        orbit.getAnimations().forEach(a=>a.cancel());
        if(reduced.matches)return;
        const x=Number(orbit.dataset.x),y=Number(orbit.dataset.y);
        orbit.animate([
          {transform:'translate(0,0) scale(.12)',opacity:0,offset:0},
          {transform:'translate('+x*1.045+'px,'+y*1.045+'px) scale(1.18)',opacity:1,offset:.62},
          {transform:'translate('+x*.985+'px,'+y*.985+'px) scale(.965)',opacity:1,offset:.82},
          {transform:'translate('+x+'px,'+y+'px) scale(1)',opacity:1,offset:1}
        ],{duration:440,delay:i*24,easing:'cubic-bezier(.22,.7,.3,1)',fill:'backwards'});
      });
    }
    function sync(state) {
      if(!state) { endGesture();current=null;dismissed=null;el.hidden=true;return; }
      // Selection is painted on pointerup. Starting before that redraw stalls
      // the entrance animation halfway through; keep existing menus in place.
      if(state.pointerDown&&!state.dragging&&(state.id!==current?.id||el.hidden)){el.hidden=true;return;}
      const changed=state.id!==current?.id, typeChanged=state.type!==current?.type, opening=changed||el.hidden;
      if(changed){endGesture();if(dismissed!==state.id)dismissed=null;}
      current=state;
      if(dismissed===state.id){el.hidden=true;return;}
      el.hidden=false;el.dataset.objectId=state.id;el.dataset.dragging=String(state.dragging);
      if(changed)setMode('main',false,false);
      else if(typeChanged&&mode==='edit')setMode('edit',false,false);
      button('edit').disabled=button('rotate').disabled=button('delete').disabled=state.locked;
      button('backward').disabled=state.locked||!state.canBack;
      button('lock').setAttribute('aria-pressed',String(state.locked));button('lock').querySelector('span').textContent=state.locked?'Entsperren':'Sperren';
      button('label').setAttribute('aria-pressed',String(state.showLabel));button('label').setAttribute('aria-label',state.showLabel?'Label ausblenden':'Label einblenden');
      button('backward').title=state.canBack?'Eine Ebene zurück':'Bereits auf der untersten Ebene dieses Objekttyps';
      const viewport=state.viewport||{left:0,top:0,width:host.clientWidth,height:host.clientHeight};
      const w=viewport.width,h=viewport.height,small=w<420,short=h<330,r=small?98:116,gap=small?78:88;
      let x=viewport.left+Math.max(r+40,Math.min(w-r-40,state.x-viewport.left)),y=viewport.top+Math.max(136,Math.min(h-gap-106,state.y-viewport.top)),edgeY=gap+49,edgeX=-103;
      if(short){
        x=viewport.left+Math.max(114,Math.min(w-114,state.x-viewport.left));
        y=viewport.top+Math.max(56,Math.min(h-118,state.y-viewport.top));edgeY=64;
        if(mode==='rotate'){x=viewport.left+Math.max(84,Math.min(w-302,state.x-viewport.left));y=viewport.top+Math.max(84,Math.min(h-84,state.y-viewport.top));edgeX=92;edgeY=-27;}
        if(mode==='edit'){y=viewport.top+h/2;edgeY=h/2-58;}
      }
      dialRadius=short?58:104;el.style.setProperty('--som-radius',dialRadius+'px');
      el.style.left=x+'px';el.style.top=y+'px';el.style.setProperty('--edge-y',edgeY+'px');el.style.setProperty('--edge-x',edgeX+'px');el.dataset.compact=String(small);el.dataset.short=String(short);
      orbits.forEach((orbit,i)=>{
        const x=short?(i%3-1)*78:i%2?r:-r,y=short?(Math.floor(i/3)-.5)*60:(Math.floor(i/2)-1)*gap;
        orbit.dataset.x=String(x);orbit.dataset.y=String(y);
        orbit.style.setProperty('--x',x+'px');orbit.style.setProperty('--y',y+'px');
      });
      // Avoid a synchronous layout read on each selection/drag update.
      if(mode==='edit'){
        form.style.maxHeight=Math.max(80,y+edgeY-viewport.top-20)+'px';
        form.style.bottom='auto';form.style.top=(edgeY-12-form.offsetHeight)+'px';
      }
      if(mode==='rotate')paintAngle();
      if(state.dragging)orbits.forEach(orbit=>orbit.getAnimations().forEach(a=>a.cancel()));
      else if(opening&&mode==='main')animateOpen();
    }
    function commitForm() {
      if(!form.reportValidity())return false;
      api.edit({label:form.elements.label.value,steps:Number(form.elements.steps.value)});return true;
    }
    form.addEventListener('submit',event=>{event.preventDefault();if(commitForm())setMode('main',true);});
    el.addEventListener('click',event=>{
      const b=event.target.closest('[data-action]');if(!b||b.disabled||!active()||current.dragging)return;
      const action=b.dataset.action;
      if(action==='close'){dismiss();return;}
      if(action==='back'){setMode('main',true);return;}
      if(action==='edit'||action==='rotate'){setMode(action,true);return;}
      if(['properties','special','model'].includes(action)){if(commitForm()){api.action(action,b);if(action==='properties')dismiss();}return;}
      api.action(action,b);
    });
    // Outside click consumes only the submenu level. Do not hand that same
    // pointer event to the canvas, a different object or another command.
    function handleOutsidePointer(event) {
      if(!active()||gesture||event.button!==0||api.modalOpen()||el.contains(event.target))return;
      if(mode==='main'){
        // Keep the menu attached while its own object/label is being grabbed.
        const target=event.target.closest('[data-object],[data-mic-object],[data-label-for]');
        if([target?.dataset.object,target?.dataset.micObject,target?.dataset.labelFor].includes(current.id))return;
        dismissed=current.id;el.hidden=true;return;
      }
      event.preventDefault();event.stopImmediatePropagation();setMode('main');api.focusCanvas();
      suppressedClick=true;clearTimeout(ignoreTimer);ignoreTimer=setTimeout(()=>suppressedClick=false,600);
    }
    document.addEventListener('pointerdown',handleOutsidePointer,true);
    document.addEventListener('click',event=>{if(suppressedClick){suppressedClick=false;clearTimeout(ignoreTimer);event.preventDefault();event.stopImmediatePropagation();}},true);
    document.addEventListener('keydown',event=>{
      if(!active()||api.modalOpen())return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(gesture)endGesture(true);else if(mode!=='main'){setMode('main',true);}else dismiss();}
    },true);
    function startRotation(event) {
      if(event.button!==0||gesture||current.locked)return;
      event.preventDefault();event.stopPropagation();const rect=dial.getBoundingClientRect(),cx=rect.left+dialRadius,cy=rect.top+dialRadius;
      const theta=Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI;
      gesture={pointer:event.pointerId,target:event.currentTarget,cx,cy,last:theta,value:current.angle,held:null,token:api.beginRotation()};
      event.currentTarget.setPointerCapture(event.pointerId);grip.focus({preventScroll:true});
    }
    for(const target of [$('.som-dial-hit'),grip]) {
      target.addEventListener('pointerdown',startRotation);
      target.addEventListener('pointermove',event=>{
        if(!gesture||event.pointerId!==gesture.pointer)return;
        const g=gesture,theta=Math.atan2(event.clientY-g.cy,event.clientX-g.cx)*180/Math.PI,fine=Math.hypot(event.clientX-g.cx,event.clientY-g.cy)>dialRadius*1.5;
        g.value+=delta(theta,g.last)*(fine?.35:1);g.last=theta;
        const result=snap(g.value,g.held,fine);g.held=result.held;api.rotate(result.value);current.angle=result.value;paintAngle();
      });
      target.addEventListener('pointerup',()=>endGesture());
      target.addEventListener('pointercancel',()=>endGesture(true));
      target.addEventListener('lostpointercapture',()=>endGesture(true));
    }
    grip.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();if(gesture)return;const token=api.beginRotation(),step=event.shiftKey?15:1;
      api.rotate(event.key==='Home'?0:angle(current.angle+(['ArrowLeft','ArrowDown'].includes(event.key)?-step:step)));api.endRotation(token,false);
    });
    window.addEventListener('blur',()=>endGesture(true));
    function sparkle(button, point = null, trail = false) {
      if(reduced.matches||button.disabled||current?.dragging||!active()||glitter.childElementCount>100)return;
      const area=glitter.getBoundingClientRect(),rect=button.getBoundingClientRect(),count=trail?2:14;
      const fragment=document.createDocumentFragment(),particles=[];
      for(let i=0;i<count;i++){
        const a=Math.random()*Math.PI*2,radius=Math.min(rect.width,rect.height)*(.36+Math.random()*.18);
        const x=point?point.x-area.left:rect.left-area.left+rect.width/2+Math.cos(a)*radius;
        const y=point?point.y-area.top:rect.top-area.top+rect.height/2+Math.sin(a)*radius;
        const dot=document.createElement('i'),size=1.1+Math.random()*1.8;
        dot.className='som-spark';dot.dataset.glint=String(!trail&&i%5===0);
        Object.assign(dot.style,{left:x+'px',top:y+'px',width:size+'px',height:size+'px'});
        if(i%3===0)dot.style.setProperty('--spark-color','light-dark(#758d29,#f4ffd7)');
        const dx=Math.cos(a)*(12+Math.random()*23),dy=Math.sin(a)*17-12-Math.random()*20;
        fragment.append(dot);particles.push({dot,dx,dy});
      }
      glitter.append(fragment);
      for(const {dot,dx,dy} of particles){
        const animation=dot.animate([
          {transform:'translate(0,0) scale(.35)',opacity:0},
          {transform:'translate('+dx*.2+'px,'+dy*.2+'px) scale(1.25)',opacity:1,offset:.18},
          {transform:'translate('+dx*.7+'px,'+dy*.7+'px) scale(.8)',opacity:.7,offset:.65},
          {transform:'translate('+dx+'px,'+dy+'px) scale(.15)',opacity:0}
        ],{duration:trail?460:600+Math.random()*300,delay:trail?0:Math.random()*65,easing:'ease-out',fill:'backwards'});
        animation.onfinish=()=>dot.remove();animation.oncancel=()=>dot.remove();
      }
    }
    el.querySelectorAll('.som-orb,.som-edge button').forEach(button=>{
      let lastDust=0;
      button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')sparkle(button);});
      button.addEventListener('pointermove',event=>{
        if(event.pointerType==='touch'||event.buttons||performance.now()-lastDust<65)return;
        lastDust=performance.now();sparkle(button,{x:event.clientX,y:event.clientY},true);
      });
      button.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')sparkle(button);});
      button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))sparkle(button);});
    });
    return {sync,reopen(id){if(id===current?.id||id===dismissed)dismissed=null;},dismissFor(id){endGesture();dismissed=id;el.hidden=true;},isRotating:()=>!!gesture};
  }
  return {mount,previous,angle,delta,snap};
})();
if(typeof module!=='undefined')module.exports=StageplotObjectMenu;
