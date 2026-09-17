const {engine,launchBrowser,artifactPath,assertNoOverflow}=require('./browser-qa.cjs');
const assert=require('node:assert/strict');
async function fixture(page){
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8899/');
 await page.locator('#sp-upgrade-open').click();await page.locator('.sp-project-add-card button').click();await page.locator('#sp-np-create').click();
 await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
 await page.evaluate(()=>{
  const d=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=d.entries.find(e=>e.id===d.lastId);
  const obj=(id,type,label,x,y)=>({id,type,label,x,y,angle:0,showLabel:true});
  entry.document.objects=[obj('station-1','acoustic','Akustikgitarre',5,3),obj('station-2','keys-stage4','Keyboard',1.5,3),{...obj('station-3','rack','IEM Gesang',6.5,1),iem:{name:'Gesang',mode:'stereo',transport:'wireless',frequencyBand:'470–526 MHz'}},obj('station-4','wedge','Monitor Gitarre',4,4),obj('station-5','stagebox-16','Stagebox A',6,2),obj('station-6','drums','Drums',3,1)];
  const row=(id,key,instrument,number,extra={})=>({id,sourceKey:key,instrument,generatedInstrument:instrument,number,edited:true,mode:'Mono',signalType:'Line',connector:'XLR',pickup:'DI',phantom:false,microphone:'',stagebox:'station-5',stageboxPort:number,manual:false,...extra});
  entry.document.stage.routing={version:2,disabledSources:[],devices:[{id:'di-prod2-demo',modelId:'radial-prod2',name:'Radial ProD2',channels:2,active:false,power:'none'}],inputs:[row('route-acoustic','station-1:main','Akustik · DI',9,{diDeviceId:'di-prod2-demo',diChannel:1,sourceConnector:'Klinke'}),row('route-acoustic-mic','station-1:pickup-demo','Akustik · Mic',10,{manual:true,origin:'pickup',pickup:'Mic',microphone:'Neumann KM 184',phantom:true,signalType:'Mic'}),row('route-key-l','station-2:out-1','Keyboard L',11,{pickup:'Direct',stereoGroup:'station-2:stereo-out-1',mode:'Stereo L'}),row('route-key-r','station-2:out-2','Keyboard R',12,{pickup:'Direct',stereoGroup:'station-2:stereo-out-1',mode:'Stereo R'})],outputs:[row('route-iem-l','station-3:iem-l','IEM · Gesang L',1,{pickup:'Direct',outputKind:'iem',stereoGroup:'station-3:iem',iemGroup:'station-3:iem',mode:'Stereo L',iemName:'Gesang',iemMode:'stereo',iemTransport:'wireless',frequencyBand:'470–526 MHz',monitorDeviceName:'IEM Sender',monitorReceiverName:'Gesang'}),row('route-iem-r','station-3:iem-r','IEM · Gesang R',2,{pickup:'Direct',outputKind:'iem',stereoGroup:'station-3:iem',iemGroup:'station-3:iem',mode:'Stereo R',iemName:'Gesang',iemMode:'stereo',iemTransport:'wireless',frequencyBand:'470–526 MHz',monitorDeviceName:'IEM Sender',monitorReceiverName:'Gesang'})]};
  entry.document.stage.cables=[];localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(d));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));
 });
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();
}
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document);}
async function change(locator,value){await locator.fill(String(value));await locator.press('Tab');}
async function run(){const browser=await launchBrowser();try{
 const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'}),page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
 const workspace=page.locator('#sp-routing-workspace-v2');
 assert.equal(await workspace.locator('select').count(),0);assert.equal(await workspace.locator('.rw-source-card').count(),1);assert.equal(await workspace.locator('.rw-pickup-card').count(),2);
 assert.equal(await workspace.locator('[data-rw-di-channel="2"]').first().innerText(),'2\nFrei');
 assert.equal(await workspace.locator('[data-object-visual][data-routing-selected="true"]').count(),1);
 for(const theme of ['light','dark']){
  await page.locator('#sp-settings-gear').click();await page.locator('[data-theme-choice="'+theme+'"]').click();await page.locator('#sp-settings-close').click();
  for(const tab of ['inputs','outputs','stageboxes']){await workspace.locator('[data-rw-tab="'+tab+'"]').click();await page.screenshot({path:artifactPath('routing-v2-'+theme+'-'+tab+'-'+engine+'.png')});assert.equal(await workspace.locator('select').count(),0);}
 }
 await workspace.locator('[data-rw-tab="inputs"]').click();
 await workspace.locator('[data-rw-add-pickup]').click();assert.equal(await workspace.locator('.rw-pickup-card').count(),3);assert.equal(await workspace.locator('.rw-source-card').count(),1);
 const newId=await workspace.locator('.rw-pickup-card').last().getAttribute('data-rw-row-card');
 await workspace.locator('.rw-pickup-card').last().locator('[data-rw-open]').first().click();await change(workspace.locator('[data-rw-channel-field="microphone"][data-rw-row="'+newId+'"]'),'Eigenes Testmikrofon');
 assert.equal((await saved(page)).stage.routing.inputs.find(row=>row.id===newId).microphone,'Eigenes Testmikrofon');
 await workspace.locator('[data-rw-pickup="DI"][data-rw-row="'+newId+'"]').click();
 assert(await workspace.locator('[data-rw-di-device="di-prod2-demo"][data-rw-di-channel="1"][data-rw-row="'+newId+'"]').isDisabled());
 await workspace.locator('[data-rw-di-device="di-prod2-demo"][data-rw-di-channel="2"][data-rw-row="'+newId+'"]').click();
 let doc=await saved(page);assert.equal(doc.stage.routing.devices.length,1);assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).diChannel,2);assert.equal(doc.stage.routing.inputs.find(row=>row.id==='route-acoustic').diChannel,1);
 await workspace.locator('[data-rw-open="pickup-'+newId+'"]').first().click();
 await change(workspace.locator('[data-rw-channel-field="number"][data-rw-row="'+newId+'"]'),21);
 await workspace.locator('[data-rw-open="patch-inputs-'+newId+'"]').first().click();
 await workspace.locator('[data-rw-patch="3"][data-rw-direction="inputs"]').click();
 doc=await saved(page);assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).stageboxPort,3);
 await workspace.locator('[data-rw-select="station-2"]').first().click();await workspace.locator('[data-rw-open="patch-inputs-route-key-r"]').first().click();
 await workspace.locator('[data-rw-patch="5"]').click();doc=await saved(page);assert.deepEqual(doc.stage.routing.inputs.filter(row=>row.id==='route-key-l'||row.id==='route-key-r').map(row=>row.stageboxPort),[5,6]);
 await workspace.locator('[data-rw-tab="outputs"]').click();
 await change(workspace.locator('[data-rw-monitor-field="name"]'),'Lead Vocals');
 await change(workspace.locator('[data-rw-monitor-field="monitorDeviceName"]'),'PSM Test');
 await change(workspace.locator('[data-rw-monitor-field="monitorReceiverName"]'),'Lead');
 await workspace.locator('[data-rw-monitor-value="iemTransport"][data-rw-value="cable"]').click();
 await workspace.locator('[data-rw-monitor-format="mono"]').click();await workspace.locator('[data-rw-monitor-format="stereo"]').click();
 doc=await saved(page);const iem=doc.stage.routing.outputs.filter(row=>row.sourceKey.startsWith('station-3:'));assert.equal(iem.length,2);assert(iem.every(row=>row.monitorDeviceName==='PSM Test'&&row.monitorReceiverName==='Lead'&&row.iemTransport==='cable'&&!row.frequencyBand));
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();doc=await saved(page);assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).number,21);assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).diChannel,2);
 await workspace.locator('[data-rw-tab="stageboxes"]').click();assert.match(await workspace.locator('[data-rw-port="3"][data-rw-direction="inputs"]').innerText(),/Akustik/);
 await workspace.locator('[data-rw-port="3"][data-rw-direction="inputs"]').click();assert.equal(await workspace.locator('.rw-source-card').count(),1);
 const downloadPromise=page.waitForEvent('download');await workspace.locator('[data-rw-export="all"]').click();const download=await downloadPromise;const fs=require('node:fs'),csv=fs.readFileSync(await download.path(),'utf8');assert(csv.includes('Radial ProD2'));assert(csv.includes('PSM Test'));assert(csv.includes('DI-Eingang'));
 const storedBefore=await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1'));
 const shareDoc=await page.evaluate(document=>window.StageplotShare.clean(document),doc),shareHash=Buffer.from(JSON.stringify({kind:'stageplot-readonly',version:1,document:shareDoc})).toString('base64url');
 const readonlyPage=await page.context().newPage();readonlyPage.on('pageerror',e=>errors.push(e.message));await readonlyPage.goto((process.env.APP_URL||'http://127.0.0.1:8899/')+'#share='+shareHash);await readonlyPage.locator('.sp-steps [data-view="routing"]').click();
 const readonlyWorkspace=readonlyPage.locator('#sp-routing-workspace-v2');assert.equal(await readonlyWorkspace.getAttribute('data-readonly'),'true');assert.equal(await readonlyWorkspace.locator('[data-rw-add-pickup]').count(),0);assert(await readonlyWorkspace.locator('input:not([type="search"])').evaluateAll(fields=>fields.every(field=>field.readOnly)));await readonlyPage.close();assert.equal(await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1')),storedBefore);
 assert.deepEqual(errors,[]);console.log('PASS '+engine+': three light/dark routing views, inline editing, shared stereo DI occupancy, atomic stereo patching, monitor format/metadata, reload and CSV export.');
}finally{await browser.close();}}
if(require.main===module)run().catch(error=>{console.error(error);process.exit(1);});
module.exports={fixture};
