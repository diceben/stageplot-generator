const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
const script=scripts.at(-1)||'';
scripts.forEach((source,index)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:`inline-${index}.js`})));

assert.match(html,/<section id="sp-project" class="sp-project-settings"[^>]*hidden>/,'Project Settings ist keine eigenständige Seite.');
assert.doesNotMatch(html,/<dialog id="sp-project"/,'Project Settings ist noch als Dialog umgesetzt.');
assert.match(script,/\['dashboard','setup','editor','routing','print','project'\]\.forEach/,'Die Project-Settings-Seite ist nicht in die View-Steuerung eingebunden.');
assert.match(script,/button\.setAttribute\('aria-disabled',String\(unavailable\)\)/,'Navigation ohne geladenes Projekt wird nicht zugänglich ausgegraut.');
assert.match(script,/else openNewProjectDialog\(\)/,'Ein deaktivierter Arbeitsbereich startet nicht den Neues-Projekt-Workflow.');

for(const id of [
  'sp-export-format','sp-export-scale','sp-export-background','sp-print-labels','sp-print-outs','sp-print-cables','sp-print-measures',
  'sp-print-legend-toggle','sp-print-notes','sp-print-inputs','sp-print-routing','sp-export-paper',
  'sp-print-legend-section','sp-print-notes-section','sp-print-inputs-section','sp-print-routing-section'
])assert.ok(html.includes(`id="${id}"`),id+' fehlt im Export-Wizard.');

for(const format of ['png-normal','png-4k','pdf'])assert.ok(html.includes(`data-export-format="${format}"`),format+' fehlt als direkte Ausgabe-Pill.');
for(const background of ['white','transparent'])assert.ok(html.includes(`data-export-background="${background}"`),background+' fehlt als Hintergrund-Pill.');
assert.ok(!html.includes('id="sp-print-details-panel"'),'Legende und Notizen liegen noch in einem Sidepanel.');
assert.ok(!html.includes('Read-only-Link</button>'),'Der alte Read-only-Link-Button ist noch beschriftet.');
assert.match(script,/function exportArtworkBounds\(svg,padding=4\)/,'PNG-Dateien werden nicht auf den eigentlichen Plan zugeschnitten.');
assert.match(script,/exportSvgMarkup\(svg,exportArtworkBounds\(svg\)\)/,'Der PNG-Export verwendet die berechneten Zuschnittmaße nicht.');
assert.match(script,/function printRoutingPreview\(direction\)/,'Input- und Output-Listen fehlen in der Papier-Vorschau.');
assert.match(script,/syncRoutingFromStage\(false,false\)/,'Die Export-Vorschau aktualisiert ihre Routing-Daten nicht automatisch.');
assert.match(script,/const blackStage=.*showPrintMeasures=.*showPrintOuts=/,'Maße und Outs sind im Plan nicht unabhängig schaltbar.');
assert.match(script,/const cablesVisible=mode==='print'\?\$\('sp-print-cables'\)\.checked/,'Kabel lassen sich in Vorschau und Export nicht ausblenden.');
assert.match(html,/\.sp-print-paper-sections \{[^}]*grid-template-columns:repeat\(2,/,'Papierinhalte besitzen kein druckbares Zweispaltenlayout.');
assert.match(html,/@media print \{[\s\S]*?\.sp-export-preview \.sp-paper \{[^}]*box-shadow:none/s,'Die papiergetreue Vorschau wird nicht als dieselbe, ungerahmte Druckfläche ausgegeben.');

console.log('PASS V78: Project Settings als Seite, projektabhängige Navigation und papiergetreuer Export-Wizard mit PNG, 4K, PDF und Inhalts-Pills.');
