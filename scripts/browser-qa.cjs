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
