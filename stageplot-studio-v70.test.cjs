const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('stageplot-studio.html','utf8');

for(const marker of [
  '--sp-inspector-width: 320px',
  '--sp-drum-inspector-width:330px',
  'class="sp-drum-diameter-stepper"',
  'data-drum-size-step="-1"',
  'data-drum-size-step="1"',
  'data-drum-size-value=',
  'function stepDrumSize(button)',
  '.sp-inspector { scrollbar-gutter:auto; }',
  'scrollbar-gutter:auto',
  '.sp-drum-object-actions .sp-button { width:100%; }',
  '.sp-drum-output-summary { overflow:hidden; padding:10px 0 0; }',
  '.sp-drum-output-row small { overflow:visible; text-overflow:clip; white-space:normal; overflow-wrap:anywhere; }',
  '.sp-outs-row { width:100%; grid-template-columns:34px minmax(0,1fr) 34px; }',
  'aria-label="\'+esc(label)+\' kleiner"',
  'aria-label="\'+esc(label)+\' größer"'
])assert.ok(html.includes(marker),marker+' fehlt in der gebauten App.');

const numericSizeRenderer=html.slice(html.indexOf('function drumPills('),html.indexOf('function drumChoicePills('));
assert.ok(numericSizeRenderer.includes('sp-drum-diameter-stepper'),'Numerische Drum-Größen verwenden keine kompakte Schrittsteuerung.');
assert.ok(!numericSizeRenderer.includes('type="radio"'),'Numerische Drum-Größen werden weiterhin als einzelne Auswahl-Pills gerendert.');
assert.match(html,/parent\[key\]=next;refreshDrumDialog\(\);recordDrumHistory\(before\)/,'Eine Größenänderung aktualisiert Vorschau oder Undo-Verlauf nicht zuverlässig.');
assert.ok((html.match(/--sp-drum-inspector-width:330px/g)||[]).length>=2,'Die breitere Drum-Seitenleiste wird auf großen Ansichten wieder schmaler überschrieben.');

console.log('PASS V70: breitere Eigenschaften-/Ebenenleisten und klare Drum-Größensteuerung per Minus/Plus.');
