// Optional end-to-end check using a running preview and fresh, synthetic local drafts.
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const engine=process.env.BROWSER||'chrome',url=process.env.APP_URL||'http://127.0.0.1:8880/';
(async()=>{
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#sp-upgrade-open').click();await page.locator('.sp-project-add-card button').click();await page.locator('#sp-np-create').click();
  await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
  await page.evaluate(()=>{
   const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=drafts.entries.find(e=>e.id===drafts.lastId);
   entry.document.objects=[{id:'station-1',type:'mic',x:1.13,y:1.2,angle:0,label:'Gesang',stand:'boom',purpose:'vocals',micFrameVersion:2},{id:'station-2',type:'wedge',x:3.57,y:2.1,angle:30,label:'Monitor'},{id:'station-3',type:'laptop',x:6.11,y:3.2,angle:0,label:'Playback'}];
   localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));
  });await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();
  const state=async()=>{await page.keyboard.press('Control+s');await page.waitForTimeout(80);return page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document);};
  const point=async id=>page.locator('#sp-editor-floor svg').evaluate((svg,id)=>{
   const doc=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document,o=doc.objects.find(o=>o.id===id),r=svg.getBoundingClientRect();
   return {x:r.left+Number(svg.dataset.originX)+o.x*Number(svg.dataset.scale),y:r.top+Number(svg.dataset.originY)+o.y*Number(svg.dataset.scale),scale:Number(svg.dataset.scale)};
  },id);
  const select=async(ids,shift=true)=>{await page.keyboard.press('Escape');for(let i=0;i<ids.length;i++){const p=await point(ids[i]);if(i&&shift)await page.keyboard.down('Shift');await page.mouse.click(p.x,p.y);if(i&&shift)await page.keyboard.up('Shift');}};
  const initial=await state();await select(['station-1','station-2','station-3']);
  assert.equal(await page.locator('#sp-multi-count').innerText(),'3 gewählt');
  assert.equal(await page.locator('#sp-editor-floor [data-selection-frame]').count(),3);
  await page.keyboard.press('ArrowRight');const moved=await state();
  moved.objects.forEach((o,i)=>assert(Math.abs(o.x-initial.objects[i].x-.125)<1e-8,'Shared keyboard movement preserves fractional positions'));
  await page.keyboard.press('Control+z');assert.deepEqual((await state()).objects,initial.objects);
  // Shared drag keeps every internal distance, including off-grid coordinates.
  await select(['station-1','station-2','station-3']);let p=await point('station-2');
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+p.scale*.6,p.y+p.scale*.4,{steps:6});await page.mouse.up();
  const dragged=await state(),dx=dragged.objects[0].x-initial.objects[0].x,dy=dragged.objects[0].y-initial.objects[0].y;
  assert(Math.abs(dx)>.1);dragged.objects.forEach((o,i)=>{assert(Math.abs(o.x-initial.objects[i].x-dx)<1e-8);assert(Math.abs(o.y-initial.objects[i].y-dy)<1e-8);});
  await page.keyboard.press('Control+z');assert.deepEqual((await state()).objects,initial.objects);
  await select(['station-1','station-2','station-3']);await page.locator('#sp-multi-edit').click();
  await page.locator('[data-multi-action="center-y"]').click();let aligned=await state();assert.equal(new Set(aligned.objects.map(o=>o.y)).size,1);
  await page.keyboard.press('Control+z');assert.deepEqual((await state()).objects,initial.objects);
  await select(['station-1','station-2','station-3']);await page.locator('[data-multi-action="lock"]').click();assert((await state()).objects.every(o=>o.locked));
  assert(await page.locator('[data-multi-action="delete"]').isDisabled());assert(await page.locator('[data-multi-action="left"]').isDisabled());
  await page.locator('[data-multi-action="lock"]').click();
  await page.locator('[data-multi-action="duplicate"]').click();const copied=await state();assert.equal(copied.objects.length,6);assert.equal(new Set(copied.objects.map(o=>o.id)).size,6);
  for(let i=0;i<3;i++){assert.equal(copied.objects[i+3].x,copied.objects[i].x+.5);assert.equal(copied.objects[i+3].y,copied.objects[i].y+.5);}
  assert.equal(new Set(copied.stage.routing.inputs.map(r=>r.id)).size,copied.stage.routing.inputs.length);
  assert(copied.stage.routing.inputs.length>initial.stage.routing.inputs.length,'Copies get independent signal rows');
  await page.locator('[data-multi-action="delete"]').click();assert.equal((await state()).objects.length,3);
  await page.keyboard.press('Control+z');assert.equal((await state()).objects.length,6,'One undo restores all deleted objects and routing');
  await page.keyboard.press('Control+z');assert.equal((await state()).objects.length,3,'One more undo removes all copies');
  // A star never places an object, and the real placed type becomes a recent item.
  await page.locator('#sp-library-search').fill('mik');await page.locator('[data-library-favorite="mic"]').click();assert.equal((await state()).objects.length,3);
  await page.locator('#sp-library-search').fill('');await page.locator('#sp-library-search').blur();await page.locator('[data-library-scope="favorites"]').click();
  assert.equal(await page.locator('#sp-library-items [data-add="mic"]').count(),1);
  await page.locator('#sp-library-items [data-add="mic"]').click();await page.mouse.click((await point('station-1')).x+30,(await point('station-1')).y+30);await state();
  await page.locator('[data-library-scope="recent"]').click();assert.equal(await page.locator('#sp-library-items [data-add="mic"]').count(),1);
  await page.reload();await page.locator('[data-library-scope="favorites"]').click();assert.equal(await page.locator('#sp-library-items [data-add="mic"]').count(),1);
  await page.locator('[data-library-scope="recent"]').click();assert.equal(await page.locator('#sp-library-items [data-add="mic"]').count(),1);
  if(process.env.QA_SCREENSHOT)await page.screenshot({path:process.env.QA_SCREENSHOT});
  assert.deepEqual(errors,[]);
  // Phone: explicit multi-select, group actions, no tiny Shift-key dependency.
  const phone=await browser.newPage({viewport:{width:390,height:740},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(url);await phone.locator('#sp-upgrade-open').tap();await phone.locator('.sp-project-add-card button').tap();await phone.locator('#sp-np-create').tap();
  for(const type of ['mic','wedge']){await phone.locator('#sp-library-open').tap();await phone.locator('#sp-library-search').fill(type==='mic'?'mik':'wedge');await phone.locator('#sp-library-items [data-add="'+type+'"]').tap();const r=await phone.locator('#sp-editor-floor').boundingBox();await phone.touchscreen.tap(r.x+r.width*(type==='mic'?.3:.7),r.y+r.height*.4);}
  await phone.locator('#sp-multi-toggle').tap();
  for(const [id,count] of [['station-1',2],['station-2',1],['station-1',0]]){
   const box=await phone.locator('#sp-editor-floor [data-object="'+id+'"]').boundingBox();await phone.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
   assert.equal(await phone.locator('#sp-multi-count').innerText(),count+' gewählt','Touch toggles membership');
  }
  await phone.locator('#sp-multi-all').tap();assert.equal(await phone.locator('#sp-multi-count').innerText(),'2 gewählt');
  await phone.locator('#sp-multi-done').tap();await phone.locator('#sp-multi-edit').tap();assert(await phone.locator('#sp-multi-panel').isVisible());
  await phone.locator('[data-multi-action="duplicate"]').tap();assert.equal(await phone.locator('#sp-multi-count').innerText(),'2 gewählt');
  await phone.locator('#sp-inspector-toggle').tap();assert.equal(await phone.locator('#sp-editor-floor [data-object]').count(),4);
  if(engine==='chrome'){
   const before=await phone.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects);
   const box=await phone.locator('#sp-editor-floor [data-object="station-3"]').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,cdp=await phone.context().newCDPSession(phone);
   const touch=(id,x,y)=>({id,x,y,radiusX:2,radiusY:2,force:1});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,x,y)]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,x,y),touch(2,x+80,y)]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,x-15,y+10),touch(2,x+95,y+10)]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(100);
   assert.deepEqual(await phone.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects),before,'Two-finger camera gesture does not move or resize the selected cohort');
   assert.equal(await phone.locator('#sp-multi-count').innerText(),'2 gewählt');await cdp.detach();
  }
  if(process.env.QA_SCREENSHOT){await phone.locator('#sp-multi-edit').tap();await phone.screenshot({path:process.env.QA_SCREENSHOT.replace('.png','-panel.png')});await phone.locator('#sp-inspector-toggle').tap();}
  const controls=await phone.locator('#sp-multi-toggle').boundingBox(),form=await phone.locator('#sp-venue-open').boundingBox();assert(controls.x>=form.x+form.width,'Top toolbar controls do not overlap');
  for(const width of [320,390,430]){await phone.setViewportSize({width,height:740});const left=await phone.locator('#sp-venue-open').boundingBox(),right=await phone.locator('#sp-multi-toggle').boundingBox();assert(right.x>=left.x+left.width,'Top controls fit at '+width+' px');}
  await phone.setViewportSize({width:390,height:740});
  if(process.env.QA_SCREENSHOT)await phone.screenshot({path:process.env.QA_SCREENSHOT.replace('.png','-phone.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS '+engine+': Shift/touch selection, cohort keyboard/drag, align/lock/duplicate/delete and atomic undo, independent routing IDs, local favorite/recent persistence, mobile actions.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
