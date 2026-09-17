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
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
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
  await page.setViewportSize({width,height:width===390?844:982});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await card.scrollIntoViewIfNeeded();
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
async function wave2Fixture(page,occupied){
 await fixture(page);
 await page.evaluate(occupied=>{
  const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),entry=workspace.entry,doc=entry.document;
  doc.objects=doc.objects.filter(object=>['station-1','station-2','station-5'].includes(object.id));
  const wave=doc.objects.find(object=>object.id==='station-2');Object.assign(wave,{type:'keys-wave2',label:'Wave 2',io:{inputs:{count:0,connector:'Klinke'},outputs:{count:1,connector:'Klinke'},stereoPairs:[],aliases:{inputs:[],outputs:[]}}});
  const left=doc.stage.routing.inputs.find(row=>row.id==='route-key-l'),guitar=doc.stage.routing.inputs.find(row=>row.id==='route-acoustic');
  Object.assign(left,{instrument:'Wave 2',generatedInstrument:'Wave 2',mode:'Mono',stereoGroup:'',pickup:'DI',diDeviceId:'di-prod2-demo',diChannel:1,sourceConnector:'Klinke',microphone:'Radial ProD2',notes:'Wave 2: Hauptausgang'});
  Object.assign(guitar,{pickup:occupied?'DI':'Direct',connector:occupied?'XLR':'Klinke',diDeviceId:occupied?'di-prod2-demo':'',diChannel:occupied?2:null,stagebox:occupied?'station-5':'',stageboxPort:occupied?9:null,notes:'Gitarrenweg behalten'});
  doc.stage.routing.inputs=[guitar,left];doc.stage.routing.outputs=[];doc.stage.routing.disabledSources=['station-2:out-2'];doc.stage.cables=[];
  const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1'));drafts.entries=drafts.entries.map(item=>item.id===entry.id?entry:item);
  localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));
 },occupied);
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await page.locator('[data-rw-select="station-2"]').first().click();
 await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
}
async function checkWave2Stereo(browser,errors){
 const waveRows=doc=>doc.stage.routing.inputs.filter(row=>row.sourceKey.startsWith('station-2:')).sort((a,b)=>a.sourceKey.localeCompare(b.sourceKey));
 const state=doc=>{const {generatedAt,...routing}=doc.stage.routing;return {io:doc.objects.find(object=>object.id==='station-2').io,routing};};
 const checkConnected=(doc,original)=>{
  const rows=waveRows(doc);assert.deepEqual(rows.map(row=>row.sourceKey),['station-2:out-1','station-2:out-2'],'Both native outputs are used exactly once');
  assert.deepEqual(rows.map(row=>row.diDeviceId),['di-prod2-demo','di-prod2-demo']);assert.deepEqual(rows.map(row=>row.diChannel),[1,2]);
  assert.deepEqual(rows.map(row=>row.mode),['Stereo L','Stereo R']);assert(rows[0].stereoGroup);assert.equal(rows[0].stereoGroup,rows[1].stereoGroup);
  assert.equal(rows[0].number,original.number);assert.equal(rows[0].stagebox,original.stagebox);assert.equal(rows[0].stageboxPort,original.stageboxPort);assert.equal(rows[0].notes,original.notes);
  assert.equal(doc.stage.routing.devices.length,1,'Stereo uses the existing physical DI');assert(!doc.stage.routing.disabledSources.includes('station-2:out-2'));
  const io=doc.objects.find(object=>object.id==='station-2').io;assert.equal(io.outputs.count,2);assert(io.stereoPairs.includes(1));
 };
 for(const occupied of [false,true]){
  const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'});
  try{
   const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));await wave2Fixture(page,occupied);
   const workspace=page.locator('#sp-routing-workspace-v2'),card=workspace.locator('[data-rw-row-card="route-key-l"]');
   assert.equal(await workspace.locator('.rw-pickup-card').count(),1);
   await workspace.locator('[data-rw-source-outputs="station-2"]').click();assert.equal(await workspace.locator('[data-rw-source-output-count="station-2"]').inputValue(),'1','The output controls are available for an existing mono draft');await workspace.locator('[data-rw-source-outputs="station-2"]').click();
   if(!occupied){
    await card.locator('[data-rw-di-device="di-prod2-demo"][data-rw-di-channel="2"]').click();
    const single=await saved(page);assert.equal(waveRows(single).length,1);assert.equal(waveRows(single)[0].diChannel,2);assert.equal(waveRows(single)[0].mode,'Mono','Either individual DI input can serve a mono source');
   }
   await card.locator('[data-rw-di-device="di-prod2-demo"][data-rw-di-channel="1"]').click();
   const before=await saved(page);assert.equal(waveRows(before).length,1,'Assigning one DI input does not enable the second output');assert.equal(waveRows(before)[0].mode,'Mono');assert.equal(before.objects.find(object=>object.id==='station-2').io.outputs.count,1);
   const connect=card.locator('[data-rw-di-stereo="route-key-l"][data-rw-di-stereo-device="di-prod2-demo"]');assert.equal(await connect.innerText(),'L + R anschließen');await connect.click();
   if(occupied){
    await workspace.locator('.rw-error').waitFor({state:'visible'});assert.match(await workspace.locator('.rw-error').innerText(),/belegt/i);
    assert.deepEqual(state(await saved(page)),state(before),'A busy second DI input leaves both sources, their notes and patching intact');
    assert.equal(await workspace.locator('.rw-pickup-card').count(),1);continue;
   }
   let connected=await saved(page);checkConnected(connected,waveRows(before)[0]);assert.equal(await workspace.locator('.rw-source-card').count(),1);assert.equal(await workspace.locator('.rw-pickup-card').count(),1,'Both native outputs pass through one physical DI card');
   assert.equal(await workspace.locator('[data-rw-device-card="di-prod2-demo"]').count(),1);assert.equal(await workspace.locator('.rw-patch-card').count(),1);assert.equal(await workspace.locator('.rw-channel-card').count(),2,'The signal splits into separate channel cards after the shared DI and patch');
   assert.deepEqual((await card.getAttribute('data-rw-rows')).split('|'),waveRows(connected).map(row=>row.id));
   await workspace.locator('[data-rw-tools]').click();await workspace.locator('[data-rw-tool="undo"]').click();assert.deepEqual(state(await saved(page)),state(before),'One undo restores the mono source, disabled right output and original DI assignment');
   await workspace.locator('[data-rw-tool="redo"]').click();assert.deepEqual(state(await saved(page)),state(connected),'One redo restores both native outputs and the same stereo assignment');
   await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await workspace.locator('[data-rw-select="station-2"]').first().click();connected=await saved(page);checkConnected(connected,waveRows(before)[0]);
   for(const width of [1512,390]){
    await page.setViewportSize({width,height:width===390?844:982});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await workspace.locator('.rw-pickup-card').first().scrollIntoViewIfNeeded();
    await workspace.locator('.rw-pickup-card img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.mouse.move(1,1);
    await page.screenshot({path:artifactPath('routing-wave2-stereo-di-light-'+width+'-'+engine+'.png')});
   }
  }finally{await context.close();}
 }
}
async function checkStage4SharedDi(browser,errors){
 const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'});
 try{
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));await fixture(page);
  const workspace=page.locator('#sp-routing-workspace-v2'),sourceId='station-2';
  const rows=doc=>doc.stage.routing.inputs.filter(row=>row.sourceKey.startsWith(sourceId+':')).sort((a,b)=>a.portIndex-b.portIndex);
  const snapshot=doc=>{const {generatedAt,...routing}=doc.stage.routing;return {io:doc.objects.find(object=>object.id===sourceId).io,routing};};
  const output=(name,value,next)=>workspace.locator('[data-rw-source-output-'+name+'="'+value+'"][data-rw-source="'+sourceId+'"]'+(next===undefined?'':'[data-rw-value="'+next+'"]'));
  const choose=async(rowId,model)=>{await workspace.locator('[data-rw-di-open="'+rowId+'"]').click();await workspace.locator('[data-rw-di-dialog] [data-rw-create-di="'+model+'"]').click();assert.equal(await workspace.locator('[data-rw-di-dialog]').count(),0);};
  const history=async direction=>{if(await workspace.locator('[data-rw-tools]').getAttribute('aria-expanded')!=='true')await workspace.locator('[data-rw-tools]').click();await workspace.locator('[data-rw-tool="'+direction+'"]').click();};
  const assertCards=async(root,doc)=>{
   const native=rows(doc),pairs=[native.slice(0,2),native.slice(2,4)];
   assert.equal(await root.locator('.rw-source-card').count(),1);assert.equal(await root.locator('.rw-pickup-card').count(),2,'Four Stage 4 outputs use exactly two physical DI cards');
   assert.equal(await root.locator('.rw-patch-card').count(),2,'Each physical DI has one patch card for its two outputs');assert.equal(await root.locator('.rw-channel-card').count(),4);
   for(const pair of pairs){
    const card=root.locator('[data-rw-device-card="'+pair[0].diDeviceId+'"]');assert.equal(await card.count(),1);
    assert.deepEqual((await card.getAttribute('data-rw-rows')).split('|'),pair.map(row=>row.id));assert.equal(await card.locator('[data-rw-di-open]').count(),1,'The pair has one DI model control');
    const patch=root.locator('.rw-patch-card[data-rw-card="patch-inputs-'+pair.map(row=>row.id).join('|')+'"]');assert.equal(await patch.count(),1);assert.equal(await patch.locator('.rw-port-pills button').count(),2);
   }
  };
  await workspace.locator('[data-rw-select="'+sourceId+'"]').first().click();await change(workspace.locator('[data-rw-source-field="label"][data-rw-source="'+sourceId+'"]'),'Nord Stage 4');await workspace.locator('[data-rw-source-outputs="'+sourceId+'"]').click();
  for(const port of [3,4])await output('used',port,true).click();await output('stereo',3,true).click();await change(output('alias',1),'Piano');await change(output('alias',3),'Synth');
  await workspace.locator('[data-rw-source-outputs="'+sourceId+'"]').click();
  let doc=await saved(page);const native=rows(doc),pianoIds=native.slice(0,2).map(row=>row.id),synthIds=native.slice(2,4).map(row=>row.id);
  const originalPiano=native.slice(0,2).map(row=>({id:row.id,number:row.number,stagebox:row.stagebox,stageboxPort:row.stageboxPort}));
  for(const rowId of [pianoIds[0],synthIds[0]]){await workspace.locator('[data-rw-row-card="'+rowId+'"] [data-rw-pickup="DI"]').click();await choose(rowId,'radial-prod2');}
  doc=await saved(page);const configured=rows(doc),pianoDevice=configured[0].diDeviceId,synthDevice=configured[2].diDeviceId;
  assert.deepEqual(configured.map(row=>row.sourceKey),[1,2,3,4].map(port=>sourceId+':out-'+port));assert.deepEqual(configured.map(row=>row.diDeviceId),[pianoDevice,pianoDevice,synthDevice,synthDevice]);assert.notEqual(pianoDevice,synthDevice,'Piano and Synth use distinct physical DIs');
  assert.deepEqual(configured.map(row=>row.diChannel),[1,2,1,2]);assert.deepEqual(configured.map(row=>row.mode),['Stereo L','Stereo R','Stereo L','Stereo R']);assert(configured.slice(0,2).every(row=>row.instrument.includes('Piano')));assert(configured.slice(2,4).every(row=>row.instrument.includes('Synth')));
  assert.deepEqual(configured.slice(0,2).map(row=>({id:row.id,number:row.number,stagebox:row.stagebox,stageboxPort:row.stageboxPort})),originalPiano,'Selecting the shared DI preserves Piano channel numbers and existing patch');
  assert.equal(doc.stage.routing.inputs.find(row=>row.id==='route-acoustic').diDeviceId,'di-prod2-demo','Selecting two new DIs does not reuse the guitar’s physical unit');
  await assertCards(workspace,doc);
  for(const key of ['pickup-'+pianoIds[0],'patch-inputs-'+pianoIds.join('|')]){
   await workspace.locator('[data-rw-open="'+key+'"]').first().click();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const alignment=await workspace.evaluate(element=>{const center=node=>{const bounds=node.getBoundingClientRect();return bounds.y+bounds.height/2;};return {arrows:[...element.querySelectorAll('.rw-channel-fork:first-of-type')[0].querySelectorAll('.rw-connector')].map(center),channels:[...element.querySelector('.rw-channel-stack').children].map(center)};});
   assert.equal(alignment.arrows.length,2);alignment.arrows.forEach((position,index)=>assert(Math.abs(position-alignment.channels[index])<=1,'Opening '+key+' keeps the split arrow centered on channel '+(index+1)));
   await workspace.locator('[data-rw-open="'+key+'"]').first().click();
  }
  await workspace.locator('[data-rw-open="patch-inputs-'+synthIds.join('|')+'"]').first().click();await workspace.locator('[data-rw-patch="5"][data-rw-direction="inputs"]').click();
  for(const [index,rowId]of synthIds.entries())await change(workspace.locator('[data-rw-channel-field="number"][data-rw-row="'+rowId+'"]'),13+index);
  doc=await saved(page);assert.deepEqual(rows(doc).map(row=>row.stageboxPort),[11,12,5,6],'Each pair patches from its shared connection card');
  assert.deepEqual(rows(doc).map(row=>row.number),[11,12,13,14],'Every output retains an independently editable console channel');
  await page.setViewportSize({width:1512,height:1480});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await workspace.locator('.rw-pickup-card img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.mouse.move(1,1);await page.screenshot({path:artifactPath('routing-stage4-piano-synth-prod2-'+engine+'.png')});await page.setViewportSize({width:1512,height:982});
  const beforeReplacement=snapshot(doc);await choose(pianoIds[0],'generic-active-stereo');doc=await saved(page);
  const replacement=rows(doc)[0].diDeviceId;assert.equal(replacement,pianoDevice);assert.deepEqual(rows(doc).map(row=>row.diDeviceId),[replacement,replacement,synthDevice,synthDevice]);assert.equal(doc.stage.routing.devices.find(device=>device.id===replacement).modelId,'generic-active-stereo');
  assert.deepEqual(rows(doc).map(row=>row.stageboxPort),[11,12,5,6]);assert.deepEqual(rows(doc).map(row=>row.number),[11,12,13,14]);await assertCards(workspace,doc);
  const afterReplacement=snapshot(doc);await history('undo');assert.deepEqual(snapshot(await saved(page)),beforeReplacement,'One undo restores both connections and the previous physical DI');await history('redo');assert.deepEqual(snapshot(await saved(page)),afterReplacement,'One redo replaces the physical DI for both Piano outputs');
  await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await workspace.locator('[data-rw-select="'+sourceId+'"]').first().click();doc=await saved(page);assert.deepEqual(snapshot(doc),afterReplacement);await assertCards(workspace,doc);
  const sourceFigure=await workspace.locator('.rw-source-card .rw-art > svg').innerHTML();assert.equal(await workspace.locator('.rw-source-flow svg').evaluateAll((figures,source)=>figures.filter(figure=>figure.innerHTML===source).length,sourceFigure),1,'Stage 4 is pictured once, before its Piano and Synth routes');
  for(const width of [1512,390]){
   await page.setViewportSize({width,height:width===390?844:982});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await workspace.locator('.rw-pickup-card').first().scrollIntoViewIfNeeded();
   for(const rowId of [pianoIds[0],synthIds[0]])await assertNoOverflow(page,'[data-rw-row-card="'+rowId+'"]','Shared Stage 4 DI '+width);
   await workspace.locator('.rw-pickup-card img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.mouse.move(1,1);await page.screenshot({path:artifactPath('routing-stage4-two-shared-di-light-'+width+'-'+engine+'.png')});
  }
  const storedBefore=await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1')),shareDoc=await page.evaluate(document=>window.StageplotShare.clean(document),doc),shareHash=Buffer.from(JSON.stringify({kind:'stageplot-readonly',version:1,document:shareDoc})).toString('base64url');
  const readonlyPage=await context.newPage();readonlyPage.on('pageerror',error=>errors.push(error.message));await readonlyPage.goto((process.env.APP_URL||'http://127.0.0.1:8899/')+'#share='+shareHash);await readonlyPage.locator('.sp-steps [data-view="routing"]').click();
  const readonlyWorkspace=readonlyPage.locator('#sp-routing-workspace-v2');await readonlyWorkspace.locator('[data-rw-select="'+sourceId+'"]').first().click();assert.equal(await readonlyWorkspace.getAttribute('data-readonly'),'true');await assertCards(readonlyWorkspace,doc);
  assert(await readonlyWorkspace.locator('[data-rw-di-open]').evaluateAll(buttons=>buttons.every(button=>button.disabled)));assert(await readonlyWorkspace.locator('.rw-channel-card input').evaluateAll(fields=>fields.every(field=>field.readOnly)));
  await readonlyPage.close();assert.equal(await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1')),storedBefore,'Viewing the shared DI layout does not alter the saved draft');
 }finally{await context.close();}
}
async function checkPhysicalDiStage(browser,errors){
 const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'});
 try{
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const workspace=page.locator('#sp-routing-workspace-v2'),sourceId='station-2';
  let doc=await saved(page);assert.equal(doc.objects.filter(o=>o.type==='di').length,1,'An older assigned DI receives exactly one stage object');
  const initialDevice=doc.stage.routing.devices.find(d=>d.id==='di-prod2-demo');assert(doc.objects.some(o=>o.id===initialDevice.objectId&&o.type==='di'));
  await page.locator('.sp-steps [data-view="editor"]').click();await page.locator('#sp-library-search').fill('DI');await page.locator('#sp-library-items [data-add="di"]').click();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');doc=await saved(page);
  let manual=doc.objects.filter(o=>o.type==='di').at(-1);assert.notEqual(manual.id,initialDevice.objectId);const manualId=manual.id;
  assert(!doc.stage.routing.inputs.some(row=>row.sourceKey.startsWith(manualId+':')),'Placing a DI does not invent a sound source');
  if(await page.locator('#sp-inspector-open').isVisible())await page.locator('#sp-inspector-open').click();await page.locator('#sp-properties-tab').click();await change(page.locator('#sp-label'),'Piano DI');
  await page.locator('#sp-audio-object [data-di-model="radial-prod2"]').click();doc=await saved(page);const manualDevice=doc.stage.routing.devices.find(d=>d.objectId===manualId);assert(manualDevice);assert.equal(manualDevice.channels,2);
  await change(page.locator('#sp-label'),'Piano DI');await change(page.locator('#sp-pos-x'),6);await change(page.locator('#sp-pos-y'),3.5);
  doc=await saved(page);manual=doc.objects.find(o=>o.id===manualId);const position={x:manual.x,y:manual.y,angle:manual.angle};
  await page.locator('.sp-steps [data-view="routing"]').click();assert.equal(await workspace.locator('.rw-source-list [data-rw-select="'+manualId+'"]').count(),0);
  await workspace.locator('.rw-source-list [data-rw-select="'+sourceId+'"]').click();await workspace.locator('[data-rw-pickup="DI"][data-rw-row="route-key-l"]').click();await workspace.locator('[data-rw-di-choose="route-key-l"]').click();
  let dialog=workspace.locator('[data-rw-di-dialog]');assert.equal(await dialog.locator('select,[role="tablist"]').count(),0);
  for(const width of [1512,390]){await page.setViewportSize({width,height:width===390?844:982});await dialog.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await assertNoOverflow(page,'[data-rw-di-dialog]','Physical DI selection '+width);assert(await dialog.locator('.rw-di-instance').evaluateAll(tiles=>tiles.every(tile=>tile.querySelector('img').getBoundingClientRect().bottom<=tile.querySelector('strong').getBoundingClientRect().top)),'DI photographs stay above their labels');await page.screenshot({path:artifactPath('routing-di-assign-'+width+'-'+engine+'.png')});}await page.setViewportSize({width:1512,height:982});
  const physical=dialog.locator('[data-rw-di-instance="'+manualDevice.id+'"]');assert.match(await physical.innerText(),/Piano DI/);await physical.locator('[data-rw-use-di]').click();
  doc=await saved(page);const keys=doc.stage.routing.inputs.filter(r=>r.sourceKey.startsWith(sourceId+':'));assert.equal(keys.length,2);assert(keys.every(row=>row.diDeviceId===manualDevice.id));assert.deepEqual(keys.map(row=>row.diChannel),[1,2]);assert.equal(doc.objects.filter(o=>o.type==='di').length,2);assert.deepEqual(keys.map(row=>row.stageboxPort),[11,12]);
  await workspace.locator('[data-rw-di-open="route-key-l"]').click();await workspace.locator('[data-rw-create-di="radial-j48-stereo"]').click();doc=await saved(page);assert.equal(doc.stage.routing.devices.find(d=>d.id===manualDevice.id).objectId,manualId);assert.equal(doc.objects.filter(o=>o.type==='di').length,2);assert.deepEqual(Object.fromEntries(['x','y','angle'].map(key=>[key,doc.objects.find(o=>o.id===manualId)[key]])),position);
  await workspace.locator('[data-rw-di-choose="route-key-l"]').click();await workspace.locator('[data-rw-di-new]').click();await workspace.locator('[data-rw-create-di="radial-prod2"]').click();doc=await saved(page);const newDevice=doc.stage.routing.devices.find(d=>d.id===doc.stage.routing.inputs.find(r=>r.id==='route-key-l').diDeviceId),newObject=doc.objects.find(o=>o.id===newDevice.objectId);assert(newObject);assert.notEqual(newObject.id,manualId);assert.equal(doc.objects.filter(o=>o.type==='di').length,3);assert(!doc.stage.routing.inputs.some(row=>row.sourceKey.startsWith(newObject.id+':')));
  await workspace.locator('[data-rw-tools]').click();await workspace.locator('[data-rw-tool="undo"]').click();doc=await saved(page);assert(!doc.objects.some(o=>o.id===newObject.id));assert.equal(doc.stage.routing.inputs.find(r=>r.id==='route-key-l').diDeviceId,manualDevice.id);await workspace.locator('[data-rw-tool="redo"]').click();
  await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();doc=await saved(page);assert.equal(doc.objects.filter(o=>o.type==='di').length,3);assert.equal(doc.stage.routing.devices.find(d=>d.id===newDevice.id).objectId,newObject.id);
  await page.locator('#sp-editor-floor [data-object="'+newObject.id+'"]').click();if(await page.locator('#sp-inspector-open').isVisible())await page.locator('#sp-inspector-open').click();await page.locator('#sp-properties-tab').click();assert.match(await page.locator('#sp-audio-object').innerText(),/Keyboard/);assert(await page.locator('#sp-outs-direct').isHidden());
  await page.locator('#sp-selected-name').scrollIntoViewIfNeeded();const ports=await page.locator('#sp-audio-object [aria-label="DI-Eingang"]').boundingBox();assert(ports&&ports.y>=0&&ports.y+ports.height<982,'Selecting a stage DI exposes its input occupancy immediately');
  await page.screenshot({path:artifactPath('routing-di-on-stage-'+engine+'.png')});
  await page.locator('#sp-inspector-remove').click();doc=await saved(page);assert(!doc.stage.routing.devices.some(d=>d.id===newDevice.id));assert(!doc.objects.some(o=>o.id===newObject.id));const detached=doc.stage.routing.inputs.filter(r=>r.sourceKey.startsWith(sourceId+':'));assert.equal(detached.length,2);assert(detached.every(r=>!r.diDeviceId));assert.deepEqual(detached.map(r=>r.stageboxPort),[11,12]);
  await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();doc=await saved(page);assert(!doc.objects.some(o=>o.id===newObject.id),'Deleting a DI does not make it reappear');
 }finally{await context.close();}
}
async function checkSourceOutputs(browser,errors){
 const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'});
 try{
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));await fixture(page);
  await page.evaluate(()=>{
   const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),entry=workspace.entry;
   Object.assign(entry.document.stage.routing.inputs.find(row=>row.id==='route-key-l'),{pickup:'DI',diDeviceId:'di-prod2-demo',diChannel:2,microphone:'Radial ProD2',notes:'Keyboard links behalten'});
   const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1'));drafts.entries=drafts.entries.map(item=>item.id===entry.id?entry:item);localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));
  });
  await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();
  const workspace=page.locator('#sp-routing-workspace-v2'),sourceId='station-2',source=doc=>doc.objects.find(object=>object.id===sourceId),rows=doc=>doc.stage.routing.inputs.filter(row=>row.sourceKey.startsWith(sourceId+':'));
  const state=doc=>{const {generatedAt,...routing}=doc.stage.routing;return {io:source(doc).io,routing};};
  const protectedFields=row=>Object.fromEntries(['id','diDeviceId','diChannel','number','stagebox','stageboxPort','notes'].map(key=>[key,row[key]]));
  const opener=workspace.locator('[data-rw-source-outputs="'+sourceId+'"]'),editor=workspace.locator('.rw-source-output-editor'),count=workspace.locator('[data-rw-source-output-count="'+sourceId+'"]');
  const action=(name,value,next)=>workspace.locator('[data-rw-source-output-'+name+'="'+value+'"][data-rw-source="'+sourceId+'"]'+(next===undefined?'':'[data-rw-value="'+next+'"]'));
  const open=async()=>{if(!await editor.isVisible())await opener.click();};
  const undo=async direction=>{if(await workspace.locator('[data-rw-tools]').getAttribute('aria-expanded')!=='true')await workspace.locator('[data-rw-tools]').click();await workspace.locator('[data-rw-tool="'+direction+'"]').click();};
  await workspace.locator('[data-rw-select="'+sourceId+'"]').first().click();await open();
  assert.equal(await count.inputValue(),'4');assert.equal(await workspace.locator('dialog[open]').count(),0,'Source output settings open directly in the source card');assert.equal(await editor.locator('select').count(),0);
  await action('step','1').click();let doc=await saved(page);assert.equal(source(doc).io.outputs.count,5);
  assert.deepEqual(rows(doc).map(row=>row.sourceKey).sort(),['station-2:out-1','station-2:out-2','station-2:out-5'],'Increasing hardware capacity activates the new native output without adding pickups');
  const assigned=protectedFields(rows(doc).find(row=>row.id==='route-key-l'));
  for(const port of [3,4])await action('used',port,true).click();
  doc=await saved(page);assert.equal(rows(doc).length,5);assert.equal(new Set(rows(doc).map(row=>row.sourceKey)).size,5);
  await action('used',5,false).click();doc=await saved(page);assert.equal(source(doc).io.outputs.count,5);assert(!rows(doc).some(row=>row.sourceKey==='station-2:out-5'));assert(doc.stage.routing.disabledSources.includes('station-2:out-5'));
  await action('stereo',3,true).click();await change(action('alias',3),'Pads');await change(action('alias',1),'Piano');
  doc=await saved(page);assert.deepEqual(source(doc).io.aliases.outputs.slice(0,4),['Piano','Piano','Pads','Pads']);assert(source(doc).io.stereoPairs.includes(3));
  const pads=rows(doc).filter(row=>[3,4].includes(row.portIndex));assert.deepEqual(pads.map(row=>row.mode),['Stereo L','Stereo R']);assert(pads.every(row=>row.instrument.includes('Pads')));assert.equal(pads[0].stereoGroup,pads[1].stereoGroup);
  await action('alias',5).scrollIntoViewIfNeeded();const portList=editor.locator('.rw-output-port-list'),portScroll=await portList.evaluate(element=>element.scrollTop);assert(portScroll>0);
  await change(action('alias',5),'Reserve');assert(Math.abs(await portList.evaluate(element=>element.scrollTop)-portScroll)<=2,'Editing a lower output name preserves the port-list scroll position');
  await action('connector','XLR').click();doc=await saved(page);assert.equal(source(doc).io.outputs.connector,'XLR');assert.deepEqual(protectedFields(rows(doc).find(row=>row.id==='route-key-l')),assigned,'Names and an analog source connector preserve its DI, channel, notes and patch');
  const analog=state(doc);
  for(const width of [1512,390]){
   await page.setViewportSize({width,height:width===390?844:982});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await count.scrollIntoViewIfNeeded();await assertNoOverflow(page,'.rw-source-output-editor','Source output editor '+width);await page.mouse.move(1,1);
   await page.screenshot({path:artifactPath('routing-source-outputs-light-'+width+'-'+engine+'.png')});
  }
  await page.setViewportSize({width:1512,height:982});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await count.focus();await page.keyboard.press('Escape');assert(!await editor.isVisible());assert(await opener.evaluate(element=>element===document.activeElement),'Escape returns focus to the source output button');await open();
  await action('connector','Dante').click();doc=await saved(page);
  const digital=rows(doc).find(row=>row.id==='route-key-l');assert.equal(source(doc).io.outputs.connector,'Dante');assert.equal(digital.connector,'Dante');assert(!digital.diDeviceId);assert(!digital.stagebox);assert(!digital.stageboxPort);
  await undo('undo');assert.deepEqual(state(await saved(page)),analog,'One undo restores the analog source and its DI connection');
  await open();await change(count,0);doc=await saved(page);assert.equal(source(doc).io.outputs.count,0);assert.equal(rows(doc).length,0);assert(await workspace.locator('[data-rw-select="'+sourceId+'"]').first().isVisible());assert(await opener.isVisible());assert.equal(await workspace.locator('.rw-source-card').count(),1);
  const empty=state(doc);await open();await change(count,2);doc=await saved(page);assert.equal(source(doc).io.outputs.count,2);assert.deepEqual(rows(doc).map(row=>row.sourceKey).sort(),['station-2:out-1','station-2:out-2']);const restored=state(doc);
  await undo('undo');assert.deepEqual(state(await saved(page)),empty,'A source with no outputs remains recoverable through undo');await undo('redo');assert.deepEqual(state(await saved(page)),restored);
  await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await workspace.locator('[data-rw-select="'+sourceId+'"]').first().click();await open();assert.equal(await count.inputValue(),'2');assert.equal(rows(await saved(page)).length,2);
  for(const quantity of [16,64]){
   await change(count,quantity);assert.equal(source(await saved(page)).io.outputs.count,quantity);assert.equal(await count.inputValue(),String(quantity));
   const bounds=await count.boundingBox();assert(bounds&&bounds.y>=0&&bounds.y+bounds.height<=page.viewportSize().height,'Growing the output count keeps its controls on screen');
   assert(await editor.evaluate(element=>element.contains(document.activeElement)),'Focus remains within the output editor after increasing the count');
  }
  await page.mouse.move(1,1);await page.screenshot({path:artifactPath('routing-source-outputs-many-light-64-'+engine+'.png')});await change(count,2);assert.equal(rows(await saved(page)).length,2);
  await workspace.locator('[data-rw-select="station-6"]').first().click();assert.equal(await workspace.locator('[data-rw-source-editor="station-6"]').count(),1,'Drum outputs offer their existing setup editor');assert.equal(await workspace.locator('[data-rw-source-output-count="station-6"]').count(),0);
  await page.locator('.sp-steps [data-view="editor"]').click();await page.locator('#sp-editor-floor [data-object="'+sourceId+'"]').first().click();if(await page.locator('#sp-inspector-open').isVisible())await page.locator('#sp-inspector-open').click();await page.locator('#sp-properties-tab').click();
  await page.locator('#sp-outs-routing-open').click();assert(await workspace.isVisible());assert(await count.isVisible());assert.equal(await count.inputValue(),'2','The inspector shortcut opens this source and its output controls directly');
  await page.evaluate(()=>{
   const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),entry=workspace.entry;entry.document.objects.find(object=>object.id==='station-2').locked=true;
   const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1'));drafts.entries=drafts.entries.map(item=>item.id===entry.id?entry:item);localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));
  });
  await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();await workspace.locator('[data-rw-select="'+sourceId+'"]').first().click();
  const locked=await saved(page);await checkSourceOutputsReadOnly(workspace,sourceId);assert.deepEqual(await saved(page),locked,'Reading locked hardware settings does not alter the draft');
 }finally{await context.close();}
}
async function checkSourceOutputsReadOnly(workspace,sourceId){
 await workspace.locator('[data-rw-source-outputs="'+sourceId+'"]').click();
 const editor=workspace.locator('.rw-source-output-editor');assert(await editor.isVisible(),'Protected hardware settings remain readable');
 const controls=editor.locator('input,button,textarea,select');assert(await controls.count()>0);assert(await controls.evaluateAll(items=>items.every(item=>item.disabled)),'Protected output controls are disabled');
}
async function run(){const browser=await launchBrowser();try{
 const context=await browser.newContext({viewport:{width:1512,height:982},colorScheme:'light'}),page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
 const workspace=page.locator('#sp-routing-workspace-v2');
 assert.equal(await workspace.locator('select').count(),0);assert.equal(await workspace.locator('.rw-source-card').count(),1);assert.equal(await workspace.locator('.rw-pickup-card').count(),2);
 assert.equal(await workspace.locator('[data-rw-di-channel="2"]').first().innerText(),'2\nFrei');
 assert.equal(await workspace.locator('[data-rw-row-card="route-acoustic"] [data-rw-di-stereo]').count(),0,'A mono guitar does not offer a second native output');
 assert.equal(await workspace.locator('[data-object-visual][data-routing-selected="true"]').count(),2);
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
 await change(workspace.locator('[data-rw-channel-field="number"][data-rw-row="'+newId+'"]'),21);
 assert.equal(await workspace.locator('.rw-pickup-card').count(),2,'Native and additional mono pickups from one source share one physical DI card');
 await workspace.locator('[data-rw-open="patch-inputs-route-acoustic|'+newId+'"]').first().click();
 await workspace.locator('[data-rw-patch="3"][data-rw-direction="inputs"]').click();
 doc=await saved(page);assert.equal(doc.stage.routing.inputs.find(row=>row.id==='route-acoustic').stageboxPort,3);assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).stageboxPort,4);
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
 await workspace.locator('[data-rw-tab="stageboxes"]').click();assert.match(await workspace.locator('[data-rw-port="4"][data-rw-direction="inputs"]').innerText(),/Akustik/);
 await workspace.locator('[data-rw-port="4"][data-rw-direction="inputs"]').click();assert.equal(await workspace.locator('.rw-source-card').count(),1);assert.equal(await workspace.locator('.rw-pickup-card').count(),1);assert.equal(await workspace.locator('.rw-channel-card').count(),2,'The stagebox detail keeps both ports of the shared physical DI together');
 const downloadPromise=page.waitForEvent('download');await workspace.locator('[data-rw-export="all"]').click();const download=await downloadPromise;const fs=require('node:fs'),csv=fs.readFileSync(await download.path(),'utf8');assert(csv.includes('Radial ProD2'));assert(csv.includes('PSM Test'));assert(csv.includes('DI-Eingang'));
 await workspace.locator('[data-rw-tab="inputs"]').click();await workspace.locator('[data-rw-select="station-1"]').first().click();
 await workspace.locator('.rw-card-value[data-rw-di-open="route-acoustic"]').click();await workspace.locator('[data-rw-di-dialog] [data-rw-create-di="generic-active-stereo"]').click();
 assert.equal(await workspace.locator('[data-rw-di-dialog]').count(),0,'Selecting a DI immediately closes the picker');
 doc=await saved(page);const genericRow=doc.stage.routing.inputs.find(row=>row.id==='route-acoustic'),genericDevice=doc.stage.routing.devices.find(device=>device.id===genericRow.diDeviceId);
 assert.equal(genericDevice.modelId,'generic-active-stereo');assert.equal(genericDevice.channels,2);assert.equal(genericRow.diChannel,1);assert.equal(genericRow.number,9);assert.equal(genericRow.stageboxPort,3);
 assert.equal(doc.stage.routing.inputs.find(row=>row.id===newId).diDeviceId,genericDevice.id,'Replacing the shared physical DI keeps both same-source pickups together');
 await page.reload();await page.locator('.sp-steps [data-view="routing"]').click();doc=await saved(page);
 assert.equal(doc.stage.routing.inputs.find(row=>row.id==='route-acoustic').diDeviceId,genericDevice.id);assert.equal(doc.stage.routing.devices.find(device=>device.id===genericDevice.id).modelId,'generic-active-stereo');
 await workspace.locator('.rw-card-value[data-rw-di-open="route-acoustic"]').click();assert.equal(await workspace.locator('[data-rw-di-dialog] [data-rw-create-di="generic-active-stereo"]').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');
 const storedBefore=await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1'));
 const shareDoc=await page.evaluate(document=>window.StageplotShare.clean(document),doc),shareHash=Buffer.from(JSON.stringify({kind:'stageplot-readonly',version:1,document:shareDoc})).toString('base64url');
 const readonlyPage=await page.context().newPage();readonlyPage.on('pageerror',e=>errors.push(e.message));await readonlyPage.goto((process.env.APP_URL||'http://127.0.0.1:8899/')+'#share='+shareHash);await readonlyPage.locator('.sp-steps [data-view="routing"]').click();
 const readonlyWorkspace=readonlyPage.locator('#sp-routing-workspace-v2');assert.equal(await readonlyWorkspace.getAttribute('data-readonly'),'true');assert.equal(await readonlyWorkspace.locator('[data-rw-add-pickup]').count(),0);assert(await readonlyWorkspace.locator('input:not([type="search"])').evaluateAll(fields=>fields.every(field=>field.readOnly)));
 await checkSourceOutputsReadOnly(readonlyWorkspace,'station-1');await readonlyWorkspace.locator('[data-rw-select="station-6"]').first().click();assert(await readonlyWorkspace.locator('[data-rw-source-editor="station-6"]').isDisabled());
 await readonlyPage.close();assert.equal(await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1')),storedBefore);
 await checkWave2Stereo(browser,errors);
 await checkStage4SharedDi(browser,errors);
 await checkPhysicalDiStage(browser,errors);
 await checkSourceOutputs(browser,errors);
 assert.deepEqual(errors,[]);console.log('PASS '+engine+': light/dark routing views, responsive DI popup and source outputs, native output activation/count/names/stereo/connector with DI preservation, zero-output recovery and undo/redo/reload, modal keyboard/dismissal, direct inline acquisition, native Wave 2 stereo DI and occupied-port protection, Stage 4 Piano/Synth on two shared DI cards with four channels, physical stage DI placement/reuse/deletion, responsive device assignment, atomic model replacement and patching, read-only/reload, monitor metadata and CSV export.');
}finally{await browser.close();}}
if(require.main===module)run().catch(error=>{console.error(error);process.exit(1);});
module.exports={checkPhysicalDiStage,fixture,checkWave2Stereo,checkStage4SharedDi,checkSourceOutputs};
