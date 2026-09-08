const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('stageplot-studio.html','utf8');
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'));assert(match,name);return match[0];};
const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{checked:false,textContent:'',querySelector:()=>({})});return nodes.get(id);};
const ctx={$,stage:{title:'Konzert',projectId:'SP-TEST',project:{artist:'Band',venue:'Saal',date:'2026-10-16'},routing:{inputs:[],outputs:[]}},objects:[],byId:{},
 normalizeProjectInfo:p=>p,projectIdentity:id=>id,projectPrintMarkup:()=>'<p>Kontakte</p>',productionLines:()=>['Strom: 2 × Schuko 230 V'],
 esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;'),StageplotPrint:{render(host,report){ctx.report=report;return 3;}},
 DOMPoint:class {constructor(x,y){this.x=x;this.y=y;}matrixTransform(m){return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};}}};
vm.createContext(ctx);vm.runInContext(['technicalExportNeedsPro','renderPrintPages','exportArtworkBounds'].map(extract).join('\n'),ctx);
$('sp-print-measures').checked=true;$('sp-print-dimensions').textContent='8 × 5 m';
ctx.renderPrintPages('');assert.equal(ctx.report.sections.length,0);assert.equal(ctx.report.id,'SP-TEST');assert.match(ctx.report.subtitle,/16\.10\.2026 · 8 × 5 m/);
assert.equal($('sp-export-preview-title').textContent,'3 Seiten · A4 quer');assert.equal(ctx.technicalExportNeedsPro(),false);
for(const id of ['sp-print-inputs','sp-print-routing','sp-print-notes','sp-print-legend-toggle'])$(id).checked=true;
ctx.renderPrintPages('');assert.equal(ctx.report.sections.length,0,'Leere Listen, Legenden und Notizen erzeugen keine Platzhalterseiten.');
ctx.renderPrintPages('Erster Absatz\n\n<script>Ein Hinweis</script>');
assert.equal(ctx.report.sections.length,1);assert.equal(ctx.report.sections[0].html,'<p>Erster Absatz</p><p>&lt;script>Ein Hinweis&lt;/script></p>');
assert.equal(ctx.technicalExportNeedsPro(),true);
$('sp-print-measures').checked=false;ctx.renderPrintPages('');assert.doesNotMatch(ctx.report.subtitle,/8 × 5 m/);
const viewBox={baseVal:{x:-100,y:-100,width:200,height:200}};
const rotated={tagName:'g',matches:()=>false,getBBox:()=>({x:10,y:10,width:20,height:10}),transform:{baseVal:{consolidate:()=>({matrix:{a:0,b:1,c:-1,d:0,e:0,f:0}})}}};
const crop=ctx.exportArtworkBounds({viewBox,children:[rotated]});
assert.deepEqual(JSON.parse(JSON.stringify(crop)),{x:-24,y:6,width:18,height:28},'Gedrehte Elemente werden in den SVG-Zuschnitt eingerechnet.');
assert.equal(ctx.exportArtworkBounds({viewBox,children:[]}),null);
assert.match(html,/sp-print-black-stage'\)\.addEventListener\('change',renderPrint\)/,'Schwarzer Exporthintergrund darf das Projekt nicht ändern.');
console.log('PASS PRINT: optionale Inhalte ohne Leerseiten, escaped Notizen, Projektkennung, Datum, Maße und rotierter SVG-Zuschnitt.');
