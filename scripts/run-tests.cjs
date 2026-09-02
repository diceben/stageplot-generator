const {spawnSync}=require('node:child_process');

// Zuerst sicherstellen, dass die eingebetteten Modulkopien in der HTML mit den
// Quelldateien synchron sind (build-inline). So bleibt die HTML das generierte
// Artefakt und die .js-Datei die einzige Quelle.
const sync=spawnSync(process.execPath,['scripts/build-inline.cjs','--check'],{stdio:'inherit'});
if(sync.status!==0)process.exit(sync.status||1);

const tests=[
  'stageplot-account-v1.test.cjs',
  'stageplot-studio-v60.test.cjs',
  'stageplot-studio-v61.test.cjs',
  'stageplot-studio-v67.test.cjs',
  'stageplot-studio-v68.test.cjs',
  'stageplot-studio-v69.test.cjs',
  'stageplot-studio-v70.test.cjs',
  'stageplot-studio-v71.test.cjs',
  'stageplot-studio-v72.test.cjs',
  'stageplot-studio-v73.test.cjs',
  'stageplot-studio-v74.test.cjs',
  'stageplot-studio-v75.test.cjs',
  'stageplot-studio-v76.test.cjs',
  'stageplot-studio-v77.test.cjs',
  'stageplot-studio-v78.test.cjs',
  'stageplot-studio-v79.test.cjs',
  'stageplot-studio-v80.test.cjs',
  'stageplot-studio-v81.test.cjs'
];

for(const file of tests){
  const result=spawnSync(process.execPath,[file],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}

console.log(`PASS: ${tests.length} aktuelle Stageplot-Testgruppen.`);
