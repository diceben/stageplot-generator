/* Opt-in public snapshots. Private documents and local drafts never use this API. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StageplotShare=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const fields=names=>Object.fromEntries(names.split(' ').map(key=>[key,true]));
  const point=fields('x y'),size=fields('w d'),port=fields('count connector');
  const stair=fields('id stairs stairsOffset stairsAlong stairsWidth stairsDepth stairsSteps');
  const part={...fields('id type section x y angle scale label enabled pickup width depth'),mics:[fields('model phantom')]};
  const extraIds=Array.from({length:48},(_,i)=>'extra-p'+(i+1));
  const drumIds='throne kick1 kick2 snare side rack1 rack2 rack3 rack4 floor1 floor2 floor3 hihat ride crash1 crash2 crash3 crash4 splash1 splash2 splash3 splash4 china1 china2 clapstack pad bongos table '+extraIds.join(' ');
  const micIds='kick1-in kick1-out kick2-in kick2-out snare-up snare-down side-up side-down rack1 rack2 rack3 rack4 floor1 floor2 floor3 hihat ride crash1 crash2 crash3 crash4 splash1 splash2 splash3 splash4 china1 china2 clapstack oh-mono oh-l oh-r room-mono room-l room-r pad-l pad-r bongos '+extraIds.flatMap(id=>['1','2','l','r'].map(side=>id+'-'+side)).join(' ');
  const map=(names,schema)=>Object.fromEntries(names.split(' ').map(key=>[key,schema]));
  const mix={...fields('id name mode transport frequencyBand'),ports:[true]};
  const route=fields('id adoptedSource edited pickup outputKind iemName iemMode iemTransport iemGroup frequencyBand sourceKey number instrument generatedInstrument mode signalType connector portIndex stereoGroup microphone phantom stagebox stageboxPort manual');
  const routingRow={...route,linkedSources:[route]};
  // This explicit schema is also embedded in the SQL migration and checked by tests.
  // Contacts, author, free notes, inventory references and unknown fields are absent.
  const schema={stage:{...fields('title projectId w d estimated surface complex stairs stairsOffset stairsAlong stairsWidth stairsDepth stairsSteps iem iemLength iemDepth iemX iemY'),
    project:fields('name unit'),extraStairs:[stair],
    routing:{version:true,disabledSources:[true],inputs:[routingRow],outputs:[routingRow],generatedAt:true},
    cables:[{...fields('id direction sourceKey sourceId targetId targetPort length bundleId'),route:[point]}],
    geometry:{...fields('version height clearance showModules name measured revision'),parts:[{...fields('id name kind shape x y w d angle height role locked rise target steps'),points:[[true]],anchor:fields('partId edge t')}]}
  },objects:[{...fields('id type x y angle label showLabel power wireless outs showOuts locked house drumPresetId comboJacks stand purpose boomDirection micHeadDirection micFrameVersion width depth height steps'),dimensions:size,labelOffset:point,
    foh:fields('table barrier sun rain'),iem:mix,iemMixes:[mix],playback:fields('version mode target'),
    io:{inputs:port,outputs:port,stereoPairs:[true],aliases:{inputs:[true],outputs:[true]},outputKeyStyle:true},
    drumInputs:[fields('id name microphone phantom')],
    drums:{extras:{version:true,nextId:true,parts:[part]},...fields('kickCount kickDiameter kickDepth pedal snare snareModel snareDiameter snareDepth snareMaterial side sideModel sideDiameter sideDepth riserPreset throne hihat hatSize ride rideSize splash china clapstack clapSize pad bongos table leftHanded showMics overheads overheadMount room'),
      rackToms:[fields('diameter depth mount')],floorToms:[fields('diameter depth')],crashes:[true],positions:map(drumIds,point),rotations:fields(drumIds),overheadPickup:fields(drumIds),mics:map(micIds,fields('enabled model phantom')),zOrder:[true]},
    percussion:{version:true,nextId:true,parts:[part]},
    orchestra:{...fields('version mode seating labels nextId'),groups:fields('violin1 violin2 violas cellos basses flutes oboes clarinets bassoons horns trumpets trombones tubas harps timpani percussion'),parts:[part]}
  }]};
  function clean(value,shape=schema,depth=0){
    if(depth>24)throw new Error('Der Plan ist zu stark verschachtelt.');
    if(shape===true)return value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)?value:typeof value==='string'?value.slice(0,240):null;
    if(Array.isArray(shape))return Array.isArray(value)?value.slice(0,4096).map(item=>clean(item,shape[0],depth+1)):[];
    const result={};if(value&&typeof value==='object'&&!Array.isArray(value))for(const key of Object.keys(shape))if(Object.hasOwn(value,key))result[key]=clean(value[key],shape[key],depth+1);return result;
  }
  function projectId(value){
    let id=String(value||'').trim();
    if(/^https?:\/\//i.test(id)){try{const url=new URL(id);if(!url.hash.startsWith('#p/'))return '';id=decodeURIComponent(url.hash.slice(3));}catch{return '';}}
    else if(id.startsWith('#p/')){try{id=decodeURIComponent(id.slice(3));}catch{return '';}}
    id=id.toUpperCase();return id.length<=80&&/^SP-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(id)?id:'';
  }
  const configured=config=>/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config?.url||'')&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(config?.publishableKey||'');
  function create({config,fetch:fetcher=globalThis.fetch,token=async()=>null,timeout=20000}){
    async function rpc(action,id,document){
      if(!configured(config))throw new Error('Teilen per Projekt-ID ist noch nicht eingerichtet.');
      const normalized=projectId(id);if(!normalized)throw new Error('Bitte eine gültige Projekt-ID eingeben (SP-…).');
      const headers={'Content-Type':'application/json',apikey:config.publishableKey},body={p_project_id:normalized};
      if(action!=='get'){const access=await token(action);if(!access&&action!=='status')throw new Error('Dieser Browser hat keine Berechtigung für die Freigabe.');if(access)headers.Authorization='Bearer '+access;}
      if(document){body.p_document=clean(document);if(body.p_document.stage?.projectId!==normalized||!Array.isArray(document.objects))throw new Error('Projekt und ID passen nicht zusammen.');}
      const payload=JSON.stringify(body);if(new TextEncoder().encode(payload).length>1900000)throw new Error('Der Plan ist für eine Online-Freigabe zu groß. Bitte als Datei teilen.');
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
      try{
        const response=await fetcher(config.url.replace(/\/$/,'')+'/rest/v1/rpc/stageplot_share_'+action,{method:'POST',headers,body:payload,signal:controller.signal,cache:'no-store',credentials:'omit'});
        const data=await response.json();
        if(!response.ok){
          const message=String(data?.message||'');
          if(message.includes('NOT_OWNER'))throw new Error('Diese ID ist bereits vergeben. Bitte das Projekt duplizieren und die Kopie teilen.');
          if(message.includes('SHARE_LIMIT'))throw new Error('Es sind bereits 100 Pläne freigegeben. Bitte zuerst eine Freigabe löschen.');
          if(response.status===401||message.includes('AUTH_REQUIRED'))throw new Error('Die Freigabe kann in diesem Browser nicht verwaltet werden. Bitte die Seite neu laden.');
          if(response.status===404||data?.code==='PGRST202')throw new Error('Teilen per Projekt-ID ist auf dem Server noch nicht eingerichtet.');
          throw new Error('Die Freigabe konnte nicht verarbeitet werden. Bitte erneut versuchen.');
        }
        if(action==='get'){
          if(!data)throw new Error('Dieser Plan ist nicht freigegeben oder wurde widerrufen.');
          if(data.project_id!==normalized||data.document?.stage?.projectId!==normalized)throw new Error('Die Freigabe enthält eine falsche Projekt-ID.');
          return {...data,document:clean(data.document)};
        }
        return data;
      }catch(error){if(error.name==='AbortError')throw new Error('Der Server antwortet nicht. Bitte erneut versuchen.');if(error instanceof TypeError)throw new Error('Keine Verbindung. Bitte Internetverbindung prüfen und erneut versuchen.');throw error;}
      finally{clearTimeout(timer);}
    }
    return {get:id=>rpc('get',id),status:id=>rpc('status',id),publish:document=>rpc('publish',document?.stage?.projectId,document),revoke:id=>rpc('revoke',id)};
  }
  return {schema,clean,projectId,configured,create};
});
