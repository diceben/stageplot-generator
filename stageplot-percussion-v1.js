/* Percussion geometry and signal identities. Coordinates are metres, from above. */
function createStageplotPercussionModel() {
  'use strict';
  const catalog=[
    {id:'quinto',asset:'conga',name:'Quinto',group:'Trommeln',w:11*.0254*642/570,d:11*.0254*698/570,head:'11″',channels:['Mic']},
    {id:'conga',asset:'conga',name:'Conga',group:'Trommeln',w:11.75*.0254*642/570,d:11.75*.0254*698/570,head:'11¾″',channels:['Mic']},
    {id:'tumba',asset:'conga',name:'Tumba',group:'Trommeln',w:12.5*.0254*642/570,d:12.5*.0254*698/570,head:'12½″',channels:['Mic']},
    {id:'bongos',name:'Bongos',group:'Trommeln',w:.49,d:.26,head:'7¼″ + 8⅝″',channels:['Mic']},
    {id:'timbales',name:'Timbales',group:'Trommeln',w:.86,d:.44,head:'14″ + 15″',channels:['Hoch','Tief']},
    {id:'frame-drum',name:'Pandeiro / Rahmentrommel',group:'Trommeln',w:.28,d:.28,head:'10″',channels:['Mic']},
    {id:'cowbell',name:'Cowbell',group:'Kleinpercussion',w:.12,d:.23,channels:['Mic'],silent:true},
    {id:'jam-block',name:'Jam Block',group:'Kleinpercussion',w:.2,d:.12,channels:['Mic'],silent:true},
    {id:'tambourine',name:'Tamburin',group:'Kleinpercussion',w:.27,d:.23,channels:['Mic'],silent:true},
    {id:'chimes',name:'Bar Chimes',group:'Kleinpercussion',w:.62,d:.12,channels:['Mic'],silent:true},
    {id:'maracas',name:'Maracas',group:'Kleinpercussion',w:.16,d:.28,channels:['Mic'],silent:true},
    {id:'cymbal',name:'Becken',group:'Ergänzungen',w:.4064,d:.4064,head:'16″',channels:['Mic'],silent:true},
    {id:'multipad',name:'Elektronisches Multipad',group:'Ergänzungen',w:.364,d:.331,channels:['L','R'],electronic:true},
    {id:'percussion-table',name:'Percussion-Tisch',group:'Ergänzungen',w:.6,d:.3,channels:[],silent:true,underlay:true}
  ].map(c=>({...c,asset:c.asset||c.id}));
  // Opaque bounds exclude the packaging margin; these are source pixels, not metres.
  const assetSizes={conga:[644,700],bongos:[700,355],timbales:[700,340],'frame-drum':[661,700],cowbell:[397,700],'jam-block':[700,524],tambourine:[700,606],chimes:[700,146],maracas:[540,700],cymbal:[697,700],multipad:[700,638],'percussion-table':[700,228]};
  const byId=Object.fromEntries(catalog.map(c=>[c.id,c]));
  const finite=(v,def,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):def;
  const round=v=>Math.round(v*10000)/10000;
  const text=(v,max)=>String(v??'').replace(/[\x00-\x1f]/g,' ').slice(0,max);
  const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function dimensions(p){const c=byId[p.type],scale=p.scale??1;return {w:p.width??c.w*scale,d:p.depth??c.d*scale};}
  function part(type,id,x=0,y=0) {const c=byId[type]||byId.conga;return {id,type:c.id,x,y,angle:0,scale:1,label:c.name,pickup:c.silent?'none':c.electronic?'stereo':'mic'};}
  function preset(name='compact') {
    const parts=name==='empty'?[]:name==='latin'?[
      part('quinto','p1',-.43,-.08),part('conga','p2',0,-.18),part('tumba','p3',.44,-.08),part('bongos','p4',-.66,-.56),
      part('timbales','p5',.87,.38),part('cowbell','p6',1,.06),part('jam-block','p7',.72,.09),part('tambourine','p8',.58,-.32),
      part('chimes','p9',-.92,-.82),part('multipad','p10',-.98,-.19),part('cymbal','p11',1.02,-.54),
      part('percussion-table','p12',-.92,.42),part('maracas','p13',-1.05,.42),part('frame-drum','p14',-.75,.43)
    ]:[part('conga','p1',-.21,0),part('tumba','p2',.22,0),part('bongos','p3',0,-.42)];
    return normalize({parts});
  }
  function normalize(value) {
    if(!value||!Array.isArray(value.parts))return preset();
    const used=new Set(),parts=[];
    for(const [i,p] of value.parts.slice(0,48).entries()){
      if(!p||!Object.hasOwn(byId,p.type))continue;
      let id=/^[a-zA-Z0-9-]{1,60}$/.test(p.id||'')?p.id:'p'+(i+1);let suffix=1;const baseId=id;while(used.has(id))id=baseId.slice(0,50)+'-copy'+suffix++;used.add(id);
      const c=byId[p.type],base=part(c.id,id),pickup=c.channels.length===0?'none':c.electronic?(p.pickup==='none'?'none':p.pickup==='mono'?'mono':'stereo'):(p.pickup==='none'?'none':'mic');
      parts.push({...base,x:round(finite(p.x,0,-4,4)),y:round(finite(p.y,0,-4,4)),angle:round((finite(p.angle,0,-36000,36000)%360+360)%360),scale:round(finite(p.scale,1,.6,1.6)),label:text(p.label??c.name,48),pickup,...(Number.isFinite(p.width)?{width:round(finite(p.width,c.w,.02,3))}:{}),...(Number.isFinite(p.depth)?{depth:round(finite(p.depth,c.d,.02,3))}:{})});
    }
    const nextId=Math.max(Math.floor(finite(value.nextId,1,1,1000000000)),...parts.map(p=>{
      const n=/^p[0-9]+$/.test(p.id)?Number(p.id.slice(1)):0;
      return Number.isSafeInteger(n)&&n<1000000000?n+1:1;
    }));
    return {version:1,nextId,parts};
  }
  function layout(value) {
    const config=normalize(value),parts=config.parts.map(p=>({...p,...dimensions(p)}));
    let minX=-.3,minY=-.3,maxX=.3,maxY=.3;
    if(parts.length){minX=minY=Infinity;maxX=maxY=-Infinity;for(const p of parts){const r=p.angle*Math.PI/180,hw=(Math.abs(Math.cos(r))*p.w+Math.abs(Math.sin(r))*p.d)/2,hd=(Math.abs(Math.sin(r))*p.w+Math.abs(Math.cos(r))*p.d)/2;minX=Math.min(minX,p.x-hw);maxX=Math.max(maxX,p.x+hw);minY=Math.min(minY,p.y-hd);maxY=Math.max(maxY,p.y+hd);}}
    minX-=.025;minY-=.025;maxX+=.025;maxY+=.025;
    const w=round(maxX-minX),d=round(maxY-minY);
    return {parts:parts.sort((a,b)=>Number(!!byId[b.type].underlay)-Number(!!byId[a.type].underlay)),minX,minY,w,d,vb:[round(w*100),round(d*100)]};
  }
  function imageMarkup(p,unit=100) {
    const c=byId[p.type],size=dimensions(p),w=size.w*unit,d=size.d*unit,[sw,sh]=assetSizes[c.asset];
    return '<svg x="'+(-w/2)+'" y="'+(-d/2)+'" width="'+w+'" height="'+d+'" viewBox="1 1 '+(sw-2)+' '+(sh-2)+'" preserveAspectRatio="none" overflow="hidden" data-percussion-image="'+c.id+'"><image href="./stageplot-assets/percussion/'+c.asset+'.webp" width="'+sw+'" height="'+sh+'" preserveAspectRatio="none" style="filter:grayscale(1)"/></svg>';
  }
  function artwork(value) {const l=layout(value);return '<g data-equipment="percussion">'+l.parts.map(p=>'<g transform="translate('+round((p.x-l.minX)*100)+' '+round((p.y-l.minY)*100)+') rotate('+p.angle+')">'+imageMarkup(p)+'</g>').join('')+'</g>';}
  function channels(value) {
    return normalize(value).parts.flatMap(p=>{const c=byId[p.type];if(p.pickup==='none')return [];
      const names=c.electronic?(p.pickup==='stereo'?['L','R']:['Mono']):c.channels;
      return names.map((name,i)=>({id:p.id+'-'+(c.electronic?name.toLowerCase():i+1),partId:p.id,name:(p.label||c.name)+(names.length>1?' · '+name:''),electronic:!!c.electronic,stereoGroup:c.electronic&&names.length===2?p.id:'',side:c.electronic&&names.length===2?name:'',connector:c.electronic?'Klinke':'XLR'}));
    });
  }
  return {catalog,byId,part,preset,normalize,dimensions,layout,artwork,imageMarkup,channels,escape};
}
if(typeof module==='object'&&module.exports)module.exports=createStageplotPercussionModel;
