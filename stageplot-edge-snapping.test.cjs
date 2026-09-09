const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const G = require('./stageplot-geometry-v1.js');
const near = (actual, expected, message='') => assert.ok(Math.abs(actual - expected) < .000003, `${message} ${actual} != ${expected}`);
const floor = G.compile(G.legacy({w:4.18,d:4.27})).floor;
const part = (x,y,w=1.2,d=1) => G.part({kind:'stairs',x,y,w,d});

// All four actual edges override the grid, including matching off-grid corners.
for (const [x,y,expectedX,expectedY] of [[4.2,1,4.18,1],[1,4.3,1,4.27],[-1.25,1,-1.2,1],[1,-1.05,1,-1],[4.2,3.3,4.18,3.27]]) {
  const p=part(x,y), before=JSON.stringify(p), result=G.snapToFloor(p,floor);
  assert.ok(result); near(result.x,expectedX); near(result.y,expectedY);
  assert.equal(JSON.stringify(p),before,'Snapping must not mutate the proposed placement.');
  const repeated=G.snapToFloor({...p,x:result.x,y:result.y},floor);
  near(repeated.dx,0); near(repeated.dy,0);
}
assert.equal(G.snapToFloor(part(5,1),floor),null,'A distant object remains free.');
assert.equal(G.snapToFloor(part(2.95,1),floor),null,'An access element cannot snap inside the stage.');
near(G.snapToFloor(part(2.95,1),floor,{exterior:false}).x,2.98,'Risers may align inside the floor.');

// Only the merged visible perimeter counts, including recesses and opening edges.
const compound=G.legacy({w:4.18,d:4.27});
compound.parts.push(G.part({x:3.5,y:1,w:2.13,d:2}));
const merged=G.compile(compound).floor;
near(G.snapToFloor(part(5.65,1.5),merged).x,5.63);
assert.equal(G.snapToFloor(part(4.2,1.5),merged),null,'No magnet on a hidden source seam.');
assert.equal(G.snapToFloor(part(5.65,3.6),merged),null,'No phantom bounding-box edge above/below the extension.');
const cut=G.legacy({w:4.18,d:4.27});
cut.parts.push(G.part({kind:'opening',x:2.13,y:2,w:3,d:3}));
near(G.snapToFloor(part(2.15,2.3,1,1),G.compile(cut).floor).x,2.13);
const hole=G.legacy({w:8,d:6});
hole.parts.push(G.part({kind:'opening',x:3.13,y:2.17,w:2,d:2}));
near(G.snapToFloor(part(3.15,2.65,1,1),G.compile(hole).floor).x,3.13);

// Parallel rotated edges keep their actual angle and six-decimal geometry precision.
const rotated=G.part({x:1.13,y:2.17,w:4.18,d:4.27,angle:37});
const location=G.transform(rotated,[4.21,1]);
const rotatedStair=G.part({kind:'stairs',x:location[0],y:location[1],w:1.2,d:1,angle:37});
const aligned=G.snapToFloor(rotatedStair,G.compile({parts:[rotated]}).floor);
assert.ok(aligned); const local=G.inverse(rotated,[aligned.x,aligned.y]); near(local[0],4.18); near(local[1],1);
assert.equal(rotatedStair.angle,37);

// Exercise the real app constraint and centre-to-corner conversion, with both grids.
const html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(m,name);return m[0];};
let enabled=true, step=.25;
const context={StageplotGeometry:G,stage:{w:4.18,d:4.27},objects:[],
  byId:{'stage-stairs':{stageAccess:true},'stage-ramp':{stageAccess:true},'stage-module':{stageExtension:true},riser:{},guitar:{}},
  $:()=>({checked:enabled}),gridStep:()=>step,objectSize:o=>({w:o.width,d:o.depth})};
