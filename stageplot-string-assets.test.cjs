const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync('stageplot-studio.html','utf8'),manifest=JSON.parse(fs.readFileSync('stageplot-assets/objects/electric-instruments-v1.json'));
const plain=v=>JSON.parse(JSON.stringify(v));
const extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(m,name);return m[0];};
const ctx={normalizeIoConnector:(v,f='XLR')=>v||f,objects:[],selected:'legacy',change:fn=>fn(),constrain(){},objectIo:o=>o.io||ctx.defaultObjectIo(o)};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8')+';this.render=createStageplotSymbolV3;',ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  let stage ='))+';this.catalog=catalog;this.byId=byId;',ctx);
vm.runInContext(['defaultObjectIo','objectOutputPortKey','objectOutputSignal','objectOutputBaseName','changeSelectedVariant'].map(extract).join('\n'),ctx);
assert.equal(manifest.assets.length,14);assert.equal(ctx.libraryFamilyVariants('electric-guitars').length,11);
assert.equal(new Set(ctx.catalog.map(c=>c.id)).size,ctx.catalog.length);
for(const a of manifest.assets){
 const c=ctx.byId[a.id],svg=ctx.render(a.id),bytes=fs.readFileSync('stageplot-assets/objects/'+a.asset);
 assert.equal((svg.match(/<image /g)||[]).length,1);assert(svg.includes('href="stageplot-assets/objects/'+a.asset+'"'));
 assert.match(svg,/preserveAspectRatio="xMidYMid meet"/);assert.doesNotMatch(svg,/<path |<circle |https?:|preserveAspectRatio="none"/);
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(bytes[25],6,'PNG must retain RGBA transparency');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);
 assert.deepEqual(plain(c.vb),[Math.round(c.w*1000),Math.round(c.d*1000)]);
 assert.equal(c.w,a.w);assert.equal(c.d,a.d);assert.equal(c.defaultAngle,65);
 const frame=ctx.stageplotStringFrame(a.id);assert.equal(frame.width,c.vb[0]);assert.equal(frame.height,c.vb[1]);
 assert.deepEqual(plain(frame.viewBox),a.viewBox);assert(a.viewBox[0]>=0&&a.viewBox[1]>=0&&a.viewBox[0]+a.viewBox[2]<=a.size[0]&&a.viewBox[1]+a.viewBox[3]<=a.size[1]);
 const o={id:'signal',type:a.id},io=ctx.defaultObjectIo(o),acoustic=['mandolin','ukulele'].includes(a.id);
 assert.equal(io.outputs.count,1);assert.equal(io.outputs.connector,acoustic?'XLR':'Klinke');
 assert.equal(ctx.objectOutputPortKey(o,0),'main');assert.equal(ctx.objectOutputPortKey(o,1),'io-out-2');
 assert.equal(ctx.objectOutputSignal(o,io.outputs.connector),acoustic?'Mic':'Instrument');
 assert.equal(ctx.objectOutputSignal(o,'USB'),'Digital');
 assert.equal(c.instrument,true);
}
assert.equal(ctx.stageplotStringFrame('constructor'),null);
// A model change must not alter the edited channel configuration or source key.
const old={id:'legacy',type:'guitar',x:2.3,y:1.8,angle:127,label:'Gitarre links',io:{outputs:{count:2,connector:'XLR'},stereoPairs:[],aliases:{outputs:['DI','Mic']}}};
ctx.objects=[plain(old)];const key=ctx.objectOutputPortKey(ctx.objects[0],0);
for(const c of ctx.libraryFamilyVariants('electric-guitars')){
 ctx.changeSelectedVariant(c.id);const o=ctx.objects[0];assert.equal(o.type,c.id);assert.equal(o.angle,127);assert.equal(o.x,2.3);assert.equal(o.y,1.8);assert.equal(o.label,old.label);assert.deepEqual(plain(o.io),old.io);assert.equal(ctx.objectOutputPortKey(o,0),key);
}
for(const [id,w,d] of [['guitar',.34,1],['guitar-tele',.35,1],['guitar-les-paul',.34,.99],['guitar-es',.42,1.04]]){assert.equal(ctx.byId[id].w,w);assert.equal(ctx.byId[id].d,d);}
console.log('PASS STRING ASSETS: 14 RGBA images, 11 electric models, local rendering, dimensions, signal defaults and model changes preserving route identities.');
