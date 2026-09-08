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
    segment:'M4 8H36A16 16 0 0 1 4 8Z',opening:'M4 4H36V28H4ZM14 11H26V21H14Z',column:'M28 16A8 8 0 1 1 12 16A8 8 0 1 1 28 16ZM15 11L25 21M25 11L15 21',
    wall:'M4 10H36V22H4ZM10 10L4 16M20 10L8 22M30 10L18 22M36 14L28 22',door:'M4 24H11M29 24H36M11 24V6A18 18 0 0 1 29 24',
    stairs:'M7 4H33V28H7ZM7 10H33M7 16H33M7 22H33',ramp:'M7 4H33V28H7ZM20 25V8M15 13L20 8L25 13',
    curtain:'M4 5H36M6 5V27L12 21L16 27V5M24 5V27L28 21L34 27V5',reserve:'M5 5H35V27H5ZM10 10L30 22M30 10L10 22',
    foh:'M5 7H35V25H5ZM10 12H30M12 16V22M20 16V22M28 16V22'
  };
  const presets=[['rect','Rechteck'],['round','Runde Vorbühne'],['circle','Kreis / Oval'],['trapezoid','Trapez'],['thrust','Steg'],['t','T-Form'],['wings','Seitenbühnen'],['l','L-Form'],['u','U-Form'],['notch','Treppenausschnitt'],['irregular','Freier Grundriss']];
  const elements=[['floor','Bühnenfläche','rect'],['segment','Runde Vorbühne'],['ellipse','Kreis / Oval','circle'],['opening','Ausschnitt / Öffnung'],['column','Säule'],['wall','Wand'],['door','Tür / Zugang'],['stairs','Treppe'],['ramp','Rampe'],['curtain','Vorhang / Portal'],['reserve','Fläche freihalten'],['foh','FOH-Bereich']];
  const toolCards=(list,action)=>list.map(([kind,label,icon])=>'<button type="button" class="sv-tool-card" data-action="'+action+'" data-kind="'+kind+'" aria-label="'+label+(action==='add'?' hinzufügen':' als Grundform verwenden')+'"><svg viewBox="0 0 40 32" aria-hidden="true"><path d="'+toolIcons[icon||kind]+'"/></svg><span>'+label+'</span></button>').join('');
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
    let g=G.normalize(options.geometry||G.legacy(options.stage)),selected=null,edge=null,history=[],future=[],drawPoints=null,drag=null,pan={x:0,y:0,zoom:1},fitArea=G.compile(g).bounds,metrics=null,lastField=null;
    const included=new Set((options.objects||[]).filter(o=>o.house).map(o=>o.id)),touches=new Map();let gesture=null;
    const dialog=document.createElement('dialog');dialog.className='sp-venue-dialog';dialog.setAttribute('aria-label','Hausgrundriss bearbeiten');
    dialog.innerHTML='<header class="sv-head"><div><strong>Hausgrundriss bearbeiten</strong><small>Bühnenform, feste Einbauten und Hausvorlagen</small></div><button type="button" data-action="close" aria-label="Grundrissbearbeitung abbrechen">×</button></header>'+
      '<div class="sv-tools"><div class="sv-tool-modes"><div role="group" aria-label="Werkzeugauswahl"><button type="button" data-tool-mode="add" aria-pressed="true">Bauelemente</button><button type="button" data-tool-mode="preset" aria-pressed="false">Grundformen</button></div><button type="button" data-action="draw">Umriss zeichnen</button><button type="button" data-action="finish" hidden>Umriss schließen</button><button type="button" data-action="cancel-draw" hidden>Zeichnen abbrechen</button></div><div class="sv-palette-row"><button type="button" data-action="palette-prev" aria-label="Vorherige Formen">‹</button><div class="sv-palette" data-tool-panel="add" role="group" aria-label="Bauelement hinzufügen">'+toolCards(elements,'add')+'</div><div class="sv-palette" data-tool-panel="preset" role="group" aria-label="Grundform wählen" hidden>'+toolCards(presets,'preset')+'</div><button type="button" data-action="palette-next" aria-label="Weitere Formen">›</button></div><small class="sv-palette-hint">Bauelement anklicken, dann im Plan platzieren.</small></div>'+
      '<div class="sv-work"><div class="sv-plan-column"><div class="sv-canvas-tools"><button type="button" data-action="undo" aria-label="Grundriss rückgängig">↶</button><button type="button" data-action="redo" aria-label="Grundriss wiederholen">↷</button><button type="button" data-action="fit">Einpassen</button><label><input type="checkbox" data-field="snap" checked> 10-cm-Schritte</label><label><input type="checkbox" data-field="objects"> Aufbau anzeigen</label></div><svg class="sv-canvas" role="img" aria-label="Hausgrundriss mit bearbeitbaren Kanten"></svg><div class="sv-summary" aria-live="polite"></div><p class="sv-hint">Element antippen · Griffe ziehen · Kante für Maße und Rundung auswählen · zwei Finger zum Zoomen</p></div><aside class="sv-sidebar"><div class="sv-selection"></div><details open><summary>Elemente</summary><div class="sv-parts"></div></details><details><summary>Hausangaben &amp; festes Inventar</summary><div class="sv-house"></div></details><details><summary>Gespeicherte Hausvorlagen</summary><div class="sv-templates"></div></details></aside></div>'+
      '<footer><span class="sv-status" role="status"></span><button type="button" data-action="save-template">Als Hausvorlage sichern</button><button type="button" data-action="close">Abbrechen</button><button type="button" class="sv-primary" data-action="apply">Grundriss übernehmen</button></footer>';
    host.append(dialog);const $=s=>dialog.querySelector(s),canvas=$('.sv-canvas');
    const status=t=>$('.sv-status').textContent=t;
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
        (p.shape==='segment'?field('Ausladung (m)','rise',p.rise):'')+'</div><label class="sv-check"><input type="checkbox" data-prop="locked" '+(p.locked?'checked':'')+'> Element sperren</label>'+
        (p.kind==='floor'?'<label>Nutzung<select data-prop="role">'+[['stage','Spielfläche'],['side','Seitenbühne'],['backstage','Backstage']].map(([v,t])=>'<option value="'+v+'" '+(p.role===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>':'')+
        (p.kind==='opening'?'<label>Ausschnitt betrifft<select data-prop="target"><option value="">Alle Bühnenflächen</option>'+g.parts.filter(q=>q.kind==='floor').map(q=>'<option value="'+q.id+'" '+(p.target===q.id?'selected':'')+'>'+esc(q.name)+'</option>').join('')+'</select></label>':'')+
        (edge!==null&&['rect','polygon'].includes(p.shape)?edgeFields(p):'')+
        (['stairs','ramp'].includes(p.kind)?'<label>Anschlussfläche<select data-anchor="owner"><option value="">Frei platzieren</option>'+g.parts.filter(q=>q.kind==='floor'&&['rect','polygon'].includes(q.shape)).map(q=>'<option value="'+q.id+'" '+(p.anchor?.partId===q.id?'selected':'')+'>'+esc(q.name)+'</option>').join('')+'</select></label>'+(p.anchor?'<label>Anschlusskante<select data-anchor="edge">'+(g.parts.find(q=>q.id===p.anchor.partId)?G.vertices(g.parts.find(q=>q.id===p.anchor.partId)).map((v,i)=>'<option value="'+i+'" '+(p.anchor.edge===i?'selected':'')+'>Kante '+(i+1)+'</option>').join(''):'<option>Fläche fehlt – neu zuordnen</option>')+'</select></label><label>Position entlang Kante (%)<input type="number" min="0" max="100" step="any" data-anchor="t" value="'+p.anchor.t*100+'"></label>':''):'')+
        '<div class="sv-row"><button type="button" data-action="duplicate">Duplizieren</button><button type="button" data-action="remove" '+(p.locked?'disabled':'')+'>Entfernen</button></div>':'<p>Fläche oder Kante antippen.</p>';
      if(p?.locked)$('.sv-selection').querySelectorAll('[data-prop]:not([data-prop="locked"]),[data-edge],[data-anchor],[data-action="insert-point"],[data-action="remove-point"],[data-action="attach-stairs"]').forEach(el=>el.disabled=true);
      $('.sv-house').innerHTML='<label>Name der Hausbühne<input type="text" maxlength="60" data-house="name" value="'+esc(g.name)+'" placeholder="z. B. Kulturhaus · großer Saal"></label><div class="sv-fields"><label>Bühnenhöhe (m)<input type="number" step="any" data-house="height" value="'+(g.height??'')+'" placeholder="unbekannt"></label><label>Lichte Höhe (m)<input type="number" step="any" data-house="clearance" value="'+(g.clearance??'')+'" placeholder="unbekannt"></label></div><label><input type="checkbox" data-house="measured" '+(g.measured?'checked':'')+'> Maße vor Ort geprüft</label><label><input type="checkbox" data-house="showModules" '+(g.showModules?'checked':'')+'> 2 × 1 m Modulraster anzeigen</label><label>Hinweise zur Location<textarea data-house="notes" maxlength="2000" rows="3">'+esc(g.notes)+'</textarea></label><p>Revision '+g.revision+' · ausgewähltes Equipment gehört zur Hausvorlage:</p>'+(options.objects||[]).map(o=>'<label class="sv-check"><input type="checkbox" data-house-object="'+o.id+'" '+(included.has(o.id)?'checked':'')+'> '+esc(o.label||o.type)+'</label>').join('');
      $('.sv-templates').innerHTML=(options.templates||[]).length?(options.templates||[]).map(t=>'<div class="sv-template"><strong>'+esc(t.name)+'</strong><small>'+new Date(t.savedAt).toLocaleDateString('de-AT')+(t.stage.geometry?' · Revision '+t.stage.geometry.revision:'')+'</small><div class="sv-row"><button type="button" data-template-load="'+t.id+'">Grundriss laden</button><button type="button" data-template-new="'+t.id+'">Neue Veranstaltung</button></div></div>').join(''):'<p>Noch keine Hausvorlagen gespeichert.</p>';
      draw();
    }
    function edgeFields(p){const points=G.vertices(p),a=points[edge],b=points[(edge+1)%points.length];if(!a)return '';return '<div class="sv-edge"><strong>Kante '+(edge+1)+'</strong><label>Länge (m)<input data-edge="length" type="number" step="any" min="0.02" value="'+G.round(Math.hypot(b[0]-a[0],b[1]-a[1]))+'"></label><label>Rundung (m; Vorzeichen wechselt Seite)<input data-edge="rise" type="number" step="any" value="'+(a[2]||0)+'"></label><div class="sv-row"><button type="button" data-action="insert-point">Punkt ergänzen</button><button type="button" data-action="remove-point" '+(points.length<=3?'disabled':'')+'>Eckpunkt entfernen</button></div><button type="button" data-action="attach-stairs">Treppe hier ansetzen</button></div>';}
    function draw(){
      $('[data-action="undo"]').disabled=!history.length;$('[data-action="redo"]').disabled=!future.length;
      const W=Math.max(280,canvas.clientWidth),H=Math.max(260,canvas.clientHeight),b=fitArea,s=Math.min((W-84)/Math.max(.5,b.maxX-b.minX),(H-84)/Math.max(.5,b.maxY-b.minY))*pan.zoom;
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
      svgEl('text',{x:W/2,y:18,'text-anchor':'middle',fill:'var(--sp-muted)','font-size':10},canvas,'UPSTAGE · HINTEN');svgEl('text',{x:W/2,y:H-8,'text-anchor':'middle',fill:'var(--sp-muted)','font-size':10},canvas,'DOWNSTAGE · PUBLIKUM');
    }
    const local=e=>{const b=canvas.getBoundingClientRect();return [(e.clientX-b.left-metrics.x)/metrics.scale,(e.clientY-b.top-metrics.y)/metrics.scale];};
    const snap=n=>$('[data-field="snap"]').checked?Math.round(n*10)/10:n;
    function makePolygon(p){if(p.shape!=='polygon'){p.points=G.copy(G.vertices(p));p.shape='polygon';}}
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,[e.clientX,e.clientY]);
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
      if(el.dataset.prop){edit(()=>{const key=el.dataset.prop,value=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?null:Number(el.value)):el.value;if(key==='w'||key==='d')Object.assign(p,G.resize(p,key==='w'?value:p.w,key==='d'?value:p.d));else if(key==='target'){if(value)p.target=value;else delete p.target;}else p[key]=value;if(p.shape==='segment')p.d=p.rise;});}
      else if(el.dataset.edge){edit(()=>{makePolygon(p);const a=p.points[edge],b=p.points[(edge+1)%p.points.length],v=Number(el.value);if(el.dataset.edge==='rise')a[2]=v;else{const length=Math.hypot(b[0]-a[0],b[1]-a[1]);b[0]=a[0]+(b[0]-a[0])*v/length;b[1]=a[1]+(b[1]-a[1])*v/length;rebox(p);}});}
      else if(el.dataset.house)edit(()=>{g[el.dataset.house]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?null:Number(el.value)):el.value;});
      else if(el.dataset.houseObject)edit(()=>{if(el.checked)included.add(el.dataset.houseObject);else included.delete(el.dataset.houseObject);});
      else if(el.dataset.anchor)edit(()=>{if(el.dataset.anchor==='owner'){if(el.value)p.anchor={partId:el.value,edge:0,t:.5};else delete p.anchor;}else if(el.dataset.anchor==='edge')p.anchor.edge=Number(el.value);else p.anchor.t=Number(el.value)/100;});
      else draw();
    }
    dialog.addEventListener('input',editField);
    dialog.addEventListener('change',editField);

    dialog.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b)return;const p=g.parts.find(q=>q.id===selected),action=b.dataset.action;
      if(b.dataset.toolMode){
        const mode=b.dataset.toolMode;dialog.querySelectorAll('[data-tool-mode]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.toolMode===mode));dialog.querySelectorAll('[data-tool-panel]').forEach(el=>el.hidden=el.dataset.toolPanel!==mode);
        $('.sv-palette-hint').textContent=mode==='add'?'Bauelement anklicken, dann im Plan platzieren.':'Ersetzt den gesamten Grundriss · mit ↶ rückgängig machen.';return;
      }
      if(action==='palette-prev'||action==='palette-next'){const palette=$('[data-tool-panel]:not([hidden])');palette.scrollBy({left:(action==='palette-next'?1:-1)*palette.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
      if(b.dataset.select){selected=b.dataset.select;edge=null;render();return;}
      if(b.dataset.templateLoad){const t=options.templates.find(t=>t.id===b.dataset.templateLoad);commit(()=>{g=G.copy(t.stage.geometry||G.legacy(t.stage));selected=g.parts[0].id;edge=null;},true);return;}
      if(b.dataset.templateNew){const t=options.templates.find(t=>t.id===b.dataset.templateNew);try{await options.onNewEvent(t);dialog.close();}catch(error){status(error.message);}return;}
      if(action==='close'){dialog.close();return;}
      if(action==='fit'){fitView();draw();return;}
      if(action==='undo'||action==='redo'){const from=action==='undo'?history:future,to=action==='undo'?future:history;if(from.length){to.push(state());restore(from.pop());render();}return;}
      if(action==='draw'){drawPoints=[];status('Eckpunkte auf dem Plan antippen, dann „Umriss schließen“.');render();return;}
      if(action==='cancel-draw'){drawPoints=null;status('');render();return;}
      if(action==='finish'){if(drawPoints.length<3){status('Mindestens drei Punkte setzen.');return;}if(commit(()=>{const q=G.part({name:'Freie Bühnenfläche',shape:'polygon',points:drawPoints});rebox(q);g.parts.push(q);selected=q.id;})){drawPoints=null;render();}return;}
      if(action==='apply'||action==='save-template'){
        try{const invalid=dialog.querySelector(':invalid');if(invalid){invalid.reportValidity();return;}g=G.normalize(g);if(action==='save-template'){if(!g.name.trim()){status('Unter „Hausangaben“ einen Namen für die Hausbühne eingeben.');$('.sv-house').closest('details').open=true;$('[data-house="name"]').focus();return;}const saved=await options.onSaveTemplate(G.copy(g),[...included]);options.templates=saved.templates;g.revision=saved.revision;render();status('Hausvorlage gespeichert · Revision '+g.revision);}else{await options.onApply(G.copy(g),[...included]);dialog.close();}}catch(error){status(error.message);}return;
      }
      commit(()=>{
        if(action==='preset'){const next=G.preset(b.dataset.kind,options.stage.w,options.stage.d);Object.assign(next,{name:g.name,notes:g.notes,height:g.height,clearance:g.clearance,revision:g.revision,measured:g.measured});g=next;selected=g.parts[0].id;edge=null;}
        if(action==='add'){
          const kind=b.dataset.kind,c=G.compile(g).bounds,q=G.part({x:snap((c.minX+c.maxX)/2-1),y:snap((c.minY+c.maxY)/2-.5)});
          if(kind==='segment')Object.assign(q,{name:'Vorbühne',shape:'segment',x:0,y:options.stage.d,w:options.stage.w,d:1,rise:1});
          else if(kind==='ellipse')Object.assign(q,{name:'Rundfläche',shape:'ellipse',w:2,d:2});
          else if(kind==='opening')Object.assign(q,{name:'Ausschnitt',kind:'opening'});
          else if(kind==='column')Object.assign(q,{name:'Säule',kind:'obstacle',shape:'ellipse',w:.5,d:.5});
          else if(kind==='wall')Object.assign(q,{name:'Wand',kind:'obstacle',w:2,d:.2});
          else if(kind==='door'||kind==='curtain')Object.assign(q,{name:kind==='door'?'Tür / Zugang':'Vorhang / Portal',kind:'line',w:kind==='door'?1:4,d:.08});
          else if(kind==='reserve'||kind==='foh')Object.assign(q,{name:kind==='foh'?'FOH':'Freihalten',kind:'zone',role:kind,w:2,d:2});
          else if(kind==='stairs'||kind==='ramp')Object.assign(q,{name:kind==='stairs'?'Treppe':'Rampe',kind,w:1.2,d:kind==='stairs'?1:3});
          g.parts.push(q);selected=q.id;edge=null;
        }
        if(action==='duplicate'){const q=G.part({...p,id:undefined,x:p.x+.3,y:p.y+.3,locked:false});delete q.anchor;g.parts.push(q);selected=q.id;edge=null;}
        if(action==='remove'&&!p.locked){g.parts=g.parts.filter(q=>q.id!==p.id&&q.target!==p.id);selected=g.parts[0]?.id;edge=null;}
        if(action==='insert-point'&&!p.locked){makePolygon(p);const a=p.points[edge],b=p.points[(edge+1)%p.points.length];a[2]=0;p.points.splice(edge+1,0,[(a[0]+b[0])/2,(a[1]+b[1])/2,0]);}
        if(action==='remove-point'&&!p.locked){makePolygon(p);p.points.splice(edge,1);edge=null;rebox(p);}
        if(action==='attach-stairs'){const q=G.part({kind:'stairs',name:'Treppe',w:1.2,d:1,anchor:{partId:p.id,edge,t:.5}});g.parts.push(q);selected=q.id;edge=null;}
      },action==='preset'||action==='add');
    });
    dialog.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!e.target.matches('input,textarea')){e.preventDefault();$('[data-action="'+(e.shiftKey?'redo':'undo')+'"]').click();}e.stopPropagation();});
    const observer=new ResizeObserver(()=>draw());observer.observe(canvas);
    dialog.addEventListener('close',()=>{observer.disconnect();dialog.remove();returnFocus?.focus({preventScroll:true});options.onClose?.();},{once:true});
    dialog.showModal();render();return dialog;
  }
  root.StageplotVenue={open,drawDetails,bounds};
})(globalThis);
