const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('./stageplot-geometry-v1.js'),createExport=require('./stageplot-export-v42.js');
const html=fs.readFileSync('stageplot-studio.html','utf8'),ui=fs.readFileSync('stageplot-venue-v1.js','utf8');
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const json=v=>JSON.parse(JSON.stringify(v));
const storage={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}};
const ctx={StageplotGeometry:G,WeakMap,TextEncoder,TextDecoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),drumModel:{isDrums:()=>false},byId:{foh:{},riser:{},'stage-module':{stageExtension:true}},stageboxCapacity:{},normalizeExtraStairs:()=>[],normalizeCables:()=>[],normalizeRouting:v=>v||{},projectText:(v,max)=>String(v??'').slice(0,max),stageTemplateStorageKey:'templates',window:{localStorage:storage},objectSize:o=>({w:o.width||2,d:o.depth||1}),objects:[],venueCompileCache:new WeakMap(),clone:json};
vm.createContext(ctx);
vm.runInContext(['projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizedObjectDimensions','editableObjectSize','normalizeSetupDocument','normalizeStageTemplate','readStageTemplates','writeStageTemplates','encodeShareDocument','decodeShareDocument','venueObjectPart','compiledVenue','outside'].map(extract).join('\n'),ctx);
const stage={title:'Testsaal',w:8,d:5,stairs:'none',stairsAlong:.5,iem:'none',iemLength:2,iemDepth:1,iemX:0,iemY:0,geometry:G.preset('round'),venueRef:{templateId:'stage-template-demo',name:'Testsaal',revision:3}};
stage.geometry.parts.push(G.part({id:'opening',kind:'opening',w:1.2,d:1.4,x:1,y:1}),G.part({id:'column',kind:'obstacle',shape:'ellipse',w:.4,d:.4,x:5,y:1}));stage.geometry.parts[0].w=4.18;stage.geometry.notes='Hausnotiz';stage.geometry.revision=3;
const document={stage,objects:[{id:'station-99',type:'riser',x:2,y:3,angle:0,width:2,depth:1,height:40,locked:true,house:true},{id:'station-100',type:'foh',x:4,y:10,angle:0,width:3,depth:2}]};
const normalized=ctx.normalizeSetupDocument(document),roundtrip=ctx.normalizeSetupDocument(json(normalized));
assert.deepEqual(json(roundtrip),json(normalized));assert.equal(roundtrip.stage.geometry.parts[0].w,4.18);assert.equal(roundtrip.objects[0].house,true);assert.equal(roundtrip.stage.venueRef.revision,3);
assert.throws(()=>ctx.normalizeSetupDocument({...document,stage:{...stage,geometry:{version:100,parts:[]}}}),/Bühnenformat/);
const template=ctx.normalizeStageTemplate({id:'stage-template-demo',name:'Testsaal',savedAt:1,stage,objects:[document.objects[0]]});ctx.writeStageTemplates([template]);const loaded=ctx.readStageTemplates()[0];assert.deepEqual(json(loaded),json(template));loaded.stage.geometry.parts[0].w=10;assert.equal(ctx.readStageTemplates()[0].stage.geometry.parts[0].w,4.18,'Eine Veranstaltung darf die gespeicherte Hausvorlage nicht verändern.');
const payload=ctx.encodeShareDocument(document);assert.deepEqual(json(ctx.decodeShareDocument('#share='+payload)),json(normalized));assert.equal(JSON.parse(Buffer.from(payload,'base64url').toString()).version,2);
const legacy={stage:{...stage},objects:[]};delete legacy.stage.geometry;delete legacy.stage.venueRef;assert.equal(JSON.parse(Buffer.from(ctx.encodeShareDocument(legacy),'base64url').toString()).version,1);
const exporter=createExport.createStageplotExportV42();const file=exporter.createSetupExport('Testsaal',json(normalized),{normalizeDocument:ctx.normalizeSetupDocument,exportedAt:1});assert.equal(file.version,2);const imported=exporter.parseSetupJson(exporter.stringifySetupJson(file,{normalizeDocument:ctx.normalizeSetupDocument}),{normalizeDocument:ctx.normalizeSetupDocument});assert.deepEqual(json(imported.document),json(normalized));assert.equal(exporter.createSetupExport('Alt',legacy).version,1);
const withoutStairOffset=json(normalized);delete withoutStairOffset.stage.stairsAlong;assert.doesNotThrow(()=>exporter.createSetupExport('Haus ohne Treppe',withoutStairOffset,{normalizeDocument:ctx.normalizeSetupDocument}));
// Equipment on a rounded apron is allowed; holes and pillars reject the complete footprint.
const floorStage={...stage,geometry:G.preset('round')};floorStage.geometry.parts.push(G.part({kind:'opening',x:2,y:2,w:1,d:1}),G.part({kind:'obstacle',x:5,y:1,w:.5,d:.5}));
assert.equal(ctx.outside({type:'riser',x:4,y:6,width:.5,depth:.5},floorStage),false);
assert.equal(ctx.outside({type:'riser',x:2.5,y:2.5,width:.5,depth:.5},floorStage),true);
assert.equal(ctx.outside({type:'riser',x:5.2,y:1.2,width:.5,depth:.5},floorStage),true);
ctx.objects=[{id:'module',type:'stage-module',x:9,y:2,width:2,depth:1,angle:0}];assert.equal(ctx.outside({type:'riser',x:9,y:2,width:.5,depth:.5},floorStage),false,'Bühnenmodule erweitern auch die nutzbare Fläche.');
// The real editor callbacks save only checked house equipment and strip event data.
let editorOptions,eventCopy;
Object.assign(ctx,{sharedReadOnly:false,root:{},view:'editor',stage:json(normalized.stage),objects:json(normalized.objects),cancelPlacement:()=>{},finishEdit:()=>{},stairStates:()=>[],objectCatalog:o=>({name:o.type}),StageplotVenue:{open:options=>editorOptions=options},stageTemplateAccountStore:()=>null,renderStageTemplates:()=>{},activateSetupDocument:value=>eventCopy=json(ctx.normalizeSetupDocument(value)),say:()=>{}});
vm.runInContext(['geometryForVenue','newVenueEvent','openVenueEditor'].map(extract).join('\n'),ctx);
ctx.openVenueEditor();const houseGeometry=json(normalized.stage.geometry);houseGeometry.name='Testsaal';
const savedHouse=editorOptions.onSaveTemplate(houseGeometry,[ctx.objects[0].id]);assert.equal(savedHouse.revision,4);const latestHouse=savedHouse.templates.find(t=>t.id==='stage-template-demo');assert.equal(latestHouse.objects.length,1);assert.equal(latestHouse.objects[0].locked,true);assert.equal(latestHouse.objects[0].house,true);assert.equal(latestHouse.stage.project,undefined);
editorOptions.onNewEvent(latestHouse);eventCopy.stage.geometry.parts[0].w=18;assert.equal(ctx.readStageTemplates()[0].stage.geometry.parts[0].w,4.18);assert.equal(eventCopy.stage.venueRef.revision,4);
// Exercise the actual pointer handlers, not a mirrored resize implementation.
const handlers={},captures=new Set(),canvas={focus:()=>{},addEventListener:(name,fn)=>handlers[name]=fn,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id),getBoundingClientRect:()=>({left:0,top:0})};
const pc={G,canvas,metrics:{x:0,y:0,scale:50},$:()=>({checked:true}),g:G.legacy({w:4.18,d:4.27}),drag:null,gesture:null,touches:new Map(),pan:{x:0,y:0,zoom:1},history:[],future:[],drawPoints:null,selected:'main-stage',edge:null,draw:()=>{},render:()=>{},status:()=>{},closePartMenu:()=>{}};
pc.state=()=>JSON.stringify(pc.g);pc.restore=s=>pc.g=JSON.parse(s);vm.createContext(pc);
vm.runInContext(ui.slice(ui.indexOf('  function rebox('),ui.indexOf('  function open('))+ui.slice(ui.indexOf('    const local=e=>'),ui.indexOf('    function editField(')),pc);
const target=(kind,id='main-stage',value='se')=>({closest:selector=>selector==='[data-'+kind+']'?{dataset:{part:id,selectShape:id,resizeHandle:value,pointHandle:value,edgeHandle:value}}:null});
const event=(id,x,y,targetValue=target('resize-handle'))=>({button:0,pointerType:'touch',pointerId:id,clientX:x,clientY:y,target:targetValue,preventDefault(){}});
handlers.pointerdown(event(1,209,213.5));handlers.pointermove(event(1,242,230));handlers.pointerup(event(1,242,230));assert.equal(pc.g.parts[0].w,4.88);assert.equal(pc.g.parts[0].d,4.57);assert.equal(pc.g.parts[0].x,0);assert.equal(pc.history.length,1);
handlers.pointerdown(event(1,244,228.5));handlers.pointermove(event(1,294,278.5));handlers.pointercancel(event(1,294,278.5));assert.equal(pc.g.parts[0].w,4.88,'Abgebrochener Drag wird vollständig zurückgesetzt.');
const beforeGesture=JSON.stringify(pc.g);handlers.pointerdown(event(1,100,100,target('select-shape')));handlers.pointermove(event(1,110,100,target('select-shape')));handlers.pointerdown(event(2,200,100,target('select-shape')));handlers.pointermove(event(2,300,100));handlers.pointerup(event(2,300,100));handlers.pointerup(event(1,110,100));assert.equal(JSON.stringify(pc.g),beforeGesture,'Zwei Finger zoomen die Ansicht, ohne eine Fläche versehentlich zu verschieben.');assert.ok(pc.pan.zoom>1);assert.equal(captures.size,0);
pc.g.parts[0].locked=true;handlers.pointerdown(event(1,200,200));handlers.pointermove(event(1,250,250));handlers.pointerup(event(1,250,250));assert.equal(pc.g.parts[0].w,4.88,'Gesperrte Bauteile können nicht gezogen werden.');
handlers.pointerdown(event(1,20,20,{closest:()=>null}));handlers.pointerup(event(1,20,20,{closest:()=>null}));assert.equal(pc.selected,null,'Ein Tipp auf den Hintergrund blendet die Auswahlkontur aus.');assert.equal(pc.edge,null);
// Render the shared SVG annotations and check physical lengths/positions, including rotated shapes.
class SvgNode{
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.textContent='';}
  setAttribute(key,value){this.attrs[key]=String(value);}
  append(node){this.children.push(node);}
}
const rc={StageplotGeometry:G,document:{createElementNS:(_,tag)=>new SvgNode(tag)}};vm.createContext(rc);vm.runInContext(ui,rc);
const descendants=n=>[n,...n.children.flatMap(descendants)];
const renderDetails=(geometry,options={})=>{const svg=new SvgNode('svg');rc.StageplotVenue.drawDetails(svg,geometry,{scale:50,x:100,y:100,...options});return descendants(svg);};
const measurements=nodes=>nodes.filter(n=>n.attrs['data-venue-measures']).flatMap(descendants).filter(n=>n.tag==='text');
const box=G.legacy({w:4.18,d:2.27});let dims=measurements(renderDetails(box,{editing:true,selected:'main-stage'}));
assert.deepEqual(dims.map(n=>n.textContent),['4,18 m','2,27 m'],'Gegenüberliegende gleiche Kanten werden nur einmal bemaßt.');
assert.ok(Number(dims[0].attrs.y)<100,'Breite steht oberhalb der oberen Kante.');assert.ok(Number(dims[1].attrs.x)>309,'Tiefe steht rechts neben der rechten Kante.');assert.match(dims[1].attrs.transform,/rotate\(90 /);
box.parts[0].angle=90;dims=measurements(renderDetails(box,{editing:true,selected:'main-stage'}));assert.equal(dims[0].textContent,'4,18 m');assert.match(dims[0].attrs.transform,/rotate\(90 /);assert.ok(Number(dims[0].attrs.x)>100,'Maßlinie dreht sich mit dem Element nach außen.');
const overlap=G.legacy({w:8,d:5});overlap.parts.push(G.part({id:'oval',name:'Oval',shape:'ellipse',x:3,y:4,w:2,d:3}));
let drawing=renderDetails(overlap,{editing:true});assert.equal(drawing.filter(n=>n.attrs['data-venue-part']).length,0,'Verdeckte Ausgangskonturen werden nicht mitgezeichnet.');assert.deepEqual(measurements(drawing).map(n=>n.textContent),['8 m','7 m']);
dims=measurements(renderDetails(overlap,{editing:true,selected:'oval'}));assert.deepEqual(dims.map(n=>n.textContent),['2 m','3 m'],'Auswahl zeigt die beiden Achsenmaße des Ovals.');assert.ok(Number(dims[0].attrs.y)<300);assert.ok(Number(dims[1].attrs.x)>350);
const round=G.preset('round',6,4),apron=round.parts[1];dims=measurements(renderDetails(round,{editing:true,selected:apron.id}));assert.deepEqual(dims.map(n=>n.textContent),['6 m','1,5 m']);
const thrust=G.legacy({w:8,d:5});thrust.parts.push(G.part({x:3,y:4,w:2,d:3.7}));drawing=renderDetails(thrust);
assert.ok(!measurements(drawing).some(n=>n.textContent==='3,7 m'),'Export bemaßt nur freiliegende Kanten, keine verdeckte Teilflächenlänge.');assert.ok(measurements(drawing).some(n=>n.textContent==='2,7 m'));
assert.equal(drawing.filter(n=>n.attrs['stroke-dasharray']).length,0,'Export enthält keine gestrichelten Bearbeitungskonturen.');
overlap.parts.push(G.part({id:'hole',kind:'opening',x:1,y:1,w:1,d:1}),G.part({id:'reserve',kind:'zone',x:10,y:1,w:2,d:2}));
drawing=renderDetails(overlap,{editing:true});assert.deepEqual(drawing.filter(n=>n.attrs['stroke-dasharray']).map(n=>n.attrs['data-venue-part']),['reserve'],'Sachliche Freihalte-Markierungen bleiben auch ohne Auswahl sichtbar.');
assert.equal(measurements(renderDetails(overlap,{measures:false})).length,0,'Exportoption ohne Maße bleibt wirksam.');
const withStairs=G.legacy({w:8,d:5});withStairs.parts.push(G.part({kind:'stairs',x:8,y:1,w:1.2,d:1}));
dims=measurements(renderDetails(withStairs,{editing:true,selected:'main-stage'}));assert.ok(Number(dims[1].attrs.x)>100+9.2*50,'Die Maßlinie steht außerhalb einer angrenzenden Treppe.');
const stair=withStairs.parts[1];
for(const angle of [0,37,90]){
  stair.angle=angle;dims=measurements(renderDetails(withStairs,{editing:true,selected:stair.id}));
  assert.deepEqual(dims.map(n=>n.textContent),['1,2 m','1 m'],'Treppenbreite und -tiefe erscheinen auch gedreht nur je einmal.');
}
stair.angle=0;
dims=measurements(renderDetails(withStairs,{overallBounds:{minX:0,minY:0,maxX:8,maxY:5}}));
assert.deepEqual(dims.map(n=>n.textContent),['1,2 m','1 m'],'Gesamtmaße ersetzen doppelte Bühnenrandmaße; die Treppe behält eigene Maße.');
const square=G.legacy({w:2,d:2});assert.equal(measurements(renderDetails(square,{editing:true,selected:'main-stage'})).length,2,'Auch am Quadrat bleiben Breite und Tiefe erkennbar.');
const separate=G.legacy({w:2,d:1});separate.parts.push(G.part({kind:'stairs',x:4,w:2,d:1}));
assert.equal(measurements(renderDetails(separate)).filter(n=>n.textContent==='1 m').length,2,'Gleiche Längen verschiedener Bauteile werden nicht zusammengelegt.');
const nearEqual=G.legacy({w:4,d:2});Object.assign(nearEqual.parts[0],{shape:'polygon',points:[[0,0],[4,0],[4,2],[0,2.0002]]});
assert.equal(measurements(renderDetails(nearEqual,{editing:true,selected:'main-stage'})).filter(n=>n.textContent==='2 m').length,2,'Nur die Anzeige zu runden macht ungleiche Kanten nicht identisch.');
const curved=G.legacy({w:4,d:2});Object.assign(curved.parts[0],{shape:'polygon',points:[[0,0],[4,0,.3],[4,2],[0,2]]});
assert.deepEqual(measurements(renderDetails(curved,{editing:true,selected:'main-stage'})).map(n=>n.textContent),['4 m','2 m · Bogen 0,3 m','2 m'],'Gerade und gebogene Kante behalten unterschiedliche Maßangaben.');
const stepped=G.legacy({w:4,d:3});Object.assign(stepped.parts[0],{shape:'polygon',points:[[0,0],[2,0],[2,1],[4,1],[4,3],[2,3],[2,2],[0,2]]});
assert.equal(measurements(renderDetails(stepped,{editing:true,selected:'main-stage'})).filter(n=>n.textContent==='1 m').length,2,'Versetzte gleich lange Absätze behalten beide Maßangaben.');
const holePlan=G.legacy({w:8,d:5});holePlan.parts.push(G.part({kind:'opening',x:1,y:1,w:2,d:1}));
dims=measurements(renderDetails(holePlan,{overallBounds:{minX:0,minY:0,maxX:8,maxY:5}}));assert.deepEqual(dims.map(n=>n.textContent).sort(),['1 m','2 m'],'Auch Innenkonturen werden ohne gegenüberliegende Doppelmaße beschriftet.');
// Project cards keep actual equipment symbols on both legacy and custom stage shapes.
class PreviewNode extends SvgNode{
  get outerHTML(){return '<'+this.tag+Object.entries(this.attrs).map(([k,v])=>' '+k+'="'+v+'"').join('')+'>'+(this.innerHTML||this.textContent)+this.children.map(n=>n.outerHTML).join('')+'</'+this.tag+'>';}
}
const previewCatalog={guitar:{art:'guitar',vb:[100,50]},riser:{art:'riser',vb:[100,50],underlay:true},mic:{art:'mic',vb:[50,50]}};
const previewContext={drumModel:{isDrums:()=>false},artBoundsCache:new Map(),StageplotGeometry:G,StageplotVenue:rc.StageplotVenue,venueCompileCache:new WeakMap(),byId:previewCatalog,objectSize:o=>({w:o.width,d:o.depth}),objectCatalog:o=>previewCatalog[o.type],artId:(c,o)=>'sp-art-'+c.art+(o.stand?'-'+o.stand:''),esc:s=>s,sEl:(tag,attrs,parent)=>{const n=new PreviewNode(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n;}};
vm.createContext(previewContext);vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8'),previewContext);vm.runInContext(['stageObjectOrder','stageArtworkLayers','venueObjectPart','compiledVenue','projectPreviewBounds','objectArtGeometry','projectPreviewObjectsMarkup','venuePreviewMarkup','dashboardPreviewMarkup'].map(extract).join('\n'),previewContext);
const previewObjects=[{id:'instrument',type:'guitar',x:2,y:2,width:1.5,depth:.75,angle:45},{id:'platform',type:'riser',x:2,y:2,width:3,depth:2,angle:0},{id:'vocal',type:'mic',x:4,y:3,width:.5,depth:.5,angle:90,stand:'round'}];
for(const geometry of [undefined,withStairs,G.preset('round',8,5)]){
  const previewDocument={stage:{w:8,d:5,geometry},objects:previewObjects},before=JSON.stringify(previewDocument),markup=previewContext.dashboardPreviewMarkup(previewDocument);
  assert.equal((markup.match(/<use href=/g)||[]).length,2,'Jede Projektvorschau rendert die Objektsymbole statt ihrer rechteckigen Grundflächen.');
  assert.match(markup,/<use href="#sp-art-guitar"/);assert.match(markup,/data-rendered-tech-asset="mic-round-base"/);assert.match(markup,/data-rendered-tech-asset="mic-boom-head"/);
  assert.ok(markup.indexOf('#sp-art-riser')<markup.indexOf('#sp-art-guitar'),'Instrumente bleiben auch in der Vorschau über dem Riser sichtbar.');
  assert.match(markup,/rotate\(45\)/);assert.match(markup,/rotate\(90\)/);assert.doesNotMatch(markup,/#a4b9a0/);
  if(geometry)assert.match(markup,/fill-rule="evenodd"/,'Freie Bühnenkonturen bleiben in der Vorschau erhalten.');
  assert.equal(JSON.stringify(previewDocument),before,'Vorschaurendering verändert keine gespeicherten Objekte.');
}
// Off-stage access pieces remain fully visible in project cards, even after rotation.
previewCatalog['stage-ramp']={art:'stage-ramp',vb:[200,100],underlay:true,stageAccess:'ramp'};
const accessPreview=[{id:'access',type:'stage-ramp',x:-2,y:3,width:1.2,depth:4,angle:90}];
for(const geometry of [undefined,G.preset('round',8,5)]){
  const s={w:8,d:5,geometry},b=previewContext.projectPreviewBounds(s,accessPreview),markup=previewContext.dashboardPreviewMarkup({stage:s,objects:accessPreview});
  assert.equal(b.minX,-4);assert.ok(b.maxX>=8);assert.match(markup,/<use href="#sp-art-stage-ramp"/);
  const transform=markup.match(/rotate\(90\) matrix\(([^)]+)\)/);assert.ok(transform,'Rampe wird in beiden Achsen auf ihr gespeichertes Maß skaliert.');
  const [sx,,,sy]=transform[1].split(' ').map(Number);assert.ok(sy>sx*6,'Schmale, lange Rampen behalten das richtige Seitenverhältnis.');
}
// The same commands power the toolbar, context menu, sidebar and keyboard.
const ac={G};vm.createContext(ac);vm.runInContext(ui.slice(ui.indexOf('  function rotatePart('),ui.indexOf('  function dimension(')),ac);
const center=p=>{const b=rc.StageplotVenue.bounds(p);return [(b.minX+b.maxX)/2,(b.minY+b.maxY)/2];};
const closeTo=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} != ${b}`);
for(const shape of ['rect','ellipse','segment','polygon']){
  const p=G.part({shape,w:4.18,d:2.27,rise:1.3,x:2.4,y:-1.2}),before=center(p);ac.rotatePart(p,90);center(p).forEach((n,i)=>closeTo(n,before[i]));ac.rotatePart(p,-90);closeTo(p.x,2.4);closeTo(p.y,-1.2);
}
let commands=G.legacy({w:8,d:5});commands.parts.push(G.part({id:'editable',shape:'ellipse',x:2,y:2,w:2,d:1}),G.part({id:'separate',x:15,y:15}));
assert.equal(ac.partBelow(commands,commands.parts[1]).id,'main-stage');const areaBefore=G.compile(commands).area;ac.changePart(commands,'editable','behind');assert.equal(commands.parts[0].id,'editable');closeTo(G.compile(commands).area,areaBefore);
ac.changePart(commands,'editable','lock');const lockedBefore=JSON.stringify(commands);ac.changePart(commands,'editable','rotate',45);ac.changePart(commands,'editable','remove');assert.equal(JSON.stringify(commands),lockedBefore);
const duplicateId=ac.changePart(commands,'editable','duplicate'),duplicate=commands.parts.find(p=>p.id===duplicateId);assert.equal(duplicate.locked,false);assert.equal(duplicate.x,2.5);duplicate.w=9;assert.equal(commands.parts[0].w,2);
commands.parts.push(G.part({id:'cut',kind:'opening',target:duplicateId,x:4,y:2,w:1,d:1}),G.part({id:'attached',kind:'stairs',x:10,y:10,anchor:{partId:duplicateId,edge:0,t:.5}}));ac.changePart(commands,duplicateId,'remove');assert.ok(!commands.parts.some(p=>p.id==='cut'));assert.equal(commands.parts.find(p=>p.id==='attached').anchor,undefined);assert.doesNotThrow(()=>G.normalize(commands));
assert.throws(()=>ac.changePart(G.legacy({w:8,d:5}),'main-stage','remove'),/letzte Bühnenfläche/);
assert.equal(G.overlaps(G.part({shape:'ellipse',w:2,d:2}),G.part({x:1.9,y:1.9,w:.1,d:.1})),false,'Bounding boxes alone do not establish overlap.');assert.equal(G.overlaps(G.part(),G.part({x:2})),false,'Touching edges do not overlap.');
// Adding a preset keeps the complete existing venue and scopes any new cutouts to the new form.
let additions=G.normalize({...G.copy(normalized.stage.geometry),name:'Bestehender Saal',height:1.2,clearance:6,showModules:true,measured:true,revision:9});
for(const name of ['rect','rect','circle','round','trapezoid','thrust','t','wings','l','u','notch','irregular']){
  const before=G.copy(additions),oldArea=G.compile(before).area,id=ac.addPreset(additions,name,8,5,'Neue Form');additions=G.normalize(additions);
  assert.deepEqual(additions.parts.slice(0,before.parts.length),before.parts,'Grundform '+name+' darf keine vorhandenen Elemente verändern.');
  assert.deepEqual({...additions,parts:[]},{...before,parts:[]},'Hausangaben bleiben erhalten.');assert.equal(new Set(additions.parts.map(p=>p.id)).size,additions.parts.length);
  const added=additions.parts.slice(before.parts.length);assert.ok(added.some(p=>p.id===id));assert.ok(rc.StageplotVenue.bounds(added[0]).minX>G.compile(before).bounds.maxX);
  for(const cut of added.filter(p=>p.kind==='opening'))assert.ok(added.some(p=>p.kind==='floor'&&p.id===cut.target),'Neue Ausschnitte dürfen keine alte Bühne betreffen.');
  closeTo(G.compile(additions).area,oldArea+G.compile(G.preset(name,8,5)).area);
}
assert.deepEqual(json(ctx.normalizeSetupDocument({stage:{...stage,geometry:additions},objects:normalized.objects}).stage.geometry),json(additions),'Ergänzte Grundformen bleiben beim Speichern und Laden erhalten.');
// Exercise the actual held-rotation handlers with controlled animation frames.
const frames=new Map();let frameId=0,holdCaptured=false;
const hc={G,g:G.legacy({w:4.18,d:2.27}),selected:'main-stage',rotateHold:null,history:[],future:['redo'],lastField:'old',performance:{now:()=>0},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),render:()=>{},draw:()=>{},status:()=>{},closePartMenu:()=>{},$:()=>({value:''})};
hc.state=()=>JSON.stringify(hc.g);hc.restore=s=>hc.g=JSON.parse(s);vm.createContext(hc);vm.runInContext(ui.slice(ui.indexOf('  function rotatePart('),ui.indexOf('  function partBelow('))+ui.slice(ui.indexOf('    function stopRotateHold('),ui.indexOf("    toolbar.addEventListener('pointerdown'")),hc);
const holdButton={disabled:false,dataset:{hold:'1'},setPointerCapture:()=>holdCaptured=true,hasPointerCapture:()=>holdCaptured,releasePointerCapture:()=>holdCaptured=false};
const holdEvent={button:0,pointerId:7,target:{closest:()=>holdButton},preventDefault(){}};
const frame=now=>{const id=hc.rotateHold.frame,fn=frames.get(id);frames.delete(id);fn(now);};
const holdBefore=hc.state(),holdCenter=center(hc.g.parts[0]);hc.startRotateHold(holdEvent);frame(100);frame(300);frame(500);assert.ok(hc.g.parts[0].angle>1);assert.equal(hc.history.length,0);center(hc.g.parts[0]).forEach((n,i)=>closeTo(n,holdCenter[i]));hc.stopRotateHold(7);assert.equal(hc.history.length,1);assert.equal(hc.history[0],holdBefore);assert.equal(hc.future.length,0);assert.equal(holdCaptured,false);assert.equal(frames.size,0);
const beforeCancel=hc.state();hc.startRotateHold(holdEvent);frame(200);hc.stopRotateHold(7,true);assert.equal(hc.state(),beforeCancel);assert.equal(hc.history.length,1,'Cancel rolls back the complete held rotation.');
hc.g.parts[0].locked=true;hc.startRotateHold(holdEvent);assert.equal(hc.rotateHold,null);assert.equal(frames.size,0);
console.log('PASS VENUE: Hausvorlagen, JSON/Link-Roundtrip, Flächenprüfung, echte Pointer-Handler, Auswahlkonturen kantenrichtige SVG-Bemaßung und Elementaktionen mit gehaltenem Drehen.');
