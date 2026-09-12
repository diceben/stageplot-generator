const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launchBrowser();try{for(const width of [1440,390]){
 const p=await browser.newPage({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});p.setDefaultTimeout(10000);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.APP_URL||'http://127.0.0.1:8881/');await p.locator('[data-project-add]').click();await p.locator('#sp-np-create').click();
 await p.waitForFunction(()=>localStorage.getItem('stageplot-studio:workspace:v1'));
 for(const reverse of [false,true]){
  await p.evaluate(reverse=>{
   const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=workspace.entry;
   const mic={id:'mic-test',type:'mic',x:4,y:2.5,angle:0,label:'Layer microphone',stand:'boom',boomDirection:'right',micHeadDirection:'up',micFrameVersion:2};
   const keys={id:'keys-test',type:'keys-stage4',x:4.4,y:2.5,angle:0,label:'Layer keyboard'};
   const riser={id:'riser-test',type:'riser',x:4,y:2.5,angle:0,width:3,depth:2,height:40,label:'Layer riser'};
   entry.document.objects=reverse?[keys,riser,mic]:[mic,riser,keys];
   drafts.entries[drafts.entries.findIndex(e=>e.id===entry.id)]=entry;
   localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));
  },reverse);
  await p.reload();await p.locator('.sp-steps [data-view="editor"]').click();
  const floor=p.locator('#sp-editor-floor');await floor.locator('[data-mic-layer="upper"]').waitFor();
  const order=await floor.evaluate(el=>{
   const svg=el.querySelector('svg'),mic=svg.querySelector('[data-mic-layer="upper"]'),base=svg.querySelector('[data-mic-layer="base"]'),keys=svg.querySelector('[aria-label="Layer keyboard"]'),riser=svg.querySelector('[aria-label="Layer riser"]');
   const before=(a,b)=>!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
   return {ordered:before(riser,base)&&before(base,keys)&&before(keys,mic),count:svg.querySelectorAll('[data-object]').length,baseImages:base.querySelectorAll('image').length,upperImages:mic.querySelectorAll('image').length,id:mic.dataset.object};
  });assert(order.ordered,'Riser < feet < keyboard < arm and head regardless of insertion order');assert.equal(order.count,3);assert.equal(order.baseImages,1);assert.equal(order.upperImages,2);
  const id=order.id;await p.screenshot({path:artifactPath(`mic-overlap-${engine}-${width}-${reverse}.png`)});
  // Use real hit testing: equipment over the feet must remain selectable.
  const point=await floor.evaluate(el=>{
   const keys=el.querySelector('[aria-label="Layer keyboard"]'),b=keys.getBoundingClientRect();
   for(let y=b.top+2;y<b.bottom;y+=2)for(let x=b.left+2;x<b.right;x+=2)if(document.elementFromPoint(x,y)?.closest('[data-object]')===keys)return{x,y};
  });assert(point,'Keyboard remains reachable over the stand feet');await p.mouse.click(point.x,point.y);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const footPoint=await floor.evaluate(el=>{
   const base=el.querySelector('[data-mic-layer="base"]'),b=base.getBoundingClientRect();
   for(let y=b.bottom-2;y>b.top;y-=2)for(let x=b.left+2;x<b.right;x+=2)if(document.elementFromPoint(x,y)?.closest('[data-mic-object]')===base)return{x,y};
  });assert(footPoint,'Exposed feet can select and move the same microphone');
  const before=await floor.locator(`[data-mic-object="${id}"]>g`).evaluate(el=>{const m=el.getCTM();return{x:m.e,y:m.f};});
  await p.mouse.move(footPoint.x,footPoint.y);await p.mouse.down();await p.mouse.move(footPoint.x-35,footPoint.y+35,{steps:5});
  const poses=await floor.evaluate((el,id)=>[el.querySelector(`[data-object="${id}"]>g`),el.querySelector(`[data-mic-object="${id}"]>g`)].map(node=>{const m=node.getCTM();return{x:m.e,y:m.f};}),id);
  assert(Math.hypot(poses[0].x-before.x,poses[0].y-before.y)>10,JSON.stringify({width,reverse,before,poses,footPoint}));assert.deepEqual(poses[0],poses[1],'Both layers move together before pointerup');await p.mouse.up();
  await floor.locator(`[data-selection-frame="${id}"]`).waitFor({state:'attached'});
  await p.screenshot({path:artifactPath(`mic-layers-${engine}-${width}-${reverse}.png`)});
  await p.locator('#sp-show-print').click();const print=p.locator('#sp-print-floor');await print.locator('[data-mic-layer="base"]').waitFor({state:'attached'});
  assert.equal(await print.locator('[data-mic-layer="base"] image').count(),1);assert.equal(await print.locator('[data-mic-layer="upper"] image').count(),2);
  await p.context().setOffline(true);await p.locator('[data-export-intent="image"]').click();assert.equal(await print.locator('[data-mic-layer="upper"] image').count(),2);await p.context().setOffline(false);
  await p.locator('.sp-steps [data-view="dashboard"]').click();
  assert((await p.locator('.sp-project-card-preview [data-mic-layer="base"]').count())>0,'Project card uses split layers too');
 }
 assert.deepEqual(errors,[]);await p.close();console.log('PASS '+engine+' '+width+': mic layers, insertion order, equipment/foot hit testing, live dragging, PDF/image and project preview.');
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
