// Fresh synthetic draft; Chrome native touch events, WebKit PointerEvent integration.
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const engine=process.env.BROWSER||'chrome';
(async()=>{
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));
 try{
  const page=await browser.newPage({viewport:{width:390,height:740},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.APP_URL||'http://127.0.0.1:8880/');await page.locator('#sp-upgrade-open').tap();
  await page.locator('.sp-project-add-card button').tap();await page.locator('#sp-np-create').tap();
  await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
  await page.evaluate(()=>{
   const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=drafts.entries.find(e=>e.id===drafts.lastId);
   entry.document.objects=[{id:'station-1',type:'wedge',x:3,y:2,angle:0,label:'Monitor'},{id:'station-2',type:'laptop',x:5,y:3,angle:15,label:'Playback'}];
   localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));
  });await page.reload();await page.locator('.sp-steps [data-view="editor"]').tap();
  const state=async()=>{await page.keyboard.press('Control+s');return page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects);};
  const point=async id=>page.locator('#sp-editor-floor svg').evaluate((svg,id)=>{
   const o=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects.find(o=>o.id===id),r=svg.getBoundingClientRect();
   return {x:r.left+Number(svg.dataset.originX)+o.x*Number(svg.dataset.scale),y:r.top+Number(svg.dataset.originY)+o.y*Number(svg.dataset.scale)};
  },id);
  const cdp=engine==='chrome'?await page.context().newCDPSession(page):null;
  const gesture=async(p,cancel=false)=>{
   const touch=(id,x,y)=>({id,x,y,radiusX:2,radiusY:2,force:1});
   if(cdp){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,p.x,p.y)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,p.x,p.y),touch(2,p.x+70,p.y)]});
    for(let step=1;step<=8;step++){const a=step*Math.PI/16;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,p.x,p.y),touch(2,p.x+70*Math.cos(a),p.y+70*Math.sin(a))]});}
    await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
   }else{
    // WebKit exposes taps but no native multi-touch injection in Playwright.
    await page.evaluate(({p,cancel})=>{
     const host=document.querySelector('#sp-editor-floor'),original=host.setPointerCapture;host.setPointerCapture=()=>{};
     const send=(type,id,x,y)=>{const target=type==='pointerdown'?document.elementFromPoint(x,y):host;target.dispatchEvent(new PointerEvent(type,{pointerType:'touch',pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,button:0}));};
     try{send('pointerdown',1,p.x,p.y);send('pointerdown',2,p.x+70,p.y);for(let step=1;step<=8;step++){const a=step*Math.PI/16;send('pointermove',2,p.x+70*Math.cos(a),p.y+70*Math.sin(a));}send(cancel?'pointercancel':'pointerup',2,p.x,p.y+70);send('pointerup',1,p.x,p.y);}finally{host.setPointerCapture=original;}
    },{p,cancel});
   }
   await page.waitForTimeout(100);
  };
  const initial=await state();await gesture(await point('station-1'));let after=await state();
  assert.equal(after[0].angle,90);assert.deepEqual({...after[0],angle:0},initial[0]);assert.deepEqual(after[1],initial[1]);
  if(process.env.QA_SCREENSHOT)await page.screenshot({path:process.env.QA_SCREENSHOT});
  await page.keyboard.press('Control+z');assert.deepEqual(await state(),initial,'One undo restores the whole gesture');
  await gesture(await point('station-1'),true);assert.deepEqual(await state(),initial,'Cancellation restores the document');
  await page.locator('#sp-multi-toggle').tap();await page.locator('#sp-multi-all').tap();await page.locator('#sp-multi-done').tap();
  await gesture(await point('station-1'));after=await state();assert.equal(after[0].angle,90);assert.equal(after[1].angle,105);
  assert.ok(Math.abs(Math.hypot(after[0].x-after[1].x,after[0].y-after[1].y)-Math.sqrt(5))<1e-8);
  await page.reload();assert.deepEqual(await state(),after,'Rotation survives offline reload');
  assert.deepEqual(errors,[]);console.log('PASS '+engine+': single/group touch rotation, metric size and spacing, cancellation, one undo, offline reload'+(cdp?' (native touch).':' (synthetic PointerEvents).'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
