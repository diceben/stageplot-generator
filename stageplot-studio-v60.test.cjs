const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const read=name=>fs.readFileSync(name,'utf8');
const html=read('stageplot-studio.html');
const drumSource=read('stageplot-drums-v12.js'),artSource=read('stageplot-symbols-v3.js');
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
const script=scripts.at(-1)||'';
const between=(from,to)=>{const a=script.indexOf(from),b=script.indexOf(to,a+from.length);assert(a>=0&&b>a,`${from} … ${to} fehlt`);return script.slice(a,b);};

assert.ok(html.includes(drumSource.trim()),'Das Drummodell ist nicht unverändert eingebettet.');
assert.ok(html.includes(artSource.trim()),'Der Symbolrenderer ist nicht unverändert eingebettet.');
scripts.forEach((source,index)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:`inline-${index}.js`})));

assert.doesNotMatch(html,/id="sp-placement-drum-size"|name="sp-drum-size"|class="sp-drum-size/,'Die Größenwahl ist noch im UI vorhanden.');
assert.doesNotMatch(script,/drumDraftBySize|resolveDefaultDrumDesign|drumSizeLabel|drumTypeForSize|drumSizeForType/,'Größenlogik ist noch aktiv.');
assert.match(script,/const drumLastStorageKey='stageplot-studio:last-drum:v1'/);
assert.match(script,/function writeLastDrumConfig\(/);
assert.match(script,/function readLastDrumConfig\(/);
assert.match(script,/if\(typeof drumModel!==['"]undefined['"]&&drumModel\.isDrums\(type\)&&!seed\)\{type='drums';seed=\{drums:readLastDrumConfig\(\)\};\}/,'Neue Schlagzeuge verwenden nicht den letzten Stand.');
assert.match(script,/drumHistory\.push\(before\)[\s\S]{0,180}persistLastDrumDraft\(\)/,'Bearbeitungen aktualisieren den letzten Stand nicht.');
assert.match(script,/const type=drumModel\.isDrums\(o\?\.type\)\?'drums':o\?\.type/,'Alte Drumtypen werden beim Laden nicht migriert.');

for(const id of ['sp-drum-design-save','sp-drum-design-load','sp-drum-design-upload','sp-drum-design-download','sp-drum-design-file'])assert.ok(html.includes(`id="${id}"`),id+' fehlt.');
for(const method of ['account?.list','account?.save','account?.remove'])assert.ok(script.includes(method),method+' fehlt an der Account-Speichergrenze.');

const catalogContext={createStageplotSymbolV3:()=>''};vm.createContext(catalogContext);
vm.runInContext(between('  const catalog =','  let stage =')+'\nthis.catalog=catalog;',catalogContext);
const drumCatalog=catalogContext.catalog.filter(item=>item.category==='drums'&&item.id!=='cajon');
assert.deepEqual(JSON.parse(JSON.stringify(drumCatalog.map(item=>({id:item.id,name:item.name,short:item.short})))),[{id:'drums',name:'Schlagzeug',short:'Schlagzeug'}]);

const drumContext={};vm.createContext(drumContext);vm.runInContext(drumSource+'\nthis.model=createStageplotDrumModel();',drumContext);
const model=drumContext.model;
assert.equal(model.isDrums('drums'),true);assert.equal('drumTypeForSize' in model,false);assert.equal('drumSizeForType' in model,false);
const config=model.normalizeDrums({kickDiameter:24,rackToms:[{diameter:8,depth:6,mount:'basket'}],floorToms:[{diameter:18,depth:18}]});
const design=model.createDrumDesign('Tour Kit',config);
assert.equal(design.version,2);assert.equal('size' in design,false);assert.equal(design.config.kickDiameter,24);
const legacy=model.normalizeDrumDesign({kind:'stageplot-drum-design',version:1,name:'Altes großes Set',size:'large',config});
assert.equal(legacy.version,2);assert.equal('size' in legacy,false);assert.equal(legacy.config.kickDiameter,24);
assert.deepEqual(JSON.parse(JSON.stringify(model.drumLayout('drums',config))),JSON.parse(JSON.stringify(model.drumLayout('drums-big',config))),'Legacy-Typen erzeugen noch unterschiedliche Größenlayouts.');

console.log('PASS V60: genau ein Schlagzeug, letzter bearbeiteter Aufbau, größenlose Vorlagen, Legacy-Migration sowie Upload, Download und Account-Store-Grenze.');
