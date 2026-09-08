const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const catalog=require('./stageplot-venue-catalog-v1.js'),G=require('./stageplot-geometry-v1.js'),exporter=require('./stageplot-export-v42.js').createStageplotExportV42();
const html=fs.readFileSync('stageplot-studio.html','utf8'),json=value=>JSON.parse(JSON.stringify(value));
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
assert.equal(catalog.search().length,3);
assert.deepEqual(catalog.search('wIeN B72').map(v=>v.id),['at-wien-b72']);
assert.equal(catalog.search('GÜRTEL')[0].name,'B72');assert.equal(catalog.search('guertel')[0].name,'B72');assert.equal(catalog.search('gurtel')[0].name,'B72');
assert.equal(catalog.search('Vienna','Theater').length,2);assert.equal(catalog.search('B72','Theater').length,0);
assert.equal(catalog.search('Unbekannt').length,0);assert.equal(catalog.search('<script>').length,0);assert.throws(()=>catalog.createDocument('missing'),/nicht im Katalog/);
const changed=catalog.search()[0];changed.width=99;changed.source.url='changed';assert.equal(catalog.get(changed.id).width,4.18);
const storage={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}};
const nodes=new Map(),ctx={StageplotGeometry:G,StageplotVenueCatalog:catalog,WeakMap,TextEncoder,TextDecoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),clone:json,
  drumModel:{isDrums:()=>false},byId:{riser:{}},normalizeExtraStairs:()=>[],normalizeCables:()=>[],projectText:(v,max)=>String(v??'').slice(0,max),window:{localStorage:storage},
  sharedReadOnly:false,stage:null,objects:[],activeSetupId:null,activeDraftId:null,activeDraftSavedAt:null,draftRevision:null,draftBaseline:null,draftTimer:null,draftState:'idle',drag:null,editBefore:null,
  draftStorageKey:'drafts',workspaceStorageKey:'workspace',finishEdit:()=>{},flushDraft:()=>{},resetEditorView:()=>{},show:()=>{},say:()=>{},draftStatus:()=>{},persistViewport:()=>{},draftFailure:()=>{},
  $:id=>{if(!nodes.has(id))nodes.set(id,{open:false,close(){this.open=false;}});return nodes.get(id);},isSampleProject:()=>false};
ctx.snapshot=()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects});vm.createContext(ctx);
vm.runInContext(['iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizeSetupDocument','encodeShareDocument','decodeShareDocument','readDraftLibrary','writeDraftLibrary','writeWorkspace','resetDraftTracking','persistDraft','activateSetupDocument','createCatalogProject'].map(extract).join('\n'),ctx);
for(const entry of catalog.search()){
  assert.match(entry.source.url,/^https:\/\//);assert.match(entry.source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(entry.source.date);assert.ok(entry.scope);
  const document=json(ctx.normalizeSetupDocument(catalog.createDocument(entry.id))),g=G.compile(document.stage.geometry);
  assert.ok(Math.abs(g.area-entry.width*entry.depth)<.00001);assert.equal(document.stage.geometry.measured,false);assert.equal(document.objects.length,0);
  assert.equal(document.stage.stairs,'unknown');assert.equal(document.stage.iem,'unknown');assert.equal(document.stage.geometry.height,entry.height);
  assert.equal(document.stage.project.venue,entry.name+', Wien');assert.ok(document.stage.geometry.notes.includes(entry.source.url));assert.ok(document.stage.geometry.notes.includes(entry.source.date));
  const payload=exporter.createSetupExport(entry.name,document,{normalizeDocument:ctx.normalizeSetupDocument,exportedAt:1});
  const imported=exporter.parseSetupJson(exporter.stringifySetupJson(payload,{normalizeDocument:ctx.normalizeSetupDocument}),{normalizeDocument:ctx.normalizeSetupDocument});
  assert.deepEqual(json(imported.document),document);assert.deepEqual(json(ctx.decodeShareDocument('#share='+ctx.encodeShareDocument(document))),document);
  document.stage.geometry.parts[0].w=28;assert.equal(catalog.createDocument(entry.id).stage.geometry.parts[0].w,entry.width);
}
// Actual activation and local persistence: a second event preserves all old projects and source data.
ctx.createCatalogProject('at-wien-b72','Testband');const firstId=ctx.activeDraftId;
assert.equal(ctx.stage.title,'Testband · B72');ctx.stage.geometry.parts[0].w=5.18;ctx.stage.project.notes='Eigene Notiz';
ctx.createCatalogProject('at-wien-b72');const secondId=ctx.activeDraftId;
assert.notEqual(secondId,firstId);assert.equal(ctx.stage.geometry.parts[0].w,4.18);assert.equal(ctx.stage.project.notes,'');
const saved=json(ctx.readDraftLibrary(storage));assert.equal(saved.entries.length,2);assert.equal(saved.entries.find(v=>v.id===firstId).document.stage.geometry.parts[0].w,5.18);
assert.equal(saved.entries.find(v=>v.id===firstId).document.stage.project.notes,'Eigene Notiz');assert.equal(saved.lastId,secondId);
ctx.sharedReadOnly=true;ctx.createCatalogProject('at-wien-muth');assert.equal(ctx.activeDraftId,secondId);ctx.sharedReadOnly=false;
const previous=ctx.snapshot(),setItem=storage.setItem;storage.setItem=()=>{throw new Error('Speicher voll');};
assert.throws(()=>ctx.createCatalogProject('at-wien-muth'),/aktuellen Entwurf lokal sichern/);assert.equal(ctx.snapshot(),previous);storage.setItem=setItem;
console.log('PASS VENUE CATALOG: freie Suche, präzise Quelldaten, unabhängige lokale Projekte, Speicherfehler, JSON- und Link-Roundtrips.');
