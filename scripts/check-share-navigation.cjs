const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
const base=(process.env.APP_URL||'http://127.0.0.1:8880/').split('#')[0];
const share=(name,type,version=1)=>base+'#share='+Buffer.from(JSON.stringify({kind:'stageplot-readonly',version,document:{stage:{title:name,w:8,d:6,stairs:'none',iem:'none',iemLength:0,iemDepth:0,iemX:0,iemY:0},objects:[{id:'shared-object',type,x:1,y:1,angle:45,label:name}]}})).toString('base64url');
(async()=>{
 const browser=await launchBrowser();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
  const ready=()=>page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.ready==='true');
  const shared=async name=>{
   await page.waitForFunction(name=>document.querySelector('#sp-prototype')?.dataset.readonly==='true'&&document.querySelector('#sp-project-heading')?.textContent===name,name);
   assert.equal(await page.locator('#sp-prototype').getAttribute('data-view'),'print');
   await page.locator('#sp-report-pages .sp-report-page').first().waitFor({state:'visible'});
  };
  const storage=()=>page.evaluate(()=>({drafts:localStorage.getItem('stageplot-studio:drafts:v1'),workspace:localStorage.getItem('stageplot-studio:workspace:v1')}));
  await page.goto(base);await ready();
  await page.locator('[data-project-add]').tap();await page.locator('#sp-np-band').fill('Lokaler Entwurf');await page.locator('#sp-np-create').tap();
  await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
  const local=await storage();
  // A normal hash change must leave the running editor alone.
  await page.evaluate(()=>window.shareQaSentinel=true);await page.goto(base+'#help');
  assert.equal(await page.evaluate(()=>window.shareQaSentinel),true);
  // Real same-document URL navigation: used to update the address bar only.
  const first=share('Geteilter Plan A','wash'),second=share('Geteilter Plan B','light-par',2);
  await page.goto(first);await shared('Geteilter Plan A');assert.deepEqual(await storage(),local);
  await page.goto(second);await shared('Geteilter Plan B');assert.deepEqual(await storage(),local);
  await page.screenshot({path:artifactPath('share-navigation-'+engine+'.png')});
  await page.goBack();await shared('Geteilter Plan A');
  // Leaving a shared view restores the user's own editable project.
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.readonly!=='true'&&document.querySelector('#sp-project-heading')?.textContent==='Lokaler Entwurf');
  assert.deepEqual(await storage(),local);
  // A form edit still waiting for autosave is flushed before the share reload.
  await page.locator('.sp-steps [data-view="project"]').click();await page.locator('#sp-project-name').fill('Noch bearbeiteter Entwurf');
  await page.goto(first);await shared('Geteilter Plan A');
  const updated=await storage();assert.equal(JSON.parse(updated.workspace).entry.document.stage.title,'Noch bearbeiteter Entwurf');
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#sp-project-heading')?.textContent==='Noch bearbeiteter Entwurf');
  assert.deepEqual(await storage(),updated);
  const fresh=await browser.newPage();await fresh.goto(second);await fresh.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.readonly==='true');await fresh.close();
  assert.deepEqual(errors,[]);console.log('PASS '+engine+': share links in an existing tab, switching links, Back, local draft recovery, pending form save and fresh-tab opening.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
