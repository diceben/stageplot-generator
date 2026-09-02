const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('stageplot-studio.html','utf8');

assert.match(html,/const entries=setups\.map\(entry=>\(\{\.\.\.entry,kind:'setup',draft:false,draftId:null\}\)\)/,'Gespeicherte Projekte und Entwürfe werden nicht getrennt modelliert.');
assert.match(html,/else entries\.push\(\{\.\.\.draftEntry,kind:'draft',draft:true,draftId:draftEntry\.id\}\)/,'Eigenständige Entwürfe erscheinen nicht als eigene Projektkarten.');
assert.match(html,/if\(stage&&!isSampleProject\(\)\)persistDraft\(true\);activeSetupId=null;activeDraftId=null;objects=\[\]/,'Ein neues Projekt sichert den vorherigen Entwurf nicht vor dem Zurücksetzen.');
assert.ok(!html.includes("id:'current-draft'"),'Der kollidierende feste current-draft-Schlüssel ist noch vorhanden.');
assert.match(html,/data-draft="'\+String\(entry\.draft\)\+'"/,'Entwurfskarten erhalten keinen eigenen visuellen Zustand.');
assert.match(html,/\.sp-project-grid \{ display:grid; grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'Projektkarten stehen auf großen Ansichten nicht in drei Spalten.');
assert.ok(html.includes('data-project-add'),'Die abschließende Karte „Projekt hinzufügen“ fehlt.');
assert.match(html,/let appTheme='light'/,'Hell ist nicht als stabiler App-Standard gesetzt.');
assert.match(html,/data-theme-choice="light"/,'Die allgemeine Hell-/Dunkel-Auswahl fehlt.');

console.log('PASS V73: verlustfreie getrennte Projektentwürfe, Drei-Spalten-Dashboard, Hinzufügen-Karte und allgemeiner Theme-Modus.');
