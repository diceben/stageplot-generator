const {spawnSync}=require('node:child_process');

// Zuerst sicherstellen, dass die eingebetteten Modulkopien in der HTML mit den
// Quelldateien synchron sind (build-inline). So bleibt die HTML das generierte
// Artefakt und die .js-Datei die einzige Quelle.
const sync=spawnSync(process.execPath,['scripts/build-inline.cjs','--check'],{stdio:'inherit'});
if(sync.status!==0)process.exit(sync.status||1);

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
