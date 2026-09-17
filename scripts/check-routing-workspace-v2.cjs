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
async function checkDiPickerLayout(page,workspace,theme,width){
 await page.setViewportSize({width,height:width===390?844:982});
 const opener=workspace.locator('.rw-card-value[data-rw-di-open="route-acoustic"]');await opener.click();
 const dialog=workspace.locator('[data-rw-di-dialog]');await dialog.waitFor({state:'visible'});
 assert.equal(await page.getByRole('dialog',{name:'DI-Box wählen'}).count(),1);assert(await dialog.evaluate(el=>el.matches(':modal')));
 assert.equal(await dialog.locator('[data-rw-create-di]').count(),7);assert.equal(await dialog.locator('[data-rw-create-di="custom"],select,[role="tablist"]').count(),0);
 assert.doesNotMatch(await dialog.innerText(),/Eigene DI|Vorhandene DI|Modelle/);
 await page.waitForFunction(()=>{const images=[...document.querySelectorAll('[data-rw-di-dialog] img')];return images.length===7&&images.every(image=>image.complete&&image.naturalWidth>0);});
 await dialog.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 await assertNoOverflow(page,'[data-rw-di-dialog]','DI-Auswahl '+width+' '+theme);
 const geometry=await dialog.evaluate(el=>{const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return {dialog:rect(el),tiles:[...el.querySelectorAll('[data-rw-create-di]')].map(rect),pictures:[...el.querySelectorAll('.rw-di-picker-art')].map(rect)};});
 assert(geometry.dialog.left>=0&&geometry.dialog.right<=width+1,'The popup fits the viewport');
 assert(geometry.dialog.top>=0&&geometry.dialog.bottom<=(width===390?844:982)+1,'The popup remains reachable vertically');
 for(const key of ['tiles','pictures'])for(const rect of geometry[key]){
  assert(Math.abs(rect.width-geometry[key][0].width)<=1,key+' have equal widths');assert(Math.abs(rect.height-geometry[key][0].height)<=1,key+' have equal heights');
 }
 await page.mouse.move(1,1);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.screenshot({path:artifactPath('routing-di-popup-'+theme+'-'+width+'-'+engine+'.png')});
 await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert(await opener.evaluate(el=>el===document.activeElement),'Escape returns focus to the DI card');
}
async function checkDiPickerInteraction(page,workspace){
 const opener=workspace.locator('.rw-card-value[data-rw-di-open="route-acoustic"]'),dialog=workspace.locator('[data-rw-di-dialog]');
 const before=(await saved(page)).stage.routing;await opener.click();
 await dialog.locator('[data-rw-create-di="radial-prod2"]').click();await dialog.waitFor({state:'detached'});
 assert.deepEqual((await saved(page)).stage.routing,before,'Choosing the assigned model does not create another DI or change routing');
 await opener.click();
 for(const key of ['Tab','Shift+Tab'])for(let i=0;i<10;i++){await page.keyboard.press(key);assert(await dialog.evaluate(el=>el.contains(document.activeElement)),key+' stays within the modal');}
 await workspace.locator('[data-rw-tab="outputs"]').evaluate(el=>el.focus());assert(await dialog.evaluate(el=>el.contains(document.activeElement)),'Background controls cannot take focus');
 await page.mouse.click(4,4);await dialog.waitFor({state:'detached'});assert.equal(await workspace.getAttribute('data-tab'),'inputs');assert(await opener.evaluate(el=>el===document.activeElement),'Backdrop dismissal returns focus to the DI card');
 await opener.click();await dialog.getByRole('button',{name:'DI-Auswahl schließen'}).click();await dialog.waitFor({state:'detached'});
 assert.deepEqual((await saved(page)).stage.routing,before,'Dismissing the picker leaves saved routing unchanged');
}
async function checkInlinePickup(page,workspace){
 const routingData=async()=>{const {generatedAt,...routing}=(await saved(page)).stage.routing;return routing;};
 await page.locator('#sp-settings-gear').click();await page.locator('[data-theme-choice="light"]').click();await page.locator('#sp-settings-close').click();
 await workspace.locator('[data-rw-select="station-2"]').first().click();
 const card=workspace.locator('[data-rw-row-card="route-key-l"]'),before=await routingData();
 assert.equal(await card.locator('[data-rw-pickup]').count(),4);assert.equal(await card.locator('[data-rw-open],input,select').count(),0,'A direct output is edited without opening another panel');
 for(const value of ['Mic','DI','Direct','Digital'])assert(await card.locator('[data-rw-pickup="'+value+'"]').isVisible(),'Acquisition types are directly visible');
 for(const value of ['XLR','Klinke'])assert(await card.locator('[data-rw-connector="'+value+'"]').isVisible(),'Connectors are directly visible');
 const sourceFigure=await workspace.locator('.rw-source-card .rw-art > svg').innerHTML();
 assert.equal(await workspace.locator('.rw-source-flow svg').evaluateAll((figures,source)=>figures.filter(figure=>figure.innerHTML===source).length,sourceFigure),1,'The instrument is pictured once in the signal flow');
 assert.equal(await card.locator('img,svg,image').count(),0,'A direct output does not repeat the instrument picture');
 await card.locator('[data-rw-connector="Klinke"]').click();
 const withJack=await routingData(),jackRow=withJack.inputs.find(row=>row.id==='route-key-l');
 assert.equal(jackRow.connector,'Klinke');assert.equal(jackRow.stagebox,'');assert.equal(jackRow.stageboxPort,null);assert.equal(jackRow.number,11);
 // The first edit also normalizes the seeded fixture before it is persisted.
 const originalConnection=before.inputs.find(row=>row.id==='route-key-l'),restored=structuredClone(withJack);
 Object.assign(restored.inputs.find(row=>row.id==='route-key-l'),{connector:originalConnection.connector,stagebox:originalConnection.stagebox,stageboxPort:originalConnection.stageboxPort});
 await card.locator('[data-rw-pickup="Direct"]').click();await card.locator('[data-rw-connector="Klinke"]').click();
 assert.deepEqual(await routingData(),withJack,'Clicking the current type or connector preserves the saved jack connection');
 for(const width of [1512,390]){
  await page.setViewportSize({width,height:width===390?844:982});await card.scrollIntoViewIfNeeded();
  await assertNoOverflow(page,'[data-rw-row-card="route-key-l"]','Inline direct-output controls '+width);
  for(const button of ['[data-rw-pickup="Direct"]','[data-rw-connector="Klinke"]'])assert(await card.locator(button).isVisible());
  await page.mouse.move(1,1);await page.screenshot({path:artifactPath('routing-direct-inline-light-'+width+'-'+engine+'.png')});
 }
 await page.setViewportSize({width:1512,height:982});await card.locator('[data-rw-connector="XLR"]').click();
 assert.equal((await saved(page)).stage.routing.inputs.find(row=>row.id==='route-key-l').connector,'XLR');
 if(await workspace.locator('[data-rw-tools]').getAttribute('aria-expanded')!=='true')await workspace.locator('[data-rw-tools]').click();
 await workspace.locator('[data-rw-tool="undo"]').click();assert.deepEqual(await routingData(),withJack,'One undo restores the previous connector');
 await workspace.locator('[data-rw-tool="undo"]').click();assert.deepEqual(await routingData(),restored,'The prior undo restores the connector and its stagebox connection together');
 await workspace.locator('[data-rw-tools]').click();await workspace.locator('[data-rw-select="station-1"]').first().click();
}
async function run(){const browser=await launchBrowser();try{
 const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'}),page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
 const workspace=page.locator('#sp-routing-workspace-v2');
 assert.equal(await workspace.locator('select').count(),0);assert.equal(await workspace.locator('.rw-source-card').count(),1);assert.equal(await workspace.locator('.rw-pickup-card').count(),2);
 assert.equal(await workspace.locator('[data-rw-di-channel="2"]').first().innerText(),'2\nFrei');
 assert.equal(await workspace.locator('[data-object-visual][data-routing-selected="true"]').count(),1);
 for(const theme of ['light','dark']){
  await page.locator('#sp-settings-gear').click();await page.locator('[data-theme-choice="'+theme+'"]').click();await page.locator('#sp-settings-close').click();
  await workspace.locator('[data-rw-tab="inputs"]').click();for(const width of [1512,390])await checkDiPickerLayout(page,workspace,theme,width);await page.setViewportSize({width:1512,height:982});
  for(const tab of ['inputs','outputs','stageboxes']){await workspace.locator('[data-rw-tab="'+tab+'"]').click();await page.screenshot({path:artifactPath('routing-v2-'+theme+'-'+tab+'-'+engine+'.png')});assert.equal(await workspace.locator('select').count(),0);}
 }
 await workspace.locator('[data-rw-tab="inputs"]').click();
 await checkDiPickerInteraction(page,workspace);
 await checkInlinePickup(page,workspace);
 await workspace.locator('[data-rw-add-pickup]').click();assert.equal(await workspace.locator('.rw-pickup-card').count(),3);assert.equal(await workspace.locator('.rw-source-card').count(),1);
 const newId=await workspace.locator('.rw-pickup-card').last().getAttribute('data-rw-row-card');
 await workspace.locator('.rw-pickup-card').last().locator('[data-rw-open]').first().click();await change(workspace.locator('[data-rw-channel-field="microphone"][data-rw-row="'+newId+'"]'),'Eigenes Testmikrofon');
 assert.equal((await saved(page)).stage.routing.inputs.find(row=>row.id===newId).microphone,'Eigenes Testmikrofon');
 await workspace.locator('[data-rw-pickup="DI"][data-rw-row="'+newId+'"]').click();
 await workspace.locator('[data-rw-open="pickup-'+newId+'"]').first().click();
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
 await workspace.locator('[data-rw-tab="inputs"]').click();await workspace.locator('[data-rw-select="station-1"]').first().click();
 await workspace.locator('.rw-card-value[data-rw-di-open="route-acoustic"]').click();await workspace.locator('[data-rw-di-dialog] [data-rw-create-di="generic-active-stereo"]').click();
 assert.equal(await workspace.locator('[data-rw-di-dialog]').count(),0,'Selecting a DI immediately closes the picker');
 doc=await saved(page);const genericRow=doc.stage.routing.inputs.find(row=>row.id==='route-acoustic'),genericDevice=doc.stage.routing.devices.find(device=>device.id===genericRow.diDeviceId);
 assert.equal(genericDevice.modelId,'generic-active-stereo');assert.equal(genericDevice.channels,2);assert.equal(genericRow.diChannel,1);assert.equal(genericRow.number,9);assert.equal(genericRow.stageboxPort,9);
 assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).diDeviceId,'di-prod2-demo','Changing one acquisition leaves the other source on its shared physical DI');
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();doc=await saved(page);
 assert.equal(doc.stage.routing.inputs.find(row=>row.id==='route-acoustic').diDeviceId,genericDevice.id);assert.equal(doc.stage.routing.devices.find(device=>device.id===genericDevice.id).modelId,'generic-active-stereo');
 await workspace.locator('.rw-card-value[data-rw-di-open="route-acoustic"]').click();assert.equal(await workspace.locator('[data-rw-di-dialog] [data-rw-create-di="generic-active-stereo"]').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');
 const storedBefore=await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1'));
 const shareDoc=await page.evaluate(document=>window.StageplotShare.clean(document),doc),shareHash=Buffer.from(JSON.stringify({kind:'stageplot-readonly',version:1,document:shareDoc})).toString('base64url');
 const readonlyPage=await page.context().newPage();readonlyPage.on('pageerror',e=>errors.push(e.message));await readonlyPage.goto((process.env.APP_URL||'http://127.0.0.1:8899/')+'#share='+shareHash);await readonlyPage.locator('.sp-steps [data-view="routing"]').click();
 const readonlyWorkspace=readonlyPage.locator('#sp-routing-workspace-v2');assert.equal(await readonlyWorkspace.getAttribute('data-readonly'),'true');assert.equal(await readonlyWorkspace.locator('[data-rw-add-pickup]').count(),0);assert(await readonlyWorkspace.locator('input:not([type="search"])').evaluateAll(fields=>fields.every(field=>field.readOnly)));await readonlyPage.close();assert.equal(await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1')),storedBefore);
 assert.deepEqual(errors,[]);console.log('PASS '+engine+': light/dark routing views, responsive seven-model DI popup, loaded photos and equal tiles, modal keyboard/dismissal, persisted model selection, direct inline acquisition and connectors, single instrument figure, connector undo, shared stereo DI occupancy, atomic stereo patching, monitor format/metadata, reload and CSV export.');
}finally{await browser.close();}}
if(require.main===module)run().catch(error=>{console.error(error);process.exit(1);});
module.exports={fixture};
