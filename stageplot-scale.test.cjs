const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const percussion=require('./stageplot-percussion-v1.js')();
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync('stageplot-drums-v12.js','utf8')+'\nthis.drums=createStageplotDrumModel();'+fs.readFileSync('stageplot-symbols-v3.js','utf8')+'\nthis.render=createStageplotSymbolV3;',context);
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<.0003,`${message}: ${actual} vs ${expected}`);
const tags=markup=>[...markup.matchAll(/<(image|ellipse) ([^>]+)>/g)].map(m=>({tag:m[1],...Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]))}));
// Measure the rendered head/disc pixels, independent of the model's bounding boxes.
for(const inches of [14,16,18,20]){
 const layout=context.drums.drumLayout('drums',{...context.drums.drumDefaults(),crashes:[inches],hihat:false});
 const markup=context.render('drums',{drumLayout:layout});
 const crash=tags(markup).find(t=>t['data-rendered-drum-asset']==='crash'&&t['data-drum-layer']==='over');
 near(Number(crash.width)*342/508*.02,inches*.0254,'Crash diameter across stage');
 near(Number(crash.height)*340/512*.02,inches*.0254,'Crash depth across stage');
 const clipId=crash['clip-path'].slice(5,-1),clip=markup.match(new RegExp('<clipPath id="'+clipId+'"[^]*?</clipPath>'))[0];
 const disc=tags(clip).find(t=>t.tag==='ellipse');near(Number(disc.rx)*.04,inches*.0254,'Visible clipped disc');
 near(Number(disc.ry)*.04,inches*.0254,'Round disc in depth');
 const hit=context.drums.drumInteraction(layout).selectionShapes.find(p=>p.id==='crash1');
 near(hit.rx*.04,inches*.0254,'Click target matches disc');
 if(inches===16)near(Number(crash.width)*342/508*.02,percussion.byId.cymbal.w,'16-inch percussion and drum cymbals match');
}
for(const inches of [18,20,21,22,24]){
 const layout=context.drums.drumLayout('drums',{rideSize:inches});
 const ride=tags(context.render('drums',{drumLayout:layout})).find(t=>t['data-rendered-drum-asset']==='ride'&&t['data-drum-layer']==='over');
 near(Number(ride.width)*418/461*.02,inches*.0254,'Ride diameter');near(Number(ride.height)*392/512*.02,inches*.0254,'Ride depth');
}
for(const diameter of [16,22,24])for(const depth of [10,18,24]){
 const layout=context.drums.drumLayout('drums',{kickDiameter:diameter,kickDepth:depth});
 const kick=tags(context.render('drums',{drumLayout:layout})).find(t=>t['data-rendered-drum-asset']==='kick-overhead-v3');
 near(Number(kick.width)*320/512*.02,diameter*.0254,'Kick shell diameter');
 near(Number(kick.height)*225/543*.02,depth*.0254,'Kick shell depth is independent of diameter');
}
const base=context.drums.drumLayout('drums',context.drums.drumDefaults()),baseArt=tags(context.render('drums',{drumLayout:base}));
for(const [asset,pixels,source,inches] of [['snare',170,221,14],['rack-tom',186,238,10],['floor-tom',198,252,14]]){
 const img=baseArt.find(t=>t['data-rendered-drum-asset']===asset);near(Number(img.width)*pixels/source*.02,inches*.0254,asset+' head');
}
const pad=baseArt.find(t=>t['data-rendered-drum-asset']==='spdsx-overhead-preview-v1');
near(Number(pad['data-crop-width'])*.02,.364,'SPD-SX width');near(Number(pad['data-crop-height'])*.02,.331,'SPD-SX depth');
near(percussion.byId.multipad.w,.364,'Same pad in percussion editor');near(percussion.byId.multipad.d,.331,'Same pad depth');
for(const preset of ['2x','3x']){
 const r=context.drums.drumLayout('drums',{riserPreset:preset}).riser;
 near(r.moduleW*.02,1,'Riser width');near(r.moduleH*.02,2,'Riser depth');
}
const html=fs.readFileSync('stageplot-studio.html','utf8');
const catalogStart=html.indexOf('  const catalog = ['),catalogEnd=html.indexOf("{id:'cajon'",catalogStart),cards=html.slice(catalogStart,catalogEnd);
assert.match(cards,/id:'drums'[^]*?id:'percussion',name:'Percussion-Set',short:'Percussion-Set'/);
// The real dashboard renderer must not enlarge tiny instruments to a minimum pixel size.
const preview=html.match(/  function projectPreviewObjectsMarkup\([^]*?\n  }/)[0];
const c={vb:[10,10]},tiny={w:.1,d:.1};
const previewContext={stageObjectOrder:x=>x,objectCatalog:()=>c,objectSize:()=>tiny,artId:()=> 'tiny'};vm.createContext(previewContext);
vm.runInContext(preview+'\nthis.markup=projectPreviewObjectsMarkup([{id:"tiny",x:0,y:0}],5,0,0,false);',previewContext);
assert.match(previewContext.markup,/scale\(0\.0500\)/,'10 cm remains 0.5 px at 5 px/m, not a 3 px inflated object.');
console.log('PASS SCALE: rendered drum diameters, independent kick depth, matching percussion dimensions, original SPD-SX size, risers and tiny preview objects.');
