const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const hardware=require('./stageplot-stageboxes-v1.js');
const expected={s16:[16,8,false],s32:[32,16,false],sd8:[8,8,true],sd16:[16,8,true],ar84:[8,4,false],ar2412:[24,12,false],ab168:[16,8,false],dx168:[16,8,false],dt168:[16,8,false],gx4816:[48,16,false]};
assert.equal(hardware.models.length,10);
for(const model of hardware.models){
 const key=model.type.split('-').at(-1),[inputs,outputs,comboJacks]=expected[key];
 assert.deepEqual(hardware.capacities[model.type],{inputs,outputs,comboJacks},key+' physical capacity');
 assert.ok(fs.existsSync('stageplot-assets/stageboxes/'+model.file));
 const [x,y,w,h]=model.viewBox,centres=[];
 for(const direction of ['inputs','outputs']){
  assert.equal(model.ports[direction].length,model[direction]);
  for(const [px,py] of model.ports[direction]){
   assert.ok(px-model.diameter/2>=x&&px+model.diameter/2<=x+w,key+' target inside horizontal frame');
   assert.ok(py-model.diameter/2>=y&&py+model.diameter/2<=y+h,key+' target inside vertical frame');
   assert.ok(centres.every(([a,b])=>Math.abs(px-a)>=model.diameter||Math.abs(py-b)>=model.diameter),key+' socket targets do not overlap');
   centres.push([px,py]);
  }
 }
 const calls=[];hardware.surface(model.type,(direction,port)=>{calls.push([direction,port]);return '<button></button>';});
 assert.deepEqual(calls,[...Array.from({length:inputs},(_,i)=>['inputs',i+1]),...Array.from({length:outputs},(_,i)=>['outputs',i+1])],key+' network and power sockets are not audio patch targets');
 const onlyOut=[];hardware.surface(model.type,(d,p)=>{onlyOut.push([d,p]);return '';},['outputs']);assert.equal(onlyOut.length,outputs);assert(onlyOut.every(([d])=>d==='outputs'));
 assert.match(hardware.artwork(model.type),/data-rendered-stagebox-asset=/);assert.doesNotMatch(hardware.picture(model.type),/https?:/);
}
assert.equal(hardware.get('stagebox-16'),null,'Legacy generic boxes retain their existing rendering and capacity');
const html=fs.readFileSync('stageplot-studio.html','utf8'),extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(m,name);return m[0];};
const context={StageplotStageboxes:hardware,stageboxCapacity:{...hardware.capacities,'stagebox-16':{inputs:16,outputs:8}},selected:'box',objects:[],stage:{routing:{inputs:[],outputs:[]}},say:()=>{},change:fn=>fn(),constrain:()=>{}};
vm.createContext(context);vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  const libraryModelFamilyCards='))+'\nthis.byId=Object.fromEntries(catalog.map(c=>[c.id,c]));\n'+extract('changeSelectedVariant'),context);
const original={id:'box',type:'stagebox-behringer-sd16',label:'Keys',x:2,y:3,angle:90,comboJacks:true};
context.objects=[{...original}];context.stage.routing.inputs=[{id:'ch',number:31,stagebox:'box',stageboxPort:16,connector:'XLR'}];
context.changeSelectedVariant('stagebox-ah-ar84');assert.deepEqual(context.objects[0],original,'A smaller model cannot erase an occupied high-numbered port');
context.stage.routing.inputs[0].stageboxPort=3;context.stage.routing.inputs[0].connector='Klinke';
context.changeSelectedVariant('stagebox-ah-dx168');assert.deepEqual(context.objects[0],original,'An XLR-only model cannot silently disconnect a jack cable');
context.stage.routing.inputs[0].connector='XLR';context.stage.routing.outputs=[{id:'mix',number:12,stagebox:'box',stageboxPort:8,connector:'XLR'}];
context.changeSelectedVariant('stagebox-ah-ar84');assert.deepEqual(context.objects[0],original,'Output capacities also guard model changes');
const routes=JSON.stringify(context.stage.routing);context.changeSelectedVariant('stagebox-ah-dx168');
assert.deepEqual(context.objects[0],{...original,type:'stagebox-ah-dx168',comboJacks:false});assert.equal(JSON.stringify(context.stage.routing),routes,'Compatible model changes keep physical patch, channel identities and numbers');
context.objects[0].locked=true;context.changeSelectedVariant('stagebox-behringer-sd16');assert.equal(context.objects[0].type,'stagebox-ah-dx168');
console.log('PASS STAGEBOX MODELS: verified capacities, nonoverlapping physical sockets, local raster art, directional patch targets and lossless guarded model changes.');
