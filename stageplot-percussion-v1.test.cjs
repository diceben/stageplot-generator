const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const model=require('./stageplot-percussion-v1.js')();
const exporter=require('./stageplot-export-v42.js').createStageplotExportV42();
const html=fs.readFileSync('stageplot-studio.html','utf8');
const compact=model.preset(),latin=model.preset('latin');
assert.equal(compact.parts.length,3);assert.equal(latin.parts.length,14);
assert.equal(model.channels(compact).length,3);assert.equal(model.channels(latin).length,9);
assert.equal(model.channels({parts:[model.part('timbales','t')]}).length,2);
assert.equal(model.channels({parts:[model.part('cowbell','c')]}).length,0);
assert.deepEqual(model.normalize(model.normalize(latin)),latin);
const malformed=model.normalize({nextId:90,parts:[{...model.part('conga','same'),x:Infinity,y:-99,angle:-45,scale:100},{...model.part('bongos','same'),label:'<script>'},{type:'__proto__'},null]});
assert.equal(malformed.parts.length,2);assert.equal(new Set(malformed.parts.map(p=>p.id)).size,2);
assert.equal(malformed.parts[0].x,0);assert.equal(malformed.parts[0].y,-4);assert.equal(malformed.parts[0].angle,315);assert.equal(malformed.parts[0].scale,1.6);assert.equal(malformed.nextId,90);
assert.deepEqual(model.normalize(malformed),malformed);
const largeId=model.normalize({parts:[model.part('conga','p'+'9'.repeat(59))]});
assert.equal(largeId.nextId,1);assert.deepEqual(model.normalize(largeId),largeId,'Imported IDs must not turn the next generated ID into scientific notation.');
assert.equal(model.normalize({parts:Array.from({length:90},()=>model.part('conga','x'.repeat(60)))}).parts.length,48);
const rotated=model.layout({parts:[{...model.part('bongos','a'),angle:90,x:2,y:-1}]});
assert.ok(Math.abs(rotated.w-(model.byId.bongos.d+.05))<.0001);assert.ok(Math.abs(rotated.d-(model.byId.bongos.w+.05))<.0001);
const moved=structuredClone(latin);moved.parts.reverse();moved.parts.forEach(p=>{p.x+=.6;p.angle=45;});
assert.deepEqual(model.channels(moved).map(p=>p.id).sort(),model.channels(latin).map(p=>p.id).sort(),'Moving/reordering parts must preserve signal identities.');
const pad=model.part('multipad','pad');assert.deepEqual(model.channels({parts:[pad]}).map(r=>r.side),['L','R']);pad.pickup='mono';assert.equal(model.channels({parts:[pad]}).length,1);pad.pickup='none';assert.equal(model.channels({parts:[pad]}).length,0);
for(const p of latin.parts){assert.ok(!model.artwork({parts:[p]}).includes('<path'),'Instrument artwork must use generated raster assets.');assert.match(model.artwork({parts:[p]}),/<image href="\.\/stageplot-assets\/percussion\/[a-z-]+\.webp"/);}
const manifest=JSON.parse(fs.readFileSync('stageplot-assets/percussion/manifest.json'));
assert.equal(manifest.assets.length,12);
for(const c of model.catalog){const asset=manifest.assets.find(a=>a.id===c.asset);assert.ok(asset);const bytes=fs.readFileSync('stageplot-assets/percussion/'+asset.file);assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(asset.alpha,true);assert.ok(asset.prompt.includes('overhead'));}
const document={stage:{w:8,d:5,title:'Percussion test'},objects:[{id:'station-1',type:'percussion',x:2,y:2,angle:45,percussion:latin}]};
const exported=exporter.createSetupExport('Percussion test',document,{exportedAt:100});
assert.deepEqual(exporter.parseSetupJson(exporter.stringifySetupJson(exported)).document.objects[0].percussion,latin);
assert.ok(html.includes("item.percussion=percussionModel.normalize(o.percussion)"));
assert.ok(html.includes("image.setAttribute('href',await localImageDataUrl(url))"),'PNG/SVG must embed local image assets.');
// Run the actual app channel generator: keys survive edits; stereo is a single group.
const extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert.ok(m,name);return m[0];};
const drawings=new Map(),artContext={percussionModel:model,artCache:new Map(),artBoundsCache:new Map(),artDefs:{},sEl:(_tag,attrs)=>{const node={...attrs};drawings.set(attrs.id,node);return node;}};
vm.createContext(artContext);vm.runInContext(extract('artId')+'\nthis.renderArt=artId;',artContext);
const firstArt=artContext.renderArt({id:'percussion'},{id:'station-1',percussion:compact}),firstMarkup=drawings.get(firstArt).innerHTML;
const secondArt=artContext.renderArt({id:'percussion'},{id:'station-1',percussion:latin});
assert.notEqual(firstArt,secondArt,'Different projects can share object IDs without sharing mutable artwork.');
assert.equal(drawings.get(firstArt).innerHTML,firstMarkup);assert.equal(artContext.renderArt({id:'percussion'},{percussion:compact}),firstArt);
vm.runInContext(extract('outsText')+'\nthis.labelOuts=outsText;',artContext);
assert.equal(artContext.labelOuts({type:'percussion',percussion:latin}),'9 Signale','A mixed mic/line setup must not be labelled as exclusively XLR.');
const context={percussionModel:model,objects:document.objects,byId:{percussion:{instrument:true}},drumModel:{isDrums:()=>false},routeSpec:(o,port,instrument,mode,signalType,extra)=>({sourceKey:o.id+':'+port,instrument,mode,signalType,...extra})};
vm.createContext(context);vm.runInContext(extract('generatedInputSpecs')+'\nthis.specs=generatedInputSpecs();',context);
assert.equal(context.specs.length,9);const stereo=context.specs.filter(r=>r.stereoGroup);assert.equal(stereo.length,2);assert.equal(stereo[0].stereoGroup,stereo[1].stereoGroup);assert.equal(stereo[0].connector,'Klinke');
// Exercise the real modal handlers with a minimal DOM surface, without snapshots of implementation text.
class Node {
 constructor(){this.events={};this.dataset={};this.value='';this.tagName='DIV';this.hidden=false;this.nodes=new Map();}
 addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
 emit(type,event={}){for(const fn of this.events[type]||[])fn({preventDefault(){},...event,type});}
 querySelector(selector){if(!this.nodes.has(selector))this.nodes.set(selector,new Node());return this.nodes.get(selector);}
 querySelectorAll(){return [];}
 setAttribute(){} append(){} replaceChildren(){} focus(){} setPointerCapture(){}
 showModal(){this.open=true;}close(){this.open=false;this.emit('close');}
 getBoundingClientRect(){return {width:600,height:600};}getScreenCTM(){return {inverse:()=>({})};}
}
const root=new Node(),modal=new Node(),results=[];
const editorContext={document:{createElement:()=>modal},DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}},model,root,onCommit:(id,config)=>results.push({id,config})};
vm.createContext(editorContext);vm.runInContext(fs.readFileSync('stageplot-percussion-editor-v1.js','utf8')+'\nthis.editor=createStageplotPercussionEditor(root,model,onCommit);',editorContext);
const editor=editorContext.editor,canvas=modal.querySelector('.sp-perc-canvas');
const click=dataset=>modal.emit('click',{target:{closest:()=>({dataset})}});
const open=()=>editor.open({id:'station-1',percussion:compact});
open();click({add:'timbales'});click({action:'cancel'});assert.equal(results.length,0,'Cancel must leave the stage untouched.');
open();click({add:'timbales'});click({action:'undo'});click({action:'save'});assert.equal(results.at(-1).config.parts.length,3);
open();click({select:'p1'});const properties=modal.querySelector('.sp-perc-properties'),fieldsMarkup=properties.innerHTML;
const positionInput={dataset:{field:'x'},valueAsNumber:.2,value:'0.2'};
properties.emit('input',{target:positionInput});positionInput.valueAsNumber=.25;positionInput.value='0.25';properties.emit('input',{target:positionInput});properties.emit('change',{target:positionInput});
assert.equal(properties.innerHTML,fieldsMarkup,'Typing must preserve the input DOM and focus.');assert.equal(positionInput.value,.25);
click({action:'undo'});click({action:'save'});assert.equal(results.at(-1).config.parts[0].x,compact.parts[0].x,'Continuous field editing creates one undo step.');
open();click({select:'p1'});click({action:'rotate-right'});click({action:'duplicate'});click({action:'save'});assert.equal(results.at(-1).config.parts.length,4);assert.equal(results.at(-1).config.parts[0].angle,15);assert.equal(results.at(-1).config.nextId,5);
open();click({select:'p3'});click({action:'remove'});click({add:'conga'});click({action:'save'});assert.equal(results.at(-1).config.parts.at(-1).id,'p4','Do not reuse a removed part’s channel IDs.');
open();click({percPreset:'latin'});click({action:'save'});assert.equal(results.at(-1).config.parts.length,14);assert.ok(results.at(-1).config.parts.every(p=>!compact.parts.some(old=>old.id===p.id)),'Replacing a preset must not steal old channel assignments.');
const pointer=(type,x,y,partId='p1',pointerId=1)=>canvas.emit(type,{button:0,pointerId,clientX:x,clientY:y,target:{closest:()=>partId?{dataset:{part:partId}}:null}});
open();pointer('pointerdown',0,0);pointer('pointermove',27,18);pointer('pointerup',27,18);click({action:'save'});assert.equal(results.at(-1).config.parts[0].x,.05);assert.equal(results.at(-1).config.parts[0].y,.2);
open();pointer('pointerdown',0,0);pointer('pointermove',80,20);pointer('pointercancel',80,20);click({action:'save'});assert.deepEqual(JSON.parse(JSON.stringify(results.at(-1).config)),compact);
open();pointer('pointerdown',0,0);pointer('pointermove',80,20);pointer('pointerdown',120,20,null,2);pointer('pointermove',200,20,null,2);pointer('pointerup',200,20,null,2);pointer('pointerup',80,20);click({action:'save'});assert.deepEqual(JSON.parse(JSON.stringify(results.at(-1).config)),compact,'Two-finger view gestures must not move instruments.');
console.log('PASS PERCUSSION: generated local assets, geometry, portable project data, stable mono/stereo IDs, real editor add/rotate/duplicate/preset/undo/save/cancel and pointer/pinch handlers.');
