const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('stageplot-studio.html','utf8');

for(const marker of ['sp-audio-iem-fields','sp-audio-format','data-channel-value="stereo"','data-channel-value="wireless"','function saveAudioChannel(','data-route-phantom','data-outs-connector="MADI"','data-outs-connector="Dante"'])assert.ok(html.includes(marker),marker+' fehlt im neuen Routing-Workflow.');
assert.match(html,/\.sp-routing-phantom\[aria-pressed="true"\] \{[^}]*background:#d62f47[^}]*color:#fff/,'48V wird im Routing nicht als roter aktiver Schalter dargestellt.');
assert.match(html,/stage\.routing\[routingTab\]=moveAudioGroup\(/,'Stereo-Paare werden gemeinsam verschoben, ohne Kanalnummern zu ändern.');
assert.match(html,/\$\('sp-channel-number'\)\.value=id\?\(row.number\|\|''\):'#'/,'Vorhandene Kanalnummern bleiben beim Öffnen erhalten.');
assert.match(html,/if\(o\.type==='rack'\)\{const config=normalizeIemConfig/,'Ein IEM-Rack erzeugt keine konfigurierbaren IEM-Outputs.');

console.log('PASS V74: IEM-Output-Popup, IEM-Rack-Automatik, rotes 48V, Auto-Nummerierung sowie MADI/Dante-Signalwege.');
