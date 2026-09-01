const {spawnSync}=require('node:child_process');

const tests=[
  'stageplot-account-v1.test.cjs',
  'stageplot-studio-v60.test.cjs',
  'stageplot-studio-v61.test.cjs'
];

for(const file of tests){
  const result=spawnSync(process.execPath,[file],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}

console.log(`PASS: ${tests.length} aktuelle Stageplot-Testgruppen.`);
