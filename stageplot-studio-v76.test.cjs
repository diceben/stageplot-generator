const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const symbolSource=fs.readFileSync('stageplot-symbols-v3.js','utf8');
const context={};vm.createContext(context);vm.runInContext(symbolSource+'\nthis.render=createStageplotSymbolV3;',context);

for(const [id,width,depth] of [
  ['keys-kronos3-61','1.064','.363'],
  ['keys-kronos3-73','1.245','.37'],
  ['keys-kronos3-88','1.457','.37'],
  ['keys-sv1-73','1.143','.347'],
  ['keys-sv1-88','1.356','.347'],
  ['keys-hammond-b3','1.23','.73']
]){
  assert.match(html,new RegExp("id:'"+id+"'.*w:"+width.replace('.','\\.')+",d:"+depth.replace('.','\\.')),
    id+' fehlt mit den recherchierten Planma\u00dfen im Katalog.');
}

const kronos=context.render('keys-kronos3-88');
assert.ok(kronos.includes('data-part="korg-kronos3-panel"'),'KRONOS 3 hat keine eigene Bedienoberfl\u00e4che.');
assert.ok(kronos.includes('data-part="korg-kronos3-keybed"'),'KRONOS 3 hat keine eigene 88er-Tastatur.');
assert.ok((kronos.match(/<circle /g)||[]).length>=9,'KRONOS 3 Reglerbank ist zu wenig detailliert.');

const sv1=context.render('keys-sv1-73');
assert.ok(sv1.includes('data-part="korg-sv1-rounded-console"'),'SV-1 hat nicht sein gerundetes Geh\u00e4use.');
assert.ok(sv1.includes('data-part="korg-sv1-keybed"'),'SV-1 hat keine eigene Tastaturansicht.');

const hammond=context.render('keys-hammond-b3');
assert.ok(hammond.includes('data-part="hammond-b3-console"'),'Hammond B-3 hat keine eigene zweimanualige Konsole.');
assert.ok((hammond.match(/data-part="keybed"/g)||[]).length>=2,'Hammond B-3 zeigt nicht beide Manuale.');

for(const marker of [
  'id="sp-model-change"',
  'id="sp-model-dialog"',
  "compactModelFamilies=new Set(['keys','electric-guitars','electric-basses','stageboxes','mixers'])",
  'function openCompactModelDialog()',
  "$('sp-model-picker').hidden=compact"
])assert.ok(html.includes(marker),marker+' fehlt in der kompakten Modellauswahl.');

console.log('PASS V76: kompakte Modell-Popups sowie Korg KRONOS 3, SV-1 und Hammond B-3.');
