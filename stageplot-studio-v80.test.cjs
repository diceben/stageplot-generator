const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
scripts.forEach((source,index)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:`inline-${index}.js`})));
const script=scripts.at(-1)||'';

for(const marker of [
  "keys:{label:'Keyboard',representative:'keys-stage4'}",
  "'electric-guitars':{label:'Gitarre',representative:'guitar'}",
  "'electric-basses':{label:'Bass',representative:'bass'}",
  'data-library-model-family=',
  "function openLibraryModelDialog(family){showCompactModelDialog(family,'','place');}",
  "if(context?.action==='place')beginPlacement(type,{detail:0})"
])assert.ok(script.includes(marker)||html.includes(marker),marker+' fehlt im gemeinsamen Modell-Picker-Workflow.');

assert.match(script,/const visible=\[\],seenFamilies=new Set\(\);[\s\S]*seenFamilies\.has\(c\.family\)/,'Die Bibliothek fasst Modellfamilien nicht zusammen.');
assert.match(script,/showCompactModelDialog\(current\.family,o\.type,'change'\)/,'Der Eigenschaften-Button verwendet nicht denselben Modell-Picker.');
assert.match(html,/\.sp-library-model-family \{ cursor:pointer; \}/,'Sammelobjekte sind nicht als Modell-Picker erkennbar.');

for(const marker of [
  "id:'mic-wireless-ewd'.*w:.268,d:.05",
  "id:'mic-sm57'.*w:.157,d:.032"
])assert.match(html,new RegExp(marker),marker+' fehlt als lesbares Mikrofon-Plansymbol mit dokumentiertem Originalmaß.');

console.log('PASS V80: je ein Keyboard-/Gitarren-/Bass-Sammelobjekt mit gemeinsamem Modell-Picker sowie maßstäbliche Mikrofon-Plansymbole.');
