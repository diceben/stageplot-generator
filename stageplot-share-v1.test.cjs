const assert=require('node:assert/strict'),fs=require('node:fs');
const S=require('./stageplot-share-v1.js');
const drums=require('node:vm').runInNewContext(fs.readFileSync('stageplot-drums-v12.js','utf8')+';createStageplotDrumModel()');
const document={stage:{title:'Testplan',projectId:'SP-TEST-123',w:8,d:6,project:{name:'Testplan',author:'PRIVATE',contacts:{foh:{name:'PRIVATE',contact:'PRIVATE'}},notes:'PRIVATE'},geometry:{version:1,notes:'PRIVATE',parts:[{id:'floor',w:8,d:6,note:'PRIVATE'}]},routing:{version:2,inputs:[{id:'route-1',number:12,instrument:'Keys',phantom:true,notes:'PRIVATE',linkedSources:[{id:'route-2',notes:'PRIVATE'}]}]}},objects:[{id:'one',type:'drums',x:1,y:2,angle:90,labelOffset:{x:-1.25,y:0.45,secret:'PRIVATE'},note:'PRIVATE',inventoryId:'PRIVATE',secret:'PRIVATE',drums:JSON.parse(JSON.stringify(drums.normalizeDrums({})))},{id:'two',type:'orchestra',orchestra:require('./stageplot-orchestra-v1.js')().preset()}],secret:'PRIVATE'};
const before=JSON.stringify(document),clean=S.clean(document);
assert.equal(JSON.stringify(document),before);assert.ok(!JSON.stringify(clean).includes('PRIVATE'));
assert.deepEqual(clean.objects[0].labelOffset,{x:-1.25,y:0.45});
assert.deepEqual(clean.objects[0].drums,document.objects[0].drums);
assert.deepEqual(clean.objects[1].orchestra,document.objects[1].orchestra);
assert.equal(clean.stage.routing.inputs[0].number,12);assert.equal(clean.stage.routing.inputs[0].phantom,true);
const sql=fs.readFileSync('supabase/migrations/0007_instrument_details.sql','utf8'),schema=sql.match(/share-schema:start[^\n]*\n\s*'([^']+)'::jsonb/)[1];assert.deepEqual(JSON.parse(schema),S.schema,'Client and server must enforce the same allowlist.');
for(const value of ['sp-test-123','  SP-TEST-123  ','https://example.org/#p/SP-TEST-123','#p/SP-TEST-123'])assert.equal(S.projectId(value),'SP-TEST-123');
for(const value of ['SP-','hello','https://example.org/?id=SP-X','#p/%ZZ','SP-X\nY','SP-'+'X'.repeat(80)])assert.equal(S.projectId(value),'');
const config={url:'https://stageplot-qa.supabase.co',publishableKey:'sb_publishable_test'},requests=[];
assert.equal(S.configured(config),true);assert.equal(S.configured({...config,publishableKey:'sb_secret_private'}),false);
(async()=>{
 const client=S.create({config,token:async()=>'test-token',fetch:async(url,init)=>{requests.push({url,init});return {ok:true,json:async()=>url.endsWith('_get')?{project_id:'SP-TEST-123',document}: {active:true}};}});
 await client.publish(document);let request=requests.at(-1);assert.ok(!request.init.body.includes('PRIVATE'));assert.equal(request.init.headers.Authorization,'Bearer test-token');assert.equal(request.init.cache,'no-store');
 const received=await client.get('sp-test-123');assert.ok(!JSON.stringify(received).includes('PRIVATE'));assert.equal(requests.at(-1).init.headers.Authorization,undefined);
 await S.create({config,fetch:async(_url,init)=>{assert.equal(init.headers.Authorization,undefined);return {ok:true,json:async()=>({active:false,owned:false,available:true})};}}).status('SP-TEST-123');
 await client.revoke('SP-TEST-123');assert.equal(JSON.parse(requests.at(-1).init.body).p_project_id,'SP-TEST-123');
 await assert.rejects(S.create({config,fetch:()=>{throw Error('must not fetch');}}).publish(document),/Berechtigung/);
 await assert.rejects(S.create({config:{},fetch:()=>{throw Error('must not fetch');}}).get('SP-TEST-123'),/nicht eingerichtet/);
 for(const [response,pattern] of [[{ok:true,json:async()=>null},/widerrufen/],[{ok:false,status:404,json:async()=>({})},/nicht eingerichtet/],[{ok:false,status:400,json:async()=>({message:'NOT_OWNER'})},/vergeben/],[{ok:false,status:400,json:async()=>({message:'SHARE_LIMIT'})},/100/],[{ok:true,json:async()=>({project_id:'SP-WRONG',document})},/falsche/]]){
  await assert.rejects(S.create({config,fetch:async()=>response}).get('SP-TEST-123'),pattern);
 }
 const abort=S.create({config,timeout:5,fetch:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('timeout'),{name:'AbortError'}))))});
 await assert.rejects(abort.get('SP-TEST-123'),/antwortet nicht/);
 console.log('PASS SHARE: immutable client/server allowlist, complex instruments, ID parsing, authenticated writes, anonymous reads and errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
