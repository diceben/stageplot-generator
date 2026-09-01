(function attachStageplotAccountRuntime(global){
  'use strict';

  const queueKey='stageplot-studio:cloud-queue:v1';
  const metaKey='stageplot-studio:cloud-meta:v1';
  const kinds=new Set(['project','drum_template','stage_template']);
  const idPatterns={
    project:/^setup-[a-z0-9-]+$/,
    drum_template:/^drum-[a-z0-9-]+$/,
    stage_template:/^stage-template-[a-z0-9-]+$/
  };

  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const operationId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,11);
  function assertStorage(storage){
    if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function')throw new Error('Ein lokaler Speicher wird benötigt.');
  }
  function normalizeKind(kind){if(!kinds.has(kind))throw new Error('Unbekannte Stageplot-Datenart.');return kind;}
  function normalizeId(kind,id){id=String(id||'');if(!idPatterns[normalizeKind(kind)].test(id))throw new Error('Ungültige Stageplot-ID.');return id;}
  function normalizeName(value){const name=String(value||'').trim();if(!name||name.length>80)throw new Error('Ungültiger Name.');return name;}
  function normalizeEntry(kind,value){
    if(!value||typeof value!=='object')throw new Error('Ungültiger Stageplot-Datensatz.');
    const id=normalizeId(kind,value.id),savedAt=Number(value.savedAt);
    if(!Number.isFinite(savedAt)||savedAt<0||savedAt>8640000000000000)throw new Error('Ungültiges Änderungsdatum.');
    const name=normalizeName(value.name||value.document?.name||value.document?.stage?.title);
    if(!value.document||typeof value.document!=='object')throw new Error('Stageplot-Dokument fehlt.');
    return {id,name,savedAt,document:clone(value.document)};
  }
  function readEnvelope(storage,key,fallback){
    const raw=storage.getItem(key);if(!raw)return clone(fallback);
    const parsed=JSON.parse(raw);if(!parsed||parsed.version!==1)throw new Error('Lokale Cloud-Daten sind beschädigt.');return parsed;
  }
  function readQueue(storage){
    const data=readEnvelope(storage,queueKey,{version:1,operations:[]});
    if(!Array.isArray(data.operations))throw new Error('Lokale Cloud-Warteschlange ist beschädigt.');
    return data.operations.map(item=>{
      if(!item||typeof item.opId!=='string'||!item.opId||!['save','remove'].includes(item.action))throw new Error('Lokale Cloud-Änderung ist beschädigt.');
      const kind=normalizeKind(item.kind),id=normalizeId(kind,item.id),baseRevision=Math.max(0,Math.trunc(Number(item.baseRevision)||0));
      return {opId:item.opId,action:item.action,kind,id,baseRevision,entry:item.action==='save'?normalizeEntry(kind,item.entry):null,queuedAt:Number(item.queuedAt)||0,conflict:item.conflict===true};
    });
  }
  function writeQueue(storage,operations){storage.setItem(queueKey,JSON.stringify({version:1,operations}));}
  function readMeta(storage){
    const data=readEnvelope(storage,metaKey,{version:1,revisions:{},cursor:0});
    if(!data.revisions||typeof data.revisions!=='object'||!Number.isFinite(Number(data.cursor)))throw new Error('Lokale Cloud-Metadaten sind beschädigt.');
    return {version:1,revisions:{...data.revisions},cursor:Math.max(0,Math.trunc(Number(data.cursor)))};
  }
  function writeMeta(storage,data){storage.setItem(metaKey,JSON.stringify({version:1,revisions:data.revisions,cursor:data.cursor}));}
  const revisionKey=(kind,id)=>kind+':'+id;
  function cloudError(result,fallback){
    const source=result&&typeof result==='object'&&Object.hasOwn(result,'data')?result.error:result;if(!source)return null;
    const error=new Error(source.message||fallback);error.code=source.code||'';error.status=Number(source.status||result?.status)||0;return error;
  }

  function createStageplotAccountBridge(options={}){
    const client=options.client,storage=options.storage||global.localStorage,onConflict=typeof options.onConflict==='function'?options.onConflict:()=>{};
    assertStorage(storage);if(!client?.auth?.getUser||typeof client.rpc!=='function')throw new Error('Supabase-Client fehlt.');
    let syncing=null;

    async function userId(){
      const result=await client.auth.getUser(),error=cloudError(result,'Konto konnte nicht geprüft werden.');if(error)throw error;
      const id=result?.data?.user?.id;if(typeof id!=='string'||!id)throw new Error('Bitte zuerst anmelden.');return id;
    }
    function enqueue(action,kind,value){
      kind=normalizeKind(kind);const entry=action==='save'?normalizeEntry(kind,value):null,id=normalizeId(kind,entry?.id||value),meta=readMeta(storage),operations=readQueue(storage);
      const key=revisionKey(kind,id),baseRevision=Math.max(0,Math.trunc(Number(meta.revisions[key])||0));
      const pending=operations.find(item=>item.kind===kind&&item.id===id&&!item.conflict),operation={opId:pending?.opId||operationId(),action,kind,id,baseRevision:pending?.baseRevision??baseRevision,entry,queuedAt:Date.now(),conflict:false};
      writeQueue(storage,operations.filter(item=>item.opId!==operation.opId&&!(item.kind===kind&&item.id===id&&!item.conflict)).concat(operation));return operation;
    }
    async function push(operation){
      await userId();
      const result=await client.rpc('stageplot_sync_push',{p_kind:operation.kind,p_id:operation.id,p_base_revision:operation.baseRevision,p_name:operation.entry?.name||'',p_client_updated_at:operation.entry?.savedAt||Date.now(),p_payload:operation.entry?.document||{},p_deleted:operation.action==='remove'}),error=cloudError(result,'Cloud-Änderung konnte nicht gespeichert werden.');
      if(error)throw error;
      const data=Array.isArray(result.data)?result.data[0]:result.data;if(!data||!['saved','deleted','conflict'].includes(data.status))throw new Error('Ungültige Antwort des Cloud-Speichers.');
      if(data.status==='conflict'){
        const conflict=new Error('Dieses Dokument wurde auf einem anderen Gerät geändert.');conflict.code='STAGEPLOT_CONFLICT';conflict.server=data.record||null;throw conflict;
      }
      return data;
    }
    async function flush(){
      if(syncing)return syncing;
      syncing=(async()=>{
        let operations=readQueue(storage),completed=0;
        for(const operation of operations.filter(item=>!item.conflict)){
          try{
            const result=await push(operation),meta=readMeta(storage),key=revisionKey(operation.kind,operation.id);
            meta.revisions[key]=Math.max(0,Math.trunc(Number(result.revision)||0));meta.cursor=Math.max(meta.cursor,Math.trunc(Number(result.change_seq)||0));writeMeta(storage,meta);
            operations=readQueue(storage).filter(item=>item.opId!==operation.opId);writeQueue(storage,operations);completed++;
          }catch(error){
            if(error.code==='STAGEPLOT_CONFLICT'){
              operations=readQueue(storage).map(item=>item.opId===operation.opId?{...item,conflict:true}:item);writeQueue(storage,operations);onConflict({operation:clone(operation),server:clone(error.server)});
            }
            break;
          }
        }
        return {completed,pending:readQueue(storage).length};
      })();
      try{return await syncing;}finally{syncing=null;}
    }
    async function list(kind){
      kind=normalizeKind(kind);await userId();
      const result=await client.rpc('stageplot_sync_pull',{p_kind:kind,p_cursor:0,p_limit:1000}),error=cloudError(result,'Cloud-Daten konnten nicht geladen werden.');if(error)throw error;
      const data=Array.isArray(result.data)?result.data[0]:result.data,records=Array.isArray(data?.records)?data.records:[];
      const meta=readMeta(storage);meta.cursor=Math.max(meta.cursor,Math.trunc(Number(data?.cursor)||0));
      const entries=[];for(const record of records){
        const id=normalizeId(kind,record.id),key=revisionKey(kind,id);meta.revisions[key]=Math.max(0,Math.trunc(Number(record.revision)||0));
        if(!record.deleted)entries.push(normalizeEntry(kind,{id,name:record.name,savedAt:Number(record.client_updated_at)||Date.now(),document:record.payload}));
      }
      writeMeta(storage,meta);return entries;
    }
    async function save(kind,entry){const operation=enqueue('save',kind,entry);try{await flush();}catch(error){}return {queued:readQueue(storage).some(item=>item.opId===operation.opId)};}
    async function remove(kind,id){const operation=enqueue('remove',kind,id);try{await flush();}catch(error){}return {queued:readQueue(storage).some(item=>item.opId===operation.opId)};}
    const repository=kind=>({list:()=>list(kind),save:entry=>save(kind,entry),remove:id=>remove(kind,id)});
    return {
      projects:repository('project'),drumTemplates:repository('drum_template'),stageTemplates:repository('stage_template'),
      flush,status:async()=>({userId:await userId(),pending:readQueue(storage).length,conflicts:readQueue(storage).filter(item=>item.conflict).length}),
      local:{queue:()=>clone(readQueue(storage)),meta:()=>clone(readMeta(storage))}
    };
  }

  global.StageplotAccountRuntime={create:createStageplotAccountBridge,queueKey,metaKey};
  if(global.document?.documentElement)global.document.documentElement.dataset.stageplotAccountRuntime='ready';
})(typeof window!=='undefined'?window:globalThis);
