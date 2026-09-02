const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('stageplot-studio.html','utf8');

for(const marker of ['sp-iem-output-dialog','sp-iem-output-name','data-iem-output-value="stereo"','data-iem-output-value="wireless"','function saveIemOutput(','data-route-phantom','function renumberRoutingRows(','data-outs-connector="MADI"','data-outs-connector="Dante"'])assert.ok(html.includes(marker),marker+' fehlt im neuen Routing-Workflow.');
assert.match(html,/\.sp-routing-phantom\[aria-pressed="true"\] \{[^}]*background:#d62f47[^}]*color:#fff/,'48V wird im Routing nicht als roter aktiver Schalter dargestellt.');
assert.match(html,/stage\.routing\[routingTab\]=renumberRoutingRows\(moveRoutingRow/,'Verschobene Routing-Zeilen werden nicht automatisch neu nummeriert.');
assert.match(html,/\$\('sp-channel-number'\)\.value='#'/,'Ein Klick auf eine Kanalnummer zeigt nicht den Auto-Platzhalter #.');
assert.match(html,/if\(o\.type==='rack'\)\{const config=normalizeIemConfig/,'Ein IEM-Rack erzeugt keine konfigurierbaren IEM-Outputs.');
assert.match(html,/'data-cable-signal':digitalPath\|\|'analog'/,'MADI- und Dante-Kabel sind im Canvas nicht als eigener Signalweg markiert.');

console.log('PASS V74: IEM-Output-Popup, IEM-Rack-Automatik, rotes 48V, Auto-Nummerierung sowie MADI/Dante-Signalwege.');
