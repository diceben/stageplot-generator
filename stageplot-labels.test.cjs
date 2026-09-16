const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),look=require('./stageplot-look-v1.js');
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const plain=value=>JSON.parse(JSON.stringify(value));
// A manual position belongs to the object's centre, independent of zoom, rotation and output size.
const object={id:'station-1',type:'keys',x:4,y:2,angle:90,label:'Wave 2',labelOffset:{x:1.25,y:-.5}};
for(const scale of [22,65,110,220]){
  const metrics=look.labelMetrics(['Wave 2','2 Outs · Klinke'],1,scale),box=look.manualLabelBox(object,metrics.width,metrics.height,scale,70,80);
  assert.equal(((box.left+box.right)/2-70)/scale,5.25);
  assert.equal(((box.top+box.bottom)/2-80)/scale,1.5);
}
assert.equal(look.manualLabelBox({...object,labelOffset:null},80,30,50,0,0),null);
assert.equal(look.manualLabelBox({...object,labelOffset:{x:NaN,y:0}},80,30,50,0,0),null);
for(const dark of [true,false]){
  const nodes=[],add=(tag,attrs,_parent,text)=>nodes.push({tag,attrs,text}),metrics=look.labelMetrics(['Wave 2','2 Outs · Klinke'],1,95);
  look.drawLabel(add,{}, {left:0,right:metrics.width,top:0,bottom:metrics.height},['Wave 2','2 Outs · Klinke'],1,metrics,{dark,id:object.id});
  assert.equal(nodes[0].attrs.fill,dark?'#191f23':'#f7f8f2');
  assert(nodes.some(n=>n.attrs['data-label-accent']==='true'));
  const lines=nodes.filter(n=>n.tag==='text');assert(lines.every(n=>n.attrs['text-anchor']==='start'));
  assert(lines[0].attrs.style.includes(dark?'#f4efdf':'#191f23'));assert(lines[1].attrs.style.includes('monospace'));
}
// Exercise the real pointer handlers, including a touch pointer and cancellation.
const captures=new Set(),nodes=new Map(),host={setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
const label={dataset:{labelFor:object.id,labelOffsetX:'1.25',labelOffsetY:'-.5'},setAttribute(name,value){this[name]=value;}};
const svg={dataset:{scale:100,originX:0,originY:0},getBoundingClientRect:()=>({left:0,top:0})};
const ctx={objects:[{...object,labelOffset:undefined}],stage:{w:8,d:5},drag:null,selected:null,panMode:false,spaceHeld:false,placement:null,sharedReadOnly:false,
  selectionMode:false,stageObjectTarget:()=>null,focusCanvas(){},finishEdit(){},updateList(){},inspector(){},positionRotationToolbar(){},renderEditor(){},say(){},history:[],future:[],persistDraft(){this.saves=(this.saves||0)+1;},
  $:id=>id==='sp-editor-floor'?host:(nodes.has(id)?nodes.get(id):(nodes.set(id,{}),nodes.get(id)))};
ctx.setSelection=ids=>ctx.selected=ids[0]||null;
ctx.snapshot=()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects});
vm.createContext(ctx);vm.runInContext(['svgPoint','startObjectDrag','moveObjectDrag','endObjectDrag','cancelObjectDrag','keepHistory'].map(extract).join('\n'),ctx);
const event=(x=525,y=150,pointerId=1)=>({button:0,pointerId,pointerType:'touch',clientX:x,clientY:y,target:{closest:selector=>selector==='[data-label-for]'?label:null},currentTarget:svg,preventDefault(){}});
ctx.startObjectDrag(event());assert.equal(ctx.drag.kind,'label');ctx.moveObjectDrag(event(625,200,2));assert.equal(ctx.objects[0].labelOffset,undefined,'Other pointers must not hijack a drag.');
ctx.moveObjectDrag(event(625,200));assert.deepEqual(plain(ctx.objects[0].labelOffset),{x:2.25,y:0});assert.equal(label.transform,'translate(100 50)');assert.equal(ctx.objects[0].x,4);assert.equal(ctx.objects[0].y,2);
ctx.endObjectDrag(event(625,200));assert.equal(ctx.history.length,1);assert.equal(captures.size,0);
const saved=ctx.snapshot();ctx.objects=JSON.parse(ctx.history[0]).objects;assert.equal(ctx.objects[0].labelOffset,undefined);ctx.objects=JSON.parse(saved).objects;
ctx.startObjectDrag(event());ctx.moveObjectDrag(event(600,250));ctx.cancelObjectDrag();assert.deepEqual(plain(ctx.objects[0].labelOffset),{x:2.25,y:0});assert.equal(ctx.history.length,1);
delete ctx.objects[0].labelOffset;ctx.startObjectDrag(event());ctx.moveObjectDrag(event(600,250));ctx.cancelObjectDrag();assert.equal(ctx.objects[0].labelOffset,undefined);
ctx.startObjectDrag(event());ctx.endObjectDrag(event());assert.equal(ctx.objects[0].labelOffset,undefined,'A click must preserve automatic positioning.');assert.equal(ctx.history.length,1);
ctx.objects[0].locked=true;ctx.startObjectDrag(event());assert.equal(ctx.drag,null);ctx.objects[0].locked=false;ctx.sharedReadOnly=true;ctx.startObjectDrag(event());assert.equal(ctx.drag,null);
// Existing drafts stay automatic; new positions survive normalization and portable export/import.
const nc={drumModel:{isDrums:()=>false},byId:{keys:{}},normalizedObjectDimensions:()=>null,stageboxCapacity:{},normalizeExtraStairs:()=>[],normalizeCables:()=>[],normalizeRouting:value=>value||{},projectText:(v,max)=>String(v??'').slice(0,max)};
vm.createContext(nc);vm.runInContext(['projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizeSetupDocument'].map(extract).join('\n'),nc);
const document={stage:{w:8,d:5,title:'Test',stairs:'none',iem:'none',iemLength:2,iemDepth:1,iemX:0,iemY:0},objects:[object]};
const normalized=nc.normalizeSetupDocument(document);assert.deepEqual(plain(normalized.objects[0].labelOffset),object.labelOffset);
for(const offset of [undefined,null,{x:Infinity,y:0},{x:'2',y:0},{x:10001,y:0}])assert.equal(nc.normalizeSetupDocument({...document,objects:[{...object,labelOffset:offset}]}).objects[0].labelOffset,undefined);
const exporter=require('./stageplot-export-v42.js').createStageplotExportV42(),options={normalizeDocument:nc.normalizeSetupDocument};
const exported=exporter.createSetupExport('Test',document,options),imported=exporter.parseSetupJson(exporter.stringifySetupJson(exported),options);
assert.deepEqual(plain(imported.document.objects[0].labelOffset),object.labelOffset);
// Long offstage labels remain within the printable area at several output sizes.
const fc={StageplotLook:look,textContext:null,objectLabelLines:()=>({lines:['Wave 2 · sehr lange Beschriftung','2 Outs · Klinke'],nameLineCount:1})};vm.createContext(fc);vm.runInContext(['fitFloor','fitManualLabels'].map(extract).join('\n'),fc);
for(const W of [340,900,1400]){
  const H=600,area={minX:0,minY:0,maxX:8,maxY:5},list=[{...object,labelOffset:{x:7,y:-4}}];
  const initial=fc.fitFloor(W,H,area,40,23,70,46,'start'),fit=fc.fitManualLabels(initial,area,list,W,H,40,23,70,46,'start',true,true);
  const metrics=look.labelMetrics(fc.objectLabelLines().lines,1,fit.scale),box=look.manualLabelBox(list[0],metrics.width,metrics.height,fit.scale,fit.mx,fit.top);
  assert(box.left>=0&&box.right<=W&&box.top>=0&&box.bottom<=H,'Export clips a manually placed label.');
}
console.log('PASS LABELS: light/dark cards, scale-independent placement, touch drag, undo snapshot, cancellation, locking, legacy drafts, export roundtrip and offstage print fit.');
