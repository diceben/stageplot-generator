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

assert.match(script,/const visible=\[\],seenFamilies=new Set\(\);[\s\S]*seenFamilies\.has\(family\)/,'Die Bibliothek fasst Modellfamilien nicht zusammen.');
assert.match(script,/showCompactModelDialog\(current\.family,o\.type,'change'\)/,'Der Eigenschaften-Button verwendet nicht denselben Modell-Picker.');
assert.match(html,/\.sp-library-model-family \{ cursor:pointer; \}/,'Sammelobjekte sind nicht als Modell-Picker erkennbar.');

for(const marker of [
  "id:'mic-wireless-ewd'.*w:.268,d:.05",
  "id:'mic-sm57'.*w:.157,d:.032"
])assert.match(html,new RegExp(marker),marker+' fehlt als lesbares Mikrofon-Plansymbol mit dokumentiertem Originalmaß.');

console.log('PASS V80: je ein Keyboard-/Gitarren-/Bass-Sammelobjekt mit gemeinsamem Modell-Picker sowie maßstäbliche Mikrofon-Plansymbole.');

// Library-only groups preserve catalog geometry and the original instrument types.
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',querySelector:()=>({}),showModal(){this.open=true;}});return nodes.get(id);};
const ctx={$:node,root:{querySelectorAll:()=>[]},view:'editor',libraryMode:'objects',libraryScope:'all',libraryCategory:'all',libraryPreferences:{favorites:[],recent:[]},objects:[],placement:null,syncLibrarySearchUi(){},esc:String,isObjectUnlocked:()=>true,libraryIcon:c=>'<svg data-type="'+c.id+'"/>',icon:c=>'<svg data-type="'+c.id+'"/>',compactModelFamilies:new Set(['keys']),visualVariantFamilies:{keys:'Keyboardmodell'},requestAnimationFrame(){}};
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('  const catalog = ['),html.indexOf('  let stage ='))+'\nthis.catalog=catalog;this.byId=byId;this.groups=libraryModelFamilyCards;',ctx);
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
vm.runInContext(html.match(/  const libraryTypeForObject=[^\n]+/)[0]+'\nthis.libraryTypeForObject=libraryTypeForObject;\n'+['libraryMatches','library','showCompactModelDialog'].map(extract).join('\n'),ctx);
const original=JSON.stringify(ctx.catalog),groups={brass:['Blech',6],woodwinds:['Holz',9],'orchestral-strings':['Streicher',4]};
for(const category of ['all','instruments','classical']){
  ctx.libraryCategory=category;ctx.library();const rendered=node('sp-library-items').innerHTML;
  for(const [family,[name,count]] of Object.entries(groups)){
    assert.equal((rendered.match(new RegExp('data-library-model-family="'+family+'"','g'))||[]).length,1,category+' / '+name);
    for(const c of ctx.libraryFamilyVariants(family))assert(!rendered.includes('data-add="'+c.id+'"'),c.id+' remains a duplicate standalone card');
    ctx.showCompactModelDialog(family,'','place');assert.equal(node('sp-model-dialog-title').textContent,name);assert.equal((node('sp-model-dialog-options').innerHTML.match(/data-dialog-model=/g)||[]).length,count);
  }
}
assert.equal(ctx.libraryFamilyFor(ctx.byId.saxophone),'woodwinds');assert.equal(ctx.libraryFamilyFor(ctx.byId['english-horn']),'woodwinds');assert.equal(ctx.libraryFamilyFor(ctx.byId['double-bass']),'orchestral-strings');assert(!ctx.libraryFamilyFor(ctx.byId.harp));assert.equal(ctx.libraryFamilyFor(ctx.byId.guitar),'electric-guitars');
ctx.libraryCategory='all';
for(const [query,family] of [['Blech','brass'],['Holz','woodwinds'],['Streicher','orchestral-strings'],['Klarinette','woodwinds'],['Cello','orchestral-strings']]){
  node('sp-library-search').value=query;ctx.library();assert(node('sp-library-items').innerHTML.includes('data-library-model-family="'+family+'"'),query);
}
node('sp-library-search').value='';ctx.libraryScope='favorites';ctx.libraryPreferences.favorites=['family:brass','violin'];ctx.library();assert(node('sp-library-items').innerHTML.includes('data-library-model-family="brass"'));assert(node('sp-library-items').innerHTML.includes('data-add="violin"'),'Existing individual favorites stay directly available.');
assert.equal(ctx.libraryTypeForObject({type:'orchestra',orchestra:{mode:'single',parts:[{type:'cello'}]}}),'cello');assert.equal(ctx.libraryTypeForObject({type:'orchestra',orchestra:{mode:'ensemble',parts:[{type:'cello'}]}}),'orchestra');
assert.equal(JSON.stringify(ctx.catalog),original,'Grouping never changes instrument definitions.');
console.log('PASS ORCHESTRAL GROUPS: Blech/Holz/Streicher, category deduplication, instrument pickers, search, existing favorites and unchanged catalog.');
