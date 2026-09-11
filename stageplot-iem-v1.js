/* IEM monitor sets. Routing rows own AUX numbers and physical output assignments. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StageplotIem=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clean=(value,max=80)=>String(value??'').trim().slice(0,max);
  const own=(o,row)=>String(row.sourceKey||'').startsWith(o.id+':');
  const nameOf=row=>clean(row.iemName||String(row.instrument||'').replace(/^IEM\s*·\s*/,'').replace(/(?:\s*·)?\s+[LR]$/,''));
  function normalize(value,fallback={}){
    const used=new Set(),usedPorts=new Set();
    return (Array.isArray(value)&&value.length?value:[{id:'legacy',...fallback,ports:[fallback.mode==='mono'?'iem-mono':'iem-l','iem-r']}]).slice(0,16).map((raw,index)=>{
      const v=raw&&typeof raw==='object'?raw:{};let id=/^[a-z0-9-]{1,60}$/.test(v.id||'')?v.id:'mix-'+(index+1);while(used.has(id))id+='-copy';used.add(id);
      const port=(n)=>{let key=/^[a-zA-Z0-9_-]{1,110}$/.test(v.ports?.[n]||'')?v.ports[n]:'iem-'+id+(n?'-r':'-l');while(usedPorts.has(key))key+='-copy';usedPorts.add(key);return key;};
      return {id,name:clean(v.name)||'IEM '+(index+1),mode:v.mode==='mono'?'mono':'stereo',transport:v.transport==='cable'?'cable':'wireless',frequencyBand:clean(v.frequencyBand,100),ports:[port(0),port(1)]};
    });
  }
  function read(o,rows){
    let source=o.iemMixes;
    if(!Array.isArray(source)){
      const members=rows.filter(row=>own(o,row)),seen=new Set();source=[];
      for(const row of members){const group=row.stereoGroup||row.id;if(seen.has(group))continue;seen.add(group);
        const pair=row.stereoGroup?members.filter(r=>r.stereoGroup===row.stereoGroup).sort((a,b)=>Number(a.mode==='Stereo R')-Number(b.mode==='Stereo R')):[row];
        source.push({id:source.length?'mix-'+(source.length+1):'legacy',name:nameOf(pair[0]),mode:pair.length>1?'stereo':'mono',transport:pair[0].iemTransport||o.iem?.transport,frequencyBand:pair[0].frequencyBand||o.wireless||o.iem?.frequencyBand,ports:[pair[0].sourceKey.slice(o.id.length+1),pair[1]?.sourceKey.slice(o.id.length+1)||'iem-'+(source.length+1)+'-r']});
      }
    }
    const mixes=normalize(source,{...o.iem,name:o.iem?.name||o.label||'IEM 1'});
    return mixes.map(m=>{const left=rows.find(r=>r.sourceKey===o.id+':'+m.ports[0]),right=rows.find(r=>r.sourceKey===o.id+':'+m.ports[1]);return {...m,...(left?{name:nameOf(left)||m.name,transport:left.iemTransport||m.transport,frequencyBand:left.frequencyBand||m.frequencyBand}:{}),aux:[left?.number??null,right?.number??null]};});
  }
  function specs(o,mixes=normalize(o.iemMixes,o.iem)){
    let port=0;return mixes.flatMap(m=>Array.from({length:m.mode==='stereo'?2:1},(_,side)=>({
      sourceKey:o.id+':'+m.ports[side],instrument:'IEM · '+m.name+(m.mode==='stereo'?' · '+(side?'R':'L'):''),mode:m.mode==='stereo'?'Stereo '+(side?'R':'L'):'Mono',signalType:'Line',connector:'XLR',pickup:'Direct',outputKind:'iem',portIndex:++port,stereoGroup:m.mode==='stereo'?o.id+':iem-set-'+m.id:'',iemGroup:o.id+':iem-set-'+m.id,iemName:m.name,iemMode:m.mode,iemTransport:m.transport,frequencyBand:m.transport==='wireless'?m.frequencyBand:''
    })));
  }
  function resize(mixes,count){
    const n=Math.max(1,Math.min(16,Math.round(Number(count)||1))),next=mixes.slice(0,n),ids=new Set(mixes.map(m=>m.id));let i=1;
    while(next.length<n){while(ids.has('mix-'+i))i++;const id='mix-'+i;ids.add(id);next.push({...normalize([{id,name:'IEM '+(next.length+1),mode:'stereo'}])[0],aux:[null,null]});}return next;
  }
  function apply(o,current,mixes,token){
    const nextMixes=normalize(mixes),expected=specs(o,nextMixes),remaining=current.filter(r=>!own(o,r));
    const used=new Set(remaining.map(r=>r.number).filter(Boolean)),reserved=new Set();
    for(let i=0;i<nextMixes.length;i++)for(let side=0;side<(nextMixes[i].mode==='stereo'?2:1);side++){
      const raw=mixes[i].aux?.[side];if(raw==null||raw==='')continue;const n=Number(raw);
      if(!Number.isInteger(n)||n<1||n>999)throw Error('AUX muss eine ganze Zahl zwischen 1 und 999 sein.');
      if(used.has(n)||reserved.has(n))throw Error('AUX '+n+' ist bereits vergeben. Bitte einen freien Mix wählen.');reserved.add(n);
    }
    let at=0;const generated=[];
    for(let i=0;i<nextMixes.length;i++)for(let side=0;side<(nextMixes[i].mode==='stereo'?2:1);side++){
      const spec=expected[at++],old=current.find(r=>r.sourceKey===spec.sourceKey);let number=Number(mixes[i].aux?.[side])||null;
      if(!number){number=1;while(used.has(number)||reserved.has(number))number++;if(number>999)throw Error('Keine freie AUX-Nummer verfügbar.');reserved.add(number);}
      generated.push({...old,...spec,number,id:old?.id||'route-'+token(),generatedInstrument:spec.instrument,edited:true,manual:false,stagebox:old?.stagebox||'',stageboxPort:old?.stageboxPort||null,notes:old?.notes||'',linkedSources:old?.linkedSources||[]});
    }
    // Retain ordering and identities of existing rows; insert new mixes after the set.
    const byKey=new Map(generated.map(r=>[r.sourceKey,r])),rows=[];let insertAt=-1;
    for(const row of current){if(!own(o,row)){rows.push(row);continue;}const replacement=byKey.get(row.sourceKey);if(replacement){rows.push(replacement);byKey.delete(row.sourceKey);}insertAt=rows.length;}
    rows.splice(insertAt<0?rows.length:insertAt,0,...byKey.values());
    return {mixes:nextMixes,rows};
  }
  return {normalize,read,specs,resize,apply};
});
