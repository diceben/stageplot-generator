const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8');
const manifest=JSON.parse(fs.readFileSync('stageplot-assets/objects/manifest.json','utf8'));
const plain=value=>JSON.parse(JSON.stringify(value));
const extract=name=>{const match=html.match(new RegExp('  (?:async )?function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const ctx={normalizeIoConnector:(v,f='XLR')=>['XLR','Klinke','USB','Digital','MADI','Dante'].includes(v)?v:f,
  ioConnectorValues:['XLR','Klinke','USB','Digital','MADI','Dante'],normalizeIoAliasList:(v,n)=>Array.from({length:n},(_,i)=>String(v?.[i]||'').trim()),
  validStage:()=>null,normalizeExtraStairs:()=>[],normalizeCables:()=>[],stageboxCapacity:{},
  projectText:(v,n)=>String(v??'').slice(0,n),objects:[],
  ioValueText:(v,k)=>v.count?v.count+' '+(k==='outputs'?'Outs':'Inputs')+' · '+v.connector:'Keine Outs',
  routeSpec:(o,port,instrument,mode,signalType,extra)=>({sourceKey:o.id+':'+port,instrument,mode,signalType,...extra})};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('stageplot-drums-v12.js','utf8')+'\nthis.drumModel=createStageplotDrumModel();',ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8')+'\nthis.render=createStageplotSymbolV3;',ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog ='),html.indexOf('  let stage ='))+'\nthis.catalog=catalog;this.byId=byId;',ctx);
ctx.parseOutsValue=value=>ctx.parseIoValue(value,'outs');ctx.objectIo=o=>ctx.normalizeObjectIo(o.io,o);ctx.ioAliasAt=(io,kind,n)=>io.aliases[kind][n-1]||'';
vm.runInContext(['parseIoValue','defaultObjectIo','normalizeObjectIo','objectOutputPortKey','objectOutputBaseName','objectOutputSignal','generatedInputSpecs','generatedOutputSpecs','projectIdentity','normalizeSetupDocument'].map(extract).join('\n'),ctx);

const installed=manifest.objects.filter(o=>ctx.byId[o.id]);
assert.equal(manifest.objects.length,40,'All four illustrated phases must be documented.');
assert.equal(installed.length,manifest.objects.length,'An illustrated object is missing from the catalog.');
assert.equal(new Set(ctx.catalog.map(o=>o.id)).size,ctx.catalog.length,'Duplicate catalog type.');
for(const entry of installed){
  const c=ctx.byId[entry.id],markup=ctx.render(entry.id),asset=markup.match(/href="([^"]+)"/)?.[1];
  assert.equal(asset,'stageplot-assets/objects/'+entry.id+'-v1.webp');
  assert.match(markup,/data-rendered-object-asset=/);assert.doesNotMatch(markup,/https?:|data:|<script/);
  assert(fs.existsSync(asset),entry.id+' asset missing');
  const bytes=fs.readFileSync(asset);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert(bytes.length>1000&&bytes.length<400000,entry.id+' asset size is outside its offline budget.');
  assert.deepEqual(plain(c.vb),[Math.round(c.w*100),Math.round(c.d*100)]);
  assert.equal(c.w,entry.w);assert.equal(c.d,entry.d);
  assert.equal(c.defaultAngle,entry.defaultAngle);assert.equal(c.category,entry.category);
  assert.equal(ctx.drumModel.isDrums(entry.id),false,'New object incorrectly opens drum designer.');
  const io=ctx.defaultObjectIo({type:entry.id});assert.equal(io.inputs.count,entry.ioDefaults.inputs);assert.equal(io.outputs.count,entry.ioDefaults.outputs);
  assert.deepEqual(plain(io.stereoPairs),entry.ioDefaults.stereoPairs||[]);
}
assert.throws(()=>ctx.render('../external'),/Unbekanntes Symbol/);
assert.throws(()=>ctx.render('constructor'),/Unbekanntes Symbol/);
ctx.objects=installed.map((o,i)=>({id:'station-'+(i+1),type:o.id,x:i%8,y:Math.floor(i/8),angle:i*45,label:o.name,inventoryId:'inventory-object-'+i}));
const inputs=ctx.generatedInputSpecs(),outputs=ctx.generatedOutputSpecs();
assert.equal(inputs.length,installed.reduce((n,o)=>n+o.ioDefaults.outputs,0));
assert.equal(outputs.length,installed.reduce((n,o)=>n+o.ioDefaults.inputs,0));
assert(inputs.filter(row=>row.instrument.includes('Conga')).every(row=>row.signalType==='Mic'));
assert(![...inputs,...outputs].some(row=>row.instrument.includes('Musikerstuhl')),'Furniture creates audio routes.');
for(const o of installed.filter(o=>o.ioDefaults.stereoPairs?.length)){
  const station=ctx.objects.find(s=>s.type===o.id),rows=inputs.filter(r=>r.sourceKey.startsWith(station.id+':'));
  assert.deepEqual(plain(rows.map(r=>r.mode)),['Stereo L','Stereo R']);assert.equal(rows[0].stereoGroup,rows[1].stereoGroup);
}

