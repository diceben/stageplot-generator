const fs=require('node:fs');
const url=process.env.STAGEPLOT_SUPABASE_URL||'',publishableKey=process.env.STAGEPLOT_SUPABASE_PUBLISHABLE_KEY||'';
if(Boolean(url)!==Boolean(publishableKey))throw new Error('Supabase-URL und Publishable-Key gemeinsam konfigurieren.');
if(url){if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))throw new Error('Eine HTTPS-Supabase-Projekt-URL angeben.');if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))throw new Error('Nur einen öffentlichen sb_publishable_ Key verwenden.');}
fs.writeFileSync('stageplot-cloud-config.js','// Generated public configuration. No server secrets.\nwindow.StageplotCloudConfig='+JSON.stringify({url,publishableKey,accountsEnabled:process.env.STAGEPLOT_ACCOUNTS_ENABLED==='true'}).replace(/</g,'\\u003c')+';\n');
console.log(url?'Öffentliche Online-Konfiguration erstellt.':'Online-Dienste bleiben deaktiviert.');
