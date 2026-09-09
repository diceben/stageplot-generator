const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{checked:false,textContent:'',querySelector:()=>({})});return nodes.get(id);};
const ctx={$,stage:{title:'Konzert',projectId:'SP-TEST',project:{artist:'Band',venue:'Saal',date:'2026-10-16'},routing:{inputs:[],outputs:[]}},objects:[],byId:{},imageExportPlan:()=>({pixelWidth:2048,pixelHeight:1448}),
 normalizeProjectInfo:p=>p,projectIdentity:id=>id,projectPrintMarkup:()=>'<p>Kontakte</p>',productionLines:()=>['Strom: 2 × Schuko 230 V'],
 esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;'),StageplotPrint:{render(host,report){ctx.report=report;return 3;}},
 DOMPoint:class {constructor(x,y){this.x=x;this.y=y;}matrixTransform(m){return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};}}};
vm.createContext(ctx);vm.runInContext(['technicalExportNeedsPro','renderPrintPages','exportArtworkBounds'].map(extract).join('\n'),ctx);
$('sp-export-format').value='pdf';$('sp-print-measures').checked=true;$('sp-print-dimensions').textContent='8 × 5 m';
ctx.renderPrintPages('');assert.equal(ctx.report.sections.length,0);assert.equal(ctx.report.id,'SP-TEST');assert.match(ctx.report.subtitle,/16\.10\.2026 · 8 × 5 m/);
assert.equal($('sp-export-preview-title').textContent,'3 Seiten · A4 quer');assert.equal(ctx.technicalExportNeedsPro(),false);
for(const id of ['sp-print-inputs','sp-print-routing','sp-print-notes','sp-print-legend-toggle'])$(id).checked=true;
ctx.renderPrintPages('');assert.equal(ctx.report.sections.length,0,'Leere Listen, Legenden und Notizen erzeugen keine Platzhalterseiten.');
ctx.renderPrintPages('Erster Absatz\n\n<script>Ein Hinweis</script>');
assert.equal(ctx.report.sections.length,1);assert.equal(ctx.report.sections[0].html,'<p>Erster Absatz</p><p>&lt;script>Ein Hinweis&lt;/script></p>');
assert.equal(ctx.technicalExportNeedsPro(),true);
$('sp-print-measures').checked=false;ctx.renderPrintPages('');assert.doesNotMatch(ctx.report.subtitle,/8 × 5 m/);
$('sp-export-format').value='png-2k';ctx.renderPrintPages('');
assert.equal($('sp-export-preview-title').textContent,'3 Seiten · 2K · 2048 × 1448 px');
assert.equal($('sp-export-png').textContent,'3 Bilder als ZIP herunterladen');
const exportModel=require('./stageplot-export-v42.js').createStageplotExportV42();
for(const [resolution,width,height] of [['hd',1280,905],['2k',2048,1448],['4k',3840,2715]]){
 const plan=exportModel.createPngPlan({width:297,height:210},{resolution});
 assert.equal(plan.pixelWidth,width);assert.equal(plan.pixelHeight,height);assert.equal(plan.fillBackground,true);
 const enlarged=exportModel.createPngPlan({width:594,height:420},{resolution,background:'transparent'});
 assert.equal(enlarged.pixelWidth,width,'Auflösung hängt nicht von Vorschaugröße oder Zoom ab.');assert.equal(enlarged.pixelHeight,height);assert.equal(enlarged.fillBackground,false);
}
assert.throws(()=>exportModel.createPngPlan({width:297,height:210},{resolution:'8k'}),/HD, 2K oder 4K/);
assert.equal(exportModel.createPngPlan({width:300,height:200},{scale:2}).pixelWidth,600,'Bestehende Export-Helfer bleiben kompatibel.');
const zipContext={TextEncoder,Uint8Array};vm.createContext(zipContext);
vm.runInContext(html.slice(html.indexOf('  const crcTable='),html.indexOf('  function exportRoutingXlsx(')),zipContext);
const pngBytes=new Uint8Array([137,80,78,71,13,10,26,10,0,255,128]);
zipContext.files={'Bühne-Seite-01.png':pngBytes,'Hinweis.txt':'Äöü'};
const archive=Buffer.from(vm.runInContext('zipStore(files)',zipContext));
let offset=0;
for(const [name,expected] of Object.entries(zipContext.files)){
 assert.equal(archive.readUInt32LE(offset),0x04034b50);
 const length=archive.readUInt32LE(offset+18),nameLength=archive.readUInt16LE(offset+26),start=offset+30+nameLength;
 assert.equal(archive.subarray(offset+30,start).toString('utf8'),name);
 assert.deepEqual(archive.subarray(start,start+length),Buffer.from(expected),'ZIP erhält PNG-Binärdaten und bestehende Textdateien unverändert.');
 offset=start+length;
}
assert.equal(archive.readUInt32LE(offset),0x02014b50);
const viewBox={baseVal:{x:-100,y:-100,width:200,height:200}};
const rotated={tagName:'g',matches:()=>false,getBBox:()=>({x:10,y:10,width:20,height:10}),transform:{baseVal:{consolidate:()=>({matrix:{a:0,b:1,c:-1,d:0,e:0,f:0}})}}};
const crop=ctx.exportArtworkBounds({viewBox,children:[rotated]});
assert.deepEqual(JSON.parse(JSON.stringify(crop)),{x:-24,y:6,width:18,height:28},'Gedrehte Elemente werden in den SVG-Zuschnitt eingerechnet.');
assert.equal(ctx.exportArtworkBounds({viewBox,children:[]}),null);
const outsideFrame={tagName:'text',matches:()=>false,getBBox:()=>({x:-120,y:95,width:30,height:22}),transform:{baseVal:{consolidate:()=>null}}};
assert.deepEqual(JSON.parse(JSON.stringify(ctx.exportArtworkBounds({viewBox,children:[outsideFrame]}))),{x:-124,y:91,width:38,height:30},'Beschriftungen außerhalb des alten Viewports dürfen im Export nicht abgeschnitten werden.');
assert.match(html,/sp-print-black-stage'\)\.addEventListener\('change',renderPrint\)/,'Schwarzer Exporthintergrund darf das Projekt nicht ändern.');
const depth={attributes:{},setAttribute(name,value){this.attributes[name]=value;}};
ctx.metres=value=>value+' m';vm.runInContext(extract('positionVenueDimensions'),ctx);
ctx.positionVenueDimensions({parentElement:{id:'sp-print-floor'},querySelector:selector=>selector==='[data-dim-depth]'?depth:null,querySelectorAll:()=>[],setAttribute(){}},{floorBounds:{minX:0,minY:0,maxX:4,maxY:5},bounds:{minX:0,maxX:4}},50,300,50);
assert.equal(depth.attributes.x,242);assert.equal(depth.attributes.transform,'rotate(-90 242 175)','Seitliche Venue-Maße drehen sich um ihre tatsächliche Textposition.');
// The final export positions both dimension lines on the physical stage edges,
// regardless of the surrounding canvas, IEM space or diagram translation.
const node=()=>({attributes:{},children:[],setAttribute(k,v){this.attributes[k]=v;},append(child){this.children.push(child);}});
const width=node(),widthLine=node(),depthLabel=node(),ticks=[node(),node()],orientations=[node(),node()];
const svg={...node(),querySelector:selector=>({'[data-dim-width]':width,'[data-dim-depth]':depthLabel,'[data-stage-measure="width"]':widthLine}[selector]),querySelectorAll:selector=>selector==='[data-stage-measure-tick="width"]'?ticks:selector==='.sp-orientation'?orientations:[]};
ctx.sEl=(tag,attrs,parent)=>{const n=node();n.tag=tag;Object.assign(n.attributes,attrs);parent.append(n);return n;};
vm.runInContext(extract('positionPrintDimensions'),ctx);
ctx.positionPrintDimensions(svg,{minX:-1.13,minY:.27,maxX:4.18,maxY:5.27},50,300,80);
assert.equal(widthLine.attributes.y1,79.5);assert.equal(widthLine.attributes.y2,79.5);
assert.equal(widthLine.attributes.x1,243.5);assert.equal(widthLine.attributes.x2,509);
assert.equal(width.attributes.y,79.5,'Der Text sitzt direkt auf der nahen Maßlinie.');
assert.equal(depthLabel.attributes.x,229.5);assert.equal(depthLabel.attributes.y,218.5);
const depthGroup=svg.children.find(n=>n.attributes['data-stage-depth-dimension']);
assert.equal(depthGroup.children[0].attributes.y1,93.5);assert.equal(depthGroup.children[0].attributes.y2,343.5);
assert.equal(orientations[0].attributes.y,57.5);assert.equal(orientations[1].attributes.y,371.5);
const access=(x,y,width,height)=>({getBBox:()=>({x,y,width,height}),transform:{baseVal:{consolidate:()=>null}}});
const query=svg.querySelectorAll;svg.querySelectorAll=selector=>selector.startsWith('[data-stairs-zone]')?[access(250,75,40,25),access(210,130,30,70)]:query(selector);
ctx.positionPrintDimensions(svg,{minX:-1.13,minY:.27,maxX:4.18,maxY:5.27},50,300,80);
assert.equal(widthLine.attributes['data-measure-side'],'bottom','Bei einer Treppe hinten wird die freie Vorderkante bemaßt.');
assert.equal(widthLine.attributes.y1,357.5);
assert.equal(depthLabel.attributes.x,523,'Ein seitlicher Anbau darf die Maßlinie auf die freie Gegenseite verschieben.');
svg.querySelectorAll=selector=>selector.startsWith('[data-stairs-zone]')?[access(370,30,60,50),access(240,180,60,50)]:query(selector);
ctx.positionPrintDimensions(svg,{minX:0,minY:0,maxX:8,maxY:5},50,300,80,{floor:[[[[0,0],[8,0],[8,2.5],[4,2.5],[4,5],[0,5],[0,0]]]]});
assert.equal(widthLine.attributes.y1,66,'Am L-Grundriss gehört das Gesamtmaß zur durchgehenden oberen Kante, nicht auf den kurzen unteren Absatz.');
assert.equal(depthLabel.attributes.x,286,'Das Tiefenmaß gehört zur durchgehenden linken Kante.');
assert.notEqual(depthLabel.attributes.y,205,'Der Maßtext weicht dem IEM-Bereich entlang derselben Kante aus.');
console.log('PASS PRINT: optionale Inhalte ohne Leerseiten, escaped Notizen, Projektkennung, Datum, Maße und rotierter SVG-Zuschnitt.');
