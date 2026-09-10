const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync('stageplot-assets/tech/manifest.json'));
const prompts=JSON.parse(fs.readFileSync('stageplot-assets/tech/prompts.json'));
const html=fs.readFileSync('stageplot-studio.html','utf8'),ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('stageplot-symbols-v3.js','utf8')+';this.render=createStageplotSymbolV3;',ctx);
assert.equal(new Set(manifest.assets.map(a=>a.id)).size,21);
for(const asset of manifest.assets){
 const svg=ctx.render(asset.id),file='stageplot-assets/tech/'+asset.file;
 assert.ok(svg.includes('href="'+file+'"'),asset.id+' uses the local asset');
 assert.ok(svg.includes('preserveAspectRatio="none"'),asset.id+' fills both physical axes');
 assert.ok(svg.includes('width="'+asset.viewBox[0]+'" height="'+asset.viewBox[1]+'"'));
 assert.equal((svg.match(/<image /g)||[]).length,1,asset.id+' has one canonical sprite');
 assert.equal(asset.view,'orthographic-top');assert.ok(asset.hasAlpha);
 assert.ok(asset.width<=768&&asset.height<=768);assert.ok(asset.width>20&&asset.height>20);
 const data=fs.readFileSync(file);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 assert.equal(data.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256);
 assert.ok(prompts.some(p=>p.id===asset.id&&p.prompt.includes('ORTHOGRAPHIC')));
 assert.ok(asset.crop.left>=0&&asset.crop.top>=0&&asset.crop.left+asset.crop.width<=asset.source.width&&asset.crop.top+asset.crop.height<=asset.source.height);
 assert.ok(asset.footprintMeters.width>0&&asset.footprintMeters.depth>0);
}
assert.ok(manifest.assets.reduce((sum,a)=>sum+a.bytes,0)<1.5*1024*1024,'Keep the local sprite set compact');
assert.ok(fs.readFileSync('stageplot-preview.py','utf8').includes('"/stageplot-assets/tech/"'),'Preview serves the same local assets as Pages');
assert.notEqual(ctx.render('mic',{stand:'round'}),ctx.render('mic',{stand:'boom'}),'Mic stands retain their adjustable geometry');
assert.notEqual(ctx.render('di-mono-active'),ctx.render('di-stereo-passive'),'DI variants retain distinct geometry');
assert.throws(()=>ctx.render('__proto__'));
assert.match(html,/image\.setAttribute\('href',await localImageDataUrl\(url\)\)/,'Exports embed local raster assets');
console.log('PASS TECH ASSETS: 21 local alpha sprites, hashes, compact files, physical viewboxes, prompts, dynamic variants and export embedding.');
