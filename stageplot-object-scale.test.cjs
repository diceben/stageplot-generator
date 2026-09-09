const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>{const result=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert.ok(result,name);return result[0];};
const ctx={drumModel:{isDrums:type=>type==='drums'},artBoundsCache:new Map(),artId:c=>c.id,stageboxCapacity:{},normalizeExtraStairs:()=>[],normalizeCables:()=>[],normalizeRouting:v=>v||{},projectText:v=>String(v||'')};vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  const libraryModelFamilyCards='))+'\nthis.catalog=catalog;'+['editableObjectSize','normalizedObjectDimensions','defaultObjectSize','objectArtGeometry','projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizeSetupDocument'].map(extract).join('\n')+html.match(/  const objectSize = [^\n]+/)[0]+'\nthis.size=objectSize;',ctx);
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-9,`${label}: ${a} != ${b}`);
for(const [id,w,d] of [['laptop',.3557,.2481],['mic-sm57',.157,.032],['mic-wireless-ewd',.268,.05],['di',.127,.084],['stagebox-8',.483,.22],['stagebox-16',.41,.19],['stagebox-32',.82,.19],['stagebox-48',.4816,.255]]){
 const size=ctx.size({type:id});near(size.w,w,id+' width');near(size.d,d,id+' depth');
}
// Every static catalogue item obeys both physical axes at every scale, even with
// asymmetric or negative artwork margins. This catches the old min(w/vbW,h/vbH) shrink.
for(const c of ctx.catalog.filter(c=>!c.orchestraPart&&!c.percussionPart&&!['orchestra','percussion','drums','text'].includes(c.id))){
 assert.ok(c.w>0&&c.d>0,c.id);assert.ok(!c.planScale,c.id+' must not be inflated');
 const box={x:-7.3,y:13.7,width:c.vb[0]*.72,height:c.vb[1]*.58};ctx.artBoundsCache.set(c.id,box);
 for(const scale of [2,37,180]){
  const g=ctx.objectArtGeometry(c,{type:c.id},c.w*scale,c.d*scale);
  near(box.width*g.sx,c.w*scale,c.id+' width');near(box.height*g.sy,c.d*scale,c.id+' depth');
  near((box.x+box.width/2)*g.sx+g.tx,0,c.id+' horizontal centre');near((box.y+box.height/2)*g.sy+g.ty,0,c.id+' vertical centre');
 }
}
// Layout padding and calibrated drum heads must not be stretched to their ink bounds.
const kit={id:'drums',vb:[144,102]};ctx.artBoundsCache.set('drums',{x:8,y:5,width:122,height:89});const g=ctx.objectArtGeometry(kit,{type:'drums'},288,204);near(g.sx,2,'kit scale');near(g.sy,2,'kit scale');near(g.tx,-144,'kit origin');
near(ctx.size({type:'mic',stand:'round'}).w,.25,'Round base 25 cm');
for(const invalid of [{w:0,d:.2},{w:-1,d:1},{w:Infinity,d:1},{w:.2,d:NaN},{w:31,d:1},{w:1,d:21},{w:'0.4',d:.3},null])assert.equal(ctx.normalizedObjectDimensions(invalid),null);
const stage={w:8,d:5,title:'Scale fixture',stairs:'none',stairsOffset:.5,iem:'none',iemLength:2,iemDepth:1,iemX:0,iemY:0};
const original={id:'station-1',type:'rug',x:3.16,y:2.07,angle:37,label:'Measured rug',dimensions:{w:2.4,d:1.7},locked:true};
const plain=v=>JSON.parse(JSON.stringify(v));
const doc=ctx.normalizeSetupDocument({stage,objects:[original]});assert.deepEqual(plain(doc.objects[0].dimensions),original.dimensions);assert.equal(doc.objects[0].x,original.x);assert.equal(doc.objects[0].angle,37);assert.equal(doc.objects[0].locked,true);assert.deepEqual(plain(ctx.normalizeSetupDocument(doc)),plain(doc));
near(ctx.size(doc.objects[0]).w,2.4,'saved size');
const legacy=ctx.normalizeSetupDocument({stage,objects:[{...original,dimensions:undefined}]});assert.equal(legacy.objects[0].dimensions,undefined);near(ctx.size(legacy.objects[0]).w,2,'legacy reference size');
const invalid=ctx.normalizeSetupDocument({stage,objects:[{...original,dimensions:{w:-1,d:.3}}]});assert.equal(invalid.objects[0].dimensions,undefined);
assert.doesNotMatch(fs.readFileSync('stageplot-symbols-v3.js','utf8').split("}else if(type==='laptop')")[1].split("}else if(type==='foh')")[0],/playback-rack|playaudio-1u/,'Laptop silhouette must not include an undeclared rack.');
console.log('PASS OBJECT SCALE: complete static catalogue, original equipment dimensions, asymmetric artwork bounds, metric composite preservation, reference reset and custom-size local/import roundtrip.');
