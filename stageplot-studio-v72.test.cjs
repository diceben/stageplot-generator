const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('stageplot-studio.html','utf8');

for(const marker of [
  'sp-stagebox-workbench',
  'sp-stagebox-workbench-toolbar',
  'PATCH OVERVIEW',
  'SIGNAL FLOW',
  'LIST VIEW',
  'sp-stagebox-socket',
  'sp-stagebox-source-panel',
  'sp-stagebox-source-group',
  'data-stagebox-source-search',
  'sp-stagebox-channel-details',
  'data-stagebox-info-tab="source"',
  'data-stagebox-info-tab="details"',
  'data-stagebox-info-tab="notes"',
  'data-stagebox-clear-assignment',
  'data-stagebox-sync',
  'function filterStageboxSources(',
  'function stageboxWorkbenchMarkup('
])assert.ok(html.includes(marker),marker+' fehlt im Stagebox Patch Overview.');

assert.match(html,/:is\(\.sp-stagebox-view,\.sp-stagebox-io-dialog\) \{[^}]*--sp-sb-bg:light-dark\(#f4f5f2,#07111b\)/,'Die Stagebox-Ansicht folgt nicht dem hellen und dunklen App-Theme.');
assert.match(html,/button\[data-active-port="true"\][^}]*border-color:#f04c9a/,'Der aktive Stagebox-Port ist nicht klar pink markiert.');
assert.match(html,/button\[data-stagebox-direction="inputs"\] \.sp-stagebox-socket \{[^}]*#020304 0 2\.1px/,'XLR-Inputs zeigen keine drei dunklen Kontaktlöcher.');
assert.match(html,/\.sp-stagebox-card\[data-combo-jacks="true"\][^}]*button\[data-stagebox-direction="inputs"\] \.sp-stagebox-socket::before \{[^}]*width:13px[^}]*border:2px solid #858e96/,'Aktivierte Kombibuchsen zeigen keine zentrale 6,35-mm-Klinkenöffnung.');
assert.match(html,/button\[data-stagebox-direction="outputs"\] \.sp-stagebox-socket \{[^}]*#929aa4 0 1\.2px/,'XLR-Outputs zeigen keine drei metallischen Kontaktstifte.');
assert.match(html,/#sp-routing\[data-stagebox-mode="true"\] \{ padding:0; background:#07111b; \}/,'Die Stagebox-View füllt den Routing-Arbeitsbereich nicht aus.');
assert.match(html,/\$\('sp-routing'\)\.dataset\.stageboxMode=String\(stageboxMode\)/,'Der Routing-Bereich aktiviert den Fullscreen-Stagebox-Modus nicht zustandsabhängig.');
assert.match(html,/function renderStageboxView\(\)\{const boxes=allRoutingStageboxes\(\);[^}]*\$\('sp-stagebox-view'\)\.innerHTML=stageboxWorkbenchMarkup\(boxes\);\}/,'Der Routing-Tab verwendet nicht das gemeinsame Stagebox-Workbench-Markup.');
assert.match(html,/\$\('sp-stagebox-io-body'\)\.innerHTML=stageboxWorkbenchMarkup\(\[box\],\{dialog:true\}\)/,'Das Bühnen-Popup verwendet nicht dieselbe Stagebox-Workbench.');
assert.match(html,/stageboxPatchCandidateId=context\?\.occupant\?\.id\|\|''/,'Die Quellenauswahl startet nicht mit der aktuellen Portbelegung.');
assert.match(html,/candidate&&routeNeedsDi\(candidate,context\.patch\.direction,context\.box\)/,'Die neue Patch-Ansicht umgeht die DI-Prüfung.');
assert.match(html,/option\.hidden=!visible/,'Die Stagebox-Quellensuche filtert die vorhandenen Channels nicht.');
assert.match(html,/infoBox=boxes\.find\(box=>box\.id===activeStageboxId\)\|\|boxes\[0\],detail=shownContext\?stageboxDetailMarkup\(shownContext,dialog\):infoBox\?stageboxGeneralDetailMarkup\(infoBox,dialog\):''/,'Das Stagebox-Info-Sidepanel ist ohne ausgewählten Port nicht geöffnet.');
assert.match(html,/function nextFreeStageboxPortAfter\(context\)/,'Nach einer Belegung wird der nächste freie Stagebox-Port nicht bestimmt.');
assert.match(html,/activeStageboxPatch=\{boxId:context\.box\.id,direction:context\.patch\.direction,port:nextPort\}/,'Die Stagebox-Ansicht springt nach einer Belegung nicht zum nächsten freien Port.');
assert.match(html,/\.sp-stagebox-source-panel \{[^}]*width:min\(900px[^}]*height:min\(600px[^}]*max-height:min\(620px/,'Die Channel-Auswahl ist nicht groß genug ausgeführt.');
assert.match(html,/function stageboxSourceGroup\(row,direction\)/,'Channels werden in der Auswahl nicht nach Instrument gruppiert.');
assert.match(html,/const source=e\.target\.closest\('\[data-stagebox-source\]'\);if\(source\)\{stageboxPatchCandidateId=source\.dataset\.stageboxSource;[\s\S]*?applyStageboxPatch\(\);return;\}/,'Die Channel-Auswahl verbindet nicht unmittelbar beim Anklicken.');
assert.ok(!html.includes('data-stagebox-patch-apply'),'Der veraltete zusätzliche Verbinden-Schritt ist noch vorhanden.');
assert.ok(!html.includes('Recent Sources'),'Die veraltete Liste „Recent Sources“ ist noch vorhanden.');
assert.ok(!html.includes('sp-stagebox-card-online'),'Der veraltete Online-Status ist noch auf Stagebox-Karten vorhanden.');
assert.match(html,/\.sp-stagebox-rename-form input \{[^}]*background:light-dark\(#fff,#0a1520\); color:light-dark\(#171b17,#f0f3f7\)/,'Der Stagebox-Name hat keinen lesbaren Hell-/Dunkel-Kontrast.');

console.log('PASS V72: themenfähiges Stagebox Patch Overview mit realistischen Kombibuchsen, großer gruppierter Sofortzuweisung und gemeinsamer Bühnen-Popup-Ansicht.');
