const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');const assert=require('node:assert/strict');

(async()=>{const browser=await launchBrowser();try{
 const p=await browser.newPage({viewport:{width:390,height:670},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
 await p.goto(process.env.APP_URL||'http://127.0.0.1:8880/');await p.locator('#sp-upgrade-open').tap();await p.locator('[data-project-add]').tap();await p.locator('#sp-np-create').tap();
 await p.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
 await p.evaluate(()=>{const drafts=JSON.parse(localStorage.getItem('stageplot-studio:drafts:v1')),entry=drafts.entries.find(e=>e.id===drafts.lastId);entry.document.objects=[{id:'station-1',type:'drums',x:4,y:1.5,angle:0},{id:'station-2',type:'laptop',x:2,y:3,angle:15},{id:'station-3',type:'mic',x:4,y:4,angle:0}];localStorage.setItem('stageplot-studio:drafts:v1',JSON.stringify(drafts));localStorage.setItem('stageplot-studio:workspace:v1',JSON.stringify({version:1,entry}));});
 await p.reload();await p.locator('.sp-steps [data-view="dashboard"]').tap();
 const card=p.locator('[data-project-open-card]').first();await card.waitFor();
 const layout=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {add:r('.sp-project-add-card'),search:r('#sp-project-search'),card:r('.sp-project-card'),footer:r('.sp-footer')};});console.log(engine,layout);
 assert(layout.add.top<layout.search.top&&layout.add.top<layout.card.top,'New project stays before search and projects');
 assert(layout.card.bottom<=layout.footer.top+2,'A complete project card fits on a 390×670 screen');
 assert.equal(await card.evaluate(el=>getComputedStyle(el).borderTopStyle),'solid');
 await p.screenshot({path:artifactPath('project-dashboard-'+engine+'.png')});
 await p.locator('#sp-project-search').fill('no-project-matches');assert.equal(await p.locator('[data-project-open-card]').count(),0);assert(await p.locator('[data-project-add]').isVisible());
 await p.locator('#sp-project-search').fill('');await p.locator('#sp-project-search').blur();
 await card.locator('[data-project-settings]').tap();assert(await p.locator('#sp-project').isVisible());await p.locator('.sp-steps [data-view="dashboard"]').tap();
 await card.locator('[data-project-open]').tap();assert(await p.locator('#sp-editor').isVisible());await p.locator('.sp-steps [data-view="dashboard"]').tap();
 await card.locator('[data-project-id-copy]').tap();assert(await p.locator('#sp-dashboard').isVisible(),'ID copy does not open the editor');
 const download=p.waitForEvent('download');await card.locator('[data-project-download]').tap();assert.match((await download).suggestedFilename(),/json$/);
 for(const width of [320,430,760,1440]){await p.setViewportSize({width,height:900});assert(await p.locator('#sp-dashboard').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'No overflow at '+width);}
 await p.setViewportSize({width:390,height:670});await p.locator('#sp-dashboard').evaluate(el=>el.scrollTop=0);
 await p.locator('#sp-prototype').evaluate(el=>el.dataset.theme='dark');await p.screenshot({path:artifactPath('project-dashboard-dark-'+engine+'.png')});
 await p.locator('[data-project-add]').tap();await p.locator('#sp-np-band').fill('Symphonie-Orchester mit einem sehr langen Projektnamen');await p.locator('#sp-np-location').fill('Großer Saal – Generalprobe');await p.locator('#sp-np-create').tap();
 await p.locator('.sp-steps [data-view="dashboard"]').tap();assert.equal(await p.locator('[data-project-open-card]').count(),2);
 await p.reload();assert.equal(await p.locator('[data-project-open-card]').count(),2,'Both projects survive reload');
 for(const width of [320,390,1440]){await p.setViewportSize({width,height:740});assert(await p.locator('#sp-dashboard').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 await p.setViewportSize({width:390,height:670});await p.locator('#sp-project-search').fill('Symphonie');assert.equal(await p.locator('[data-project-open-card]').count(),1);await p.locator('#sp-project-search').blur();
 await p.screenshot({path:artifactPath('project-dashboard-long-'+engine+'.png')});
 assert.deepEqual(errors,[]);console.log('PASS '+engine+': mobile card visibility, new-project ordering, search/empty state, settings/open, ID copy, backup and 320–1440px layout.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
