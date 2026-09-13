const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath,assertNoOverflow}=require('./browser-qa.cjs');
(async()=>{
  const browser=await launchBrowser();
  try{
    const page=await browser.newPage({viewport:{width:390,height:670},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
    await page.goto(process.env.APP_URL||'http://127.0.0.1:8881/');
    await page.locator('[data-project-add]').click();
    const width=page.locator('#sp-np-width'),plus=page.getByRole('button',{name:'Breite plus 50 Zentimeter'});
    const value=async()=>Number((await width.textContent()).replace(',','.'));
    assert.equal(await page.locator('#sp-newproject-dialog select').count(),0);
    await plus.tap();assert.equal(await value(),8.5,'One tap changes exactly 50 cm');
    await width.tap();assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'INPUT','Dimension needs no keyboard');
    const rect=await plus.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
    await page.waitForTimeout(680);await page.mouse.up();const held=await value();assert(held>=10,'Holding repeats');
    await page.waitForTimeout(350);assert.equal(await value(),held,'Releasing stops without an extra click');
    await page.locator('[data-np-source="catalog"]').tap();assert(await page.locator('#sp-np-venue-catalog').isVisible());
    await page.locator('[data-np-source="custom"]').tap();assert.equal(await value(),held,'Switching sources preserves dimensions');
    await page.locator('#sp-np-close').tap();await page.locator('[data-project-add]').tap();assert.equal(await value(),8);
    for(const [w,h] of [[390,670],[320,568],[740,390],[1440,900]]){
      await page.setViewportSize({width:w,height:h});
      await assertNoOverflow(page,'#sp-newproject-dialog','New project dialog');
      assert(await page.locator('#sp-np-preview-stage').isVisible(),'Preview stays visible on mobile');
      const controls=await page.locator('.sp-np-step').evaluateAll(list=>list.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height};}));
      controls.forEach(r=>assert(r.w>=44&&r.h>=44,'44 px controls'));
      if(h>=568){const lowest=await page.locator('.sp-np-dims').boundingBox(),actions=await page.locator('#sp-newproject-dialog > .sp-actions').boundingBox();assert(lowest.y+lowest.height<=actions.y,'Steppers remain fully above footer');}
      await page.locator('#sp-np-create').scrollIntoViewIfNeeded();
      const button=await page.locator('#sp-np-create').boundingBox();assert(button.y>=0&&button.y+button.height<=h,'Create remains reachable');
      await page.screenshot({path:artifactPath('new-project-'+engine+'-'+w+'.png')});
    }
    await page.setViewportSize({width:390,height:670});
    // A pointer cancellation must also stop the hold timer.
    const cancelRect=await plus.boundingBox();await page.mouse.move(cancelRect.x+22,cancelRect.y+22);await page.mouse.down();
    await plus.dispatchEvent('pointercancel',{pointerId:7,pointerType:'touch'});
    const cancelled=await value();await page.waitForTimeout(550);assert.equal(await value(),cancelled);await page.mouse.up();
    await page.evaluate(()=>{const button=document.querySelector('[data-dim="width"][data-np-step=".5"]');for(let i=0;i<65;i++)button.click();});
    assert.equal(await value(),30);assert(await plus.isDisabled(),'Maximum stops the plus button');
    const minus=page.getByRole('button',{name:'Breite minus 50 Zentimeter'});
    await page.evaluate(()=>{const button=document.querySelector('[data-dim="width"][data-np-step="-.5"]');for(let i=0;i<65;i++)button.click();});
    assert.equal(await value(),2);assert(await minus.isDisabled());
    await page.locator('#sp-np-close').tap();await page.locator('[data-project-add]').tap();
    await plus.tap();await page.getByRole('button',{name:'Tiefe minus 50 Zentimeter'}).tap();
    await page.locator('#sp-np-band').fill('Test Bühne');await page.locator('#sp-np-create').tap();
    await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.stage);
    assert.equal(stored.w,8.5);assert.equal(stored.d,4.5);assert.equal(stored.stairs,'none');assert.equal(stored.iem,'none');
    await page.reload();assert((await page.locator('#sp-editor-meta').textContent()).includes('8,5'));
    assert.deepEqual(errors,[]);
    console.log('PASS '+engine+': project preview, 50 cm tap/hold/release/cancel, limits, no dimension keyboard, mobile/desktop layout and persisted sizes.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
