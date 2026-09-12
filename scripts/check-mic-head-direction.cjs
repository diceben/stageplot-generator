const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launchBrowser();try{for(const width of [1440,390]){
  const p=await browser.newPage({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});p.setDefaultTimeout(10000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.APP_URL||'http://127.0.0.1:8881/');await p.locator('[data-project-add]').click();await p.locator('#sp-np-create').click();
  if(width===390)await p.locator('#sp-library-open').click();
  await p.locator('#sp-library-search').fill('Mikrofon');await p.locator('#sp-library-items [data-add="mic"]').click();await p.keyboard.press('Enter');
  if(await p.locator('#sp-inspector-open').isVisible())await p.locator('#sp-inspector-open').click();await p.locator('#sp-properties-tab').click();
  assert.equal(await p.locator('#sp-mic-head-direction').inputValue(),'follow');
  const assertHeading=async(selector,target)=>p.waitForFunction(({selector,target})=>{const el=document.querySelector(selector);if(!el?.isConnected)return false;const m=el.getCTM(),actual=(Math.atan2(m.b,m.a)*180/Math.PI+360)%360;return Math.min(Math.abs(actual-target),360-Math.abs(actual-target))<.01;},{selector,target});
  const head='#sp-editor-floor [data-object="station-1"] [data-part="boom-microphone"]';
  for(const [direction,degrees] of [['up',0],['right',90],['down',180],['left',270]]){
    await p.locator(`[data-mic-head-direction="${direction}"]`).click();
    for(const angle of [0,45,137,270,359]){
      await p.locator('#sp-angle-number').fill(String(angle));await p.locator('#sp-angle-number').press('Tab');await p.waitForFunction(angle=>document.querySelector('#sp-editor-floor [data-object="station-1"]>g')?.getAttribute('transform').includes('rotate('+angle+')'),angle);await assertHeading(head,degrees);
      const containment=await p.locator('#sp-editor-floor [data-object="station-1"]').evaluate(el=>{
        const frame=el.querySelector('[data-selection-frame]'),box=frame.getBBox(),inverse=frame.parentNode.getCTM().inverse();
        return [...el.querySelectorAll('[data-mic-visible-art] image')].every(image=>{const b=image.getBBox(),m=inverse.multiply(image.getCTM());return [[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].every(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return p.x>=box.x-.01&&p.y>=box.y-.01&&p.x<=box.x+box.width+.01&&p.y<=box.y+box.height+.01;});});
      });assert(containment,'Frame includes head after counterrotation');
    }
  }
  assert((await p.locator('[id^="sp-art-mic-boom"]').count())<=3,'Rotation must not accumulate shared symbols');
  await p.locator('[data-mic-head-direction="follow"]').click();assert.equal(await p.locator(head).count(),0,'Follow mode uses the shared unrotated head');
  await p.locator('[data-mic-head-direction="up"]').click();await p.locator('#sp-angle-number').fill('135');await p.locator('#sp-angle-number').press('Tab');
  await p.screenshot({path:artifactPath(`mic-direction-${engine}-${width}.png`)});
  await p.locator('[data-mic-stand="round"]').click();const roundHead='#sp-editor-floor [data-object="station-1"] [data-part="round-base-microphone"]';await assertHeading(roundHead,0);
  await p.locator('[data-mic-head-direction="right"]').click();await assertHeading(roundHead,90);
  await p.waitForFunction(()=>{const o=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects[0];return o.micHeadDirection==='right'&&o.angle===135&&o.stand==='round';});
  await p.reload();await p.locator('.sp-steps [data-view="editor"]').click();await assertHeading(roundHead,90);
  await p.locator('#sp-show-print').click();const print=p.locator('#sp-print [data-object="station-1"] [data-part="round-base-microphone"]').first();await print.waitFor({state:'attached'});
  assert.equal(await print.getAttribute('data-mic-direction'),'right');assert((await print.getAttribute('transform')).includes('rotate(315)'));
  await p.context().setOffline(true);await p.locator('[data-export-intent="image"]').click();assert.equal(await print.getAttribute('data-mic-direction'),'right');
  assert.deepEqual(errors,[]);await p.close();console.log('PASS '+engine+' '+width+': fixed cardinal headings, visible bounds, follow mode, bounded symbols, round base, persistence and export.');
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
