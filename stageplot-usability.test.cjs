const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8'),clone=value=>JSON.parse(JSON.stringify(value));
const extract=name=>{const match=html.match(new RegExp('  (?:async )?function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const geometry=require('./stageplot-geometry-v1.js'),catalog=require('./stageplot-venue-catalog-v1.js');
function environment(){
  const values=new Map(),nodes=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
  const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,hidden:false,disabled:false,open:false,dataset:{},textContent:'',section:{},setCustomValidity(value){this.validationMessage=value;},setAttribute(key,value){this[key]=value;},closest(){return this.section;},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};
  const ctx={clone,StageplotGeometry:geometry,drumModel:{isDrums:()=>false},byId:{},normalizeExtraStairs:()=>[],normalizeCables:()=>[],projectText:(v,max)=>String(v??'').slice(0,max),
    window:{localStorage:storage},localStorage:storage,setupStorageKey:'setups',draftStorageKey:'drafts',workspaceStorageKey:'workspace',stage:null,objects:[],activeSetupId:null,activeDraftId:null,
    activeDraftSavedAt:null,draftRevision:null,draftBaseline:null,draftTimer:null,draftState:'idle',drag:null,editBefore:null,history:[],future:[],view:'editor',sharedReadOnly:false,accountPlan:'pro',
    projectFormDirty:false,projectFormTimer:null,projectFormInvalid:false,projectFormUnit:'m',finishEdit(){},resetEditorView(){},restoreViewport(){},persistViewport(){},show(view){ctx.view=view;},say(){},projectAccountStore:()=>null,renderSetupLibrary(){},updateProjectHeading(){},
    isSampleProject:()=>false,cloudBridge:null,hasLinkedAccount:()=>false,accountSession:null,clearTimeout(){ctx.pending=null;},setTimeout(fn){ctx.pending=fn;return 1;},
    closeFileMenu(){},cancelPlacement(){},refreshProjectIdentity(){},constrainIem(){},normalizeRouting:value=>clone(value||{inputs:[],outputs:[]}),setProjectTab(){},$,metresToDisplay:(v,u)=>u==='ft'?v/.3048:v,displayToMetres:(v,u)=>u==='ft'?v*.3048:v};
  ctx.snapshot=()=>JSON.stringify({stage:ctx.stage,objects:ctx.objects});ctx.draftStatus=state=>ctx.draftState=state;ctx.draftFailure=()=>ctx.draftState='error';
  $('sp-project-form').checkValidity=()=>!$('sp-project-name').validationMessage;$('sp-project-form').querySelector=()=>null;$('sp-project-form').reportValidity=()=>ctx.reported=true;
  vm.createContext(ctx);
  vm.runInContext(['projectIdentity','iemRect','validStage','normalizeProductionInfo','normalizeProjectInfo','normalizeSetupDocument','readSetupLibrary','writeSetupLibrary','readDraftLibrary','writeDraftLibrary','readWorkspace','writeWorkspace','resetDraftTracking','persistDraft','flushDraft','activateSetupDocument','dashboardProjects','keepHistory','readProjectForm','projectFormDimension','applyProjectForm','queueProjectFormSave','flushProjectForm','saveCurrentSetup','duplicateCurrentProject','projectMeasurements'].map(extract).join('\n'),ctx);
  return ctx;
}
const ctx=environment();ctx.activateSetupDocument(catalog.createDocument('at-wien-b72'),null,{copy:true,persist:true});
const identity=ctx.stage.projectId,base=clone(ctx.stage),$=ctx.$;
$('sp-project-name').value=ctx.stage.title;$('sp-project-unit').value='m';$('sp-project-width').value=99;$('sp-project-depth').value=88;
$('sp-project-tour').value='Probe';ctx.queueProjectFormSave();
assert(ctx.projectFormDirty);assert(ctx.flushProjectForm(true));assert.equal(ctx.projectFormDirty,false);assert.equal(ctx.pending,null,'Navigation löscht den noch offenen Debounce.');
assert.equal(ctx.stage.project.tour,'Probe');assert.equal(ctx.stage.w,base.w);assert.equal(ctx.stage.d,base.d,'Angezeigte Grundrissmaße verändern nicht die interne Basis.');
assert.equal($('sp-project-tour').value,'Probe','Speichern füllt das Formular nicht neu.');
assert.equal(ctx.readDraftLibrary(ctx.localStorage).entries[0].document.stage.projectId,identity);
$('sp-project-tour').value='Generalprobe';ctx.queueProjectFormSave();ctx.pending();assert.equal(ctx.readDraftLibrary(ctx.localStorage).entries[0].document.stage.project.tour,'Generalprobe');
const saved=ctx.localStorage.getItem('drafts');$('sp-project-name').value=' ';ctx.queueProjectFormSave();assert.equal(ctx.flushProjectForm(true),false);assert(ctx.reported);assert(ctx.projectFormDirty);assert.equal(ctx.localStorage.getItem('drafts'),saved);
const regularShow=ctx.show;vm.runInContext(extract('show'),ctx);ctx.view='project';assert.equal(ctx.show('dashboard'),false);assert.equal(ctx.view,'project');
ctx.show('project');assert.equal($('sp-project-name').value,' ','Aktuellen Tab anklicken darf unvollständige Eingaben nicht verwerfen.');ctx.show=regularShow;
$('sp-project-name').value='Meine Produktion';assert(ctx.flushProjectForm());assert.equal(ctx.stage.projectId,identity);
assert(ctx.saveCurrentSetup());assert.equal($('sp-setups-dialog').open,false,'Normales Sichern öffnet keinen zweiten Speichern-Dialog.');
ctx.accountPlan='free';assert.equal(ctx.duplicateCurrentProject(),false);assert($('sp-upgrade-dialog').open);assert.equal(ctx.stage.projectId,identity);
ctx.accountPlan='pro';assert(ctx.duplicateCurrentProject());const copyId=ctx.stage.projectId;assert.notEqual(copyId,identity);assert.equal(ctx.dashboardProjects().length,2);
assert.equal(ctx.dashboardProjects().find(entry=>entry.document.stage.projectId===identity).document.stage.project.tour,'Generalprobe');
assert(ctx.duplicateCurrentProject());assert.equal(ctx.dashboardProjects().length,3);assert.notEqual(ctx.stage.projectId,copyId);
ctx.compiledVenue=()=>({floorBounds:{minX:-1,maxX:8,minY:0,maxY:7},bounds:{minX:-1,maxX:9.01,minY:0,maxY:7}});
assert.deepEqual(clone(ctx.projectMeasurements(ctx.stage)),{width:9,depth:7,totalWidth:10.01,totalDepth:7});
assert.deepEqual(clone(ctx.projectMeasurements({w:8,d:5})),{width:8,depth:5,totalWidth:8,totalDepth:5});
vm.runInContext(html.match(/  function syncProjectUnitLabels[^\n]+/)[0],ctx);ctx.projectFormUnit='ft';ctx.syncProjectUnitLabels();assert.equal($('sp-project-width').max,98.43);assert.equal($('sp-project-depth').max,65.62);
assert.equal(ctx.projectFormDimension(28.22,'ft',8.6,30),8.6,'Ein Wechsel der Anzeigeeinheit erhält die exakten Originalmaße.');
assert.equal(ctx.projectFormDimension(6.56,'ft',8,30),2);assert.equal(ctx.projectFormDimension(98.43,'ft',8,30),30,'Gerundete Grenzwerte bleiben gültig.');
const failed=environment();failed.activateSetupDocument(catalog.createDocument('at-wien-b72'),null,{copy:true,persist:true});
failed.$('sp-project-name').value='Speichertest';failed.$('sp-project-unit').value='m';failed.$('sp-project-width').value=8;failed.$('sp-project-depth').value=5;
const originalId=failed.stage.projectId;failed.localStorage.setItem=()=>{throw new Error('Speicher voll');};failed.queueProjectFormSave();assert.equal(failed.flushProjectForm(),false);assert.equal(failed.draftState,'error');assert.equal(failed.stage.projectId,originalId);assert.equal(failed.duplicateCurrentProject(),false);
const exp=environment();exp.exportIntent='image';exp.imageExportFormat='png-2k';exp.root={dataset:{},querySelector:()=>exp.$('caption'),querySelectorAll:()=>[]};exp.renderPrint=()=>exp.rendered=true;
exp.printReport=mode=>exp.printed=mode;exp.exportPng=()=>exp.png=true;exp.openShareDialog=()=>exp.shared=true;
vm.runInContext(['technicalExportNeedsPro','refreshExportAction','setExportFormat','setExportIntent','setPdfPreset','runExportIntent'].map(extract).join('\n'),exp);
exp.setExportIntent('technical');assert.equal(exp.$('sp-export-format').value,'pdf');
exp.setPdfPreset('full');
for(const id of ['sp-print-production','sp-print-notes','sp-print-inputs','sp-print-routing'])assert(exp.$(id).checked,id);
assert.equal(exp.$('sp-export-paper-options').hidden,false);exp.accountPlan='free';exp.runExportIntent();assert(exp.$('sp-upgrade-dialog').open);assert.equal(exp.printed,undefined);
exp.accountPlan='pro';exp.runExportIntent();assert.equal(exp.printed,'stage','Veranstalter-PDF druckt die angezeigte Vorschau.');
exp.setExportIntent('image');assert.equal(exp.$('sp-print-production').checked,true,'PDF-Inhalte bleiben beim Wechsel zu Bild erhalten.');assert.equal(exp.$('sp-export-paper-options').hidden,false,'Bild und PDF zeigen dieselben Inhaltsoptionen.');exp.runExportIntent();assert(exp.png);
exp.setExportFormat('png-4k');exp.setExportIntent('technical');exp.setExportIntent('image');assert.equal(exp.$('sp-export-format').value,'png-4k','Bildqualität bleibt beim Formatwechsel erhalten.');
exp.setPdfPreset('plan');exp.setExportFormat('pdf');assert.equal(exp.$('sp-export-paper-options').hidden,false);assert.equal(exp.root.dataset.previewKind,'pdf');
exp.setExportIntent('share');assert(exp.$('sp-export-details').hidden);exp.runExportIntent();assert(exp.shared);
exp.flushProjectForm=()=>false;exp.shared=false;exp.runExportIntent();assert.equal(exp.shared,false);
exp.stage={routing:{inputs:[{number:1,instrument:'Gesang',mode:'Mono',signalType:'Mic',connector:'XLR',phantom:true,notes:'Kabel stellt Location'}]}};
exp.routeSourceObject=()=>null;exp.routingStageboxes=()=>[];exp.routeFrequency=()=>'';exp.esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;');
exp.stageboxRouteLocation=()=>'Kein Stagebox-Patch';exp.audioKind=()=>'line';
const audioSource=fs.readFileSync('stageplot-audio-v1.js','utf8');vm.runInContext(audioSource.slice(audioSource.indexOf('function audioPrintTable('),audioSource.indexOf('function audioPatchSections('))+extract('printRoutingPreview'),exp);const routing=exp.printRoutingPreview('inputs');
assert.match(routing,/Kabel stellt Location/);assert.match(routing,/<th>Mikrofon \/ DI<\/th><th>48V<\/th>/);assert.match(routing,/<td>48V<\/td>/,'48V steht lesbar in einer eigenen Spalte.');
console.log('PASS USABILITY: Formular-Autosave, Navigationsschutz, Speicherfehler, unabhängige Kopien, reale Maße, Einheiten und Exportzwecke.');
