const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync('stageplot-assets/tech/manifest.json'));
const prompts=JSON.parse(fs.readFileSync('stageplot-assets/tech/prompts.json'));
const html=fs.readFileSync('stageplot-studio.html','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8')+';this.render=createStageplotSymbolV3;this.frame=stageplotTechFrame;this.micLayout=stageplotMicLayout;',ctx);
assert.equal(new Set(manifest.assets.map(a=>a.id)).size,30);
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
for(const direction of ['up','left','right']){const svg=ctx.render('mic',{boomDirection:direction});assert.match(svg,/mic-tripod-base-top-v2/);assert.match(svg,/mic-boom-arm-top-v3/);assert.ok(svg.includes('data-part="boom-arm-'+direction+'"'));}
for(const direction of ['up','left','right']){
 const svg=ctx.render('mic',{boomDirection:direction}),head=svg.match(/<g data-part="boom-microphone"[^]*?<\/g>/)[0];
 assert.match(head,/data-mic-direction="up"/);assert.match(head,/mic-boom-head-top-v3/);assert.ok(!head.includes('rotate('),'Microphone stays upright independently of the boom');
 assert.equal((svg.match(/<image /g)||[]).length,3);assert.deepEqual(JSON.parse(JSON.stringify(ctx.frame('mic',{boomDirection:direction}))),{width:1450,height:1450});
}
for(const stand of ['boom','round'])for(const [micHeadDirection,heading] of [['up',0],['right',90],['down',180],['left',270]])for(const angle of [-45,0,45,137,270,359,720]){
 const layout=ctx.micLayout({stand,micHeadDirection,angle}),world=(angle+layout.headAngle+720)%360;
 assert.ok(Math.abs(world-heading)<1e-8,'Fixed microphone head remains stage-relative');
 const follow=ctx.micLayout({stand,angle});assert.equal(follow.headAngle,0,'Old projects continue rotating normally');
 assert.deepEqual(layout.tip,follow.tip,'Fixing the head does not move its attachment');
}
assert.equal(ctx.micLayout({micHeadDirection:'constructor'}).headAngle,0,'Invalid directions fall back to following the stand');
assert.equal(manifest.assets.find(a=>a.id==='mic-boom').calibration.overallLengthMillimeters,745);
assert.match(ctx.render('mic'),/data-diameter-mm="600"/);
assert.equal(manifest.assets.find(a=>a.id==='mic-boom-head').calibration.displayLengthMillimeters,230);
assert.notEqual(ctx.render('mic',{stand:'round'}),ctx.render('mic',{stand:'boom'}));
assert.match(ctx.render('mic',{stand:'round'}),/width="250" height="250"/);
for(const id of ['guitar-stand-full','guitar-tree-full']){assert.match(ctx.render(id),/data-rendered-tech-asset/);assert.ok(!ctx.render(id).includes('<use '),'Stored guitars must be overhead raster projections, not stretched frontal symbols');}
assert.notEqual(ctx.render('di-mono-active'),ctx.render('di-stereo-passive'));assert.throws(()=>ctx.render('__proto__'));
assert.ok(fs.readFileSync('stageplot-preview.py','utf8').includes('"/stageplot-assets/tech/"'));
assert.ok(!html.includes('const unit=Math.min(w/180,h/120)'), 'FOH uses the same metric transform, not the former fixed viewBox');
assert.match(html,/image\.setAttribute\('href',await localImageDataUrl\(url\)\)/);
console.log('PASS TECH ASSETS: 30 local alpha sprites, uniform raster proportions, millimetre frames, calibrated 30 cm throne seat, boom/round variants and full overhead guitar stands.');

for(const stand of ['boom','round'])for(const boomDirection of ['up','left','right']){
  const options={stand,boomDirection,angle:137,micHeadDirection:'right'},base=ctx.render('mic',{...options,micLayer:'base'}),upper=ctx.render('mic',{...options,micLayer:'upper'});
  assert.match(base,/mic-(tripod|round)-base-top/);assert.doesNotMatch(base,/mic-boom-(arm|head)-top/);
  assert.match(upper,/mic-boom-head-top/);assert.doesNotMatch(upper,/mic-(tripod|round)-base-top/);
  assert.equal((base+upper).match(/<image /g).length,stand==='round'?2:3,'Split layers draw each sprite exactly once');
}
