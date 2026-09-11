/* Shared geometry and local library preferences. No project/schema changes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StageplotQol=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const key='stageplot-studio:library-preferences:v1';
  function normalizePreferences(value,allowed){
    const clean=(list,limit)=>[...new Set((Array.isArray(list)?list:[]).filter(id=>typeof id==='string'&&allowed.has(id)))].slice(0,limit);
    return {version:1,favorites:clean(value?.favorites,500),recent:clean(value?.recent,12)};
  }
  function readPreferences(storage,allowed){try{return normalizePreferences(JSON.parse(storage.getItem(key)),allowed);}catch{return normalizePreferences(null,allowed);}}
  function writePreferences(storage,value){try{storage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function remember(value,id,allowed){return normalizePreferences({...value,recent:[id,...value.recent]},allowed);}
  function favorite(value,id,allowed){return normalizePreferences({...value,favorites:value.favorites.includes(id)?value.favorites.filter(v=>v!==id):[...value.favorites,id]},allowed);}
  function box(o,sizeOf){
    const s=sizeOf(o),r=(Number(o.angle)||0)*Math.PI/180;
    const hw=(Math.abs(Math.cos(r))*s.w+Math.abs(Math.sin(r))*s.d)/2,hd=(Math.abs(Math.sin(r))*s.w+Math.abs(Math.cos(r))*s.d)/2;
    return {left:o.x-hw,right:o.x+hw,top:o.y-hd,bottom:o.y+hd,hw,hd};
  }
  function extent(items,sizeOf){
    const boxes=items.map(o=>box(o,sizeOf));
    return {left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
  }
  function arrange(items,action,sizeOf){
    if(items.length<2||items.some(o=>o.locked))return null;
    const b=extent(items,sizeOf),result=items.map(o=>({id:o.id,x:o.x,y:o.y,angle:o.angle||0}));
    if(action.startsWith('rotate')){
      const degrees=action==='rotate-left'?-90:90,r=degrees*Math.PI/180,cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
      return result.map(o=>({...o,x:cx+(o.x-cx)*Math.cos(r)-(o.y-cy)*Math.sin(r),y:cy+(o.x-cx)*Math.sin(r)+(o.y-cy)*Math.cos(r),angle:(o.angle+degrees+360)%360}));
    }
    if(action==='space-x'||action==='space-y'){
      if(items.length<3)return null;
      const horizontal=action==='space-x',axis=horizontal?'x':'y',half=horizontal?'hw':'hd';
      const sorted=items.map(o=>({...o,box:box(o,sizeOf)})).sort((a,b)=>a[axis]-b[axis]||a.id.localeCompare(b.id));
      // Keep the outer objects fixed; distribute equal clear gaps between rotated footprints.
      const first=sorted[0],last=sorted.at(-1),start=first[axis]+first.box[half],end=last[axis]-last.box[half];
      const occupied=sorted.slice(1,-1).reduce((sum,o)=>sum+2*o.box[half],0),gap=(end-start-occupied)/(items.length-1);
      if(gap<-.000001)return null;
      let cursor=start+Math.max(0,gap);
      for(const o of sorted.slice(1,-1)){result.find(p=>p.id===o.id)[axis]=cursor+o.box[half];cursor+=2*o.box[half]+Math.max(0,gap);}
      return result;
    }
    for(const o of items){const p=result.find(p=>p.id===o.id),s=box(o,sizeOf);
      if(action==='left')p.x=b.left+s.hw;else if(action==='center-x')p.x=(b.left+b.right)/2;else if(action==='right')p.x=b.right-s.hw;
      else if(action==='top')p.y=b.top+s.hd;else if(action==='center-y')p.y=(b.top+b.bottom)/2;else if(action==='bottom')p.y=b.bottom-s.hd;
      else return null;
    }
    return result;
  }
  return {key,normalizePreferences,readPreferences,writePreferences,remember,favorite,box,extent,arrange};
});
