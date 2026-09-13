// Shared Live look for the editable SVG and its offline image/PDF exports.
// Geometry, routing, hit targets and project data remain owned by the stage renderer.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.StageplotLook=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const palette=Object.freeze({canvas:'#1c2226',stage:'#282f33',grid:'#343d41',module:'#485155',border:'#b7bab2',ink:'#f4efdf',muted:'#aeb6b4',label:'#191f23',labelBorder:'#485155',lime:'#d4f15b',violet:'#b5a0e3',coral:'#ee9285',riser:'#30343c'});
  const sans='-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const mono='ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function frame(width,mode){return {left:width<500?46:70,right:width<500?31:45,header:mode==='editor'&&width<620?120:clamp(width*.084,70,116),bottom:46};}
  function labelMetrics(lines,nameLines,scale,context,riser=false){
    const unit=clamp(scale/95,.55,1.35),fontSize=(riser?11:13)*unit,detailSize=11.5*unit,lineHeight=15*unit,padX=11*unit,padY=5*unit;
    const fonts=lines.map((_,i)=>`${i<nameLines?650:400} ${i<nameLines?fontSize:detailSize}px ${i<nameLines?sans:mono}`);
    const previous=context?.font;
    const widths=lines.map((line,i)=>{if(!context)return line.length*(i<nameLines?fontSize:detailSize)*.65;context.font=fonts[i];return context.measureText(line).width;});
    if(context)context.font=previous;
    return {unit,fontSize,detailSize,lineHeight,padX,padY,fonts,width:Math.ceil(Math.max(...widths)+padX*2),height:Math.ceil(lines.length*lineHeight+padY*2)};
  }
  function drawLabel(add,parent,box,lines,nameLines,metrics,{riser=false,text=false,id}={}){
    const p=palette,{unit,padX,padY,lineHeight,fontSize,detailSize}=metrics;
    add('rect',{'data-label-background':id,x:box.left,y:box.top,width:box.right-box.left,height:box.bottom-box.top,rx:3*unit,fill:p.label,stroke:riser?p.violet:p.labelBorder,'stroke-width':riser?1.1:.65},parent);
    if(!riser)add('rect',{x:box.left+3*unit,y:box.top+4*unit,width:3*unit,height:box.bottom-box.top-8*unit,rx:.5,fill:p.lime,'data-label-accent':'true'},parent);
    lines.forEach((line,i)=>add('text',{x:box.left+padX,y:box.top+padY+fontSize+i*lineHeight,'text-anchor':'start',style:`font-family:${i<nameLines?sans:mono};font-size:${i<nameLines?fontSize:detailSize}px;font-weight:${i<nameLines?650:400};fill:${riser?p.violet:text?p.lime:i<nameLines?p.ink:'#d4d9d5'}`,'data-label-line':i},parent,line));
  }
  function paint({svg,add,stage,bounds,scale,mx,top,W,H,mode,downstageY,showMeasures,transparent}){
    const p=palette,defs=svg.querySelector('defs'),width=bounds?bounds.maxX-bounds.minX:stage.w,depth=bounds?bounds.maxY-bounds.minY:stage.d,rectW=width*scale,rectH=depth*scale;
    if(bounds){mx+=bounds.minX*scale;top+=bounds.minY*scale;}
    svg.dataset.stageLook='live';
    svg.style.setProperty('--sp-ink',p.ink);svg.style.setProperty('--sp-muted',p.muted);svg.style.setProperty('--sp-line',p.module);svg.style.setProperty('--sp-teal',p.lime);
    const apply=(selector,attrs)=>svg.querySelectorAll(selector).forEach(node=>Object.entries(attrs).forEach(([name,value])=>node.setAttribute(name,value)));
    apply('[data-canvas-background]',{fill:transparent?'transparent':p.canvas});
    apply('[data-stage-deck]',{fill:p.stage});
    apply('[data-stage-module]',{fill:'none',stroke:p.module,'stroke-width':.65});
    apply('[data-stage-modules] path',{stroke:p.module,'stroke-width':.65});
    apply('[data-stage-boundary]',{stroke:p.border,'stroke-width':1.1});
    apply('[data-stage-extension] rect',{fill:p.stage,stroke:p.module});
    apply('[data-stage-extension] line',{stroke:p.module});
    apply('[data-stage-grid]',{opacity:.7});
    apply('[data-grid-metres] path',{stroke:p.grid,'stroke-width':.55});
    apply('[data-grid-scale-label]',{fill:p.label,stroke:p.labelBorder,opacity:.8});
    // The real deck modules remain visible in export; editing snap subdivisions are optional.
    const filterId='sp-live-instrument-'+mode,filter=add('filter',{id:filterId,x:'-20%',y:'-20%',width:'140%',height:'145%','color-interpolation-filters':'sRGB'},defs);
    add('feColorMatrix',{type:'saturate',values:0},filter);
    const tone=add('feComponentTransfer',{},filter);
    for(const [channel,values] of [['R','0.045 0.96'],['G','0.055 0.935'],['B','0.06 0.86']])add('feFunc'+channel,{type:'table',tableValues:values},tone);
    add('feDropShadow',{dx:0,dy:1.5,stdDeviation:1.15,'flood-color':'#080c0f','flood-opacity':.55},filter);
    svg.querySelectorAll('[data-object-visual]').forEach(visual=>{
      if(visual.querySelector('[data-equipment="riser"],[data-stage-extension]'))return;
      visual.setAttribute('filter','url(#'+filterId+')');
    });
    svg.querySelectorAll('[data-equipment="riser"]').forEach(deck=>{
      const rects=deck.querySelectorAll(':scope > rect');
      if(rects[0]){rects[0].setAttribute('fill',p.riser);rects[0].setAttribute('stroke',p.violet);rects[0].setAttribute('stroke-width',1.8);}
      if(rects[1]){rects[1].setAttribute('stroke',p.violet);rects[1].setAttribute('opacity',.45);}
      deck.querySelectorAll(':scope > line').forEach(n=>n.setAttribute('stroke','#555361'));
      deck.querySelectorAll(':scope > circle').forEach(n=>n.setAttribute('fill',p.violet));
      deck.querySelectorAll('[data-riser-edge]').forEach(n=>{n.setAttribute('fill',p.violet);n.setAttribute('opacity',.65);});
      deck.querySelectorAll('[data-riser-caption] rect').forEach(n=>{n.setAttribute('fill',p.label);});
      deck.querySelectorAll('[data-riser-height]').forEach(n=>{n.setAttribute('fill',p.violet);});
    });
    apply('[data-stair-body]',{fill:'#747971',stroke:p.border});
    ['#e4e2d3','#d5d7ca','#c5cbbf'].forEach((fill,i)=>apply('[data-stair-step="'+i+'"]',{fill}));
    apply('[data-stair-rail]',{fill:'#444c45',stroke:p.border});
    apply('[data-stair-tread]',{stroke:'#737b70'});
    apply('[data-stair-anti-slip]',{stroke:'#919a8a'});
    apply('[data-stair-nosing]',{stroke:'#edf0df'});
    // Keep routing semantics: digital traces stay blue/orange; the lime is a label accent.
    apply('[data-cable-visual]',{stroke:'#0c1115'});
    apply('[data-production-summary] rect',{fill:p.label,stroke:p.labelBorder});
    apply('[data-production-summary] text',{fill:p.ink});
    // Replace the old orientation chrome with the same editorial frame in every output.
    apply('.sp-orientation,[data-stage-measure],[data-stage-measure-tick],[data-dim-width],[data-stage-side]',{display:'none'});
    const chrome=add('g',{'data-live-frame':'true','pointer-events':'none'},svg),margin=W<500?24:W*.045,titleX=mode==='editor'&&W>=620?205:margin;
    const titleSize=clamp(W*(mode==='editor'?.039:.052),30,72),titleY=frame(W,mode).header-23;
    if(mode!=='editor'||W>=620){
    add('text',{x:titleX,y:Math.max(16,titleY-titleSize*.86),style:`font-family:${mono};font-size:${clamp(W*.008,7,11)}px;font-weight:500;letter-spacing:3px;fill:${p.ink}`},chrome,'LIVE SETUP');
    add('text',{x:titleX-2,y:titleY,style:`font-family:${sans};font-size:${titleSize}px;font-weight:850;letter-spacing:-2px;fill:${p.ink}`},chrome,'Stageplot');
    }
    if(W>=620){
      const x=W-margin-42,y=titleY-24,maxLength=Math.floor(W/30),title=String(stage.title||'').slice(0,maxLength);
      add('text',{x,y,'text-anchor':'end',style:`font-family:${mono};font-size:9px;letter-spacing:1px;fill:${p.muted}`},chrome,title);
      if(showMeasures)add('text',{x,y:y+16,'text-anchor':'end',style:`font-family:${mono};font-size:9px;letter-spacing:1.3px;fill:${p.ink}`},chrome,`${width.toLocaleString('de-AT')} × ${depth.toLocaleString('de-AT')} m`);
      add('rect',{x:W-margin-28,y:titleY-40,width:28,height:28,fill:'none',stroke:p.violet},chrome);
      add('text',{x:W-margin-14,y:titleY-20,'text-anchor':'middle',style:`font-family:${sans};font-size:16px;fill:${p.violet}`},chrome,'2D');
    }
    // Directions follow the stage while panning/zooming; the heading stays on the sheet.
    const directionSize=clamp(scale*.1,7,11),center=top+rectH/2;
    for(const [x,angle,label] of [[mx-14,-90,'STAGE RIGHT'],[mx+rectW+14,90,'STAGE LEFT']]){
      add('text',{x,y:center,'text-anchor':'middle',transform:`rotate(${angle} ${x} ${center})`,style:`font-family:${sans};font-size:${directionSize}px;font-weight:650;letter-spacing:2px;fill:${p.ink}`},chrome,label);
    }
    if(showMeasures){
      const x=Math.max(12,mx-42),y=top+rectH/2;
      apply('[data-dim-depth]',{x,y,transform:`rotate(-90 ${x} ${y})`,style:`font-family:${mono};font-size:11px;fill:${p.muted}`});
      for(const [a,b] of [[top,center-24],[center+24,top+rectH]])add('line',{x1:x,y1:a,x2:x,y2:b,stroke:p.muted,'stroke-width':.65},chrome);
      for(const yy of [top,top+rectH])add('line',{x1:x-4,y1:yy,x2:x+4,y2:yy,stroke:p.muted,'stroke-width':.65},chrome);
    }
    const audienceX=mx+rectW/2,y=Math.min(H-12,downstageY);
    const gridBadge=svg.querySelector('[data-grid-scale-label]');
    if(gridBadge){const note=gridBadge.nextElementSibling,badgeY=Math.min(H-24,y+14),badgeX=W<500?12:mx;gridBadge.setAttribute('x',badgeX);gridBadge.setAttribute('y',badgeY);if(note?.tagName.toLowerCase()==='text'){note.setAttribute('x',badgeX+7);note.setAttribute('y',badgeY+12);note.setAttribute('font-size',8);note.setAttribute('fill',p.muted);}}
    add('path',{d:`M${audienceX-5} ${y-20}h10l-5 7Z`,fill:p.coral},chrome);
    add('text',{x:audienceX,y,'text-anchor':'middle',style:`font-family:${sans};font-size:10px;font-weight:700;letter-spacing:2.8px;fill:${p.coral}`},chrome,'PUBLIKUM');
    for(const sign of [-1,1])add('line',{x1:audienceX+sign*63,y1:y-3,x2:audienceX+sign*84,y2:y-3,stroke:p.coral,'stroke-width':.8},chrome);
    if(transparent){chrome.querySelectorAll('text').forEach(node=>{node.style.fill=node.textContent==='PUBLIKUM'?'#a84e42':'#343d41';});apply('[data-dim-depth]',{style:`font-family:${mono};font-size:11px;fill:#596267`});}
  }
  return {palette,frame,labelMetrics,drawLabel,paint};
});
