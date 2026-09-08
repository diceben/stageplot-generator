const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const configDir=fs.mkdtempSync(path.join(os.tmpdir(),'stageplot-config-test-')),configScript=path.resolve('scripts/build-cloud-config.cjs');
try{
  const build=(url,key)=>spawnSync(process.execPath,[configScript],{cwd:configDir,env:{STAGEPLOT_SUPABASE_URL:url,STAGEPLOT_SUPABASE_PUBLISHABLE_KEY:key},encoding:'utf8'});
  assert.equal(build('','').status,0);assert.match(fs.readFileSync(path.join(configDir,'stageplot-cloud-config.js'),'utf8'),/"url":"","publishableKey":""/);
  assert.equal(build('https://test.supabase.co','sb_publishable_test').status,0);
  const good=fs.readFileSync(path.join(configDir,'stageplot-cloud-config.js'),'utf8');
  for(const [url,key] of [['https://test.supabase.co',''],['http://test.supabase.co','sb_publishable_test'],['https://test.supabase.co','sb_secret_test']])assert.notEqual(build(url,key).status,0);
  assert.equal(fs.readFileSync(path.join(configDir,'stageplot-cloud-config.js'),'utf8'),good,'Fehlerhafte Konfiguration überschreibt keinen Build.');
}finally{fs.rmSync(configDir,{recursive:true,force:true});}
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('stageplot-sync-v2.js','utf8'),ctx);const runtime=ctx.StageplotSync;
class Storage{constructor(){this.map=new Map();}getItem(k){return this.map.get(k)||null;}setItem(k,v){this.map.set(k,String(v));}}
const clone=x=>JSON.parse(JSON.stringify(x));
class Server{
  constructor(){this.records=new Map();this.seq=0;this.offline=false;this.user='user-a';this.delay=null;}
  client(){return {auth:{getUser:async()=>({data:{user:{id:this.user}}})},rpc:async(name,a)=>{if(this.offline)throw new Error('offline');if(this.delay)await this.delay;
    if(name==='stageplot_sync_pull'){const rows=[...this.records.values()].filter(r=>r.owner===this.user&&r.kind===a.p_kind&&r.change_seq>a.p_cursor).sort((a,b)=>a.change_seq-b.change_seq).slice(0,a.p_limit);return {data:{records:clone(rows),cursor:rows.at(-1)?.change_seq||a.p_cursor}};}
    const key=this.user+':'+a.p_kind+':'+a.p_id,old=this.records.get(key);
    if((old?.revision||0)!==a.p_base_revision)return {data:{status:'conflict',revision:old?.revision||0,record:clone(old||null)}};
    const row={owner:this.user,id:a.p_id,kind:a.p_kind,name:a.p_name,payload:clone(a.p_payload),client_updated_at:a.p_client_updated_at,revision:(old?.revision||0)+1,change_seq:++this.seq,deleted:a.p_deleted};this.records.set(key,row);return {data:{status:a.p_deleted?'deleted':'saved',revision:row.revision,change_seq:row.change_seq}};
  }};}
}
const project=(title='Probe',id='setup-probe')=>({id,name:title,savedAt:10,document:{stage:{title,projectId:'SP-'+id.slice(6).toUpperCase()},objects:[]}});
assert.equal(runtime.fingerprint({name:'Probe',document:{stage:{w:8,d:5},objects:[]}}),runtime.fingerprint({name:'Probe',document:{objects:[],stage:{d:5,w:8}}}),'JSONB-Schlüsselreihenfolge ist keine Projektänderung.');
assert.equal(runtime.fingerprint({name:'Probe',document:{stage:{routing:{generatedAt:10,inputs:[]}}}}),runtime.fingerprint({name:'Probe',document:{stage:{routing:{generatedAt:20,inputs:[]}}}}),'Ein neu gerenderter Routing-Zeitstempel erzeugt keinen Cloud-Konflikt.');
(async()=>{
  // Run the checked-in browser SDK against a fake fetch; no CDN or real account.
  const sdkContext={URL,URLSearchParams,Headers,Request,Response,TextEncoder,TextDecoder,AbortController,AbortSignal,setTimeout,clearTimeout,console,WebSocket:class{constructor(){throw new Error('Tests öffnen keine WebSocket-Verbindung.');}}};vm.createContext(sdkContext);vm.runInContext(fs.readFileSync('stageplot-assets/vendor/supabase.js','utf8'),sdkContext);let requestHeaders;
  const sdkClient=sdkContext.StageplotSupabase.createClient('https://test.supabase.co','sb_publishable_test',{accessToken:async()=>'test-owner-token',global:{fetch:async(_url,options)=>{requestHeaders=new Headers(options.headers);return new Response(JSON.stringify({records:[],cursor:0}),{headers:{'Content-Type':'application/json'}});}}});
  const sdkResult=await sdkClient.rpc('stageplot_sync_pull',{p_kind:'inventory'});assert.equal(sdkResult.error,null);assert.equal(sdkResult.data.cursor,0);assert.equal(requestHeaders.get('Authorization'),'Bearer test-owner-token');
  const server=new Server(),deviceA=new Storage(),deviceB=new Storage(),a=runtime.create({client:server.client(),storage:deviceA,ownerId:'user-a'}),b=runtime.create({client:server.client(),storage:deviceB,ownerId:'user-a'});
  server.offline=true;await a.projects.save(project());await assert.rejects(()=>a.flush(),/offline/);assert.equal(a.local.state().pending.length,1);
  assert.equal(a.local.confirmed('project',project()),false,'Ein vorgemerkter Upload ist keine Sync-Bestätigung.');
  server.offline=false;const reloaded=runtime.create({client:server.client(),storage:deviceA,ownerId:'user-a'});await reloaded.flush();assert.equal((await b.projects.list())[0].name,'Probe');
  assert.equal(reloaded.local.confirmed('project',project()),true);assert.equal(b.local.confirmed('project',project()),true);
  assert.equal(b.local.confirmed('project',project('Noch ungespeicherte Änderung')),false);
  assert.equal((await b.projects.list())[0].document.stage.projectId,'SP-PROBE','Geräte erhalten dieselbe sichtbare ID.');
  await a.projects.save(project('Zuhause'));await a.flush();await b.projects.save(project('Tablet'));const result=await b.flush();assert.equal(result.copies,1);
  const both=await b.projects.list();assert.equal(both.length,2);assert(both.some(p=>p.name==='Zuhause'));assert(both.some(p=>p.name==='Tablet · Konfliktkopie'));assert.equal(server.records.get('user-a:project:setup-probe').payload.stage.title,'Zuhause');
  assert.equal(both.find(p=>p.name==='Zuhause').document.stage.projectId,'SP-PROBE');assert.notEqual(both.find(p=>p.name==='Tablet · Konfliktkopie').document.stage.projectId,'SP-PROBE');
  // A disconnection after detecting a conflict must never make the stale original
  // overwrite the remote original on the next scan/reload.
  const failingStorage=new Storage();let failAfterConflict=false;
  const failing=runtime.create({client:server.client(),storage:failingStorage,ownerId:'user-a',onConflict:()=>{if(failAfterConflict)server.offline=true;}});
  await failing.projects.list();await a.projects.list();await a.projects.save(project('Remote neuer'));await a.flush();
  failAfterConflict=true;const localConflict=project('Tablet offline');await failing.projects.save(localConflict);await assert.rejects(()=>failing.flush(),/offline/);
  server.offline=false;const retry=runtime.create({client:server.client(),storage:failingStorage,ownerId:'user-a'});
  assert(retry.local.matches('project',localConflict));await retry.projects.save(localConflict);await retry.flush();
  assert.equal(retry.local.confirmed('project',localConflict),false,'Eine verworfene Konfliktbasis ist trotz Queue-Deduplizierung nicht synchronisiert.');
  assert.equal(server.records.get('user-a:project:setup-probe').payload.stage.title,'Remote neuer');
  await retry.projects.save(project('Noch eine Eingabe'));assert.equal((await retry.flush()).copies,1,'Eine Änderung vor dem Anwenden der Cloud-Fassung bleibt ein Konflikt.');
  // Conflict names remain valid for the narrower stage-template library.
  const template={id:'stage-template-long',name:'Sehr lange Bühnenvorlage für die Tournee',savedAt:1,document:{stage:{w:8,d:5}}};
  await a.stageTemplates.save(template);await a.flush();await b.stageTemplates.list();await a.stageTemplates.save({...template,document:{stage:{w:10,d:5}}});await a.flush();await b.stageTemplates.save({...template,document:{stage:{w:12,d:5}}});await b.flush();assert((await b.stageTemplates.list()).every(row=>row.name.length<=40));
  await b.projects.list();
  await b.projects.remove('setup-probe');await b.flush();assert((await a.pull('project')).some(r=>r.id==='setup-probe'&&r.deleted));
  // A pull the UI can't apply must not advance the local editing baseline.
  const c=runtime.create({client:server.client(),storage:new Storage(),ownerId:'user-a'});await c.projects.save(project('Vorher','setup-edit'));await c.flush();await b.projects.list();await b.projects.save(project('Remote','setup-edit'));await b.flush();
  const unseen=(await c.pull('project',{acknowledge:false})).find(p=>p.id==='setup-edit');assert.equal(c.local.state().revisions['project:setup-edit'],1);await c.projects.save(project('Lokale Eingabe','setup-edit'));const conflict=await c.flush();assert.equal(conflict.copies,1);assert.equal(await c.accept('project',unseen),true);
  // Different users and projects on the same browser never share a queue.
  const other=runtime.create({client:server.client(),storage:deviceA,ownerId:'user-b'});assert.equal(other.local.state().pending.length,0);await other.projects.save(project('Privat'));await assert.rejects(()=>other.flush(),/verbundenen Account/);assert.equal(other.local.state().pending.length,1);
  const isolated=runtime.create({client:server.client(),storage:deviceA,ownerId:'user-a',scope:'other-project'});assert.equal(Object.keys(isolated.local.state().revisions).length,0);
  assert.equal(isolated.local.confirmed('project',project()),false);
  // Pending edits aren't overwritten by pull acknowledgement.
  await a.inventory.save({id:'inventory-mic',name:'Mic',savedAt:1,document:{name:'Mic',quantity:2}});await a.flush();await b.inventory.list();await b.inventory.save({id:'inventory-mic',name:'Mic',savedAt:2,document:{name:'Mic',quantity:3}});assert.equal((await b.pull('inventory')).length,0);await b.flush();assert.equal((await a.inventory.list())[0].document.quantity,3);
  // List all pages, including tombstones; no 1000-record cutoff.
  for(let i=0;i<205;i++){const entry=project('P '+i,'setup-page-'+i);await a.projects.save(entry);}await a.flush();const pages=await b.projects.list();assert(pages.length>=205);
  // A save during an in-flight push survives and is sent as the next revision.
  let release;server.delay=new Promise(resolve=>release=resolve);await a.projects.save(project('Erster Stand','setup-race'));const flushing=a.flush();await new Promise(resolve=>setImmediate(resolve));const newer=a.projects.save(project('Neuer Stand','setup-race'));release();server.delay=null;await flushing;await newer;await a.flush();assert.equal(server.records.get('user-a:project:setup-race').payload.stage.title,'Neuer Stand');
  // Exercise the app's real binding adapter: signed-out deletions stay queued;
  // an in-flight request keeps owner A's token when the session changes to B.
  const html=fs.readFileSync('stageplot-studio.html','utf8'),extract=name=>html.match(new RegExp('  function '+name+'\\([^]*?\\n  }'))[0],authTokens=[],rpcTokens=[],binding={url:'https://test.supabase.co',ownerId:'user-a'};
  const ui={window:{StageplotSync:runtime,StageplotSupabase:{createClient:(_url,_key,options)=>({rpc:async()=>{rpcTokens.push(await options.accessToken());return {data:{status:'saved',revision:1}};}})}},accountConfig:{url:binding.url,publishableKey:'sb_publishable_test'},accountSession:null,accountClient:{auth:{getUser:async token=>{authTokens.push(token);return {data:{user:{id:'user-a'}}};}}},linkedAccount:()=>binding,cloudRepos:{project:'projects'},scheduleAccountSync(){},writeCloudRecord(){},accountMessage(){}};
  // Inject isolated storage into the real runtime instead of browser storage.
  const uiStorage=new Storage();ui.window.StageplotSync={create:options=>runtime.create({...options,storage:uiStorage})};vm.createContext(ui);vm.runInContext(extract('configureAccountBridge'),ui);ui.configureAccountBridge();
  await ui.window.StageplotAccount.projects.remove('setup-removed-while-logged-out');assert.equal(ui.cloudBridge.local.state().pending[0].deleted,true);
  ui.accountSession={user:{id:'user-a'},access_token:'token-a'};ui.configureAccountBridge();const ownerABridge=ui.cloudBridge;ui.accountSession={user:{id:'user-b'},access_token:'token-b'};ui.configureAccountBridge();await ownerABridge.flush();assert.deepEqual(authTokens,['token-a']);assert.deepEqual(rpcTokens,['token-a']);
  console.log('PASS SYNC V2: zwei Geräte, Offline-Wiederanlauf, Konfliktkopien, Löschungen, Account-Trennung, Pagination und Änderungen während laufender Übertragung.');
})().catch(error=>{console.error(error);process.exitCode=1;});
