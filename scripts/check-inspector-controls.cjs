const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath,assertNoOverflow}=require('./browser-qa.cjs');
const url=process.env.APP_URL||'http://127.0.0.1:8874/';
(async()=>{
 const browser=await launchBrowser();
 try{for(const width of (process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):[1440,390])){
  const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width<900,isMobile:width<900,colorScheme:'light'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  await page.goto(url);await page.locator('[data-project-add]').click();await page.locator('#sp-np-create').click();
  await page.waitForFunction(()=>localStorage.getItem('stageplot-studio:workspace:v1'));
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document);
  const select=async()=>{
   if(await page.locator('#sp-inspector-open').isVisible())await page.locator('#sp-inspector-open').click();
   await page.locator('#sp-layers-tab').click();await page.locator('#sp-object-list [data-select]').first().click();await page.locator('#sp-properties-tab').click();
  };
  const undo=async()=>{if(width<900)await page.locator('#sp-inspector-toggle').click();await page.locator('#sp-undo').click();if(width<900)await page.locator('#sp-inspector-open').click();};
  const fixture=async(type,extra={})=>{
   await page.evaluate(({type,extra})=>{
    const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=workspace.entry;
    entry.document.objects=[{id:'test-object',type,label:type==='keys-stage4'?'Nord Stage 4':type==='drums'?'Drums':'Test',x:4,y:2.5,angle:0,...extra}];entry.document.stage.routing={inputs:[],outputs:[],disabledSources:[]};
    drafts.entries[drafts.entries.findIndex(e=>e.id===entry.id)]=entry;
    localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));
   },{type,extra});
   await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();await select();
   await page.locator('#sp-pos-x').waitFor({state:'visible'});
  };
  await fixture('guitar-jazzmaster',{label:'Jazzmaster'});
  assert.equal(await page.locator('#sp-label-position-reset').count(),0);
  await assertNoOverflow(page,'#sp-selected','Inspector fields fit');
  const box=await page.locator('#sp-pos-x').boundingBox();assert(box.width<95,'Position is a short field.');
  const fill=async(id,value)=>{await page.locator('#'+id).fill(String(value));await page.locator('#'+id).press('Tab');};
  await fill('sp-pos-x',1.5);await fill('sp-pos-y',2.875);
  await page.locator('#sp-inspector-turn [data-rotate="45"]').click();assert.equal(await page.locator('#sp-angle-number').inputValue(),'45');
  await page.locator('#sp-inspector-turn [data-rotate="-90"]').click();assert.equal(await page.locator('#sp-angle-number').inputValue(),'315');
  await page.locator('#sp-inspector-turn [data-rotate="90"]').click();await page.locator('#sp-inspector-turn [data-rotate="-45"]').click();
  assert.equal(await page.locator('#sp-angle-number').inputValue(),'0');
  const knob=page.locator('#sp-rotation-knob');await knob.focus();await knob.press('ArrowRight');await knob.press('Shift+ArrowUp');
  assert.equal(await page.locator('#sp-angle-number').inputValue(),'16');
  const reset=page.locator('#sp-rotation-reset');await reset.click();assert.equal(await knob.getAttribute('aria-valuenow'),'0','Reset sets absolute zero.');
  await undo();assert.equal(await knob.getAttribute('aria-valuenow'),'16','Reset has one undo.');await reset.click();
  const resetBox=await reset.boundingBox(),stepBox=await page.locator('#sp-inspector-turn [data-rotate="-45"]').boundingBox(),knobBox=await knob.boundingBox();
  assert(Math.abs(resetBox.y-stepBox.y)<1,'Reset aligns with the top row.');assert(knobBox.y>=resetBox.y+resetBox.height,'Reset stays above the smaller knob.');assert(knobBox.width<66&&knobBox.width>=44,'Compact knob retains a touch target.');
  await page.evaluate(()=>{window.knobEvents=[];for(const name of ['pointerdown','pointerup'])window.addEventListener(name,e=>{const el=document.getElementById('sp-rotation-knob');if(e.target===el)window.knobEvents.push({type:e.type,x:e.clientX,y:e.clientY,box:el.getBoundingClientRect().toJSON()});},true);});
  await knob.scrollIntoViewIfNeeded();const k=await knob.boundingBox(),cx=k.x+k.width/2,cy=k.y+k.height/2,radius=k.width/2-5;
  await page.mouse.move(cx,cy-radius);await page.mouse.down();
  assert.equal(await knob.getAttribute('aria-valuenow'),'0','No jump on pointer down.');
  for(let i=1;i<=12;i++){const a=i*Math.PI/24;await page.mouse.move(cx+radius*Math.sin(a),cy-radius*Math.cos(a));}
  await page.mouse.up();
  const expectedAngle=await page.evaluate(()=>{const [start,end]=window.knobEvents,box=start.box,cx=box.x+box.width/2,cy=box.y+box.height/2;return Math.round((Math.atan2(end.y-cy,end.x-cx)-Math.atan2(start.y-cy,start.x-cx))*180/Math.PI);});
  assert(Math.abs(expectedAngle-90)<=3,'Quarter-turn pointer path.');assert.equal(Number(await knob.getAttribute('aria-valuenow')),expectedAngle,'Angle follows actual browser pointer coordinates, including rounded WebKit pixels.');
  await undo();assert.equal(await page.locator('#sp-angle-number').inputValue(),'0','Whole knob drag undoes once.');
  await knob.scrollIntoViewIfNeeded();const cancelBox=await knob.boundingBox(),qx=cancelBox.x+cancelBox.width/2,qy=cancelBox.y+cancelBox.height/2;
  await page.mouse.move(qx,qy-radius);await page.mouse.down();await page.mouse.move(qx+radius,qy);await page.keyboard.press('Escape');await page.mouse.up();
  assert.equal(await knob.getAttribute('aria-valuenow'),'0','Escape restores rotation.');
  if(width<900&&engine!=='webkit'){
   await knob.scrollIntoViewIfNeeded();const box=await knob.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,cdp=await page.context().newCDPSession(page);
   const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({id:1,x,y,radiusX:2,radiusY:2,force:1}))});
   await touch('touchStart',[[x,y-radius]]);
   for(let i=1;i<=12;i++){const a=i*Math.PI/24;await touch('touchMove',[[x+radius*Math.sin(a),y-radius*Math.cos(a)]]);}
   await touch('touchEnd',[]);assert(Math.abs(Number(await knob.getAttribute('aria-valuenow'))-90)<=3,'Native finger rotation.');
   await undo();assert.equal(await knob.getAttribute('aria-valuenow'),'0','Finger gesture is one undo.');
   await knob.scrollIntoViewIfNeeded();const next=await knob.boundingBox(),nx=next.x+next.width/2,ny=next.y+next.height/2;
   await touch('touchStart',[[nx,ny-radius]]);await touch('touchMove',[[nx+radius,ny]]);await touch('touchCancel',[]);
   assert.equal(await knob.getAttribute('aria-valuenow'),'0','Cancelled finger contact restores the object.');await cdp.detach();
  }

  await page.locator('#sp-pos-x').scrollIntoViewIfNeeded();const p=await page.locator('#sp-pos-x').boundingBox();
  await page.mouse.move(p.x+p.width/2,p.y+p.height/2);await page.mouse.down();await page.mouse.move(p.x+p.width/2+25,p.y+p.height/2,{steps:5});await page.mouse.up();
  assert.equal(Number(await page.locator('#sp-pos-x').inputValue()),1.75,'Drag direct value.');
  await undo();assert.equal(Number(await page.locator('#sp-pos-x').inputValue()),1.5,'One undo for scrub.');
  const originalWidth=Number(await page.locator('#sp-object-width').inputValue()),originalDepth=Number(await page.locator('#sp-object-depth').inputValue());
  await page.locator('[data-inspector-scale="up"]').click();assert(Math.abs(Number(await page.locator('#sp-object-width').inputValue())-originalWidth*1.1)<.02);
  await page.locator('[data-inspector-scale="down"]').click();assert(Math.abs(Number(await page.locator('#sp-object-depth').inputValue())-originalDepth)<.02);
  await page.locator('#sp-inspector-lock-label').click();assert(await knob.isDisabled());assert(await reset.isDisabled());assert(await page.locator('[data-inspector-scale="up"]').isDisabled());
  await page.locator('#sp-inspector-lock-label').click();
  await page.locator('#sp-model-change').click();await page.locator('#sp-model-dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');
  await page.locator('#sp-properties-panel').evaluate(el=>el.scrollTop=0);await page.screenshot({path:artifactPath('inspector-guitar-'+engine+'-'+width+'.png')});
  for(const type of ['keys-stage4','drums','percussion','stage-stairs','riser','mic','text','di']){
   await fixture(type,type==='riser'?{width:2,depth:1,height:40}:{});await assertNoOverflow(page,'#sp-selected',type);
   if(type==='keys-stage4'){
    assert(await page.locator('#sp-inspector-outputs').isVisible());assert(await page.locator('[data-inspector-output]').count()>0);
    await page.locator('[data-inspector-output]').first().click();await page.locator('.rw-source-output-editor').waitFor({state:'visible'});
    await page.locator('.sp-steps [data-view="editor"]').click();
   }
   if(type==='drums'){
    const before=await read(),w=Number(await page.locator('#sp-object-width').inputValue());
    await page.locator('[data-inspector-scale="up"]').click();assert(Math.abs(Number(await page.locator('#sp-object-width').inputValue())-w*1.1)<.03,'Drum footprint resizes.');
    const after=await read();assert.equal(after.objects[0].drums.kickDiameter,before.objects[0].drums?.kickDiameter||22,'Physical heads do not grow.');
    await page.locator('#sp-drums-open').click();await page.locator('#sp-drum-dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');
   }
   if(type==='percussion'||type==='stage-stairs'||type==='riser'){
    const w=Number(await page.locator('#sp-object-width').inputValue());await page.locator('[data-inspector-scale="up"]').click();assert(Math.abs(Number(await page.locator('#sp-object-width').inputValue())-w*1.1)<.03,type+' resize');
   }
   if(type==='stage-stairs')await fill('sp-access-steps',7);
   if(type==='text')assert(await page.locator('#sp-object-size-fields').isHidden());
   if(type==='di')assert.equal(await page.locator('#sp-inspector-routing').getAttribute('open'),'');
   if(['keys-stage4','drums'].includes(type)){
    await page.locator('#sp-properties-panel').evaluate(el=>el.scrollTop=0);await page.screenshot({path:artifactPath('inspector-'+type+'-'+engine+'-'+width+'.png')});
   }
  }
  await fixture('keys-stage4');await fill('sp-pos-x',-1.25);await fill('sp-angle-number',65);await page.locator('[data-inspector-scale="up"]').click();
  const beforeReload=await read();await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();await select();
  assert.equal(Number(await page.locator('#sp-pos-x').inputValue()),-1.25);assert.equal(Number(await page.locator('#sp-angle-number').inputValue()),65);
  assert.deepEqual((await read()).objects[0].dimensions,beforeReload.objects[0].dimensions);
  if(width<900)await page.locator('#sp-inspector-toggle').click();
  await page.locator('#sp-settings-gear').click();await page.locator('[data-theme-choice="dark"]').click();await page.locator('#sp-settings-close').click();if(width<900)await page.locator('#sp-inspector-open').click();
  await page.locator('#sp-properties-panel').evaluate(el=>el.scrollTop=0);await page.screenshot({path:artifactPath('inspector-dark-'+engine+'-'+width+'.png')});
  assert.deepEqual(errors,[]);await page.close();console.log('PASS inspector '+engine+' '+width+': direct entry/scrub, rotation steps/knob/keyboard/cancel, undo, proportional scale, assembly geometry, locks, specialized controls, output editor, persistence and themes.');
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
