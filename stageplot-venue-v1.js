/* House-plan editor and annotations. Depends on the local StageplotGeometry module. */
(function(root){
  'use strict';
  const G=root.StageplotGeometry, NS='http://www.w3.org/2000/svg';
  const num=n=>Number(n.toFixed(2)).toLocaleString('de-AT'), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function svgEl(tag,attrs,parent,text){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;parent.append(n);return n;}
  function bounds(p){const points=G.ring(p);return {minX:Math.min(...points.map(v=>v[0])),minY:Math.min(...points.map(v=>v[1])),maxX:Math.max(...points.map(v=>v[0])),maxY:Math.max(...points.map(v=>v[1]))};}
  const toolIcons={
    rect:'M5 7H35V25H5Z',round:'M5 4H35V17Q20 34 5 17Z',circle:'M35 16A15 11 0 1 1 5 16A15 11 0 1 1 35 16Z',
    trapezoid:'M11 6H29L36 26H4Z',thrust:'M4 5H36V16H24V29H16V16H4Z',t:'M4 3H36V12H24V21H32V29H8V21H16V12H4Z',
    wings:'M10 4H30V10H38V25H30V29H10V25H2V12H10Z',l:'M5 5H35V15H19V27H5Z',u:'M5 5H35V27H25V15H15V27H5Z',
    notch:'M4 5H36V17H25V27H4ZM29 20H36M29 23H36M29 26H36',irregular:'M5 5H29L36 12V27H10L5 21Z',
    segment:'M4 8H36A16 16 0 0 1 4 8Z',opening:'M4 4H36V28H4ZM14 11H26V21H14Z','opening-ellipse':'M4 4H36V28H4ZM30 16A10 7 0 1 1 10 16A10 7 0 1 1 30 16Z',column:'M28 16A8 8 0 1 1 12 16A8 8 0 1 1 28 16ZM15 11L25 21M25 11L15 21',
    wall:'M4 10H36V22H4ZM10 10L4 16M20 10L8 22M30 10L18 22M36 14L28 22',door:'M4 24H11M29 24H36M11 24V6A18 18 0 0 1 29 24',
    stairs:'M7 4H33V28H7ZM7 10H33M7 16H33M7 22H33',ramp:'M7 4H33V28H7ZM20 25V8M15 13L20 8L25 13',
    curtain:'M4 5H36M6 5V27L12 21L16 27V5M24 5V27L28 21L34 27V5',reserve:'M5 5H35V27H5ZM10 10L30 22M30 10L10 22',
    foh:'M5 7H35V25H5ZM10 12H30M12 16V22M20 16V22M28 16V22'
  };
  const presets=[['rect','Rechteck'],['round','Runde Vorbühne'],['circle','Kreis / Oval'],['trapezoid','Trapez'],['thrust','Steg'],['t','T-Form'],['wings','Seitenbühnen'],['l','L-Form'],['u','U-Form'],['notch','Treppenausschnitt'],['irregular','Freier Grundriss']];
  const elements=[['floor','Bühnenfläche','rect'],['segment','Runde Vorbühne'],['ellipse','Kreis / Oval','circle'],['opening','Ausschnitt / Öffnung'],['opening-ellipse','Runder Ausschnitt'],['column','Säule'],['wall','Wand'],['door','Tür / Zugang'],['stairs','Treppe'],['ramp','Rampe'],['curtain','Vorhang / Portal'],['reserve','Fläche freihalten'],['foh','FOH-Bereich']];
  const toolCards=(list,action)=>list.map(([kind,label,icon])=>'<button type="button" class="sv-tool-card" data-action="'+action+'" data-kind="'+kind+'" aria-label="'+label+(action==='add'?' hinzufügen':' als Grundform hinzufügen')+'"><svg viewBox="0 0 40 32" aria-hidden="true"><path d="'+toolIcons[icon||kind]+'"/></svg><span>'+label+'</span></button>').join('');
  const actionIcons={left:'<path d="M8.2 7H4V2.8M4.4 7.1A8.2 8.2 0 1 1 4 15"/>',right:'<path d="M15.8 7H20V2.8M19.6 7.1A8.2 8.2 0 1 0 20 15"/>',behind:'<rect x="7" y="4" width="12" height="10" rx="2"/><rect x="5" y="10" width="12" height="10" rx="2"/><path d="M12 7v8m-3-3 3 3 3-3"/>',lock:'<path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10"/><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M12 14v3"/>',duplicate:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5V4H4v12h1"/>',remove:'<path d="m7.5 7.5 9 9m0-9-9 9"/>'};
  const actionButton=(action,label,icon,caption='',extra='')=>'<button type="button" class="sp-button sp-object-tool '+(caption?'sp-rotate-tool ':'')+(action==='remove'?'sp-remove-tool':'')+'" data-part-action="'+action+'" aria-label="'+label+'" data-tooltip="'+label+'" '+extra+'>'+(icon?'<svg viewBox="0 0 24 24" aria-hidden="true">'+actionIcons[icon]+'</svg>':'')+(caption?'<span>'+caption+'</span>':'')+'</button>';
  const actionToolbar='<div class="sv-part-toolbar sp-object-rotate" role="group" aria-label="Grundrisselement bearbeiten" hidden><div class="sp-rotate-controls" role="group" aria-label="Drehen">'+actionButton('rotate','45 Grad nach links','left','45°','data-amount="-45"')+actionButton('hold','Stufenlos nach links drehen · halten','left','↶','data-hold="-1"')+actionButton('zero','Drehung auf 0 Grad setzen',null,'0°')+actionButton('hold','Stufenlos nach rechts drehen · halten','right','↷','data-hold="1"')+actionButton('rotate','45 Grad nach rechts','right','45°','data-amount="45"')+'</div><div class="sp-edit-controls" role="group" aria-label="Elementaktionen">'+actionButton('behind','Nach hinten','behind')+actionButton('lock','Element sperren','lock','', 'aria-pressed="false"')+actionButton('duplicate','Duplizieren','duplicate')+actionButton('remove','Element entfernen','remove')+'</div></div>';
  function rotatePart(p,amount){
    const points=G.localRing(p),center=[(Math.min(...points.map(v=>v[0]))+Math.max(...points.map(v=>v[0])))/2,(Math.min(...points.map(v=>v[1]))+Math.max(...points.map(v=>v[1])))/2],before=G.transform(p,center);
    p.angle=G.round((p.angle+amount%360+360)%360);const after=G.transform(p,center);p.x=G.round(p.x+before[0]-after[0]);p.y=G.round(p.y+before[1]-after[1]);delete p.anchor;
  }
  function partBelow(g,p){const index=g.parts.indexOf(p);for(let i=index-1;i>=0;i--)if(g.parts[i].kind===p.kind&&G.overlaps(p,g.parts[i]))return g.parts[i];return null;}
  function changePart(g,id,action,amount=0){
    const p=g.parts.find(q=>q.id===id);if(!p)return id;
    if(p.locked&&!['lock','duplicate'].includes(action))return id;
    if(action==='rotate'||action==='zero')rotatePart(p,action==='zero'?-p.angle:amount);
    if(action==='lock')p.locked=!p.locked;
    if(action==='duplicate'){const q=G.part({...p,id:undefined,x:p.x+.5,y:p.y+.5,locked:false});delete q.anchor;g.parts.push(q);return q.id;}
    if(action==='remove'){
      if(p.kind==='floor'&&g.parts.filter(q=>q.kind==='floor').length===1)throw new Error('Die letzte Bühnenfläche kann nicht entfernt werden.');
      g.parts=g.parts.filter(q=>q.id!==p.id&&q.target!==p.id);for(const q of g.parts)if(q.anchor?.partId===p.id)delete q.anchor;return null;
    }
    if(action==='behind'){const below=partBelow(g,p);if(below){g.parts.splice(g.parts.indexOf(p),1);g.parts.splice(g.parts.indexOf(below),0,p);}}
    return id;
  }
  function addPreset(g,name,w,d,label){
    const next=G.preset(name,w,d),parts=next.parts.map(p=>G.part({...p,id:undefined})),ids=new Map(next.parts.map((p,i)=>[p.id,parts[i].id]));
    const area=G.compile(next).bounds,existing=g.parts.length?G.compile(g).bounds:null,dx=existing?existing.maxX+.5-area.minX:0,dy=existing?existing.minY-area.minY:0;
    const main=parts.find(p=>p.kind==='floor');if(label)main.name=label;
    for(const p of parts){
      p.x=G.round(p.x+dx);p.y=G.round(p.y+dy);
      // Template cutouts belong to the new form, never to an existing floor.
      if(p.kind==='opening')p.target=ids.get(p.target)||main.id;
      if(p.anchor)p.anchor.partId=ids.get(p.anchor.partId)||p.anchor.partId;
    }
    g.parts.push(...parts);return main.id;
  }
  function dimension(group,a,b,label,offset=16){
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<1)return;
    const nx=dy/length,ny=-dx/length,at=(p,n)=>[p[0]+nx*n,p[1]+ny*n],v=at(a,offset),w=at(b,offset),cx=(v[0]+w[0])/2,cy=(v[1]+w[1])/2;
    const line=(a,b)=>svgEl('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'var(--sp-muted)','stroke-width':.7},group);
    line(v,w);for(const p of [a,b]){line(at(p,Math.sign(offset)*3),at(p,offset+Math.sign(offset)*4));line(at(p,offset-3),at(p,offset+3));}
    let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle< -90)angle+=180;
    svgEl('text',{x:cx,y:cy,transform:'rotate('+angle+' '+cx+' '+cy+')','text-anchor':'middle','dominant-baseline':'central',fill:'var(--sp-art)','font-size':11,'paint-order':'stroke',stroke:'var(--sp-paper)','stroke-width':5,'stroke-linejoin':'round'},group,label);
  }
  function partDimensions(group,p,scale,x,y,otherParts=[]){
    const point=v=>{const a=G.transform(p,v);return [x+a[0]*scale,y+a[1]*scale];};
    if(['ellipse','segment'].includes(p.shape)||p.kind==='line'||p.shape==='rect'&&Math.min(p.w,p.d)*scale<32){
      const d=p.shape==='segment'?p.rise:p.d;
      dimension(group,point([0,0]),point([p.w,0]),num(p.w)+' m');
      dimension(group,point([p.w,0]),point([p.w,d]),num(d)+' m');
    }else{
      const points=G.vertices(p),area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0),side=area<0?-1:1;
      points.forEach((a,i)=>{const b=points[(i+1)%points.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length*scale<32)return;
        // A curved edge is dimensioned by its chord and sagitta, never by a tessellated arc length.
        const rise=a[2]||0,ux=(b[0]-a[0])/length,uy=(b[1]-a[1])/length;let clearance=Math.max(0,-rise*side);
        for(const q of otherParts){
          if(q.id===p.id||!['stairs','ramp','obstacle','line'].includes(q.kind))continue;
          const points=G.ring(q).map(v=>G.inverse(p,v)),along=points.map(v=>(v[0]-a[0])*ux+(v[1]-a[1])*uy),out=points.map(v=>((v[0]-a[0])*uy-(v[1]-a[1])*ux)*side);
          if(Math.max(...along)>0&&Math.min(...along)<length&&Math.min(...out)<=Math.max(0,-rise*side)+.15)clearance=Math.max(clearance,Math.max(...out));
        }
        const offset=side*(16+clearance*scale);
        dimension(group,point(a),point(b),num(length)+' m'+(rise?' · Bogen '+num(Math.abs(rise))+' m':''),offset);
      });
    }
  }
  function drawDetails(svg,g,{scale=1,x=0,y=0,measures=true,labels=true,editing=false,selected=null}={}){
    const group=svgEl('g',{'data-venue-details':'true','pointer-events':'none'},svg), ink='var(--sp-art)', muted='var(--sp-muted)';
    for(const p of g.parts){
      const path=G.path([G.polygon(p)],scale,x,y), b=bounds(p), cx=x+(b.minX+b.maxX)/2*scale, cy=y+(b.minY+b.maxY)/2*scale;
      const attrs={d:path,fill:'none',stroke:ink,'stroke-width':1,'fill-rule':'evenodd','data-venue-part':p.id};
      if(p.kind==='opening'&&editing&&p.id===selected)svgEl('path',{...attrs,stroke:'var(--sp-pink,#d82773)','stroke-dasharray':'5 3'},group);
      if(p.kind==='obstacle')svgEl('path',{...attrs,fill:'var(--sp-line)'},group);
      else if(p.kind==='zone')svgEl('path',{...attrs,fill:'none','stroke-dasharray':'5 3',stroke:muted},group);
      else if(p.kind==='line')svgEl('path',{...attrs,fill:muted,stroke:muted},group);
      else if(p.kind==='stairs'||p.kind==='ramp'){
        svgEl('path',{...attrs,fill:'var(--sp-paper)'},group);
        if(p.kind==='stairs')for(let i=1;i<5;i++){const a=G.transform(p,[0,p.d*i/5]),b=G.transform(p,[p.w,p.d*i/5]);svgEl('line',{x1:x+a[0]*scale,y1:y+a[1]*scale,x2:x+b[0]*scale,y2:y+b[1]*scale,stroke:muted,'stroke-width':.8},group);}
        const a=G.transform(p,[p.w/2,p.d*.8]),b=G.transform(p,[p.w/2,p.d*.2]),l=G.transform(p,[p.w/2-.12,p.d*.2+.18]),r=G.transform(p,[p.w/2+.12,p.d*.2+.18]);
        svgEl('path',{d:'M'+(x+a[0]*scale)+' '+(y+a[1]*scale)+'L'+(x+b[0]*scale)+' '+(y+b[1]*scale)+'M'+(x+l[0]*scale)+' '+(y+l[1]*scale)+'L'+(x+b[0]*scale)+' '+(y+b[1]*scale)+'L'+(x+r[0]*scale)+' '+(y+r[1]*scale),fill:'none',stroke:ink,'stroke-width':1},group);
      }
      if(labels&&(p.kind!=='opening'||editing&&p.id===selected)){
        const outside=['stairs','ramp','line'].includes(p.kind), lines=[p.name];
        if(p.height!==null)lines.push('H '+num(p.height)+' m');
        const labelY=outside?y+b.maxY*scale+12:cy-(lines.length-1)*5;
        lines.forEach((line,i)=>svgEl('text',{x:cx,y:labelY+i*11,'text-anchor':'middle',fill:ink,'font-size':9,'pointer-events':'none','paint-order':'stroke',stroke:'var(--sp-paper)','stroke-width':3,'stroke-linejoin':'round'},group,line));
      }
    }
    if(measures){
      const annotations=svgEl('g',{'data-venue-measures':'true'},group),active=editing&&g.parts.find(p=>p.id===selected);
      if(active)partDimensions(annotations,active,scale,x,y,g.parts);
      else {
        // Only the merged perimeter is dimensioned in the plan; hidden source edges stay hidden.
        const c=G.compile(g),pixel=v=>[x+v[0]*scale,y+v[1]*scale];
        if(!editing)for(const polygon of c.floor)for(const ring of polygon){
          const points=ring.slice(0,-1),area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0);
          points.forEach((a,i)=>{const b=points[(i+1)%points.length],prev=points[(i+points.length-1)%points.length],next=points[(i+2)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
            const bend=v=>Math.abs(dx*v[1]-dy*v[0])/Math.max(.000001,length*Math.hypot(...v));
            if(length*scale>=38&&(bend([a[0]-prev[0],a[1]-prev[1]])>.15||bend([next[0]-b[0],next[1]-b[1]])>.15))dimension(annotations,pixel(a),pixel(b),num(length)+' m',area<0?-16:16);
          });
        }
        if(editing){
          // Overall width/depth also cover continuous curves, which have no straight edges to label.
          const vertices=c.floor.flat(2),b={minX:Math.min(...vertices.map(v=>v[0])),maxX:Math.max(...vertices.map(v=>v[0])),minY:Math.min(...vertices.map(v=>v[1])),maxY:Math.max(...vertices.map(v=>v[1]))};
          dimension(annotations,pixel([b.minX,b.minY]),pixel([b.maxX,b.minY]),num(b.maxX-b.minX)+' m',16+(b.minY-c.bounds.minY)*scale);
          dimension(annotations,pixel([b.maxX,b.minY]),pixel([b.maxX,b.maxY]),num(b.maxY-b.minY)+' m',16+(c.bounds.maxX-b.maxX)*scale);
        }else for(const p of g.parts.filter(p=>!['floor','opening'].includes(p.kind)))partDimensions(annotations,p,scale,x,y);
      }
    }
    return group;
  }
  function rebox(p){if(!p.points)return;const minX=Math.min(...p.points.map(v=>v[0])),minY=Math.min(...p.points.map(v=>v[1])),maxX=Math.max(...p.points.map(v=>v[0])),maxY=Math.max(...p.points.map(v=>v[1])),o=G.transform(p,[minX,minY]);p.points=p.points.map(v=>[G.round(v[0]-minX),G.round(v[1]-minY),v[2]||0]);p.x=o[0];p.y=o[1];p.w=Math.max(.02,maxX-minX);p.d=Math.max(.02,maxY-minY);}
  function open(options){
    const host=options.root||document.body, returnFocus=document.activeElement;
    let g=G.normalize(options.geometry||G.legacy(options.stage)),selected=null,edge=null,history=[],future=[],drawPoints=null,drag=null,pan={x:0,y:0,zoom:1},fitArea=G.compile(g).bounds,metrics=null,lastField=null,rotateHold=null;
    const included=new Set((options.objects||[]).filter(o=>o.house).map(o=>o.id)),touches=new Map();let gesture=null;
    const dialog=document.createElement('dialog');dialog.className='sp-venue-dialog';dialog.setAttribute('aria-label','Hausgrundriss bearbeiten');
    dialog.innerHTML='<header class="sv-head"><strong>Bühnenform bearbeiten</strong><div class="sv-head-actions"><button type="button" data-action="focus-plan" aria-pressed="false">Plan vergrößern</button><button type="button" class="sv-close" data-action="close" aria-label="Grundrissbearbeitung abbrechen">×</button></div></header>'+
      '<div class="sv-tools"><div class="sv-tool-modes"><div role="group" aria-label="Werkzeugauswahl"><button type="button" data-tool-mode="add" aria-pressed="true">Bauelemente</button><button type="button" data-tool-mode="preset" aria-pressed="false">Grundformen</button></div><button type="button" data-action="draw">Umriss zeichnen</button></div><div class="sv-palette-row"><button type="button" data-action="palette-prev" aria-label="Vorherige Formen">‹</button><div class="sv-palette" data-tool-panel="add" role="group" aria-label="Bauelement hinzufügen">'+toolCards(elements,'add')+'</div><div class="sv-palette" data-tool-panel="preset" role="group" aria-label="Grundform hinzufügen" hidden>'+toolCards(presets,'preset')+'</div><button type="button" data-action="palette-next" aria-label="Weitere Formen">›</button></div><small class="sv-palette-hint">Bauelement anklicken, dann im Plan platzieren.</small></div>'+
      '<div class="sv-work"><div class="sv-plan-column"><div class="sv-canvas-tools"><div class="sv-view-actions"><button type="button" data-action="undo" aria-label="Grundriss rückgängig">↶</button><button type="button" data-action="redo" aria-label="Grundriss wiederholen">↷</button><button type="button" data-action="fit">Einpassen</button></div><div class="sv-view-options"><label><input type="checkbox" data-field="snap" checked> 10-cm-Schritte</label><label><input type="checkbox" data-field="objects"> Aufbau anzeigen</label></div><button type="button" class="sv-details-toggle" data-action="toggle-details" aria-expanded="false" aria-controls="sv-inspector">Details</button><button type="button" data-action="finish" hidden>Umriss schließen</button><button type="button" data-action="cancel-draw" hidden>Zeichnen abbrechen</button></div><div class="sv-canvas-wrap"><svg class="sv-canvas" tabindex="0" role="img" aria-label="Hausgrundriss mit bearbeitbaren Kanten"></svg>'+actionToolbar+'</div><div class="sv-plan-caption"><div class="sv-summary" aria-live="polite"></div><p class="sv-hint">Element antippen · Griffe ziehen · zwei Finger zum Zoomen</p></div></div><aside class="sv-sidebar" id="sv-inspector" aria-label="Grundrissdetails"><div class="sv-sidebar-tabs" role="group" aria-label="Detailansicht"><button type="button" data-side-view="element" aria-pressed="true">Element</button><button type="button" data-side-view="parts" aria-pressed="false">Aufbau</button><button type="button" data-side-view="house" aria-pressed="false">Haus</button><button type="button" class="sv-details-close" data-action="toggle-details" aria-label="Details schließen">×</button></div><div class="sv-side-content"><section data-side-panel="element"><div class="sv-selection"></div></section><section data-side-panel="parts" hidden><h3>Elemente im Grundriss</h3><div class="sv-parts"></div></section><section data-side-panel="house" hidden><h3>Hausangaben &amp; Inventar</h3><div class="sv-house"></div><button type="button" class="sv-save-template" data-action="save-template">Als Hausvorlage sichern</button><details><summary>Gespeicherte Hausvorlagen</summary><div class="sv-templates"></div></details></section></div></aside></div>'+
      '<div class="sv-part-menu sp-context-menu" role="menu" aria-label="Elementaktionen" hidden><button type="button" role="menuitem" data-part-action="duplicate">Duplizieren</button><button type="button" role="menuitem" data-part-action="rotate" data-amount="90">90° drehen ↻</button><button type="button" role="menuitem" data-part-action="behind">Nach hinten</button><button type="button" role="menuitem" data-part-action="lock">Sperren</button><button type="button" role="menuitem" data-part-action="remove" class="sp-danger">Löschen</button></div>'+
      '<footer><span class="sv-status" role="status"></span><button type="button" data-action="close">Abbrechen</button><button type="button" class="sv-primary" data-action="apply">Grundriss übernehmen</button></footer>';
    host.append(dialog);const $=s=>dialog.querySelector(s),canvas=$('.sv-canvas'),toolbar=$('.sv-part-toolbar'),menu=$('.sv-part-menu');
    const status=t=>$('.sv-status').textContent=t;
    function sideView(view){dialog.querySelectorAll('[data-side-view]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.sideView===view));dialog.querySelectorAll('[data-side-panel]').forEach(el=>el.hidden=el.dataset.sidePanel!==view);$('.sv-side-content').scrollTop=0;}
    function focusPlan(active){dialog.classList.toggle('sv-plan-focus',active);const button=$('[data-action="focus-plan"]');button.setAttribute('aria-pressed',String(active));button.textContent=active?'Werkzeuge einblenden':'Plan vergrößern';closePartMenu();}
    function showDetails(active){dialog.classList.toggle('sv-details-open',active);const button=$('[data-action="toggle-details"]');button.setAttribute('aria-expanded',String(active));button.textContent=active?'Details schließen':'Details';if(active)focusPlan(false);else if($('.sv-sidebar').contains(document.activeElement))button.focus({preventScroll:true});}
    const state=()=>JSON.stringify({g,included:[...included]});
    function restore(value){const s=JSON.parse(value);g=s.g;included.clear();s.included.forEach(id=>included.add(id));if(!g.parts.some(p=>p.id===selected))selected=null;edge=null;}
    function commit(fn,fit=false,field=null){const before=state();try{fn();G.syncAnchors(g);g=G.normalize(g);if(state()!==before){if(!field||lastField!==field)history.push(before);lastField=field;if(history.length>40)history.shift();future=[];}status('');field?.setCustomValidity('');if(fit)fitView();if(field)draw();else render();return true;}catch(error){const previousEdge=edge,previousSelected=selected;restore(before);edge=previousEdge;selected=previousSelected;status(error.message);if(field)field.setCustomValidity(error.message);else render();return false;}}
    function fitView(){fitArea=G.compile(g).bounds;pan={x:0,y:0,zoom:1};}
    const field=(label,key,value,type='number',extra='')=>'<label>'+label+'<input data-prop="'+key+'" type="'+type+'" value="'+esc(value??'')+'" '+(type==='number'?'step="any"':'maxlength="80"')+' '+extra+'></label>';
    function render(){
      lastField=null;
      const p=g.parts.find(p=>p.id===selected);
      $('[data-action="undo"]').disabled=!history.length;$('[data-action="redo"]').disabled=!future.length;
      $('[data-action="finish"]').hidden=!drawPoints;$('[data-action="cancel-draw"]').hidden=!drawPoints;$('[data-action="draw"]').hidden=!!drawPoints;
      $('.sv-parts').innerHTML=g.parts.map(q=>'<button type="button" data-select="'+q.id+'" aria-pressed="'+(q.id===selected)+'">'+esc(q.name)+(q.locked?' · gesperrt':'')+'</button>').join('');
      $('.sv-selection').innerHTML=p?'<h3>'+esc(p.name)+'</h3><div class="sv-fields">'+field('Name','name',p.name,'text')+field('Breite (m)','w',p.w)+field('Tiefe (m)','d',p.shape==='segment'?p.rise:p.d)+field('Position X (m)','x',p.x)+field('Position Y (m)','y',p.y)+field('Drehung (°)','angle',p.angle)+field('Höhe (m, optional)','height',p.height)+field('Hinweis','note',p.note,'text')+
        (p.shape==='segment'?field('Ausladung (m)','rise',p.rise):'')+'</div>'+(p.kind==='opening'&&p.shape==='ellipse'?'<p class="sv-hint">Gleiche Breite und Tiefe ergeben einen Kreis, unterschiedliche Maße ein Oval.</p>':'')+'<label class="sv-check"><input type="checkbox" data-prop="locked" '+(p.locked?'checked':'')+'> Element sperren</label>'+
        (p.kind==='floor'?'<label>Nutzung<select data-prop="role">'+[['stage','Spielfläche'],['side','Seitenbühne'],['backstage','Backstage']].map(([v,t])=>'<option value="'+v+'" '+(p.role===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>':'')+
        (p.kind==='opening'?'<label>Ausschnitt betrifft<select data-prop="target"><option value="">Alle Bühnenflächen</option>'+g.parts.filter(q=>q.kind==='floor').map(q=>'<option value="'+q.id+'" '+(p.target===q.id?'selected':'')+'>'+esc(q.name)+'</option>').join('')+'</select></label>':'')+
        (edge!==null&&['rect','polygon'].includes(p.shape)?edgeFields(p):'')+
        (['stairs','ramp'].includes(p.kind)?'<label>Anschlussfläche<select data-anchor="owner"><option value="">Frei platzieren</option>'+g.parts.filter(q=>q.kind==='floor'&&['rect','polygon'].includes(q.shape)).map(q=>'<option value="'+q.id+'" '+(p.anchor?.partId===q.id?'selected':'')+'>'+esc(q.name)+'</option>').join('')+'</select></label>'+(p.anchor?'<label>Anschlusskante<select data-anchor="edge">'+(g.parts.find(q=>q.id===p.anchor.partId)?G.vertices(g.parts.find(q=>q.id===p.anchor.partId)).map((v,i)=>'<option value="'+i+'" '+(p.anchor.edge===i?'selected':'')+'>Kante '+(i+1)+'</option>').join(''):'<option>Fläche fehlt – neu zuordnen</option>')+'</select></label><label>Position entlang Kante (%)<input type="number" min="0" max="100" step="any" data-anchor="t" value="'+p.anchor.t*100+'"></label>':''):'')+
        '<div class="sv-row"><button type="button" data-part-action="duplicate">Duplizieren</button><button type="button" data-part-action="remove" '+(p.locked?'disabled':'')+'>Entfernen</button></div>':'<div class="sv-empty"><h3>Element bearbeiten</h3><p>Wähle eine Fläche oder Kante im Plan. Hier kannst du Maße, Position und weitere Eigenschaften genau einstellen.</p><button type="button" data-side-view="parts">Elemente anzeigen</button></div>';
      if(p?.locked)$('.sv-selection').querySelectorAll('[data-prop]:not([data-prop="locked"]),[data-edge],[data-anchor],[data-action="insert-point"],[data-action="remove-point"],[data-action="attach-stairs"]').forEach(el=>el.disabled=true);
      $('.sv-house').innerHTML='<label>Name der Hausbühne<input type="text" maxlength="60" data-house="name" value="'+esc(g.name)+'" placeholder="z. B. Kulturhaus · großer Saal"></label><div class="sv-fields"><label>Bühnenhöhe (m)<input type="number" step="any" data-house="height" value="'+(g.height??'')+'" placeholder="unbekannt"></label><label>Lichte Höhe (m)<input type="number" step="any" data-house="clearance" value="'+(g.clearance??'')+'" placeholder="unbekannt"></label></div><label><input type="checkbox" data-house="measured" '+(g.measured?'checked':'')+'> Maße vor Ort geprüft</label><label><input type="checkbox" data-house="showModules" '+(g.showModules?'checked':'')+'> 2 × 1 m Modulraster anzeigen</label><label>Hinweise zur Location<textarea data-house="notes" maxlength="2000" rows="3">'+esc(g.notes)+'</textarea></label><p>Revision '+g.revision+' · ausgewähltes Equipment gehört zur Hausvorlage:</p>'+(options.objects||[]).map(o=>'<label class="sv-check"><input type="checkbox" data-house-object="'+o.id+'" '+(included.has(o.id)?'checked':'')+'> '+esc(o.label||o.type)+'</label>').join('');
      $('.sv-templates').innerHTML=(options.templates||[]).length?(options.templates||[]).map(t=>'<div class="sv-template"><strong>'+esc(t.name)+'</strong><small>'+new Date(t.savedAt).toLocaleDateString('de-AT')+(t.stage.geometry?' · Revision '+t.stage.geometry.revision:'')+'</small><div class="sv-row"><button type="button" data-template-load="'+t.id+'">Grundriss laden</button><button type="button" data-template-new="'+t.id+'">Neue Veranstaltung</button></div></div>').join(''):'<p>Noch keine Hausvorlagen gespeichert.</p>';
      syncPartControls();draw();
    }
    function syncPartControls(){
      const p=g.parts.find(q=>q.id===selected),below=p&&partBelow(g,p),lastFloor=p?.kind==='floor'&&g.parts.filter(q=>q.kind==='floor').length===1;
      dialog.querySelectorAll('[data-part-action]').forEach(b=>{
        const action=b.dataset.partAction;b.disabled=!p||(p.locked&&!['lock','duplicate'].includes(action))||(action==='remove'&&lastFloor)||(action==='behind'&&!below);
        if(action==='behind')b.hidden=!below;
        if(action==='lock'){
          if(b.closest('.sv-part-menu'))b.textContent=p?.locked?'Entsperren':'Sperren';
          else {const label=p?.locked?'Element entsperren':'Element sperren';b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(!!p?.locked));b.dataset.tooltip=label;}
        }
        if(action==='remove')b.title=lastFloor?'Die letzte Bühnenfläche bleibt erhalten.':'';
      });
    }
    function positionPartToolbar(){
      toolbar.hidden=!selected||!!drawPoints||!!drag||!!gesture;
      if(toolbar.hidden||rotateHold)return;
      syncPartControls();
      const shape=canvas.querySelector('[data-select-shape="'+selected+'"]');if(!shape){toolbar.hidden=true;return;}
      const r=shape.getBoundingClientRect(),wrap=$('.sv-canvas-wrap').getBoundingClientRect(),w=toolbar.offsetWidth,h=toolbar.offsetHeight;
      const left=Math.max(6,Math.min((r.left+r.right)/2-wrap.left-w/2,wrap.width-w-6)),above=r.top-wrap.top-h-30,below=r.bottom-wrap.top+35;
      toolbar.style.left=left+'px';toolbar.style.top=Math.max(6,Math.min(above>=6?above:below,wrap.height-h-6))+'px';
    }
    function closePartMenu(focus=false){if(menu.hidden)return;menu.hidden=true;if(focus)canvas.focus({preventScroll:true});}
    function openPartMenu(id,x,y){
      stopRotateHold();selected=id;edge=null;render();menu.hidden=false;
      menu.style.left=Math.max(6,Math.min(x,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(6,Math.min(y,innerHeight-menu.offsetHeight-8))+'px';
      menu.querySelector('button:not(:disabled):not([hidden])')?.focus({preventScroll:true});
    }
    function partAction(action,amount=0){
      stopRotateHold();closePartMenu();
      const changed=commit(()=>{selected=changePart(g,selected,action,amount);edge=null;});
      if(changed)canvas.focus({preventScroll:true});
    }
    function stopRotateHold(pointerId=null,cancel=false,redraw=true){
      const hold=rotateHold;if(!hold||(pointerId!==null&&hold.pointer!==pointerId))return;rotateHold=null;cancelAnimationFrame(hold.frame);
      if(hold.button.hasPointerCapture(hold.pointer))hold.button.releasePointerCapture(hold.pointer);
      if(cancel)restore(hold.before);
      else if(state()!==hold.before){history.push(hold.before);if(history.length>40)history.shift();future=[];lastField=null;}
      if(redraw)render();
    }
    function startRotateHold(e){
      const button=e.target.closest('[data-hold]'),p=g.parts.find(q=>q.id===selected);if(!button||button.disabled||!p||p.locked||e.button!==0)return;
      e.preventDefault();closePartMenu();const start=performance.now();rotateHold={pointer:e.pointerId,button,id:p.id,direction:Number(button.dataset.hold),before:state(),start,last:start,frame:0};button.setPointerCapture(e.pointerId);
      try{rotatePart(p,rotateHold.direction);G.syncAnchors(g);g=G.normalize(g);draw();}catch(error){stopRotateHold(null,true);status(error.message);return;}
      const tick=now=>{
        const hold=rotateHold;if(!hold)return;const p=g.parts.find(q=>q.id===hold.id);if(!p||p.locked){stopRotateHold();return;}
        const elapsed=Math.min(34,now-hold.last||16),speed=now-hold.start<260?28:95,previous=G.copy(g);hold.last=now;
        try{rotatePart(p,hold.direction*speed*elapsed/1000);G.syncAnchors(g);g=G.normalize(g);const angle=$('[data-prop="angle"]');if(angle)angle.value=G.round(g.parts.find(q=>q.id===hold.id).angle);draw();}
        catch(error){g=previous;stopRotateHold();status(error.message);return;}
        hold.frame=requestAnimationFrame(tick);
      };
      rotateHold.frame=requestAnimationFrame(tick);
    }
    toolbar.addEventListener('pointerdown',startRotateHold);
    toolbar.addEventListener('pointerup',e=>stopRotateHold(e.pointerId));toolbar.addEventListener('pointercancel',e=>stopRotateHold(e.pointerId,true));toolbar.addEventListener('lostpointercapture',e=>stopRotateHold(e.pointerId));
    const blurHold=()=>stopRotateHold();window.addEventListener('blur',blurHold);
    dialog.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))closePartMenu();});
    dialog.addEventListener('contextmenu',e=>{
      const target=e.target.closest('[data-select-shape],[data-part],[data-select]'),id=target?.dataset.selectShape||target?.dataset.part||target?.dataset.select;
      if(!id||drawPoints)return;e.preventDefault();openPartMenu(id,e.clientX,e.clientY);
    });
    $('.sv-work').addEventListener('scroll',()=>closePartMenu(),true);
    function edgeFields(p){const points=G.vertices(p),a=points[edge],b=points[(edge+1)%points.length];if(!a)return '';return '<div class="sv-edge"><strong>Kante '+(edge+1)+'</strong><label>Länge (m)<input data-edge="length" type="number" step="any" min="0.02" value="'+G.round(Math.hypot(b[0]-a[0],b[1]-a[1]))+'"></label><label>Rundung (m; Vorzeichen wechselt Seite)<input data-edge="rise" type="number" step="any" value="'+(a[2]||0)+'"></label><div class="sv-row"><button type="button" data-action="insert-point">Punkt ergänzen</button><button type="button" data-action="remove-point" '+(points.length<=3?'disabled':'')+'>Eckpunkt entfernen</button></div><button type="button" data-action="attach-stairs">Treppe hier ansetzen</button></div>';}
    function draw(){
      $('[data-action="undo"]').disabled=!history.length;$('[data-action="redo"]').disabled=!future.length;
      const W=Math.max(1,canvas.clientWidth),H=Math.max(1,canvas.clientHeight),b=fitArea,s=Math.max(.001,Math.min((W-84)/Math.max(.5,b.maxX-b.minX),(H-84)/Math.max(.5,b.maxY-b.minY)))*pan.zoom;
      const x=W/2-(b.minX+b.maxX)/2*s+pan.x,y=H/2-(b.minY+b.maxY)/2*s+pan.y;metrics={scale:s,x,y};canvas.setAttribute('viewBox','0 0 '+W+' '+H);canvas.replaceChildren();
      const c=G.compile(g);svgEl('title',{},canvas,'Hausgrundriss · '+num(c.area)+' m² Bodenfläche');
      const defs=svgEl('defs',{},canvas),pattern=svgEl('pattern',{id:'sv-grid',width:s,height:s,patternUnits:'userSpaceOnUse',x,y},defs);svgEl('path',{d:'M'+s+' 0H0V'+s,fill:'none',stroke:'var(--sp-line)','stroke-width':.6},pattern);
      svgEl('rect',{width:W,height:H,fill:'url(#sv-grid)'},canvas);
      svgEl('path',{d:G.path(c.floor,s,x,y),fill:'var(--sp-panel-alt,var(--sp-panel))',stroke:'var(--sp-art)','stroke-width':1.5,'fill-rule':'evenodd'},canvas);
      drawDetails(canvas,g,{scale:s,x,y,editing:true,selected});
      if($('[data-field="objects"]').checked)for(const o of options.footprints||[]){const p=G.part({x:o.x,y:o.y,w:o.w,d:o.d,angle:o.angle});const pp=G.transform(p,[-o.w/2,-o.d/2]);p.x=pp[0];p.y=pp[1];svgEl('path',{d:G.path([G.polygon(p)],s,x,y),fill:'none',stroke:'var(--sp-muted)','stroke-dasharray':'3 3','pointer-events':'none'},canvas);svgEl('text',{x:x+o.x*s,y:y+o.y*s,fill:'var(--sp-muted)','font-size':9,'text-anchor':'middle','pointer-events':'none'},canvas,o.name);}
      for(const p of g.parts){
        const active=p.id===selected,path=G.path([G.polygon(p)],s,x,y);
        svgEl('path',{d:path,fill:'transparent',stroke:active?'var(--sp-teal)':'transparent','stroke-width':active?2:1,'stroke-dasharray':active&&p.kind==='floor'?'5 4':'none','data-select-shape':p.id,style:'cursor:'+ (p.locked?'default':'move'),'fill-rule':'evenodd'},canvas);
      }
      // Grips stay on top; selecting a lower surface must not cover the hit area of a smaller one.
      for(const p of g.parts.filter(p=>p.id===selected)){
        if(p.locked||drawPoints)continue;
        if(['rect','polygon'].includes(p.shape)){const points=G.vertices(p);points.forEach((a,i)=>{const b=points[(i+1)%points.length],v=G.transform(p,a),w=G.transform(p,b);svgEl('path',{d:'M'+(x+v[0]*s)+' '+(y+v[1]*s)+'L'+(x+w[0]*s)+' '+(y+w[1]*s),stroke:'transparent','stroke-width':22,fill:'none','data-edge-handle':i,'data-part':p.id},canvas);if(edge===i)svgEl('path',{d:'M'+(x+v[0]*s)+' '+(y+v[1]*s)+'L'+(x+w[0]*s)+' '+(y+w[1]*s),stroke:'var(--sp-teal)','stroke-width':3,fill:'none','pointer-events':'none'},canvas);});
          points.forEach((v,i)=>handle(G.transform(p,v),'data-point-handle',i,p.id));
        }
        const corner=G.transform(p,[p.w,p.shape==='segment'?p.rise:p.d]);handle([corner[0]+28/s,corner[1]+28/s],'data-resize-handle','se',p.id,true);
      }
      function handle(v,key,value,id,resize=false){const group=svgEl('g',{[key]:value,'data-part':id,style:'cursor:'+(resize?'nwse-resize':'crosshair')},canvas);svgEl('circle',{cx:x+v[0]*s,cy:y+v[1]*s,r:19,fill:'transparent',stroke:'none'},group);svgEl(resize?'rect':'circle',resize?{x:x+v[0]*s-5,y:y+v[1]*s-5,width:10,height:10,rx:2,fill:'var(--sp-paper)',stroke:'var(--sp-teal)','stroke-width':2}:{cx:x+v[0]*s,cy:y+v[1]*s,r:4,fill:'var(--sp-paper)',stroke:'var(--sp-teal)','stroke-width':2},group);}
      if(drawPoints){if(drawPoints.length)svgEl('path',{d:drawPoints.map((p,i)=>(i?'L':'M')+(x+p[0]*s)+' '+(y+p[1]*s)).join(''),stroke:'var(--sp-teal)',fill:'none','stroke-width':2,'pointer-events':'none'},canvas);drawPoints.forEach(p=>svgEl('circle',{cx:x+p[0]*s,cy:y+p[1]*s,r:4,fill:'var(--sp-teal)','pointer-events':'none'},canvas));}
      $('.sv-summary').textContent=num(c.bounds.maxX-c.bounds.minX)+' × '+num(c.bounds.maxY-c.bounds.minY)+' m gesamt · '+num(c.area)+' m² Boden · '+num(c.usableArea)+' m² frei'+(G.attachmentIssues(g).length?' · '+G.attachmentIssues(g).join(' · '):'');
      positionPartToolbar();
      svgEl('text',{x:W/2,y:18,'text-anchor':'middle',fill:'var(--sp-muted)','font-size':10},canvas,'UPSTAGE · HINTEN');svgEl('text',{x:W/2,y:H-8,'text-anchor':'middle',fill:'var(--sp-muted)','font-size':10},canvas,'DOWNSTAGE · PUBLIKUM');
    }
    const local=e=>{const b=canvas.getBoundingClientRect();return [(e.clientX-b.left-metrics.x)/metrics.scale,(e.clientY-b.top-metrics.y)/metrics.scale];};
    const snap=n=>$('[data-field="snap"]').checked?Math.round(n*10)/10:n;
    function makePolygon(p){if(p.shape!=='polygon'){p.points=G.copy(G.vertices(p));p.shape='polygon';}}
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;closePartMenu();e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,[e.clientX,e.clientY]);
      if(touches.size===2){if(drag){restore(drag.before);drag=null;}const values=[...touches.values()];gesture={distance:Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1]),center:[(values[0][0]+values[1][0])/2,(values[0][1]+values[1][1])/2],pan:{...pan}};return;}
      if(drawPoints){drawPoints.push(local(e).map(snap));draw();return;}
      const point=e.target.closest('[data-point-handle]'),ed=e.target.closest('[data-edge-handle]'),resize=e.target.closest('[data-resize-handle]'),shape=e.target.closest('[data-select-shape]'),partId=(point||ed||resize)?.dataset.part||shape?.dataset.selectShape;
      if(!partId){selected=null;edge=null;render();drag={kind:'pan',start:[e.clientX,e.clientY],pan:{...pan},before:state(),pointer:e.pointerId};return;}
      selected=partId;edge=ed?Number(ed.dataset.edgeHandle):null;const p=g.parts.find(q=>q.id===selected);render();if(p.locked)return;
      drag={kind:point?'point':ed?'edge':resize?'resize':'move',index:Number(point?.dataset.pointHandle??ed?.dataset.edgeHandle??0),start:local(e),original:G.copy(p),before:state(),pointer:e.pointerId};
    });
    canvas.addEventListener('pointermove',e=>{
      if(touches.has(e.pointerId))touches.set(e.pointerId,[e.clientX,e.clientY]);
      if(gesture&&touches.size===2){const v=[...touches.values()],center=[(v[0][0]+v[1][0])/2,(v[0][1]+v[1][1])/2];pan.zoom=Math.max(.3,Math.min(6,gesture.pan.zoom*Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1])/Math.max(10,gesture.distance)));pan.x=gesture.pan.x+center[0]-gesture.center[0];pan.y=gesture.pan.y+center[1]-gesture.center[1];draw();return;}
      if(!drag||drag.pointer!==e.pointerId)return;
      if(drag.kind==='pan'){pan.x=drag.pan.x+e.clientX-drag.start[0];pan.y=drag.pan.y+e.clientY-drag.start[1];draw();return;}
      const pos=local(e),a=G.inverse(drag.original,pos),b=G.inverse(drag.original,drag.start),delta=[snap(a[0]-b[0]),snap(a[1]-b[1])],p=G.copy(drag.original);
      if(drag.kind==='move'){p.x=G.round(p.x+snap(pos[0]-drag.start[0]));p.y=G.round(p.y+snap(pos[1]-drag.start[1]));delete p.anchor;}
      else if(drag.kind==='resize'){Object.assign(p,G.resize(p,Math.max(.1,p.w+delta[0]),Math.max(.1,p.d+delta[1])));}
      else {makePolygon(p);const i=drag.index,j=(i+1)%p.points.length;if(drag.kind==='point'){p.points[i][0]+=delta[0];p.points[i][1]+=delta[1];}else{const v=p.points[i],w=p.points[j],len=Math.hypot(w[0]-v[0],w[1]-v[1]),normal=[-(w[1]-v[1])/len,(w[0]-v[0])/len],distance=snap(delta[0]*normal[0]+delta[1]*normal[1]);for(const index of [i,j]){p.points[index][0]+=normal[0]*distance;p.points[index][1]+=normal[1]*distance;}}rebox(p);}
      const previous=G.copy(g),index=g.parts.findIndex(q=>q.id===p.id);g.parts[index]=p;try{G.syncAnchors(g);g=G.normalize(g);draw();status('');}catch(error){g=previous;status(error.message);}
    });
    function end(e,cancel=false){touches.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(gesture){if(cancel)pan=gesture.pan;gesture=null;touches.clear();draw();return;}if(!drag||drag.pointer!==e.pointerId)return;const before=drag.before,kind=drag.kind;drag=null;if(cancel)restore(before);else if(kind!=='pan'&&state()!==before){try{g=G.normalize(g);history.push(before);future=[];}catch(error){restore(before);status(error.message);}}render();}
    canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));
    canvas.addEventListener('wheel',e=>{e.preventDefault();pan.zoom=Math.max(.3,Math.min(6,pan.zoom*Math.exp(-e.deltaY*.002)));draw();},{passive:false});
    function editField(e){
      const p=g.parts.find(q=>q.id===selected),el=e.target,preview=e.type==='input'?el:null;
      const edit=fn=>commit(fn,false,preview);
      if(el.dataset.prop){edit(()=>{const key=el.dataset.prop,value=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?null:Number(el.value)):el.value;if(key==='w'||key==='d')Object.assign(p,G.resize(p,key==='w'?value:p.w,key==='d'?value:p.d));else if(key==='target'){if(value)p.target=value;else delete p.target;}else if(key==='angle')rotatePart(p,value-p.angle);else p[key]=value;if(p.shape==='segment')p.d=p.rise;});}
      else if(el.dataset.edge){edit(()=>{makePolygon(p);const a=p.points[edge],b=p.points[(edge+1)%p.points.length],v=Number(el.value);if(el.dataset.edge==='rise')a[2]=v;else{const length=Math.hypot(b[0]-a[0],b[1]-a[1]);b[0]=a[0]+(b[0]-a[0])*v/length;b[1]=a[1]+(b[1]-a[1])*v/length;rebox(p);}});}
      else if(el.dataset.house)edit(()=>{g[el.dataset.house]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?null:Number(el.value)):el.value;});
      else if(el.dataset.houseObject)edit(()=>{if(el.checked)included.add(el.dataset.houseObject);else included.delete(el.dataset.houseObject);});
      else if(el.dataset.anchor)edit(()=>{if(el.dataset.anchor==='owner'){if(el.value)p.anchor={partId:el.value,edge:0,t:.5};else delete p.anchor;}else if(el.dataset.anchor==='edge')p.anchor.edge=Number(el.value);else p.anchor.t=Number(el.value)/100;});
      else draw();
    }
    dialog.addEventListener('input',editField);
    dialog.addEventListener('change',editField);

    dialog.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b||b.disabled)return;const p=g.parts.find(q=>q.id===selected),action=b.dataset.action;
      if(b.dataset.partAction){if(b.dataset.partAction==='hold'){if(e.detail===0)partAction('rotate',Number(b.dataset.hold));}else partAction(b.dataset.partAction,Number(b.dataset.amount)||0);return;}
      if(b.dataset.sideView){sideView(b.dataset.sideView);return;}
      if(action==='focus-plan'){showDetails(false);focusPlan(!dialog.classList.contains('sv-plan-focus'));return;}
      if(action==='toggle-details'){showDetails(!dialog.classList.contains('sv-details-open'));return;}
      if(b.dataset.toolMode){
        const mode=b.dataset.toolMode;dialog.querySelectorAll('[data-tool-mode]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.toolMode===mode));dialog.querySelectorAll('[data-tool-panel]').forEach(el=>el.hidden=el.dataset.toolPanel!==mode);
        $('.sv-palette-hint').textContent=mode==='add'?'Bauelement anklicken, dann im Plan platzieren.':'Grundform ergänzen · neue Formen erscheinen rechts neben dem Aufbau.';return;
      }
      if(action==='palette-prev'||action==='palette-next'){const palette=$('[data-tool-panel]:not([hidden])');palette.scrollBy({left:(action==='palette-next'?1:-1)*palette.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
      if(b.dataset.select){selected=b.dataset.select;edge=null;sideView('element');render();return;}
      if(b.dataset.templateLoad){const t=options.templates.find(t=>t.id===b.dataset.templateLoad);commit(()=>{g=G.copy(t.stage.geometry||G.legacy(t.stage));selected=g.parts[0].id;edge=null;},true);return;}
      if(b.dataset.templateNew){const t=options.templates.find(t=>t.id===b.dataset.templateNew);try{await options.onNewEvent(t);dialog.close();}catch(error){status(error.message);}return;}
      if(action==='close'){dialog.close();return;}
      if(action==='fit'){fitView();draw();return;}
      if(action==='undo'||action==='redo'){stopRotateHold();closePartMenu();const from=action==='undo'?history:future,to=action==='undo'?future:history;if(from.length){to.push(state());restore(from.pop());render();}return;}
      if(action==='draw'){drawPoints=[];status('Eckpunkte auf dem Plan antippen, dann „Umriss schließen“.');render();return;}
      if(action==='cancel-draw'){drawPoints=null;status('');render();return;}
      if(action==='finish'){if(drawPoints.length<3){status('Mindestens drei Punkte setzen.');return;}if(commit(()=>{const q=G.part({name:'Freie Bühnenfläche',shape:'polygon',points:drawPoints});rebox(q);g.parts.push(q);selected=q.id;})){drawPoints=null;render();}return;}
      if(action==='apply'||action==='save-template'){
        try{const invalid=dialog.querySelector(':invalid');if(invalid){sideView(invalid.closest('[data-side-panel]')?.dataset.sidePanel||'element');showDetails(true);invalid.reportValidity();return;}g=G.normalize(g);if(action==='save-template'){if(!g.name.trim()){status('Unter „Hausangaben“ einen Namen für die Hausbühne eingeben.');sideView('house');showDetails(true);$('[data-house="name"]').focus();return;}const saved=await options.onSaveTemplate(G.copy(g),[...included]);options.templates=saved.templates;g.revision=saved.revision;render();status('Hausvorlage gespeichert · Revision '+g.revision);}else{await options.onApply(G.copy(g),[...included]);dialog.close();}}catch(error){status(error.message);}return;
      }
      commit(()=>{
        if(action==='preset'){selected=addPreset(g,b.dataset.kind,options.stage.w,options.stage.d,b.textContent.trim());edge=null;sideView('element');showDetails(false);}
        if(action==='add'){
          const kind=b.dataset.kind,c=G.compile(g).bounds,q=G.part({x:snap((c.minX+c.maxX)/2-1),y:snap((c.minY+c.maxY)/2-.5)});
          if(kind==='segment')Object.assign(q,{name:'Vorbühne',shape:'segment',x:0,y:options.stage.d,w:options.stage.w,d:1,rise:1});
          else if(kind==='ellipse')Object.assign(q,{name:'Rundfläche',shape:'ellipse',w:2,d:2});
          else if(kind==='opening')Object.assign(q,{name:'Ausschnitt',kind:'opening'});
          else if(kind==='opening-ellipse')Object.assign(q,{name:'Runder Ausschnitt',kind:'opening',shape:'ellipse',w:2,d:2});
          else if(kind==='column')Object.assign(q,{name:'Säule',kind:'obstacle',shape:'ellipse',w:.5,d:.5});
          else if(kind==='wall')Object.assign(q,{name:'Wand',kind:'obstacle',w:2,d:.2});
          else if(kind==='door'||kind==='curtain')Object.assign(q,{name:kind==='door'?'Tür / Zugang':'Vorhang / Portal',kind:'line',w:kind==='door'?1:4,d:.08});
          else if(kind==='reserve'||kind==='foh')Object.assign(q,{name:kind==='foh'?'FOH':'Freihalten',kind:'zone',role:kind,w:2,d:2});
          else if(kind==='stairs'||kind==='ramp')Object.assign(q,{name:kind==='stairs'?'Treppe':'Rampe',kind,w:1.2,d:kind==='stairs'?1:3});
          g.parts.push(q);selected=q.id;edge=null;sideView('element');showDetails(false);
        }
        if(action==='insert-point'&&!p.locked){makePolygon(p);const a=p.points[edge],b=p.points[(edge+1)%p.points.length];a[2]=0;p.points.splice(edge+1,0,[(a[0]+b[0])/2,(a[1]+b[1])/2,0]);}
        if(action==='remove-point'&&!p.locked){makePolygon(p);p.points.splice(edge,1);edge=null;rebox(p);}
        if(action==='attach-stairs'){const q=G.part({kind:'stairs',name:'Treppe',w:1.2,d:1,anchor:{partId:p.id,edge,t:.5}});g.parts.push(q);selected=q.id;edge=null;}
      },action==='preset'||action==='add');
    });
    dialog.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Escape'){
        if(rotateHold){e.preventDefault();stopRotateHold(null,true);return;}
        if(!menu.hidden){e.preventDefault();closePartMenu(true);return;}
        if(drawPoints){e.preventDefault();drawPoints=null;status('');render();return;}
        if(dialog.classList.contains('sv-details-open')){e.preventDefault();showDetails(false);return;}
        if(selected){e.preventDefault();selected=null;edge=null;render();canvas.focus({preventScroll:true});return;}
      }
      if(e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
      if(!menu.hidden&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
        e.preventDefault();const items=[...menu.querySelectorAll('button:not(:disabled):not([hidden])')],index=items.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();return;
      }
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();stopRotateHold();closePartMenu();$('[data-action="'+(e.shiftKey?'redo':'undo')+'"]').click();return;}
      if(e.key==='ContextMenu'||e.shiftKey&&e.key==='F10'){if(selected){e.preventDefault();const r=toolbar.getBoundingClientRect();openPartMenu(selected,r.left,r.bottom);}return;}
      if(e.metaKey||e.ctrlKey||e.altKey||!selected)return;
      if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(!e.repeat)partAction('remove');return;}
      if(e.key.toLowerCase()==='r'){e.preventDefault();partAction('rotate',e.shiftKey?45:10);return;}
      const delta={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]}[e.key];
      if(delta){e.preventDefault();commit(()=>{const p=g.parts.find(q=>q.id===selected);if(p&&!p.locked){p.x=G.round(p.x+delta[0]);p.y=G.round(p.y+delta[1]);delete p.anchor;}});}
    });
    const observer=new ResizeObserver(()=>draw());observer.observe(canvas);
    dialog.addEventListener('close',()=>{stopRotateHold(null,true,false);window.removeEventListener('blur',blurHold);observer.disconnect();dialog.remove();returnFocus?.focus({preventScroll:true});options.onClose?.();},{once:true});
    dialog.showModal();render();return dialog;
  }
  root.StageplotVenue={open,drawDetails,bounds};
})(globalThis);
