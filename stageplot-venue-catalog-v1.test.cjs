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
vm.runInContext(['projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizedObjectDimensions','editableObjectSize','normalizeSetupDocument','encodeShareDocument','decodeShareDocument','readDraftLibrary','writeDraftLibrary','writeWorkspace','resetDraftTracking','persistDraft','activateSetupDocument','createCatalogProject'].map(extract).join('\n'),ctx);
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
const firstIdentity=ctx.stage.projectId;assert(firstIdentity);
assert.equal(ctx.stage.title,'Testband · B72');ctx.stage.geometry.parts[0].w=5.18;ctx.stage.project.notes='Eigene Notiz';
ctx.createCatalogProject('at-wien-b72');const secondId=ctx.activeDraftId;
assert.notEqual(secondId,firstId);assert.equal(ctx.stage.geometry.parts[0].w,4.18);assert.equal(ctx.stage.project.notes,'');
assert.notEqual(ctx.stage.projectId,firstIdentity);
const saved=json(ctx.readDraftLibrary(storage));assert.equal(saved.entries.length,2);assert.equal(saved.entries.find(v=>v.id===firstId).document.stage.geometry.parts[0].w,5.18);
assert.equal(saved.entries.find(v=>v.id===firstId).document.stage.project.notes,'Eigene Notiz');assert.equal(saved.lastId,secondId);
ctx.sharedReadOnly=true;ctx.createCatalogProject('at-wien-muth');assert.equal(ctx.activeDraftId,secondId);ctx.sharedReadOnly=false;
const previous=ctx.snapshot(),setItem=storage.setItem;storage.setItem=()=>{throw new Error('Speicher voll');};
assert.throws(()=>ctx.createCatalogProject('at-wien-muth'),/aktuellen Entwurf lokal sichern/);assert.equal(ctx.snapshot(),previous);storage.setItem=setItem;
// The shared project dialog stays available in Standard, with entry modes preserving field values.
const buttons=['custom','catalog','templates'].map(source=>({dataset:{npSource:source},setAttribute(name,value){this[name]=value;}}));
const panels=['custom','catalog','templates'].map(source=>({dataset:{npPanel:source},hidden:false}));
const locationLabel={hidden:false};ctx.$('sp-np-location').closest=()=>locationLabel;
ctx.root={querySelectorAll:selector=>selector==='[data-np-source]'?buttons:selector==='[data-np-panel]'?panels:[],querySelector:()=>({open:false})};
ctx.renderNewProjectDialog=()=>{};
for(const [dim,max] of [['width',30],['depth',20]])Object.assign(ctx.$('sp-np-'+dim),{dataset:{max},setAttribute(key,value){this[key]=value;},focus(){}});ctx.esc=String;ctx.venueSizeText=s=>s.w+' × '+s.d+' m';ctx.setTimeout=()=>{};ctx.accountPlan='free';ctx.dashboardProjects=()=>[{}];ctx.npStageSource='custom';ctx.npSize={width:8,depth:5};
ctx.$('sp-newproject-dialog').showModal=function(){this.open=true;};ctx.$('sp-upgrade-dialog').showModal=function(){this.open=true;};
vm.runInContext(['readNewProjectDimensions','npProjectName','setNewProjectSource','openNewProjectDialog','createProjectFromDialog','createProjectFromTemplate','newVenueEvent','normalizeStageTemplate'].map(extract).join('\n'),ctx);
ctx.openNewProjectDialog();assert.equal(ctx.$('sp-newproject-dialog').open,true);assert.equal(ctx.$('sp-upgrade-dialog').open,false,'Der kostenlose Katalog bleibt über Neues Projekt erreichbar.');
ctx.$('sp-np-band').value='Testband';ctx.$('sp-np-location').value='Testsaal';ctx.npSize.width=9;ctx.$('sp-np-width').value='9';
ctx.setNewProjectSource('catalog');assert.equal(locationLabel.hidden,true);assert.equal(ctx.$('sp-np-create').hidden,true);assert.equal(ctx.npProjectName(),'Testband');
ctx.setNewProjectSource('custom');assert.equal(locationLabel.hidden,false);assert.equal(ctx.$('sp-np-create').hidden,false);assert.equal(ctx.npProjectName(),'Testband – Testsaal');assert.equal(ctx.npSize.width,9);
ctx.createProjectFromDialog();assert.equal(ctx.$('sp-upgrade-dialog').open,true);assert.equal(ctx.snapshot(),previous,'Der bestehende Plan bleibt beim Projektlimit erhalten.');
ctx.accountPlan='pro';ctx.stageSurfaceDefault='light';ctx.defaultProjectInfo=name=>ctx.normalizeProjectInfo({},name);ctx.defaultRouting=()=>({inputs:[],outputs:[],generatedAt:0});
ctx.stage.geometry.notes='Alte Hausnotiz';ctx.stage.extraStairs=[{id:'old-stair'}];ctx.stage.cables=[{id:'old-cable'}];
ctx.stage.venueRef={templateId:'old-house',name:'Alt',revision:3};
ctx.createProjectFromDialog();assert.equal(ctx.stage.w,9);assert.equal(ctx.stage.d,5);assert.equal(ctx.stage.geometry,undefined);assert.equal(ctx.stage.venueRef,undefined);assert.equal(ctx.objects.length,0);
assert.equal(ctx.stage.project.artist,'Testband');assert.equal(ctx.stage.project.venue,'Testsaal');assert.equal(ctx.stage.extraStairs.length,0);assert.equal(ctx.stage.cables.length,0);
const dimensionsBefore=ctx.snapshot();
for(const invalid of ['', '0', '-3', '31', '8.555', 'NaN', 'Infinity', '8x']){
  ctx.$('sp-np-width').value=invalid;ctx.createProjectFromDialog();assert.equal(ctx.snapshot(),dimensionsBefore);assert.equal(ctx.$('sp-np-error').hidden,false);
}
ctx.$('sp-np-width').value='8,50';ctx.$('sp-np-depth').value='5.25';assert(ctx.readNewProjectDimensions());assert.equal(ctx.npSize.width,8.5);assert.equal(ctx.npSize.depth,5.25);
ctx.$('sp-np-depth').value='21';assert.equal(ctx.readNewProjectDimensions(),false);
ctx.$('sp-np-depth').value='20';assert(ctx.readNewProjectDimensions());
const fresh=json(ctx.stage);assert.equal(ctx.$('sp-newproject-dialog').open,false);assert.equal(ctx.$('sp-np-error').hidden,true);
const template={id:'stage-template-demo',name:'Vorlagensaal',savedAt:1,...catalog.createDocument('at-wien-muth')};
ctx.readStageTemplates=()=>[json(template)];ctx.setNewProjectSource('templates');assert.ok(ctx.$('sp-np-templates').innerHTML.includes('Vorlagensaal'));
ctx.createProjectFromTemplate(template.id);assert.equal(ctx.stage.w,16);assert.equal(ctx.stage.project.artist,'Testband');assert.equal(ctx.stage.project.venue,'Testsaal');assert.equal(ctx.stage.title,'Testband – Testsaal');
assert.equal(ctx.stage.venueRef.templateId,template.id);ctx.stage.geometry.parts[0].w=20;assert.equal(template.stage.geometry.parts[0].w,16);
assert.ok(ctx.readDraftLibrary(storage).entries.some(entry=>JSON.stringify(entry.document.stage)===JSON.stringify(fresh)),'Der manuell erstellte Vorgänger ist gespeichert.');
ctx.readStageTemplates=()=>[];ctx.setNewProjectSource('templates');assert.ok(ctx.$('sp-np-templates').innerHTML.includes('Noch keine Bühnenvorlagen'));const beforeMissing=ctx.snapshot();ctx.createProjectFromTemplate('missing');assert.equal(ctx.snapshot(),beforeMissing);assert.match(ctx.$('sp-np-error').textContent,/inzwischen entfernt/);
console.log('PASS VENUE CATALOG: freie Suche, präzise Quelldaten, unabhängige lokale Projekte, Speicherfehler, JSON- und Link-Roundtrips.');
