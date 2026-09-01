const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class MemoryStorage{
  constructor(){this.values=new Map();}
  getItem(key){return this.values.has(key)?this.values.get(key):null;}
  setItem(key,value){this.values.set(key,String(value));}
  removeItem(key){this.values.delete(key);}
}

const source=fs.readFileSync('stageplot-account-v1.js','utf8');
const context={globalThis:{}};vm.createContext(context);vm.runInContext(source,context);
const runtime=context.globalThis.StageplotAccountRuntime;
assert.equal(typeof runtime.create,'function');

const project={id:'setup-tour-1',name:'Tour 2026',savedAt:1234,document:{stage:{title:'Tour 2026'},objects:[]}};

(async()=>{
  {
    const storage=new MemoryStorage();
    const client={auth:{getUser:async()=>({data:{user:{id:'user-1'}}})},rpc:async()=>{throw Object.assign(new Error('offline'),{status:0});}};
    const account=runtime.create({client,storage});
    const result=await account.projects.save(project);
    assert.equal(result.queued,true);
    assert.equal(account.local.queue().length,1);
    await account.projects.save({...project,savedAt:2345,document:{stage:{title:'Neu'},objects:[]}});
    assert.equal(account.local.queue().length,1,'Mehrere lokale Änderungen desselben Dokuments werden zusammengefasst.');
  }

  {
    const storage=new MemoryStorage(),calls=[];
    const client={
      auth:{getUser:async()=>({data:{user:{id:'user-1'}}})},
      rpc:async(name,args)=>{
        calls.push({name,args});
        if(name==='stageplot_sync_push')return {data:{status:'saved',revision:1,change_seq:7}};
        return {data:{cursor:7,records:[{id:project.id,kind:'project',name:project.name,payload:project.document,revision:1,client_updated_at:project.savedAt,change_seq:7,deleted:false}]}};
      }
    };
    const account=runtime.create({client,storage});
    assert.equal((await account.projects.save(project)).queued,false);
    assert.equal(account.local.queue().length,0);
    assert.equal(account.local.meta().revisions['project:'+project.id],1);
    assert.deepEqual(JSON.parse(JSON.stringify(await account.projects.list())),[project]);
    assert.equal(calls[0].name,'stageplot_sync_push');
    assert.equal(calls[1].name,'stageplot_sync_pull');
  }

  {
    const storage=new MemoryStorage(),conflicts=[];
    const client={auth:{getUser:async()=>({data:{user:{id:'user-1'}}})},rpc:async()=>({data:{status:'conflict',revision:3,change_seq:9,record:{id:project.id}}})};
    const account=runtime.create({client,storage,onConflict:value=>conflicts.push(value)});
    assert.equal((await account.projects.save(project)).queued,true);
    assert.equal(account.local.queue()[0].conflict,true);
    assert.equal(conflicts.length,1);
  }

  {
    const storage=new MemoryStorage();
    const client={auth:{getUser:async()=>({data:{user:null}})},rpc:async()=>({data:null})};
    const account=runtime.create({client,storage});
    await assert.rejects(()=>account.projects.list(),/Bitte zuerst anmelden/);
    await assert.rejects(()=>account.drumTemplates.save({id:'wrong'}),/Ungültige/);
  }

  console.log('PASS ACCOUNT V1: lokaler Fallback, Write-ahead-Queue, Sync, Konfliktgrenze und Auth-Prüfung.');
})().catch(error=>{console.error(error);process.exitCode=1;});
