const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const index=fs.readFileSync('index.html','utf8');
const schema=fs.readFileSync('supabase/migrations/0001_stageplot_documents.sql','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const preview=fs.readFileSync('stageplot-preview.py','utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);

assert.match(html,/<script src="\.\/stageplot-account-v1\.js"><\/script>/,'Account-Runtime wird nicht vor dem App-Code geladen.');
scripts.forEach((source,index)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:`inline-${index}.js`})));
for(const marker of [
  "const projectAccountStore=()=>window.StageplotAccount?.projects||null",
  "const stageTemplateAccountStore=()=>window.StageplotAccount?.stageTemplates||null",
  "const drumAccountStore=()=>window.StageplotAccount?.drumTemplates||null",
  "if(account?.save)account.save(entry)",
  "if(account?.remove)account.remove(id)"
])assert.ok(html.includes(marker),marker+' fehlt.');
assert.match(html,/writeSetupLibrary\(window\.localStorage,updated\);\s*const account=projectAccountStore\(\)/,'Projekt wird nicht zuerst lokal geschrieben.');
assert.match(html,/writeDrumDesignLibrary\(window\.localStorage,updated\)[\s\S]{0,420}const account=drumAccountStore\(\)/,'Drumvorlage wird nicht lokal vor dem Account-Abgleich gesichert.');
assert.match(html,/#sp-prototype :is\(\.sp-dashboard,\.sp-routing,\.sp-project-settings\) \{[^}]*--sp-ink:#202222;[^}]*color:var\(--sp-ink\); color-scheme:light;/,'Helle Workflow-Seiten sichern ihren Textkontrast im dunklen Systemmodus nicht ab.');
assert.match(html,/id="sp-drum-hover-open"[^>]*><span>Open<\/span><strong>Drumdesigner<\/strong>/,'Der schwebende Drum-Designer-Schnellzugriff fehlt.');
assert.match(html,/drumButton\.hidden=hidden\|\|!o\|\|!drumModel\.isDrums\(o\.type\)/,'Der Schnellzugriff wird nicht auf ausgewählte Drumsets begrenzt.');
assert.match(html,/for\(const id of \['sp-drums-open','sp-drum-hover-open'\]\)\$\(id\)\.addEventListener\('click',openSelectedDrumDesigner\)/,'Der schwebende Schnellzugriff öffnet nicht denselben Drum-Designer.');
for(const asset of ['stageplot-assets/branding/stageplotter-icon.png','stageplot-assets/branding/stageplotter-logo-transparent-v2.png'])assert.ok(fs.existsSync(asset),asset+' fehlt.');
assert.equal(fs.readFileSync('stageplot-assets/branding/stageplotter-logo-transparent-v2.png')[25],6,'Das Stageplotter-Wortlogo besitzt keinen RGBA-Alphakanal.');
for(const marker of ['class="sp-brand-logo" id="sp-brand-logo" src="./stageplot-assets/branding/stageplotter-logo-transparent-v2.png"','class="sp-dashboard-logo" src="./stageplot-assets/branding/stageplotter-logo-transparent-v2.png"','id="sp-brand-fallback" hidden','syncBrandFallback'])assert.ok(html.includes(marker),marker+' fehlt im Markenauftritt.');
assert.ok(index.includes('<link rel="icon" type="image/png" href="./stageplot-assets/branding/stageplotter-icon.png">'),'Das Browser-Icon verwendet nicht das Stageplotter-Motiv.');
assert.ok(preview.includes('route.path.startswith("/stageplot-assets/branding/")'),'Die lokale Vorschau liefert die Branding-Assets nicht aus.');
assert.ok(html.includes(`data-release-version="${packageJson.version}"`),'Angezeigte App-Version und package.json stimmen nicht überein.');
for(const marker of ['id="sp-release-title"','v0.1.0-beta.2','v0.1.0-beta.1','Öffentliche Standalone-Beta','Lokale Projekte und automatische Entwürfe'])assert.ok(html.includes(marker),marker+' fehlt in den Release Notes.');
for(const marker of ['enable row level security','owner_id = (select auth.uid())','stageplot_sync_push','stageplot_sync_pull','pg_advisory_xact_lock','revoke all on public.stageplot_documents from anon'])assert.ok(schema.includes(marker),marker+' fehlt im Supabase-Schema.');

console.log('PASS V61: eigenständige Account-Grenze für Projekte, Bühnen- und Drumvorlagen bei unverändert lokalem Primärspeicher.');