// Real document normalization and portable export roundtrip retain new types,
// user-edited I/O, rotation, inventory links and existing legacy instruments.
const document={stage:{title:'Asset regression fixture',w:12,d:8,stairs:'none',iem:'none',iemLength:0,iemDepth:0,iemX:0,iemY:0},objects:plain(ctx.objects)};
document.objects.push({id:'legacy-guitar',type:'guitar',x:1,y:2,angle:65,label:'Existing guitar'});
const conga=document.objects.find(o=>o.type==='congas');conga.io={outputs:{count:3,connector:'XLR'},aliases:{outputs:['High','Low','Room']}};
const normalized=ctx.normalizeSetupDocument(document);
const exporter=require('./stageplot-export-v42.js').createStageplotExportV42();
const encoded=exporter.stringifySetupJson(exporter.createSetupExport(document.stage.title,normalized,{normalizeDocument:ctx.normalizeSetupDocument}));
const restored=exporter.parseSetupJson(encoded,{normalizeDocument:ctx.normalizeSetupDocument}).document;
assert.deepEqual(plain(restored),plain(normalized));
assert.deepEqual(restored.objects.map(o=>o.type),document.objects.map(o=>o.type));
assert.equal(restored.objects.find(o=>o.type==='congas').io.outputs.count,3);
assert.equal(restored.objects[0].inventoryId,document.objects[0].inventoryId);
assert.throws(()=>ctx.normalizeSetupDocument({...document,objects:[{type:'custom-upload',x:0,y:0,angle:0,asset:'https://example.com/image.png'}]}),/Ungültiger Baustein/);
// Export preserves the original compressed bytes and reuses the same cached
// request instead of expanding forty assets to PNG inside the intermediate SVG.
const assetBytes=fs.readFileSync('stageplot-assets/objects/tablet-stand-v1.webp');
let reads=0;
Object.assign(ctx,{URL,window:{location:{href:'https://stageplot.test/',origin:'https://stageplot.test'}},exportImageCache:new Map(),
  fetch:async url=>{assert.equal(url.pathname,'/stageplot-assets/objects/tablet-stand-v1.webp');reads++;return {ok:true,blob:async()=>assetBytes};},
  blobDataUrl:async bytes=>'data:image/webp;base64,'+bytes.toString('base64'),
  Image:class{constructor(){throw new Error('Compressed WebP unnecessarily rasterized.');}}});
vm.runInContext(extract('localImageDataUrl'),ctx);
Promise.all([ctx.localImageDataUrl('stageplot-assets/objects/tablet-stand-v1.webp'),ctx.localImageDataUrl('stageplot-assets/objects/tablet-stand-v1.webp')]).then(values=>{
  assert.equal(reads,1);assert.equal(values[0],values[1]);
  assert.deepEqual(Buffer.from(values[0].split(',')[1],'base64'),assetBytes);
  console.log('PASS ILLUSTRATED OBJECTS: '+installed.length+' local raster assets, catalog geometry, routing, stereo, legacy, portable roundtrip and compact export.');
}).catch(error=>{console.error(error);process.exitCode=1;});
