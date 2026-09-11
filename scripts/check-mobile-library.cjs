// Browser regression: simulated visualViewport keyboard geometry, not a native iOS keyboard.
// Run against the preview with PLAYWRIGHT_MODULE; BROWSER=webkit selects Safari's engine.
const {engine,launchBrowser,artifactPath}=require('./browser-qa.cjs');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await launchBrowser();
  try{
    const page=await browser.newPage({viewport:{width:390,height:740},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.APP_URL||'http://127.0.0.1:8880/');
    await page.locator('.sp-project-add-card button').tap();await page.locator('#sp-np-create').tap();
    await page.waitForFunction(()=>document.querySelector('#sp-header-draft-status').textContent==='Lokal gespeichert');
    const viewport=async(height,top=0)=>{
      await page.evaluate(({height,top})=>{
        Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>height});
        Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>top});
        visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));
      },{height,top});
      await page.waitForTimeout(80);
    };
    for(const size of [{width:320,height:568},{width:390,height:740},{width:430,height:820},{width:844,height:390}]){
      await page.setViewportSize(size);await viewport(size.height);
      await page.locator('#sp-library-open').tap();
      // A previously selected category must not hide microphone search results.
      await page.locator('#sp-library-search').fill('');await page.locator('#sp-library-search').blur();
      await page.locator('[data-category="stage"]').tap();
      await page.locator('#sp-library-search').focus();
      await viewport(300);
      await page.locator('#sp-library-items [data-add]').first().tap();
      assert.equal(await page.locator('#sp-prototype').getAttribute('data-library-collapsed'),'true','A tap still selects after focusing an empty search');
      await viewport(size.height);await page.locator('#sp-placement-cancel').tap();
      await page.locator('#sp-library-open').tap();
      await page.locator('#sp-library-search').fill('mik');
      for(const [height,top] of [[300,0],[280,48],[360,12]]){
        await viewport(height,top);
        const geometry=await page.evaluate(()=>{
          const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();
          const items=document.querySelector('#sp-library-items');
          return {sheet:r('#sp-library'),search:r('#sp-library-search'),close:r('#sp-library-toggle'),results:r('#sp-library-items'),first:r('#sp-library-items button'),scrollHeight:items.scrollHeight,clientHeight:items.clientHeight};
        });
        assert(geometry.sheet.top>=top&&geometry.sheet.bottom<=top+height+1,'Sheet fits the visible viewport');
        assert(geometry.search.height>=44&&geometry.close.height>=44,'Search and close retain touch target sizes');
        assert(geometry.results.height>=96,'At least one full result row fits above the keyboard');
        assert(geometry.first.top>=geometry.search.bottom&&geometry.first.bottom<=geometry.results.bottom,'Results immediately follow the pinned search');
        assert.equal(await page.locator('.sp-mobile-editor-actions').isVisible(),false);
        assert.equal(await page.locator('#sp-inventory-open').isVisible(),false);
        assert.equal(await page.locator('#sp-category-tabs').isVisible(),false);
        assert.equal(await page.locator('#sp-library-items [data-add="mic"]').count(),1);
        const searchBefore=geometry.search;
        await page.locator('#sp-library-items').evaluate(el=>el.scrollTop=el.scrollHeight);
        assert.deepEqual(await page.locator('#sp-library-search').evaluate(el=>el.getBoundingClientRect().toJSON()),searchBefore,'Scrolling results keeps search pinned');
        if(geometry.scrollHeight>geometry.clientHeight)assert(await page.locator('#sp-library-items').evaluate(el=>el.scrollTop>0));
        await page.locator('#sp-library-items').evaluate(el=>el.scrollTop=0);
      }
      if(size.width===390){
        await page.locator('#sp-library-search').fill('stag');await viewport(344);
        const layout=await page.locator('#sp-library-items').evaluate(el=>{
          const list=el.getBoundingClientRect(),cards=[...el.querySelectorAll('.sp-library-card')].map(card=>{
            const r=card.getBoundingClientRect(),button=card.querySelector('.sp-library-item'),picture=button.querySelector('svg,img').getBoundingClientRect(),name=button.querySelector('span').getBoundingClientRect(),star=card.querySelector('.sp-library-favorite').getBoundingClientRect();
            return {top:r.top,bottom:r.bottom,height:r.height,pictureRight:picture.right,nameLeft:name.left,nameRight:name.right,nameBottom:name.bottom,detailTop:button.querySelector('.sp-library-model-count,.sp-library-lock-label')?.getBoundingClientRect().top??null,starLeft:star.left,starWidth:star.width,starHeight:star.height};
          });return {listBottom:list.bottom,cards};
        });
        assert(layout.cards.filter(c=>c.bottom<=layout.listBottom).length>=4,'Four complete search results fit above a keyboard leaving 344 px');
        for(const c of layout.cards){assert(c.height<=60,JSON.stringify(c));assert(c.pictureRight<=c.nameLeft);assert(c.nameRight<=c.starLeft);if(c.detailTop!==null)assert(c.nameBottom<=c.detailTop,'Model count stays below the name');assert(c.starWidth>=44&&c.starHeight>=44);}
        const star=page.locator('#sp-library-items [data-library-favorite]').first();await star.tap();
        assert.equal(await page.locator('#sp-prototype').getAttribute('data-library-collapsed'),'false','Favoriting does not select a result');
        assert.equal(await page.locator('#sp-library-search').inputValue(),'stag');
        await page.locator('#sp-library-search').focus();await page.locator('#sp-library-search').press('Enter');
        assert.equal(await page.locator('#sp-library-search').evaluate(el=>el===document.activeElement),false,'Done dismisses input focus');
        assert.equal(await page.locator('#sp-library-search').inputValue(),'stag');
        if(process.env.QA_SCREENSHOT)await page.screenshot({path:process.env.QA_SCREENSHOT,clip:{x:0,y:0,width:390,height:344}});
        await page.locator('#sp-library-search').fill('mik');
      }
      await page.locator('#sp-library-items [data-add="mic"]').tap();
      assert.equal(await page.locator('#sp-prototype').getAttribute('data-library-collapsed'),'true');
      assert.equal(await page.locator('#sp-library-search').evaluate(el=>el===document.activeElement),false,'Selection releases keyboard focus');
      await viewport(size.height);
      await page.locator('#sp-placement-cancel').tap();
      await page.locator('#sp-library-open').tap();
      assert.equal(await page.locator('#sp-library-search').inputValue(),'mik','Reopening preserves search');
      await page.locator('#sp-library-search').fill('zzzz-no-instrument');
      assert(await page.locator('.sp-library-empty').isVisible());
      await page.locator('#sp-library-search').fill('');await page.locator('#sp-library-search').blur();
      await page.locator('#sp-category-tabs').waitFor({state:'visible'});
      assert.equal(await page.locator('[data-category="stage"]').getAttribute('aria-pressed'),'true','Clearing restores chosen category');
      await page.locator('#sp-library-search').focus();await viewport(300,24);
      await page.locator('#sp-library-toggle').tap();
      assert.equal(await page.locator('#sp-library-search').evaluate(el=>el===document.activeElement),false,'Closing releases keyboard focus');
      await viewport(size.height);
      assert(await page.locator('.sp-mobile-editor-actions').isVisible());
    }
    // Desktop keeps its stage and navigation visible with an ordinary sidebar.
    await page.setViewportSize({width:1440,height:900});await viewport(900);
    await page.locator('#sp-library-search').fill('mik');
    assert(await page.locator('#sp-prototype > .sp-header').isVisible());
    assert(await page.locator('#sp-inventory-open').isVisible());
    assert.equal(await page.locator('#sp-prototype').evaluate(el=>getComputedStyle(el).position),'relative');
    assert.deepEqual(errors,[]);
    console.log('PASS '+engine+': mobile library 320–844 px, keyboard height/offset simulation, pinned search, scrollable results, global search, focus release, query/category retention, empty state and desktop layout.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
