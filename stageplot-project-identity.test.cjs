const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),clone=value=>JSON.parse(JSON.stringify(value));
const extract=name=>{const match=html.match(new RegExp('  (?:async )?function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const exporter=require('./stageplot-export-v42.js').createStageplotExportV42();
const catalog=require('./stageplot-venue-catalog-v1.js'),geometry=require('./stageplot-geometry-v1.js');
function environment(){
  const values=new Map(),nodes=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
  const ctx={clone,StageplotGeometry:geometry,drumModel:{isDrums:()=>false},byId:{},normalizeExtraStairs:()=>[],normalizeCables:()=>[],projectText:(v,max)=>String(v??'').slice(0,max),
    window:{localStorage:storage},localStorage:storage,setupStorageKey:'setups',draftStorageKey:'drafts',workspaceStorageKey:'workspace',stage:null,objects:[],activeSetupId:null,activeDraftId:null,
    activeDraftSavedAt:null,draftRevision:null,draftBaseline:null,draftTimer:null,draftState:'idle',drag:null,editBefore:null,history:[],future:[],view:'editor',sharedReadOnly:false,
    finishEdit(){},resetEditorView(){},restoreViewport(){},persistViewport(){},show(){},say(){},change:fn=>fn(),projectAccountStore:()=>null,renderSetupLibrary(){},updateProjectHeading(){},
    setupError:error=>{throw error;},isSampleProject:()=>false,cloudBridge:null,hasLinkedAccount:()=>false,accountSession:null,linkedAccount:()=>({ownerId:'owner'}),clearTimeout(){},
    $:id=>{if(!nodes.has(id))nodes.set(id,{open:false,close(){this.open=false;}});return nodes.get(id);}};
  ctx.snapshot=()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects});ctx.draftStatus=state=>ctx.draftState=state;ctx.draftFailure=error=>{ctx.draftState='error';ctx.lastError=error;};
  vm.createContext(ctx);
  vm.runInContext(['projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizeSetupDocument','readSetupLibrary','writeSetupLibrary','readDraftLibrary','writeDraftLibrary','readWorkspace','writeWorkspace','resetDraftTracking','persistDraft','flushDraft','syncDraftAfterManualSave','restoreDraftEntry','activateSetupDocument','saveSetup','dashboardProjects','projectStorageStatus','prepareDraftsForSync','copyProjectIdentity'].map(extract).join('\n'),ctx);
  return ctx;
}
const legacyDocument=()=>catalog.createDocument('at-wien-b72');
const draft=(id,sourceSetupId=null,savedAt=10)=>({id,sourceSetupId,savedAt,revision:'original',name:'Alt',document:legacyDocument()});
const ctx=environment(),legacy=draft('draft-offline');
ctx.writeDraftLibrary(ctx.localStorage,{entries:[legacy],lastId:legacy.id});ctx.writeWorkspace(ctx.localStorage,legacy);
const raw=ctx.localStorage.getItem('drafts');
const first=ctx.readDraftLibrary(ctx.localStorage).entries[0];assert.equal(first.document.stage.projectId,'SP-OFFLINE');
assert.equal(ctx.localStorage.getItem('drafts'),raw,'Die Migration liest bestehende Daten ohne Schreibzwang.');
assert.equal(ctx.readWorkspace(ctx.localStorage).document.stage.projectId,first.document.stage.projectId);
ctx.restoreDraftEntry(first);ctx.stage.title='Umbenannt';ctx.stage.project.name='Umbenannt';ctx.stage.w=9;assert(ctx.persistDraft(true));
const identity=ctx.stage.projectId;assert.equal(identity,'SP-OFFLINE');assert.equal(ctx.activeDraftId,legacy.id);
ctx.saveSetup('Umbenannt');const setupId=ctx.activeSetupId;assert(setupId);assert.equal(ctx.stage.projectId,identity);
assert.equal(ctx.readSetupLibrary(ctx.localStorage)[0].document.stage.projectId,identity,'Erstes manuelles Speichern erhält die sichtbare ID.');
ctx.stage.title='Neuer Name';ctx.stage.project.name='Neuer Name';ctx.saveSetup('Neuer Name',setupId);assert.equal(ctx.stage.projectId,identity);
ctx.activateSetupDocument(ctx.readSetupLibrary(ctx.localStorage)[0].document,setupId);assert.equal(ctx.stage.projectId,identity);assert(ctx.persistDraft(true));
const payload=exporter.createSetupExport(ctx.stage.title,{stage:ctx.stage,objects:ctx.objects},{normalizeDocument:ctx.normalizeSetupDocument});
const imported=exporter.parseSetupJson(exporter.stringifySetupJson(payload),{normalizeDocument:ctx.normalizeSetupDocument});assert.equal(imported.document.stage.projectId,identity);
ctx.saveSetup('Eigenständige Kopie',null,true);const copyId=ctx.stage.projectId;assert.notEqual(copyId,identity);
assert.equal(ctx.readSetupLibrary(ctx.localStorage).find(item=>item.id===setupId).document.stage.projectId,identity);
assert.equal(ctx.dashboardProjects().filter(item=>item.document.stage.projectId===identity).length,1,'Speichern unter erhält das Original ohne zusätzliche Geisterkarte.');
ctx.activateSetupDocument(imported.document,null,{persist:true,copy:true});assert.notEqual(ctx.stage.projectId,identity);assert.notEqual(ctx.stage.projectId,copyId);
assert.equal(imported.document.stage.projectId,identity,'Eine importierte Kopie verändert die Datei nicht.');
// A named legacy setup and its working draft converge; old conflict drafts stay distinct.
const old=environment(),a=draft('draft-a','setup-house',20),b=draft('draft-b','setup-house',10);
old.writeSetupLibrary(old.localStorage,[{id:'setup-house',name:'Haus',savedAt:10,document:legacyDocument()}]);old.writeDraftLibrary(old.localStorage,{entries:[a,b],lastId:a.id});
const oldDrafts=old.readDraftLibrary(old.localStorage).entries;assert.equal(oldDrafts[0].document.stage.projectId,old.readSetupLibrary(old.localStorage)[0].document.stage.projectId);assert.notEqual(oldDrafts[1].document.stage.projectId,oldDrafts[0].document.stage.projectId);
old.restoreDraftEntry(oldDrafts[0]);const stored=old.readDraftLibrary(old.localStorage);stored.entries[0].revision='another-tab';old.writeDraftLibrary(old.localStorage,stored);
old.stage.project.notes='Meine parallele Änderung';assert(old.persistDraft(true));assert.notEqual(old.stage.projectId,'SP-HOUSE');assert.equal(old.activeSetupId,null);
assert.equal(old.readDraftLibrary(old.localStorage).entries.find(item=>item.id===a.id).document.stage.projectId,'SP-HOUSE');
// Linking a device retains both local identities when promoting drafts to cloud records.
old.hasLinkedAccount=()=>true;old.cloudBridge={local:{matches:()=>false}};const before=new Map(old.readDraftLibrary(old.localStorage).entries.map(item=>[item.id,item.document.stage.projectId]));
old.prepareDraftsForSync();for(const item of old.readDraftLibrary(old.localStorage).entries){assert.equal(item.document.stage.projectId,before.get(item.id));assert.equal(old.readSetupLibrary(old.localStorage).find(setup=>setup.id===item.sourceSetupId).document.stage.projectId,item.document.stage.projectId);}
// Failure to save never assigns an unpersisted identity or changes a stored project.
const failed=environment();failed.stage=failed.normalizeSetupDocument(legacyDocument()).stage;
failed.localStorage.setItem=()=>{throw new Error('Speicher voll');};assert.equal(failed.persistDraft(true),false);assert.equal(failed.stage.projectId,undefined);assert.equal(failed.activeDraftId,null);assert.equal(failed.draftState,'error');
assert.equal(failed.projectStorageStatus(null,true).state,'error');assert.equal(failed.projectStorageStatus(null,false).state,'idle');
// Status reflects the exact current document, plus authentication and write confirmation.
const entry={id:'setup-status',kind:'setup',savedAt:10,name:'Probe',document:legacyDocument()};
assert.equal(ctx.projectStorageStatus(entry).state,'saved');ctx.draftState='pending';assert.equal(ctx.projectStorageStatus(entry,true).state,'pending');
ctx.draftState='saved';ctx.hasLinkedAccount=()=>true;ctx.cloudBridge={local:{confirmed:()=>true}};
assert.match(ctx.projectStorageStatus(entry).text,/Sync ausstehend/);ctx.accountSession={user:{id:'owner'}};assert.equal(ctx.projectStorageStatus(entry).state,'synced');
ctx.cloudBridge.local.confirmed=()=>false;assert.equal(ctx.projectStorageStatus(entry).state,'saved');ctx.sharedReadOnly=true;assert.equal(ctx.projectStorageStatus(entry,true).state,'readonly');
(async()=>{let copied=null,message='';ctx.navigator={clipboard:{writeText:async value=>copied=value}};ctx.say=value=>message=value;
  await ctx.copyProjectIdentity(identity,{});assert.equal(copied,identity);assert.match(message,/kopiert/);
  await ctx.copyProjectIdentity('<invalid>',{});assert.equal(copied,identity);
  console.log('PASS PROJECT IDENTITY: Legacy-Migration, Umbenennen, Speichern, Kopien, Export/Import, Konflikte, Cloud-Promotion und ehrlicher Speicherstatus.');
})().catch(error=>{console.error(error);process.exitCode=1;});
