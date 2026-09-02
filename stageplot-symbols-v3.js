// Original scalable monochrome artwork; lighter technical linework matches the approved design rendering.
// Instrument geometry remains informed by the sources in stageplot-referenzen.md.
// Right-handed kit in plan view: throne at the top, audience at the bottom.
// Relative positions checked against real overhead photos (see stageplot-referenzen.md).
function createStageplotSymbolV3(type, options = {}) {
  let out = '';
  const f = n => Math.round(n * 100) / 100;
  const drumMicParts=new Set(Array.isArray(options.drumMicParts)?options.drumMicParts:[]);
  const renderIdPrefix=(String(options.idPrefix||type||'symbol').trim().replace(/[^a-z0-9_-]/gi,'-')||'symbol');
  const scopedId=(kind,...parts)=>(['sp',kind,renderIdPrefix,type,...parts].join('-')).replace(/[^a-z0-9_-]/gi,'-');
  const windMetalId=scopedId('gradient','brass-metal'),windShadowId=scopedId('filter','brass-shadow');
  const node = (tag, attrs) => { attrs['vector-effect']='non-scaling-stroke';out += '<' + tag + ' ' + Object.entries(attrs).map(([k,v]) => k + '="' + v + '"').join(' ') + '/>'; };
  const path = (d, fill='none', sw=.7, stroke='#303030') => node('path',{d,fill,stroke,'stroke-width':sw});
  const line = (x1,y1,x2,y2,sw=.55,stroke='#454545') => node('line',{x1:f(x1),y1:f(y1),x2:f(x2),y2:f(y2),stroke,'stroke-width':sw});
  const circle = (cx,cy,r,fill='#fafafa',sw=.6,stroke='#333') => node('circle',{cx:f(cx),cy:f(cy),r:f(r),fill,stroke,'stroke-width':sw});
  const rect = (x,y,width,height,fill='#eee',sw=.65,rx=1,stroke='#333') => node('rect',{x:f(x),y:f(y),width:f(width),height:f(height),rx,fill,stroke,'stroke-width':sw});
  const ellipse = (cx,cy,rx,ry,fill='#fafafa',sw=.6,stroke='#333') => node('ellipse',{cx,cy,rx,ry,fill,stroke,'stroke-width':sw});
  const group = (transform='',part='') => { out += '<g'+(transform?' transform="'+transform+'"':'')+(part?' data-part="'+part+'"':'')+'>'; };
  const end = () => { out += '</g>'; };
  const drumAsset = (name,x,y,width,height,angle=0,extension='webp') => {
    group(angle?'rotate('+angle+' '+f(x)+' '+f(y)+')':'');
    node('image',{href:'stageplot-assets/drums/'+name+'.'+extension,x:f(x-width/2),y:f(y-height/2),width:f(width),height:f(height),preserveAspectRatio:'xMidYMid meet','data-rendered-drum-asset':name});
    end();
  };
  const drumAssetCrop = (name,sourceWidth,sourceHeight,cropX,cropY,cropWidth,cropHeight,x,y,width,height,angle=0,extension='png',part='') => {
    const left=x-width/2,top=y-height/2,scaleX=width/cropWidth,scaleY=height/cropHeight,clipId=scopedId('drum-crop',name,part,f(x),f(y),f(width),f(height),cropX,cropY,cropWidth,cropHeight);
    out+='<defs><clipPath id="'+clipId+'" clipPathUnits="userSpaceOnUse"><rect x="'+f(left)+'" y="'+f(top)+'" width="'+f(width)+'" height="'+f(height)+'"/></clipPath></defs>';
    group(angle?'rotate('+angle+' '+f(x)+' '+f(y)+')':'',part);
    const attrs={href:'stageplot-assets/drums/'+name+'.'+extension,x:f(left-cropX*scaleX),y:f(top-cropY*scaleY),width:f(sourceWidth*scaleX),height:f(sourceHeight*scaleY),preserveAspectRatio:'none','clip-path':'url(#'+clipId+')','data-rendered-drum-asset':name,'data-crop-width':f(width),'data-crop-height':f(height)};if(/stand|pedal/.test(part))attrs['data-fixed-drum-hardware']='true';node('image',attrs);end();
  };
  const drumAssetEllipseLayer = (name,sourceWidth,sourceHeight,x,y,width,height,sourceCx,sourceCy,sourceRx,sourceRy,layer='over',visibleSourceBottom=sourceHeight,extension='webp',part='') => {
    const left=x-width/2,top=y-height/2,cx=left+sourceCx/sourceWidth*width,cy=top+sourceCy/sourceHeight*height,rx=sourceRx/sourceWidth*width,ry=sourceRy/sourceHeight*height;
    const id=scopedId('drum-layer',name,part,layer,f(x),f(y),f(width),f(height));
    if(layer==='under'){
      out+='<defs><mask id="'+id+'" maskUnits="userSpaceOnUse" x="'+f(left)+'" y="'+f(top)+'" width="'+f(width)+'" height="'+f(height)+'"><rect x="'+f(left)+'" y="'+f(top)+'" width="'+f(width)+'" height="'+f(height*visibleSourceBottom/sourceHeight)+'" fill="#fff"/><ellipse cx="'+f(cx)+'" cy="'+f(cy)+'" rx="'+f(rx)+'" ry="'+f(ry)+'" fill="#000"/></mask></defs>';
    }else out+='<defs><clipPath id="'+id+'" clipPathUnits="userSpaceOnUse"><ellipse cx="'+f(cx)+'" cy="'+f(cy)+'" rx="'+f(rx)+'" ry="'+f(ry)+'"/></clipPath></defs>';
    group('',part);const attrs={href:'stageplot-assets/drums/'+name+'.'+extension,x:f(left),y:f(top),width:f(width),height:f(height),preserveAspectRatio:'none',[layer==='under'?'mask':'clip-path']:'url(#'+id+')','data-rendered-drum-asset':name,'data-drum-layer':layer};if(layer==='under'||/stand|pedal/.test(part))attrs['data-fixed-drum-hardware']='true';node('image',attrs);end();
  };
  const floorTomAsset = (x,y,width,height,part='floor-tom') => {
    const clipId=scopedId('floor-tom-shell',part,f(x),f(y),f(width),f(height));
    out+='<defs><clipPath id="'+clipId+'" clipPathUnits="objectBoundingBox"><ellipse cx=".5" cy=".47" rx=".46" ry=".46"/></clipPath></defs>';
    out+='<g data-part="floor-tom-legs" data-fixed-drum-hardware="true">';
    for(let i=0;i<4;i++){
      const a=(45+i*90)*Math.PI/180,inner=width*.42,outer=inner+1.7,x1=x+Math.cos(a)*inner,y1=y+Math.sin(a)*inner,x2=x+Math.cos(a)*outer,y2=y+Math.sin(a)*outer;
      rod(x1,y1,x2,y2,.68);ellipse(x2,y2,.62,.78,'#444',.28);
    }
    end();
    group();node('image',{href:'stageplot-assets/drums/floor-tom.webp',x:f(x-width/2),y:f(y-height/2),width:f(width),height:f(height),preserveAspectRatio:'xMidYMid meet','clip-path':'url(#'+clipId+')','data-rendered-drum-asset':'floor-tom'});end();
  };
  const bolt = (x,y,r=.65) => {circle(x,y,r,'#ddd',.3);line(x-r*.5,y,x+r*.5,y,.25);};
  const rod = (x1,y1,x2,y2,w=1.4) => {line(x1,y1,x2,y2,w,'#3a3a3a');line(x1,y1,x2,y2,w*.32,'#c5c5c5');};
  // Pipe diameters scale with the instrument, unlike the fine non-scaling detail lines.
  const windTube = (d,w=6) => {
    for(const [width,color] of [[w,'#343836'],[w-1.4,'url(#'+windMetalId+')'],[w*.16,'#fff']])out+='<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+f(width)+'" stroke-linecap="round" stroke-linejoin="round"/>';
  };
  const windValve = (x,y,h=34) => {
    group('','piston-valve');rect(x-4,y,8,h,'#d1d1d1',.55,2);
    line(x-1.5,y+3,x-1.5,y+h-3,.45,'#fafafa');
    for(const yy of [y+2,y+h-3])rect(x-4.7,yy,9.4,2,'#aaa',.4,.5);
    rect(x-1.2,y-9,2.4,9,'#aaa',.4,.3);ellipse(x,y-10,6,2.2,'#eee',.6);ellipse(x,y-10.5,4.1,1.1,'#fafafa',.25);end();
  };
  const feet = (x,y,r,offset=0,weight=.65,foot=.45) => {
    for(let i=0;i<3;i++){const a=(offset+i*120)*Math.PI/180,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;rod(x,y,xx,yy,weight);circle(xx,yy,foot,'#555',.2);}
  };
  const snareStand = (x,y) => {
    out+='<g data-part="snare-stand" data-fixed-drum-hardware="true">';
    feet(x,y,11.5,30,.58,.48);
    for(let i=0;i<3;i++){const a=(30+i*120)*Math.PI/180,xx=x+Math.cos(a)*7.3,yy=y+Math.sin(a)*7.3;rod(x,y,xx,yy,.52);circle(xx,yy,.56,'#555',.2);}
    circle(x,y,1.05,'#777',.3);end();
  };
  const drum = (x,y,r,snare=false) => {
    group('',snare?'snare':'tom');
    const lugCount=snare?10:r<7.5?6:8;
    for(let i=0;i<lugCount;i++){const a=i*Math.PI*2/lugCount,deg=i*360/lugCount;group('translate('+f(x+Math.cos(a)*(r+.18))+' '+f(y+Math.sin(a)*(r+.18))+') rotate('+deg+')');rect(-.42,-.58,.84,1.16,'#d4d4d4',.22,.12,'#363636');end();}
    circle(x,y,r,'#fafafa',.82);circle(x,y,r-.72,'#fff',.35);circle(x,y,r-1.35,'none',.16,'#dadada');
    if(snare){rect(x+r-.28,y-.72,1.25,1.44,'#777',.25,.18);circle(x,y,r*.64,'none',.16,'#e6e6e6');}
    end();
  };
  const cymbal = (x,y,r,hat=false,variant='crash') => {
    group('',hat?'hihat':'cymbal');if(variant!=='splash'){out+='<g data-part="cymbal-stand-legs" data-fixed-drum-hardware="true">';feet(x,y,13.5,15,.58,.4);end();}
    if(hat)circle(x,y+.7,r,'#bcbcbc',.5);
    if(variant==='clapstack'){
      const metalIds=[0,1,2].map(index=>scopedId('clapstack-metal',index,f(x),f(y),f(r)));
      out+='<defs>'+
        '<radialGradient id="'+metalIds[0]+'" cx="42%" cy="38%" r="72%"><stop offset="0" stop-color="#d4d7d5"/><stop offset=".55" stop-color="#8d9290"/><stop offset="1" stop-color="#444947"/></radialGradient>'+
        '<radialGradient id="'+metalIds[1]+'" cx="43%" cy="40%" r="70%"><stop offset="0" stop-color="#eceeec"/><stop offset=".5" stop-color="#b6bab8"/><stop offset="1" stop-color="#626765"/></radialGradient>'+
        '<radialGradient id="'+metalIds[2]+'" cx="45%" cy="41%" r="68%"><stop offset="0" stop-color="#fafbf9"/><stop offset=".56" stop-color="#d0d3d1"/><stop offset="1" stop-color="#858a88"/></radialGradient>'+
      '</defs>';
      group('','clapstack-discs');
      const discs=[{scale:1,cx:x-.55,cy:y+.4,phase:.2,fill:metalIds[0]},{scale:.865,cx:x+.55,cy:y+.15,phase:1.15,fill:metalIds[1]},{scale:.735,cx:x-.05,cy:y-.45,phase:2.05,fill:metalIds[2]}];
      for(const [discIndex,disc] of discs.entries()){
        const points=[];for(let i=0;i<32;i++){const a=-Math.PI/2+i*Math.PI/16,wave=1+.012*Math.sin(i*3+disc.phase)+.007*Math.cos(i*5-disc.phase);points.push([disc.cx+Math.cos(a)*r*disc.scale*wave,disc.cy+Math.sin(a)*r*disc.scale*wave]);}
        const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let d='M'+mid(points.at(-1),points[0]).map(f).join(' ');
        for(let i=0;i<points.length;i++){const next=points[(i+1)%points.length],m=mid(points[i],next);d+='Q'+points[i].map(f).join(' ')+' '+m.map(f).join(' ');}d+='Z';path(d,'url(#'+disc.fill+')',.68,discIndex?'#626765':'#373c3a');
        for(const ring of [.68,.83,.925])ellipse(disc.cx,disc.cy,r*disc.scale*ring,r*disc.scale*ring*.985,'none',.12,discIndex===2?'#f4f5f3':'#b7bcba');
        const markCount=discIndex===2?19:13;for(let i=0;i<markCount;i++){const a=(i*2.399+disc.phase)%(Math.PI*2),radius=r*disc.scale*(.2+.69*((i*37)%101)/100),size=.22+((i*11)%5)*.075;node('ellipse',{cx:f(disc.cx+Math.cos(a)*radius),cy:f(disc.cy+Math.sin(a)*radius*.985),rx:f(size*1.8),ry:f(size),fill:i%3?'#3c4140':'#f4f5f3',opacity:i%3?'.16':'.2',stroke:'none'});}
        path('M'+f(disc.cx-r*disc.scale*.72)+' '+f(disc.cy-r*disc.scale*.28)+'Q'+f(disc.cx)+' '+f(disc.cy-r*disc.scale*.64)+' '+f(disc.cx+r*disc.scale*.66)+' '+f(disc.cy-r*disc.scale*.22),'none',.22,discIndex===2?'#fff':'#d9dcda');
      }
      circle(x,y,2.15,'#373634',.42,'#171817');circle(x,y,1.55,'#111210',.3,'#000');path('M'+f(x-1.25)+' '+f(y-.32)+'Q'+f(x-.85)+' '+f(y-1.35)+' '+x+' '+f(y-.75)+'Q'+f(x+.85)+' '+f(y-1.35)+' '+f(x+1.25)+' '+f(y-.32)+'L'+f(x+.9)+' '+f(y+.55)+'Q'+x+' '+f(y+.2)+' '+f(x-.9)+' '+f(y+.55)+'Z','#20211f',.3,'#050505');circle(x,y,.48,'#d8d7ce',.18,'#151515');end();
    }else{
      circle(x,y,r,'#fafafa',.75);
      const rings=variant==='ride'?9:variant==='china'?7:7;
      let grooves='';for(let i=1;i<=rings;i++){const rr=f(r*(.22+i*.74/rings));grooves+='M'+f(x-rr)+' '+y+'a'+rr+' '+rr+' 0 1 0 '+f(rr*2)+' 0a'+rr+' '+rr+' 0 1 0 '+f(-rr*2)+' 0';}path(grooves,'none',.105,'#cecece');
      if(variant==='china'){circle(x,y,r*.86,'none',.55,'#8f8f8f');path('M'+f(x-r*.86)+' '+y+'Q'+x+' '+f(y-r*.16)+' '+f(x+r*.86)+' '+y,'none',.35,'#aaa');}
    }
    if(variant!=='clapstack'){const bell=variant==='ride'?r*.23:variant==='china'?r*.16:r*.18;ellipse(x,y,bell,bell*.82,'#e7e7e7',.4);circle(x,y,.85,'#444',.2);line(x-1.3,y-.4,x+1.3,y+.4,.45);}end();
  };
  const pedal = (x,y,angle=0,part='kick-pedal') => {
    group('translate('+x+' '+y+') rotate('+angle+')',part);
    // Toe/clamp at y=0; heel toward the seated player at negative y.
    path('M-3.2-1H3.2L3.8-12Q3.7-15 0-16Q-3.7-15-3.8-12Z','#b9b9b9',.65);
    path('M-2.2-3H2.2L2.4-11Q0-14-2.4-11Z','#ddd',.35);
    for(const yy of [-5,-7.5,-10])path('M-1.5 '+yy+'L0 '+(yy+1)+'L1.5 '+yy,'none',.35);
    rect(-2.8,-16,5.6,2,'#777',.4,.6);
    rect(-4,-1.5,8,2,'#666',.45,.4);
    if(part==='kick-pedal'){rod(0,-1,0,3,1);ellipse(0,3.5,2,1.2,'#eee',.5);}
    end();
  };
  const kick = (x,y,w,h) => {
    group('','kick');
    path('M'+x+' '+y+'Q'+(x+w/2)+' '+(y-2)+' '+(x+w)+' '+y+'V'+(y+h)+'Q'+(x+w/2)+' '+(y+h+2)+' '+x+' '+(y+h)+'Z','#f1f1f1',.85);
    for(const yy of [y+1,y+3,y+h-3,y+h-1])path('M'+x+' '+yy+'Q'+(x+w/2)+' '+(yy-1.6)+' '+(x+w)+' '+yy,'none',.55);
    for(const xx of [x+2.5,x+w-2.5]){line(xx,y+4,xx,y+h-4,.5,'#eee');rect(xx-.9,y+5,1.8,4,'#777',.3,.3);rect(xx-.9,y+h-9,1.8,4,'#777',.3,.3);}
    rect(x+w/2-1.5,y+6,3,4,'#666',.35,.6);
    pedal(x+w/2,y);
    rod(x+2,y+h-5,x-3,y+h+2,1);rod(x+w-2,y+h-5,x+w+3,y+h+2,1);end();
  };
  const kickTop = (x,y,r,doublePedal=false,leftHanded=false) => {
    group('','kick-top');
    for(let i=0;i<10;i++){const a=i*Math.PI/5;group('translate('+f(x+Math.cos(a)*(r+.2))+' '+f(y+Math.sin(a)*(r+.2))+') rotate('+(i*36)+')');rect(-.44,-.65,.88,1.3,'#d1d1d1',.22,.12,'#333');end();}
    circle(x,y,r,'#fafafa',.92);circle(x,y,r-.78,'#fff',.38);circle(x,y,r-1.45,'none',.16,'#d8d8d8');circle(x,y,r*.2,'none',.18,'#e1e1e1');
    pedal(x,y-r+1,0);if(doublePedal)pedal(x+(leftHanded?-7:7),y-r+1,leftHanded?14:-14,'kick-pedal-double');
    end();
  };
  const kickOverhead = (x,y,w,h,doublePedal=false,leftHanded=false) => {
    group('','kick-overhead');
    group('','kick-shell-top');
    rect(x-w/2,y-h/2,w,h,'#eeeeec',.85,2.3,'#333');
    for(const xx of [x-w*.27,x,x+w*.27])line(xx,y-h/2+2.2,xx,y+h/2-2.2,.16,'#d2d2cf');
    for(const yy of [y-h*.18,y+h*.18])path('M'+f(x-w/2+1)+' '+f(yy)+'Q'+x+' '+f(yy+.65)+' '+f(x+w/2-1)+' '+f(yy),'none',.18,'#d3d3d0');
    end();
    group('','kick-head-edges');
    for(const [yy,sign] of [[y-h/2,1],[y+h/2,-1]]){
      path('M'+f(x-w/2+1)+' '+f(yy)+'Q'+x+' '+f(yy-sign*1.25)+' '+f(x+w/2-1)+' '+f(yy),'none',.95,'#333');
      path('M'+f(x-w/2+1.5)+' '+f(yy+sign*1.8)+'Q'+x+' '+f(yy+sign*.65)+' '+f(x+w/2-1.5)+' '+f(yy+sign*1.8),'none',.5,'#777');
    }
    end();
    for(const side of [-1,1])for(const offset of [-.32,-.1,.13,.35]){
      const xx=x+side*(w/2-.5),yy=y+offset*h;group('translate('+f(xx)+' '+f(yy)+') rotate('+(side<0?90:-90)+')','kick-lug');rect(-.44,-.65,.88,1.3,'#bdbdb9',.22,.12,'#333');end();
    }
    group('','kick-tom-mount');rect(x-5.2,y-h*.29,10.4,4.6,'#c7c7c3',.5,.7);circle(x-2.6,y-h*.27,.85,'#555',.25);circle(x+2.6,y-h*.27,.85,'#555',.25);end();
    group('','kick-spurs');
    for(const side of [-1,1]){const sx=x+side*(w/2-.7),sy=y-h*.2;rod(sx,sy,sx+side*4.1,sy+2.4,1);ellipse(sx+side*4.5,sy+2.7,1.15,.75,'#444',.25);}
    end();
    pedal(x,y+h/2+.2,180);if(doublePedal)pedal(x+(leftHanded?-7:7),y+h/2+.5,leftHanded?194:166,'kick-pedal-double');
    end();
  };
  const bongos = (x,y) => {
    group('','bongos');
    for(const [dx,r] of [[-4.8,5.2],[5,5.8]]){circle(x+dx,y,r,'#e7e7e7',.75);circle(x+dx,y,r-1,'#fff',.35);for(let i=0;i<6;i++){const a=i*Math.PI/3;rect(x+dx+Math.cos(a)*(r+.2)-.7,y+Math.sin(a)*(r+.2)-.5,1.4,1,'#888',.25,.25);}}
    path('M'+(x-1)+' '+(y-2)+'H'+(x+1)+'V'+(y+2)+'H'+(x-1)+'Z','#777',.3);end();
  };
  const rackTable = (x,y,variant='laptop',width=30,height=variant==='mixer'?17:20) => {
    group('','rack-table');
    drumAsset(variant==='mixer'?'racktable-mixer-overhead-preview-v1':'racktable-laptop-overhead-preview-v1',x,y,width,height,0,'png');
    end();
  };
  const pad = (x,y,width=27,height=23.7) => {
    group('','sample-pad');
    drumAsset('spdsx-overhead-preview-v1',x,y,width,height,0,'png');
    end();
  };
  const keybed = (x,y,w,h,whiteCount,startNote=0,inverse=false) => {
    group('','keybed');const kw=w/whiteCount;
    rect(x,y,w,h,inverse?'#222':'#fff',.55,.2);
    let cuts='';for(let i=1;i<whiteCount;i++)cuts+='M'+f(x+i*kw)+' '+y+'v'+h;
    path(cuts,'none',.28,inverse?'#888':'#555');
    // White-note indexes C D E F G A B; no sharp after E or B.
    let blackKeys='';for(let i=0;i<whiteCount-1;i++)if(![2,6].includes((startNote+i)%7))blackKeys+='M'+f(x+(i+.72)*kw)+' '+y+'h'+f(kw*.56)+'v'+f(h*.61)+'h'+f(-kw*.56)+'Z';
    path(blackKeys,inverse?'#eee':'#252525',.15);
    line(x,y+h-1.6,x+w,y+h-1.6,.25,inverse?'#888':'#bcbcbc');end();
  };
  const knob = (x,y,r=1.9) => {circle(x,y,r,'#2d2d2d',.4);line(x,y-r+.6,x,y-.2,.35,'#eee');};
  const drawbars = (x,y,count=9,spacing=3.2) => {
    group('','drawbars');for(let i=0;i<count;i++){line(x+i*spacing,y,x+i*spacing,y+12,.6,'#888');rect(x-1.1+i*spacing,y+3+(i%3)*2,2.2,5,[0,1,3,4,6].includes(i)?'#eee':'#555',.35,.3);}end();
  };
  const panel = (x,y,w,h,cols=3) => {
    rect(x,y,w,h,'#575757',.4,.6,'#aaa');
    for(let j=0;j<2;j++)for(let i=0;i<cols;i++){knob(x+4+i*(w-8)/Math.max(1,cols-1),y+5+j*(h-10));}
  };
  const capsule = (x,y,angle=0) => {
    group('translate('+x+' '+y+') rotate('+angle+')','microphone');
    path('M-4 0H4L2.8 25H-2.8Z','#484848',.8);rect(-3,24,6,4,'#bbb',.45,.6);
    group('','round-mic-grille');circle(0,-7,8,'#c5c5c5',.8);
    for(let yy=-13;yy<=-1;yy+=2.4){const half=Math.sqrt(64-(yy+7)*(yy+7))-.6;line(-half,yy,half,yy,.3,'#777');}
    for(const xx of [-5,-2.5,0,2.5,5]){const half=Math.sqrt(64-xx*xx)-.5;line(xx,-7-half,xx,-7+half,.28,'#777');}
    path('M-7.6-5Q0-2.5 7.6-5','none',.6,'#888');end();
    line(-3.6,4,3.6,4,.5,'#ccc');end();
  };
  const socketTemplates=new Set();
  const sockets = (x,y,cols,count,spacing,r,output=false) => {
    const id='sp-xlr-'+type+'-'+(output?'out':'in');
    if(!socketTemplates.has(id)){
      out+='<defs><g id="'+id+'">';
      circle(0,0,1,'#bbb',.45);circle(0,0,.76,'#444',.35);
      for(const [dx,dy] of [[0,-.3],[-.29,.22],[.29,.22]])circle(dx,dy,.12,output?'#bbb':'#111',.1);
      rect(-.24,-.93,.48,.17,'#ddd',.15,.03);
      out+='</g></defs>';socketTemplates.add(id);
    }
    for(let i=0;i<count;i++)node('use',{href:'#'+id,transform:'translate('+f(x+(i%cols)*spacing)+' '+f(y+Math.floor(i/cols)*spacing)+') scale('+r+')','data-part':output?'output-socket':'input-socket'});
  };
  const stagebox = (count,outputs) => {
    rect(4,7,172,77,'#555',.85,2);rect(13,11,154,69,'#777',.5,.7);
    for(const xx of [5,170]){rect(xx,9,5,73,'#aaa',.4,.5);for(const yy of [20,69])rect(xx+1,yy,3,5,'#333',.25,1);}
    const cols=count>16?12:count===8?8:8,rows=Math.ceil(count/cols),spacing=count>16?9.4:13.2,r=count>16?3.55:4.6;
    sockets(22,22,cols,count,spacing,r);
    if(outputs)sockets(count>16?139:137,22,count>16?4:2,outputs,count>16?8:12,r,true);
    line(18,16,count>16?129:125,16,.4,'#ddd');
    for(let i=0;i<3;i++)circle(142+i*8,69,2.8,'#333',.45,'#bbb');
    rect(20,66,6,9,'#333',.35,.3);rect(31,66,8,9,'#333',.35,.4);
    for(let i=0;i<4;i++)line(50,66+i*2,84,66+i*2,.3,'#bbb');
    out+='<text x="98" y="74" fill="#f3f3f3" stroke="none" font-size="7" font-family="sans-serif">'+count+' IN</text>';
  };

  if(new Set(['trumpet','trombone','tuba','flugelhorn']).has(type))out+='<defs><linearGradient id="'+windMetalId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8faf8"/><stop offset=".18" stop-color="#b9bfbc"/><stop offset=".48" stop-color="#f0f2f0"/><stop offset=".72" stop-color="#777d7a"/><stop offset="1" stop-color="#daddda"/></linearGradient><filter id="'+windShadowId+'" x="-15%" y="-18%" width="130%" height="140%"><feDropShadow dx=".8" dy="1.25" stdDeviation="1.15" flood-color="#111" flood-opacity=".28"/></filter></defs>';

  if((type==='drums'||type.startsWith('drums-'))&&options.drumLayout){
    const layout=options.drumLayout;
    if(layout.riser&&['2x','3x'].includes(layout.riser.preset)){
      const r=layout.riser;
      out+='<g data-drum-riser="'+r.preset+'" data-riser-modules="'+r.modules+'" pointer-events="none" aria-hidden="true">';
      rect(r.x,r.y,r.w,r.h,'#ededeb',.85,1.2,'#484848');
      for(let i=0;i<r.modules;i++)rect(r.x+i*r.moduleW+1.5,r.y+1.5,r.moduleW-3,r.h-3,'none',.24,.8,'#aaa');
      for(let i=1;i<r.modules;i++)line(r.x+i*r.moduleW,r.y,r.x+i*r.moduleW,r.y+r.h,.85,'#666');
      out+='</g>';
    }
    for(const p of layout.parts){
      const transform=p.angle?'rotate('+f(p.angle)+' '+f(p.x)+' '+f(p.y)+')':'';
      if(p.kind==='hihat'){
        const width=19.4,height=width*512/313,top=p.y-height/2,pedalWidth=10.7,pedalHeight=17.7;
        group(transform,p.id);group('rotate(180 '+f(p.x)+' '+f(p.y)+')','hihat-underlay');
        const assetLeft=p.x-width/2,crop=(part,cx,cy,cw,ch)=>drumAssetCrop('hihat-overhead-v2',313,512,cx,cy,cw,ch,assetLeft+(cx+cw/2)/313*width,top+(cy+ch/2)/512*height,cw/313*width,ch/512*height,0,'png',part);
        group('','hihat-stand-underlay');crop('hihat-stand-bridge',0,298,313,17);crop('hihat-stand-left-leg',0,315,116,88);crop('hihat-stand-right-leg',197,315,116,88);end();
        drumAssetCrop('hihat-overhead-v2',313,512,100,315,113,197,p.x,top+height*315/512+pedalHeight/2,pedalWidth,pedalHeight,0,'png','hihat-pedal-sized');end();end();
      }else if(p.kind==='cymbal'&&['ride','crash'].includes(p.variant)){
        const name=p.variant,width=36,height=width*(name==='ride'?512/461:512/508),spec=name==='ride'?[461,512,230.5,263.5,209,196]:[508,512,254,276,171,170];
        group(transform,p.id);drumAssetEllipseLayer(name,spec[0],spec[1],p.x,p.y,width,height,spec[2],spec[3],spec[4],spec[5],'under',spec[1],'webp',name+'-stand-underlay');end();
      }
    }
    // Rack-tom hardware is an underlay: changing the shell diameter never scales
    // the stand, clamp or arm. Legacy designs default to the kick mount.
    for(const p of layout.parts.filter(part=>part.kind==='tom'&&part.id.startsWith('rack'))){
      const mount=['kick','cymbal-clamp','basket'].includes(p.mount)?p.mount:'kick';
      out+='<g data-part="'+p.id+'" data-rack-tom-mount="'+mount+'" data-fixed-drum-hardware="true">';
      if(mount==='basket')snareStand(p.x,p.y);
      else if(mount==='cymbal-clamp'){
        const stands=layout.parts.filter(part=>part.kind==='cymbal'&&['ride','crash','china'].includes(part.variant)),stand=stands.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
        if(stand){const dx=p.x-stand.x,dy=p.y-stand.y,length=Math.hypot(dx,dy)||1,ex=p.x-dx/length*(p.r*.72),ey=p.y-dy/length*(p.r*.72);rod(stand.x,stand.y,ex,ey,.75);circle(stand.x,stand.y,1.15,'#777',.3);rect(ex-1.3,ey-1.1,2.6,2.2,'#aaa',.35,.5);}
      }else{
        const kicks=layout.parts.filter(part=>part.kind==='kick'),kick=kicks.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
        if(kick){const sx=kick.x+(p.x-kick.x)*.36,sy=kick.y+kick.h*.22,dx=p.x-sx,dy=p.y-sy,length=Math.hypot(dx,dy)||1,ex=p.x-dx/length*(p.r*.68),ey=p.y-dy/length*(p.r*.68);rod(sx,sy,ex,ey,.82);circle(sx,sy,1.05,'#666',.3);rect(ex-1.25,ey-1.05,2.5,2.1,'#aaa',.35,.45);}
      }
      out+='</g>';
    }
    for(const p of layout.parts)if(p.kind==='snare'){
      group(p.angle?'rotate('+f(p.angle)+' '+f(p.x)+' '+f(p.y)+')':'',p.id);snareStand(p.x,p.y);end();
    }
    for(const p of layout.parts){
      group(p.angle?'rotate('+f(p.angle)+' '+f(p.x)+' '+f(p.y)+')':'',p.id);
      if(p.kind==='throne')drumAsset('throne',p.x,p.y,p.r*2.75,p.r*2.84);
      else if(p.kind==='kick'){
        const shellWidth=p.w,baseWidth=shellWidth*1.5/1.6,baseHeight=baseWidth*543/512,shellCropHeight=320,shellHeight=shellWidth*shellCropHeight/512;
        const imageTop=p.y-baseHeight*.33,shellY=imageTop+baseHeight*(shellCropHeight/2)/543,pedalCrop={x:166,y:290,w:180,h:253};
        const pedalWidth=12.55,pedalHeight=19.1,pedalY=p.y+19.45,doublePedal=layout.pedal==='double'&&layout.parts.filter(v=>v.kind==='kick').length===1;
        group('rotate(180 '+f(p.x)+' '+f(p.y)+')');group('','kick-overhead');group('','kick-shell-top');drumAssetCrop('kick-overhead-v3',512,543,0,0,512,shellCropHeight,p.x,shellY,shellWidth,shellHeight,0,'png','kick-shell-image');end();
        drumAssetCrop('kick-overhead-v3',512,543,pedalCrop.x,pedalCrop.y,pedalCrop.w,pedalCrop.h,p.x,pedalY,pedalWidth,pedalHeight,0,'png','kick-pedal-primary');
        if(doublePedal)drumAssetCrop('kick-overhead-v3',512,543,pedalCrop.x,pedalCrop.y,pedalCrop.w,pedalCrop.h,p.x+(layout.leftHanded?-pedalWidth*.68:pedalWidth*.68),pedalY+.4,pedalWidth,pedalHeight,layout.leftHanded?14:-14,'png','kick-pedal-double');end();end();
      }
      else if(p.kind==='tom'||p.kind==='snare'){
        const floor=p.id.startsWith('floor'),name=p.kind==='snare'?'snare':floor?'floor-tom':'rack-tom',width=p.r*(p.kind==='snare'?2.35:floor?2.65:2.18),ratio=p.kind==='snare'?225/221:floor?262/252:239/238;
        if(floor)floorTomAsset(p.x,p.y,width,width*ratio,p.id);else drumAsset(name,p.x,p.y,width,width*ratio);
      }
      else if(p.kind==='hihat'){
        const width=p.r*2.15,height=width*512/313;group('rotate(180 '+f(p.x)+' '+f(p.y)+')','hihat-foreground');
        drumAssetEllipseLayer('hihat-overhead-v2',313,512,p.x,p.y,width,height,156.5,148,149,148,'over',512,'png','hihat-cymbal-foreground');end();
      }
      else if(p.kind==='cymbal'){
        if(['ride','crash'].includes(p.variant)){const name=p.variant,width=p.r*2.85,height=width*(name==='ride'?512/461:512/508),spec=name==='ride'?[461,512,230.5,263.5,209,196]:[508,512,254,276,171,170];drumAssetEllipseLayer(name,spec[0],spec[1],p.x,p.y,width,height,spec[2],spec[3],spec[4],spec[5],'over',spec[1],'webp',name+'-cymbal-foreground');}
        else cymbal(p.x,p.y,p.r,false,p.variant||'crash');
      }
      else if(p.kind==='pad')pad(p.x,p.y,p.w,p.h);
      else if(p.kind==='bongos')bongos(p.x,p.y);
      else if(p.kind==='table')rackTable(p.x,p.y,p.variant,p.w,p.h);
      if(drumMicParts.has(p.id)){
        const radius=p.r||Math.max(p.w||0,p.h||0)/2,markerX=p.x+Math.max(3.2,radius*.62),markerY=p.y-Math.max(3.2,radius*.62);
        group('translate('+f(markerX)+' '+f(markerY)+')','mic-indicator');circle(0,0,2.35,'#d62f47',.45,'#fff');rect(-.58,-1.16,1.16,1.78,'#fff',0,.52,'none');path('M-1.1.1Q-1.1 1.45 0 1.45Q1.1 1.45 1.1.1M0 1.45V2M-.72 2H.72','none',.35,'#fff');end();
      }
      end();
    }
  }else if(type==='drums'||type.startsWith('drums-')){
    group('translate(0 6)');
    group('translate(64 11)','drummer-throne');
    feet(0,0,10,30);circle(0,0,8.6,'#555',.8);circle(0,0,7.4,'none',.4,'#aaa');end();
    // Kick is in front of the player's right foot (audience-left); pedal faces the throne.
    kick(36,48,28,23);
    pedal(84,35,-25,'hihat-pedal');
    drum(26,36,10.3);drum(44,57,8.5);drum(63,56,7.5);
    // Main snare directly in front of the throne, between both feet.
    feet(64,36,10.2,20);drum(64,36,9.3,true);
    cymbal(86,37,9,true,'hihat');
    // Cymbals sit close to the shells, with the slight overlaps seen from overhead.
    cymbal(22,64,14.3,false,'ride');
    cymbal(84,62,11.8,false,'crash');
    if(large){cymbal(10,43,9.2,false,'crash');cymbal(108,57,11,false,'crash');pad(106,34);}
    end();
  }else if(type.startsWith('keys-')){
    const stage4=type==='keys-stage4',hammond=type==='keys-hammond',hammondB3=type==='keys-hammond-b3',electro=type==='keys-electro',bassStation=type==='keys-bassstation2',moog=type==='keys-moog-sub37',kronos=type.startsWith('keys-kronos3-'),sv1=type.startsWith('keys-sv1-');
    const depth=bassStation?179:hammondB3?178:moog?165:kronos?(type.endsWith('-61')?102:type.endsWith('-73')?89:76):sv1?(type.endsWith('-73')?91:77):hammond?101:electro?83:stage4?82:90;
    rect(1,1,298,depth-2,hammond||hammondB3?'#777':'#6b6b6b',.85,hammondB3?4:1.7);
    rect(2,2,6,depth-4,'#aaa',.4,.5);rect(292,2,6,depth-4,'#aaa',.4,.5);
    if(hammondB3){
      group('','hammond-b3-console');rect(8,7,284,164,'#858585',.7,3);rect(13,11,274,28,'#5b5b5b',.5,1.5);
      for(const start of [35,105,175,245])drawbars(start,15,start===245?5:9,3.1);
      for(const [x,y] of [[18,18],[25,18],[18,30],[25,30],[280,19],[280,30]])knob(x,y,2.8);
      keybed(30,43,257,52,61,12,true);keybed(30,101,257,52,61,12,true);
      for(const y of [48,106]){rect(13,y,14,42,'#292929',.35,1);for(let i=0;i<6;i++)rect(15,y+2+i*6.4,10,4.8,i<2?'#d7d7d7':'#aaa',.2,.6);}
      rect(18,158,264,9,'#656565',.35,1);for(let x=24;x<280;x+=18)line(x,159,x-3,165,.22,'#a7a7a7');end();
    }else if(kronos){
      const keys=type.endsWith('-61')?61:type.endsWith('-73')?73:88,panelBottom=Math.max(34,depth*.43),keyY=panelBottom+2;
      group('','korg-kronos3-panel');rect(9,6,282,panelBottom-9,'#3a3a3a',.45,1);
      rect(13,10,27,panelBottom-17,'#4c4c4c',.35,.7);circle(20,18,4.2,'#777',.35);path('M20 14V22M16 18H24','none',.55,'#ddd');rect(28,25,8,Math.max(5,panelBottom-31),'#777',.3,2);
      for(let i=0;i<8;i++)knob(53+i*9,15,2.5);for(let i=0;i<9;i++){line(50+i*8.2,23,50+i*8.2,panelBottom-5,.35,'#aaa');rect(47.9+i*8.2,25+(i%3)*2,4.2,5,'#c0c0c0',.22,.7);}
      const screenX=145,screenW=62;rect(screenX,10,screenW,panelBottom-15,'#202020',.55,1.2);rect(screenX+4,13,screenW-8,panelBottom-21,'#8e9692',.25,.6);for(let i=0;i<4;i++)line(screenX+7,17+i*4,screenX+screenW-7,17+i*4,.18,'#d8dcda');
      circle(221,18,3.7,'#aaa',.3);for(const [x,y] of [[216,27],[226,27],[237,15],[248,15],[259,15],[270,15],[281,15],[237,27],[248,27],[259,27],[270,27],[281,27]])rect(x-2.7,y-2.2,5.4,4.4,'#9b9b9b',.22,.7);end();
      group('','korg-kronos3-keybed');keybed(36,keyY,255,depth-keyY-5,keys);rect(10,keyY,22,depth-keyY-5,'#373737',.4,1);end();
    }else if(sv1){
      const keys=type.endsWith('-73')?73:88,panelBottom=Math.max(31,depth*.42),keyY=panelBottom+1;
      group('','korg-sv1-rounded-console');rect(6,5,288,depth-10,'#4a4a4a',.65,8);rect(14,9,272,panelBottom-12,'#5b5b5b',.35,4);
      for(const [x,count] of [[25,3],[61,3],[98,3],[136,3],[174,3],[212,2]]){rect(x-8,11,count*10+9,panelBottom-17,'#505050',.25,2);for(let i=0;i<count;i++)knob(x+i*10,18,2.7);}
      rect(239,12,20,panelBottom-19,'#202020',.35,5);circle(249,18,3.6,'#d1d1d1',.3);for(let i=0;i<8;i++)rect(266+(i%4)*5,12+Math.floor(i/4)*7,3.6,4.6,'#aaa',.2,.8);end();
      group('','korg-sv1-keybed');keybed(25,keyY,266,depth-keyY-5,keys);rect(10,keyY,11,depth-keyY-5,'#3a3a3a',.35,3);end();
    }else if(bassStation){
      group('','bass-station-panel');rect(9,7,282,80,'#444',.45,1);
      for(const [x,w] of [[13,53],[70,46],[120,55],[179,51],[234,52]]){rect(x,11,w,69,'#555',.32,.6);line(x+4,26,x+w-4,26,.35,'#aaa');}
      for(const [x,y] of [[21,19],[35,19],[52,19],[79,19],[95,19],[108,19],[130,19],[145,19],[161,19],[188,19],[204,19],[219,19],[244,19],[260,19],[277,19],[23,39],[39,39],[56,39],[80,39],[99,39],[129,39],[147,39],[164,39],[189,39],[209,39],[244,39],[263,39],[279,39]])knob(x,y,3.7);
      rect(20,54,16,12,'#bbb',.35,.8);rect(43,54,16,12,'#bbb',.35,.8);rect(76,53,25,14,'#222',.4,.7);
      for(const x of [126,140,154,188,202,216,241,254,267,280])rect(x,55,7,10,'#aaa',.25,1);
      out+='<text x="13" y="76" font-size="6" font-family="sans-serif" fill="#ddd" stroke="none">BASS STATION II</text>';end();
      group('','bass-station-keybed');keybed(42,94,249,77,25);rect(10,96,26,75,'#383838',.4,1);
      for(const x of [18,29]){rect(x-4,108,8,45,'#777',.4,4);line(x,112,x,145,.8,'#ddd');circle(x,131,2.1,'#bbb',.3);}end();
    }else if(moog){
      group('','moog-subsequent-panel');rect(9,7,282,76,'#363636',.5,1);
      rect(13,11,29,68,'#4f4f4f',.35,.5);for(const x of [21,34])for(const y of [20,34,49,64])knob(x,y,3.6);
      for(const [x,w] of [[47,49],[100,42],[146,45],[195,47],[246,40]]){rect(x,11,w,68,'#4c4c4c',.3,.5);line(x+4,27,x+w-4,27,.3,'#aaa');}
      for(const [x,y] of [[56,19],[70,19],[86,19],[108,19],[122,19],[135,19],[156,19],[172,19],[185,19],[204,19],[221,19],[236,19],[255,19],[273,19],[56,39],[72,39],[89,39],[108,39],[126,39],[156,39],[174,39],[204,39],[222,39],[255,39],[273,39],[57,61],[75,61],[110,61],[128,61],[157,61],[176,61],[205,61],[223,61],[256,61],[274,61]])knob(x,y,3.4);
      rect(104,48,29,15,'#1f1f1f',.4,.8);rect(108,51,21,9,'#999',.25,.3);for(const x of [151,163,175,200,212,224,249,261,273])rect(x,57,7,10,'#aaa',.25,1);
      out+='<text x="48" y="75" font-size="5.7" font-family="sans-serif" fill="#ddd" stroke="none">SUBSEQUENT 37</text>';end();
      group('','moog-keybed');keybed(37,89,254,69,37);rect(10,89,22,69,'#3d3d3d',.4,1);
      for(const x of [16,26]){rect(x-3.5,100,7,42,'#777',.4,3);line(x,104,x,137,.7,'#ddd');}end();
    }else if(hammond){
      rect(9,3,282,18,'#a1a1a1',.5,.5);
      rect(11,23,279,28,'#363636',.4,.6);
      rect(15,27,28,12,'#bcbcbc',.4,.4);knob(47,33,3);
      for(const xx of [65,103,171,209])drawbars(xx,27,9,3.2);
      knob(146,36,4);for(let i=0;i<5;i++)rect(254+i*6,29,4,10,'#ddd',.3,.3);
      keybed(12,54,43,41,7,0,true);keybed(56,54,234,41,36);
    }else{
      const ky=depth*.5,kx=stage4?21:electro?14:34,kw=288-kx;
      keybed(kx,ky,kw,depth-ky-5,stage4?52:electro?43:36,stage4?5:electro?2:0);
      rect(12,ky+1,4,6,'#bbb',.3,1);rect(15,ky+11,2,11,'#333',.35,1);
      if(stage4){
        drawbars(20,7,9,2.5);panel(48,5,29,31,3);panel(81,5,30,31,3);
        rect(116,6,29,16,'#b9b9b9',.4,.4);knob(151,13,3.2);
        for(let i=0;i<4;i++)rect(116+i*9,27,5,4,'#aaa',.3,.3);
        panel(161,5,70,31,5);panel(235,5,48,31,4);
      }else if(electro){
        drawbars(21,7,9,3);panel(56,5,33,28,3);
        rect(96,6,29,15,'#bbb',.4,.4);knob(133,14,3);
        for(let i=0;i<5;i++)rect(97+i*8,27,5,4,'#bbb',.25,.3);
        panel(146,5,44,28,4);panel(194,5,43,28,4);panel(241,5,43,28,4);
      }else{
        rect(49,14,30,15,'#bbb',.4,.4);knob(48,6,2.4);
        for(let i=0;i<5;i++)rect(48+i*8,33,5,4,'#333',.3,.3);
        panel(85,5,31,33,3);panel(120,5,28,33,3);
        rect(152,5,31,33,'#444',.4,.5);
        for(let i=0;i<4;i++){line(157+i*7,8,157+i*7,32,.7,'#999');rect(155.5+i*7,13+i*3,3,5,'#bbb',.35,.4);}
        panel(187,5,47,33,4);panel(238,5,22,33,2);panel(264,5,22,33,2);
      }
    }
  }else if(type==='double-bass'){
    group('','double-bass-body');
    path('M48 154C35 151 24 157 20 170C17 180 21 190 29 198C16 209 10 223 11 243C12 267 27 293 47 302C52 305 68 305 73 302C93 293 108 267 109 243C110 223 104 209 91 198C99 190 103 180 100 170C96 157 85 151 72 154C68 160 65 165 60 165C55 165 52 160 48 154Z','#d8d8d8',1);
    path('M48 159C37 157 28 161 25 172C22 182 28 190 37 197C23 211 18 224 18 243C19 263 31 285 49 295C54 298 66 298 71 295C89 285 101 263 102 243C102 224 97 211 83 197C92 190 98 182 95 172C92 161 83 157 72 159C67 166 65 170 60 170C55 170 53 166 48 159Z','none',.45,'#f8f8f8');
    for(const side of [-1,1]){const x=60+side*22;path('M'+x+' 190C'+(x+side*10)+' 198 '+(x+side*10)+' 216 '+x+' 224C'+(x+side*6)+' 232 '+(x+side*6)+' 247 '+x+' 257','none',1.1,'#555');circle(x+side*3,221,1.8,'#777',.35);}
    path('M42 261Q60 253 78 261L74 275H46Z','#777',.6);path('M43 219Q60 212 77 219L74 225H46Z','#bbb',.55);for(const x of [49,56,64,71])line(x,221,x+(x<60?-3:3),267,.28,'#555');end();
    group('','double-bass-neck');path('M52 55H68L70 172H50Z','#aaa',.7);for(let i=1;i<17;i++){const y=58+(112*i/17);line(52-(y-58)*.018,y,68+(y-58)*.018,y,.35,'#666');}
    path('M53 57L49 18Q50 5 60 3Q70 5 71 18L67 57Z','#aaa',.75);
    path('M55 14Q60 6 65 14Q67 20 60 25Q54 29 57 35Q60 39 64 34','none',1.2,'#555');
    for(const [x,y,side] of [[51,24,-1],[50,39,-1],[69,24,1],[70,39,1]]){line(x,y,x+side*7,y,.8);ellipse(x+side*9,y,3,2,'#ccc',.4);}end();
    group('','double-bass-endpin');rod(60,300,60,324,1.7);circle(60,325,2.2,'#555',.4);end();
  }else if(['guitar','guitar-tele','guitar-les-paul','guitar-es','bass','bass-j','acoustic'].includes(type)){
    const pBass=type==='bass',jBass=type==='bass-j',bass=pBass||jBass,acoustic=type==='acoustic';
    const tele=type==='guitar-tele',lesPaul=type==='guitar-les-paul',es=type==='guitar-es',gibson=lesPaul||es;
    // Fresh V29 silhouettes traced from orthogonal manufacturer product photography.
    // The outer contour is kept model-specific all the way from the strap pin to the tuners.
    const guitarSilhouette=({
      guitar:'M47.9 280L47.3 279.2L48.7 278.1L48.3 277.5L38.8 277.1L26.9 275.2L20.2 272.5L14.2 268.6L10 264.6L6.5 259.2L5 253.8L4.8 246.1L7.1 234.2L16.3 211.9L18.3 203.4L17.9 196.1L10.8 170.1L10.8 161.5L12.5 154.8L15.9 150.1L20.6 147.8L20 145.7L21.3 145.9L23.8 147.3L21.9 148.6L23.3 151.3L24.2 161.3L26 165.1L28.5 167.8L32.3 170L37.5 170.5L40.2 169.4L42.5 165.5L44 53.9L43.3 51.3L40 48L41.2 42.6L40 42.2L39.2 43.6L37.9 43.4L36.7 42.4L36.7 40.5L38.3 38L40.4 38.4L40.6 40.1L41.9 40.5L42.9 37.4L43.3 35.9L42.5 35.5L41 37L39 36.2L38.6 33.7L40.4 31.2L42.5 31.8L42.7 33.7L43.8 33.7L44.2 32.8L45.2 29.3L43.8 28.7L43.1 30.3L41 29.5L40.8 26.6L42.1 24.7L43.3 24.7L44.4 25.1L44.4 27L45.8 27.2L47.1 22.4L46 22L45.2 23.5L42.9 22.8L42.7 20.1L44.2 18L45.2 18L46.5 18.5L46.5 20.5L47.9 20.3L49 15.7L47.9 15.5L46.9 16.8L45.2 16.2L44.8 13L46.9 11.2L48.5 11.6L48.5 13.7L49.6 13.7L51.2 9.3L50 8.5L49.2 10.1L47.1 9.5L47.1 5.7L48.1 4.5L50.4 4.9L50.4 6.8L51.9 7L53.1 4.7L55.8 2.6L59.6 2L62.5 3.2L64.6 5.3L65.6 11.2L64.2 14.5L59.4 18.7L63.3 41.2L57.9 45.5L56 51.3L57.7 180.5L63.3 183.2L69.6 182.7L75 178.4L77.7 169L79.1 167.1L82.7 166.3L86.4 169.2L88.5 175.5L88.7 181.1L87.3 187.8L82.5 199.8L81.7 207.7L83.7 214.6L92.7 234.8L94.6 242.9L95.2 252.3L94.2 257.9L92.1 263.3L89.1 267.7L83.3 272.5L78.5 274.8L71.2 276.7L50.2 277.7L51.3 279.8Z',
      'guitar-tele':'M49.2 280L48.1 279.6L48.7 278.1L27.3 276.7L20 274.6L14.4 271.5L9.4 266.1L6.3 260.6L4.8 254.8L4.6 247.3L7.9 233.2L15.9 215.7L18.1 207.9L17.3 200.2L11.3 182.8L11.1 175.9L12.5 170.9L14.4 167.5L18.1 164.6L26 163.2L25.2 160.9L28.8 161.5L27.3 163.4L38.6 169L41.2 168.6L42.5 165.9L44.4 52L44 50.5L40.4 46.8L41.7 40.7L40.4 40.3L39.6 41.8L37.7 41.2L37.1 38.7L38.8 36.1L41 36.4L41.2 38.6L42.3 38.6L42.9 37.2L43.7 33.9L42.5 33.6L41.7 35.1L39.6 34.5L39.8 30.3L40.8 29.3L42.7 29.7L43.3 32L44.8 30.9L45.8 27.2L44.6 26.8L43.7 28.4L41.7 27.8L41.3 24.7L43.5 22.6L45.2 23.2L45.2 25.1L46.3 25.1L47.7 20.5L46.5 20.1L45.8 21.4L43.8 20.9L43.3 18.2L45.2 15.7L47.1 16.2L47.1 18.4L48.5 18.4L49.8 14.1L48.8 13.2L47.7 14.9L45.8 14.1L45.4 11L47.5 8.9L49.2 9.5L49.2 11.6L50.6 11.4L51.9 7L50.6 6.4L49.8 8L47.7 7.2L47.7 3.5L49.6 2.2L51.2 2.8L51.2 4.7L52.7 4.7L54.6 2.6L58.7 2L62.5 4.9L63.5 9.9L59.8 16.6L62.3 24.3L62.3 29.1L57.9 42.4L56.5 49.5L57.9 179L59.4 181.9L61.7 183.6L67.1 183.4L70 181.9L72.9 178.6L76.4 168.8L78.5 165.9L80.8 165.1L83.5 165.5L87.1 169L88.9 174.4L88.9 182.8L82.7 200.2L81.9 206.7L83.9 215.2L90 227.9L93.5 237.3L95.2 245.6L95.4 252.3L92.9 261.5L88.3 268.6L82.9 273.1L74 276.3L51.5 278.1L51.9 279.8Z',
      'guitar-les-paul':'M5.1 234.6L6.8 224.9L10 217L14.3 210.5L22.1 201.7L24.7 196.1L24.1 189.6L19.2 176.6L19.2 169.7L20.1 166.5L22.4 165.1L26.3 165.5L28.3 166.1L30.6 169.7L33.5 172L37.8 170.7L40 168.1L41 165.1L42 152.4L44.9 148.5L46.6 143.6L47.6 51.3L45.6 44.7L41.7 40.5L40.7 33.3L38.7 33.3L38.4 35.6L35.8 35.6L34.2 33.3L34.5 30.7L36.5 29.1L38.1 29.4L38.7 31.4L40.7 31L40.7 27.8L39.7 23.2L38.1 23.2L37.8 25.2L36.8 25.8L34.8 25.5L33.2 23.2L33.5 20.6L35.5 19L37.1 19.3L37.8 21.3L39.7 21.3L38.4 13.1L36.8 13.1L36.5 14.7L34.2 15.7L32.5 14.7L31.9 11.1L34.2 8.9L36.1 9.5L36.1 11.1L38.1 11.1L37.1 6.6L37.4 4.3L41.7 4.3L46.2 2L51.5 2L54.1 3.3L59 3L59 7.2L60.9 7.5L62.6 9.5L62.2 12.4L60.6 14.1L59 14.1L59 17L61.3 17.3L62.9 19.3L62.2 22.9L59.3 23.9L59.3 25.8L59.6 27.5L61.9 27.5L63.9 29.4L63.5 32.3L62.2 33.7L60.3 34L60.9 40.2L58.3 45.4L58.3 50L59 50.3L60.6 153.4L65.2 153.7L69.1 155L70.4 154.7L70.1 153.1L72.4 153.7L73 155L72 155L71.7 156L76.6 158.6L82.5 166.5L83.8 172L83.4 176.6L81.8 181.8L76.9 191.2L76.3 197.4L78.2 202.7L88.3 215.7L92.3 223.9L94.9 235L94.2 248.3L92.6 254.2L89.6 260.1L85.7 265.3L80.2 270.2L66.2 276.7L58.3 278L49.2 278L49.8 279.7L47.2 280L46.6 279L47.6 278L46.6 277.7L37.4 276.7L27.6 273.8L20.5 269.6L14.9 264.7L10 258.1L6.8 250L5.5 244.1Z',
      'guitar-es':'M3 227.4L4.2 220.7L7.4 212.3L11.7 205.5L19.5 195.8L21.6 190.7L21.3 186.8L16.6 174.9L14.9 167.8L14.9 161L16.6 155.2L19.5 151.6L21.3 150.7L27.7 150.4L30.6 152.6L32.9 158.1L35.2 161L37.8 161.6L39.8 159.1L42.2 44.6L42.7 41.3L42.2 38.4L40.7 36.2L41.3 31.7L38.7 32L37.8 29.1L38.7 27.2L41.9 27.8L42.5 23L39.3 23.3L38.7 20.4L39.6 18.8L42.7 19.4L43 14.9L39.8 15.2L39.3 11.7L39.8 10.4L43 11L43.3 4.3L46.8 3.9L50 2L51.7 2.6L54.4 2L57.3 3.6L60.4 3.3L61.6 4.6L60.4 11.4L62.5 9.7L65.7 9.4L66.2 12.6L64.8 14.3L60.2 12.3L59 19.7L61.3 18.1L64.5 17.8L65.1 21L64.2 22.6L59 21L58.1 28.4L60.7 26.5L63.6 26.2L64.2 26.8L64.2 29.7L63.6 31L61.3 31L59 29.4L57.8 29.7L57.5 35.9L54.1 39.4L52.6 44.2L52.9 146.5L53.8 150.4L56.1 153.6L57 158.4L59 161L61 162L62.8 161.3L64.2 159.4L66.8 152.9L70 150.7L76.4 150.7L78.7 152.3L81.3 155.8L82.8 161.3L82.8 168.4L81 175.2L77 185.5L76.7 191.3L79.6 197.1L90 210.3L94.1 218.4L96.1 225.5L97 231.9L96.1 243.9L94.4 250L90.3 258.1L84.5 265.2L80.5 268.7L72.9 273.2L66 276.1L56.1 278.1L50.6 278.1L51.5 279L51.2 280L48.3 280L48 279L48.8 278.1L36.7 276.5L28 273.2L20.4 268.4L12.6 260.3L7.4 251.9L4.5 244.2L3 235.8Z',
      bass:'M49.2 280L48.7 279.4L49.8 278.1L49 277.5L31.5 276.2L25.4 274.2L20.6 271.3L16.7 267.3L13.4 261.3L11.7 254.6L11.3 247.3L14 236.9L20.9 222.1L23.1 214.4L23.1 205.5L17.3 184.6L16.5 172.3L18.6 163L22.1 158.4L25.8 156.5L25 154.6L28.3 155.1L26.9 156.7L29.8 160.1L31.3 170.5L34 177.5L38.1 180.2L40.6 180L42.7 178.2L45 55.7L43.8 53.9L39.6 52.6L38.3 51.1L38.6 44.3L32.1 47.4L30.6 46.4L29 42L29.8 40.3L33.3 37.6L35.8 38.7L36.5 41.1L38.5 43L39.4 41.1L40.8 33.2L38.3 33.9L36.1 36.1L34.2 36.2L32.7 35.1L31.3 30.5L34.4 26.8L36.1 26.4L38.1 27.6L39.2 30.5L41.3 31.6L43.1 22L40.2 23L38.5 24.9L36.1 24.9L34.8 23.5L33.6 19.1L36.7 15.7L38.5 15.3L40.2 16.2L41 18.5L43.5 20.7L45.4 10.7L42.3 11.8L40.6 13.7L38.5 13.7L36 9.7L36.1 7.2L38.8 4.3L40.6 3.9L42.3 4.7L43.3 7.4L45.8 9.5L48.5 4.1L51.9 2.2L55 2L58.7 3.5L61.7 8.5L61.2 14.3L57.5 18.4L56.9 20.9L57.3 24.9L60.6 35.5L61.4 45.3L57.7 47L54.8 51.6L57.3 190.3L58.7 192.8L60.6 194L63.9 193.8L67.1 192.3L70 188.4L71.9 180.7L74.6 178.4L78.5 179.2L81.7 183.2L82.9 189.4L82.5 195.3L81 201.7L77.5 210L76.9 215.2L78.5 220.6L86.9 239.6L88.5 246.7L88.7 253.8L87.7 260L86 264.2L82.1 269.6L77.9 273.1L67.3 276.7L51.7 277.5L51 278.5L51.9 279.8Z',
      'bass-j':'M48.7 280L47.1 279.2L47.9 277.5L29.6 272.9L20.6 267.7L15.9 262.9L11.7 255.4L9.8 248.3L9.6 241.7L12.3 231.3L20.6 214.2L22.5 208.4L22.3 201.3L17.3 184L16.5 172.8L19 162.6L21.7 158.4L25.8 156.3L25.2 154.4L28.3 154.9L27.1 156.7L30.6 160.3L32.1 172.5L34 177.5L36.9 179.6L40 179.4L41.9 177.8L44.6 56.6L43.3 53.9L37.7 51.3L38.1 44.1L31.5 47.2L29.8 46.1L28.5 41.4L31.3 38L33.6 37.6L35.2 38.7L36 41.1L38.6 42.8L40.4 33L37.5 33.7L35.2 35.9L33.1 35.9L31.7 34.3L30.8 29.9L33.6 26.6L35.8 26.2L37.1 27L38.1 29.7L40.8 31.6L42.7 21.8L39.4 22.6L37.5 24.5L35.2 24.5L32.9 20.5L32.9 18.5L35.6 15.5L38.3 15.1L40.2 18.4L43.1 20.3L44.8 10.3L41.7 11.2L39.6 13.4L37.7 13.4L35.2 9.1L35.4 6.6L38.3 3.7L40.2 3.5L41.9 4.9L42.7 7.2L45.2 8.9L48.7 3.5L51.3 2.2L54.6 2L59.2 4.5L61.4 10.1L60 15.5L55.6 19.9L56 25.5L59.2 36.1L60 44.1L55.8 47L53.5 52.8L56.2 188.6L58.1 191.9L60.4 193.6L66.4 193L70 188.4L71.9 180L74.2 178.4L78.1 179.4L81.6 184L83.5 192.3L83.3 200.7L81 211.5L77.3 221.3L77.1 227.5L80 235.4L85.4 243.3L88.9 250.4L90.2 256.1L90.4 262.5L87.3 270.8L83.3 275L79.4 277.3L70.8 279L50.2 278.1L50.8 279.8Z'
    })[type];
    if(acoustic){
      group('','dreadnought-body');
      // Martin D-28 proportions: square shoulder, shallow waist and broad lower bout.
      path('M43 136C31 136 22 139 16 146C9 154 9 168 12 181C15 192 20 199 18 208C16 219 7 227 4 239C0 252 3 263 12 271C21 279 36 282 50 282C64 282 79 279 88 271C97 263 100 252 96 239C93 227 84 219 82 208C80 199 85 192 88 181C91 168 91 154 84 146C78 139 69 136 57 136Z','#e4e4e4',1);
      group('','dreadnought-binding');
      path('M43 139C33 139 24 142 19 148C13 155 13 168 15 180C18 192 23 199 21 209C19 220 10 229 8 240C5 251 8 261 16 268C24 275 37 278 50 278C63 278 76 275 84 268C92 261 95 251 92 240C90 229 81 220 79 209C77 199 82 192 85 180C87 168 87 155 81 148C76 142 67 139 57 139','none',.45,'#fafafa');end();
      group('','dreadnought-rosette');circle(50,178,15.4,'none',.45,'#4e4e4e');circle(50,178,13.5,'#bcbcbc',.55);circle(50,178,11.2,'#303030',.55);circle(50,178,16.8,'none',.3,'#777');end();
      group('','dreadnought-pickguard');path('M62 169C72 170 80 176 81 187C83 200 78 211 68 217C62 218 58 213 58 205C58 198 61 192 61 185C61 178 59 174 62 169Z','#5a5a5a',.55);path('M65 173C72 175 77 180 77 188C78 198 74 206 68 211','none',.35,'#aaa');end();
      group('','dreadnought-bridge');path('M29 229Q36 226 41 228H59Q64 226 71 229L69 240Q61 237 50 238Q39 237 31 240Z','#454545',.65);rect(37,230,26,2.2,'#eee',.25,.5);for(let i=0;i<6;i++)circle(39.5+i*4.2,235.2,1.15,'#eee',.25);end();
      end();
    }else if(pBass){
      group('','precision-body');
      path(guitarSilhouette,'#dadada',1);
      group('','precision-body-contour');path('M21 165C18 178 22 192 25 204C28 215 23 227 18 238M80 185C84 195 79 207 77 215C75 224 83 238 86 249','none',.4,'#f8f8f8');end();
      group('','precision-pickguard');
      path('M42 184C36 187 33 194 34 205C35 214 34 222 30 232C27 241 27 252 31 260C35 268 43 272 52 271C58 270 64 273 69 270C74 266 77 259 79 251C81 241 77 232 76 223C74 213 79 204 75 196C71 187 64 186 57 191L56 184Z','#f8f8f8',.65);
      for(const [x,y] of [[39,191],[68,197],[34,243],[43,266],[69,265],[75,246]])circle(x,y,.8,'#888',.22);end();
      end();
    }else if(jBass){
      group('','jazz-bass-body');
      path(guitarSilhouette,'#d8d8d8',1);
      group('','jazz-body-contour');path('M20 165C17 178 22 190 24 202C26 212 20 224 15 234M81 186C85 199 80 211 77 221C75 230 84 241 88 251','none',.4,'#f8f8f8');end();
      group('','jazz-pickguard');
      path('M42 186C36 189 34 197 35 207L37 218L32 228C29 236 29 246 33 253C39 260 49 262 58 259C63 257 66 253 68 247L69 230C68 219 75 207 73 199C71 190 64 188 57 192L56 186Z','#f7f7f7',.65);
      for(const [x,y] of [[39,193],[66,199],[35,233],[39,251],[60,254]])circle(x,y,.8,'#888',.22);end();
      end();
    }else if(tele){
      group('','telecaster-body');
      path(guitarSilhouette,'#d6d6d6',1);
      group('','telecaster-pickguard');path('M42 164C34 167 31 178 30 191C28 207 23 220 24 237C35 247 51 246 65 250L78 255C85 245 79 226 77 209C75 193 80 178 77 167C71 174 65 179 57 181L56 164Z','#f8f8f8',.55);end();end();
    }else if(lesPaul){
      group('','les-paul-body');
      path(guitarSilhouette,'#d8d8d8',1);
      group('','les-paul-carved-top');path('M43 152C34 155 23 153 19 169C16 181 23 190 21 203C19 218 11 230 11 244C11 260 23 272 39 276C55 280 73 275 83 264C93 253 88 239 83 228C78 217 75 207 78 196C81 185 82 174 75 166C69 160 64 171 58 181L56 152Z','none',.55,'#f8f8f8');end();
      path('M58 191Q72 195 72 217L61 224L57 205Z','#f4f4f4',.45);end();
    }else if(es){
      group('','es-335-body');
      path(guitarSilhouette,'#e0e0e0',1);
      group('','es-body-binding');path('M44 148C39 158 34 157 29 151C23 145 16 148 13 157C10 167 15 178 22 188C28 198 26 208 19 218C11 230 9 244 14 257C20 273 34 282 50 282C66 282 80 273 86 257C91 244 89 230 81 218C74 208 72 198 78 188C85 178 90 167 87 157C84 148 77 145 71 151C66 157 61 158 56 148L56 182H44Z','none',.55,'#fafafa');end();
      for(const side of [-1,1]){const x=50+side*25;group('','f-hole');path('M'+(x-side*2)+' 205C'+(x+side*5)+' 208 '+(x+side*6)+' 218 '+x+' 225C'+(x-side*4)+' 231 '+(x-side*4)+' 240 '+(x+side*2)+' 245M'+(x-side*6)+' 208Q'+x+' 204 '+(x+side*5)+' 207M'+(x-side*4)+' 245Q'+x+' 249 '+(x+side*5)+' 246','none',1.15,'#4a4a4a');end();}end();
    }else{
      group('','stratocaster-body');
      path(guitarSilhouette,'#d0d0d0',1);
      group('','stratocaster-pickguard');path('M42 154C34 161 34 177 30 192C27 207 20 222 22 240C24 255 37 264 52 261C61 259 69 268 78 263C86 255 79 239 76 225C73 211 80 195 76 181C73 170 65 162 57 169L56 154Z','#f8f8f8',.55);end();end();
    }
    const nut=acoustic?42:bass?56:gibson?47:52;
    const heel=acoustic?166:bass?194:lesPaul?165:es?162:tele?183:181;
    const heelHalf=acoustic?10:bass?7:gibson?7:6.5;
    path('M44 '+nut+'H56L'+(50+heelHalf)+' '+heel+'H'+(50-heelHalf)+'Z','#aaa',.65);
    if(acoustic){
      group('','martin-headstock');
      path('M43 42L40.5 8Q40.3 4 44 4L56 4Q59.7 4 59.5 8L57 42Z','#8f8f8f',.8);
      path('M45 8Q50 5.5 55 8M47 12Q50 10 53 12','none',.38,'#dedede');
      for(let i=0;i<3;i++)for(const side of [-1,1]){const yy=13+i*9;group('','tuning-machine');line(side<0?41:59,yy,side<0?35:65,yy,.75);ellipse(side<0?32.5:67.5,yy,3.2,2.1,'#d6d6d6',.4);circle(side<0?43:57,yy,1.7,'#ededed',.35);end();}end();
    }
    else if(bass){
      group('',jBass?'jazz-headstock':'precision-headstock');
      path(jBass?'M44 56L43 51L44 14Q44.5 7 50 3Q56.5 0 60.5 5Q64 10 61 15Q59 18 55.5 20Q53.5 22 55.5 29L59.5 42Q61.5 48 57 51L56 56Z':'M44 56L43 51L44 13Q44.5 7 51 3Q58 0 62 6Q65.5 11 62.5 16Q60.5 19 56.5 21Q54.5 23 56.5 29L61 41Q63 47 58 51L56 56Z','#c8c8c8',.85);
      path(jBass?'M47 47L47.5 16Q48 9 52 6Q56 3 58 6':'M47 47L47.7 15Q48 8 52.5 5Q57 2.5 59.5 6','none',.35,'#f4f4f4');
      for(let i=0;i<4;i++){
        const yy=12+i*12,xx=53-i*1.8;
        group('','tuning-machine');
        line(xx-2,yy,xx-8,yy-1.2,.8);ellipse(xx-11,yy-1.2,4,2.4,'#ccc',.45);
        circle(xx,yy,2.3,'#ddd',.4);circle(xx,yy,1.1,'#777',.3);
        line(46+i*2.6,59,xx,yy,.22,'#777');end();
      }
      circle(53,49,1.3,'#ddd',.35);path('M49 54q2-6 4 0Z','#555',.35);end();
    }else if(gibson){
      group('',lesPaul?'les-paul-headstock':'es-headstock');
      path('M43 47L42 39L41 8Q41 4 45 5L49 2Q50 1 51 2L55 5Q59 4 59 8L58 39L57 47Z','#a9a9a9',.9);
      for(const [x,y,side] of [[41,13,-1],[40,25,-1],[42,37,-1],[59,13,1],[60,25,1],[58,37,1]]){group('','tuning-machine');line(x,y,x+side*6,y,.8);ellipse(x+side*9,y,3.1,2,'#ccc',.45);circle(x,y,1.6,'#eee',.35);end();}path('M46 12Q50 7 54 12L53 18H47Z','#4f4f4f',.4);end();
    }else if(tele){
      group('','telecaster-headstock');
      path('M44 52L43 46L44 16Q45 8 51 4Q58 0 62 5Q66 11 60 17Q56 20 57 27L61 41Q61 46 57 48L56 52Z','#c5c5c5',.85);
      for(let i=0;i<6;i++){const yy=9+i*6;group('','tuning-machine');line(45,yy,38,yy-.4,.75);ellipse(35,yy-.4,2.7,1.7,'#ccc',.4);circle(46,yy,1.35,'#eee',.35);end();}end();
    }else{
      group('','stratocaster-headstock');path('M44 52L43 46Q42 41 45 34L52 12Q55 4 60 2Q65 2 66 8Q68 14 60 19Q57 22 58 28L63 41Q63 46 58 48L56 52Z','#bcbcbc',.85);
      for(let i=0;i<6;i++){const yy=9+i*6;group('','tuning-machine');line(44,yy,37,yy-.3,.75);ellipse(34,yy-.3,2.8,1.75,'#ccc',.4);circle(45,yy,1.4,'#eee',.35);end();}end();
    }
    const frets=bass?20:acoustic?20:22;
    for(let i=1;i<=frets;i++){
      const yy=nut+(heel-nut)*(1-Math.pow(2,-i/12))/(1-Math.pow(2,-frets/12)),half=3+(yy-nut)/(heel-nut)*3;line(50-half,yy,50+half,yy,.4,'#555');
      if(gibson&&[3,5,7,9,12,15,17,19,21].includes(i)){const iw=i===12?7:5.4;group('','trapezoid-inlay');path('M'+(50-iw/2)+' '+(yy-3)+'L'+(50+iw/2)+' '+(yy-3)+'L'+(50+iw*.38)+' '+(yy+1)+'L'+(50-iw*.38)+' '+(yy+1)+'Z','#ececec',.25);end();}
      else {if([3,5,7,9,15,17,19].includes(i))circle(50,yy-2,1,'#eee',.2);if(i===12){circle(47,yy-2,.85,'#eee',.2);circle(53,yy-2,.85,'#eee',.2);}}
    }
    if(!acoustic){
      if(pBass){
        group('','precision-split-pickup');
        group('translate(50 226) rotate(-6)');rect(-17,-6,17,8,'#343434',.45,1.4);rect(0,-2,17,8,'#343434',.45,1.4);for(const [x,y] of [[-14,-2],[-4,-2],[4,2],[14,2]])circle(x,y,.75,'#ccc',.2);end();end();
        group('','precision-controls');for(const [x,y] of [[75,252],[77,265]]){circle(x,y,3.1,'#dedede',.5);circle(x,y,1.15,'#777',.25);}end();
      }
      else if(jBass){
        group('','jazz-single-coils');
        group('translate(50 217) rotate(-2)');rect(-17,-3.3,34,6.6,'#343434',.45,1.4);for(const x of [-13,-8,-3,3,8,13])circle(x,0,.6,'#ccc',.18);end();
        group('translate(50 244) rotate(-4)');rect(-19,-3.3,38,6.6,'#343434',.45,1.4);for(const x of [-15,-9,-3,3,9,15])circle(x,0,.6,'#ccc',.18);end();end();
        group('','jazz-control-plate');path('M68 230C75 233 80 238 82 246L84 263Q79 270 71 272L68 262Q72 254 70 246Z','#bdbdbd',.55);for(const [x,y] of [[75,240],[77,251],[78,263]]){circle(x,y,3,'#e7e7e7',.45);circle(x,y,1,'#696969',.22);}end();
      }
      else if(tele){group('','telecaster-pickups');rect(40,194,20,5,'#bbb',.5,2);group('translate(50 231) rotate(-10)');rect(-16,-5,32,10,'#aaa',.55,1);for(let i=0;i<6;i++)circle(-10+i*4,0,.8,'#555',.2);end();end();rect(70,207,10,39,'#bbb',.45,5);}
      else if(gibson){group('',lesPaul?'les-paul-humbuckers':'es-humbuckers');for(const yy of [198,226]){rect(36,yy,28,9,'#bbb',.55,1);for(let i=0;i<6;i++)circle(39+i*4.4,yy+4.5,.75,'#555',.2);}end();rect(36,249,28,6,'#777',.5,1);for(const [x,y] of [[73,227],[82,236],[72,250],[82,259]]){circle(x,y,3,'#eee',.5);circle(x,y,1,'#999',.2);}}
      else {group('','stratocaster-pickups');for(const [yy,a] of [[188,0],[207,0],[225,-12]]){group('translate(50 '+yy+') rotate('+a+')');rect(-14,-3,28,6,'#bbb',.55,2);for(let i=0;i<6;i++)circle(-10+i*4,0,.8,'#555',.2);end();}end();}
      const bridge=bass?269:gibson?241:tele?246:245;rect(36,bridge,28,11,'#bbb',.65,1);
      for(let i=0;i<(bass?4:6);i++)rect(39+i*(bass?6:3.6),bridge+2,bass?4:2.6,6,'#eee',.3,.3);
      for(const [x,y] of bass?[]:gibson?[]:tele?[[75,213],[75,238]]:[[72,213],[79,226],[85,239]]){circle(x,y,3,'#eee',.5);circle(x,y,1,'#bbb',.2);}
      if(!bass&&!gibson){group('translate(74 247) rotate(-25)');rect(-1,-6,2,12,'#555',.3,.7);end();}
    }
    const strings=bass?4:6,bridge=acoustic?235:bass?277:gibson?252:252;
    for(let i=0;i<strings;i++)line(46+i*8/(strings-1),nut-5,41+i*18/(strings-1),bridge,.26,'#555');
    if(!acoustic){
      if(gibson)for(let i=0;i<6;i++)line(46+i*8/5,nut-5,i<3?42-i:58+(i-3),12+(i%3)*10,.22,'#666');
      else if(bass)for(let i=0;i<strings;i++)line(46+i*8/(strings-1),nut-5,53-i*1.8,12+i*12,.22,'#666');
      else for(let i=0;i<strings;i++)line(46+i*8/(strings-1),nut-5,tele?46:45,9+i*6,.22,'#666');
    }
  }else if(type==='saxophone'){
    group('','saxophone-body');
    path('M43 51L54 52L60 148C61 168 65 181 77 181C91 181 94 167 88 145L85 137L102 129C116 162 107 193 85 199C63 205 42 189 39 164L38 83Z','#dedede',.8);
    path('M44 58L46 151C47 178 58 192 75 194','none',.65,'#fafafa');
    group('','saxophone-neck');windTube('M48 54L48 43Q48 30 36 24L25 19',8);
    path('M28 14L27 23L9 16Q6 14 7 11L9 8Z','#454545',.6);
    line(12,12,23,17,.5,'#aaa');rect(41,48,15,4,'#aaa',.45,1);rod(47,43,42,29,1);end();
    group('','saxophone-bell');
    path('M82 156C83 139 78 127 73 119L104 108C103 124 100 140 103 157Z','#ededed',.75);
    group('rotate(-19 89 115)');ellipse(89,115,18,8,'#bbb',.75);ellipse(89,115,14.8,5.8,'#666',.4);ellipse(89,116,10,3.4,'#999',.3);end();
    path('M96 126L96 146','none',.55,'#fff');end();
    rod(35,63,37,154,1.5);
    for(const [i,y] of [70,84,98,120,135,150].entries()){
      group('','saxophone-key');const x=46+(y-70)*.055;rod(36,y,x,y,1.1);circle(x,y,4.5+i*.12,'#c6c6c6',.55);circle(x,y,2.5,'#f7f7f7',.4);end();
    }
    for(const y of [76,91,106]){rod(56,y,64,y-3,1);ellipse(65,y-4,2.6,4,'#ddd',.4);}
    for(const [x,y] of [[29,116],[29,126],[30,139]])rect(x,y,6,7,'#bcbcbc',.45,2);
    for(const [x,y] of [[66,173],[78,186]]){circle(x,y,5.3,'#ccc',.5);path('M'+(x-7)+' '+(y-4)+'L'+(x-5)+' '+(y+5)+'H'+(x+6)+'L'+(x+7)+' '+(y-4),'none',1);}
    circle(57,111,2.4,'none',.7);end();
  }else if(type==='trumpet'){
    group('','trumpet-body');out+='<g filter="url(#'+windShadowId+')">';
    windTube('M24 43H151C177 43 177 77 152 77H43C24 77 24 61 43 61H77',7);
    group('','trumpet-bell');path('M72 40H163C193 40 214 32 229 12V78C214 56 192 49 163 49H72Z','url(#'+windMetalId+')',.85,'#343836');
    path('M145 42C184 42 210 34 225 20','none',1.05,'#fff');path('M146 48C184 49 208 55 223 67','none',.42,'#6d726f');ellipse(229,45,5.4,33.5,'#8f9592',.85,'#292d2b');ellipse(229,45,2.8,28.5,'#303432',.45,'#e1e4e1');end();
    windTube('M18 43H53',4);
    group('','mouthpiece');path('M7 35Q14 35 17 40H24V46H17Q14 51 7 51Z','#ddd',.6);ellipse(7,43,2.8,8,'#f6f6f6',.5);end();
    for(const [x,low] of [[75,77],[96,68],[117,81]])windTube('M'+(x-4)+' 55H'+(x-11)+'V'+low+'Q'+(x-11)+' '+(low+7)+' '+x+' '+(low+7)+'Q'+(x+7)+' '+(low+7)+' '+(x+7)+' '+low+'V55',4.5);
    for(const x of [76,96,116])windValve(x,32,39);
    path('M137 39V28Q137 20 145 24L147 29','none',1.2);ellipse(50,59,6,5,'none',.85);
    rod(150,81,160,85,1.2);circle(150,81,1.5,'#777',.4);out+='</g>';end();
  }else if(type==='trombone'){
    group('','trombone-body');out+='<g filter="url(#'+windShadowId+')">';
    windTube('M155 26H27C1 26 1 64 27 64H86',7);
    group('','trombone-bell');path('M132 22C171 22 196 18 214 5V48C195 34 171 29 132 29Z','url(#'+windMetalId+')',.85,'#343836');ellipse(214,26.5,4.7,22,'#929895',.8,'#303432');ellipse(214,26.5,2.2,18.2,'#313533',.45,'#e0e3e0');path('M158 23C181 21 200 15 209 10','none',1,'#fff');end();
    for(const x of [32,55]){rod(x,30,x,60,1.7);rect(x-4,24,8,4,'#b7b7b7',.4,.5);rect(x-4,62,8,4,'#b7b7b7',.4,.5);}
    group('','trombone-slide');windTube('M84 53H307C339 53 339 87 307 87H84',6.5);
    for(const y of [53,87]){rect(84,y-4.1,19,8.2,'#bbb',.5,1);rect(131,y-3.8,6,7.6,'#ccc',.4,.6);line(139,y-1,299,y-1,.45,'#fff');}
    rod(95,57,95,83,1.7);rod(134,57,134,83,1.6);rod(106,57,106,83,1.2);end();
    group('','mouthpiece');windTube('M78 53H86',4);path('M69 46Q75 46 78 50V56Q75 60 69 60Z','#ddd',.5);ellipse(69,53,2.5,7,'#f4f4f4',.5);end();
    path('M313 90L320 94L325 88','none',1);circle(316,91,1.6,'#aaa',.4);out+='</g>';end();
  }else if(type==='tuba'){
    group('','tuba-body');out+='<g filter="url(#'+windShadowId+')">';
    windTube('M87 61C54 33 24 57 24 90V174C24 207 39 216 76 216H88C120 216 127 197 121 172L110 111',19);
    windTube('M79 72C53 50 40 71 40 95V170C40 192 48 199 75 199H84C103 199 111 189 108 175L99 129',8);
    group('','tuba-bell');path('M99 153C91 108 82 63 57 28H140C119 60 113 111 116 151Z','url(#'+windMetalId+')',.9,'#343836');path('M111 141C108 92 119 49 130 36','none',1.05,'#fff');path('M75 38C92 70 101 111 104 146','none',.42,'#6d726f');
    ellipse(98.5,27,41.5,17,'#929895',.9,'#303432');ellipse(98.5,27,37.5,13.5,'url(#'+windMetalId+')',.55,'#e2e5e2');ellipse(99,29,22,8,'#676c69',.45,'#282c2a');ellipse(100,30,12,4.8,'#303432',.35,'#cdd1ce');end();
    for(const [x,bottom] of [[47,163],[59,153],[71,178],[83,187]]){
      windTube('M'+(x-3)+' 115V'+bottom+'Q'+(x-3)+' '+(bottom+8)+' '+(x+5)+' '+(bottom+8)+'H'+(x+11)+'Q'+(x+18)+' '+(bottom+8)+' '+(x+18)+' '+bottom+'V122',4.7);
    }
    for(const x of [47,59,71,83])windValve(x,94,42);
    windTube('M88 106Q88 88 104 81L126 65',5);
    group('translate(129 63) rotate(-35)','mouthpiece');path('M-5-2H0L4-5H10V5H4L0 2H-5Z','#ddd',.55);ellipse(10,0,2,5,'#eee',.45);end();
    for(const [x,y] of [[33,161],[105,161],[45,203]]){rect(x-2,y,4,7,'#bbb',.45,.7);line(x-1,y+2,x+1,y+2,.4);}
    path('M79 196L89 192L94 195','none',1);out+='</g>';end();
  }else if(type==='flugelhorn'){
    group('','flugelhorn-body');out+='<g filter="url(#'+windShadowId+')">';
    windTube('M92 35H69C31 35 18 49 18 78C18 103 36 116 65 116H154C185 116 196 95 179 75Q169 61 145 61H118',10);
    windTube('M13 57H92',4.5);
    group('','flugelhorn-bell');path('M69 30H103C155 30 187 24 213 6V74C188 48 155 40 103 40H69Z','url(#'+windMetalId+')',.85,'#343836');path('M128 33C169 31 197 21 208 14','none',1,'#fff');path('M131 39C170 41 195 50 207 65','none',.42,'#6d726f');ellipse(213,40,5.2,34,'#929895',.85,'#303432');ellipse(213,40,2.8,29,'#303432',.45,'#e1e4e1');end();
    for(const [x,low] of [[70,87],[88,80],[106,96]])windTube('M'+(x-4)+' 53H'+(x-10)+'V'+low+'Q'+(x-10)+' '+(low+7)+' '+x+' '+(low+7)+'Q'+(x+8)+' '+(low+7)+' '+(x+8)+' '+low+'V55',4.8);
    for(const x of [70,88,106])windValve(x,29,47);
    group('','mouthpiece');path('M5 50Q12 50 15 54H24V60H15Q12 64 5 64Z','#ddd',.6);ellipse(5,57,2.5,7,'#f4f4f4',.5);end();
    path('M126 30Q118 18 127 15L138 14','none',1.15);rod(111,97,124,84,1.6);ellipse(125,82,2,5,'#ccc',.45);rod(170,115,180,111,1.1);out+='</g>';end();
  }else if(type==='flute'){
    group('','flute-body');
    rect(6,18,287,11,'#d5d5d5',.65,3);line(9,20.5,290,20.5,.65,'#fafafa');line(8,27,291,27,.4,'#aaa');
    for(const x of [9,90,251,289])rect(x,17.4,3,12.2,'#bbb',.4,.7);
    group('','flute-lip-plate');ellipse(37,23.5,13,8,'#e8e8e8',.6);ellipse(37,23.5,5.6,3.6,'#555',.45);ellipse(37,23.5,3.7,2,'#888',.25);end();
    rod(105,14,246,14,1.3);rod(254,15,282,15,1.1);
    for(const [i,x] of [110,128,146,165,184,203,222,240,263,280].entries()){
      const y=i===3||i===4?28:22;group('','flute-key');rod(x,14,x,y,1);circle(x,y,5.2,'#c1c1c1',.55);circle(x,y,3.7,'#efefef',.35);line(x-2,y-1,x+2,y-1,.3,'#fff');end();
    }
    for(const x of [104,157,191,232,249,284]){circle(x,14,1.5,'#aaa',.35);}
    for(const [x,y] of [[139,9],[156,8],[210,34],[258,34]]){rod(x,y,x+7,20,1);ellipse(x,y,4.1,2.4,'#ddd',.4);}
    ellipse(294,23.5,1.8,5.2,'#777',.45);rect(3,19,4,9,'#aaa',.5,1);end();
  }else if(type==='mic'){
    if(options.stand==='round'){
      circle(50,65,25,'#c2c2c2',.9);circle(50,65,22,'#dedede',.45);circle(50,65,4,'#777',.6);
      rod(50,65,50,36,2.2);capsule(50,24,0);
    }else{
      feet(50,65,27,30);circle(50,65,4.5,'#aaa',.7);
      const direction=options.boomDirection||'up';
      group('','boom-arm-'+direction);
      if(direction==='left'||direction==='right'){
        const tip=direction==='right'?82:18,counter=direction==='right'?34:66;
        rod(counter,61,tip,61,2);rect(counter-3,58.5,6,5,'#555',.45,1);
        rod(50,65,50,61,2);rod(tip,61,tip,56,1.6);
        rect(46,58.5,8,5,'#777',.45,1);
        capsule(tip,28,0);
      }else{
        rod(50,87,50,35,2);rect(46,62,8,5,'#555',.45,1);capsule(50,24,0);
      }
      end();
    }
  }else if(type==='mic-wireless-ewd'){
    group('','sennheiser-ewd-skm-top-view');
    const grilleId=scopedId('pattern','ewd-grille');
    out+='<defs><pattern id="'+grilleId+'" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0L4 4M4 0L0 4" stroke="#686d6c" stroke-width=".45"/></pattern></defs>';
    path('M7 12Q3 25 7 38Q25 47 51 38L58 32V18L51 12Q25 3 7 12Z','url(#'+grilleId+')',.9,'#303432');
    path('M53 15L73 17L255 18Q264 18 264 25Q264 32 255 32L73 33L53 35Z','#4c5150',.9,'#242725');
    path('M66 18H245V32H66Z','#6a6f6e',.35,'#999');line(82,19,82,31,.45,'#c9cecc');
    rect(142,20,37,10,'#1c2221',.45,2,'#9ca2a0');rect(146,22,29,6,'#78827e',.25,1,'#1b1d1c');
    circle(190,25,4.3,'#292d2c',.45,'#b9bfbd');circle(190,25,1.5,'#d8ddda',.2,'#555');
    for(const x of [211,221,231])rect(x,21.5,6,7,'#303534',.35,1,'#aaa');
    path('M248 18V32M256 19V31','none',.7,'#c5cac8');
    out+='<text x="93" y="27.5" font-family="sans-serif" font-size="7" font-weight="700" fill="#e7ebe8" stroke="none">EW-D</text>';end();
  }else if(type==='mic-sm57'){
    group('','shure-sm57-top-view');
    const grilleId=scopedId('pattern','sm57-grille');
    out+='<defs><pattern id="'+grilleId+'" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0L3 3M3 0L0 3" stroke="#6f7472" stroke-width=".38"/></pattern></defs>';
    path('M4 6Q1 16 4 26L13 30H39L48 25V7L39 2H13Z','url(#'+grilleId+')',.8,'#292c2b');
    path('M44 7H61L68 11H143Q153 11 153 16Q153 21 143 21H68L61 25H44Z','#4e5351',.8,'#262927');
    rect(68,12.5,70,7,'#656a68',.28,2,'#aaa');line(81,13,81,19,.45,'#d4d8d5');
    for(const x of [144,148,152])line(x,12,x,20,.45,'#c3c7c5');
    out+='<text x="92" y="18" font-family="sans-serif" font-size="5.5" font-weight="800" fill="#f1f3f0" stroke="none">SM57</text>';end();
  }else if(type==='mixer-xr18'){
    group('','behringer-xr18-top-view');
    rect(3,4,194,81,'#3d4140',.9,5,'#1e201f');rect(9,9,182,71,'#696e6c',.45,3,'#9ba09e');
    group('','xr18-handles');path('M10 16Q-1 24 10 35M190 16Q201 24 190 35','none',4,'#262927');path('M11 17Q4 24 11 33M189 17Q196 24 189 33','none',.7,'#babfbc');end();
    sockets(24,25,8,16,17.7,4.8);sockets(166,24,2,8,12,4.1,true);
    rect(20,62,67,12,'#292d2c',.35,2,'#adb2af');for(let i=0;i<7;i++)rect(24+i*9,65,6,6,'#858b88',.2,1,'#262927');
    rect(98,62,32,12,'#242827',.35,2,'#9da3a0');circle(107,68,2.4,'#b9bfbc',.25);circle(118,68,2.4,'#b9bfbc',.25);
    line(151,10,188,-2,1.4,'#343836');circle(188,-2,2.4,'#777d7a',.35);
    out+='<text x="139" y="72" font-family="sans-serif" font-size="7" font-weight="800" fill="#f1f3f0" stroke="none">X AIR XR18</text>';end();
  }else if(type==='mixer-wing-compact'){
    group('','behringer-wing-compact-top-view');
    path('M7 3H153L158 12V116L151 123H9L2 116V12Z','#4b504e',.95,'#202321');rect(8,9,144,108,'#707674',.45,4,'#a1a6a3');
    group('','wing-compact-touchscreen');rect(60,13,84,47,'#1f2423',.55,3,'#a7adaa');rect(65,17,74,39,'#687d79',.3,2,'#161918');for(let y=23;y<53;y+=6)line(69,y,135,y,.24,'#d0d6d2');end();
    for(let i=0;i<12;i++){const x=13+i*10.7;group('','wing-compact-channel-strip');rect(x,68,7.8,42,'#575c5a',.25,1,'#929895');circle(x+3.9,73,2.2,'#292d2c',.25,'#bbb');line(x+3.9,81,x+3.9,104,.45,'#c4c9c6');rect(x+1.6,90+(i%4)*2.5,4.6,7,'#d4d8d5',.25,1,'#383b3a');end();}
    group('','wing-compact-master');rect(141,66,11,46,'#343837',.35,2,'#929795');circle(146.5,74,3.2,'#232625',.3,'#b9bfbc');line(146.5,83,146.5,105,.6,'#d2d6d3');rect(143.5,91,6,9,'#e0e3e0',.28,1,'#3b3f3d');end();
    for(const [x,y] of [[17,18],[29,18],[41,18],[17,31],[29,31],[41,31],[17,48],[29,48],[41,48]])knob(x,y,3.2);
    out+='<text x="15" y="62" font-family="sans-serif" font-size="6.5" font-weight="850" fill="#eef1ed" stroke="none">WING COMPACT</text>';end();
  }else if(type==='mixer-wing-rack'){
    group('','behringer-wing-rack-top-view');
    rect(2,3,156,101,'#3f4442',.95,4,'#1b1e1c');for(const y of [8,99])for(const x of [7,153])bolt(x,y,1.4);
    rect(10,10,140,87,'#656b68',.45,2,'#a3a9a6');
    group('','wing-rack-touchscreen');rect(15,17,76,47,'#202524',.55,2,'#b0b6b2');rect(20,21,66,39,'#667b77',.3,1,'#151817');for(let y=28;y<=55;y+=6)line(24,y,82,y,.22,'#d4dad6');end();
    for(const [x,y] of [[104,23],[119,23],[134,23],[104,38],[119,38],[134,38],[104,53],[119,53],[134,53]])knob(x,y,4);
    sockets(18,76,8,24,17.2,3.5);sockets(128,75,4,8,9,3.4,true);
    out+='<text x="101" y="65" font-family="sans-serif" font-size="7" font-weight="850" fill="#eef1ed" stroke="none">WING RACK</text>';end();
  }else if(type==='piano-bench'){
    group('','piano-bench-top-view');rect(5,8,100,54,'#464a48',.85,9,'#202321');rect(10,13,90,44,'#777c79',.35,7,'#a6aba8');
    for(const x of [18,92])for(const y of [17,53]){circle(x,y,5,'#2f3331',.45,'#aaa');circle(x,y,2.2,'#8f9491',.25,'#2a2d2c');}
    line(55,14,55,56,.3,'#c2c7c4');line(11,35,99,35,.3,'#c2c7c4');for(const x of [28,55,82])circle(x,35,1.5,'#2d3130',.2,'#aaa');end();
  }else if(type==='drum-throne'){
    group('','drum-throne-top-view');feet(50,53,38,30,2.2,1.8);circle(50,53,9,'#929795',.7,'#2b2e2d');circle(50,50,32,'#3d4140',.9,'#1d201e');circle(50,50,27,'#6d7270',.4,'#9da29f');path('M25 45Q50 58 75 45','none',.5,'#bfc4c1');circle(50,50,3,'#282b2a',.3,'#aaa');end();
  }else if(type.startsWith('stagebox-')){
    const count=Number(type.split('-')[1]);
    if(count===32){group('translate(0 0)');stagebox(16,8);end();group('translate(184 0)');stagebox(16,8);end();}
    else stagebox(count,count===8?4:count===16?8:count===48?16:0);
  }else if(type==='wedge'){
    group('','cm14-wedge-top-view');
    // CM14-inspired orthographic top view: the 35-degree enclosure hides most
    // of its coaxial driver below a touring-grade perforated grille.
    const grilleId=scopedId('pattern','cm14-grille'),cabinetId=scopedId('gradient','cm14-cabinet'),grilleShadeId=scopedId('gradient','cm14-grille-shade');
    out+='<defs><linearGradient id="'+cabinetId+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#656b68"/><stop offset=".3" stop-color="#242826"/><stop offset=".72" stop-color="#111412"/><stop offset="1" stop-color="#454a47"/></linearGradient><linearGradient id="'+grilleShadeId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7572"/><stop offset=".28" stop-color="#303432"/><stop offset="1" stop-color="#151817"/></linearGradient><pattern id="'+grilleId+'" width="4.4" height="4.4" patternUnits="userSpaceOnUse"><circle cx="1.1" cy="1.1" r=".54" fill="#979d99"/><circle cx="3.3" cy="3.3" r=".54" fill="#979d99"/></pattern></defs>';
    group('','cm14-cabinet');path('M13 3H103L114 14V93L105 109H11L2 93V14Z','url(#'+cabinetId+')',1.15,'#0c0e0d');path('M15 8H101L108 16V89L101 101H15L8 89V16Z','#202422',.55,'#777d79');end();
    group('','cm14-driver-under-grille');out+='<g opacity=".34">';ellipse(58,56,38,34,'#0a0c0b',1,'#7b817d');ellipse(58,56,31,27.5,'#2d312f',.7,'#747a76');ellipse(58,56,11,10,'#080a09',.6,'#7b817d');out+='</g>';end();
    group('','cm14-perforated-grille');path('M15 13H101L106 19V88L98 96H18L10 88V19Z','url(#'+grilleShadeId+')',.75,'#858b87');path('M16 14H100L104 20V87L97 94H19L12 87V20Z','url(#'+grilleId+')',.38,'#3f4441');path('M19 18H97','none',.75,'#c2c7c3');end();
    group('','cm14-floor-ports');for(const x of [24,92]){path('M'+(x-8)+' 84Q'+x+' 79 '+(x+8)+' 84V92H'+(x-8)+'Z','#080a09',.55,'#5d625f');line(x-5,86,x+5,86,.35,'#7e847f');}end();
    group('','cm14-side-handles');for(const [x,flip] of [[6,1],[110,-1]]){path('M'+x+' 42Q'+(x+flip*5)+' 39 '+(x+flip*7)+' 44V66Q'+(x+flip*5)+' 70 '+x+' 67Z','#090b0a',.55,'#686e6a');line(x+flip*2,47,x+flip*2,63,.8,'#9aa09c');}end();
    group('','cm14-rear-connector-panel');rect(42,98,32,7,'#777d79',.45,1,'#171a18');for(const x of [49,59]){circle(x,101.5,2.3,'#1d211f',.32,'#bec3bf');for(const [dx,dy] of [[0,-.7],[-.65,.45],[.65,.45]])circle(x+dx,101.5+dy,.2,'#d7dbd8',.08);}rect(66,99.5,5,4,'#151817',.25,.4,'#aaa');end();
    group('','cm14-corner-protectors');for(const [x,y] of [[11,10],[105,10],[11,101],[105,101]]){path('M'+(x-4)+' '+y+'Q'+x+' '+(y-4)+' '+(x+4)+' '+y,'none',2.5,'#8d938f');bolt(x,y,.62);}end();
    group('','cm14-logo');rect(48,19,20,7,'#d8dcd9',.25,1,'#313532');out+='<text x="58" y="24.3" text-anchor="middle" font-family="sans-serif" font-size="4.7" font-weight="900" fill="#222725" stroke="none">COHESION</text>';end();
    group('','listening-direction-up');path('M52 34L58 28L64 34M58 28V41','none',1.15,'#e2e5e2');end();end();
  }else if(type==='teleprompter'){
    group('','stage-teleprompter-top-view');
    path('M12 5H128L137 17V105L127 116H13L3 105V17Z','#4b4b4b',1);
    path('M17 11H123L130 19V99L123 108H17L10 99V19Z','#202020',.65);
    // The glass/screen is shown from straight above, including the protective hood.
    path('M24 22H116L110 82H30Z','#9a9a9a',.7);path('M29 27H111L106 76H34Z','#e7e7e5',.45);
    for(const [y,w] of [[38,57],[48,68],[58,51],[68,63]])line(70-w/2,y,70+w/2,y,1.2,'#777');
    path('M20 18H120L114 87H26Z','none',2.2,'#666');path('M26 88H114L120 102H20Z','#666',.6);
    rect(52,94,36,8,'#aaa',.45,1);for(const x of [58,65,72,79,86])circle(x,98,1.2,'#444',.2);
    for(const x of [7,133]){rect(x-2.5,45,5,24,'#222',.45,1.5);line(x,49,x,65,.6,'#aaa');}
    for(const x of [15,125])for(const y of [14,106])bolt(x,y,.7);end();
  }else if(type==='power'){
    rect(3,2,94,27,'#777',.85,2);rect(6,5,88,21,'#ccc',.4,1);
    for(let i=0;i<4;i++){const x=31+i*18;circle(x,15.5,7.6,'#eee',.55);circle(x,15.5,6,'#bcbcbc',.35);circle(x-2,15.5,1,'#444',.2);circle(x+2,15.5,1,'#444',.2);line(x,9,x,11,.7);line(x,20,x,22,.7);}
    rect(10,9,8,13,'#555',.5,1);line(12,12,16,12,.5,'#ddd');
  }else if(type==='amp'){
    rect(3,4,94,46,'#555',.85,2);rect(6,7,88,39,'#999',.4,.8);
    rect(8,9,84,9,'#444',.45,.8);for(let i=0;i<8;i++)knob(15+i*10,13.5,1.7);
    rect(36,27,28,7,'#333',.6,2);line(40,29,60,29,.6,'#bbb');
    for(const x of [5,91])for(const y of [6,44])rect(x,y,4,4,'#ccc',.45,.4);
  }else if(type==='quad-cortex'){
    group('','quad-cortex-top-view');
    const chassisId=scopedId('gradient','quad-cortex-chassis'),screenId=scopedId('gradient','quad-cortex-screen');
    out+='<defs><linearGradient id="'+chassisId+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f2f0"/><stop offset=".35" stop-color="#aeb3b0"/><stop offset=".7" stop-color="#757a77"/><stop offset="1" stop-color="#d8dbd8"/></linearGradient><linearGradient id="'+screenId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#303835"/><stop offset="1" stop-color="#0e1210"/></linearGradient></defs>';
    group('','quad-cortex-anodized-chassis');path('M6 2H139L144 7V91L139 96H6L1 91V7Z','url(#'+chassisId+')',1,'#303432');path('M7 5H138L141 8V89L138 93H7L4 89V8Z','none',.45,'#f5f6f4');end();
    group('','quad-cortex-rear-io');rect(9,4,127,6,'#434846',.35,1,'#202321');for(const x of [17,25,33,44,55,66,78,89,100,111,122,130]){circle(x,7,1.5,'#181b19',.22,'#d1d5d2');circle(x,7,.52,'#787e7a',.12,'#151817');}end();
    group('','quad-cortex-7in-touchscreen');rect(10,13,106,43,'#171b19',.7,2.2,'#303532');rect(14,17,98,35,'url(#'+screenId+')',.3,1,'#777d79');
    for(const [x,y,w,color] of [[20,25,13,'#a9bba9'],[39,25,12,'#a6aeb9'],[57,25,14,'#c4a8b6'],[78,25,13,'#afb9aa'],[97,25,10,'#b4a7bc'],[29,42,17,'#b4bba9'],[56,42,19,'#bea7b1'],[86,42,18,'#a6b9b8']]){rect(x,y,w,7,color,.2,1,'#d4d8d5');}
    for(const [x1,y1,x2,y2] of [[33,28.5,39,28.5],[51,28.5,57,28.5],[71,28.5,78,28.5],[91,28.5,97,28.5],[46,45.5,56,45.5],[75,45.5,86,45.5]])line(x1,y1,x2,y2,.55,'#e2e5e2');end();
    const actuatorXs=[18,45,72,99,126];let actuatorIndex=0;
    for(const y of [67,86])for(const x of actuatorXs){actuatorIndex++;out+='<g data-part="quad-cortex-stomp-rotary-actuator" data-actuator-index="'+actuatorIndex+'">';circle(x,y,5.25,'#545957',.58,'#242725');circle(x,y,3.9,'#e5e7e4',.42,'#777d79');circle(x,y,2.65,'#747a76',.28,'#f0f2ef');circle(x-6.2,y-3.8,.9,actuatorIndex%3===0?'#c9a0b4':actuatorIndex%3===1?'#a7bba8':'#a8b6bf',.2,'#f2f4f1');line(x,y-3.15,x,y-.65,.48,'#fff');out+='</g>';}
    group('','quad-cortex-master-rotary-actuator');circle(129,27,7.1,'#3e4341',.7,'#171a18');circle(129,27,5.5,'#7b817d',.45,'#d8dcd9');circle(129,27,3.9,'#555b57',.3,'#1d201e');line(129,22.2,129,26,.62,'#fff');end();
    group('','quad-cortex-branding');out+='<text x="122" y="48" text-anchor="middle" font-family="sans-serif" font-size="3.5" font-weight="800" fill="#373b39" stroke="none">NEURAL DSP</text><text x="122" y="53" text-anchor="middle" font-family="sans-serif" font-size="3.1" font-weight="700" fill="#4b504d" stroke="none">QUAD CORTEX</text>';end();
    for(const [x,y] of [[7,8],[138,8],[7,90],[138,90]])bolt(x,y,.72);end();
  }else if(type==='bass-stack'){
    // Orthographic floor footprint: two stacked cabinets, head visible on top.
    group('','lower-cabinet');rect(3,13,124,74,'#555',.8,2);rect(6,16,118,65,'#777',.4,1);end();
    group('','upper-cabinet');rect(6,9,118,70,'#666',.7,2);rect(10,13,110,59,'#888',.4,1);
    for(const x of [7,119])rect(x,31,4,25,'#333',.45,1.2);
    rect(12,68,106,8,'#3f3f3f',.5,.6);
    let grille='';for(let x=16;x<118;x+=4)grille+='M'+x+' 69v6';path(grille,'none',.3,'#999');end();
    group('','amplifier-head');rect(14,4,102,52,'#444',.8,2);rect(18,8,94,35,'#777',.4,1);
    let vents='';for(let x=27;x<107;x+=4)vents+='M'+x+' 13v22';path(vents,'none',.6,'#444');
    rect(42,18,46,7,'#333',.65,2);line(47,20,83,20,.6,'#aaa');
    rect(18,44,94,9,'#bbb',.5,.5);for(let i=0;i<8;i++)knob(29+i*9,48.5,1.6);circle(106,48.5,1.7,'#444',.3);end();
    for(const x of [7,119])for(const y of [15,81])rect(x,y,4,4,'#bbb',.4,.4);
  }else if(type==='guitar-stand-single'){
    // Single tubular stand in plan view: tripod, padded body cradle and one neck yoke.
    group('','single-guitar-stand');
    for(const [x,y,angle] of [[13,106,-31],[87,106,31],[50,12,0]]){
      group('','stand-leg');rod(50,45,x,y,3.8);
      group('translate('+x+' '+y+') rotate('+angle+')');rect(-4,-5,8,10,'#555',.5,2);line(-2,-2,2,-2,.4,'#999');end();end();
    }
    rod(50,54,28,81,1.3);rod(50,54,72,81,1.3);
    group('','body-cradle');rod(26,82,74,82,3.2);
    for(const x of [26,74]){
      group('','body-support');path('M'+x+' 75V88Q'+x+' 94 '+(x+(x<50?7:-7))+' 94','none',4.8,'#444');
      line(x,78,x,86,.65,'#aaa');end();
    }
    end();
    circle(50,45,6.5,'#b9b9b9',.75);circle(50,45,3.8,'#555',.45);bolt(58,45,1.4);
    group('','neck-yoke');rod(50,43,50,28,3);
    path('M41 43V33Q41 26 50 26Q59 26 59 33V43','none',3,'#444');
    rect(38.5,38,5,8,'#555',.45,1.6);rect(56.5,38,5,8,'#555',.45,1.6);
    line(41,39,41,43,.45,'#aaa');line(59,39,59,43,.45,'#aaa');end();
    end();
  }else if(type.startsWith('guitar-stand-')){
    group('','three-slot-stand');
    rod(8,14,112,14,3);rod(8,76,112,76,3);rod(8,14,8,76,3);rod(112,14,112,76,3);
    for(const x of [25,60,95]){
      path('M'+(x-7)+' 26V15Q'+x+' 9 '+(x+7)+' 15V26','none',2.6,'#555');
      rod(x-9,63,x-9,76,4);rod(x+9,63,x+9,76,4);
    }
    for(const x of [8,112])for(const y of [12,78])rect(x-4,y-2,8,4,'#555',.4,1);
    if(type==='guitar-stand-full'){
      node('use',{href:'#sp-art-guitar-',transform:'translate(13 7) scale(.235)','data-part':'stored-guitar'});
      node('use',{href:'#sp-art-acoustic-',transform:'translate(48 7) scale(.235)','data-part':'stored-guitar'});
      node('use',{href:'#sp-art-bass-',transform:'translate(84 7) scale(.22)','data-part':'stored-guitar'});
    }
    end();
  }else if(type.startsWith('guitar-tree-')){
    // Orthographic three-way layout: central mast, folding neck yokes and a tripod.
    group('','three-way-guitar-tree');
    for(const angle of [0,120,240]){
      group('translate(60 60) rotate('+angle+')','tree-leg');
      rod(0,0,0,49,3.8);rect(-4,44,8,12,'#555',.5,2);
      rod(0,9,0,36,1.3);rod(-11,36,11,36,3.7);
      end();
    }
    for(const [index,angle] of [0,120,240].entries()){
      group('translate(60 60) rotate('+angle+')','tree-branch');
      rod(0,0,0,17,2.8);rect(-4,9,8,5,'#b8b8b8',.5,1);bolt(0,11.5,1);
      if(type==='guitar-tree-full'){
        const id=['guitar','acoustic','bass'][index],sy=id==='bass'?.13:.14;
        node('use',{href:'#sp-art-'+id+'-',transform:'translate(-8 12) scale(.16 '+sy+')','data-part':'stored-guitar'});
      }
      path('M-6 25V19Q-6 15 0 15Q6 15 6 19V25','none',2.6,'#444');
      rect(-7.5,22,4,5,'#555',.4,1);rect(3.5,22,4,5,'#555',.4,1);
      end();
    }
    circle(60,60,6,'#d4d4d4',.85);circle(60,60,3,'#666',.5);
    rect(66,58,4,4,'#555',.4,.8);end();
  }else if(type==='cajon'){
    rect(30,23,36,45,'#dedede',.85,1.5);rect(33,26,30,39,'#f5f5f5',.4,.5);
    for(const x of [34,62])for(const y of [27,64])bolt(x,y,.6);
    cymbal(81,42,12);feet(18,78,10,30);rod(18,78,27,61,1.4);group('translate(26 57) scale(.45)');capsule(0,0,35);end();
  }else if(type==='riser'){
    const count=options.riserCount||1,w=count===3?150:200,h=count===1?100:count===2?200:100;
    rect(2,2,w-4,h-4,'#e6e6e6',.85,.5);rect(5,5,w-10,h-10,'none',.4,.3);
    if(count===2)line(5,h/2,w-5,h/2,.6);
    if(count===3){line(w/3,5,w/3,h-5,.6);line(w*2/3,5,w*2/3,h-5,.6);}
    for(const x of [4,w-4])for(const y of [4,h-4])rect(x-1.6,y-1.6,3.2,3.2,'#aaa',.4,.2);
  }else if(type==='stage-ramp'){
    group('','stage-ramp-top-view');path('M4 5H196L188 95H12Z','#eceeeb',.85,'#4a504a');
    const rampPattern=scopedId('pattern','ramp-grip');out+='<defs><pattern id="'+rampPattern+'" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 9L9 0M-3 3L3-3M6 12L12 6" stroke="#aeb4ae" stroke-width=".65"/></pattern></defs>';
    path('M9 10H191L184 90H16Z','url(#'+rampPattern+')',.35,'#b7bcb7');
    for(const y of [12,88])line(13,y,187,y,.7,'#767c76');for(const [x,y] of [[11,10],[189,10],[17,88],[183,88]])bolt(x,y,.8);end();
  }else if(type==='stage-railing'){
    group('','stage-railing-top-view');rod(5,10.5,295,10.5,4.8);for(let x=10;x<=290;x+=40){circle(x,10.5,5.2,'#606561',.65,'#222522');circle(x,10.5,2.3,'#d3d7d3',.3,'#555');rect(x-8,2,16,4,'#777c78',.4,1,'#343734');rect(x-8,15,16,4,'#777c78',.4,1,'#343734');}end();
  }else if(type==='stage-truss-tower'){
    group('','stage-truss-tower-top-view');rect(4,4,92,92,'#babfbc',.8,3,'#3e433f');rect(10,10,80,80,'#d9ddd9',.35,2,'#8b918c');
    for(const [x,y] of [[20,20],[80,20],[20,80],[80,80]]){circle(x,y,8,'#777d78',.65,'#282b29');circle(x,y,4.5,'#dce0dc',.35,'#545955');}
    path('M20 20L80 80M80 20L20 80M20 20H80V80H20Z','none',2,'#686e69');circle(50,50,6,'#3e433f',.5,'#bbb');end();
  }else if(type==='stage-cable-ramp'){
    group('','stage-cable-ramp-top-view');path('M8 8H192L199 45L192 82H8L1 45Z','#4b504d',.85,'#202321');rect(12,13,176,64,'#8b908d',.45,4,'#2e3230');
    for(let i=0;i<5;i++){const x=20+i*35;rect(x,19,24,52,'#262a28',.4,4,'#a3a8a5');line(x+12,22,x+12,68,.35,'#737976');}
    for(const x of [8,192])for(const y of [20,70])bolt(x,y,.9);end();
  }else if(type==='stage-barrier'){
    group('','crowd-barrier-top-view');rect(4,8,292,44,'#b8bdb9',.8,2,'#373b38');rect(10,13,280,34,'#e1e4e1',.35,1,'#8b918d');
    for(let x=14;x<290;x+=16)line(x,14,x,46,.6,'#777d78');rod(4,8,296,8,3.5);rod(4,52,296,52,3.5);
    for(const x of [20,80,140,200,260]){path('M'+(x-11)+' 52L'+x+' 58L'+(x+11)+' 52Z','#666b67',.45,'#262926');circle(x,54,1.2,'#d5d9d5',.25);}end();
  }else if(type==='laptop'){
    // Orthographic plan view. Every chassis edge stays parallel so the symbol
    // reads like a technical overhead drawing, not a three-quarter product view.
    group('','playback-rack');
    rect(2,6,116,98,'#6f6f6f',.85,2);rect(5,9,110,92,'#bdbdbd',.45,1.2);
    for(const x of [7,109])rect(x,12,4,86,'#777',.35,.6);
    for(const x of [7.5,112.5])for(const y of [11.5,98.5])bolt(x,y,.55);
    // The rack unit is also drawn from above and remains visible below the laptop.
    group('','playaudio-1u');
    rect(10,82,100,17,'#d3d3d3',.65,1);rect(14,85,92,11,'#ededed',.35,.6);
    for(let x=18;x<=96;x+=9){line(x,87,x+5,87,.35,'#777');line(x,89,x+5,89,.35,'#999');}
    out+='<text x="60" y="94" text-anchor="middle" font-size="4.2" font-family="sans-serif" fill="#3d3d3d" stroke="none">PlayAUDIO 1U</text>';
    for(const x of [11.5,108.5])for(const y of [83.5,97.5])bolt(x,y,.48);
    end();end();
    group('','laptop-top-view');
    group('','laptop-screen');
    // From directly above the upright display is visible only as a slim edge.
    rect(16,10,88,9,'#505050',.85,1.4);rect(21,12,78,3,'#9d9d9d',.25,.6);circle(60,11.5,.5,'#dedede',.2);end();
    group('','laptop-hinge');rect(22,17,12,4,'#666',.35,.7);rect(86,17,12,4,'#666',.35,.7);line(34,19,86,19,.55,'#444');end();
    group('','laptop-keyboard');rect(12,21,96,57,'#d2d2d2',.85,2);
    rect(17,26,86,25,'#555',.4,1);
    let keys='';for(let j=0;j<4;j++)for(let i=0;i<13;i++)keys+='M'+f(19+i*6.35)+' '+f(28+j*5.2)+'h4.7v3.7h-4.7Z';
    path(keys,'#bdbdbd',.2);rect(45,56,30,15,'#b8b8b8',.4,1);line(16,75,104,75,.35,'#999');
    for(const [x,y] of [[14,31],[14,43],[106,31],[106,43]])rect(x-1,y-1.8,2,3.6,'#777',.25,.35);end();
    end();
  }else if(type==='rack'){
    rect(15,9,70,81,'#888',.9,1.2);rect(18,12,64,75,'#dedede',.6,.8);rect(22,16,56,67,'#444',.5,.5);
    for(const xx of [14,82]){rect(xx,31,4,21,'#777',.6,.6);rect(xx+.8,35,2.4,13,'#ddd',.3,.4);}
    for(const yy of [20,43,66]){
      rect(25,yy,50,17,'#bdbdbd',.45,.6);
      let vents='';for(let j=0;j<4;j++)for(let i=0;i<11;i++)vents+='M'+f(28+i*4)+' '+f(yy+3+j*2.5)+'h2.2';
      path(vents,'none',.7,'#666');for(const xx of [26.5,73.5])bolt(xx,yy+8.5,.5);
    }
    for(const xx of [16,81])for(const yy of [10,85])rect(xx,yy,3,4,'#eee',.4,.3);
    rod(27,23,21,3,1.2);rod(72,23,78,3,1.2);
  }else if(type==='iem-earphones'){
    group('','iem-earphones-pair');
    // Two mirrored custom-molded earpieces. Ear hooks remain short so this is
    // equipment at a musician position, not a stage-cabling route.
    for(const [side,x,angle,mirror] of [['L',29,-16,1],['R',71,16,-1]]){
      group('translate('+x+' 38) rotate('+angle+') scale('+mirror+' 1)','iem-earpiece');
      group('','ear-hook');path('M-8-7C-19-18-23-4-19 10C-16 20-9 24-2 21','none',2.4,'#777');path('M-8-8C-17-15-19-3-16 8','none',.55,'#eee');end();
      group('','custom-shell');
      path('M-12-7C-10-16 2-19 11-13C18-8 18 3 12 10C7 17-5 17-12 9C-17 4-16-2-12-7Z','#d4d4d4',.85);
      path('M-8-6C-5-12 4-13 10-9C14-5 14 2 10 7C6 11-2 12-8 7C-11 4-11-2-8-6Z','#f2f2f2',.45);
      path('M-7 3Q0-4 10-4','none',.55,'#aaa');circle(5,2,2.1,'#777',.4);circle(5,2,.8,'#ddd',.2);end();
      group('','sound-nozzle');path('M8 10L14 17L10 21L4 13Z','#aaa',.55);ellipse(13,19,5,3.6,'#ddd',.55);ellipse(14,19,2.3,1.6,'#666',.35);end();
      end();
      out+='<text x="'+x+'" y="68" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="600" fill="#555" stroke="none">'+side+'</text>';
    }
    path('M41 61Q50 65 59 61','none',.65,'#999');end();
  }else if(type==='rug'){
    rect(5,5,90,90,'#e4e4e4',.85,1.6);rect(8,8,84,84,'none',.6,.4);
    let weave='';for(let i=13;i<90;i+=3.5)weave+='M10 '+f(i)+'h80M'+f(i)+' 10v80';
    path(weave,'none',.2,'#bcbcbc');
    for(let i=10;i<93;i+=4){line(5,i,8,i,.3,'#999');line(92,i,95,i,.3,'#999');line(i,5,i,8,.3,'#999');line(i,92,i,95,.3,'#999');}
  }else if(type==='wash'){
    path('M13 27H7V75Q7 85 21 85H79Q93 85 93 75V27H87','none',4,'#555');
    circle(50,49,34,'#777',.8);circle(50,49,30,'#c8c8c8',.6);circle(50,49,27.5,'#555',.6);
    const lenses=[[50,49]];for(let i=0;i<6;i++)lenses.push([50+Math.cos(i*Math.PI/3)*16,49+Math.sin(i*Math.PI/3)*16]);
    for(const [x,y] of lenses){circle(x,y,6.4,'#ddd',.45);circle(x,y,4.6,'#f6f6f6',.3);path('M'+f(x-3)+' '+f(y+1)+'q1-4 5-3','none',.35,'#aaa');}
    for(let i=0;i<4;i++){const a=(i*90+45)*Math.PI/180;bolt(50+Math.cos(a)*30.8,49+Math.sin(a)*30.8,.8);}
    rect(32,83,36,7,'#777',.6,1);
  }else if(type==='light-par'){
    group('','led-par-top-view');
    path('M18 24Q50 7 82 24L76 78Q50 92 24 78Z','#575757',.9);
    circle(50,49,29,'#8b8b8b',.8);circle(50,49,24,'#d2d2d2',.55);
    const parLenses=[[50,49]];for(let i=0;i<8;i++)parLenses.push([50+Math.cos(i*Math.PI/4)*14.5,49+Math.sin(i*Math.PI/4)*14.5]);
    for(const [x,y] of parLenses){circle(x,y,4.3,'#f4f4f2',.35);circle(x-1,y-1,1.1,'#fff',.15);}
    rect(19,78,62,7,'#4c4c4c',.6,1);for(const x of [24,76])bolt(x,81.5,.65);end();
  }else if(type==='light-moving-spot'){
    group('','spot-moving-head-top-view');
    rect(5,7,116,88,'#454545',.95,8);rect(11,13,104,76,'#696969',.45,6);
    for(const [x,y] of [[15,17],[111,17],[15,85],[111,85]])bolt(x,y,.85);
    path('M25 28V72M101 28V72','none',4.4,'#363636');
    group('','spot-head');path('M34 25H92L98 35V67L91 76H35L28 67V35Z','#555',.8);ellipse(63,50,25,22,'#b7b7b5',.7);ellipse(63,50,18,16,'#343434',.6);circle(63,50,11,'#e7e7e5',.55);circle(60,47,3.2,'#fff',.25);circle(63,50,5.3,'none',.35,'#999');end();
    rect(48,84,30,5,'#333',.35,1);end();
  }else if(type==='light-spark'){
    group('','spark-effect-top-view');
    rect(4,4,92,76,'#4d4d4d',.9,5);rect(9,9,82,66,'#737373',.45,3);
    group('','spark-nozzle');circle(50,37,22,'#252525',.75);circle(50,37,17,'#a9a9a7',.5);for(let ring=0;ring<2;ring++)for(let i=0;i<8;i++){const a=i*Math.PI/4+(ring?Math.PI/8:0),radius=ring?12:7;circle(50+Math.cos(a)*radius,37+Math.sin(a)*radius,1.35,'#333',.18);}circle(50,37,3,'#222',.3);end();
    path('M18 65H82','none',5,'#d0d0cd');for(let x=20;x<82;x+=10)path('M'+x+' 62l7 6','none',2,'#555');
    rect(15,12,12,6,'#292929',.35,1);rect(73,12,12,6,'#292929',.35,1);for(const [x,y] of [[10,10],[90,10],[10,74],[90,74]])bolt(x,y,.7);end();
  }else if(type==='light-moving-wash'){
    group('','moving-head-top-view');
    rect(5,9,116,78,'#4d4d4d',.9,7);rect(11,15,104,66,'#777',.5,5);
    for(const [x,y] of [[15,19],[111,19],[15,77],[111,77]])bolt(x,y,.85);
    path('M25 28V68M101 28V68','none',4.2,'#3d3d3d');rect(27,23,72,50,'#555',.75,10);
    ellipse(63,48,30,23,'#c7c7c5',.75);ellipse(63,48,24,18,'#555',.55);
    const moverLenses=[[63,48]];for(let i=0;i<6;i++)moverLenses.push([63+Math.cos(i*Math.PI/3)*12.5,48+Math.sin(i*Math.PI/3)*9.5]);
    for(const [x,y] of moverLenses)circle(x,y,4,'#ededeb',.35);end();
  }else if(type==='light-flightcase'){
    group('','lighting-flightcase-top-view');
    rect(3,3,154,114,'#777',1,3);rect(9,9,142,102,'#dededc',.65,1.5);rect(14,14,132,92,'#bcbcbc',.38,1);
    for(const x of [7,153])for(const y of [7,113]){circle(x,y,5.2,'#3d3d3d',.5);circle(x,y,2,'#aaa',.25);}
    for(const x of [13,147])for(const y of [13,107]){path('M'+(x-7)+' '+y+'V'+(y-7)+'H'+x,'none',2.2,'#f2f2f0');bolt(x-2.5,y-2.5,.65);}
    group('','case-lid-recess');rect(25,20,110,80,'#d2d2d0',.55,2);rect(31,26,98,68,'none',.4,1);path('M80 26V94M31 60H129','none',.35,'#aaa');end();
    for(const [x,y,vertical] of [[8,60,true],[152,60,true],[80,8,false],[80,112,false]]){if(vertical){rect(x-3,y-13,6,26,'#555',.5,2);line(x,y-8,x,y+8,.8,'#ddd');}else{rect(x-13,y-3,26,6,'#555',.5,2);line(x-8,y,x+8,y,.8,'#ddd');}}
    out+='<text x="80" y="64" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="700" fill="#666" stroke="none">LIGHT CASE</text>';end();
  }else if(type==='light-fog'){
    group('','fog-machine-top-view');
    rect(5,8,167,83,'#4b4b4b',.9,5);rect(11,14,155,71,'#737373',.45,3);
    group('','fog-nozzle');circle(35,49.5,24,'#292929',.75);circle(35,49.5,18,'#aaa',.5);circle(35,49.5,11,'#3c3c3c',.45);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(35+Math.cos(a)*4,49.5+Math.sin(a)*4,35+Math.cos(a)*16,49.5+Math.sin(a)*16,.55,'#777');}end();
    group('','fog-body-vents');for(let y=25;y<=72;y+=7)line(72,y,132,y,1,'#3f3f3f');end();
    path('M63 17Q91 1 119 17','none',4,'#333');path('M66 17Q91 6 116 17','none',1,'#aaa');
    rect(139,22,21,55,'#2f2f2f',.55,2);rect(144,28,11,18,'#a9a9a7',.35,1);circle(149.5,62,5.5,'#666',.45);for(const [x,y] of [[11,14],[166,14],[11,85],[166,85]])bolt(x,y,.7);end();
  }else if(type==='light-wave-bar'){
    group('','moving-wave-bar-top-view');rect(3,5,330,62,'#444',.85,6);rect(9,11,318,50,'#696969',.4,4);
    for(let i=0;i<12;i++){const x=20+i*27;
      group('','wave-cell');rect(x-9,17,18,38,'#3b3b3b',.45,4);path('M'+(x-7)+' 24V48M'+(x+7)+' 24V48','none',1.4,'#999');ellipse(x,36,6.6,11,'#d0d0ce',.4);circle(x,33,4.2,'#f5f5f3',.25);circle(x,43,4.2,'#e6e6e4',.25);end();
    }
    for(const x of [8,328])for(const y of [10,62])bolt(x,y,.65);rect(145,58,46,5,'#2d2d2d',.35,1);end();
  }else if(type==='light-bar'){
    group('','led-bar-top-view');rect(4,5,292,26,'#505050',.75,4);rect(10,9,280,18,'#777',.4,2);
    for(let i=0;i<12;i++){const x=20+i*23.65;circle(x,18,7,'#d1d1cf',.4);circle(x,18,4.8,'#f5f5f3',.25);path('M'+f(x-2.6)+' '+f(19)+'q1-3.5 4.2-2.5','none',.3,'#aaa');}
    for(const x of [8,292])bolt(x,18,.7);end();
  }else if(type==='di'||type.startsWith('di-')){
    const stereo=type.includes('-stereo-'),active=type.endsWith('-active'),width=stereo?180:120,height=stereo?90:80,bodyX=8,bodyY=8,bodyW=width-16,bodyH=height-16,channels=stereo?2:1;
    group('','di-box-top-view');
    rect(bodyX,bodyY,bodyW,bodyH,active?'#34383b':'#4b4d4b',.9,5,'#1c1f20');
    rect(bodyX+5,bodyY+5,bodyW-10,bodyH-10,active?'#707579':'#767876',.45,3,'#a7aaa7');
    for(const x of [bodyX+5,bodyX+bodyW-5])for(const y of [bodyY+5,bodyY+bodyH-5])bolt(x,y,.8);
    const channelXs=channels===2?[width*.31,width*.69]:[width*.5];
    for(const [index,x] of channelXs.entries()){
      group('','di-channel-'+(index+1));
      circle(x-22,height*.56,7.2,'#2a2c2a',.7,'#c4c7c3');circle(x-22,height*.56,3.5,'#111',.35,'#6d716d');
      circle(x+22,height*.56,8,'#b2b5b1',.7,'#202220');circle(x+22,height*.56,5.5,'#303330',.4,'#747874');for(const [dx,dy] of [[0,-2.1],[-2,1.5],[2,1.5]])circle(x+22+dx,height*.56+dy,.85,'#111',.18);
      out+='<text x="'+f(x)+'" y="'+f(height*.77)+'" text-anchor="middle" font-size="5.5" font-family="sans-serif" font-weight="700" fill="#e7e9e5" stroke="none">CH '+(index+1)+'</text>';end();
    }
    rect(width/2-15,bodyY+9,30,13,active?'#272b2d':'#d0d2ce',.4,2,active?'#72777a':'#4b4e4b');
    out+='<text x="'+f(width/2)+'" y="'+f(bodyY+18)+'" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="800" fill="'+(active?'#d9ff58':'#343734')+'" stroke="none">DI</text>';
    out+='<text x="'+f(width/2)+'" y="'+f(bodyY+29)+'" text-anchor="middle" font-size="5" font-family="sans-serif" font-weight="700" fill="#f0f2ee" stroke="none">'+(stereo?'STEREO':'MONO')+' · '+(active?'AKTIV':'PASSIV')+'</text>';
    if(active){circle(width-20,bodyY+16,2.2,'#c9ef48',.35,'#151715');out+='<text x="'+f(width-20)+'" y="'+f(bodyY+25)+'" text-anchor="middle" font-size="3.8" font-family="sans-serif" fill="#dce0da" stroke="none">48V</text>';}
    end();
  }else if(type==='text'){
    path('M23 20h54M50 20v62M38 82h24M23 20v12M77 20v12','none',2,'#555');
  }else{
    throw new Error('Unbekanntes Symbol: '+type);
  }
  return '<g data-equipment="'+type+'">'+out+'</g>';
}
