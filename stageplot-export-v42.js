// Pure offline export helpers: no DOM, network, storage or mutable app state.
function createStageplotExportV42() {
  'use strict';

  const SETUP_KIND='stageplot-setup';
  const SETUP_VERSION=1;
  const PNG_SCALES=[2,4];
  const PNG_BACKGROUNDS=['white','transparent'];
  const unsafeKeys=new Set(['__proto__','prototype','constructor']);
  const reservedFilename=/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

  // The prototype-depth check also accepts plain objects crossing a VM/iframe
  // boundary, but still rejects class instances and host objects.
  const plainObject=value=>{
    if(value===null||typeof value!=='object'||Object.prototype.toString.call(value)!=='[object Object]')return false;
    const prototype=Object.getPrototypeOf(value);
    return prototype===null||Object.getPrototypeOf(prototype)===null;
  };
  const finite=value=>typeof value==='number'&&Number.isFinite(value);

  function cloneJson(value,label='Daten') {
    let nodes=0;
    const visit=(item,depth)=>{
      if(depth>32)throw new Error(label+' sind zu tief verschachtelt.');
      if(++nodes>25000)throw new Error(label+' sind zu umfangreich.');
      if(item===null||typeof item==='boolean')return item;
      if(typeof item==='number'){
        if(!Number.isFinite(item))throw new Error(label+' enthalten eine ungültige Zahl.');
        return item;
      }
      if(typeof item==='string'){
        if(item.length>250000)throw new Error(label+' enthalten einen zu langen Text.');
        return item;
      }
      if(Array.isArray(item))return item.map(child=>visit(child,depth+1));
      if(!plainObject(item))throw new Error(label+' müssen reine JSON-Daten sein.');
      const copy={};
      for(const key of Object.keys(item)){
        if(unsafeKeys.has(key))throw new Error(label+' enthalten einen unsicheren Schlüssel.');
        const child=item[key];
        if(child===undefined||typeof child==='function'||typeof child==='symbol'||typeof child==='bigint')throw new Error(label+' müssen reine JSON-Daten sein.');
        copy[key]=visit(child,depth+1);
      }
      return copy;
    };
    return visit(value,0);
  }

  function basicNormalizeSetupDocument(value) {
    const document=cloneJson(value,'Das Setup');
    if(!plainObject(document)||!plainObject(document.stage)||!Array.isArray(document.objects))throw new Error('Die Datei enthält kein gültiges Stageplot-Setup.');
    const {stage,objects}=document;
    if(!finite(stage.w)||stage.w<2||stage.w>30||!finite(stage.d)||stage.d<2||stage.d>20)throw new Error('Die Datei enthält ungültige Bühnenmaße.');
    if(typeof stage.title!=='string'||!stage.title.trim()||stage.title.length>60)throw new Error('Die Datei enthält keinen gültigen Setup-Namen.');
    if(objects.length>2000)throw new Error('Das Setup enthält zu viele Bausteine.');
    for(const object of objects){
      if(!plainObject(object)||typeof object.id!=='string'||object.id.length>100||typeof object.type!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(object.type)||!finite(object.x)||Math.abs(object.x)>10000||!finite(object.y)||Math.abs(object.y)>10000||!finite(object.angle)||Math.abs(object.angle)>36000)throw new Error('Die Datei enthält einen ungültigen Baustein.');
    }
    return document;
  }

  function normalizeDocument(value,normalizer) {
    const first=basicNormalizeSetupDocument(value);
    if(normalizer===undefined)return first;
    if(typeof normalizer!=='function')throw new TypeError('normalizeDocument muss eine Funktion sein.');
    return basicNormalizeSetupDocument(normalizer(first));
  }

  function cleanExportName(value) {
    if(typeof value!=='string'||!value.trim())throw new Error('Bitte einen Namen für das Setup eingeben.');
    const name=value.trim();
    if(name.length>60)throw new Error('Der Setup-Name darf höchstens 60 Zeichen lang sein.');
    return name;
  }

  function normalizeTimestamp(value) {
    if(!finite(value)||value<0||value>8640000000000000)return null;
    return Math.trunc(value);
  }

  function createSetupExport(name,document,options={}) {
    const exportedAt=options.exportedAt===undefined?Date.now():options.exportedAt;
    const timestamp=normalizeTimestamp(exportedAt);
    if(timestamp===null)throw new Error('Der Exportzeitpunkt ist ungültig.');
    return {kind:SETUP_KIND,version:SETUP_VERSION,name:cleanExportName(name),exportedAt:timestamp,document:normalizeDocument(document,options.normalizeDocument)};
  }

  function normalizeSetupExport(value,options={}) {
    if(!plainObject(value)||value.kind!==SETUP_KIND||value.version!==SETUP_VERSION)throw new Error('Die Datei ist kein gültiges Stageplot-Setup.');
    const timestamp=normalizeTimestamp(value.exportedAt);
    if(timestamp===null)throw new Error('Der Exportzeitpunkt ist ungültig.');
    return {kind:SETUP_KIND,version:SETUP_VERSION,name:cleanExportName(value.name),exportedAt:timestamp,document:normalizeDocument(value.document,options.normalizeDocument)};
  }

  function parseSetupJson(text,options={}) {
    if(typeof text!=='string'||text.length===0)throw new Error('Die Setup-Datei ist leer.');
    if(text.length>5000000)throw new Error('Die Setup-Datei ist zu groß.');
    let value;
    try{value=JSON.parse(text);}catch(error){throw new Error('Die Setup-Datei enthält kein gültiges JSON.');}
    return normalizeSetupExport(value,options);
  }

  function stringifySetupJson(value,options={}) {
    const space=options.space===0?0:2;
    return JSON.stringify(normalizeSetupExport(value,options),null,space)+(space?'\n':'');
  }

  function normalizeExtension(value) {
    if(value===undefined||value===null||value==='')return '';
    const extension=String(value).replace(/^\.+/,'').toLowerCase();
    if(!/^[a-z0-9]{1,12}(?:\.[a-z0-9]{1,12}){0,2}$/.test(extension))throw new Error('Die Dateiendung ist ungültig.');
    return extension;
  }

  function safeFilename(value,options={}) {
    const fallback=typeof options.fallback==='string'&&options.fallback.trim()?options.fallback:'stageplot';
    const extension=normalizeExtension(options.extension);
    const prefix=typeof options.prefix==='string'?options.prefix:'';
    const requestedMax=Number(options.maxLength);
    const maxLength=Number.isFinite(requestedMax)?Math.max(24,Math.min(180,Math.trunc(requestedMax))):120;
    const ascii=input=>String(input??'')
      .replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
    const slug=input=>ascii(input)
      .replace(/[\x00-\x1f\x7f]/g,' ')
      .replace(/[\\/:*?"<>|]/g,' ')
      .replace(/[^A-Za-z0-9._ -]+/g,' ')
      .replace(/[\s._-]+/g,'-')
      .replace(/^-+|-+$/g,'');
    let base=slug(prefix+String(value??''))||slug(fallback)||'stageplot';
    if(base==='.'||base==='..'||reservedFilename.test(base))base='stageplot-'+base.replace(/\.+/g,'-');
    const suffix=extension?'.'+extension:'';
    const allowed=Math.max(1,maxLength-suffix.length);
    if(base.length>allowed)base=base.slice(0,allowed).replace(/[-. ]+$/,'')||'stageplot';
    return base+suffix;
  }

  function filenameFor(title,format,options={}) {
    const extensions={setup:'stageplot.json',png:'png',svg:'svg',pdf:'pdf'};
    if(!Object.hasOwn(extensions,format))throw new Error('Das Exportformat ist unbekannt.');
    return safeFilename(title,{...options,fallback:'stageplot',extension:extensions[format]});
  }

  function normalizePngOptions(value={}) {
    if(!plainObject(value))throw new TypeError('PNG-Optionen müssen ein Objekt sein.');
    const scale=value.scale===undefined?2:Number(value.scale);
    const background=value.background===undefined?'white':String(value.background);
    if(!PNG_SCALES.includes(scale))throw new Error('PNG-Exporte sind nur in 2× oder 4× möglich.');
    if(!PNG_BACKGROUNDS.includes(background))throw new Error('Der PNG-Hintergrund muss weiß oder transparent sein.');
    return {scale,background};
  }

  function createPngPlan(dimensions,options={}) {
    if(!plainObject(dimensions))throw new TypeError('SVG-Maße müssen ein Objekt sein.');
    const width=Number(dimensions.width),height=Number(dimensions.height),png=normalizePngOptions(options);
    if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)throw new Error('Das SVG hat keine gültigen Exportmaße.');
    const pixelWidth=Math.ceil(width*png.scale),pixelHeight=Math.ceil(height*png.scale),pixels=pixelWidth*pixelHeight;
    if(pixelWidth>16384||pixelHeight>16384||pixels>100000000)throw new RangeError('Der PNG-Export wäre zu groß. Bitte 2× wählen oder die Ausgabe verkleinern.');
    return {mimeType:'image/png',sourceWidth:width,sourceHeight:height,scale:png.scale,pixelWidth,pixelHeight,background:png.background,backgroundColor:png.background==='white'?'#ffffff':null,fillBackground:png.background==='white',imageSmoothingEnabled:true,imageSmoothingQuality:'high'};
  }

  function svgDimensions(svgText) {
    if(typeof svgText!=='string'||svgText.length===0||svgText.length>10000000)throw new Error('Das SVG ist leer oder zu groß.');
    const root=svgText.match(/^\s*(?:<\?xml[^>]*>\s*)?<svg\b([^>]*)>/i);
    if(!root)throw new Error('Die Datei enthält kein SVG.');
    const attrs=root[1],attribute=name=>{
      const match=attrs.match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(["\\\'])(.*?)\\1','i'));
      return match?match[2]:null;
    };
    const viewBox=attribute('viewBox');
    if(viewBox){
      const values=viewBox.trim().split(/[\s,]+/).map(Number);
      if(values.length===4&&values.every(Number.isFinite)&&values[2]>0&&values[3]>0)return {width:values[2],height:values[3],viewBox:values};
    }
    const numeric=value=>value&&/^\s*\d+(?:\.\d+)?(?:px)?\s*$/i.test(value)?Number.parseFloat(value):NaN;
    const width=numeric(attribute('width')),height=numeric(attribute('height'));
    if(width>0&&height>0)return {width,height,viewBox:null};
    throw new Error('Das SVG hat weder eine gültige viewBox noch feste Maße.');
  }

  function createPngPlanFromSvg(svgText,options={}) {
    return createPngPlan(svgDimensions(svgText),options);
  }

  return {SETUP_KIND,SETUP_VERSION,PNG_SCALES:[...PNG_SCALES],PNG_BACKGROUNDS:[...PNG_BACKGROUNDS],safeFilename,filenameFor,basicNormalizeSetupDocument,createSetupExport,normalizeSetupExport,parseSetupJson,stringifySetupJson,normalizePngOptions,svgDimensions,createPngPlan,createPngPlanFromSvg};
}

if(typeof module!=='undefined'&&module.exports)module.exports={createStageplotExportV42};
