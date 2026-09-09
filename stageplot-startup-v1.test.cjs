const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8');
// Initial HTML must not expose the old setup view while runtime files are loading.
assert.match(html,/<section id="sp-setup"[^>]*\bhidden>/);
assert.match(html,/<div id="sp-prototype"[^>]*\bdata-booting[^>]*\binert/);
assert.ok(html.indexOf('id="sp-startup-style"')<html.indexOf('id="sp-prototype"'));
assert.doesNotMatch(html,/This visual revision opens on a sample arrangement|const defaultDrumConfig=/);
const callbackQueue=[],draws=[],context={view:'dashboard',frameQueued:false,requestAnimationFrame:fn=>callbackQueue.push(fn),updateSetup:()=>draws.push('setup'),editorCanvas:()=>draws.push('editor'),renderPrint:()=>draws.push('print')};
vm.createContext(context);vm.runInContext(html.match(/  function queueDraw\([^]*?\n  }/)[0],context);
for(const view of ['dashboard','project','routing']){context.view=view;context.queueDraw();assert.equal(callbackQueue.length,0,view+' must not schedule a hidden print render');}
for(const view of ['setup','editor','print']){context.view=view;context.queueDraw();context.queueDraw();assert.equal(callbackQueue.length,1);callbackQueue.shift()();assert.equal(draws.pop(),view);}
context.view='editor';context.queueDraw();context.view='routing';callbackQueue.shift()();assert.equal(draws.length,0,'Navigation before the next frame must cancel work for the previous view.');assert.equal(context.frameQueued,false);
function startup(){
 const nodes=new Map(['sp-startup','sp-startup-message','sp-startup-retry','sp-prototype'].map(id=>[id,{dataset:{},hidden:id==='sp-startup-retry',inert:id==='sp-prototype',setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];},addEventListener(k,fn){this[k]=fn;}}]));
 const events={},ctx={document:{getElementById:id=>nodes.get(id)},window:{localStorage:{getItem:()=>'{"theme":"dark"}'},location:{reload(){ctx.reloaded=true;}},addEventListener:(key,fn)=>events[key]=fn,removeEventListener:key=>delete events[key]}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('stageplot-startup-v1.js','utf8'),ctx);return {ctx,nodes,events};
}
const ready=startup();assert.equal(ready.nodes.get('sp-startup').dataset.theme,'dark');ready.ctx.window.StageplotStartup.ready();assert.equal(ready.nodes.get('sp-startup').hidden,true);assert.equal(ready.nodes.get('sp-prototype').inert,false);assert.equal(ready.events.error,undefined);
const failed=startup();failed.events.error({target:{tagName:'IMG'}});assert.equal(failed.nodes.get('sp-startup-retry').hidden,true,'Image failure must not block startup.');failed.events.error({target:{tagName:'SCRIPT'}});assert.equal(failed.nodes.get('sp-startup-retry').hidden,false);assert.equal(failed.nodes.get('sp-startup').role,'alert');assert.equal(failed.nodes.get('sp-prototype').inert,true);failed.nodes.get('sp-startup-retry').click();assert.equal(failed.ctx.reloaded,true);
console.log('PASS STARTUP: No setup flash, only visible views redraw, failed startup offers a retry without changing local data.');
