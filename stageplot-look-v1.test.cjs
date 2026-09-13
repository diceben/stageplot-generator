const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const look=require('./stageplot-look-v1.js'),html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'))[0];
const context={font:'11px sans-serif',measureText(value){const size=Number(this.font.match(/([\d.]+)px/)[1]);return {width:value.length*size*.63};}};
for(const scale of [22,65,110,220]){
  const lines=['Playback-Laptop · Reserve','16 Outs · Dante'],metrics=look.labelMetrics(lines,1,scale,context);
  assert.equal(context.font,'11px sans-serif','The Live look must restore the shared measuring context for legacy labels.');
  assert.ok(metrics.width>=lines[0].length*metrics.fontSize*.63+metrics.padX*2);
  assert.ok(metrics.height>=metrics.padY+metrics.fontSize+metrics.lineHeight,'Wrapped labels must retain their final baseline.');
}
const ctx={objectSize:o=>({w:o.width,d:o.depth}),stairStates:s=>(s.steps||[]).map((record,id)=>({record,id})),stairsGeometry:(s,id)=>s.steps[id],iemRect:s=>s.iemZone||null,compiledVenue:s=>({bounds:s.bounds}),editorFit:null};
vm.createContext(ctx);vm.runInContext(['workspaceBounds','editorWorkspaceBounds','exportArtworkBounds'].map(extract).join('\n'),ctx);
const stage={w:8,d:5,steps:[{x:8,y:3,w:3,d:1.2},{x:3.4,y:5,w:1.2,d:2}]};
const box=ctx.workspaceBounds(stage,[],true);
assert.equal(box.maxX,11.2,'A deep side stair must be included in the Live export.');assert.equal(box.maxY,7.2);
const offstage={x:-2,y:2,width:2,depth:1,angle:90};assert.equal(ctx.workspaceBounds(stage,[offstage],true).minX,-2.7);
ctx.editorWorkspaceBounds(stage,[],true);offstage.x=-20;
assert.equal(ctx.editorWorkspaceBounds(stage,[offstage],true).minX,-.2,'Moving an object must not silently refit the editing camera.');
assert.notEqual(ctx.editorWorkspaceBounds(stage,[offstage],false).minX,-.2,'Changing look must compute the corresponding fit.');
const view={x:0,y:0,width:1024,height:768};
assert.deepEqual(JSON.parse(JSON.stringify(ctx.exportArtworkBounds({dataset:{stageLook:'live'},viewBox:{baseVal:view},children:[]}))),view,'Image export keeps the designed heading and surrounding margins.');
console.log('PASS LIVE LOOK: label measurement, unchanged text context, complete offstage extents, stable camera and uncropped export frame.');
