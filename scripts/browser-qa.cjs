// Shared local/CI browser setup. Tests always use isolated browser contexts.
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {mkdirSync}=require('node:fs');
const path=require('node:path');
const engine=process.env.BROWSER||'chromium';
function launchBrowser(){
  if(engine==='webkit')return webkit.launch({headless:true});
  if(!['chromium','chrome'].includes(engine))throw new Error('Unsupported BROWSER: '+engine);
  return chromium.launch({headless:true,...(engine==='chrome'?{channel:'chrome'}:{})});
}
function artifactPath(name){
  const directory=path.resolve(process.env.QA_ARTIFACT_DIR||'test-results');
  mkdirSync(directory,{recursive:true});return path.join(directory,name);
}
module.exports={engine,launchBrowser,artifactPath};

// Viewport changes can be acknowledged before WebKit's next layout pass.
// Wait for the same strict geometry assertion; capture evidence if it stays wrong.
async function assertNoOverflow(page,selector,label){
  try{
    await page.waitForFunction(selector=>{const el=document.querySelector(selector);return el&&el.scrollWidth<=el.clientWidth+1;},selector,{timeout:3000});
  }catch(error){
    const geometry=await page.locator(selector).evaluate(el=>{
      const bounds=el.getBoundingClientRect();
      return {clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,bounds:bounds.toJSON(),overflow:[...el.querySelectorAll('*')].filter(node=>node.getBoundingClientRect().right>bounds.right+1).slice(0,15).map(node=>({tag:node.tagName,id:node.id,className:String(node.className),rect:node.getBoundingClientRect().toJSON()}))};
    });
    console.error(label,JSON.stringify(geometry,null,2));await page.screenshot({path:artifactPath('overflow-'+engine+'.png')});throw error;
  }
}
module.exports.assertNoOverflow=assertNoOverflow;
