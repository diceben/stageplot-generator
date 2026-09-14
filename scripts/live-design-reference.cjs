// Synthetic visual fixture reconstructed from the approved stageplot screenshot.
// Emits a portable test document to stdout; never reads local drafts or contact data.
const fs=require('node:fs');
const vm=require('node:vm');
const context={};vm.runInNewContext(fs.readFileSync(require.resolve('../stageplot-drums-v12.js'),'utf8'),context);
const drums=context.createStageplotDrumModel().drumDefaults();
drums.mics['kick1-out'].enabled=false;
drums.table='mixer';drums.positions.table={x:.70,y:.15};
const object=(id,type,x,y,angle,label,outs='',extra={})=>({id,type,x,y,angle,label,outs,note:'',...extra});
const objects=[
  object('riser-drums','riser',4,1.25,0,'Riser','',{width:2,depth:2,height:40}),
  object('riser-keys','riser',6.5,1.65,45,'Riser','',{width:2,depth:2,height:40}),
  object('cajon','cajon',1.25,.94,0,'Cajon','2 Outs · XLR'),
  object('wave','keys-wave2',1,1.87,90,'Wave 2','2 Outs · Klinke'),
  object('tree','guitar-tree-empty',1.85,2.15,25,'Gitarrenbaum · leer'),
  object('drums','drums',4,1.3,0,'Drums','',{drums}),
  object('laptop','laptop',6.12,1.1,5,'Playback-Laptop','16 Outs · Dante'),
  object('nord','keys-stage4',6.69,1.85,45,'Nord Stage 4','4 Outs · XLR'),
  object('guitar','guitar',2.2,3.18,45,'Gitarre','2 Outs · XLR'),
  object('bass','bass',5.25,3.07,65,'Bass','2 Outs · XLR'),
  object('vocals','mic',3.75,4.14,0,'Vocals','1 Out · XLR',{stand:'round',purpose:'vocals'}),
  object('wedge','wedge',4.5,4.26,-20,'Wedge'),
  object('stagebox','stagebox-16',1.75,1.25,0,'','',{showLabel:false}),
  object('power','text',3.10,1.04,0,'Strom')
];
const stage={title:'Live-Referenz',w:8,d:5,surface:'black',complex:false,estimated:false,stairs:'left',stairsAlong:.48,stairsWidth:1.2,stairsDepth:1.2,extraStairs:[{id:'stair-right',stairs:'side-right',stairsAlong:.68,stairsWidth:1.2,stairsDepth:1.2}],iem:'none',iemLength:2,iemDepth:.8,iemX:0,iemY:0,routing:{inputs:[{id:'route-inputs-1',sourceKey:'laptop:configured-out-1',instrument:'Playback-Laptop',connector:'Dante',number:1,stagebox:'stagebox',stageboxPort:1}],outputs:[]},cables:[{id:'cable-inputs-1',direction:'inputs',sourceKey:'laptop:configured-out-1',sourceId:'laptop',targetId:'stagebox',targetPort:1,length:10,route:[{x:6.12,y:1.1},{x:5.55,y:.72},{x:3,y:1.25},{x:1.75,y:1.25}],bundleId:'bundle-playback'}]};
process.stdout.write(JSON.stringify({kind:'stageplot-setup',version:1,name:stage.title,exportedAt:1788883200000,document:{stage,objects}},null,2)+'\n');
