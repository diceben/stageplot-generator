/* Orchestra model. All geometry is in metres; hidden sections retain their places. */
function createStageplotOrchestraModel() {
  'use strict';
  const families=[{id:'strings',name:'Streicher'},{id:'woodwinds',name:'Holzbläser'},{id:'brass',name:'Blechbläser'},{id:'harps',name:'Harfen'},{id:'percussion',name:'Schlagwerk'}];
  const catalog=[
    ['violin','Violine','strings',.207,.59],['viola','Viola','strings',.25,.68],['cello','Cello','strings',.44,1.25],['double-bass','Kontrabass','strings',.66,1.9],
    ['harp','Konzertharfe','harps',.55,1],['flute','Querflöte','woodwinds',.67,.06],['oboe','Oboe','woodwinds',.07,.65],['clarinet','Klarinette','woodwinds',.08,.67],['bassoon','Fagott','woodwinds',.24,1.35],
    ['piccolo','Piccolo','woodwinds',.32,.035],['english-horn','Englischhorn','woodwinds',.09,.9],['bass-clarinet','Bassklarinette','woodwinds',.23,1.35],['contrabassoon','Kontrafagott','woodwinds',.42,1.55],
    ['horn','Wiener Horn','brass',.62,.48],['trumpet','Trompete','brass',.54,.16],['trombone','Posaune','brass',.26,1.15],['tuba','Tuba','brass',.52,.98],
    ['timpani','Pauke','percussion',.88,1.02],['concert-bass-drum','Große Trommel','percussion',.65,1],['orchestral-snare','Kleine Trommel','percussion',.4064,.4064],['crash-cymbals','Paarbecken','percussion',.84,.4064],['tam-tam','Tam-tam','percussion',1.1,.65],['xylophone','Xylophon','percussion',1.4,.75],['glockenspiel','Glockenspiel','percussion',.9,.4],['triangle','Triangel','percussion',.22,.25]
  ].map(([id,name,family,w,d])=>({id,name,family,w,d,asset:id,group:families.find(f=>f.id===family).name}));
  const byId=Object.fromEntries(catalog.map(c=>[c.id,c]));
  const sections=[
    ['violin1','1. Violinen','violin',16],['violin2','2. Violinen','violin',14],['violas','Violen','viola',12],['cellos','Celli','cello',10],['basses','Kontrabässe','double-bass',8],
    ['flutes','Flöten','flute',3],['oboes','Oboen','oboe',3],['clarinets','Klarinetten','clarinet',3],['bassoons','Fagotte','bassoon',3],
    ['horns','Hörner','horn',6],['trumpets','Trompeten','trumpet',4],['trombones','Posaunen','trombone',3],['tubas','Tuba','tuba',1],['harps','Harfen','harp',2],['timpani','Pauken','timpani',4],['percussion','Weiteres Schlagwerk','concert-bass-drum',7]
  ].map(([id,name,type,count])=>({id,name,type,count,family:byId[type].family}));
  const sectionById=Object.fromEntries(sections.map(s=>[s.id,s]));
  const finite=(v,def,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):def;
  const round=v=>Math.round(v*10000)/10000;
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=v=>String(v??'').replace(/[\x00-\x1f]/g,' ').slice(0,60);
  function dimensions(p){const c=byId[p.type];return {w:p.width??c.w,d:p.depth??c.d};}
  function part(type,id,x=0,y=0,section){const c=byId[type]||byId.violin;return {id,type:c.id,section:section||({piccolo:'flutes','english-horn':'oboes','bass-clarinet':'clarinets',contrabassoon:'bassoons'})[c.id]||sections.find(s=>s.type===c.id)?.id||'percussion',x,y,angle:0,label:c.name,enabled:true,pickup:'none'};}
  function seat(section,i){
    let x=0,y=0,angle=180;
    if(['violin1','violin2','violas','cellos'].includes(section)){
      const span={violin1:[-78,-47,4],violin2:[47,78,4],cellos:[-38,-8,3],violas:[8,38,3]}[section],row=Math.floor(i/span[2]),col=i%span[2],a=span[0]+(span[1]-span[0])*col/(span[2]-1),r=3.1+row*1.45;
      x=Math.sin(a*Math.PI/180)*r;y=.3-Math.cos(a*Math.PI/180)*r;angle=180-a;
    }else if(section==='basses'){x=-7.7-(i%2)*1.3;y=-3.8-Math.floor(i/2)*1.6;angle=110;}
    else if(section==='flutes'){x=-2.6+i*1.25;y=-7.25;angle=0;}
    else if(section==='oboes'){x=1.2+i*1.25;y=-7.25;}
    else if(section==='clarinets'){x=-2.6+i*1.25;y=-8.65;}
    else if(section==='bassoons'){x=1.2+i*1.25;y=-8.65;}
    else if(section==='horns'){x=-5.5+(i%3)*1.3;y=-8.6-Math.floor(i/3)*1.4;}
    else if(section==='trumpets'){x=-.5+i*1.3;y=-10.05;angle=0;}
    else if(section==='trombones'){x=5.25+i*1.25;y=-8.65;}
    else if(section==='tubas'){x=8.9+i*1.5;y=-8.7;}
    else if(section==='harps'){x=8.4;y=-4.9-i*1.7;angle=-25;}
    else if(section==='timpani'){x=-8.8+i*1.2;y=-11.35;angle=0;}
    else{x=-2.8+i*1.95;y=-11.8;angle=0;}
    return {x:round(x),y:round(y),angle};
  }
  function preset(){
    const parts=[];for(const s of sections)for(let i=0;i<s.count;i++){
      const type=s.id==='percussion'?['concert-bass-drum','orchestral-snare','crash-cymbals','tam-tam','xylophone','glockenspiel','triangle'][i]:i===2?({flutes:'piccolo',oboes:'english-horn',clarinets:'bass-clarinet',bassoons:'contrabassoon'})[s.id]||s.type:s.type;
      const p={...part(type,'o'+(parts.length+1),0,0,s.id),...seat(s.id,i)};p.label=s.id==='percussion'||type!==s.type?byId[type].name:s.name+' '+(i+1);if(s.id==='timpani'){p.width=[.98,.92,.86,.79][i];p.depth=p.width+.14;}
      parts.push(p);
    }return normalize({mode:'ensemble',parts,seating:true,labels:true});
  }
  function single(type){return normalize({mode:'single',parts:[part(type,'o1')],seating:false,labels:false});}
  function normalize(value){
    if(!value||!Array.isArray(value.parts))return preset();
    const used=new Set(),parts=[];
    for(const [i,p]of value.parts.slice(0,180).entries()){
      if(!p||!Object.hasOwn(byId,p.type))continue;
      let id=/^[a-zA-Z0-9-]{1,60}$/.test(p.id||'')?p.id:'o'+(i+1),n=1,base=id;while(used.has(id))id=base.slice(0,48)+'-copy'+n++;used.add(id);
      const c=byId[p.type],section=Object.hasOwn(sectionById,p.section)?p.section:({piccolo:'flutes','english-horn':'oboes','bass-clarinet':'clarinets',contrabassoon:'bassoons'})[c.id]||sections.find(s=>s.type===c.id)?.id||'percussion';
      parts.push({...part(c.id,id,0,0,section),x:round(finite(p.x,0,-25,25)),y:round(finite(p.y,0,-25,25)),angle:round((finite(p.angle,0,-36000,36000)%360+360)%360),label:clean(p.label??c.name),enabled:p.enabled!==false,pickup:p.pickup==='mic'?'mic':'none',...(Number.isFinite(p.width)?{width:round(finite(p.width,c.w,.02,5))}:{}),...(Number.isFinite(p.depth)?{depth:round(finite(p.depth,c.d,.02,5))}:{})});
    }
    return {version:1,mode:value.mode==='single'?'single':'ensemble',seating:value.seating!==false,labels:value.labels!==false,groups:Object.fromEntries(sections.map(s=>[s.id,value.groups?.[s.id]!==false])),nextId:Math.max(Math.floor(finite(value.nextId,1,1,1e9)),...parts.map(p=>/^o\d+$/.test(p.id)?Number(p.id.slice(1))+1:1)),parts};
  }
  function active(config,p){return p.enabled&&config.groups[p.section]!==false;}
  function layout(value){
    const config=normalize(value);let minX=config.mode==='ensemble'?-10:Infinity,maxX=config.mode==='ensemble'?10:-Infinity,minY=config.mode==='ensemble'?-12.7:Infinity,maxY=config.mode==='ensemble'?1.1:-Infinity;
    const all=config.parts.map(p=>({...p,...dimensions(p)}));
    // Include hidden instruments in the bounds: toggling a group cannot move its neighbours.
    for(const p of all){const a=p.angle*Math.PI/180,w=config.seating?Math.max(p.w,1):p.w,d=config.seating?Math.max(p.d,1.6):p.d,hw=(Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*d)/2,hd=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*d)/2;minX=Math.min(minX,p.x-hw);maxX=Math.max(maxX,p.x+hw);minY=Math.min(minY,p.y-hd);maxY=Math.max(maxY,p.y+hd);}
    if(!all.length&&config.mode==='single'){minX=minY=-.3;maxX=maxY=.3;}
    minX-=.025;minY-=.025;maxX+=.025;maxY+=.025;
    const w=round(maxX-minX),d=round(maxY-minY);return {config,all,parts:all.filter(p=>active(config,p)),minX,minY,w,d,vb:[round(w*100),round(d*100)]};
  }
  function imageMarkup(p,unit=100){
    const {w,d}=dimensions(p),c=byId[p.type];
    return '<image data-orchestra-image="'+c.id+'" href="./stageplot-assets/orchestra/'+c.asset+'.webp" x="'+(-w*unit/2)+'" y="'+(-d*unit/2)+'" width="'+w*unit+'" height="'+d*unit+'" preserveAspectRatio="none" style="filter:grayscale(1)"/>';
  }
  function furnitureMarkup(p){
    if(!['strings','woodwinds','brass'].includes(byId[p.type].family))return '';
    // Technical furniture only; instrument artwork always comes from generated raster files.
    return '<g fill="#e7e7e7" stroke="#868686" stroke-width=".8" data-orchestra-furniture="true"><rect x="-23" y="-25" width="46" height="43" rx="5"/><path d="M-23-23Q0-36 23-23" fill="none" stroke-width="3"/><path d="M-21 54H21V68H-21Z"/><path d="M0 68V74M-12 78L0 72 12 78" fill="none"/></g>';
  }
  function groupLabels(value){const l=layout(value);if(!l.config.labels||l.config.mode!=='ensemble')return '';return sections.map(s=>{const parts=l.parts.filter(p=>p.section===s.id);if(!parts.length)return '';const x=parts.reduce((a,p)=>a+p.x,0)/parts.length,y=Math.max(...parts.map(p=>p.y+Math.max(p.d,.7)/2))+.3;return '<text x="'+round(x*100)+'" y="'+round(y*100)+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="600" fill="#333" paint-order="stroke" stroke="#fff" stroke-width="5">'+escape(s.name)+' · '+parts.length+'</text>';}).join('');}
  function artwork(value){const l=layout(value);return '<g data-equipment="orchestra" transform="translate('+round(-l.minX*100)+' '+round(-l.minY*100)+')">'+l.parts.map(p=>'<g transform="translate('+round(p.x*100)+' '+round(p.y*100)+') rotate('+p.angle+')">'+(l.config.seating?furnitureMarkup(p):'')+imageMarkup(p)+'</g>').join('')+(l.config.mode==='ensemble'?'<g data-conductor="true"><rect x="-50" y="-40" width="100" height="80" rx="3" fill="#e5e5e5" stroke="#888"/><text x="0" y="65" text-anchor="middle" font-size="15" font-family="Arial,sans-serif" fill="#333">Dirigat · Publikum ↓</text></g>':'')+groupLabels(value)+'</g>';}
  function channels(value){const l=layout(value);return l.parts.filter(p=>p.pickup==='mic').map(p=>({id:p.id,partId:p.id,name:p.label||byId[p.type].name,connector:'XLR'}));}
  function familyEnabled(value,family){const c=normalize(value);return sections.filter(s=>s.family===family).some(s=>c.groups[s.id]&&c.parts.some(p=>p.section===s.id&&p.enabled));}
  return {families,catalog,byId,sections,sectionById,part,seat,preset,single,normalize,dimensions,layout,active,imageMarkup,furnitureMarkup,groupLabels,artwork,channels,familyEnabled,escape};
}
if(typeof module==='object'&&module.exports)module.exports=createStageplotOrchestraModel;
