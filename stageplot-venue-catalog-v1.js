/* Curated public stage dimensions. Bundled locally; beta access needs no account or entitlement. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./stageplot-geometry-v1.js'):root.StageplotGeometry);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StageplotVenueCatalog=api;
})(globalThis,function(G){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const entries=[
    {id:'at-wien-b72',name:'B72',city:'Wien',country:'Österreich',type:'Club',stageName:'Livebühne',tags:['Gürtel','Hernalser Gürtel','Vienna','1080'],revision:1,
      width:4.18,depth:4.27,height:.6,clearance:null,approximate:true,
      scope:'Rechteckige Maßskizze nach den ungefähren Bühnenmaßen. Einbauten, Zugänge und FOH-Position sind noch nicht erfasst.',
      details:'Bei eigenem Mischpult: eine CAT6-Verbindung zwischen FOH und Bühne; Main L/R analog über XLR am FOH.',
      source:{title:'B72 · Booking & Tech',url:'https://www.b72.at/booking-and-tech',date:'Ohne Datumsangabe',checkedAt:'2026-09-08'}},
    {id:'at-wien-muth',name:'MuTh',city:'Wien',country:'Österreich',type:'Theater',stageName:'Hauptbühne · Maximalmaße',tags:['Konzertsaal','Vienna'],revision:1,
      width:16,depth:8.5,height:.9,clearance:6.5,maximum:true,surface:'black',
      scope:'Maßskizze der maximalen Breite hinter dem Portal und der maximalen Hauptbühnentiefe. Der tatsächliche Umriss, die Vorbühne und der Orchestergraben sind noch nicht erfasst.',
      details:'Die Portalöffnung ist 11,9 m breit. Quelle mit Stand September 2021; die heutige Konfiguration ist nicht bestätigt.',
      source:{title:'MuTh · Technische Ausstattung (PDF)',url:'https://muth.at/wp-content/uploads/Das-MuTh-Technische-Ausstattung.pdf',date:'September 2021',checkedAt:'2026-09-08'}},
    {id:'at-wien-volksoper',name:'Volksoper Wien',city:'Wien',country:'Österreich',type:'Theater',stageName:'Hauptbühne · Nutzmaße',tags:['Oper','Vienna'],revision:1,
      width:17.2,depth:19,height:null,clearance:null,
      scope:'Maßskizze der nutzbaren Breite und der Tiefe von der vorderen Portalkante bis zum Schiebefalttor. Die gesamte Bühnenfläche, Seitenbereiche und Einbauten sind noch nicht erfasst.',
      details:'Die Portalöffnung ist 11,06 m breit. Die dargestellte Nutzbreite ist größer als die Portalöffnung.',
      source:{title:'Volksoper Wien · Technik hinter den Kulissen',url:'https://www.volksoper.at/volksoper_wien/information/ueber_volksoper/Ueber_die_Volksoper.php',date:'Ohne Datumsangabe',checkedAt:'2026-09-08'}}
  ];
  const fold=value=>String(value??'').toLocaleLowerCase('de').replace(/ß/g,'ss').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  function search(query='',type='Alle'){
    const words=fold(query).split(/\s+/).filter(Boolean);
    return copy(entries.filter(entry=>{
      const text=fold([entry.name,entry.city,entry.country,entry.type,entry.stageName,...entry.tags].join(' '));
      return (type==='Alle'||entry.type===type)&&words.every(word=>text.includes(word));
    }));
  }
  function get(id){const entry=entries.find(item=>item.id===id);if(!entry)throw new Error('Diese Bühne ist nicht im Katalog.');return copy(entry);}
  function createDocument(id,options={}){
    const entry=get(id),artist=String(options.artist||'').trim().slice(0,80),title=(artist?artist+' · '+entry.name:entry.name+' · Veranstaltung').slice(0,60);
    const geometry=G.legacy({w:entry.width,d:entry.depth});
    Object.assign(geometry,{name:(entry.name+' · '+entry.stageName).slice(0,60),height:entry.height,clearance:entry.clearance,revision:entry.revision,
      notes:['Bühnenkatalog · Maßskizze: '+entry.name,entry.scope,entry.details,'Quelle: '+entry.source.title+' · Stand: '+entry.source.date,'Abgerufen: '+entry.source.checkedAt,entry.source.url].join('\n')});
    geometry.parts[0].name=entry.stageName;geometry.parts[0].height=entry.height;
    return {stage:{title,w:entry.width,d:entry.depth,estimated:false,surface:entry.surface||'light',complex:true,stairs:'unknown',extraStairs:[],iem:'unknown',iemLength:2,iemDepth:.8,iemX:0,iemY:0,
      geometry:G.normalize(geometry),venueRef:{templateId:'venue-catalog-'+entry.id,name:entry.name,revision:entry.revision},project:{name:title,artist,venue:entry.name+', '+entry.city}},objects:[]};
  }
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const num=value=>Number(value.toFixed(2)).toLocaleString('de-AT');
  const prefix=entry=>entry.approximate?'ca. ':entry.maximum?'max. ':'';
  function preview(entry){
    const scale=Math.min(430/entry.width,240/entry.depth),w=entry.width*scale,d=entry.depth*scale,x=(560-w)/2,y=(330-d)/2;
    return '<svg viewBox="0 0 560 350" role="img" aria-label="Maßskizze, Breite '+esc(prefix(entry)+num(entry.width))+' Meter, Tiefe '+esc(prefix(entry)+num(entry.depth))+' Meter, Publikum unten">'+
      '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+d+'" rx="1" fill="var(--sp-accent-bg)" stroke="var(--sp-art)" stroke-width="1.5"/>'+
      '<g fill="none" stroke="var(--sp-muted)" stroke-width="1"><path d="M'+x+' '+(y-12)+'v-12m0 6h'+w+'m0-6v12M'+(x+w+12)+' '+y+'h12m-6 0v'+d+'m-6 0h12"/></g>'+
      '<g fill="var(--sp-art)" font-size="14" text-anchor="middle"><text x="280" y="'+(y-26)+'">'+esc(prefix(entry)+num(entry.width))+' m</text><text transform="translate('+(x+w+38)+' '+(y+d/2)+') rotate(90)">'+esc(prefix(entry)+num(entry.depth))+' m</text></g>'+
      '<text x="280" y="'+(y+d+28)+'" text-anchor="middle" font-size="10" letter-spacing="2" fill="var(--sp-muted)">PUBLIKUM</text></svg>';
  }
  function open(options){
    const existing=options.root.querySelector('.sp-venue-catalog');if(existing)return existing;
    const returnFocus=document.activeElement,dialog=document.createElement('dialog');
    dialog.className='sp-venue-catalog';dialog.setAttribute('aria-labelledby','svc-title');
    dialog.innerHTML='<header class="svc-head"><div><span class="svc-beta">BETA · KOSTENLOS</span><h2 id="svc-title">Location suchen</h2><p>Bühnenvorlagen von Clubs und Theatern für dein Projekt. Ohne Account nutzbar.</p></div><button type="button" data-close aria-label="Bühnenkatalog schließen">×</button></header>'+
      '<div class="svc-searchbar"><label class="svc-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Name oder Stadt, z. B. B72 oder Wien …" aria-label="Location oder Stadt suchen" autocomplete="off" autofocus></label><div class="svc-filters" aria-label="Art der Location">'+['Alle','Club','Theater'].map(type=>'<button type="button" data-filter="'+type+'" aria-pressed="'+(type==='Alle')+'">'+type+'</button>').join('')+'</div></div>'+
      '<div class="svc-body"><section class="svc-results" aria-label="Gefundene Bühnen"><p class="svc-count" role="status" aria-live="polite"></p><div class="svc-list"></div><div class="svc-empty" hidden><strong>Keine passende Bühne gefunden</strong><p>Versuche einen anderen Namen oder Ort. Der Katalog startet mit einer kleinen Auswahl.</p><button type="button" data-reset>Suche zurücksetzen</button></div><p class="svc-offline">Alle Katalogvorlagen sind in der App enthalten und auch offline nutzbar.</p></section><section class="svc-detail" aria-label="Bühnenvorschau"></section></div>';
    options.root.append(dialog);
    const $=selector=>dialog.querySelector(selector),input=$('input'),detail=$('.svc-detail');
    let selected=entries[0].id,type='Alle',using=false;
    function showDetail(){
      detail.hidden=!selected;if(!selected){detail.innerHTML='';return;}
      const entry=get(selected);
      detail.innerHTML='<div class="svc-detail-content"><div class="svc-detail-heading"><span class="svc-kicker">'+esc(entry.type+' · '+entry.city+' · '+entry.country)+'</span><h3 tabindex="-1">'+esc(entry.name)+'</h3><p>'+esc(entry.stageName)+'</p></div><div class="svc-plan">'+preview(entry)+'<span>Maßskizze</span></div>'+
        '<dl class="svc-facts"><div><dt>Breite</dt><dd>'+esc(prefix(entry)+num(entry.width))+' m</dd></div><div><dt>Tiefe</dt><dd>'+esc(prefix(entry)+num(entry.depth))+' m</dd></div><div><dt>Bühnenhöhe</dt><dd>'+(entry.height===null?'Nicht erfasst':esc((entry.approximate?'ca. ':'')+num(entry.height))+' m')+'</dd></div>'+(entry.clearance===null?'':'<div><dt>Lichte Höhe</dt><dd>'+num(entry.clearance)+' m</dd></div>')+'</dl>'+
        '<div class="svc-scope"><strong>In dieser Vorlage</strong><p>'+esc(entry.scope)+'</p><p>'+esc(entry.details)+'</p></div>'+
        '<div class="svc-source"><a href="'+esc(entry.source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(entry.source.title)+' ↗</a><small>Quellenstand: '+esc(entry.source.date)+' · Abgerufen am '+entry.source.checkedAt.split('-').reverse().join('.')+'</small></div></div>'+
        '<div class="svc-use"><p>Erstellt ein eigenes Projekt mit einer frei bearbeitbaren Kopie.</p><p class="svc-error" role="alert" hidden></p><button type="button" data-use>Auf dieser Bühne planen <span aria-hidden="true">→</span></button></div>';
      detail.scrollTop=0;
    }
    function render(){
      const matches=search(input.value,type);if(!matches.some(entry=>entry.id===selected))selected=matches[0]?.id||null;
      $('.svc-count').textContent=matches.length+' '+(matches.length===1?'Bühne':'Bühnen');
      $('.svc-empty').hidden=matches.length>0;
      $('.svc-list').innerHTML=matches.map(entry=>'<button type="button" class="svc-card" data-venue="'+entry.id+'" aria-pressed="'+(selected===entry.id)+'" aria-label="'+esc(entry.name)+' ansehen"><span class="svc-card-type">'+esc(entry.type+' · '+entry.city)+'</span><strong>'+esc(entry.name)+'</strong><span>'+esc(entry.stageName)+'</span><span class="svc-card-meta">'+esc(prefix(entry)+num(entry.width)+' × '+num(entry.depth))+' m <span>Maßskizze</span></span></button>').join('');
      dialog.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===type)));
      showDetail();
    }
    input.addEventListener('input',render);
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||using)return;
      if(button.hasAttribute('data-close'))dialog.close();
      else if(button.dataset.filter){type=button.dataset.filter;render();}
      else if(button.hasAttribute('data-reset')){type='Alle';input.value='';render();input.focus();}
      else if(button.dataset.venue){selected=button.dataset.venue;dialog.querySelectorAll('[data-venue]').forEach(card=>card.setAttribute('aria-pressed',String(card.dataset.venue===selected)));showDetail();if(window.matchMedia('(max-width:700px)').matches)detail.querySelector('h3').focus();}
      else if(button.hasAttribute('data-use')){
        using=true;button.disabled=true;
        try{options.onUse(selected);dialog.close();}
        catch(error){const message=$('.svc-error');message.textContent=error.message||'Das Projekt konnte nicht angelegt werden.';message.hidden=false;}
        finally{using=false;button.disabled=false;}
      }
    });
    dialog.addEventListener('close',()=>{dialog.remove();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});},{once:true});
    dialog.showModal();render();return dialog;
  }
  return {search,get,createDocument,open};
});
