const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const menu=require('./stageplot-object-menu-v1.js'),html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'))[0];
const clone=value=>JSON.parse(JSON.stringify(value));
// Dragging through zero remains continuous; snap hysteresis must neither jump
// across 360 degrees nor trap fine adjustment at a 45-degree stop.
assert.equal(menu.delta(1,359),2);assert.equal(menu.delta(359,1),-2);
assert.equal(menu.angle(-15),345);assert.equal(menu.snap(358).value,0);
assert.equal(menu.snap(49,45).value,45);assert.equal(menu.snap(51,45).value,51);
assert.equal(menu.snap(46.5,null,true).value,46.5);assert.equal(menu.snap(45.5,null,true).value,45);
const ctx={drumModel:{isDrums:t=>t==='drums'},StageplotObjectMenu:{...menu,mount(_host,api){ctx.api=api;return {};}}};
vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  const libraryModelFamilyCards='))+'\nthis.catalog=catalog;this.byId=byId;',ctx);
const fixtures=ctx.catalog.map((c,i)=>({id:'fixture-'+i,type:c.id,label:c.name,angle:27,x:2,y:3,showLabel:true,steps:5,io:{outputs:{count:2,connector:'XLR'}},drums:{parts:[{id:'kick'}]},percussion:{parts:[{id:'cajon'}]},orchestra:{parts:[{id:'violin'}]},labelOffset:{x:.2,y:.5}}));
const band=o=>ctx.byId[o.type].underlay?'floor':o.type==='mic'?'mic':'equipment';
for(const o of fixtures){
 const index=fixtures.indexOf(o),before=JSON.stringify(fixtures),target=menu.previous(fixtures,o,ctx.byId);
 assert.equal(target,fixtures.slice(0,index).reverse().find(other=>band(other)===band(o))||null,o.type);
 assert.equal(JSON.stringify(fixtures),before,'Finding a layer cannot mutate the project.');
}
const nodes=new Map();Object.assign(ctx,{
 objects:[],selected:null,sharedReadOnly:false,history:[],stage:{routing:{inputs:[],outputs:[],devices:[]}},
 $:id=>{if(!nodes.has(id))nodes.set(id,{parentElement:{},focus(){}});return nodes.get(id);},
 StageplotRoutingModel:{updateDevice(routing,id,fields){Object.assign(routing.devices.find(device=>device.id===id),fields);}},
 root:{querySelector:()=>null},finishEdit(){},constrain(){},queueDraw(){},renderEditor(){},say(){},
 snapshot:()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects}),
 keepHistory(before){if(before!==ctx.snapshot())ctx.history.push(before);},
 duplicateSelectedObject(){ctx.called='duplicate';},removeSelectedObject(){ctx.called='delete';},
 stageboxCapacity:{'stagebox-16':16},compactModelFamilies:new Set(['electric-guitars','electric-basses','keys','stageboxes','mixers','acoustic-guitars']),showCompactModelDialog(family,type){ctx.called=['model',family,type];},openStageboxIo(id){ctx.called=['stagebox',id];},openSelectedDrumDesigner(){ctx.called=['designer',ctx.selected];},
 setInspectorTab(){ctx.called='properties';},setWorkspacePanel(){},inspector(){}
});
vm.runInContext(extract('change')+'\n'+extract('moveObjectBehind')+'\n'+html.slice(html.indexOf("  objectMenu=StageplotObjectMenu.mount("),html.indexOf('  function duplicateSelectedObject(){')),ctx);
for(const fixture of fixtures){
 ctx.objects=[clone(fixture)];ctx.selected=fixture.id;ctx.history=[];const original=clone(ctx.objects[0]);
 ctx.api.action('label');assert.equal(ctx.objects[0].showLabel,false);ctx.api.action('label');assert.equal(ctx.objects[0].showLabel,true);
 const token=ctx.api.beginRotation();for(const a of [30,44,45,80])ctx.api.rotate(a);ctx.api.endRotation(token,false);
 assert.equal(ctx.history.length,3,'One undo entry per complete gesture: '+fixture.type);assert.equal(ctx.objects[0].angle,80);
 const cancelled=ctx.api.beginRotation();ctx.api.rotate(120);ctx.api.endRotation(cancelled,true);assert.equal(ctx.objects[0].angle,80);assert.equal(ctx.history.length,3);
 const final=clone(ctx.objects[0]);final.angle=original.angle;assert.deepEqual(final,original,'Rotating and hiding a label preserve all object-specific fields: '+fixture.type);
 ctx.api.action('lock');const locked=ctx.snapshot();for(const action of ['edit','rotate','delete','backward','special','model','properties','reset']){ctx.api.action(action);assert.equal(ctx.snapshot(),locked,fixture.type+' locked '+action);}
 ctx.api.edit({label:'blocked',steps:12});ctx.api.rotate(222);assert.equal(ctx.snapshot(),locked);
 ctx.api.action('lock');ctx.api.edit({label:'Updated',steps:9});assert.equal(ctx.objects[0].label,'Updated');assert.equal(ctx.objects[0].steps,fixture.type==='stage-stairs'?9:5);
 const family=ctx.byId[fixture.type].family;if(ctx.compactModelFamilies.has(family)){ctx.api.action('model');assert.deepEqual(ctx.called,['model',family,fixture.type]);}
 ctx.sharedReadOnly=true;const readonly=ctx.snapshot();for(const action of ['label','lock','duplicate','delete','reset','backward','special'])ctx.api.action(action);ctx.api.rotate(200);ctx.api.edit({label:'blocked'});assert.equal(ctx.snapshot(),readonly);ctx.sharedReadOnly=false;
}
ctx.objects=[{id:'di-test',type:'di',label:'DI-Box'}];ctx.selected='di-test';ctx.stage.routing.devices=[{id:'device-test',objectId:'di-test',modelId:'radial-j48',name:'DI-Box'}];
ctx.api.edit({label:'Bass DI'});assert.equal(ctx.stage.routing.devices[0].name,'Bass DI','Renaming a stage DI updates the linked routing device.');
ctx.api.action('model');assert.deepEqual(ctx.called,['model','di-boxes','di-model:radial-j48']);
ctx.api.edit({label:''});assert.equal(ctx.stage.routing.devices[0].name,'DI-Box');
ctx.objects=fixtures.map(clone);
const top=[...ctx.objects].reverse().find(o=>band(o)==='equipment'),target=menu.previous(ctx.objects,top,ctx.byId);ctx.selected=top.id;const before=ctx.snapshot();ctx.api.action('backward');assert.equal(ctx.objects.indexOf(top)+1,ctx.objects.indexOf(target));assert.deepEqual([...ctx.objects].sort((a,b)=>a.id.localeCompare(b.id)),JSON.parse(before).objects.sort((a,b)=>a.id.localeCompare(b.id)));
ctx.objects=[{id:'box',type:'stagebox-16'}];ctx.selected='box';ctx.api.action('special');assert.deepEqual(ctx.called,['stagebox','box']);
for(const type of ['drums','percussion','orchestra','rack','laptop']){ctx.objects=[{id:type,type}];ctx.selected=type;ctx.api.action('special');assert.deepEqual(ctx.called,['designer',type]);}
vm.runInContext(extract('objectLabelLines'),ctx);
assert.deepEqual(clone(ctx.objectLabelLines({showLabel:false},800,true,true,'print')),{lines:[],nameLineCount:0},'Hidden captions also suppress output lines in print.');
console.log('PASS OBJECT MENU: '+fixtures.length+' object types, physical layers, snap hysteresis, undo/cancel, labels, locks, read-only protection and specialist editor dispatch.');
