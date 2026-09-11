const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
(async()=>{
  const browser=await launchBrowser();
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
    await page.goto(process.env.APP_URL||'http://127.0.0.1:8880/');
    await page.locator('#sp-upgrade-open').click();
    await page.locator('[data-project-add]').click();
    await page.locator('#sp-np-band').fill('QA Menüaktionen');await page.locator('#sp-np-create').click();
    await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
    const drafts=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')));
    const initial=await drafts();
    // Settings restore keyboard focus to the actual opener and persist across reload.
    await page.locator('#sp-settings-gear').focus();await page.keyboard.press('Enter');
    await page.locator('[data-theme-choice="dark"]').click();
    await page.locator('#sp-settings-form [type="submit"]').click();
    assert(await page.locator('#sp-settings-gear').evaluate(el=>el===document.activeElement));
    await page.reload();assert.equal(await page.locator('#sp-prototype').getAttribute('data-theme'),'dark');
    await page.locator('#sp-stage-clear').focus();await page.keyboard.press('Enter');
    assert(await page.locator('#sp-clear-dialog').isVisible());await page.locator('#sp-clear-cancel').click();
    assert(await page.locator('#sp-stage-clear').evaluate(el=>el===document.activeElement));
    assert.equal((await drafts()).lastId,initial.lastId,'Cancel preserves the project');
    await page.locator('#sp-stage-iem').click();
    assert(await page.locator('#sp-setup').isVisible()||await page.locator('#sp-stage-iem').getAttribute('aria-pressed')==='true','IEM action opens setup or selects the area');
    await page.locator('.sp-steps [data-view="project"]').click();
    const download=page.waitForEvent('download');await page.locator('#sp-project-export').click();
    const backup=await download,payload=JSON.parse(await fs.readFile(await backup.path(),'utf8'));
    assert.match(backup.suggestedFilename(),/\.json$/);assert.equal(payload.document.stage.title,'QA Menüaktionen');
    await page.locator('#sp-project-saveas').click();
    await page.waitForFunction(id=>JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')).lastId!==id,initial.lastId);
    const copied=await drafts();assert.equal(copied.entries.length,2);assert(copied.entries.some(entry=>entry.id===initial.lastId));
    await page.reload();assert.equal((await drafts()).entries.length,2);
    await page.locator('.sp-steps [data-view="dashboard"]').click();
    const imported=structuredClone(payload);imported.name='QA Import';imported.document.stage.title='QA Import';imported.document.stage.project.name='QA Import';
    const chooser=page.waitForEvent('filechooser');await page.locator('#sp-project-import').click();
    await(await chooser).setFiles({name:'qa-import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
    await page.locator('#sp-setup-confirm-accept').click();
    await page.waitForFunction(()=>document.querySelector('#sp-project-heading').textContent.includes('QA Import'));
    await page.screenshot({path:artifactPath('project-actions-'+engine+'.png')});
    assert.deepEqual(errors,[]);console.log('PASS '+engine+': settings/focus, clear cancel, IEM, backup, independent copy, reload and import.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
