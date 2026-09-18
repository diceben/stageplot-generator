const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
(async()=>{
 const browser=await launchBrowser();
 try{for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850},hasTouch:width<900,isMobile:width<900});page.setDefaultTimeout(15000);
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
   entry.document.objects=[{id:'keys-motion',type:'keys-stage4',label:'Keyboard',x:4,y:2.5,angle:0},{id:'drums-motion',type:'drums',label:'Drums',x:6,y:1.5,angle:0},{id:'stairs-motion',type:'stage-stairs',label:'Treppe',x:2,y:3,width:2,depth:1.5,angle:35,steps:5}];
   drafts.entries[drafts.entries.findIndex(e=>e.id===entry.id)]=entry;
   localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));
  });
  await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();
  const floor=page.locator('#sp-editor-floor'),menu=page.locator('#sp-object-menu');
  await floor.locator('[data-object][aria-label="Keyboard"]').waitFor({state:'visible'});
  const center=()=>floor.locator('[data-object][aria-label="Keyboard"]').evaluate(el=>{const b=el.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
  await floor.locator('[data-object][aria-label="Keyboard"]').hover();await page.mouse.down();
  assert.equal(await menu.evaluate(el=>el.hidden),true,'Do not animate before the selection redraw on pointerup.');
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),0);
  await page.mouse.up();await page.locator('#sp-object-menu-open').waitFor({state:'visible'});
  assert.equal(await menu.evaluate(el=>el.hidden),true,'Selecting keeps actions closed.');
  await page.locator('#sp-object-menu-open').click();await menu.locator('[data-action="edit"]').waitFor({state:'visible'});
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
  const point=await center();await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+24,point.y+24,{steps:5});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),12,'Dragging does not restart the entrance.');
  assert.equal(await menu.evaluate(el=>el.hidden),true,'Dragging closes actions and leaves them closed.');
  await page.waitForFunction(()=>document.querySelector('.som-glitter-plane').childElementCount===0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#sp-object-menu-open').click();await menu.locator('[data-action="edit"]').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.menuEntrances.length),12,'Reduced motion skips the entrance.');
  await page.mouse.move(2,2);await menu.locator('[data-action="duplicate"]').hover();assert.equal(await page.locator('.som-spark').count(),0);
  // Free stairs are the regression case: actions must leave all resize targets
  // reachable, including a rotated footprint and the larger touch hit areas.
  const stairs=floor.locator('[data-object][aria-label="Treppe"]');
  await stairs.click({button:'right'});await menu.locator('[data-action="edit"]').waitFor({state:'visible'});
  const handles=()=>floor.locator('[data-footprint-resize]').evaluateAll(nodes=>nodes.map(el=>{
   const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
   return {dir:el.dataset.footprintResize,x,y,hit:document.elementFromPoint(x,y)?.closest('[data-footprint-resize]')?.dataset.footprintResize};
  }));
  for(const h of await handles())assert.equal(h.hit,h.dir,'Every stair handle remains directly reachable: '+h.dir);
  await menu.locator('[data-action="edit"]').click();await menu.locator('[name="steps"]').fill('9');await menu.locator('[type="submit"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects.some(o=>o.type==='stage-stairs'&&o.steps===9));
  await menu.locator('[data-action="rotate"]').click();
  const blank=await floor.evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.left+12,y:r.top+170};});
  await page.mouse.click(blank.x,blank.y);assert.equal(await menu.getAttribute('data-mode'),'main','Outside the ring returns one level.');
  await page.keyboard.press('Escape');assert.equal(await menu.evaluate(el=>el.hidden),true);
  await floor.press('Shift+F10');await menu.locator('[data-action="edit"]').waitFor({state:'visible'});
  const h=(await handles()).find(h=>h.dir==='se');await page.mouse.move(h.x,h.y);await page.mouse.down();
  assert.equal(await menu.evaluate(el=>el.hidden),true,'Grabbing a handle closes the menu immediately.');
  await page.mouse.move(h.x+40,h.y+35,{steps:6});await page.mouse.up();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects.some(o=>o.type==='stage-stairs'&&o.width>2));
  assert.equal(await menu.evaluate(el=>el.hidden),true,'Resizing never reopens the menu.');
  await page.locator('#sp-object-menu-open').waitFor({state:'visible'});
  if(width<900){
   // Chrome expands native finger hits toward nearby resize controls. Use the
   // keyboard for the hold; stair resize targets were exercised separately.
   const touchPoint=await center();
   const cdp=engine==='webkit'?null:await page.context().newCDPSession(page);
   const touch=async(type,p=touchPoint)=>{
    if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:{pointerdown:'touchStart',pointermove:'touchMove',pointerup:'touchEnd',pointercancel:'touchCancel'}[type],touchPoints:['pointerup','pointercancel'].includes(type)?[]:[{id:1,x:p.x,y:p.y,radiusX:2,radiusY:2,force:1}]});return;}
    await page.evaluate(({type,p})=>{const host=document.querySelector('#sp-editor-floor'),original=host.setPointerCapture;host.setPointerCapture=()=>{};
     try{(type==='pointerdown'?document.elementFromPoint(p.x,p.y):host).dispatchEvent(new PointerEvent(type,{pointerType:'touch',pointerId:51,isPrimary:true,clientX:p.x,clientY:p.y,bubbles:true,cancelable:true,button:0}));}finally{host.setPointerCapture=original;}
    },{type,p});
   };
   await touch('pointerdown');await menu.locator('[data-action="edit"]').waitFor({state:'visible'});await touch('pointerup');
   await menu.locator('[data-action="close"]').click();
   await touch('pointerdown');await touch('pointermove',{x:touchPoint.x+24,y:touchPoint.y+24});await touch('pointerup');
   await page.waitForTimeout(650);assert.equal(await menu.evaluate(el=>el.hidden),true,'Moving a finger cancels long press.');
   await touch('pointerdown');await touch('pointercancel');await page.waitForTimeout(650);
   assert.equal(await menu.evaluate(el=>el.hidden),true,'A cancelled touch cannot open a menu later.');
  }
  assert.deepEqual(errors,[]);await page.screenshot({path:artifactPath('object-menu-motion-'+engine+'-'+width+'.png')});await page.close();
  console.log('PASS '+engine+' '+width+': explicit opening, native animation/glitter, reduced motion, right click, keyboard, submenu return, rotated stair handles, step count, resizing without reopening'+(width<900?', long press and touch cancellation.':'.'));
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
