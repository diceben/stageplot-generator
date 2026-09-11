const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const engine=process.env.BROWSER||'chrome';
(async()=>{const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));try{
 const page=await browser.newPage({viewport:{width:390,height:670},isMobile:true,hasTouch:true});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8880/');await page.locator('#sp-upgrade-open').tap();await page.locator('.sp-project-add-card button').tap();await page.locator('#sp-np-create').tap();await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
 await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=d.entries.find(e=>e.id===d.lastId);
  const names=['Drums · Kick In','Drums · Kick Out','Drums · Snare Top','Drums · Snare Bottom','Drums · Hi-Hat','Drums · Tom 1','Drums · Tom 2','Drums · Floor Tom','Drums · OH L','Drums · OH R','Percussion · Conga','Percussion · Tumba','Bass DI','Gitarre L','Gitarre R','Keyboard L','Keyboard R','Playback L','Playback R','Gesang Lead','Gesang Backing L','Gesang Backing R'];
  entry.document.stage.routing={inputs:names.map((instrument,i)=>({id:'route-test-'+i,manual:true,instrument,number:0,signalType:'Mic',pickup:'Mic',connector:'XLR',microphone:i===0?'Shure Beta 52A':i===2?'Shure SM57':'',phantom:false})),outputs:[{id:'output-test',manual:true,instrument:'Monitor Gesang',number:1,signalType:'Line',pickup:'Direct',connector:'XLR'}]};
  entry.document.objects=[{id:'station-1',type:'stagebox-32',x:1,y:1,angle:0,label:'Stagebox Bühne'}];localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(d));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));
 });await page.reload();await page.locator('.sp-steps [data-view="routing"]').tap();
 await page.screenshot({path:'/private/tmp/routing-before-check-'+engine+'.png'});
 const metrics=await page.locator('.sp-routing-table-wrap').evaluate(el=>{const r=el.getBoundingClientRect();return {height:r.height,top:r.top,width:r.width};});console.log(engine,metrics);
 assert(metrics.height>=235,'Channel list receives useful height at 390×670');
 assert.equal(await page.locator('#sp-routing-rows tr:not([hidden])').count(),22);
 await page.locator('#sp-routing-tools-open').tap();assert(await page.locator('#sp-routing-tools').isVisible());await page.locator('#sp-audio-number').tap();assert(!(await page.locator('#sp-routing-tools').isVisible()));
 assert.match(await page.locator('[data-route-number]').first().innerText(),/1/);
 await page.locator('#sp-routing-tools-open').tap();await page.locator('#sp-audio-undo').tap();assert.match(await page.locator('[data-route-number]').first().innerText(),/—/);
 await page.locator('#sp-audio-search').fill('Snare');assert.equal(await page.locator('#sp-routing-rows tr:not([hidden])').count(),2);await page.locator('#sp-audio-search').blur();await page.locator('#sp-audio-search-clear').tap();await page.locator('#sp-audio-search').blur();
 await page.locator('#sp-routing-rows tr:not([hidden]) td:nth-child(3)').first().tap();assert(await page.locator('#sp-channel-dialog').isVisible());await page.keyboard.press('Escape');
 await page.locator('[data-audio-patch]').first().tap();assert(await page.locator('#sp-audio-connect-dialog').isVisible());await page.keyboard.press('Escape');
 await page.locator('#sp-output-tab').tap();assert.match(await page.locator('#sp-routing-rows').innerText(),/Monitor Gesang/);
 await page.locator('#sp-stagebox-tab').tap();assert(await page.locator('#sp-stagebox-view').isVisible());await page.screenshot({path:'/private/tmp/routing-stageboxes-'+engine+'.png'});
 await page.locator('#sp-input-tab').tap();
 for(const [width,height] of [[320,568],[390,670],[430,800],[740,390],[1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  assert(await page.locator('#sp-routing').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'No horizontal page overflow at '+width);
  if(width<=760){await page.locator('#sp-routing-tools-open').tap();assert(await page.locator('#sp-routing-tools').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.locator('#sp-routing-tools-close').tap();}
  else {assert(await page.locator('#sp-audio-number').isVisible());assert.equal(await page.locator('#sp-routing-tools-patch button').count(),0);await page.locator('#sp-audio-more').click();assert(await page.locator('#sp-routing-csv').isVisible());}
 }
 await page.setViewportSize({width:390,height:670});await page.locator('.sp-routing-table-wrap').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'/private/tmp/routing-mobile-'+engine+'.png'});
 await page.locator('#sp-routing-tools-open').tap();await page.screenshot({path:'/private/tmp/routing-actions-'+engine+'.png'});await page.locator('#sp-routing-tools-close').tap();
 assert.deepEqual(errors,[]);console.log('PASS '+engine+': compact 22-channel routing, number/undo, search/clear, signal/patch dialogs, outputs/stageboxes, 320–1440px, action sheet and desktop restoration.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
