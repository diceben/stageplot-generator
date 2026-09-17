const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath,assertNoOverflow}=require('./browser-qa.cjs');
const {fixture}=require('./check-routing-workspace-v2.cjs');
const models=require('../stageplot-stageboxes-v1.js').models;
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document);
const settled=page=>page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
(async()=>{
 const browser=await launchBrowser(),errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'}),page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  await fixture(page);const initial=await saved(page),workspace=page.locator('#sp-routing-workspace-v2');
  await page.locator('.sp-steps [data-view="editor"]').click();await page.locator('[data-category="audio"]').click();
  const family=page.locator('[data-library-model-family="stageboxes"]'),dialog=page.locator('#sp-model-dialog');
  for(const width of [1512,390]){
   await page.setViewportSize({width,height:width===390?844:982});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(await page.locator('#sp-library-open').isVisible())await page.locator('#sp-library-open').click();
   await family.click();assert.equal(await dialog.locator('[data-stagebox-image]').count(),10);
   for(const model of models)assert.equal(await dialog.locator('[data-dialog-model="'+model.type+'"] [data-stagebox-image]').count(),1);
   await dialog.locator('image').evaluateAll(images=>Promise.all(images.map(el=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error('Image failed: '+el.getAttribute('href')));img.src=el.getAttribute('href');}))));
   assert.equal(await dialog.locator('select').count(),0);await assertNoOverflow(page,'#sp-model-dialog','Stagebox models '+width);
   await page.screenshot({path:artifactPath('stagebox-picker-'+width+'-'+engine+'.png')});await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1512,height:982});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  if(await page.locator('#sp-library-open').isVisible())await page.locator('#sp-library-open').click();
  const created=[];
  for(const model of models){
   await family.click();await dialog.locator('[data-dialog-model="'+model.type+'"]').click();await page.keyboard.press('Enter');await settled(page);
   const doc=await saved(page),o=doc.objects.at(-1);assert.equal(o.type,model.type);assert.equal(o.comboJacks,model.comboJacks);created.push(o);
  }
  assert.deepEqual((await saved(page)).stage.routing.inputs.map(r=>[r.id,r.number,r.stagebox,r.stageboxPort]),initial.stage.routing.inputs.map(r=>[r.id,r.number,r.stagebox,r.stageboxPort]),'Adding hardware preserves every existing input patch');
  await page.locator('.sp-steps [data-view="routing"]').click();await workspace.locator('[data-rw-tab="stageboxes"]').click();
  for(const [i,model] of models.entries()){
   const o=created[i];await workspace.locator('[data-rw-select="'+o.id+'"]').click();const device=workspace.locator('[data-stagebox-model="'+model.type+'"]');await device.waitFor({state:'visible'});
   assert.equal(await device.locator('[data-rw-direction="inputs"]').count(),model.inputs);assert.equal(await device.locator('[data-rw-direction="outputs"]').count(),model.outputs);
   const targets=await device.locator('button').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height];}));assert(targets.every(([w,h])=>w>=43&&h>=43),'Every socket has at least a 44px tap target');
   await device.locator('[data-rw-direction="inputs"][data-rw-port="'+model.inputs+'"]').click();assert.match(await workspace.locator('.rw-selected-route h3').innerText(),new RegExp('Eingang '+String(model.inputs).padStart(2,'0')));
   await device.locator('[data-rw-direction="outputs"][data-rw-port="'+model.outputs+'"]').click();assert.match(await workspace.locator('.rw-selected-route h3').innerText(),new RegExp('Ausgang '+String(model.outputs).padStart(2,'0')));
   await page.screenshot({path:artifactPath('stagebox-'+model.name.toLowerCase()+'-'+engine+'.png')});
  }
  // Repatch an existing stereo source from its source card onto the new combo box.
  const sd=created.find(o=>o.type==='stagebox-behringer-sd16');
  await workspace.locator('[data-rw-tab="inputs"]').click();await workspace.locator('[data-rw-select="station-2"]').first().click();
  await workspace.locator('.rw-patch-card [data-rw-open]').first().click();
  await workspace.locator('[data-rw-picker-box="'+sd.id+'"]').click();
  const editor=workspace.locator('.rw-patch-card');assert.equal(await editor.locator('.rw-card-editor [data-stagebox-image="'+sd.type+'"]').count(),1);
  await editor.locator('[data-rw-patch="7"]').click();await settled(page);
  let doc=await saved(page);for(const [id,p] of [['route-key-l',7],['route-key-r',8]]){const row=doc.stage.routing.inputs.find(r=>r.id===id);assert.equal(row.stagebox,sd.id);assert.equal(row.stageboxPort,p);assert.equal(row.number,id==='route-key-l'?11:12);}
  await workspace.locator('[data-rw-tab="stageboxes"]').click();await workspace.locator('[data-rw-select="'+sd.id+'"]').click();
  assert.equal(await workspace.locator('.rw-stagebox-hardware [data-used="true"]').count(),2);
  // Disconnecting and attaching from the physical port keeps stereo together.
  await workspace.locator('.rw-stagebox-hardware [data-rw-direction="inputs"][data-rw-port="7"]').click();
  await workspace.locator('.rw-selected-route > [data-rw-unpatch]').click();await settled(page);
  await workspace.locator('.rw-stagebox-hardware [data-rw-direction="inputs"][data-rw-port="3"]').click();
  await workspace.locator('.rw-open-port [data-rw-rows="route-key-l|route-key-r"]').click();await settled(page);
  doc=await saved(page);assert.equal(doc.stage.routing.inputs.find(r=>r.id==='route-key-r').stageboxPort,4);
  // Monitoring uses the same physical output sockets and keeps bus numbers.
  await workspace.locator('[data-rw-tab="outputs"]').click();
  await workspace.locator('.rw-sidebar [data-rw-select]').filter({hasText:'Gesang'}).click();
  await workspace.locator('.rw-patch-card [data-rw-open]').first().click();
  await workspace.locator('[data-rw-picker-box="'+sd.id+'"]').click();
  await workspace.locator('.rw-patch-card .rw-card-editor [data-rw-patch="5"]').click();await settled(page);
  doc=await saved(page);for(const [id,port,number] of [['route-iem-l',5,1],['route-iem-r',6,2]]){const row=doc.stage.routing.outputs.find(r=>r.id===id);assert.equal(row.stagebox,sd.id);assert.equal(row.stageboxPort,port);assert.equal(row.number,number);}
  await workspace.locator('[data-rw-tab="stageboxes"]').click();await workspace.locator('[data-rw-select="'+sd.id+'"]').click();
  await workspace.locator('.rw-stagebox-hardware [data-rw-direction="outputs"][data-rw-port="5"]').click();
  await workspace.locator('.rw-selected-route > [data-rw-unpatch]').click();await settled(page);
  await workspace.locator('.rw-stagebox-hardware [data-rw-direction="outputs"][data-rw-port="1"]').click();
  await workspace.locator('.rw-open-port [data-rw-rows="route-iem-l|route-iem-r"]').click();await settled(page);
  assert.equal((await saved(page)).stage.routing.outputs.find(r=>r.id==='route-iem-r').stageboxPort,2);
  for(const width of [1512,390]){
   await page.setViewportSize({width,height:width===390?844:982});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await workspace.locator('[data-rw-box-layout="list"]').click();assert.equal(await workspace.locator('.rw-stagebox-section [data-rw-port]').count(),24);await workspace.locator('[data-rw-box-layout="grid"]').click();
   const last=workspace.locator('.rw-stagebox-hardware [data-rw-direction="inputs"][data-rw-port="16"]');await last.click();await assertNoOverflow(page,'#sp-routing-workspace-v2','Stagebox routing '+width);
   assert(await last.evaluate(el=>{const r=el.getBoundingClientRect(),parent=el.closest('.sp-stagebox-device-scroll').getBoundingClientRect();return r.left>=parent.left-1&&r.right<=parent.right+1;}),'Choosing a socket preserves its horizontal scroll position');
   await page.screenshot({path:artifactPath('stagebox-interactive-'+width+'-'+engine+'.png')});
  }
  const beforeReload=(await saved(page)).stage.routing;await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await settled(page);
  assert.deepEqual((await saved(page)).stage.routing.inputs,beforeReload.inputs,'Named stagebox patches survive local reload');
  assert.deepEqual((await saved(page)).stage.routing.outputs,beforeReload.outputs,'Stereo output patches survive local reload');
  assert.deepEqual(errors,[]);await context.close();console.log('PASS '+engine+': ten stagebox models, family picker, local model illustrations, physical port targets/counts, stereo repatch from both entry points, channel preservation, responsive list/device views and reload.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
