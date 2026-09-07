(function(global){
  'use strict';
  const key='stageplot-studio:inventory:v1';
  function normalize(value){
    if(!value||!/^inventory-[a-z0-9-]+$/.test(value.id||''))throw new Error('Ungültige Inventar-ID.');
    const source=value.document||value,text=(key,max)=>String(source[key]??'').trim().slice(0,max),name=text('name',80)||String(value.name||'').trim().slice(0,80),quantity=Number(source.quantity);
    if(!name||!Number.isInteger(quantity)||quantity<0||quantity>10000)throw new Error('Name und Stückzahl (0–10.000) angeben.');
    return {id:value.id,name,savedAt:Number.isFinite(value.savedAt)?value.savedAt:Date.now(),document:{name,category:text('category',50),model:text('model',100),quantity,symbol:text('symbol',80),wireless:text('wireless',100),power:text('power',100),notes:text('notes',300)}};
  }
  function read(storage=global.localStorage){const raw=storage.getItem(key);if(!raw)return[];const state=JSON.parse(raw);if(state.version!==1||!Array.isArray(state.entries))throw new Error('Inventarliste kann nicht gelesen werden.');return state.entries.map(normalize);}
  function write(entries,storage=global.localStorage){storage.setItem(key,JSON.stringify({version:1,entries:entries.map(normalize)}));}
  function save(entry,storage=global.localStorage){const normalized=normalize(entry),entries=read(storage);write(entries.filter(item=>item.id!==normalized.id).concat(normalized),storage);return normalized;}
  function remove(id,storage=global.localStorage){const entries=read(storage),entry=entries.find(item=>item.id===id);write(entries.filter(item=>item.id!==id),storage);return entry;}
  const usage=(id,objects=[])=>objects.filter(object=>object.inventoryId===id).length;
  global.StageplotInventory={key,normalize,read,write,save,remove,usage};
})(typeof window==='undefined'?globalThis:window);
