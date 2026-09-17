const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
scripts.forEach((source,index)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:`inline-${index}.js`})));
const script=scripts.at(-1)||'';

for(const marker of [
  "keys:{label:'Keyboard',representative:'keys-stage4'}",
  "'electric-guitars':{label:'E-Gitarre',representative:'guitar'}",
  "'electric-basses':{label:'Bass',representative:'bass'}",
  'data-library-model-family=',
  "function openLibraryModelDialog(family){showCompactModelDialog(family,'','place');}",
  "if(context?.action==='place'){beginPlacement(type,{detail:0})"
])assert.ok(script.includes(marker)||html.includes(marker),marker+' fehlt im gemeinsamen Modell-Picker-Workflow.');

assert.match(script,/const visible=\[\],seenFamilies=new Set\(\);[\s\S]*seenFamilies\.has\(family\)/,'Die Bibliothek fasst Modellfamilien nicht zusammen.');
assert.match(script,/showCompactModelDialog\(current\.family,o\.type,'change'\)/,'Der Eigenschaften-Button verwendet nicht denselben Modell-Picker.');
assert.match(html,/\.sp-library-model-family \{ cursor:pointer; \}/,'Sammelobjekte sind nicht als Modell-Picker erkennbar.');

for(const marker of [
  "id:'mic-wireless-ewd'.*w:.268,d:.05",
  "id:'mic-sm57'.*w:.157,d:.032"
])assert.match(html,new RegExp(marker),marker+' fehlt als lesbares Mikrofon-Plansymbol mit dokumentiertem Originalmaß.');

console.log('PASS V80: je ein Keyboard-/Gitarren-/Bass-Sammelobjekt mit gemeinsamem Modell-Picker sowie maßstäbliche Mikrofon-Plansymbole.');

// Library-only groups preserve catalog geometry and the original instrument types.
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',dataset:{},querySelector:()=>({}),querySelectorAll:()=>[],removeAttribute(){},show(){this.open=true;},showModal(){this.open=true;}});return nodes.get(id);};
const ctx={StageplotRoutingModel:require('./stageplot-routing-model-v2.js'),stage:null,audioDiPhoto:()=>'<img class="sp-audio-di-photo">',$:node,root:{querySelectorAll:()=>[],dataset:{libraryCollapsed:'false'}},window:{innerWidth:1200},document:{activeElement:{}},positionModelDialog(){},view:'editor',libraryMode:'objects',libraryScope:'all',libraryCategory:'all',libraryPreferences:{favorites:[],recent:[]},objects:[],placement:null,syncLibrarySearchUi(){},esc:String,isObjectUnlocked:()=>true,libraryIcon:c=>'<svg data-type="'+c.id+'"/>',icon:c=>'<svg data-type="'+c.id+'"/>',compactModelFamilies:new Set(['keys']),visualVariantFamilies:{keys:'Keyboardmodell'},requestAnimationFrame(){}};
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  let stage ='))+'\nthis.catalog=catalog;this.byId=byId;this.groups=libraryModelFamilyCards;',ctx);
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
vm.runInContext(html.match(/  const libraryTypeForObject=[^\n]+/)[0]+'\nthis.libraryTypeForObject=libraryTypeForObject;\n'+['libraryMatches','librarySearchRank','library','showCompactModelDialog'].map(extract).join('\n'),ctx);
const original=JSON.stringify(ctx.catalog),groups={brass:['Blechbläser',6],woodwinds:['Holzbläser',9],'orchestral-strings':['Streicher',4]};
for(const category of ['all','instruments','classical']){
  ctx.libraryCategory=category;ctx.library();const rendered=node('sp-library-items').innerHTML;
  for(const [family,[name,count]] of Object.entries(groups)){
    assert.equal((rendered.match(new RegExp('data-library-model-family="'+family+'"','g'))||[]).length,1,category+' / '+name);
    for(const c of ctx.libraryFamilyVariants(family))assert(!rendered.includes('data-add="'+c.id+'"'),c.id+' remains a duplicate standalone card');
    ctx.showCompactModelDialog(family,'','place');assert.equal(node('sp-model-dialog-title').textContent,name+' auswählen');assert.equal((node('sp-model-dialog-options').innerHTML.match(/data-dialog-model=/g)||[]).length,count);
  }
}
assert.equal(ctx.libraryFamilyFor(ctx.byId.saxophone),'woodwinds');assert.equal(ctx.libraryFamilyFor(ctx.byId['english-horn']),'woodwinds');assert.equal(ctx.libraryFamilyFor(ctx.byId['double-bass']),'orchestral-strings');assert(!ctx.libraryFamilyFor(ctx.byId.harp));assert.equal(ctx.libraryFamilyFor(ctx.byId.guitar),'electric-guitars');
ctx.libraryCategory='all';
for(const [query,id] of [['Blech','trumpet'],['Holz','saxophone'],['Streicher','violin'],['Klarinette','clarinet'],['Cello','cello'],['Mustang','bass-mustang']]){
  node('sp-library-search').value=query;ctx.library();assert(node('sp-library-items').innerHTML.includes('data-add="'+id+'"'),query+' directly offers individual models');
  assert(!node('sp-library-items').innerHTML.includes('data-library-model-family='),'Search must not add another picker step.');
}
node('sp-library-search').value='';ctx.libraryScope='favorites';ctx.libraryPreferences.favorites=['family:brass','violin'];ctx.library();assert(node('sp-library-items').innerHTML.includes('data-library-model-family="brass"'));assert(node('sp-library-items').innerHTML.includes('data-add="violin"'),'Existing individual favorites stay directly available.');
assert.equal(ctx.libraryTypeForObject({type:'orchestra',orchestra:{mode:'single',parts:[{type:'cello'}]}}),'cello');assert.equal(ctx.libraryTypeForObject({type:'orchestra',orchestra:{mode:'ensemble',parts:[{type:'cello'}]}}),'orchestra');
assert.equal(JSON.stringify(ctx.catalog),original,'Grouping never changes instrument definitions.');
console.log('PASS ORCHESTRAL GROUPS: Blech/Holz/Streicher, category deduplication, instrument pickers, search, existing favorites and unchanged catalog.');

