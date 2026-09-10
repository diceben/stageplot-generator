const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('stageplot-studio.html','utf8');

assert.match(html,/const entries=setups\.map\(entry=>\(\{\.\.\.entry,kind:'setup',draft:false,draftId:null\}\)\)/,'Gespeicherte Projekte und Entwürfe werden nicht getrennt modelliert.');
assert.match(html,/else entries\.push\(\{\.\.\.draftEntry,kind:'draft',draft:true,draftId:draftEntry\.id\}\)/,'Eigenständige Entwürfe erscheinen nicht als eigene Projektkarten.');
// Exercise the current project dialog; the old unused createNewProject helper was removed.
const vm=require('node:vm'),events=[],nodes=new Map(),oldStage={title:'Bestehendes Projekt'};
const ctx={readNewProjectDimensions:()=>true,sharedReadOnly:false,npStageSource:'custom',accountPlan:'pro',dashboardProjects:()=>[],stage:oldStage,npSize:{width:8,depth:5},stageSurfaceDefault:'light',npProjectName:()=> 'Neues Projekt',defaultProjectInfo:()=>({}),defaultRouting:()=>({inputs:[],outputs:[]}),normalizeSetupDocument:value=>value,isSampleProject:()=>false,canSave:false,finishEdit:()=>events.push('finish')};
ctx.$=id=>{if(!nodes.has(id))nodes.set(id,{value:'',close(){events.push('close');}});return nodes.get(id);};
ctx.persistDraft=()=>{events.push('save');return ctx.canSave;};ctx.activateSetupDocument=value=>{events.push('activate');ctx.stage=value.stage;};
vm.createContext(ctx);vm.runInContext(html.match(/  function createProjectFromDialog\([^]*?\n  }/)[0],ctx);
ctx.createProjectFromDialog();assert.equal(ctx.stage,oldStage);assert.deepEqual(events,['finish','save'],'Ein Speicherfehler darf das vorhandene Projekt nicht ersetzen.');
events.length=0;ctx.canSave=true;ctx.createProjectFromDialog();assert.deepEqual(events,['finish','save','activate','close'],'Der bisherige Entwurf wird vor dem Projektwechsel gespeichert.');
assert.ok(!html.includes("id:'current-draft'"),'Der kollidierende feste current-draft-Schlüssel ist noch vorhanden.');
assert.match(html,/data-draft="'\+String\(entry\.draft\)\+'"/,'Entwurfskarten erhalten keinen eigenen visuellen Zustand.');
assert.match(html,/\.sp-project-grid \{ display:grid; grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'Projektkarten stehen auf großen Ansichten nicht in drei Spalten.');
assert.ok(html.includes('data-project-add'),'Die Karte „Projekt hinzufügen“ fehlt.');
assert.match(html,/let appTheme='light'/,'Hell ist nicht als stabiler App-Standard gesetzt.');
assert.match(html,/data-theme-choice="light"/,'Die allgemeine Hell-/Dunkel-Auswahl fehlt.');

console.log('PASS V73: verlustfreie getrennte Projektentwürfe, Drei-Spalten-Dashboard, Hinzufügen-Karte und allgemeiner Theme-Modus.');
