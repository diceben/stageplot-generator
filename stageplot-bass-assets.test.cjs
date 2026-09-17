const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync('stageplot-studio.html','utf8'),manifest=JSON.parse(fs.readFileSync('stageplot-assets/objects/bass-instruments-v1.json'));
const plain=v=>JSON.parse(JSON.stringify(v));
const extract=name=>{const m=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(m,name);return m[0];};
const ctx={normalizeIoConnector:(v,f='XLR')=>v||f,objects:[],selected:'legacy',change:fn=>fn(),constrain(){},objectIo:o=>o.io||ctx.defaultObjectIo(o)};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8')+';this.render=createStageplotSymbolV3;',ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  let stage ='))+';this.catalog=catalog;this.byId=byId;',ctx);
vm.runInContext(['defaultObjectIo','objectOutputPortKey','objectOutputSignal','objectOutputBaseName','changeSelectedVariant'].map(extract).join('\n'),ctx);
const ids=['bass-j','bass','bass-pj','bass-shortscale','bass-mustang','bass-acoustic','double-bass','bass-violin','bass-rickenbacker'];
assert.deepEqual(manifest.assets.map(a=>a.id),ids);
assert.equal(new Set(ctx.catalog.map(c=>c.id)).size,ctx.catalog.length);
assert.deepEqual(plain(ctx.libraryFamilyVariants('electric-basses',true).map(c=>c.id)).sort(),ids.slice().sort());
assert.equal(ctx.libraryFamilyVariants('electric-basses').length,8,'Model replacement stays within the existing bass signal model.');
assert.equal(ctx.libraryFamilyFor(ctx.byId['double-bass']),'orchestral-strings');
for(const a of manifest.assets){
 const c=ctx.byId[a.id],svg=ctx.render(a.id),frame=ctx.stageplotBassFrame(a.id),bytes=fs.readFileSync('stageplot-assets/objects/'+a.asset);
 assert.equal((svg.match(/<image /g)||[]).length,1);assert(svg.includes('href="stageplot-assets/objects/'+a.asset+'"'));
 assert.doesNotMatch(svg,/<path |<circle |https?:|preserveAspectRatio="none"/);
 assert.equal(bytes[25],6,'Original RGBA output must retain transparency');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);
 assert.equal(bytes.readUInt32BE(16),a.size[0]);assert.equal(bytes.readUInt32BE(20),a.size[1]);
 assert.deepEqual(plain(frame.viewBox),a.viewBox);
 assert(a.viewBox[0]>=0&&a.viewBox[1]>=0&&a.viewBox[0]+a.viewBox[2]<=a.size[0]&&a.viewBox[1]+a.viewBox[3]<=a.size[1]);
 assert.equal(c.w,a.w);assert.equal(c.d,a.d);
 if(a.id==='double-bass')continue;
 assert.deepEqual(plain(c.vb),[frame.width,frame.height]);assert.equal(c.defaultAngle,65);
 const o={id:'signal',type:a.id},io=ctx.defaultObjectIo(o);
 assert.equal(io.outputs.count,1);assert.equal(io.outputs.connector,'Klinke');
 assert.equal(ctx.objectOutputPortKey(o,0),'main');assert.equal(ctx.objectOutputPortKey(o,1),'io-out-2');
 assert.equal(ctx.objectOutputSignal(o,'Klinke'),'Instrument');assert.equal(ctx.objectOutputSignal(o,'Dante'),'Digital');
 assert.equal(ctx.objectOutputBaseName(o),a.id==='bass-acoustic'?'Acoustic Bass':'Bass Guitar');
 assert.equal(c.instrument,true);
}
assert.equal(ctx.stageplotBassFrame('constructor'),null);
// Old model IDs, positions, user labels and configured DI/Mic outputs must survive a model change.
const old={id:'legacy',type:'bass',x:2.3,y:1.8,angle:127,label:'P Bass',io:{outputs:{count:2,connector:'XLR'},stereoPairs:[],aliases:{outputs:['DI','Mic']}}};
ctx.objects=[plain(old)];
for(const c of ctx.libraryFamilyVariants('electric-basses')){
 ctx.changeSelectedVariant(c.id);const o=ctx.objects[0];
 assert.equal(o.type,c.id);assert.equal(o.angle,old.angle);assert.equal(o.x,old.x);assert.equal(o.y,old.y);assert.equal(o.label,old.label);
 assert.deepEqual(plain(o.io),old.io);assert.equal(ctx.objectOutputPortKey(o,0),'main');assert.equal(ctx.objectOutputPortKey(o,1),'io-out-2');
}
for(const [id,w,d] of [['bass',.36,1.16],['bass-j',.36,1.18],['double-bass',.66,1.9]]){assert.equal(ctx.byId[id].w,w);assert.equal(ctx.byId[id].d,d);}
// Existing upright-bass arrangements render the same new sprite without changing geometry or signal IDs.
const orchestra=require('./stageplot-orchestra-v1.js')(),a=manifest.assets.find(a=>a.id==='double-bass');
const upright=orchestra.single('double-bass');Object.assign(upright.parts[0],{id:'o8',x:1.7,y:-2.4,angle:35,pickup:'dual',width:.7,depth:1.95});
const before=plain(upright),markup=orchestra.artwork(upright);
assert(markup.includes(a.asset));assert(markup.includes('viewBox="'+a.viewBox.join(' ')+'"'));assert.doesNotMatch(markup,/double-bass\.webp|preserveAspectRatio="none"/);
assert.deepEqual(upright,before);assert.deepEqual(orchestra.channels(upright).map(r=>r.id),['o8','o8-mic']);
assert.equal(orchestra.imageSource('double-bass'),'./stageplot-assets/objects/'+a.asset);
const share=require('./stageplot-share-v1.js');
const portable=share.clean({stage:{title:'Bass assets'},objects:ids.map((type,i)=>({id:'b'+i,type,x:1,y:1,angle:65}))});
assert.deepEqual(portable.objects.map(o=>o.type),ids);
console.log('PASS BASS ASSETS: nine local RGBA sprites, all picker entries, retained legacy geometry and channel identities, upright artwork and portable models.');
