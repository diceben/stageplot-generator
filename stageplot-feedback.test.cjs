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
vm.runInContext(['iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizeSetupDocument'].map(extract).join('\n'),nc);
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
// Inventory round trips and quantity checks use the same runtime as the browser.
const storage={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}};
const invContext={};vm.createContext(invContext);vm.runInContext(fs.readFileSync('stageplot-inventory-v1.js','utf8'),invContext);const inventory=invContext.StageplotInventory;
const mic=inventory.save({id:'inventory-mic',savedAt:1,document:{name:'Testmikrofon',quantity:2,symbol:'mic',wireless:'470–516 MHz',power:'1 × Schuko 230 V'}},storage);assert.equal(inventory.read(storage)[0].document.wireless,'470–516 MHz');assert.equal(inventory.usage(mic.id,[{inventoryId:mic.id},{inventoryId:mic.id}]),2);assert.throws(()=>inventory.save({...mic,document:{...mic.document,quantity:-1}},storage));const removed=inventory.remove(mic.id,storage);assert.equal(inventory.read(storage).length,0);inventory.save(removed,storage);assert.equal(inventory.read(storage).length,1);
console.log('PASS FEEDBACK: verankertes Resize, 10-cm-Raster, Zwei-Finger-Gesten, IEM außerhalb der Bühne, Produktionsdaten und Inventar.');
