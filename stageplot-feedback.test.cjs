const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name+' fehlt');return match[0];};
const ctx={};vm.createContext(ctx);
vm.runInContext(['resizeFootprint','iemRect','constrainIem','validStage','normalizeProductionInfo'].map(extract).join('\n'),ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(ctx.resizeFootprint({x:3,y:2,w:2,d:1,angle:0},{x:.64,y:.36},'se')),{x:3.3,y:2.2,w:2.6,d:1.4,angle:0});
const rotated=ctx.resizeFootprint({x:3,y:2,w:2,d:1,angle:90},{x:-.4,y:.6},'se');
assert.equal(rotated.w,2.6);assert.equal(rotated.d,1.4);assert.ok(Math.abs(rotated.x-2.8)<1e-9);assert.ok(Math.abs(rotated.y-2.3)<1e-9);
const west=ctx.resizeFootprint({x:3,y:2,w:2,d:1},{x:-.6,y:0},'nw');assert.equal(west.x+west.w/2,4,'Gegenüberliegende Ecke bleibt verankert.');
const offstage={w:8,d:5,iem:'free',iemX:-2,iemY:6,iemDepth:1.2,iemLength:2};ctx.constrainIem(offstage);assert.equal(offstage.iemX,-2);assert.equal(offstage.iemY,6);assert.equal(ctx.validStage(offstage),'');
assert.equal(ctx.validStage({...offstage,iemX:Infinity}).length>0,true);
assert.deepEqual(plain(ctx.normalizeProductionInfo(null)),{power:'',handover:{mode:'',point:'',connection:'',notes:''}});
const production={power:'2 × Schuko 230 V',handover:{mode:'Analog',point:'FOH',connection:'2 × XLR',notes:'Venue stellt Kabel'}};
assert.deepEqual(plain(ctx.normalizeProductionInfo(production)),production);
// Preserve legacy documents while round-tripping all new production fields.
const nc={drumModel:{isDrums:()=>false},byId:{foh:{},riser:{}},stageboxCapacity:{},normalizeExtraStairs:()=>[],normalizeCables:()=>[],normalizeRouting:value=>value||{},projectText:(v,max)=>String(v??'').slice(0,max)};vm.createContext(nc);
vm.runInContext(['projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizedObjectDimensions','editableObjectSize','normalizeSetupDocument'].map(extract).join('\n'),nc);
const document={stage:{...offstage,title:'Probe',stairs:'none',project:{name:'Probe',production}},objects:[{id:'station-1',type:'foh',x:4,y:9,angle:0,width:3.5,depth:2.2,foh:{table:true,sun:true},power:'2 × Schuko 230 V',wireless:'470–526 MHz',inventoryId:'inventory-mixer'},{id:'station-2',type:'riser',x:2,y:1,angle:0,width:2.6,depth:1.4,height:40}]};
const roundtrip=plain(nc.normalizeSetupDocument(document));assert.deepEqual(roundtrip.stage.project.production,production);assert.equal(roundtrip.stage.iemX,-2);assert.equal(roundtrip.objects[0].foh.sun,true);assert.equal(roundtrip.objects[0].width,3.5);assert.equal(roundtrip.objects[0].inventoryId,'inventory-mixer');assert.equal(roundtrip.objects[1].width,2.6);assert.deepEqual(plain(nc.normalizeSetupDocument(roundtrip)),roundtrip);
assert.equal(nc.normalizeSetupDocument({...document,stage:{...document.stage,project:{name:'Probe'}}}).stage.project.production.power,'');
const csvContext={routingTab:'inputs',routingStageboxes:()=>[],normalizeRouteChannel:value=>value};vm.createContext(csvContext);vm.runInContext(extract('parseRoutingCsv'),csvContext);
assert.equal(csvContext.parseRoutingCsv('Instrument / Input;Funk / Frequenz\nFunkmikrofon;470–526 MHz')[0].frequencyBand,'470–526 MHz');
// Local tab-conflict drafts get separate cloud IDs; a slow device clock never
// hides a changed draft behind the newer timestamp of the last cloud download.
let drafts={lastId:'draft-new',entries:[{id:'draft-old',sourceSetupId:'setup-shared',savedAt:10,name:'Alt',document:{stage:{title:'Alt'}}},{id:'draft-new',sourceSetupId:'setup-shared',savedAt:20,name:'Neu',document:{stage:{title:'Neu'}}}]},setups=[{id:'setup-shared',name:'Cloud',savedAt:1000,document:{stage:{title:'Cloud'}}}];
const dc={hasLinkedAccount:()=>true,localStorage:{},readDraftLibrary:()=>plain(drafts),readSetupLibrary:()=>plain(setups),writeDraftLibrary:(_s,v)=>drafts=v,writeSetupLibrary:(_s,v)=>setups=v,activeDraftId:'draft-new',cloudBridge:{local:{matches:(_k,entry)=>entry.name==='Cloud'}}};vm.createContext(dc);vm.runInContext(extract('prepareDraftsForSync'),dc);dc.prepareDraftsForSync();assert.equal(setups.length,2);assert.equal(setups.find(p=>p.id==='setup-shared').name,'Neu');assert.equal(setups.find(p=>p.id==='setup-old').name,'Alt');assert.equal(drafts.entries[0].sourceSetupId,'setup-old');
// Exercise the actual two-pointer handlers with a stable host; no hardware claims.
const listeners={},hostListeners={},captures=new Set(),host={addEventListener:(n,fn)=>hostListeners[n]=fn,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id),querySelector:()=>({dataset:{scale:50,originX:0,originY:0},getAttribute:()=>500})};
const pc={window:{addEventListener:(n,fn)=>listeners[n]=fn},$:()=>host,selected:'station-1',stage:{},objects:[{id:'station-1',w:2,d:1}],drag:null,panDrag:null,placement:null,cableDrag:null,history:[],selectedFootprint:()=>({x:0,y:0,w:2,d:1}),redrawFootprintDrag:()=>{},renderEditor:()=>{}};pc.snapshot=()=>JSON.stringify({stage:pc.stage,objects:pc.objects});pc.applyFootprint=(_id,r)=>Object.assign(pc.objects[0],r);pc.keepHistory=before=>pc.history.push(before);vm.createContext(pc);
const start=html.indexOf('  const footprintTouches='),end=html.indexOf("  window.addEventListener('pointermove',moveObjectDrag);",start);vm.runInContext(html.slice(start,end),pc);
const event=(id,x,y=0)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:y,preventDefault(){},stopImmediatePropagation(){}});
hostListeners.pointerdown(event(1,0));hostListeners.pointerdown(event(2,100));listeners.pointermove(event(2,150));assert.equal(pc.objects[0].w,3);assert.equal(pc.objects[0].d,1.5);listeners.pointerup(event(2,150));assert.equal(pc.history.length,1);assert.equal(captures.size,0);
hostListeners.pointerdown(event(1,0));hostListeners.pointerdown(event(2,100));listeners.pointermove(event(2,200));listeners.pointercancel(event(2,200));assert.equal(pc.objects[0].w,3,'Abgebrochene Geste stellt den Ausgangszustand wieder her.');
// A camera gesture must never resize equipment or add an object-history entry.
const beforeCamera=pc.snapshot(),historyBeforeCamera=pc.history.length;
pc.selectedFootprint=()=>null;pc.camera={zoom:1,panX:0,panY:0};
pc.syncViewControls=pc.queueDraw=pc.queueViewportSave=()=>{};
host.getBoundingClientRect=()=>({left:0,top:0});
vm.runInContext(extract('floorView')+'\n'+extract('zoomCamera'),pc);
pc.setZoom=(value,anchor)=>{pc.camera=pc.zoomCamera(pc.camera,{scale:50,mx:0,top:0},500,500,value,anchor);};
hostListeners.pointerdown(event(1,100,150));hostListeners.pointerdown(event(2,200,150));
listeners.pointermove(event(2,250,150));assert.equal(pc.camera.zoom,1.5);
const zoomed=plain(pc.camera);listeners.pointermove(event(1,125,170));listeners.pointermove(event(2,275,170));
assert.equal(pc.camera.zoom,1.5);assert.ok(Math.abs(pc.camera.panX-zoomed.panX-25)<1e-8);assert.ok(Math.abs(pc.camera.panY-zoomed.panY-20)<1e-8);
// A third finger cannot start another drag or end the active pair.
hostListeners.pointerdown(event(3,300,150));listeners.pointerup(event(3,300,150));assert.equal(captures.size,2);
listeners.pointerup(event(2,275,170));assert.equal(captures.size,0);
assert.equal(pc.snapshot(),beforeCamera);assert.equal(pc.history.length,historyBeforeCamera);
const retainedCamera=plain(pc.camera);
hostListeners.pointerdown(event(4,100));hostListeners.pointerdown(event(5,200));listeners.pointermove(event(5,260));listeners.pointercancel(event(4,100));
assert.deepEqual(plain(pc.camera),retainedCamera,'Cancelled viewport gesture restores only the camera.');assert.equal(pc.snapshot(),beforeCamera);
// Fit the real outline on phones, while keeping view extents stable during edits.
let mobile=true;
const fitContext={editorFit:null,mobileWorkspace:()=>mobile,iemRect:()=>null,stairStates:()=>[{id:'stairs-zone'}],stairsGeometry:()=>({x:1,y:5,w:1.2,d:.9}),objectSize:o=>({w:o.w,d:o.d}),workspaceBounds:()=>({minX:-1.25,minY:-1.25,maxX:9.25,maxY:6.25}),compiledVenue:()=>({bounds:{minX:-2,minY:-1,maxX:10,maxY:7}})};
vm.createContext(fitContext);vm.runInContext(extract('mobileEditorBounds')+'\n'+extract('editorWorkspaceBounds'),fitContext);
const stageFit={w:8,d:5},first=plain(fitContext.editorWorkspaceBounds(stageFit,[]));
assert.equal(first.minX,-.2);assert.equal(first.maxX,8.2);assert.ok(Math.abs(first.maxY-6.1)<1e-9,'The complete front stair is inside the fit.');
assert.deepEqual(plain(fitContext.editorWorkspaceBounds(stageFit,[{x:30,y:5,w:2,d:1}])),first,'Moving an object does not refit the camera.');
fitContext.editorFit=null;const outsideFit=fitContext.editorWorkspaceBounds(stageFit,[{x:-3,y:4,w:2,d:2}]);assert.ok(outsideFit.minX<-4.4,'Explicit fit includes external objects.');
mobile=false;assert.deepEqual(plain(fitContext.editorWorkspaceBounds(stageFit,[])),fitContext.workspaceBounds(),'Desktop retains its own padding.');
// Access pieces use the existing object creation, resize, locking and persistence paths.
const accessCatalog=Object.fromEntries(['stage-stairs','stage-ramp'].map(id=>{const line=html.split('\n').find(line=>line.includes("{id:'"+id+"',name:"));assert(line,id+' fehlt');const entry=vm.runInNewContext('('+line.trim().replace(/,$/,'')+')');return [id,entry];}));
const accessContext={byId:accessCatalog,drumModel:{isDrums:()=>false},stageboxCapacity:{},constrain:()=>{},objects:[],stage:{w:8,d:5},selected:null};vm.createContext(accessContext);
const sizeSource=html.match(/  const objectSize = [^\n]+/)[0];
vm.runInContext(sizeSource+'\n'+['makeObject','resizeFootprint','selectedFootprint','applyFootprint','outside'].map(extract).join('\n'),accessContext);
Object.assign(nc.byId,accessCatalog);
for(const type of Object.keys(accessCatalog)){
  const o=accessContext.makeObject(type,{x:-2,y:6},'station-access');accessContext.objects=[o];accessContext.selected=o.id;o.angle=90;
  assert.equal(accessContext.outside(o,accessContext.stage),false,'Treppen und Rampen sind auch außerhalb der Bühne vorgesehen.');
  const base=accessContext.selectedFootprint(),resized=accessContext.resizeFootprint(base,{x:-.43,y:.64},'se');accessContext.applyFootprint(o.id,resized);
  assert.equal(o.width,Math.round((base.w+.6)*10)/10);assert.equal(o.depth,Math.round((base.d+.4)*10)/10);
  assert.ok(Math.abs((o.x+o.depth/2)-(base.x+base.d/2))<1e-9,'Gegenüberliegende Ecke bleibt beim gedrehten Resize fest.');
  const saved=plain(nc.normalizeSetupDocument({...document,objects:[o]})),restored=plain(nc.normalizeSetupDocument(saved));
  assert.deepEqual(restored,saved);assert.equal(restored.objects[0].width,o.width);assert.equal(restored.objects[0].depth,o.depth);assert.equal(restored.objects[0].angle,90);
  o.locked=true;const locked=JSON.stringify(o);assert.equal(accessContext.selectedFootprint(),null);accessContext.applyFootprint(o.id,{x:0,y:0,w:10,d:10});assert.equal(JSON.stringify(o),locked);
}
const oldRamp=nc.normalizeSetupDocument({...document,objects:[{id:'station-ramp',type:'stage-ramp',x:1,y:1,angle:0}]}).objects[0];assert.equal(oldRamp.width,2);assert.equal(oldRamp.depth,1,'Bestehende Rampen ohne eigene Maße behalten ihr altes Planmaß.');
// Inventory round trips and quantity checks use the same runtime as the browser.
const storage={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}};
const invContext={};vm.createContext(invContext);vm.runInContext(fs.readFileSync('stageplot-inventory-v1.js','utf8'),invContext);const inventory=invContext.StageplotInventory;
const mic=inventory.save({id:'inventory-mic',savedAt:1,document:{name:'Testmikrofon',quantity:2,symbol:'mic',wireless:'470–516 MHz',power:'1 × Schuko 230 V'}},storage);assert.equal(inventory.read(storage)[0].document.wireless,'470–516 MHz');assert.equal(inventory.usage(mic.id,[{inventoryId:mic.id},{inventoryId:mic.id}]),2);assert.throws(()=>inventory.save({...mic,document:{...mic.document,quantity:-1}},storage));const removed=inventory.remove(mic.id,storage);assert.equal(inventory.read(storage).length,0);inventory.save(removed,storage);assert.equal(inventory.read(storage).length,1);
console.log('PASS FEEDBACK: verankertes Resize, 10-cm-Raster, Zwei-Finger-Gesten, IEM außerhalb der Bühne, Produktionsdaten und Inventar.');

