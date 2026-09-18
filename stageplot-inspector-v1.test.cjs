const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),source=fs.readFileSync('stageplot-inspector-v1.js','utf8');
const extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(m,name);return m[0];};
const ctx={clone:v=>JSON.parse(JSON.stringify(v)),artBoundsCache:new Map(),stageboxCapacity:{}};
ctx.percussionModel=require('./stageplot-percussion-v1.js')();ctx.orchestraModel=require('./stageplot-orchestra-v1.js')();
vm.createContext(ctx);vm.runInContext(fs.readFileSync('stageplot-drums-v12.js','utf8')+'\nthis.drumModel=createStageplotDrumModel(percussionModel);',ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8'),ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  const libraryModelFamilyCards='))+'\n'+['editableObjectSize','normalizedObjectDimensions','defaultObjectSize'].map(extract).join('\n')+'\n'+html.match(/  function singleOrchestraPart[^\n]+/)[0]+'\n'+html.match(/  const objectSize = [^\n]+/)[0]+'\nthis.objectSize=objectSize;'+source.slice(0,source.indexOf('function syncInspectorKnob')),ctx);
const plain=ctx.clone,near=(a,b,tol=.002)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
for(const type of ['guitar-jazzmaster','keys-stage4','mic','di','stage-stairs','riser','foh']){
 const object={id:'object',type,x:2,y:3,angle:37,label:'Keep',width:2,depth:1,height:40,steps:7},before=plain(object),size=ctx.inspectorObjectSize(object);
 const resized=ctx.inspectorResizedObject(object,{w:size.w*1.1,d:size.d*1.1});assert(resized,type);assert.deepEqual(object,before,'Pure preview');
 near(ctx.inspectorObjectSize(resized).w,size.w*1.1);near(ctx.inspectorObjectSize(resized).d,size.d*1.1);
 for(const key of ['x','y','angle','label','height','steps'])assert.equal(resized[key],object[key],type+' retains '+key);
 assert.equal(ctx.inspectorResizedObject(object,{w:31,d:1}),null);assert.equal(ctx.inspectorResizedObject(object,{w:NaN,d:1}),null);
}
for(const type of ['drums','percussion']){
 const config=type==='drums'?ctx.drumModel.normalizeDrums('drums'):ctx.percussionModel.preset('cajon');
 const object={id:'assembly',type,x:4,y:2,angle:45,[type]:plain(config)},before=plain(object),size=ctx.objectSize(object);
 const resized=ctx.inspectorResizedObject(object,{w:size.w*1.1,d:size.d*1.1});assert(resized,type+' can resize');
 const actual=ctx.objectSize(resized);near(actual.w,size.w*1.1);near(actual.d,size.d*1.1);assert.deepEqual(object,before);
 const channels=o=>type==='drums'?ctx.drumModel.drumChannels(type,o.drums):ctx.percussionModel.channels(o.percussion);
 assert.deepEqual(plain(channels(resized)).map(({x,y,...row})=>row),plain(channels(object)).map(({x,y,...row})=>row),'Signals and mics survive resizing.');
 if(type==='drums')for(const key of ['kickDiameter','kickDepth','snareDiameter','rackToms','floorToms','mics','extras'])assert.deepEqual(plain(resized.drums[key]),plain(object.drums[key]),'Physical kit data '+key);
 else for(const [i,part] of resized.percussion.parts.entries())assert.deepEqual(plain(ctx.percussionModel.dimensions(part)),plain(ctx.percussionModel.dimensions(object.percussion.parts[i])),'Percussion dimensions unchanged.');
 const reverse=ctx.inspectorResizedObject(resized,{w:size.w,d:size.d});assert(reverse);near(ctx.objectSize(reverse).w,size.w);near(ctx.objectSize(reverse).d,size.d);
 assert.equal(ctx.inspectorResizedObject(object,{w:.01,d:.01}),null,'Reject impossible physical footprint.');
}
const solo={type:'orchestra',orchestra:ctx.orchestraModel.single('violin')},size=ctx.inspectorObjectSize(solo),resized=ctx.inspectorResizedObject(solo,{w:size.w*1.1,d:size.d*1.1});assert(resized);near(ctx.inspectorObjectSize(resized).w,size.w*1.1);
const cajon={type:'percussion',percussion:ctx.percussionModel.normalize({parts:[ctx.percussionModel.part('cajon','p1')]})};
const biggerCajon=ctx.inspectorResizedObject(cajon,{w:.33,d:.33});assert(biggerCajon);near(ctx.inspectorObjectSize(biggerCajon).w,.33);assert.equal(biggerCajon.percussion.parts[0].pickup,'back');
const cymbal={type:'percussion',percussion:ctx.percussionModel.normalize({parts:[ctx.percussionModel.part('cymbal','p1')]})};
const resizedCymbal=ctx.inspectorResizedObject(cymbal,{w:.45,d:.4064},'w');near(ctx.inspectorObjectSize(resizedCymbal).d,.45);assert.equal(resizedCymbal.percussion.parts[0].label,'Crash','Do not retain a stale inch size in an automatic label.');
cymbal.percussion.parts[0].label='Eigene Beschriftung';assert.equal(ctx.inspectorResizedObject(cymbal,{w:.45,d:.45}).percussion.parts[0].label,'Eigene Beschriftung');
assert.equal(ctx.inspectorCanSize({type:'text'}),false);
console.log('PASS INSPECTOR: immutable resize planning, physical dimensions, assembly footprints, stable audio identities, reverse scaling, size limits and specialist storage shapes.');
