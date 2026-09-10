const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('stageplot-studio.html','utf8');
for(const token of ['function stageboxWorkbenchMarkup(','function openAudioSocket(','function planAudioPatchAction(','data-stagebox-select','data-patch-source','data-patch-conflict','sp-patch-undo','sp-stagebox-settings-dialog'])assert(html.includes(token),token);
assert(!html.includes('function applyStageboxPatch('),'The second assignment controller must stay removed.');
assert.match(html,/renderStageboxSurface\(surface\);openAudioSocket\(/);
assert.match(html,/\$\('sp-stagebox-io-body'\)\.innerHTML=stageboxWorkbenchMarkup\(\[box\],\{dialog:true\}\)/);
assert(!/<aside|stageboxDetailMarkup/.test(html.match(/  function stageboxWorkbenchMarkup\([^]*?\n  }/)[0]));
assert.match(html,/button\[data-active-port="true"\][^}]*border-color:#f04c9a/);
console.log('PASS V72: one shared connection controller, stable hardware surface, physical pink sockets and separate device settings.');