// Riser annotations stay on their own edges and yield space to equipment and captions.
const labelCtx={objectSize:o=>({w:o.width,d:o.depth}),byId:{riser:{underlay:true},keys:{instrument:true}},measureLabel:text=>text.length*6,labelText:o=>o.label||'',labelVisible:o=>o.showLabel!==false&&Boolean(o.label),num:String,metres:value=>value+' m'};vm.createContext(labelCtx);vm.runInContext(['riserEdgeLabels','drawRiserEdgeLabels','syncRiserEdgeLabels'].map(extract).join('\n'),labelCtx);
const riser={id:'riser',type:'riser',x:0,y:0,angle:0,width:4,depth:2,height:60,label:'Riser · 1×'},bottomKeys={id:'keys',type:'keys',x:0,y:.9,angle:0,width:4,depth:.4};
const cleanLabels=plain(labelCtx.riserEdgeLabels(riser,50,[riser]));assert.deepEqual(cleanLabels.map(label=>[label.kind,label.text]),[['width','4 m · H 60 cm'],['depth','2 m']],'Each dimension and the height appears once, without a duplicate floating card.');
assert.equal(labelCtx.riserEdgeLabels(riser,50,[riser,bottomKeys]).find(label=>label.kind==='width').side,'top','A keyboard at the front edge moves the annotation to the free rear edge.');
assert.equal(labelCtx.riserEdgeLabels({...riser,angle:90},50,[riser,{...bottomKeys,x:-.9,y:0,angle:90}]).find(label=>label.kind==='width').side,'top','Collision checks use the rotated riser coordinates.');
assert.equal(labelCtx.riserEdgeLabels(riser,50,[riser],{avoid:[{left:-2,right:2,top:.7,bottom:1}]}).find(label=>label.kind==='width').side,'top','Instrument captions also reserve space.');
const named={...riser,label:'Drum-Riser mit einem sehr langen Namen'};
assert(labelCtx.riserEdgeLabels(named,30,[named]).find(label=>label.kind==='caption').text.endsWith('…'));
for(const label of labelCtx.riserEdgeLabels(named,30,[named])){assert(label.box.left>=-60&&label.box.right<=60);assert(label.box.top>=-30&&label.box.bottom<=30);}
assert.equal(labelCtx.riserEdgeLabels({...named,showLabel:false},50,[named]).some(label=>label.kind==='caption'),false,'Object visibility hides its name while preserving measurement settings.');
assert.deepEqual(plain(labelCtx.riserEdgeLabels(named,50,[named],{labels:false,measures:false})),[]);
assert.deepEqual(labelCtx.riserEdgeLabels(named,50,[named],{measures:false}).map(label=>label.kind).join(','),'caption','Disabling dimensions in the export also removes the height.');
const painted=[];labelCtx.sEl=(tag,attrs,_parent,text)=>painted.push({tag,attrs,text});labelCtx.drawRiserEdgeLabels({}, {...riser,angle:180},50,[riser],{});assert(painted.every(item=>{const rotation=Number(item.attrs.transform.match(/rotate\(([-\d.]+)/)[1]),world=((180+rotation)%360+360)%360;return world<=90||world>=270;}),'Rotated edge annotations remain upright.');
assert(!html.includes('data-riser-caption'),'No large Riser caption remains above the equipment layer.');
console.log('PASS RISER LABELS: single edge dimensions, compact height, collision avoidance, rotations, long names and export visibility.');
