const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
(async()=>{
 const browser=await launchBrowser();
 try{for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850}});page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Record native animations without changing playback, timing or input handling.
  await page.addInitScript(()=>{
   window.menuEntrances=[];const animate=Element.prototype.animate;
   Element.prototype.animate=function(frames,options){if(this.classList.contains('som-orbit'))window.menuEntrances.push({frames,options});return animate.call(this,frames,options);};
  });
  await page.goto(process.env.APP_URL||'http://127.0.0.1:8898/');
  await page.locator('[data-project-add]').click();await page.locator('#sp-np-create').click();
  await page.waitForFunction(()=>localStorage.getItem('stageplot-studio:workspace:v1'));
  await page.evaluate(()=>{
   const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=workspace.entry;
   entry.document.objects=[{id:'keys-motion',type:'keys-stage4',label:'Keyboard',x:4,y:2.5,angle:0},{id:'drums-motion',type:'drums',label:'Drums',x:6,y:1.5,angle:0}];
   drafts.entries[drafts.entries.findIndex(e=>e.id===entry.id)]=entry;
   localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));
  });
  await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();
  const floor=page.locator('#sp-editor-floor'),menu=page.locator('#sp-object-menu');
  const center=async()=>{const b=await floor.locator('[data-object][aria-label="Keyboard"]').boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2};};
  let point=await center();await page.mouse.move(point.x,point.y);await page.mouse.down();
  assert.equal(await menu.evaluate(el=>el.hidden),true,'Do not animate before the selection redraw on pointerup.');
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),0);
  await page.mouse.up();await menu.locator('[data-action="edit"]').waitFor({state:'visible'});
  const entrances=await page.evaluate(()=>window.menuEntrances);assert.equal(entrances.length,6,'One entrance per circle, without restarting during redraw.');
  for(const {frames,options} of entrances){
   assert.equal(options.fill,'backwards','Staggered circles stay hidden before their start.');
   assert.equal(frames[0].opacity,0);assert.equal(frames.length,4);
   const scales=frames.map(f=>Number(f.transform.match(/scale\(([^)]+)\)/)[1]));
   assert(scales[0]<.2&&scales[1]>1&&scales[2]<1&&scales[3]===1,'Grow, overshoot, settle, rest.');
   assert(!frames.some(f=>f.transform.includes('var(')),'Native animation uses resolved positions.');
  }
  const settle=()=>page.waitForFunction(()=>!document.querySelector('#sp-object-menu').getAnimations({subtree:true}).some(a=>a.playState==='running'));
  await settle();await menu.locator('[data-action="label"]').click();
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),6,'A label update keeps existing circles in place.');
  await menu.locator('[data-action="rotate"]').click();await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('data-mode'),'main');assert.equal(await page.evaluate(()=>window.menuEntrances.length),12,'Returning from the ring plays the same entrance.');
  await settle();await page.waitForFunction(()=>document.querySelector('.som-glitter-plane').childElementCount===0);
  await page.mouse.move(2,2);await menu.locator('[data-action="duplicate"]').hover();
  const dust=await page.locator('.som-glitter-plane').evaluate(el=>{const dots=[...el.children];return{count:dots.length,glints:dots.filter(d=>d.dataset.glint==='true').length,colors:new Set(dots.map(d=>d.style.getPropertyValue('--spark-color'))).size,x:new Set(dots.map(d=>d.style.left)).size};});
  assert(dust.count>=14&&dust.count<=114);assert(dust.glints>=3&&dust.colors===2&&dust.x>5,'Dust surrounds the button with mixed colors and glints.');
  await page.waitForFunction(()=>document.querySelector('.som-glitter-plane').childElementCount===0);
  point=await center();await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+24,point.y+24,{steps:5});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),12,'Dragging does not restart the entrance.');
  await menu.locator('[data-action="close"]').click();
  await page.waitForFunction(()=>document.querySelector('.som-glitter-plane').childElementCount===0);
  await page.emulateMedia({reducedMotion:'reduce'});point=await center();await page.mouse.click(point.x,point.y);await menu.locator('[data-action="edit"]').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),12,'Reduced motion skips the entrance.');
  await page.mouse.move(2,2);await menu.locator('[data-action="duplicate"]').hover();assert.equal(await page.locator('.som-spark').count(),0);
  assert.deepEqual(errors,[]);await page.screenshot({path:artifactPath('object-menu-motion-'+engine+'-'+width+'.png')});await page.close();
  console.log('PASS '+engine+' '+width+': post-redraw entrance, hidden stagger, spring settling, stable updates/dragging, submenu return, distributed glitter/cleanup and reduced motion.');
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
