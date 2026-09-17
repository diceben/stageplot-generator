const {engine,launchBrowser,artifactPath,assertNoOverflow}=require('./browser-qa.cjs');
const assert=require('node:assert/strict');

async function seed(page){
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8899/');
 await page.locator('#sp-upgrade-open').tap();await page.locator('.sp-project-add-card button').tap();await page.locator('#sp-np-create').tap();
 await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
 await page.evaluate(()=>{
  const library=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=library.entries.find(item=>item.id===library.lastId);
  const names=['Drums · Kick In','Drums · Kick Out','Drums · Snare Top','Drums · Snare Bottom','Drums · Hi-Hat','Drums · Tom 1','Drums · Tom 2','Drums · Floor Tom','Drums · OH L','Drums · OH R','Percussion · Conga','Percussion · Tumba','Bass DI','Gitarre L','Gitarre R','Keyboard L','Keyboard R','Playback L','Playback R','Gesang Lead','Gesang Backing L','Gesang Backing R'];
  entry.document.stage.routing={version:2,devices:[],disabledSources:[],inputs:names.map((instrument,i)=>({id:'route-mobile-'+i,manual:true,instrument,number:null,signalType:'Mic',pickup:'Mic',connector:'XLR',microphone:i===0?'Shure Beta 52A':i===2?'Shure SM57':'',phantom:false})),outputs:[{id:'route-mobile-output',manual:true,instrument:'Monitor Gesang',outputKind:'monitor',number:1,signalType:'Line',pickup:'Direct',connector:'XLR'}]};
  entry.document.objects=[{id:'station-1',type:'stagebox-32',x:1,y:1,angle:0,label:'Stagebox Bühne'}];
  localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(library));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));
 });
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').tap();
 await page.locator('#sp-routing-workspace-v2 [data-rw-tab="inputs"]').waitFor();
}

(async()=>{const browser=await launchBrowser();try{
 const page=await browser.newPage({viewport:{width:390,height:670},isMobile:true,hasTouch:true});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await seed(page);const workspace=page.locator('#sp-routing-workspace-v2'),search=workspace.locator('[data-rw-search]');
 assert.equal(await workspace.locator('.rw-source-list [data-rw-select]').count(),22,JSON.stringify(await workspace.locator('[data-rw-select] .rw-list-copy strong').allTextContents()));
 const listHeight=await workspace.locator('.rw-source-list').evaluate(el=>el.clientHeight);assert(listHeight>=100,'The mobile source list must show more than one entry.');
 await search.fill('Snare');assert.equal(await workspace.locator('.rw-source-list [data-rw-select]').count(),2);await search.fill('');await search.blur();
 await workspace.locator('.rw-source-list [data-rw-select="route-mobile-21"]').tap();assert.equal(await workspace.locator('.rw-source-list [data-rw-select="route-mobile-21"]').getAttribute('aria-pressed'),'true');assert.match(await workspace.locator('.rw-view-heading').innerText(),/Gesang Backing/);
 await workspace.locator('.rw-source-list [data-rw-select="route-mobile-0"]').tap();
 const number=workspace.locator('.rw-channel-card [data-rw-channel-field="number"]');await number.fill('33');await number.blur();assert.equal(await number.inputValue(),'33');
 await workspace.locator('[data-rw-tools]').tap();await workspace.locator('[data-rw-tool="undo"]').tap();assert.equal(await number.inputValue(),'','Undo restores the prior empty channel number.');
 await workspace.locator('[data-rw-tool="number"]').tap();assert.equal(await number.inputValue(),'1');await workspace.locator('[data-rw-tool="undo"]').tap();assert.equal(await number.inputValue(),'');
 await workspace.locator('[data-rw-tools]').tap();
 await workspace.locator('[data-rw-tab="outputs"]').tap();assert.match(await workspace.locator('.rw-view-heading').innerText(),/Monitor Gesang/);assert.equal(await workspace.locator('.rw-monitor-flow').count(),1);
 await workspace.locator('[data-rw-tab="stageboxes"]').tap();assert.match(await workspace.locator('.rw-view-heading').innerText(),/Stagebox Bühne/);assert.equal(await workspace.locator('[data-rw-port][data-rw-direction="inputs"]').count(),32);assert.equal(await workspace.locator('[data-rw-port][data-rw-direction="outputs"]').count(),16);
 await page.screenshot({path:artifactPath('routing-stageboxes-'+engine+'.png')});
 for(const [width,height] of [[320,568],[390,670],[430,800],[740,390],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const tab of ['inputs','outputs','stageboxes']){
   await workspace.locator('[data-rw-tab="'+tab+'"]').tap();
   await assertNoOverflow(page,'html','Document at '+width+'×'+height+' '+tab);await assertNoOverflow(page,'#sp-routing','Routing at '+width+'×'+height+' '+tab);
   assert.equal(await workspace.locator('[data-rw-tab="'+tab+'"]').getAttribute('aria-selected'),'true');
  }
  await workspace.locator('[data-rw-tools]').tap();assert(await workspace.locator('[data-rw-tool="number"]').isVisible());assert(await workspace.locator('[data-rw-tool="csvImport"]').isVisible());assert(await workspace.locator('[data-rw-tool="pdf"]').isVisible());
  await assertNoOverflow(page,'.rw-tools','Tools at '+width+'×'+height);await assertNoOverflow(page,'html','Document with tools at '+width+'×'+height);
  await workspace.locator('[data-rw-tool="undo"]').tap();await workspace.locator('[data-rw-tools]').tap();
  if(width===740)await page.screenshot({path:artifactPath('routing-landscape-'+engine+'.png')});
 }
 await page.setViewportSize({width:390,height:670});await workspace.locator('[data-rw-tab="inputs"]').tap();await workspace.locator('.rw-source-list [data-rw-select="route-mobile-0"]').tap();
 await page.screenshot({path:artifactPath('routing-mobile-'+engine+'.png')});await workspace.locator('[data-rw-tools]').tap();await page.screenshot({path:artifactPath('routing-actions-'+engine+'.png')});await workspace.locator('[data-rw-tools]').tap();
 assert.equal(await workspace.locator('select').count(),0,'All routing choices are inline buttons or fields.');assert.equal(await workspace.locator('.rw-error').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS '+engine+': 22-source mobile routing, search and list scrolling, inline edit/undo, channel numbering, all three tabs, accessible tools and no page overflow at 320–1440px.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
