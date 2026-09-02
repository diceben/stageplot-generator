const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const workflowRule=html.match(/#sp-prototype :is\(\.sp-dashboard,\.sp-routing,\.sp-project-settings\) \{([^}]+)\}/)?.[1]||'';
assert.ok(workflowRule,'Workflow-Farbregel fehlt.');
assert.ok(workflowRule.includes('--sp-bg:light-dark('),'Projekt- und Routingseiten besitzen kein dunkles Farbschema.');
assert.ok(workflowRule.includes('background:var(--sp-bg)'),'Workflow-Seiten verwenden ihre Theme-Fläche nicht.');
assert.ok(workflowRule.includes('color-scheme:inherit'),'Workflow-Seiten erzwingen weiterhin den hellen Modus.');
assert.ok(!workflowRule.includes('color-scheme:light;'),'Workflow-Seiten sind noch fest auf Hell gestellt.');

for(const marker of [
  '/* V81: the global appearance switch also themes project, routing and export chrome.',
  '.sp-project-card[data-draft="true"] { background:var(--sp-soft); }',
  '.sp-routing-toolbar { background:var(--sp-bg); }',
  '.sp-export-controls { border-color:var(--sp-line); background:var(--sp-panel); color:var(--sp-ink); }',
  '.sp-export-preview { background:light-dark(#e8ebe5,#0d100e); }'
])assert.ok(html.includes(marker),marker+' fehlt im globalen Theme.');

assert.match(html,/\.sp-export-preview \.sp-paper \{[^}]*background:#fff;/s,'Die druckbare Papierfläche bleibt im Dunkelmodus nicht weiß.');
assert.equal(pkg.version,'0.1.0-beta.6','Paketversion wurde für den Live-Stand nicht angehoben.');
assert.ok(html.includes('data-release-version="0.1.0-beta.6">v0.1.0-beta.6'),'Aktuelle Release-Version fehlt in der App.');
assert.match(html,/<article class="sp-release-card" data-current="true">\s*<header><div><strong>v0\.1\.0-beta\.6<\/strong>/,'Die aktuellen Release Notes zeigen nicht beta.6.');
console.log('PASS V81: globaler Hell-/Dunkelmodus, weißes Exportpapier und aktuelle beta.6 Release Notes.');
