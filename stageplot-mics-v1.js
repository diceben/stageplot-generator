/* Shared microphone identities, manufacturer originals and offline preferences. */
const StageplotMics=(()=>{
  'use strict';
  const drumMic=(name,short,type,options={})=>({name,short,type,phantom:options.phantom??(!type.startsWith('Röhren-')&&/(?:SDC|LDC|Kond\.|Grenz-K|Mini-K|Dual)/.test(type)),legacy:options.legacy===true,supplement:options.supplement===true,asset:options.asset||''});
  const drumMicCatalog=[
    drumMic('Generisches Drum-Mikrofon','Drum Mic','Dyn'),drumMic('Grenzflächenmikrofon','Boundary','Grenz-K'),drumMic('Generisches Kick-Mikrofon','Kick Mic','Dyn'),drumMic('Generisches Kleinmembran-Mikrofon','Kleinmembran','SDC'),drumMic('Generisches Kondensatormikrofon','Kondensator','Kond.'),
    drumMic('Shure Beta 91A','Beta 91A','Grenz-K'),drumMic('Sennheiser e 901','e 901','Grenz-K'),drumMic('Shure Beta 52A','Beta 52A','Dyn'),drumMic('AKG D112 MkII','D112 MkII','Dyn'),drumMic('Audix D6','D6','Dyn'),drumMic('Sennheiser e 602 II','e 602 II','Dyn'),drumMic('Electro-Voice RE20','RE20','Dyn'),drumMic('Electro-Voice RE320','RE320','Dyn'),drumMic('beyerdynamic M 88','M 88','Dyn'),drumMic('AKG D12 VR','D12 VR','Dyn'),drumMic('Telefunken M82','M82','Dyn'),drumMic('Audio-Technica AE2500','AE2500','Dual'),drumMic('LEWITT DTP 640 REX','DTP 640 REX','Dual'),drumMic('DPA 4055','DPA 4055','Kond.'),drumMic('sE Electronics V KICK','V KICK','Dyn'),
    drumMic('Neumann U 47 fet','U 47 fet','LDC'),drumMic('AKG D12','D12','Dyn',{legacy:true}),drumMic('Sennheiser e 902','e 902','Dyn'),drumMic('Sennheiser MD 421','MD 421','Dyn',{asset:'421'}),drumMic('AKG C414','C414','LDC'),drumMic('Neumann TLM 102','TLM 102','LDC'),drumMic('Shure KSM32','KSM32','LDC'),drumMic('Audio-Technica AT4047/SV','AT4047/SV','LDC'),drumMic('Royer R-121','R-121','Bänd.'),drumMic('Yamaha SKRM-100 SubKick','SKRM-100','Sub',{legacy:true,supplement:true}),drumMic('Solomon LoFReQ','LoFReQ','Sub',{supplement:true}),
    drumMic('Shure SM57','SM57','Dyn',{asset:'sm57'}),drumMic('Shure Beta 57A','Beta 57A','Dyn'),drumMic('Audix i5','i5','Dyn',{asset:'i5'}),drumMic('beyerdynamic M 201','M 201','Dyn',{asset:'m201'}),drumMic('Sennheiser MD 441-U','MD 441-U','Dyn'),drumMic('Sennheiser e 904','e 904','Dyn'),drumMic('Telefunken M80-SH','M80-SH','Dyn',{asset:'m80'}),drumMic('AKG C451 B','C451 B','SDC'),drumMic('Neumann KM 84','KM 84','SDC',{legacy:true}),drumMic('Shure Beta 98AMP/C','Beta 98AMP/C','Mini-K'),drumMic('Earthworks DM20','DM20','SDC'),drumMic('Josephson e22S','e22S','Kond.'),drumMic('DPA 4099 CORE','DPA 4099','Mini-K'),drumMic('Audio-Technica ATM230','ATM230','Dyn'),drumMic('sE Electronics V BEAT','V BEAT','Dyn'),
    drumMic('Shure KSM137','KSM137','SDC'),drumMic('Shure SM81','SM81','SDC'),drumMic('Shure Beta 181/S','Beta 181/S','SDC'),drumMic('Audix ADX51','ADX51','SDC'),drumMic('Telefunken M81-SH','M81-SH','Dyn'),drumMic('DPA 4011A','DPA 4011A','SDC'),drumMic('Audix D2','D2','Dyn'),drumMic('Electro-Voice ND44','ND44','Dyn'),
    drumMic('Sennheiser e 604','e 604','Dyn'),drumMic('Shure Beta 56A','Beta 56A','Dyn'),drumMic('AKG D40','D40','Dyn'),drumMic('LEWITT DTP 340 TT','DTP 340 TT','Dyn'),drumMic('Audix D4','D4','Dyn'),
    drumMic('Neumann KM 184','KM 184','SDC',{asset:'km184'}),drumMic('Shure KSM141','KSM141','SDC'),drumMic('Audio-Technica AT4041','AT4041','SDC'),drumMic('Audix SCX1HC','SCX1HC','SDC'),drumMic('Sennheiser e 614','e 614','SDC'),drumMic('beyerdynamic MC 930','MC 930','SDC'),drumMic('Telefunken M60 FET','M60 FET','SDC'),drumMic('Schoeps CMC 6 + MK 4','CMC 6 + MK 4','SDC'),drumMic('RØDE NT5','NT5','SDC'),drumMic('LEWITT LCT 140 AIR','LCT 140 AIR','SDC'),drumMic('Audio-Technica AT4051b','AT4051b','SDC'),drumMic('Audix SCX1/SCX1HC','SCX1/SCX1HC','SDC'),drumMic('Earthworks SR25','SR25','SDC'),
    drumMic('AKG C414 XLS/XLII','C414 XLS/XLII','LDC'),drumMic('Neumann U 87 Ai','U 87 Ai','LDC'),drumMic('Shure KSM44A','KSM44A','LDC'),drumMic('Earthworks SR25mp','SR25mp','SDC'),drumMic('Coles 4038','Coles 4038','Bänd.'),drumMic('beyerdynamic M 160','M 160','Bänd.'),drumMic('Royer SF-24','SF-24','Stereo-Bänd.',{phantom:true}),
    drumMic('Neumann U 67','U 67','Röhren-LDC'),drumMic('Audio-Technica AT4050','AT4050','LDC'),drumMic('AEA R84','R84','Bänd.'),drumMic('AEA R88/R88A','R88/R88A','Stereo-Bänd.'),drumMic('DPA 4006A','DPA 4006A','Omni-SDC'),drumMic('Earthworks QTC40','QTC40','Omni-Kond.'),drumMic('Schoeps CMC 6 + MK 2','CMC 6 + MK 2','Omni-SDC'),drumMic('Austrian Audio OC818','OC818','LDC'),
    drumMic('Beyerdynamic M201TG','M201TG','Dyn',{asset:'m201'}),drumMic('Telefunken M80','M80','Dyn',{asset:'m80'}),drumMic('Sennheiser 421','421','Dyn',{asset:'421'})
  ];
  const drumTypicalMics={
    kickIn:['Grenzflächenmikrofon','Shure Beta 91A','Sennheiser e 901','Shure Beta 52A','AKG D112 MkII','Audix D6','Sennheiser e 602 II','Electro-Voice RE20','Electro-Voice RE320','beyerdynamic M 88','AKG D12 VR','Telefunken M82','Audio-Technica AE2500','LEWITT DTP 640 REX','DPA 4055','sE Electronics V KICK'],
    kickOut:['Generisches Kick-Mikrofon','Neumann U 47 fet','AKG D12','AKG D112 MkII','Sennheiser e 902','Electro-Voice RE20','Sennheiser MD 421','Shure Beta 52A','beyerdynamic M 88','AKG C414','Neumann TLM 102','Shure KSM32','Audio-Technica AT4047/SV','Royer R-121','Yamaha SKRM-100 SubKick','Solomon LoFReQ'],
    snareTop:['Generisches Drum-Mikrofon','Shure SM57','Shure Beta 57A','Audix i5','beyerdynamic M 201','Sennheiser MD 441-U','Sennheiser e 904','Telefunken M80-SH','AKG C451 B','Neumann KM 84','Shure Beta 98AMP/C','Earthworks DM20','Josephson e22S','DPA 4099 CORE','Audio-Technica ATM230','sE Electronics V BEAT'],
    snareBottom:['Generisches Drum-Mikrofon','Shure SM57','AKG C451 B','Neumann KM 84','Sennheiser MD 441-U','Shure KSM137','Shure SM81','Shure Beta 181/S','Audix ADX51','Telefunken M81-SH','DPA 4011A','Sennheiser e 904','beyerdynamic M 201','Shure Beta 57A','Audix D2','Electro-Voice ND44'],
    rackTom:['Generisches Drum-Mikrofon','Sennheiser MD 421','Sennheiser e 604','Sennheiser e 904','Audix D2','Shure SM57','Shure Beta 56A','Shure Beta 98AMP/C','Audio-Technica ATM230','AKG D40','Telefunken M81-SH','Electro-Voice ND44','sE Electronics V BEAT','LEWITT DTP 340 TT','Earthworks DM20','beyerdynamic M 201'],
    floorTom:['Generisches Drum-Mikrofon','Audix D4','Sennheiser MD 421','Sennheiser e 904','Sennheiser e 604','Shure SM57','beyerdynamic M 88','Electro-Voice RE20','Shure Beta 56A','Audio-Technica ATM230','AKG D40','Telefunken M81-SH','sE Electronics V BEAT','LEWITT DTP 340 TT','Earthworks DM20','DPA 4099 CORE'],
    hihat:['Shure SM57','AKG C451 B','Neumann KM 184','Neumann KM 84','Shure SM81','Shure KSM137','Shure KSM141','Audio-Technica AT4041','Audix SCX1HC','Audix ADX51','Sennheiser e 614','beyerdynamic MC 930','Telefunken M60 FET','Schoeps CMC 6 + MK 4','RØDE NT5','LEWITT LCT 140 AIR'],
    ride:['Generisches Kleinmembran-Mikrofon','AKG C451 B','Neumann KM 184','Shure SM81','Shure KSM137','Shure KSM141','Audio-Technica AT4041','Audio-Technica AT4051b','Audix SCX1/SCX1HC','Sennheiser e 614','beyerdynamic MC 930','Telefunken M60 FET','Schoeps CMC 6 + MK 4','DPA 4011A','Earthworks SR25','Royer R-121'],
    overhead:['Generisches Kleinmembran-Mikrofon','AKG C414 XLS/XLII','AKG C451 B','Neumann KM 184','Neumann KM 84','Shure SM81','Neumann U 87 Ai','Schoeps CMC 6 + MK 4','DPA 4011A','Shure KSM44A','Audio-Technica AT4041','RØDE NT5','Earthworks SR25mp','Coles 4038','beyerdynamic M 160','Royer SF-24'],
    room:['Generisches Kondensatormikrofon','Neumann U 87 Ai','Neumann U 67','AKG C414 XLS/XLII','Audio-Technica AT4050','Shure KSM44A','Coles 4038','Royer R-121','AEA R84','AEA R88/R88A','beyerdynamic M 160','DPA 4006A','Earthworks QTC40','Schoeps CMC 6 + MK 2','Neumann TLM 102','Austrian Audio OC818']
  };
function audioMicBrand(name){if(/^beyerdynamic /i.test(name))return 'beyerdynamic';return ['Audio-Technica','Austrian Audio','Electro-Voice','sE Electronics'].find(brand=>name.startsWith(brand))||(/^Generisch|^Grenzflächen/.test(name)?'Allgemein':name.split(' ')[0]);}
function suggestions(name){
  const text=String(name).toLocaleLowerCase('de');
  if(/kick|bassdrum/.test(text))return ['Shure Beta 52A','Audix D6','AKG D112 MkII','Shure Beta 91A'];
  if(/snare|timbal/.test(text))return ['Shure SM57','Audix i5','beyerdynamic M 201','Telefunken M80'];
  if(/overhead|\boh\b|hi.?hat|ride|chimes|cymbal/.test(text))return ['Neumann KM 184','Shure SM81','AKG C451 B','RØDE NT5'];
  if(/tom|conga|bongo/.test(text))return ['Sennheiser MD 421 II','Shure SM57','Audix i5','beyerdynamic M 201'];
  if(/guitar|gitarre|amp|cabinet|brass|sax|tromp/.test(text))return ['Shure SM57','Sennheiser MD 421 II','beyerdynamic M 201','Audix i5'];
  if(/piano|flügel|akust|acoustic|string|violin/.test(text))return ['Neumann KM 184','AKG C414 XLS/XLII','Shure SM81'];
  if(/percussion|pandeiro|tamburin|cowbell|maracas/.test(text))return ['Shure SM57','Neumann KM 184','Audix i5','beyerdynamic M 201'];
  return ['Shure SM58','sE Electronics V7','Telefunken M80','Shure SM57'];
}

  function drumSuggestions(channel){
    if(/^kick\d+-in$/.test(channel))return drumTypicalMics.kickIn;
    if(/^kick\d+-out$/.test(channel))return drumTypicalMics.kickOut;
    if(/^(snare|side)-up$/.test(channel))return drumTypicalMics.snareTop;
    if(/^(snare|side)-down$/.test(channel))return drumTypicalMics.snareBottom;
    if(/^rack\d+$/.test(channel))return drumTypicalMics.rackTom;
    if(/^floor\d+$/.test(channel))return drumTypicalMics.floorTom;
    if(channel==='hihat')return drumTypicalMics.hihat;
    if(channel==='ride'||channel==='clapstack'||/^(crash|splash|china)\d+$/.test(channel))return drumTypicalMics.ride;
    if(/^oh-(?:mono|l|r)$/.test(channel))return drumTypicalMics.overhead;
    if(/^room-(?:mono|l|r)$/.test(channel))return drumTypicalMics.room;
    return['Generisches Drum-Mikrofon','Shure SM57','Beyerdynamic M201TG','Sennheiser e 604'];
  }
  const normalize=value=>String(value||'').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ø/g,'o').replace(/[^a-z0-9]/g,'');
  const photos={
  "Shure SM57": {
    "file": "shuresm57-photo-v1.webp"
  },
  "Shure SM58": {
    "file": "shuresm58-photo-v1.webp"
  },
  "Telefunken M80": {
    "file": "telefunkenm80-photo-v1.webp"
  },
  "beyerdynamic M 201": {
    "file": "beyerdynamicm201-photo-v1.webp"
  },
  "Neumann KM 184": {
    "file": "neumannkm184-photo-v1.webp"
  },
  "sE Electronics V7": {
    "file": "seelectronicsv7-photo-v1.webp"
  },
  "Audix i5": {
    "file": "audixi5-photo-v1.webp"
  },
  "Sennheiser MD 421 II": {
    "file": "sennheisermd421ii-photo-v1.webp"
  },
  "Shure Beta 57A": {
    "file": "shurebeta57a-photo-v1.webp"
  },
  "Shure SM81": {
    "file": "shuresm81-photo-v1.webp"
  },
  "Audix D2": {
    "file": "audixd2-photo-v1.webp"
  },
  "Audix D6": {
    "file": "audixd6-photo-v1.webp"
  },
  "Shure Beta 52A": {
    "file": "shurebeta52a-photo-v1.webp"
  },
  "Shure Beta 91A": {
    "file": "shurebeta91a-photo-v1.webp"
  },
  "sE Electronics V BEAT": {
    "file": "seelectronicsvbeat-photo-v1.webp"
  },
  "Audix D4": {
    "file": "audixd4-photo-v1.webp"
  },
  "Telefunken M80-SH": {
    "file": "telefunkenm80sh-photo-v1.webp"
  },
  "Sennheiser e 604": {
    "file": "sennheisere604-photo-v1.webp"
  },
  "sE Electronics V KICK": {
    "file": "seelectronicsvkick-photo-v1.webp"
  },
  "beyerdynamic M 88": {
    "file": "beyerdynamicm88-photo-v1.webp"
  },
  "beyerdynamic MC 930": {
    "file": "beyerdynamicmc930-photo-v1.webp"
  },
  "beyerdynamic M 160": {
    "file": "beyerdynamicm160-photo-v1.webp"
  },
  "Audix ADX51": {
    "file": "audixadx51-photo-v1.webp"
  },
  "Audix SCX1HC": {
    "file": "audixscx1hc-photo-v1.webp"
  },
  "Earthworks DM20": {
    "file": "earthworksdm20-photo-v1.webp"
  },
  "Earthworks SR25": {
    "file": "earthworkssr25-photo-v1.webp"
  },
  "Earthworks QTC40": {
    "file": "earthworksqtc40-photo-v1.webp"
  },
  "DPA 4055": {
    "file": "dpa4055-photo-v1.webp"
  },
  "DPA 4011A": {
    "file": "dpa4011a-photo-v1.webp"
  },
  "DPA 4006A": {
    "file": "dpa4006a-photo-v1.webp"
  },
  "RØDE NT5": {
    "file": "rodent5-photo-v1.webp"
  },
  "Yamaha SKRM-100 SubKick": {
    "file": "yamahaskrm100subkick-photo-v1.webp"
  },
  "Royer R-121": {
    "file": "royerr121-photo-v1.webp"
  },
  "Shure KSM137": {
    "file": "shureksm137-photo-v1.webp"
  },
  "Shure KSM141": {
    "file": "shureksm141-photo-v1.webp"
  },
  "Shure KSM44A": {
    "file": "shureksm44a-photo-v1.webp"
  },
  "Shure Beta 56A": {
    "file": "shurebeta56a-photo-v1.webp"
  },
  "Telefunken M82": {
    "file": "telefunkenm82-photo-v1.webp"
  },
  "Telefunken M81-SH": {
    "file": "telefunkenm81sh-photo-v1.webp"
  },
  "Telefunken M60 FET": {
    "file": "telefunkenm60fet-photo-v1.webp"
  },
  "LEWITT DTP 640 REX": {
    "file": "lewittdtp640rex-photo-v1.webp"
  },
  "LEWITT DTP 340 TT": {
    "file": "lewittdtp340tt-photo-v1.webp"
  },
  "LEWITT LCT 140 AIR": {
    "file": "lewittlct140air-photo-v1.webp"
  },
  "Coles 4038": {
    "file": "coles4038-photo-v1.webp"
  },
  "Josephson e22S": {
    "file": "josephsone22s-photo-v1.webp"
  },
  "Austrian Audio OC818": {
    "file": "austrianaudiooc818-photo-v1.webp"
  },
  "AKG D112 MkII": {
    "file": "akgd112mkii-photo-v1.webp"
  },
  "AKG D12 VR": {
    "file": "akgd12vr-photo-v1.webp"
  },
  "AKG C451 B": {
    "file": "akgc451b-photo-v1.webp"
  },
  "AKG D40": {
    "file": "akgd40-photo-v1.webp"
  },
  "Shure Beta 98AMP/C": {
    "file": "shurebeta98ampc-photo-v1.webp"
  },
  "Shure Beta 181/S": {
    "file": "shurebeta181s-photo-v1.webp"
  },
  "Audio-Technica AE2500": {
    "file": "audiotechnicaae2500-photo-v1.webp"
  },
  "Audio-Technica AT4047/SV": {
    "file": "audiotechnicaat4047sv-photo-v1.webp"
  },
  "Audio-Technica ATM230": {
    "file": "audiotechnicaatm230-photo-v1.webp"
  },
  "Audio-Technica AT4041": {
    "file": "audiotechnicaat4041-photo-v1.webp"
  },
  "Audio-Technica AT4050": {
    "file": "audiotechnicaat4050-photo-v1.webp"
  },
  "AEA R84": {
    "file": "aear84-photo-v1.webp"
  },
  "AEA R88/R88A": {
    "file": "aear88r88a-photo-v1.webp",
    "label": "Abgebildet: R88"
  },
  "AKG C414 XLS/XLII": {
    "file": "akgc414xlsxlii-photo-v1.webp",
    "label": "Abgebildet: C414 XLS"
  },
  "Electro-Voice RE20": {
    "file": "electrovoicere20-photo-v1.webp"
  },
  "Electro-Voice RE320": {
    "file": "electrovoicere320-photo-v1.webp"
  },
  "Electro-Voice ND44": {
    "file": "electrovoicend44-photo-v1.webp"
  },
  "Royer SF-24": {
    "file": "royersf24-photo-v1.webp"
  },
  "Solomon LoFReQ": {
    "file": "solomonlofreq-photo-v1.webp"
  },
  "Sennheiser e 901": {
    "file": "sennheisere901-photo-v1.webp"
  },
  "Sennheiser e 602 II": {
    "file": "sennheisere602ii-photo-v1.webp"
  },
  "Sennheiser e 902": {
    "file": "sennheisere902-photo-v1.webp"
  },
  "Sennheiser e 614": {
    "file": "sennheisere614-photo-v1.webp"
  },
  "Neumann U 47 fet": {
    "file": "neumannu47fet-photo-v1.webp"
  },
  "Neumann TLM 102": {
    "file": "neumanntlm102-photo-v1.webp"
  },
  "Neumann U 87 Ai": {
    "file": "neumannu87ai-photo-v1.webp"
  },
  "Neumann U 67": {
    "file": "neumannu67-photo-v1.webp",
    "label": "Mit Netzteil und Halterung"
  },
  "Neumann KM 84": {
    "file": "neumannkm84-photo-v1.webp"
  },
  "Sennheiser MD 441-U": {
    "file": "sennheisermd441u-photo-v1.webp"
  },
  "Sennheiser e 904": {
    "file": "sennheisere904-photo-v1.webp"
  },
  "Beyerdynamic M201TG": {
    "file": "beyerdynamicm201tg-photo-v1.webp"
  },
  "Schoeps CMC 6 + MK 4": {
    "file": "schoepscmc6mk4-photo-v1.webp",
    "label": "Abgebildet: CMC 6 + MK 4 mit Zubehör"
  },
  "AKG C414": {
    "file": "akgc414xlsxlii-photo-v1.webp",
    "label": "Abgebildet: C414 XLS"
  },
  "Audix SCX1/SCX1HC": {
    "file": "audixscx1hc-photo-v1.webp",
    "label": "Abgebildet: SCX1HC"
  },
  "Earthworks SR25mp": {
    "file": "earthworkssr25-photo-v1.webp",
    "label": "Ein SR25 aus dem Stereopaar"
  }
};
  const photoFiles=new Map(Object.entries(photos).map(([name,photo])=>[normalize(name),photo]));
  const catalog=[...drumMicCatalog,drumMic('Shure SM58','SM58','Dyn'),drumMic('sE Electronics V7','V7','Dyn'),drumMic('Sennheiser MD 421 II','MD 421 II','Dyn')].map(mic=>Object.freeze({...mic,id:normalize(mic.name),brand:audioMicBrand(mic.name),photo:photoFiles.has(normalize(mic.name))?'stageplot-assets/mics/'+photoFiles.get(normalize(mic.name)).file:'',photoLabel:photoFiles.get(normalize(mic.name))?.label||''}));
  const byId=new Map(catalog.map(mic=>[mic.id,mic]));
  const find=value=>byId.get(normalize(value))||null;
  const lookup=value=>find(value)||{id:'',name:String(value||''),short:String(value||'Mic'),brand:'Eigenes Modell',type:'',phantom:false,photo:''};
  const photo=value=>find(value)?.photo||'';
  function search(query,pool=catalog){
    const words=String(query||'').trim().split(/\s+/).map(normalize).filter(Boolean),flat=normalize(query);
    return pool.filter(mic=>words.every(word=>normalize([mic.name,mic.type,mic.phantom?'48V':'',mic.legacy?'Vintage Legacy':'',mic.supplement?'Zusatz Subkick':''].join(' ')).includes(word))).sort((a,b)=>Number(b.id===flat||normalize(b.short)===flat)-Number(a.id===flat||normalize(a.short)===flat)||Number(!!b.photo)-Number(!!a.photo)||a.name.localeCompare(b.name,'de',{numeric:true}));
  }
  function preferences(storage){
    const key='stageplot-studio:microphone-preferences:v1';let state={favorites:[],recent:[]};
    try{const saved=JSON.parse(storage?.getItem(key)||'null');for(const field of ['favorites','recent'])state[field]=[...new Set((Array.isArray(saved?.[field])?saved[field]:[]).filter(id=>byId.has(id)))].slice(0,field==='recent'?12:100);}catch{}
    const save=()=>{try{storage?.setItem(key,JSON.stringify(state));}catch{}};
    return {get:()=>({favorites:[...state.favorites],recent:[...state.recent]}),toggle(value){const id=find(value)?.id;if(!id)return;state.favorites=state.favorites.includes(id)?state.favorites.filter(v=>v!==id):[...state.favorites,id];save();},use(value){const id=find(value)?.id;if(!id)return;state.recent=[id,...state.recent.filter(v=>v!==id)].slice(0,12);save();}};
  }
  // Only microphone fields cross the editor boundary; patch, CH, names and notes stay on routes.
  function hydrateDrums(config,objectId,routing){
    const next=JSON.parse(JSON.stringify(config));next.mics??={};
    for(const row of routing?.inputs||[]){
      const prefix=objectId+':drum-';if(!row.sourceKey?.startsWith(prefix)||row.adoptedSource)continue;
      const id=row.sourceKey.slice(prefix.length);if(!Object.hasOwn(next.mics,id))continue;
      next.mics[id]={...next.mics[id],model:row.microphone||'',phantom:row.phantom===true};
    }
    for(const id of Object.keys(next.mics))if(routing?.disabledSources?.includes(objectId+':drum-'+id))next.mics[id].enabled=false;
    return next;
  }
  function writeDrumRoute(objects,row,isDrums,normalize=value=>value){
    if(row.adoptedSource)return;const object=objects.find(o=>row.sourceKey?.startsWith(o.id+':drum-')&&isDrums(o.type));if(!object)return;object.drums=normalize(object.drums);if(!object.drums?.mics)return;
    const id=row.sourceKey.slice((object.id+':drum-').length);if(!Object.hasOwn(object.drums.mics,id))return;
    object.drums.mics[id]={...object.drums.mics[id],model:row.microphone||'',phantom:row.phantom===true};
  }
  function applyDrumChanges(routing,objectId,before,after){
    for(const [id,mic] of Object.entries(after.mics||{})){
      const old=before.mics?.[id];if(old&&old.model===mic.model&&old.phantom===mic.phantom&&old.enabled===mic.enabled)continue;
      const key=objectId+':drum-'+id;
      for(const row of routing.inputs||[])if(row.sourceKey===key&&!row.adoptedSource){row.microphone=mic.model||'';row.phantom=mic.phantom===true;}
      if(mic.enabled!==false)routing.disabledSources=(routing.disabledSources||[]).filter(source=>source!==key);
    }
  }
  return {catalog,typical:drumTypicalMics,brand:audioMicBrand,suggestions,drumSuggestions,normalize,find,lookup,photo,search,preferences,hydrateDrums,writeDrumRoute,applyDrumChanges};
})();
if(typeof module==='object'&&module.exports)module.exports=StageplotMics;
