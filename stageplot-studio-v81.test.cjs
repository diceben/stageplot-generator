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
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const readme=fs.readFileSync('README.md','utf8');
assert.ok(html.includes('data-release-version="'+pkg.version+'">v'+pkg.version),'Release-Badge und Paketversion stimmen nicht überein.');
const current=[...html.matchAll(/<article class="sp-release-card" data-current="true">([^]*?)<\/article>/g)];
assert.equal(current.length,1,'Genau ein Release muss als aktuell gekennzeichnet sein.');
assert.ok(current[0][1].includes('<strong>v'+pkg.version+'</strong>'),'Aktueller Eintrag und Paketversion stimmen nicht überein.');
assert.ok(html.includes('Stageplot Studio v'+pkg.version+' · 2D'),'Hilfefußzeile enthält eine veraltete Version.');
assert.ok(readme.includes('**Aktuelle Version:** v'+pkg.version+' ·'),'README enthält eine veraltete Version.');
assert.equal(lock.version,pkg.version,'Lockdatei enthält eine veraltete Version.');
assert.equal(lock.packages[''].version,pkg.version,'Lockdatei-Paket enthält eine veraltete Version.');
console.log('PASS V81: globaler Hell-/Dunkelmodus, weißes Exportpapier und konsistente aktuelle Release-Version.');
