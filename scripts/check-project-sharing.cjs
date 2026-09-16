const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath,assertNoOverflow}=require('./browser-qa.cjs');
const base=(process.env.APP_URL||'http://127.0.0.1:8884/').split('#')[0],host='https://stageplot-qa.supabase.co';
(async()=>{
 const browser=await launchBrowser(),stored=new Map(),calls=[],errors=[];let signedIn=true,failRead=false;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.route('**/stageplot-cloud-config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.StageplotCloudConfig='+JSON.stringify({url:host,publishableKey:'sb_publishable_test'})}));
  await context.route('**/stageplot-assets/vendor/supabase.js',route=>route.fulfill({contentType:'text/javascript',body:'window.StageplotSupabase={createClient:()=>({auth:{onAuthStateChange:()=>{},getSession:async()=>({data:{session:'+(signedIn?JSON.stringify({user:{id:'test-owner',email:'qa@example.invalid'},access_token:'test-access-token'}):'null')+'}})}})};'}));
  await context.route(base,async route=>{const response=await route.fetch();const headers={...response.headers()};if(headers['content-security-policy'])headers['content-security-policy']=headers['content-security-policy'].replace("connect-src 'self'","connect-src 'self' "+host);await route.fulfill({response,headers});});
  await context.route(host+'/rest/v1/rpc/**',async route=>{
   const request=route.request(),action=request.url().split('stageplot_share_')[1],body=request.postDataJSON(),id=body.p_project_id;calls.push({action,body,headers:request.headers()});
   if(action==='get'&&failRead){await route.abort('internetdisconnected');return;}
   if(action!=='get')assert.equal(request.headers().authorization,'Bearer test-access-token');
   else assert.equal(request.headers().authorization,undefined);
   if(action==='publish'){assert.ok(!JSON.stringify(body).includes('PRIVATE'));stored.set(id,{project_id:id,document:body.p_document,updated_at:new Date().toISOString()});}
   if(action==='revoke')stored.delete(id);
   const result=action==='get'?(stored.get(id)||null):{active:stored.has(id),updated_at:stored.get(id)?.updated_at||null};
   await route.fulfill({contentType:'application/json',body:JSON.stringify(result),headers:{'access-control-allow-origin':'*'}});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
  const ready=()=>page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.ready==='true');
  const local=()=>page.evaluate(()=>({drafts:localStorage.getItem('stageplot-studio:drafts:v1'),workspace:localStorage.getItem('stageplot-studio:workspace:v1')}));
  const dashboard=async()=>{await page.locator('.sp-steps [data-view="dashboard"]').click();};
  await page.goto(base);await ready();
  await page.locator('[data-project-add]').tap();await page.locator('#sp-np-band').fill('Lokaler Testplan');await page.locator('#sp-np-create').tap();
  await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
  // Seed only artificial contact data and a complex instrument into the actual saved draft.
  await page.evaluate(()=>{
   const key='stageplot-studio:drafts:v1',drafts=JSON.parse(localStorage.getItem(key)),workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1'));
   for(const entry of [...drafts.entries,workspace.entry]){const d=entry.document;d.stage.project.author='PRIVATE';d.stage.project.notes='PRIVATE';d.stage.project.contacts.foh={name:'PRIVATE',contact:'PRIVATE'};d.objects=[{id:'qa-drum',type:'drums',x:2,y:2,angle:0,label:'Schlagzeug',note:'PRIVATE'}];}
   localStorage.setItem(key,JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));
  });
  await page.reload();await ready();await dashboard();await page.locator('[data-project-share]').first().click();
  await page.waitForFunction(()=>document.querySelector('#sp-share-status').textContent.includes('Noch nicht freigegeben'));
  const id=await page.locator('#sp-share-id').inputValue();assert.ok(id.startsWith('SP-'));assert.equal(calls.filter(c=>c.action==='publish').length,0);assert.equal(await page.locator('#sp-share-result').isVisible(),false);
  await page.locator('#sp-share-publish').tap();await page.waitForFunction(()=>document.querySelector('#sp-share-status').textContent.startsWith('Freigegeben.'));
  assert.equal(stored.get(id).document.objects[0].type,'drums');const originalObjects=JSON.stringify(stored.get(id).document.objects);
  assert.equal(await page.locator('#sp-share-link').inputValue(),base+'#p/'+id);await assertNoOverflow(page,'#sp-share-dialog','Share dialog mobile');
  await page.screenshot({path:artifactPath('project-sharing-'+engine+'.png')});await page.locator('#sp-share-close').tap();const before=await local();
  await page.locator('#sp-shared-open').tap();await page.locator('#sp-shared-id').fill(id.toLowerCase());await page.locator('#sp-shared-form button').tap();
  await page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.readonly==='true'&&document.querySelector('#sp-prototype')?.dataset.view==='print');
  assert.equal(await page.locator('#sp-project-heading').textContent(),'Lokaler Testplan');assert.deepEqual(await local(),before);assert.ok(!await page.locator('#sp-report-pages').textContent().then(text=>text.includes('PRIVATE')));
  await page.locator('#sp-shared-return').tap();await ready();await page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.readonly!=='true');assert.deepEqual(await local(),before);
  // Existing tab, missing ID, failed network and retry all keep the local workspace intact.
  await page.goto(base+'#p/SP-NOT-FOUND');await page.waitForFunction(()=>document.querySelector('#sp-shared-load-status').textContent.includes('nicht freigegeben'));assert.deepEqual(await local(),before);
  failRead=true;await page.goto(base+'#p/'+id);await page.waitForFunction(()=>document.querySelector('#sp-shared-load-status').textContent.includes('Verbindung'));failRead=false;await page.locator('#sp-shared-retry').tap();await page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.view==='print');assert.deepEqual(await local(),before);
  await page.locator('#sp-shared-return').tap();await ready();await page.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.readonly!=='true');await dashboard();
  await page.locator('[data-project-share]').first().click();await page.locator('#sp-share-revoke').waitFor({state:'visible'});await page.locator('#sp-share-revoke').tap();await page.locator('#sp-setup-confirm-accept').tap();await page.waitForFunction(()=>document.querySelector('#sp-share-status').textContent.startsWith('Freigabe widerrufen'));
  assert.equal(stored.has(id),false);assert.equal(await page.locator('#sp-share-result').isVisible(),false);
  await page.locator('#sp-share-publish').tap();await page.waitForFunction(()=>document.querySelector('#sp-share-status').textContent.startsWith('Freigegeben.'));assert.equal(JSON.stringify(stored.get(id).document.objects),originalObjects);
  await page.locator('#sp-share-close').tap();signedIn=false;await page.reload();await ready();await page.locator('[data-project-share]').first().click();await page.locator('#sp-share-login').waitFor({state:'visible'});assert.equal(await page.locator('#sp-share-publish').isVisible(),false);
  // Readers do not load an account client or create sessions.
  const reader=await context.newPage();let authLoads=0;reader.on('request',request=>{if(request.url().includes('vendor/supabase.js'))authLoads++;});
  await reader.goto(base+'#p/'+id);await reader.waitForFunction(()=>document.querySelector('#sp-prototype')?.dataset.view==='print');assert.equal(authLoads,0);await reader.close();
  assert.deepEqual(errors,[]);console.log('PASS '+engine+': explicit publication, ID opening, sanitized snapshots, revocation, republishing, anonymous readers, network retry and unchanged local drafts.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
