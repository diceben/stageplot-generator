const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const index=fs.readFileSync('index.html','utf8');
const schema=fs.readFileSync('supabase/migrations/0001_stageplot_documents.sql','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const preview=fs.readFileSync('stageplot-preview.py','utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
const header=html.slice(html.indexOf('<header class="sp-header">'),html.indexOf('</header>'));

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
assert.match(html,/#sp-prototype :is\(\.sp-dashboard,\.sp-routing,\.sp-project-settings\) \{[^}]*--sp-ink:light-dark\(#202222,#edf2ed\);[^}]*color:var\(--sp-ink\); color-scheme:inherit;/,'Workflow-Seiten sichern ihren Textkontrast nicht in beiden Farbschemata ab.');
assert.match(html,/id="sp-drum-hover-open"[^>]*><span>Open<\/span><strong>Drumdesigner<\/strong>/,'Der schwebende Drum-Designer-Schnellzugriff fehlt.');
assert.match(html,/drumButton\.hidden=hidden\|\|!o\|\|!drumModel\.isDrums\(o\.type\)/,'Der Schnellzugriff wird nicht auf ausgewählte Drumsets begrenzt.');
assert.match(html,/for\(const id of \['sp-drums-open','sp-drum-hover-open'\]\)\$\(id\)\.addEventListener\('click',openSelectedDrumDesigner\)/,'Der schwebende Schnellzugriff öffnet nicht denselben Drum-Designer.');
for(const asset of ['stageplot-assets/branding/stageplotter-icon.png','stageplot-assets/branding/stageplotter-logo-transparent-v2.png','stageplot-assets/branding/stageplotter-header-pro-v3.png','stageplot-assets/branding/stageplotter-header-standard-v4.png'])assert.ok(fs.existsSync(asset),asset+' fehlt.');
assert.equal(fs.readFileSync('stageplot-assets/branding/stageplotter-logo-transparent-v2.png')[25],6,'Das Stageplotter-Wortlogo besitzt keinen RGBA-Alphakanal.');
assert.equal(fs.readFileSync('stageplot-assets/branding/stageplotter-header-pro-v3.png')[25],6,'Das Stageplotter-PRO-Headerlogo besitzt keinen RGBA-Alphakanal.');
assert.equal(fs.readFileSync('stageplot-assets/branding/stageplotter-header-standard-v4.png')[25],6,'Das normale Stageplotter-Headerlogo besitzt keinen RGBA-Alphakanal.');
for(const marker of ['class="sp-brand-logo" id="sp-brand-logo" src="./stageplot-assets/branding/stageplotter-header-standard-v4.png"','data-logo-free="./stageplot-assets/branding/stageplotter-header-standard-v4.png"','data-logo-pro="./stageplot-assets/branding/stageplotter-header-pro-v3.png"','class="sp-dashboard-logo" src="./stageplot-assets/branding/stageplotter-logo-transparent-v2.png"','id="sp-brand-fallback" hidden','syncBrandFallback',"const nextLogo=accountPlan==='pro'?brandLogo.dataset.logoPro:brandLogo.dataset.logoFree"])assert.ok(html.includes(marker),marker+' fehlt im Markenauftritt.');
assert.ok(index.includes('<link rel="icon" type="image/png" href="./stageplot-assets/branding/stageplotter-icon.png">'),'Das Browser-Icon verwendet nicht das Stageplotter-Motiv.');
assert.ok(preview.includes('route.path.startswith("/stageplot-assets/branding/")'),'Die lokale Vorschau liefert die Branding-Assets nicht aus.');
assert.match(html,/\/\* V65: schwarzes Stageplotter-Menueband/,'Das neue Menüband-Layout fehlt.');
assert.match(html,/#sp-prototype \.sp-header \{[^}]*min-height:84px/,'Das Menüband ist nicht auf die kompakte Höhe begrenzt.');
assert.match(html,/#sp-prototype \.sp-header \.sp-steps \{[^}]*height:52px[^}]*align-self:center/,'Das eingefasste Navigationsband ist nicht fest auf die flache Höhe begrenzt.');
assert.match(html,/#sp-prototype \.sp-header \.sp-steps button \{[^}]*height:46px/,'Die Navigationssegmente sind nicht fest auf die kompakte Höhe begrenzt.');
assert.match(html,/#sp-prototype \.sp-header \.sp-steps button \{[^}]*justify-content:center[^}]*line-height:1/,'Icon und Schrift sind nicht mittig in der Navigation ausgerichtet.');
assert.match(html,/#sp-prototype \.sp-header \.sp-steps button:hover \{ background:transparent;/,'Der Hoverzustand verdeckt die aktive Pill weiterhin.');
for(const marker of ['@keyframes sp-nav-hover-fog','@keyframes sp-nav-hover-sparkle','li:not([aria-current]) > button:hover::before','button:hover::after','transition:opacity 650ms ease 220ms','animation:sp-nav-hover-fog 1450ms 920ms'])assert.ok(html.includes(marker),marker+' fehlt am rosa Navigations-Hoverzustand.');
assert.doesNotMatch(html,/html \{ scrollbar-gutter:stable; \}/,'Der Browser-Viewport reserviert weiterhin einen unnötigen Scrollbalken.');
assert.match(html,/#sp-prototype \.sp-header \.sp-steps li \+ li \{ border-left:0; \}/,'Die unerwünschten vertikalen Trennstreifen sind noch vorhanden.');
assert.match(html,/#sp-prototype \.sp-header nav \{[^}]*position:absolute[^}]*left:50%[^}]*justify-content:center[^}]*transform:translate\(-50%,-50%\)/,'Die Navigation ist nicht unabhängig vom restlichen Header exakt zentriert.');
assert.match(html,/#sp-prototype \.sp-header > \.sp-project-summary \{[^}]*order:2/,'Der Projektname steht nicht rechts neben dem Menüband.');
assert.match(html,/#sp-prototype \.sp-header > \.sp-project-summary \{[^}]*width:210px[^}]*flex:0 0 210px[^}]*margin:0 0 0 auto/,'Projektname und Maße stehen nicht als erster Teil des rechten Headerblocks.');
assert.match(html,/#sp-prototype \.sp-header > \.sp-header-status \{[^}]*width:194px[^}]*flex:0 0 194px/,'Die feste Statusbreite gegen springende Navigation fehlt.');
assert.ok(header.indexOf('<nav aria-label="Projektbereiche">')<header.indexOf('<div class="sp-project-summary">'),'Menüband und Projektname sind im Header-DOM nicht vertauscht.');
assert.match(html,/#sp-prototype \.sp-header \.sp-steps > \.sp-nav-active-pill \{[^}]*position:absolute[^}]*background:#bdf700/,'Die bewegliche aktive Navigation ist nicht absolut positioniert und lime hervorgehoben.');
for(const marker of ['class="sp-nav-active-pill" aria-hidden="true"','function syncNavigationPill(animate=true)','syncNavigationPill(true)','syncNavigationPill(false)',"pill.dataset.moving=x>previous?'right':'left'",'@keyframes sp-nav-glitter-right','@keyframes sp-nav-glitter-left','animation:sp-nav-glitter-right 720ms','animation:sp-nav-glitter-left 720ms'])assert.ok(html.includes(marker),marker+' fehlt an der gleitenden Navigations-Pill.');
for(const marker of ['class="sp-nav-hover-bar" aria-hidden="true"','function syncNavigationHoverBar(target=null,animate=true)','syncNavigationHoverBar(item,true)','syncNavigationHoverBar(null,true)','cubic-bezier(.16,1.34,.36,1)'])assert.ok(html.includes(marker),marker+' fehlt am nachfedernden rosa Navigationsbalken.');
for(const marker of ['id="sp-otter-mode"','stageplotter-icon.png','function runOtterMode()','brandClickTimes.length>=5','now-time<1800','@keyframes sp-otter-surf','@keyframes sp-otter-trail','OTTER MODE!'])assert.ok(html.includes(marker),marker+' fehlt am fünffach auslösbaren Otter-Easteregg.');
for(const icon of ['folder','share','settings'])assert.ok(header.includes(`data-nav-icon="${icon}"`),`Das exakte ${icon}-Navigationsicon fehlt.`);
assert.ok(header.includes('data-header-icon="settings"'),'Das exakte Einstellungsicon im Header fehlt.');
assert.match(html,/\/\* V66: fester App-Viewport/,'Das feste App-Viewport-Layout fehlt.');
assert.match(html,/html,body \{ height:100%; overflow:hidden; \}/,'Das Dokument scrollt weiterhin statt der Inhaltslisten.');
assert.match(html,/#sp-prototype \.sp-project-grid \{[\s\S]{0,260}overflow:auto;/,'Die Projektliste besitzt keinen eigenen Scrollbereich.');
assert.match(html,/#sp-prototype \.sp-routing-table-wrap \{[\s\S]{0,220}overflow:auto;/,'Die Routingliste besitzt keinen eigenen Scrollbereich.');
for(const marker of ['id="sp-upgrade-open" role="switch" aria-checked="false"','id="sp-plan-action-copy"','KOSTENLOSE PRO-BETA','Pro-Beta kostenlos aktivieren',"const nextPlan=accountPlan==='pro'?'free':'pro'","saveAccountPlan(nextPlan)"])assert.ok(html.includes(marker),marker+' fehlt in der Pro-Beta-Umschaltung.');
assert.ok(html.includes(`data-release-version="${packageJson.version}"`),'Angezeigte App-Version und package.json stimmen nicht überein.');
for(const marker of ['id="sp-release-title"','v0.1.0-beta.2','v0.1.0-beta.1','Öffentliche Standalone-Beta','Lokale Projekte und automatische Entwürfe'])assert.ok(html.includes(marker),marker+' fehlt in den Release Notes.');
for(const marker of ['enable row level security','owner_id = (select auth.uid())','stageplot_sync_push','stageplot_sync_pull','pg_advisory_xact_lock','revoke all on public.stageplot_documents from anon'])assert.ok(schema.includes(marker),marker+' fehlt im Supabase-Schema.');

console.log('PASS V61: eigenständige Account-Grenze für Projekte, Bühnen- und Drumvorlagen bei unverändert lokalem Primärspeicher.');
