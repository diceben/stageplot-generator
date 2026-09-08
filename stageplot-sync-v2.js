/* Account-scoped offline queue. Local app libraries remain the primary store. */
(function(global){
  'use strict';
  const kinds={project:'setup',drum_template:'drum',stage_template:'stage-template',inventory:'inventory'};
  const clone=value=>JSON.parse(JSON.stringify(value));
  // PostgreSQL jsonb may reorder object keys; that must not look like an edit.
  const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,ordered(value[key])])):value;
  const fingerprint=entry=>{const document=clone(entry.document);if(document.stage?.routing)delete document.stage.routing.generatedAt;return JSON.stringify([entry.name,ordered(document)]);};
  function normalizeEntry(kind,value){
    if(!kinds[kind]||!value||!new RegExp('^'+kinds[kind]+'-[a-z0-9-]+$').test(value.id||''))throw new Error('Ungültiger Cloud-Datensatz.');
    const name=String(value.name||value.document?.name||value.document?.stage?.title||'').trim();
    if(!name||name.length>80||!Number.isFinite(value.savedAt)||!value.document||typeof value.document!=='object')throw new Error('Ungültige Cloud-Daten.');
    return {id:value.id,name,savedAt:value.savedAt,document:clone(value.document)};
  }
  function create({client,storage=global.localStorage,ownerId,scope='',onConflict=()=>{}}){
    if(!/^[a-z0-9-]+$/i.test(ownerId||'')||!client?.auth?.getUser||!client.rpc)throw new Error('Account fehlt.');
    const key='stageplot-studio:sync:v2:'+encodeURIComponent(scope)+':'+ownerId;
    let localLock=Promise.resolve();
    const lock=fn=>{if(global.navigator?.locks)return global.navigator.locks.request(key,fn);const next=localLock.then(fn,fn);localLock=next.catch(()=>{});return next;};
    function read(){const raw=storage.getItem(key);if(!raw)return {version:2,pending:[],revisions:{},synced:{}};const state=JSON.parse(raw);if(state.version!==2||!Array.isArray(state.pending)||!state.revisions||!state.synced)throw new Error('Cloud-Warteschlange nicht lesbar.');return state;}
    const write=state=>storage.setItem(key,JSON.stringify(state));
    const recordKey=(kind,id)=>kind+':'+id;
    async function assertOwner(){const result=await client.auth.getUser();if(result.error)throw result.error;if(result.data?.user?.id!==ownerId)throw new Error('Bitte mit dem verbundenen Account anmelden.');}
    async function rpc(name,args){await assertOwner();const result=await client.rpc(name,args);if(result.error)throw result.error;const data=Array.isArray(result.data)?result.data[0]:result.data;if(!data||typeof data!=='object')throw new Error('Ungültige Sync-Antwort.');return data;}
    async function save(kind,value){const entry=normalizeEntry(kind,value);await lock(()=>{const state=read(),k=recordKey(kind,entry.id);state.pending=state.pending.filter(op=>!(op.kind===kind&&op.id===entry.id));if(state.synced[k]!==fingerprint(entry))state.pending.push({kind,id:entry.id,entry,deleted:false,base:state.revisions[k]||0});write(state);});return {queued:true};}
    async function remove(kind,id){if(!kinds[kind]||!new RegExp('^'+kinds[kind]+'-[a-z0-9-]+$').test(id))throw new Error('Ungültiger Datensatz.');await lock(()=>{const state=read(),k=recordKey(kind,id);state.pending=state.pending.filter(op=>!(op.kind===kind&&op.id===id));state.pending.push({kind,id,entry:null,deleted:true,base:state.revisions[k]||0});write(state);});return {queued:true};}
    async function flush(){return lock(async()=>{
      const state=read();let completed=0,copies=0;
      while(state.pending.length){
        const op=state.pending[0],k=recordKey(op.kind,op.id);
        const data=await rpc('stageplot_sync_push',{p_kind:op.kind,p_id:op.id,p_base_revision:op.base,p_name:op.entry?.name||'Gelöscht',p_client_updated_at:op.entry?.savedAt||Date.now(),p_payload:op.entry?.document||{},p_deleted:op.deleted});
        if(data.status==='conflict'){
          // Keep the remote original and save a separate local copy. Never use device clocks to choose a winner.
          if(!op.deleted){const id=kinds[op.kind]+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),limit=op.kind==='stage_template'?40:60,entry={...clone(op.entry),id,name:op.entry.name.slice(0,limit-16)+' · Konfliktkopie'};
            if(op.kind==='project'){entry.document.stage.title=entry.name;if(entry.document.stage.project)entry.document.stage.project.name=entry.name;}
            else if(op.kind==='drum_template'||op.kind==='inventory')entry.document.name=entry.name;
            state.pending.push({...op,id,entry,base:0});copies++;onConflict({kind:op.kind,originalId:op.id,copy:clone(entry)});
          }else onConflict({kind:op.kind,originalId:op.id,deleteConflict:true});
          // The local contents now survive in the copy. Don't requeue them against
          // the remote revision if the connection drops before pull can apply it.
          // Keep the old revision until accept(), so further unseen edits conflict.
          state.pending.shift();state.synced[k]=op.deleted?null:fingerprint(op.entry);write(state);continue;
        }
        if(!['saved','deleted'].includes(data.status)||!Number.isFinite(Number(data.revision)))throw new Error('Ungültige Sync-Bestätigung.');
        state.revisions[k]=Number(data.revision);state.synced[k]=op.deleted?null:fingerprint(op.entry);state.pending.shift();write(state);completed++;
      }
      return {completed,copies,pending:state.pending.length};
    });}
    async function accept(kind,row){return lock(()=>{const state=read(),k=recordKey(kind,row.id);if(state.pending.some(op=>op.kind===kind&&op.id===row.id))return false;state.revisions[k]=Number(row.revision)||0;state.synced[k]=row.deleted?null:fingerprint(row);write(state);return true;});}
    async function pull(kind,{acknowledge=true}={}){if(!kinds[kind])throw new Error('Unbekannte Datenart.');return lock(async()=>{
      const state=read(),records=[];let cursor=0;
      for(;;){
        const page=await rpc('stageplot_sync_pull',{p_kind:kind,p_cursor:cursor,p_limit:200});if(!Array.isArray(page.records))throw new Error('Ungültige Cloud-Liste.');
        for(const row of page.records){
          if(row.kind!==kind||state.pending.some(op=>op.kind===kind&&op.id===row.id))continue;
          const entry=normalizeEntry(kind,{id:row.id,name:row.name,savedAt:Number(row.client_updated_at),document:row.payload}),k=recordKey(kind,row.id);
          if(acknowledge){state.revisions[k]=Number(row.revision)||0;state.synced[k]=row.deleted?null:fingerprint(entry);}records.push({...entry,revision:Number(row.revision)||0,deleted:row.deleted===true});
        }
        if(page.records.length<200)break;
        if(!Number.isFinite(Number(page.cursor))||Number(page.cursor)<=cursor)throw new Error('Cloud-Liste kann nicht fortgesetzt werden.');cursor=Number(page.cursor);
      }
      write(state);return records;
    });}
    const repo=kind=>({save:entry=>save(kind,entry),remove:id=>remove(kind,id),list:async()=>(await pull(kind)).filter(entry=>!entry.deleted).map(({deleted,revision,...entry})=>entry)});
    return {projects:repo('project'),drumTemplates:repo('drum_template'),stageTemplates:repo('stage_template'),inventory:repo('inventory'),save,remove,pull,accept,flush,
      local:{state:()=>clone(read()),matches:(kind,entry)=>read().synced[recordKey(kind,entry.id)]===fingerprint(entry)},ownerId};
  }
  global.StageplotSync={create,normalizeEntry,fingerprint};
})(typeof window==='undefined'?globalThis:window);
