// Optional browser regression check. Requires Playwright and a running preview.
// APP_URL selects local/live; BROWSER=webkit uses the Safari engine.
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const engine=process.env.BROWSER||'chrome',url=process.env.APP_URL||'http://127.0.0.1:8880/';
(async()=>{
  const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));
  try{
    const page=await browser.newPage({viewport:{width:390,height:640},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.locator('.sp-project-add-card button').tap();await page.locator('#sp-np-create').tap();
    await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
    await page.evaluate(()=>{
      const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1'));
      const entry=drafts.entries.find(e=>e.id===drafts.lastId);
      entry.document.objects=[{id:'station-1',type:'laptop',x:8.2,y:2,angle:0,label:'Playback außerhalb'}];
      localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));
      localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));
    });
    await page.reload();await page.locator('.sp-steps [data-view="editor"]').tap();
    const warning=page.locator('#sp-stage-warning');await warning.waitFor({state:'visible'});
    const originalMessage=await warning.innerText();assert.match(originalMessage,/über den Bühnenrand/);
    const measure=()=>warning.evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),lineHeight:parseFloat(getComputedStyle(el).lineHeight),padding:parseFloat(getComputedStyle(el).paddingTop)+parseFloat(getComputedStyle(el).paddingBottom),width:innerWidth}));
    if(process.env.REPRO_ONLY){console.log(engine,await measure());await page.screenshot({path:'/private/tmp/mobile-warning-before-'+engine+'.png'});return;}
    for(const size of [{width:320,height:568},{width:390,height:640},{width:430,height:740},{width:844,height:390}]){
      await page.setViewportSize(size);await page.waitForTimeout(100);
      const r=await measure();assert(r.rect.height<90,'Warning must be a compact notice: '+JSON.stringify(r));
      assert(r.rect.left>=0&&r.rect.right<=size.width,'Warning stays inside the phone width');
      const actions=await page.locator('.sp-mobile-editor-actions').boundingBox();assert(r.rect.bottom<actions.y,'Warning does not cover the bottom actions');
      await page.locator('#sp-library-open').tap();await page.locator('#sp-library-toggle').tap();
      await page.locator('#sp-mobile-tools-open').tap();await page.locator('#sp-mobile-tools-close').tap();
    }
    await page.setViewportSize({width:390,height:640});
    await page.locator('#sp-settings-gear').tap();await page.locator('[data-theme-choice="dark"]').tap();await page.locator('#sp-settings-form button[type="submit"]').tap();
    assert((await measure()).rect.height<90);
    // Multiple warning lines still size to their content; do not truncate messages.
    await warning.evaluate(el=>el.textContent='2 Bausteine ragen über den Bühnenrand. Ein Baustein überlappt den IEM-Bereich. Bitte die Positionen überprüfen.');
    const long=await measure();assert(long.rect.height<130&&long.rect.height>25);
    const before=await page.locator('#sp-editor-floor svg').boundingBox();
    await warning.evaluate(el=>el.hidden=true);assert.equal(await warning.isVisible(),false);
    assert.deepEqual(await page.locator('#sp-editor-floor svg').boundingBox(),before,'Showing/hiding warning must not refit the canvas');
    await warning.evaluate((el,message)=>{el.hidden=false;el.textContent=message;},originalMessage);
    await page.locator('#sp-canvas-focus').tap();await warning.waitFor({state:'visible'});
    if(process.env.QA_SCREENSHOT)await page.screenshot({path:process.env.QA_SCREENSHOT});
    assert.deepEqual(errors,[]);
    console.log('PASS '+engine+': real offstage warning, 320–844 px, compact multiline notice, dark mode, reachable panels, stable canvas.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