// Every catalog object remains reachable, including model-picker members and collapsed sections.
const reachable=new Set(),categories=['guitars','keys','drums','orchestral','mics','audio','stage','lights'];
ctx.libraryScope='all';node('sp-library-search').value='';
for(const category of categories){
 ctx.libraryCategory=category;ctx.library();const rendered=node('sp-library-items').innerHTML;
 for(const match of rendered.matchAll(/data-add="([^"]+)"/g))reachable.add(match[1]);
 const families=[...rendered.matchAll(/data-library-model-family="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(families).size,families.length,category+' contains no duplicate family');
 for(const family of families)for(const c of ctx.libraryFamilyVariants(family,true))reachable.add(c.diModelId?'di':c.id);
}
for(const c of ctx.catalog){assert(reachable.has(c.id),c.id+' missing from the new navigation');assert(ctx.libraryCategoriesFor(c).length>0,c.id+' has no category');}
assert(ctx.libraryCategoriesFor(ctx.byId['double-bass']).includes('guitars'));
assert(ctx.libraryCategoriesFor(ctx.byId['double-bass']).includes('orchestral'));
assert(ctx.libraryCategoriesFor(ctx.byId['drum-throne']).includes('drums'));
assert(ctx.libraryCategoriesFor(ctx.byId['drum-throne']).includes('stage'));
ctx.libraryCategory='guitars';ctx.library();
assert(node('sp-library-items').innerHTML.indexOf('family:electric-guitars')<node('sp-library-items').innerHTML.indexOf('family:electric-basses'));
assert(node('sp-library-items').innerHTML.includes('data-add="banjo"'));
assert(!node('sp-library-items').innerHTML.includes('data-library-model-family="orchestral-strings"'));
ctx.libraryCategory='stage';node('sp-library-search').value='Mustang';ctx.library();
assert(node('sp-library-items').innerHTML.includes('data-add="bass-mustang"'),'Search crosses the selected category.');
node('sp-library-search').value='';ctx.libraryScope='favorites';ctx.libraryPreferences.favorites=['bass-mustang','family:acoustic-guitars'];ctx.library();
assert(node('sp-library-items').innerHTML.includes('data-add="bass-mustang"'));
assert(node('sp-library-items').innerHTML.includes('data-library-model-family="acoustic-guitars"'),'Existing family favorites survive.');
ctx.showCompactModelDialog('electric-basses','','place');
assert(node('sp-model-dialog-options').innerHTML.includes('data-model-favorite="bass-mustang" aria-pressed="true"'));
assert.equal((node('sp-model-dialog-options').innerHTML.match(/data-model-favorite=/g)||[]).length,9);
assert.equal(node('sp-model-dialog').dataset.docked,'true','Desktop placement uses the adjacent nonmodal picker.');
console.log('PASS LIBRARY NAVIGATION: all catalog types reachable, direct model search, contextual categories and retained favorites.');

node('sp-library-search').value='mik';ctx.libraryScope='all';ctx.library();
const micHits=[...node('sp-library-items').innerHTML.matchAll(/data-add="([^"]+)"/g)].map(m=>m[1]);
assert.equal(micHits[0],'mic','Microphones precede category-only matches such as guitar stands.');
assert(micHits.indexOf('mic-round')<micHits.indexOf('guitar-stand-single'));

ctx.libraryScope='all';ctx.libraryCategory='audio';node('sp-library-search').value='';ctx.library();
assert.equal((node('sp-library-items').innerHTML.match(/data-library-model-family="di-boxes"/g)||[]).length,1);
assert(!node('sp-library-items').innerHTML.includes('data-add="di"'));
ctx.showCompactModelDialog('di-boxes','','place');
assert.equal((node('sp-model-dialog-options').innerHTML.match(/data-dialog-model=/g)||[]).length,7);
assert(!node('sp-model-dialog-options').innerHTML.includes('di-model:custom'));
node('sp-library-search').value='ProD2';ctx.library();assert(node('sp-library-items').innerHTML.includes('data-add="di-model:radial-prod2"'));
ctx.libraryScope='favorites';ctx.libraryPreferences.favorites=['di-model:radial-prod2'];ctx.library();assert(node('sp-library-items').innerHTML.includes('data-add="di-model:radial-prod2"'));
console.log('PASS DI LIBRARY: seven models in the shared picker, direct product search and model favorites.');

ctx.libraryPreferences.favorites=['di'];node('sp-library-search').value='';ctx.library();assert(node('sp-library-items').innerHTML.includes('data-library-model-family="di-boxes"'),'Old DI favorites open the model picker.');
