const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const checks=['check-project-dashboard.cjs','check-mobile-library.cjs','check-mobile-routing.cjs','check-project-actions.cjs','check-venue-editor.cjs','check-mic-head-direction.cjs'];
function run(file,env){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(__dirname,file)],{cwd:root,env,stdio:'inherit'});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(file+' failed ('+code+')')));
  });
}
(async()=>{
  const env={...process.env},port=process.env.QA_PORT||'8898';let server,serverError;
  try{
    if(!env.APP_URL){
      env.APP_URL='http://127.0.0.1:'+port+'/';
      try{await fetch(env.APP_URL);throw new Error('QA port '+port+' is already in use. Set APP_URL explicitly to test an existing preview.');}
      catch(error){if(error.message.includes('already in use'))throw error;}
      server=spawn('python3',['stageplot-preview.py','--port',port],{cwd:root,stdio:['ignore','ignore','inherit']});
      server.on('error',error=>serverError=error);
      server.on('exit',code=>serverError=new Error('Preview stopped ('+code+')'));
      const deadline=Date.now()+10000;
      while(true){
        if(serverError)throw serverError;
        try{const response=await fetch(env.APP_URL);if(response.ok)break;}catch{}
        if(Date.now()>deadline)throw new Error('Preview did not start.');
        await new Promise(resolve=>setTimeout(resolve,100));
      }
    }
    for(const file of checks)await run(file,env);
    console.log('PASS: '+checks.length+' browser flows ('+(env.BROWSER||'chromium')+').');
  }finally{if(server)server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
