const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('stageplot-studio.html','utf8');
const start=html.indexOf('const drumMic=');
const end=html.indexOf('let drumMicPopupChannel=',start);
assert.ok(start>0&&end>start,'Der strukturierte Mikrofonkatalog fehlt.');
const context={};
vm.runInNewContext(html.slice(start,end)+'\nthis.catalog=drumMicCatalog;this.typical=drumTypicalMics;',context,{filename:'drum-microphone-catalog.js'});
const catalog=JSON.parse(JSON.stringify(context.catalog));
const typical=JSON.parse(JSON.stringify(context.typical));
const names=catalog.map(item=>item.name),byName=Object.fromEntries(catalog.map(item=>[item.name,item]));

assert.equal(catalog.length,90,'Der Mikrofonkatalog ist unvollständig.');
assert.equal(new Set(names).size,names.length,'Der Mikrofonkatalog enthält doppelte Modelle.');

const expected={
  kickIn:['Shure Beta 91A','Sennheiser e 901','Shure Beta 52A','AKG D112 MkII','Audix D6','Sennheiser e 602 II','Electro-Voice RE20','Electro-Voice RE320','beyerdynamic M 88','AKG D12 VR','Telefunken M82','Audio-Technica AE2500','LEWITT DTP 640 REX','DPA 4055','sE Electronics V KICK'],
  kickOut:['Neumann U 47 fet','AKG D12','AKG D112 MkII','Sennheiser e 902','Electro-Voice RE20','Sennheiser MD 421','Shure Beta 52A','beyerdynamic M 88','AKG C414','Neumann TLM 102','Shure KSM32','Audio-Technica AT4047/SV','Royer R-121','Yamaha SKRM-100 SubKick','Solomon LoFReQ'],
  snareTop:['Shure SM57','Shure Beta 57A','Audix i5','beyerdynamic M 201','Sennheiser MD 441-U','Sennheiser e 904','Telefunken M80-SH','AKG C451 B','Neumann KM 84','Shure Beta 98AMP/C','Earthworks DM20','Josephson e22S','DPA 4099 CORE','Audio-Technica ATM230','sE Electronics V BEAT'],
  snareBottom:['Shure SM57','AKG C451 B','Neumann KM 84','Sennheiser MD 441-U','Shure KSM137','Shure SM81','Shure Beta 181/S','Audix ADX51','Telefunken M81-SH','DPA 4011A','Sennheiser e 904','beyerdynamic M 201','Shure Beta 57A','Audix D2','Electro-Voice ND44'],
  rackTom:['Sennheiser MD 421','Sennheiser e 604','Sennheiser e 904','Audix D2','Shure SM57','Shure Beta 56A','Shure Beta 98AMP/C','Audio-Technica ATM230','AKG D40','Telefunken M81-SH','Electro-Voice ND44','sE Electronics V BEAT','LEWITT DTP 340 TT','Earthworks DM20','beyerdynamic M 201'],
  floorTom:['Audix D4','Sennheiser MD 421','Sennheiser e 904','Sennheiser e 604','Shure SM57','beyerdynamic M 88','Electro-Voice RE20','Shure Beta 56A','Audio-Technica ATM230','AKG D40','Telefunken M81-SH','sE Electronics V BEAT','LEWITT DTP 340 TT','Earthworks DM20','DPA 4099 CORE'],
  hihat:['AKG C451 B','Neumann KM 184','Neumann KM 84','Shure SM81','Shure KSM137','Shure KSM141','Audio-Technica AT4041','Audix SCX1HC','Audix ADX51','Sennheiser e 614','beyerdynamic MC 930','Telefunken M60 FET','Schoeps CMC 6 + MK 4','RØDE NT5','LEWITT LCT 140 AIR'],
  ride:['AKG C451 B','Neumann KM 184','Shure SM81','Shure KSM137','Shure KSM141','Audio-Technica AT4041','Audio-Technica AT4051b','Audix SCX1/SCX1HC','Sennheiser e 614','beyerdynamic MC 930','Telefunken M60 FET','Schoeps CMC 6 + MK 4','DPA 4011A','Earthworks SR25','Royer R-121'],
  overhead:['AKG C414 XLS/XLII','AKG C451 B','Neumann KM 184','Neumann KM 84','Shure SM81','Neumann U 87 Ai','Schoeps CMC 6 + MK 4','DPA 4011A','Shure KSM44A','Audio-Technica AT4041','RØDE NT5','Earthworks SR25mp','Coles 4038','beyerdynamic M 160','Royer SF-24'],
  room:['Neumann U 87 Ai','Neumann U 67','AKG C414 XLS/XLII','Audio-Technica AT4050','Shure KSM44A','Coles 4038','Royer R-121','AEA R84','AEA R88/R88A','beyerdynamic M 160','DPA 4006A','Earthworks QTC40','Schoeps CMC 6 + MK 2','Neumann TLM 102','Austrian Audio OC818']
};

for(const [group,list] of Object.entries(expected)){
  for(const name of list)assert.ok(byName[name],name+' fehlt im Mikrofonkatalog.');
  assert.deepEqual(typical[group].filter(name=>!name.startsWith('Generisches ')&&name!=='Grenzflächenmikrofon'&&!(group==='hihat'&&name==='Shure SM57')),list,group+' ist im Typisch-Filter falsch sortiert.');
}

assert.equal(byName['Shure Beta 91A'].type,'Grenz-K');
assert.equal(byName['Shure Beta 91A'].phantom,true,'Grenzflächen-Kondensatoren aktivieren 48 V nicht.');
assert.equal(byName['DPA 4055'].phantom,true,'Kondensatormikrofone aktivieren 48 V nicht.');
assert.equal(byName['Royer R-121'].phantom,false,'Passive Bändchenmikrofone aktivieren fälschlich 48 V.');
assert.equal(byName['Neumann U 67'].phantom,false,'Röhrenmikrofone werden fälschlich als 48-V-Mikrofon behandelt.');
assert.equal(byName['AKG D12'].legacy,true,'Das Vintage-Modell AKG D12 ist nicht gekennzeichnet.');
assert.equal(byName['Yamaha SKRM-100 SubKick'].supplement,true,'Der Yamaha SubKick ist nicht als Zusatzmikrofon gekennzeichnet.');
assert.equal(byName['Solomon LoFReQ'].supplement,true,'Der Solomon LoFReQ ist nicht als Zusatzmikrofon gekennzeichnet.');
assert.ok(catalog.every(item=>!item.asset||['sm57','m201','km184','m80','i5','421'].includes(item.asset)),'Für den erweiterten Katalog wurden unerwartet neue Bildassets vorausgesetzt.');

for(const marker of ['id="sp-drum-mic-search"','Mikrofon oder Bauart suchen','drumMicPopupQuery','sp-drum-mic-empty','data-drum-mic-type=','sp-drum-mic-option-copy','Vintage / Legacy','Zusatzmikrofon','drumMicByName(current.model).phantom===true'])assert.ok(html.includes(marker),marker+' fehlt in der App.');

console.log('PASS V71: vollständiger Drum-Mikrofonkatalog, positionsbezogene Typisch-Filter und sichere 48-V-Metadaten.');
