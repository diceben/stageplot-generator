const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const symbolSource=fs.readFileSync('stageplot-symbols-v3.js','utf8');
const context={};vm.createContext(context);vm.runInContext(symbolSource+'\nthis.render=createStageplotSymbolV3;',context);

for(const type of ['trumpet','trombone','tuba','flugelhorn']){
  const svg=context.render(type,{idPrefix:'v79-'+type});
  assert.ok(svg.includes('brass-metal'),type+' verwendet keine metallische Oberfläche.');
  assert.ok(svg.includes('brass-shadow'),type+' besitzt keine technische Tiefenzeichnung.');
  assert.equal((svg.match(/<g(?:\s|>)/g)||[]).length,(svg.match(/<\/g>/g)||[]).length,type+' enthält unausgeglichene SVG-Gruppen.');
}

const wedge=context.render('wedge',{idPrefix:'v79-wedge'});
for(const part of [
  'cm14-cabinet','cm14-driver-under-grille','cm14-perforated-grille','cm14-floor-ports',
  'cm14-side-handles','cm14-rear-connector-panel','cm14-corner-protectors','cm14-logo'
])assert.ok(wedge.includes('data-part="'+part+'"'),part+' fehlt in der CM14-Draufsicht.');

const quad=context.render('quad-cortex',{idPrefix:'v79-quad'});
for(const part of ['quad-cortex-anodized-chassis','quad-cortex-rear-io','quad-cortex-7in-touchscreen','quad-cortex-branding'])assert.ok(quad.includes('data-part="'+part+'"'),part+' fehlt in der Quad-Cortex-Draufsicht.');
assert.equal((quad.match(/data-part="quad-cortex-stomp-rotary-actuator"/g)||[]).length,10,'Quad Cortex zeigt nicht seine zehn Fußschalter/Drehgeber.');
assert.equal((quad.match(/data-part="quad-cortex-master-rotary-actuator"/g)||[]).length,1,'Quad Cortex zeigt den Master-Drehgeber nicht.');

for(const marker of [
  'data-stair-anti-slip','data-stair-nosing','data-stair-stringer','data-stairs-visual-handle',
  "reverse=edge==='back'||edge==='right'",
  "if(edge==='front')top=cy+stair.d*scale/2+gap",
  "else if(edge==='back')top=cy-stair.d*scale/2-box.height-gap",
  "else if(edge==='left')left=cx-stair.w*scale/2-box.width-gap"
])assert.ok(html.includes(marker),marker+' fehlt in der realistischen bzw. kantenrichtigen Treppensteuerung.');

for(const detail of ['Technische Draufsicht · drei Kolbenventile','Technische Draufsicht · zwei parallele Zugrohre','Technische Draufsicht · konisches Rohr'])assert.ok(html.includes(detail),detail+' fehlt im Objektkatalog.');

console.log('PASS V79: realistischere CM14-/Quad-Cortex-/Blechbläser-Topviews sowie kantenrichtige, freiliegende Treppensteuerung.');
