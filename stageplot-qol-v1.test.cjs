const assert=require('node:assert/strict');
const Q=require('./stageplot-qol-v1.js');
const size=o=>({w:o.w,d:o.d}),plain=o=>JSON.parse(JSON.stringify(o));
const items=[{id:'a',x:1.13,y:1.4,w:1,d:2,angle:90},{id:'b',x:4.57,y:2,w:1,d:1,angle:0},{id:'c',x:8.1,y:3.5,w:2,d:1,angle:0}],before=plain(items);
for(const action of ['left','right','top','bottom','center-x','center-y']){
  const out=Q.arrange(items,action,size),changed=items.map(o=>({...o,...out.find(p=>p.id===o.id)}));
  const b=changed.map(o=>Q.box(o,size));
  const values=action==='center-x'?changed.map(o=>o.x):action==='center-y'?changed.map(o=>o.y):b.map(box=>box[action]);
  assert(Math.max(...values)-Math.min(...values)<1e-9,action);
  assert.deepEqual(items,before,'Planning never mutates source objects');
}
const spaced=items.map(o=>({...o,...Q.arrange(items,'space-x',size).find(p=>p.id===o.id)})),boxes=spaced.map(o=>Q.box(o,size));
assert(Math.abs((boxes[1].left-boxes[0].right)-(boxes[2].left-boxes[1].right))<1e-9);
assert.equal(spaced[0].x,items[0].x);assert.equal(spaced[2].x,items[2].x);
let rotated=items;for(let i=0;i<4;i++)rotated=rotated.map(o=>({...o,...Q.arrange(rotated,'rotate-right',size).find(p=>p.id===o.id)}));
for(let i=0;i<3;i++){assert(Math.abs(rotated[i].x-items[i].x)<1e-9);assert(Math.abs(rotated[i].y-items[i].y)<1e-9);assert.equal(rotated[i].angle,items[i].angle);}
assert.equal(Q.arrange(items.map(o=>({...o,locked:o.id==='b'})),'left',size),null);
assert.equal(Q.arrange(items.slice(0,2),'space-x',size),null);
assert.equal(Q.arrange(items.map(o=>({...o,x:1})),'space-x',size),null,'Do not introduce overlapping equal gaps');
const allowed=new Set([...Array.from({length:20},(_,i)=>'item-'+i),'family:keys']);
let data=Q.normalizePreferences({favorites:['item-1','item-1','unknown',null],recent:['item-2','item-2','unknown']},allowed);
assert.deepEqual(data,{version:1,favorites:['item-1'],recent:['item-2']});
data=Q.favorite(data,'family:keys',allowed);assert(data.favorites.includes('family:keys'));
data=Q.favorite(data,'item-1',allowed);assert(!data.favorites.includes('item-1'));
for(let i=0;i<20;i++)data=Q.remember(data,'item-'+i,allowed);
assert.equal(data.recent.length,12);assert.equal(data.recent[0],'item-19');
data=Q.remember(data,'item-12',allowed);assert.equal(data.recent[0],'item-12');assert.equal(data.recent.length,12);
const storage={value:'{bad',getItem(){return this.value},setItem(key,value){assert.equal(key,Q.key);this.value=value}};
assert.deepEqual(Q.readPreferences(storage,allowed),{version:1,favorites:[],recent:[]});assert(Q.writePreferences(storage,data));assert.deepEqual(Q.readPreferences(storage,allowed),data);
const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('full')}};assert.equal(Q.writePreferences(blocked,data),false);assert.deepEqual(Q.readPreferences(blocked,allowed),{version:1,favorites:[],recent:[]});
console.log('PASS QOL: rotated-footprint alignment, equal clear gaps, rotation roundtrip, locks, immutable planning; validated favorites/recents, deduplication, storage roundtrip and blocked storage.');

// Selection state stays ephemeral and cannot leak across projects; sparse IDs stay unique.
const fs=require('node:fs'),vm=require('node:vm'),html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(m);return m[0];};
const context={stage:{projectId:'one'},objects:[{id:'station-1'},{id:'station-3'}],selected:null,selectionIds:new Set(),selectionMode:false,selectionProject:null,nextId:3};vm.createContext(context);
vm.runInContext(['selectedObjects','setSelection','toggleSelection','nextObjectId'].map(extract).join('\n'),context);
context.setSelection(['station-1','station-3']);assert.equal(context.selectedObjects().length,2);
context.toggleSelection('station-1');assert.equal(context.selectedObjects().length,1);context.toggleSelection('station-3');assert.equal(context.selectedObjects().length,0);
assert.equal(context.nextObjectId(),'station-4');assert.equal(context.nextObjectId(),'station-5');
context.setSelection(['station-1','station-3']);context.stage={projectId:'two'};assert.equal(context.selectedObjects().length,1,'Other project retains at most its primary object, never the old cohort');
