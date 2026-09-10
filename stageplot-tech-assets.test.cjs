const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync('stageplot-assets/tech/manifest.json'));
const prompts=JSON.parse(fs.readFileSync('stageplot-assets/tech/prompts.json'));
const html=fs.readFileSync('stageplot-studio.html','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8')+';this.render=createStageplotSymbolV3;this.frame=stageplotTechFrame;',ctx);
assert.equal(new Set(manifest.assets.map(a=>a.id)).size,29);
for(const asset of manifest.assets){
 const svg=ctx.render(asset.id),file='stageplot-assets/tech/'+asset.file;
 assert.ok(svg.includes('href="'+file+'"'),asset.id+' uses its local raster');
 assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'),asset.id+' preserves native proportions');
 assert.ok(!svg.includes('preserveAspectRatio="none"'),asset.id+' never stretches the raster');
 assert.ok(svg.includes('data-metric-frame="true"'));
 assert.equal((svg.match(/<image /g)||[]).length,1,asset.id+' has one canonical sprite');
 assert.equal(asset.view,'orthographic-top');assert.ok(asset.hasAlpha);
 assert.ok(asset.width<=768&&asset.height<=768);assert.ok(asset.width>20&&asset.height>20);
 const data=fs.readFileSync(file);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 assert.equal(data.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256);
 assert.ok(prompts.some(p=>p.id===asset.id&&/ORTHOGRAPHIC/i.test(p.prompt)));
 assert.ok(asset.crop.left>=0&&asset.crop.top>=0&&asset.crop.left+asset.crop.width<=asset.source.width&&asset.crop.top+asset.crop.height<=asset.source.height);
 assert.ok(asset.footprintMeters.width>0&&asset.footprintMeters.depth>0);
 for(const [dimension,millimetres] of [['width',asset.viewBox[0]],['depth',asset.viewBox[1]]])assert.ok(Math.abs(asset.footprintMeters[dimension]*1000-millimetres)<1e-8);
}
assert.ok(manifest.assets.reduce((sum,a)=>sum+a.bytes,0)<2*1024*1024,'Keep all local sprites under 2 MiB');
const throne=ctx.render('drum-throne');assert.match(throne,/width="300" height="300"/);assert.match(throne,/data-diameter-mm="300"/);
assert.match(throne,/throne-base-top-v2/);assert.deepEqual(JSON.parse(JSON.stringify(ctx.frame('drum-throne'))),{width:430,height:430});
for(const direction of ['up','left','right']){const svg=ctx.render('mic',{boomDirection:direction});assert.match(svg,/mic-tripod-base-top-v2/);assert.match(svg,/mic-boom-top-v2/);assert.ok(svg.includes('data-part="boom-arm-'+direction+'"'));}
assert.notEqual(ctx.render('mic',{stand:'round'}),ctx.render('mic',{stand:'boom'}));
assert.match(ctx.render('mic',{stand:'round'}),/width="250" height="250"/);
for(const id of ['guitar-stand-full','guitar-tree-full']){assert.match(ctx.render(id),/data-rendered-tech-asset/);assert.ok(!ctx.render(id).includes('<use '),'Stored guitars must be overhead raster projections, not stretched frontal symbols');}
assert.notEqual(ctx.render('di-mono-active'),ctx.render('di-stereo-passive'));assert.throws(()=>ctx.render('__proto__'));
assert.ok(fs.readFileSync('stageplot-preview.py','utf8').includes('"/stageplot-assets/tech/"'));
assert.ok(!html.includes('const unit=Math.min(w/180,h/120)'), 'FOH uses the same metric transform, not the former fixed viewBox');
assert.match(html,/image\.setAttribute\('href',await localImageDataUrl\(url\)\)/);
console.log('PASS TECH ASSETS: 29 local alpha sprites, uniform raster proportions, millimetre frames, calibrated 30 cm throne seat, boom/round variants and full overhead guitar stands.');
