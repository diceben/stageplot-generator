// Pure offline drum configuration: no DOM, network or mutable app state.
function createStageplotDrumModel() {
  const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
  const integer=(v,min,max,fallback)=>Math.round(clamp(v,min,max,fallback));
  const allowedSize=(v,options,fallback)=>{const n=Number(v);if(!Number.isFinite(n))return fallback;return options.reduce((best,current)=>Math.abs(current-n)<Math.abs(best-n)?current:best,options.includes(n)?n:fallback);};
  const short=v=>String(v??'').slice(0,60);
  const isDrums=type=>['drums','drums-min','drums-med','drums-big'].includes(type);
  function drumDefaults() {
    // Product default: "Drumset mittel". Keep this as the single runtime source
    // for fresh projects, newly placed drums and the bundled sample arrangement.
    return {kickCount:1,kickDiameter:22,kickDepth:18,pedal:'single',snareModel:'',snareDiameter:14,snareDepth:6.5,snareMaterial:'Holz',side:false,sideModel:'',sideDiameter:8,sideDepth:5,riserPreset:'none',
      rackToms:[{diameter:10,depth:8,mount:'kick'},{diameter:12,depth:10,mount:'kick'}],floorToms:[{diameter:14,depth:14},{diameter:16,depth:16}],
      hihat:true,hatSize:14,ride:true,rideSize:22,crashes:[18],splash:1,china:0,clapstack:true,clapSize:12,pad:true,bongos:false,table:'off',leftHanded:false,
      positions:{snare:{x:.5833779176076254,y:.42048271029603246},ride:{x:.2901504834493001,y:.6037756227979473},clapstack:{x:.6259321371714274,y:.568158841600605},splash1:{x:.5019760131835938,y:.7103370685203403},kick1:{x:.48790693283081055,y:.6167246500651041},throne:{x:.5425168673197428,y:.17121199065563725},hihat:{x:.6826114389631484,y:.4370733896891277},rack1:{x:.536231279373169,y:.5799473220226812},rack2:{x:.4343844519721137,y:.5706283157947016},floor1:{x:.3672737545437283,y:.4122748655431411},floor2:{x:.3367926279703777,y:.1792357261508119},pad:{x:.7508868111504449,y:.2856976527793735},crash1:{x:.6383353339301215,y:.676882407244514}},rotations:{hihat:320,pad:270},showMics:false,overheads:'off',overheadMount:'boom',room:'off',
      mics:Object.fromEntries([['kick1-out',true],['kick2-out',true],['snare-down',true],['hihat',true],['ride',false],['side-down',false]].map(([id,enabled])=>[id,{enabled,model:'',phantom:false}]))};
  }
  function normalizeDrums(type,value) {
    const base=drumDefaults(),candidate=value===undefined&&type&&typeof type==='object'?type:value,v=candidate&&typeof candidate==='object'?candidate:{};
    const list=(key,max)=>Array.isArray(v[key])?v[key].slice(0,max).map((t,i)=>({diameter:allowedSize(t?.diameter,key==='floorToms'?[14,16,18]:[8,10,12,13,14],base[key][i]?.diameter||12),depth:clamp(t?.depth,3,20,base[key][i]?.depth||10),...(key==='rackToms'?{mount:['kick','cymbal-clamp','basket'].includes(t?.mount)?t.mount:i<2?'kick':'cymbal-clamp'}:{})})):base[key];
    const c={kickCount:integer(v.kickCount,1,2,1),kickDiameter:allowedSize(v.kickDiameter,[16,18,20,22,24],22),kickDepth:clamp(v.kickDepth,10,24,18),
      pedal:v.pedal==='double'?'double':'single',snareModel:short(v.snareModel),snareDiameter:allowedSize(v.snareDiameter,[10,12,13,14],14),snareDepth:clamp(v.snareDepth,3,10,6.5),
      snareMaterial:['Holz','Stahl','Messing','Aluminium','Bronze','Andere'].includes(v.snareMaterial)?v.snareMaterial:base.snareMaterial,
      side:typeof v.side==='boolean'?v.side:base.side,sideModel:short(v.sideModel),sideDiameter:allowedSize(v.sideDiameter,[6,8],8),sideDepth:clamp(v.sideDepth,3,10,5),riserPreset:['none','2x','3x'].includes(v.riserPreset)?v.riserPreset:'none',
      rackToms:list('rackToms',4),floorToms:list('floorToms',3),hihat:v.hihat!==false,hatSize:allowedSize(v.hatSize,[13,14,15,16],14),ride:v.ride!==false,rideSize:allowedSize(v.rideSize,[18,20,21,22,24],22),
      crashes:Array.isArray(v.crashes)?v.crashes.slice(0,4).map(n=>allowedSize(n,[14,16,17,18,19,20],18)):base.crashes,splash:integer(v.splash,0,2,0),china:integer(v.china,0,2,0),clapstack:typeof v.clapstack==='boolean'?v.clapstack:base.clapstack,clapSize:allowedSize(v.clapSize,[8,10,12,14,16],12),
      pad:typeof v.pad==='boolean'?v.pad:base.pad,bongos:typeof v.bongos==='boolean'?v.bongos:base.bongos,table:['off','mixer','laptop'].includes(v.table)?v.table:base.table,leftHanded:v.leftHanded===true,positions:{},rotations:{},showMics:typeof v.showMics==='boolean'?v.showMics:base.showMics,overheads:['off','mono','stereo'].includes(v.overheads)?v.overheads:base.overheads,overheadMount:['boom','clamp'].includes(v.overheadMount)?v.overheadMount:base.overheadMount,
      room:['off','mono','stereo'].includes(v.room)?v.room:'off',mics:{...base.mics},zOrder:[]};
    if(v.positions&&typeof v.positions==='object')for(const [id,p] of Object.entries(v.positions)){
      if(/^(throne|kick[12]|snare|side|rack[1-4]|floor[1-3]|hihat|ride|crash[1-4]|splash[12]|china[12]|clapstack|pad|bongos|table)$/.test(id)&&p&&typeof p==='object')
        c.positions[id]={x:clamp(p.x,.02,.98,.5),y:clamp(p.y,.02,.98,.5)};
    }
    if(v.rotations&&typeof v.rotations==='object')for(const [id,angle] of Object.entries(v.rotations)){
      if(/^(throne|kick[12]|snare|side|rack[1-4]|floor[1-3]|hihat|ride|crash[1-4]|splash[12]|china[12]|clapstack|pad|bongos|table)$/.test(id)&&Number.isFinite(Number(angle)))
        c.rotations[id]=((Number(angle)%360)+360)%360;
    }
    if(Array.isArray(v.zOrder)){
      const seen=new Set();
      c.zOrder=v.zOrder.slice(0,40).map(short).filter(id=>/^(throne|kick[12]|snare|side|rack[1-4]|floor[1-3]|hihat|ride|crash[1-4]|splash[12]|china[12]|clapstack|pad|bongos|table)$/.test(id)&&!seen.has(id)&&seen.add(id));
    }
    if(v.mics&&typeof v.mics==='object')for(const [id,m] of Object.entries(v.mics)){
      if(/^(kick[12]-(in|out)|snare-(up|down)|side-(up|down)|rack[1-4]|floor[1-3]|hihat|ride|oh-(mono|l|r)|room-(mono|l|r)|pad-[lr]|bongos)$/.test(id)&&m&&typeof m==='object')
        c.mics[id]={enabled:m.enabled!==false,model:short(m.model),phantom:m.phantom===true};
    }
    return c;
  }
  function createDrumDesign(name,config,legacyConfig){
    const cleanName=short(name).trim();if(!cleanName)throw new Error('Bitte einen Namen für das Drumdesign eingeben.');
    const source=legacyConfig===undefined?config:legacyConfig;
    return {kind:'stageplot-drum-design',version:2,name:cleanName,config:normalizeDrums(source)};
  }
  function normalizeDrumDesign(value){
    if(!value||typeof value!=='object'||value.kind!=='stageplot-drum-design'||![1,2].includes(value.version)||typeof value.name!=='string'||!value.name.trim()||value.name.length>60||!value.config||typeof value.config!=='object')throw new Error('Die Datei ist kein gültiges Stageplot-Drumdesign.');
    if(value.version===1&&!['small','medium','large'].includes(value.size))throw new Error('Die Datei ist kein gültiges Stageplot-Drumdesign.');
    return createDrumDesign(value.name,value.config);
  }
  function drumLayout(type,value) {
    const c=normalizeDrums(type,value),parts=[],add=(id,kind,x,y,r,extra={})=>parts.push({id,kind,x,y,r,...extra,angle:c.rotations[id]||0});
    const baseVb=[144,102],riserModules=c.riserPreset==='3x'?3:c.riserPreset==='2x'?2:0;
    // Every riser module is 2 x 1 m. In the plan view it is rotated so that
    // adjacent modules form a 2 x 2 m or 3 x 2 m drum platform.
    const riserWidth=riserModules*50,riserDepth=riserModules?100:0,vb=[Math.max(baseVb[0],riserWidth),Math.max(baseVb[1],riserDepth)],cx=vb[0]/2;
    add('throne','throne',cx,10,9);
    for(let i=0;i<c.kickCount;i++){const r=c.kickDiameter*.635,w=r*2*1.6;add('kick'+(i+1),'kick',c.kickCount===1?cx:cx-15.5+i*31,51,r,{w,h:w*543/512});}
    const rackPositions=({1:[[cx,74]],2:[[cx+11,74],[cx-11,74]],3:[[cx+18,72],[cx,76],[cx-18,72]],4:[[cx+27,68],[cx+9,75],[cx-9,75],[cx-27,68]]})[c.rackToms.length]||[];
    c.rackToms.forEach((t,i)=>add('rack'+(i+1),'tom',...rackPositions[i],t.diameter*.665,{diameter:t.diameter,depth:t.depth,mount:t.mount}));
    c.floorToms.forEach((t,i)=>add('floor'+(i+1),'tom',...[[cx-19,48],[cx-31,31],[cx-41,49]][i],t.diameter*.665,{diameter:t.diameter,depth:t.depth}));
    add('snare','snare',cx+21,48,c.snareDiameter*.665);if(c.side)add('side','snare',cx+27,30,c.sideDiameter*.665);
    if(c.hihat)add('hihat','hihat',cx+39,48,c.hatSize*.645,{variant:'hihat'});if(c.ride)add('ride','cymbal',cx-40,60,c.rideSize*.65,{variant:'ride'});
    c.crashes.forEach((size,i)=>add('crash'+(i+1),'cymbal',...[[cx+35,76],[cx-40,70],[cx+52,60],[cx-8,87]][i],size*.65,{variant:'crash'}));
    for(let i=0;i<c.splash;i++)add('splash'+(i+1),'cymbal',...[[cx+4,88],[cx-10,87]][i],6.5,{variant:'splash'});
    for(let i=0;i<c.china;i++)add('china'+(i+1),'cymbal',...[[cx-24,84],[cx+53,80]][i],11.7,{variant:'china'});
    if(c.clapstack)add('clapstack','cymbal',cx-23,62,c.clapSize*.58,{variant:'clapstack'});
    if(c.pad)add('pad','pad',cx+37,15,13.5,{w:27,h:23.7});if(c.bongos)add('bongos','bongos',cx+18,17,9,{w:19,h:11});if(c.table!=='off'){const mixer=c.table==='mixer';add('table','table',cx-35,16,15,{w:30,h:mixer?17:20,variant:c.table});}if(c.leftHanded)for(const p of parts)p.x=vb[0]-p.x;
    const placed=parts.map(p=>{const halfW=(p.w||p.r*2)/2+5,halfH=(p.h||p.r*2)/2+5;return {...p,x:clamp(p.x,halfW,vb[0]-halfW,p.x),y:clamp(p.y,halfH,vb[1]-halfH,p.y)};});
    for(const p of placed)if(c.positions[p.id]){
      const halfW=(p.w||p.r*2)/2+5,halfH=(p.h||p.r*2)/2+5,position=c.positions[p.id];
      p.x=clamp(position.x*vb[0],halfW,vb[0]-halfW,p.x);p.y=clamp(position.y*vb[1],halfH,vb[1]-halfH,p.y);
    }
    const order=new Map(c.zOrder.map((id,index)=>[id,index])),ordered=placed.map((part,index)=>({part,index})).sort((a,b)=>{
      const ai=order.has(a.part.id)?order.get(a.part.id):c.zOrder.length+a.index,bi=order.has(b.part.id)?order.get(b.part.id):c.zOrder.length+b.index;return ai-bi;
    }).map(entry=>entry.part);
    const riser=riserModules?{preset:c.riserPreset,modules:riserModules,moduleW:50,moduleH:100,x:(vb[0]-riserWidth)/2,y:(vb[1]-riserDepth)/2,w:riserWidth,h:riserDepth}:null;
    return {parts:ordered,vb,w:vb[0]*.02,d:vb[1]*.02,pedal:c.pedal,leftHanded:c.leftHanded,showMics:c.showMics,overheadMount:c.overheadMount,riserPreset:c.riserPreset,riser};
  }
  function drumInteraction(layout) {
    if(!layout||!Array.isArray(layout.parts)||!Array.isArray(layout.vb))return {hitParts:[],selectionShapes:[],hull:[],bounds:{minX:0,minY:0,maxX:0,maxY:0}};
    const hitParts=layout.parts.map(p=>{
      if(p.kind==='kick')return {id:p.id,shape:'rect',x:p.x,y:p.y,w:p.w+3,h:p.h+9,rx:2};
      if(['pad','table','bongos'].includes(p.kind))return {id:p.id,shape:'rect',x:p.x,y:p.y,w:(p.w||18)+3,h:(p.h||22)+3,rx:2};
      const radius=(p.kind==='throne'?10:p.r)+1.5;
      return {id:p.id,shape:'ellipse',x:p.x,y:p.y,rx:radius,ry:radius};
    });
    const selectionShapes=[],rotate=(x,y,p)=>{const angle=(Number(p.angle)||0)*Math.PI/180,dx=x-p.x,dy=y-p.y;return {x:p.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:p.y+dx*Math.sin(angle)+dy*Math.cos(angle)};};
    const selectionRect=(p,part,x,y,w,h,rx=1.5,angle=Number(p.angle)||0)=>{const point=rotate(x,y,p);selectionShapes.push({id:p.id,part,shape:'rect',x:point.x,y:point.y,w,h,rx,angle});};
    const selectionEllipse=(p,part,x,y,rx,ry=rx)=>{const point=rotate(x,y,p);selectionShapes.push({id:p.id,part,shape:'ellipse',x:point.x,y:point.y,rx,ry,angle:Number(p.angle)||0});};
    for(const p of layout.parts){
      if(p.kind==='kick'){
        // Match the shell and pedal crops used by the overhead renderer without
        // turning their empty shared bounding rectangle into selectable space.
        const shellWidth=p.w,baseHeight=shellWidth*.9375*543/512,shellHeight=shellWidth*320/512,rawShellY=p.y-baseHeight*.33+baseHeight*160/543;
        selectionRect(p,'shell',p.x,2*p.y-rawShellY,shellWidth+1,shellHeight+1,2);
        const pedalWidth=12.55,pedalHeight=19.1,rawPedalY=p.y+19.45;
        selectionRect(p,'pedal',p.x,2*p.y-rawPedalY,pedalWidth+1,pedalHeight+1,1.5);
        if(layout.pedal==='double'&&layout.parts.filter(part=>part.kind==='kick').length===1){
          const rawPedalX=p.x+(layout.leftHanded?-pedalWidth*.68:pedalWidth*.68),pedalAngle=layout.leftHanded?14:-14;
          selectionRect(p,'pedal-double',2*p.x-rawPedalX,2*p.y-(rawPedalY+.4),pedalWidth+1,pedalHeight+1,1.5,(Number(p.angle)||0)+pedalAngle);
        }
      }else if(p.kind==='hihat'){
        const cymbalWidth=p.r*2.15,cymbalHeight=cymbalWidth*512/313,cymbalY=p.y+cymbalHeight/2-cymbalHeight*148/512;
        selectionEllipse(p,'cymbal',p.x,cymbalY,cymbalWidth*149/313,cymbalHeight*148/512);
        const standWidth=19.4,standHeight=standWidth*512/313,pedalWidth=10.7,pedalHeight=17.7,rawPedalY=p.y-standHeight/2+standHeight*315/512+pedalHeight/2;
        selectionRect(p,'pedal',p.x,2*p.y-rawPedalY,pedalWidth,pedalHeight,1.5);
      }else if(['pad','table','bongos'].includes(p.kind))selectionRect(p,'body',p.x,p.y,p.w||18,p.h||22,1.5);
      else if(p.kind==='throne')selectionEllipse(p,'seat',p.x,p.y,p.r*1.375,p.r*1.42);
      else if(p.kind==='snare')selectionEllipse(p,'shell',p.x,p.y,p.r*1.175,p.r*1.175*225/221);
      else if(p.kind==='tom'){
        const floor=p.id.startsWith('floor'),scale=floor?1.325:1.09,ratio=floor?262/252:239/238;
        selectionEllipse(p,'shell',p.x,p.y,p.r*scale,p.r*scale*ratio);
      }else if(p.kind==='cymbal'&&['ride','crash'].includes(p.variant)){
        const width=p.r*2.85,spec=p.variant==='ride'?[461,512,209,196]:[508,512,171,170];
        selectionEllipse(p,'cymbal',p.x,p.y,width*spec[2]/spec[0],width*spec[3]/spec[0]);
      }else selectionEllipse(p,p.kind==='cymbal'?'cymbal':'body',p.x,p.y,p.r,p.r);
    }
    const points=[];
    for(const p of hitParts){
      if(p.shape==='rect')for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])points.push({x:p.x+sx*(p.w/2+2),y:p.y+sy*(p.h/2+2)});
      else for(let i=0;i<12;i++){const a=i*Math.PI/6;points.push({x:p.x+Math.cos(a)*(p.rx+2),y:p.y+Math.sin(a)*(p.ry+2)});}
    }
    points.sort((a,b)=>a.x-b.x||a.y-b.y);
    const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lower=[],upper=[];
    for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
    for(let i=points.length-1;i>=0;i--){const p=points[i];while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
    const hull=lower.slice(0,-1).concat(upper.slice(0,-1));
    const xs=hull.map(p=>p.x),ys=hull.map(p=>p.y);
    return {hitParts,selectionShapes,hull,bounds:{minX:Math.min(...xs),minY:Math.min(...ys),maxX:Math.max(...xs),maxY:Math.max(...ys)}};
  }
  function drumChannels(type,value,includeDisabled=false) {
    const c=normalizeDrums(type,value),layout=drumLayout(type,c),rows=[],parts=new Map(layout.parts.map(p=>[p.id,p]));
    const row=(id,name,part,extra={})=>{const m=c.mics[id]||{model:'',phantom:false},p=parts.get(part)||parts.get('snare');
      rows.push({id,name,part,model:m.model,phantom:m.phantom,enabled:true,method:'xlr',x:p.x,y:p.y,...extra});};
    for(let i=1;i<=c.kickCount;i++){const prefix=c.kickCount>1?'Kick '+i:'Kick';row('kick'+i+'-in',prefix+' In','kick'+i);row('kick'+i+'-out',prefix+' Out','kick'+i);}
    row('snare-up','Snare Top','snare');row('snare-down','Snare Bottom','snare');
    if(c.side){row('side-up','Side Snare Top','side');row('side-down','Side Snare Bottom','side');}
    c.rackToms.forEach((t,i)=>row('rack'+(i+1),'Rack Tom '+(i+1)+' · '+t.diameter+'″','rack'+(i+1)));
    c.floorToms.forEach((t,i)=>row('floor'+(i+1),'Floor Tom '+(i+1)+' · '+t.diameter+'″','floor'+(i+1)));
    if(c.hihat)row('hihat','Hi-Hat','hihat');
    row('oh-l','OH L',c.ride?'ride':'snare',{x:layout.vb[0]*.2,y:layout.vb[1]*.45});row('oh-r','OH R',c.hihat?'hihat':'snare',{x:layout.vb[0]*.8,y:layout.vb[1]*.45});
    if(c.pad){row('pad-l','SPD-SX L','pad',{method:'di'});row('pad-r','SPD-SX R','pad',{method:'di'});}
    if(c.bongos)row('bongos','Bongos','bongos');
    return rows;
  }
  function rotatePoint(layout,point,angle=0){
    const r=angle*Math.PI/180,cx=layout.vb[0]/2,cy=layout.vb[1]/2,dx=point.x-cx,dy=point.y-cy;
    return {x:cx+dx*Math.cos(r)-dy*Math.sin(r),y:cy+dx*Math.sin(r)+dy*Math.cos(r)};
  }
  const designerPoint=(layout,point)=>rotatePoint(layout,point,180);
  return {isDrums,drumDefaults,normalizeDrums,createDrumDesign,normalizeDrumDesign,drumLayout,drumInteraction,drumChannels,rotatePoint,designerPoint};
}
