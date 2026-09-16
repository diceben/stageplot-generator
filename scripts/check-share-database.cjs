// Real PostgreSQL (PGlite), isolated in memory. No account or production data.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const S=require('../stageplot-share-v1.js');
(async()=>{
 const db=new PGlite();
 try{
  await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('request.jwt.claim.is_anonymous',true),''),'true')::boolean) $$; grant usage on schema auth to anon,authenticated; grant usage on schema public to anon,authenticated;");
  const first='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
  await db.query('insert into auth.users values ($1),($2)',[first,other]);
  for(const file of ['0001_stageplot_documents.sql','0002_inventory.sql','0003_project_shares.sql','0004_reusable_share_ids.sql','0005_share_only_guest_access.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
  // Sharing migration may safely be applied again.
  await db.exec(fs.readFileSync('supabase/migrations/0004_reusable_share_ids.sql','utf8'));
  const role=async(name,user='',anonymous=true)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.query("select set_config('request.jwt.claim.is_anonymous',$1,false)",[String(anonymous)]);await db.exec('set role '+name);};
  const call=async(action,id,document)=>{const args=document===undefined?[id]:[id,JSON.stringify(document)];return (await db.query('select public.stageplot_share_'+action+'($1'+(args.length===2?',$2::jsonb':'')+') as value',args)).rows[0].value;};
  const doc=id=>({stage:{projectId:id,title:'Test',w:8,d:6,project:{contacts:{foh:{contact:'PRIVATE'}},author:'PRIVATE'},routing:{inputs:[{number:1,instrument:'Mic',notes:'PRIVATE'}]}},objects:[{id:'one',type:'mic',note:'PRIVATE',io:{outputs:{count:1,connector:'XLR'}}}],secret:'PRIVATE'});
  // Guest identities share plans only; future permanent accounts retain owner-only sync.
  await role('authenticated',first,false);
  await db.query("select public.stageplot_sync_push('project','setup-private',0,'Private',0,'{}',false)");
  assert.equal((await db.query('select id from public.stageplot_documents')).rows.length,1);
  await role('authenticated',other,false);
  assert.equal((await db.query('select id from public.stageplot_documents')).rows.length,0);
  await role('authenticated',first,true);
  assert.equal((await db.query('select id from public.stageplot_documents')).rows.length,0);
  assert.equal((await db.query('select public.stageplot_sync_pull() as value')).rows[0].value.records.length,0);
  await assert.rejects(db.query("select public.stageplot_sync_push('project','setup-guest',0,'Guest',0,'{}',false)"),/row-level security/);
  await assert.rejects(db.query("insert into public.stageplot_documents(owner_id,kind,id,name,payload) values($1,'project','setup-direct','Guest','{}')",[first]),/row-level security/);
  await role('anon');assert.equal(await call('get','SP-ONE'),null);assert.deepEqual(await call('status','SP-ONE'),{active:false,owned:false,available:true,updated_at:null});
  for(const action of ['publish','revoke'])await assert.rejects(call(action,'SP-ONE',action==='publish'?doc('SP-ONE'):undefined),/permission denied/);
  await assert.rejects(db.query('select * from public.stageplot_project_shares'),/permission denied/);
  await assert.rejects(db.query("select public.stageplot_share_document('{}')"),/permission denied/);
  await role('authenticated',first);
  assert.equal((await call('publish','SP-ONE',doc('SP-ONE'))).active,true);
  assert.deepEqual((await call('get','SP-ONE')).document,S.clean(doc('SP-ONE')));
  assert.ok(!JSON.stringify(await call('get','SP-ONE')).includes('PRIVATE'));
  await assert.rejects(call('publish','SP-ONE',doc('SP-OTHER')),/INVALID_DOCUMENT/);
  await assert.rejects(call('publish','SP-ONE',{stage:{projectId:'SP-ONE'}}),/INVALID_DOCUMENT/);
  await assert.rejects(call('publish','bad-id',doc('bad-id')),/INVALID_ID/);
  const oversized=doc('SP-ONE');oversized.stage.title='X'.repeat(2000001);
  await assert.rejects(call('publish','SP-ONE',oversized),/INVALID_DOCUMENT/);
  await role('authenticated',other);
  assert.equal((await call('status','SP-ONE')).owned,false);
  for(const action of ['publish','revoke'])await assert.rejects(call(action,'SP-ONE',action==='publish'?doc('SP-ONE'):undefined),/NOT_OWNER/);
  await assert.rejects(db.query("update public.stageplot_project_shares set owner_id=$1",[other]),/permission denied/);
  await role('anon');assert.equal((await call('get','SP-ONE')).document.stage.title,'Test');
  await role('authenticated',first);await call('revoke','SP-ONE');assert.equal(await call('get','SP-ONE'),null);assert.equal((await call('status','SP-ONE')).active,false);
  await role('authenticated',other);await call('publish','SP-ONE',doc('SP-ONE'));
  await role('authenticated',first);
  await assert.rejects(call('revoke','SP-ONE'),/NOT_OWNER/);await assert.rejects(call('publish','SP-ONE',doc('SP-ONE')),/NOT_OWNER/);
  await role('authenticated',other);await call('revoke','SP-ONE');
  await role('authenticated',first);await call('publish','SP-ONE',doc('SP-ONE'));
  for(let i=2;i<=100;i++)await call('publish','SP-'+i,doc('SP-'+i));
  await assert.rejects(call('publish','SP-101',doc('SP-101')),/SHARE_LIMIT/);
  await call('publish','SP-ONE',doc('SP-ONE'));await call('revoke','SP-ONE');await call('publish','SP-101',doc('SP-101'));
  await role('authenticated');await assert.rejects(call('publish','SP-102',doc('SP-102')),/AUTH_REQUIRED/);
  await role('anon');assert.equal(await call('get',"SP-' OR 1=1"),null);
  await db.exec('reset role');const row=(await db.query("select document,revoked_at from public.stageplot_project_shares where project_id='SP-ONE'")).rows[0];assert.equal(row,undefined,'Deleting the link releases the ID instead of reserving a tombstone.');
  await assert.rejects(db.query("insert into public.stageplot_project_shares(project_id,owner_id,document) values('SP-101',$1,'{}')",[other]),/duplicate key/);
  console.log('PASS PostgreSQL: migrations, role grants, no listing, owner isolation, guest exclusion from private sync, recursive sanitization, deletion, unique active IDs, safe reuse by a new owner and quota.');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
