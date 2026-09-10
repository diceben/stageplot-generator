/* One picker for Audio and instrument editors. Selection stays in the caller's draft. */
const StageplotMicPicker=(()=>{
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let storage;try{storage=globalThis.localStorage;}catch{}
  const prefs=StageplotMics.preferences(storage);let sequence=0;
  const picture=mic=>mic.photo?'<img src="'+esc(mic.photo)+'" alt="'+esc(mic.name+(mic.photoLabel?' · '+mic.photoLabel:''))+' · Original-Produktfoto" loading="lazy" decoding="async">':'<span class="sp-mic-no-photo">'+esc(mic.short||'Modell offen')+'<small>Ohne Produktfoto</small></span>';
  function mount(host,options){
    const id='sp-mic-search-'+(++sequence);let opts=options,filter='Vorschläge',query='',custom=false;
    host.classList.add('sp-mic-picker');
    host.innerHTML='<div class="sp-mic-current"></div><div class="sp-mic-custom" hidden><label>Eigenes Mikrofonmodell<input maxlength="80" placeholder="Hersteller und Modell"></label><button type="button" data-mic-custom-use>Modell verwenden</button></div><label class="sp-mic-search" for="'+id+'"><span>Mikrofon suchen</span><div><input id="'+id+'" type="search" placeholder="Modell, Hersteller oder Bauart …" autocomplete="off" spellcheck="false" aria-describedby="'+id+'-status"><button type="button" data-mic-search-clear aria-label="Mikrofonsuche leeren" hidden>×</button></div></label><div class="sp-mic-filters" role="group" aria-label="Mikrofon-Schnellzugriffe"></div><div class="sp-mic-manufacturers"><button type="button" data-mic-scroll="-1" aria-label="Vorherige Hersteller">‹</button><div class="sp-mic-brands" role="group" aria-label="Mikrofon-Hersteller"></div><button type="button" data-mic-scroll="1" aria-label="Weitere Hersteller">›</button></div><p class="sp-mic-status" id="'+id+'-status" role="status" aria-live="polite"></p><div class="sp-mic-results" role="group" aria-label="Mikrofonmodelle"></div>';
    const $=selector=>host.querySelector(selector),search=$('input[type="search"]'),results=$('.sp-mic-results');
    const chips=(list)=>list.map(name=>'<button type="button" data-mic-filter="'+esc(name)+'" aria-pressed="'+(!query&&filter===name)+'">'+esc(name)+'</button>').join('');
    function render(){
      const current=StageplotMics.lookup(opts.selected),state=prefs.get();
      $('.sp-mic-current').innerHTML=(current.name?picture(current):'')+'<div><small>'+esc(opts.context||'Mikrofon')+'</small><strong>'+esc(current.name||'Mikrofon wählen')+'</strong>'+(current.photoLabel?'<small>'+esc(current.photoLabel)+'</small>':'')+'</div><button type="button" data-mic-custom aria-expanded="'+custom+'">Eigenes Modell</button>'+(current.name?'<button type="button" data-mic-clear aria-label="Mikrofonmodell entfernen">×</button>':'');
      $('.sp-mic-custom').hidden=!custom;
      $('.sp-mic-filters').innerHTML=chips(['Vorschläge','Favoriten','Zuletzt','Alle']);
      const brandScroll=$('.sp-mic-brands').scrollLeft;
      $('.sp-mic-brands').innerHTML=chips([...new Set(StageplotMics.catalog.map(m=>m.brand))].sort((a,b)=>a.localeCompare(b,'de')));$('.sp-mic-brands').scrollLeft=brandScroll;
      let models;
      if(query)models=StageplotMics.search(query);
      else if(filter==='Vorschläge')models=[...new Set(opts.suggestions||StageplotMics.suggestions(opts.context))].map(StageplotMics.find).filter(Boolean).sort((a,b)=>Number(!!b.photo)-Number(!!a.photo));
      else if(filter==='Favoriten'||filter==='Zuletzt')models=state[filter==='Favoriten'?'favorites':'recent'].map(StageplotMics.find).filter(Boolean);
      else models=StageplotMics.search('',filter==='Alle'?StageplotMics.catalog:StageplotMics.catalog.filter(m=>m.brand===filter));
      $('.sp-mic-status').textContent=query?models.length+' Treffer im gesamten Katalog':filter==='Vorschläge'?'Passend zu '+(opts.context||'diesem Signal'):filter==='Favoriten'&&!models.length?'Mit dem Stern deine häufigsten Mikrofone merken.':filter==='Zuletzt'&&!models.length?'Deine zuletzt verwendeten Modelle erscheinen hier.':filter+' · '+models.length+' Modelle';
      $('[data-mic-search-clear]').hidden=!query;
      results.innerHTML=models.map(m=>'<article class="sp-mic-card" data-selected="'+(StageplotMics.find(opts.selected)?.id===m.id)+'"><button type="button" data-mic-choice="'+m.id+'" aria-pressed="'+(StageplotMics.find(opts.selected)?.id===m.id)+'" aria-label="'+esc(m.name)+' verwenden">'+picture(m)+'<span><small>'+esc(m.brand)+'</small><strong>'+esc(m.name.slice(m.brand.length).trim()||m.name)+'</strong><small>'+esc([m.type,m.phantom?'48 V':'',m.legacy?'Vintage / Legacy':'',m.supplement?'Zusatzmikrofon':''].filter(Boolean).join(' · '))+'</small>'+(m.photoLabel?'<small class="sp-mic-photo-caption">'+esc(m.photoLabel)+'</small>':'')+'</span></button><button type="button" class="sp-mic-favorite" data-mic-favorite="'+m.id+'" aria-label="'+esc(m.name)+' als Favorit" aria-pressed="'+state.favorites.includes(m.id)+'">'+(state.favorites.includes(m.id)?'★':'☆')+'</button></article>').join('')||'<p class="sp-mic-empty">'+(query?'Kein Treffer. Suche verkürzen oder ein eigenes Modell verwenden.':'')+'</p>';
    }
    function choose(mic){prefs.use(mic.name);opts={...opts,selected:mic.name};render();opts.onSelect(mic);}
    host.addEventListener('input',e=>{if(e.target===search){query=search.value.trim();render();results.scrollTop=0;}});
    host.addEventListener('keydown',e=>{
      if(e.target===search&&e.key==='ArrowDown'){e.preventDefault();results.querySelector('[data-mic-choice]')?.focus();}
      if(e.target===search&&e.key==='Enter'){e.preventDefault();const first=results.querySelector('[data-mic-choice]');if(first)choose(StageplotMics.find(first.dataset.micChoice));}
      if(e.key==='Escape'&&query){e.preventDefault();e.stopPropagation();query='';search.value='';render();search.focus();}
      if(e.target.matches('[data-mic-choice]')&&['ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();const buttons=[...results.querySelectorAll('[data-mic-choice]')],i=buttons.indexOf(e.target),delta=['ArrowDown','ArrowRight'].includes(e.key)?1:-1;buttons[Math.max(0,Math.min(buttons.length-1,i+delta))]?.focus();}
      if(e.target===$('.sp-mic-custom input')&&e.key==='Enter'){e.preventDefault();$('[data-mic-custom-use]').click();}
    });
    host.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b||!host.contains(b))return;
      if(b.hasAttribute('data-mic-choice')){const mic=StageplotMics.find(b.dataset.micChoice);choose(mic);results.querySelector('[data-mic-choice="'+mic.id+'"]')?.focus({preventScroll:true});}
      if(b.hasAttribute('data-mic-filter')){filter=b.dataset.micFilter;query='';search.value='';render();results.scrollTop=0;host.querySelector('[data-mic-filter="'+CSS.escape(filter)+'"]')?.focus({preventScroll:true});}
      if(b.hasAttribute('data-mic-favorite')){prefs.toggle(b.dataset.micFavorite);render();host.querySelector('[data-mic-favorite="'+b.dataset.micFavorite+'"]')?.focus({preventScroll:true});}
      if(b.hasAttribute('data-mic-search-clear')){query='';search.value='';render();search.focus();}
      if(b.hasAttribute('data-mic-custom')){custom=!custom;render();if(custom){$('.sp-mic-custom input').value=opts.selected||query;$('.sp-mic-custom input').focus();}}
      if(b.hasAttribute('data-mic-custom-use')){const name=$('.sp-mic-custom input').value.trim().slice(0,80);if(name){custom=false;choose(StageplotMics.lookup(name));}}
      if(b.hasAttribute('data-mic-clear'))choose(StageplotMics.lookup(''));
      if(b.hasAttribute('data-mic-scroll'))$('.sp-mic-brands').scrollBy({left:Number(b.dataset.micScroll)*240,behavior:'auto'});
    });
    render();return {update(next){opts={...opts,...next};render();},focus(){search.focus();},reset(next){opts=next;query='';filter='Vorschläge';custom=false;search.value='';render();results.scrollTop=0;}};
  }
  function open(root,options){
    const returnFocus=document.activeElement,dialog=document.createElement('dialog');dialog.className='sp-mic-dialog';dialog.setAttribute('aria-label','Mikrofon auswählen · '+options.context);
    dialog.innerHTML='<header><div><small>MIKROFON AUSWÄHLEN</small><h2>'+esc(options.context)+'</h2></div><button type="button" data-mic-close aria-label="Mikrofonauswahl schließen">×</button></header><div class="sp-mic-dialog-body"></div><footer>Ein Klick übernimmt das Modell in diesen Editor.</footer>';
    root.append(dialog);const close=()=>{if(dialog.open)dialog.close();};
    const picker=mount(dialog.querySelector('.sp-mic-dialog-body'),{...options,onSelect(mic){options.onSelect(mic);close();}});
    dialog.querySelector('[data-mic-close]').addEventListener('click',close);
    dialog.addEventListener('close',()=>{dialog.remove();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});options.onClose?.();},{once:true});
    dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.showModal();picker.focus();return {close};
  }
  return {mount,open,picture};
})();
