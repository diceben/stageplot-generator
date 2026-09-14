const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
(async()=>{
  const browser=await launchBrowser();
  try{
    const context=await browser.newContext({viewport:{width:390,height:700},hasTouch:true,isMobile:true,colorScheme:'light'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
    const url=process.env.APP_URL||'http://127.0.0.1:8881/';
    await page.goto(url);await page.locator('[data-project-add]').tap();await page.locator('#sp-np-create').tap();
    await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
    const savedBefore=await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1'));
    const background=()=>page.locator('#sp-settings-dialog').evaluate(el=>getComputedStyle(el).backgroundColor);
    const choose=async theme=>{await page.locator('[data-theme-choice="'+theme+'"]').tap();assert.equal(await page.locator('[data-theme-choice="'+theme+'"]').getAttribute('aria-pressed'),'true');};
    await page.locator('#sp-settings-gear').tap();const light=await background();
    await choose('dark');assert.equal(await page.locator('#sp-prototype').getAttribute('data-theme'),'dark');
    const dark=await background();assert.notEqual(dark,light,'Colors change before submitting settings');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:theme:v1')).theme),'dark');
    assert(await page.locator('#sp-settings-dialog').isVisible());
    await choose('light');assert.equal(await background(),light);
    await choose('auto');await page.emulateMedia({colorScheme:'dark'});assert.equal(await background(),dark,'System follows OS dark');
    await page.emulateMedia({colorScheme:'light'});assert.equal(await background(),light,'System follows OS light');
    await choose('dark');await page.emulateMedia({colorScheme:'light'});assert.equal(await background(),dark,'Manual dark overrides OS');
    await page.screenshot({path:artifactPath('theme-dark-'+engine+'.png')});
    await page.locator('#sp-settings-close').tap();
    assert.equal(await page.evaluate(()=>localStorage.getItem('stageplot-studio:drafts:v1')),savedBefore,'Theme changes do not modify projects');
    await page.reload();assert.equal(await page.locator('#sp-prototype').getAttribute('data-theme'),'dark');
    // Workspace and toolbar must be dark independently of the white stage deck.
    for(const [width,height] of [[390,800],[1440,900]]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(()=>document.querySelector('#sp-editor-floor svg')?.clientWidth>0);
      const colors=await page.evaluate(()=>{
        const style=selector=>getComputedStyle(document.querySelector(selector));
        return {outside:style('#sp-editor-floor [data-canvas-background]').fill,deck:style('#sp-editor-floor [data-stage-deck]').fill,panel:style('.sp-canvas-panel').backgroundColor,canvas:style('.sp-stage-canvas').backgroundColor,button:style('#sp-canvas-focus').color,buttonBackground:style('#sp-canvas-focus').backgroundColor,measure:style('#sp-editor-floor .sp-dimension').fill};
      });
      const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
      for(const key of ['outside','panel','canvas'])assert(luminance(colors[key])<.08,key+' is dark: '+colors[key]);
      assert.equal(colors.deck,'rgb(255, 255, 255)','Stage deck remains white');
      assert(luminance(colors.button)>.65,'Fit button text is light');
      assert(luminance(colors.measure)>.4,'Exterior dimensions stay readable');
      if(width>760){const dock=await page.locator('.sp-view-controls').evaluate(el=>getComputedStyle(el).backgroundColor);assert(luminance(dock)<.08,'Desktop tool dock is dark');}
      await page.screenshot({path:artifactPath('dark-workspace-'+engine+'-'+width+'.png')});
    }
    await page.setViewportSize({width:390,height:700});

    await page.locator('#sp-settings-gear').tap();assert.equal(await page.locator('[data-theme-choice="dark"]').getAttribute('aria-pressed'),'true');
    await choose('light');await page.locator('#sp-settings-cancel').tap();await page.reload();
    assert.equal(await page.locator('#sp-prototype').getAttribute('data-theme'),'light','Immediate choice survives closing settings');
    const other=await context.newPage();await other.goto(url);await other.locator('#sp-settings-gear').tap();await other.locator('[data-theme-choice="dark"]').tap();
    await page.waitForFunction(()=>document.querySelector('#sp-prototype').dataset.theme==='dark');
    await other.locator('[data-theme-choice="auto"]').tap();
    await page.waitForFunction(()=>!document.querySelector('#sp-prototype').hasAttribute('data-theme'));
    await page.reload();await page.locator('#sp-settings-gear').tap();assert.equal(await page.locator('[data-theme-choice="auto"]').getAttribute('aria-pressed'),'true');
    await choose('dark');await page.locator('#sp-settings-close').tap();await page.locator('#sp-show-print').tap();
    const paper=await page.locator('#sp-print .sp-paper').first().evaluate(el=>({background:getComputedStyle(el).backgroundColor,scheme:getComputedStyle(el).colorScheme}));
    assert.equal(paper.background,'rgb(255, 255, 255)');assert.equal(paper.scheme,'light');
    assert.deepEqual(errors,[]);await context.close();
    console.log('PASS '+engine+': instant theme switching, persistence, System/OS changes, tab sync, unchanged drafts and white print paper.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
