// Parse all runtime modules and inline scripts without executing application code.
const fs=require('node:fs'),vm=require('node:vm');
const files=fs.readdirSync('.').filter(name=>/^stageplot-.*\.js$/.test(name));
for(const filename of files)new vm.Script(fs.readFileSync(filename,'utf8'),{filename});
const html=fs.readFileSync('stageplot-studio.html','utf8');
let count=0;
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
  if(!match[1].trim())continue;
  new vm.Script(match[1],{filename:'stageplot-studio.html:inline-'+(++count)});
}
console.log('PASS syntax: '+files.length+' runtime modules and '+count+' inline scripts.');