vm.createContext(context);
vm.runInContext(['constrain','venueObjectPart','snapStageElement','snapStageModule'].map(extract).join('\n'),context);
for(step of [.25,.125]) for(const type of ['stage-stairs','stage-ramp','stage-module']) for(const depth of [1,1.03]) {
  for(const [x,y,expectedX,expectedY] of [[4.79,2,4.78,2],[2,4.28+depth/2,2,4.27+depth/2],[-.61,2,-.6,2],[2,-depth/2-.02,2,-depth/2]]) {
    const o={id:'access',type,x,y,width:1.2,depth,angle:0};context.objects=[o];context.constrain(o);
    near(o.x,expectedX);near(o.y,expectedY);
    context.constrain(o);near(o.x,expectedX);near(o.y,expectedY);
  }
}
const free={id:'free',type:'stage-stairs',x:4.8,y:2.07,width:1.2,depth:1,angle:0};
enabled=false;context.constrain(free);near(free.x,4.8);near(free.y,2.07);
enabled=true;free.x=4.78;free.y=2;context.constrain(free,false);near(free.x,4.78);
free.x+=.125;context.constrain(free,false);near(free.x,4.905,'An intentional keyboard nudge must escape the magnet.');
const instrument={...free,type:'guitar',x:4.8};step=.25;context.constrain(instrument);near(instrument.x,4.75,'Ordinary instruments retain grid placement.');
const extension={id:'extension',type:'stage-module',x:5.18,y:2,width:2,depth:2,angle:0};
const access={...free,x:6.8,y:2};context.objects=[extension,access];context.constrain(access);near(access.x,6.78,'An equipment module contributes its actual outer edge.');

// The builder's real pointer handlers apply the same rule after its 10-cm delta grid.
const ui=fs.readFileSync('stageplot-venue-v1.js','utf8'), handlers={}, captures=new Set();
const canvas={focus(){},addEventListener:(name,fn)=>handlers[name]=fn,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id),getBoundingClientRect:()=>({left:0,top:0})};
const pc={G,canvas,metrics:{x:0,y:0,scale:50},$:()=>({checked:enabled}),g:G.legacy({w:4.18,d:4.27}),drag:null,gesture:null,touches:new Map(),pan:{x:0,y:0,zoom:1},history:[],future:[],drawPoints:null,selected:'access',edge:null,draw(){},render(){},status(){},closePartMenu(){}};
pc.state=()=>JSON.stringify(pc.g);pc.restore=s=>pc.g=JSON.parse(s);vm.createContext(pc);
vm.runInContext(ui.slice(ui.indexOf('  function rebox('),ui.indexOf('  function open('))+ui.slice(ui.indexOf('    const local=e=>'),ui.indexOf('    function editField(')),pc);
const target={closest:s=>s==='[data-select-shape]'?{dataset:{selectShape:'access'}}:null};
const event=(x,y)=>({button:0,pointerType:'touch',pointerId:1,clientX:x*50,clientY:y*50,target,preventDefault(){}});
for(const kind of ['stairs','ramp','floor']) {
  pc.g=G.legacy({w:4.18,d:4.27});pc.g.parts.push(G.part({id:'access',kind,x:5.2,y:1,w:1.2,d:1}));
  handlers.pointerdown(event(5.8,1.5));handlers.pointermove(event(4.8,1.5));handlers.pointerup(event(4.8,1.5));
  near(pc.g.parts[1].x,4.18);near(pc.g.parts[1].y,1);
  const saved=JSON.stringify(pc.g);assert.equal(JSON.stringify(G.normalize(JSON.parse(saved))),saved,'Saving preserves exact off-grid placement.');
  handlers.pointerdown(event(4.78,1.5));handlers.pointermove(event(5.78,1.5));handlers.pointercancel(event(5.78,1.5));
  assert.equal(JSON.stringify(pc.g),saved,'Cancelling a drag restores the snapped placement.');
}
assert.equal(captures.size,0);
console.log('PASS EDGE SNAPPING: off-grid edges, corners, merged contours, openings, rotation, app grids and builder touch drags.');
