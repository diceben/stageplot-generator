const assert=require('node:assert/strict');
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
(async()=>{
  const browser=await launchBrowser();
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.APP_URL||'http://127.0.0.1:8881/');
    await page.locator('[data-project-add]').click();await page.locator('#sp-np-band').fill('PDF-Prüfung');await page.locator('#sp-np-create').click();
    await page.waitForFunction(()=>localStorage.getItem('stageplot-studio:workspace:v1'));
    // Isolated fixture: raster guitar plus a composite drum kit with nested SVG definitions.
    await page.evaluate(()=>{
      const workspace=JSON.parse(localStorage.getItem('stageplot-studio:workspace:v1')),drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=workspace.entry;
      entry.document.objects=[{id:'print-kit',type:'drums',x:4.5,y:2.3,angle:0,label:'Schlagzeug'},
        {id:'print-guitar',type:'guitar-jazzmaster',x:2,y:3.5,angle:65,label:'Jazzmaster'}];
      drafts.entries[drafts.entries.findIndex(item=>item.id===entry.id)]=entry;
      localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify(workspace));localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));
    });
    await page.reload();await page.locator('#sp-show-print').click();await page.locator('[data-pdf-preset="full"]').click();
    await page.locator('#sp-export-png').click();await page.locator('#sp-upgrade-demo').click();
    // Observe the app's print entry point without opening an OS dialog in CI.
    await page.evaluate(()=>{window.print=()=>{window.printRequested=true;};});
    await page.locator('#sp-export-png').click();await page.waitForFunction(()=>window.printRequested===true);
    const report=page.locator('#sp-report-pages');assert.equal(await report.locator('.sp-report-page').count(),2);
    const artwork=await report.evaluate(host=>[...host.querySelectorAll('svg')].map(svg=>({
      missing:[...svg.querySelectorAll('use')].map(node=>node.getAttribute('href')).filter(href=>href?.startsWith('#')&&!svg.querySelector('[id="'+href.slice(1)+'"]')),
      images:[...svg.querySelectorAll('image')].map(node=>node.getAttribute('href'))
    })));
    assert(artwork.length>0);assert(artwork.every(svg=>svg.missing.length===0),'Each printed SVG owns its referenced definitions');
    assert(artwork.some(svg=>svg.images.some(url=>url?.includes('guitar-jazzmaster-illustrated-v1.png'))),'Generated guitar is present in print artwork');
    assert((await report.innerText()).includes('Drums · Kick In'));assert((await report.innerText()).includes('Jazzmaster'));
    await page.emulateMedia({media:'print'});await page.screenshot({path:artifactPath('print-assets-'+engine+'.png'),fullPage:true});
    if(engine!=='webkit'){
      const pdf=await page.pdf({path:artifactPath('print-assets.pdf'),preferCSSPageSize:true,printBackground:true});
      assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,2,'Two actual PDF pages, without blank overflow sheets');
      assert(pdf.length>20000,'PDF contains embedded artwork');
    }
    assert.deepEqual(errors,[]);console.log('PASS '+engine+': self-contained drum/guitar print artwork, image preparation, complete channel list and two-page PDF layout.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
