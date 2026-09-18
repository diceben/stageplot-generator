const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
const app=process.env.APP_URL||'http://127.0.0.1:8897/';
(async()=>{
  const browser=await launchBrowser();
  try{for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:900},isMobile:width<900,hasTouch:width<900});
    page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(app);await page.locator('#sp-upgrade-open').click();await page.locator('[data-project-add]').click();await page.locator('#sp-np-create').click();
    // Open a saved project containing a legacy stage-edge staircase.
    await page.waitForFunction(()=>localStorage.getItem('stageplot-studio:workspace:v1'));
    await page.evaluate(()=>{const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=drafts.entries.find(e=>e.id===drafts.lastId);entry.document.stage.stairs='left';localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));});
    await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();
    const edge='#sp-editor-floor [data-stairs-id="stairs-zone"]';
    await page.locator(edge).click();
    for(const [field,value] of [['steps','8'],['width','1.8'],['depth','1.6']]){
      const control=page.locator('#sp-stairs-'+field+'-popover');await control.fill(value);await control.press('Tab');
    }
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.stage.stairsSteps===8);
    assert.equal(await page.locator(edge+' [data-stair-step]').count(),8);
    assert.equal(await page.locator(edge+' [data-generated-stairs]').getAttribute('data-stair-width'),'1.8');
    assert.equal(await page.locator(edge+' [data-generated-stairs]').getAttribute('data-stair-depth'),'1.6');
    const shades=await page.locator(edge+' [data-stair-shade]').evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute('opacity'))));
    assert.equal(shades.at(-1),.27);assert(shades.every((v,i)=>i===0||v>shades[i-1]));
    // Exercise the width-reset handler directly; the existing popover covers this SVG handle.
    await page.locator(edge+' [data-stairs-reset]').dispatchEvent('pointerdown',{pointerId:1,pointerType:'mouse',button:0,isPrimary:true});
    await page.waitForFunction(()=>document.querySelector('#sp-editor-floor [data-stairs-id="stairs-zone"] [data-generated-stairs]')?.getAttribute('data-stair-width')==='1.2');
    if(await page.locator('#sp-library-open').isVisible())await page.locator('#sp-library-open').click();
    await page.locator('#sp-library-search').fill('Bühnentreppe');await page.locator('[data-add="stage-stairs"]').first().click();await page.keyboard.press('Enter');
    if(await page.locator('#sp-inspector-open').isVisible())await page.locator('#sp-inspector-open').click();
    await page.locator('#sp-properties-tab').click();
    for(const [id,value] of [['sp-object-width','240'],['sp-object-depth','140'],['sp-access-steps','7']]){
      const control=page.locator('#'+id);await control.fill(value);await control.press('Tab');
    }
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.objects.some(o=>o.type==='stage-stairs'&&o.width===2.4&&o.depth===1.4&&o.steps===7));
    await page.waitForFunction(()=>{const use=document.querySelector('#sp-editor-floor [data-stage-access="stairs"] use'),art=use&&document.getElementById(use.getAttribute('href').slice(1))?.querySelector('[data-generated-stairs]');return art?.getAttribute('data-step-count')==='7'&&art.getAttribute('data-stair-width')==='2.4'&&art.getAttribute('data-stair-depth')==='1.4';});
    const freeArt=await page.locator('#sp-editor-floor [data-stage-access="stairs"] use').evaluate(use=>{
      const root=document.getElementById(use.getAttribute('href').slice(1)),art=root.querySelector('[data-generated-stairs]'),corner=art.querySelector('[data-stair-image="top-left"]');
      return {steps:art.querySelectorAll('[data-stair-step]').length,width:art.getAttribute('data-stair-width'),depth:art.getAttribute('data-stair-depth'),cornerWidth:corner.getAttribute('width'),ids:[...root.querySelectorAll('[id]')].map(n=>n.id)};
    });
    assert.equal(freeArt.steps,7);assert.equal(freeArt.width,'2.4');assert.equal(freeArt.depth,'1.4');assert.equal(freeArt.cornerWidth,'4.5');
    await page.screenshot({path:artifactPath('stairs-editor-'+engine+'-'+width+'.png')});
    await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();
    assert.equal(await page.locator(edge+' [data-stair-step]').count(),8);
    await page.locator('#sp-venue-open').click();const venue=page.locator('.sp-venue-dialog');
    await venue.locator('[data-action="add"][data-kind="stairs"]').click();
    if(width<900)await venue.locator('[data-action="toggle-details"]').first().click();
    for(const [field,value] of [['w','1.7'],['d','1.5'],['steps','6'],['angle','37'],['x','6'],['y','1']]){
      const control=venue.locator('[data-prop="'+field+'"]');await control.fill(value);await control.press('Tab');
    }
    await page.waitForFunction(()=>[...document.querySelectorAll('.sp-venue-dialog [data-generated-stairs]')].some(n=>n.getAttribute('data-step-count')==='6'&&n.getAttribute('data-stair-width')==='1.7'));
    await venue.locator('[data-action="apply"]').click();await venue.waitFor({state:'detached'});
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')).entry.document.stage.geometry?.parts.some(p=>p.kind==='stairs'&&p.steps===6&&p.angle===37));
    assert(await page.locator('#sp-editor-floor [data-generated-stairs][data-step-count="8"]').count()>0,'Converting legacy stairs to house geometry preserves their step count');
    await page.locator('#sp-show-print').click();await page.locator('[data-export-intent="image"]').click();
    const report=page.locator('#sp-report-pages');
    assert(await report.locator('[data-generated-stairs]').count()>=2,'Free and house stairs appear in export');
    const missing=await report.evaluate(host=>[...host.querySelectorAll('svg')].flatMap(svg=>[...svg.querySelectorAll('[fill]')].filter(n=>n.getAttribute('fill').startsWith('url(#')).map(n=>n.getAttribute('fill').slice(5,-1)).filter(id=>!svg.querySelector('[id="'+id+'"]'))));
    assert.deepEqual(missing,[],'Each export contains its own texture and shadow definitions');
    await page.screenshot({path:artifactPath('stairs-export-preview-'+engine+'-'+width+'.png')});
    const downloadPromise=page.waitForEvent('download');await page.locator('#sp-export-png').click();const download=await downloadPromise;
    assert.equal(await download.failure(),null);await download.saveAs(artifactPath('stairs-export-'+engine+'-'+width+'.png'));
    await page.reload();await page.locator('.sp-steps [data-view="editor"]').click();
    assert(await page.locator('#sp-editor-floor [data-generated-stairs][data-step-count="6"]').count()>0,'Saved house stairs retain their artwork');
    await page.context().setOffline(true);await page.locator('#sp-show-print').click();await page.locator('[data-export-intent="image"]').click();
    assert(await page.locator('#sp-report-pages [data-generated-stairs]').count()>=2,'Preview works offline');
    assert.deepEqual(errors,[]);await page.close();
    console.log('PASS '+engine+' '+width+': generated stairs, independent dimensions/count, width animation, fixed fittings, monotone shading, saved drafts, rotated venue stairs, self-contained textures and PNG export.');
  }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
