(function (global) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const normalized = value => String(value || '').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sourceId = row => String(row?.sourceKey || '').split(':')[0];
  const baseName = name => String(name || '').replace(/\s*(?:·\s*)?[LR]$/, '');
  const pickupName = kind => ({Mic:'Mikrofon', DI:'DI-Box', Direct:'Direktausgang', Digital:'Digital'}[kind] || 'Abnahme');
  const pickupKind = row => row.pickup || (row.mode === 'DI' ? 'DI' : row.signalType === 'Mic' ? 'Mic' : row.signalType === 'Digital' ? 'Digital' : 'Direct');
  const kindName = kind => ({iem:'IEM', monitor:'Wedge', line:'Line'}[kind] || 'Line');
  const monitorKind = (row, object) => row.outputKind || (row.iemMode || row.iemGroup || ['rack','iem-earphones'].includes(object?.type) ? 'iem' : object?.type === 'wedge' ? 'monitor' : 'line');
  const attrs = values => Object.entries(values).filter(([, value]) => value !== undefined && value !== null).map(([key,value]) => ' ' + key + '="' + esc(value) + '"').join('');
  const pencil = '<span class="rw-pencil" aria-hidden="true">✎</span>';
  const idsOf = rows => rows.map(row => row.id).join('|');
  const splitIds = value => String(value || '').split('|').filter(Boolean);

  function create(host, api) {
    if (!host || !api?.getState || !api?.dispatch) throw new Error('Routing-Arbeitsbereich benötigt Host und Datenzugriff.');
    let state, sources = [], monitors = [], activeSource = '', activeMonitor = '', activeBox = '', activePort = null;
    let query = '', micQuery = '', openCard = '', pickerBox = '', error = '', destroyed = false, frame = 0, lastTab = '', toolsOpen = false, stageboxLayout = 'grid', pendingField = null;
    let stageObserver = null, resizeTarget = null, highlighted = [];
    host.classList.add('sp-routing-workspace-v2');

    const object = id => (state.objects || []).find(item => item.id === id);
    const route = (id, direction = 'inputs') => (state.routing?.[direction] || []).find(item => item.id === id);
    const box = id => (state.boxes || []).find(item => item.id === id);
    const device = id => (state.routing?.devices || []).find(item => item.id === id);
    const diChannels = item => Math.max(1, Number(item?.channels || item?.channelCount) || 1);
    const deviceName = item => item?.name || item?.model || item?.modelId || 'DI-Box';
    const diModel = item => (state.diModels || []).find(model => model.id === (item?.modelId || item?.id));
    const diDetails = item => (item.active ? 'Aktiv' + ({'48V':' · 48 V',battery:' · Batterie',external:' · Netzteil'}[item.power] || '') : 'Passiv') + ' · ' + diChannels(item) + (diChannels(item) === 1 ? ' Kanal' : ' Kanäle');
    const readonly = () => state.readonly === true;
    const icon = input => {
      if (!input) return '<span class="rw-art-fallback" aria-hidden="true">♪</span>';
      try { return api.objectIcon?.(input) || '<span class="rw-art-fallback" aria-hidden="true">♪</span>'; }
      catch (_) { return '<span class="rw-art-fallback" aria-hidden="true">♪</span>'; }
    };
    const micIcon = name => {
      try { return api.microphoneIcon?.(name) || '<span class="rw-art-fallback" aria-hidden="true">MIC</span>'; }
      catch (_) { return '<span class="rw-art-fallback" aria-hidden="true">MIC</span>'; }
    };
    const diPhoto = item => {
      const model = diModel(item);
      return model?.photo ? '<img class="rw-di-product-photo" src="' + esc(model.photo) + '" alt="' + esc(model.photoAlt || model.name) + '" loading="lazy" decoding="async">' : '<span class="rw-di-custom">' + (item ? 'Eigene DI' : 'DI') + '</span>';
    };
    const art = (content, extra = '') => '<div class="rw-art ' + extra + '" aria-hidden="true">' + content + '</div>';
    const button = (text, data = {}, options = {}) => '<button type="button" class="rw-button ' + (options.className || '') + '"' + attrs(data) + (options.disabled || options.mutation && readonly() ? ' disabled' : '') + (options.pressed !== undefined ? ' aria-pressed="' + String(options.pressed) + '"' : '') + '>' + text + '</button>';
    const field = (label, value, data, options = {}) => '<label class="rw-field' + (options.className ? ' ' + options.className : '') + '"><span>' + esc(label) + '</span><input' + attrs({'data-rw-focus':options.focus || JSON.stringify(data), ...data, type:options.type || 'text', value:value ?? '', maxlength:options.maxlength || 100, min:options.min, max:options.max, placeholder:options.placeholder, 'aria-label':label, autocomplete:'off'}) + (readonly() ? ' readonly' : '') + '></label>';
    const heading = (title, detail = '') => '<div class="rw-view-heading"><h2>' + esc(title) + '</h2>' + detail + '</div>';
    const cardHead = (title, key, content) => '<div class="rw-card-title"><span>' + esc(title) + '</span>' + (key && !readonly() ? button(pencil, {'data-rw-open':key,'aria-label':title + ' bearbeiten','aria-expanded':String(openCard === key)}, {className:'rw-edit'}) : '') + '</div>' + content;
    const monoLabel = rows => rows.length > 1 && rows.every(row => row.stereoGroup && row.stereoGroup === rows[0].stereoGroup) ? 'Stereo' : rows.length === 2 ? 'Dual-Mono' : rows.length > 2 ? rows.length + ' Signale' : 'Mono';
    const connected = rows => rows.filter(row => row.stagebox && row.stageboxPort || row.connector === 'Dante' && String(object(sourceId(row))?.playback?.target || '').trim()).length;
    const stereoRows = (rows, direction) => {
      const groups = new Set(rows.map(row => row.stereoGroup).filter(Boolean));
      const members = (state.routing[direction] || []).filter(row => rows.some(selected => selected.id === row.id) || groups.has(row.stereoGroup));
      return members.length === 2 && members[0].stereoGroup && members[0].stereoGroup === members[1].stereoGroup ? members.slice().sort((a,b) => Number(a.mode === 'Stereo R') - Number(b.mode === 'Stereo R')) : rows;
    };

    function groups() {
      const inputs = state.routing?.inputs || [], outputs = state.routing?.outputs || [], map = new Map();
      for (const row of inputs) {
        const id = sourceId(row) || row.id, source = object(id);
        if (!map.has(id)) map.set(id, {id, object:source, name:source?.label || state.catalog?.[source?.type]?.short || baseName(row.generatedInstrument || row.instrument) || 'Signal', rows:[]});
        map.get(id).rows.push(row);
      }
      for (const source of state.objects || []) {
        if (!map.has(source.id) && state.catalog?.[source.type]?.instrument && !/^di(?:-|$)/.test(source.type)) {
          const count = source.io?.outputs?.count;
          if (count !== 0) map.set(source.id, {id:source.id, object:source, name:source.label || state.catalog[source.type].short || 'Instrument', rows:[]});
        }
      }
      sources = [...map.values()];
      const monitorMap = new Map();
      for (const row of outputs) {
        const source = object(sourceId(row)), kind = monitorKind(row, source), id = row.stereoGroup || row.iemGroup || row.id;
        if (!monitorMap.has(id)) monitorMap.set(id, {id, name:row.iemName || baseName(row.instrument) || 'Monitorweg', object:source, kind, rows:[]});
        monitorMap.get(id).rows.push(row);
      }
      monitors = [...monitorMap.values()];
      if (!sources.some(item => item.id === activeSource)) activeSource = sources[0]?.id || '';
      if (!monitors.some(item => item.id === activeMonitor)) activeMonitor = monitors[0]?.id || '';
      if (!(state.boxes || []).some(item => item.id === activeBox)) { activeBox = state.boxes?.[0]?.id || ''; activePort = null; }
    }

    function doAction(action, options = {}) {
      if (readonly() && !['selectTab','exportPatch','pdf','xlsx'].includes(action.type)) return;
      try {
        error = '';
        const result = api.dispatch(action);
        if (result?.then) throw new Error('Routing-Änderungen müssen lokal und synchron gespeichert werden.');
        if (options.close) openCard = '';
        render();
        return result;
      } catch (exception) {
        error = exception?.message || 'Änderung nicht möglich.';
        api.announce?.(error);
        render();
        return false;
      }
    }

    function header() {
      const inputs = state.routing.inputs || [], outputs = state.routing.outputs || [], selectedRows = state.tab === 'outputs' ? outputs : inputs;
      const boxCount = (state.boxes || []).length, total = selectedRows.length, patched = connected(selectedRows), summary = state.tab === 'stageboxes' ? boxCount + (boxCount === 1 ? ' Stagebox · ' : ' Stageboxen · ') + connected([...inputs,...outputs]) + ' Verbindungen' : state.tab === 'outputs' ? monitors.length + ' Monitorwege · ' + outputs.length + ' Ausgänge' : total + ' Signale · ' + patched + ' verbunden' + (total > patched ? ' · ' + (total - patched) + ' offen' : '');
      return '<header class="rw-header"><div class="rw-title-row"><h1>Routing</h1>' + button('Werkzeuge',{'data-rw-tools':'true','aria-expanded':String(toolsOpen)},{className:'rw-tools-button'}) + '</div><div class="rw-navigation-row"><nav class="rw-tabs" role="tablist" aria-label="Routing-Bereiche">' + [['inputs','Quellen'],['outputs','Monitoring'],['stageboxes','Stagebox']].map(([tab,label]) => '<button type="button" role="tab" data-rw-tab="' + tab + '" aria-selected="' + String(state.tab === tab) + '" aria-controls="sp-routing-detail-v2">' + label + '</button>').join('') + '</nav><span class="rw-summary">' + esc(summary) + '</span></div>' + (toolsOpen ? '<div class="rw-tools" role="group" aria-label="Routing-Werkzeuge">' + (!readonly() ? [['undo','↶ Rückgängig'],['redo','↷ Wiederholen'],['number','Freie Kanalnummern'],['autoPatch','Automatisch verbinden'],['csvImport','CSV importieren']].map(([action,label]) => button(label,{'data-rw-tool':action},{mutation:true})).join('') : '') + [['pdf','PDF / Drucken'],['xlsx','XLSX']].map(([action,label]) => button(label,{'data-rw-tool':action})).join('') + button('CSV exportieren',{'data-rw-export':state.tab === 'stageboxes' ? 'all' : state.tab}) + '</div>' : '') + '</header>';
    }

    function sidebar() {
      const tab = state.tab, stageboxTab = tab === 'stageboxes', monitoring = tab === 'outputs';
      const items = stageboxTab ? state.boxes || [] : monitoring ? monitors : sources;
      const title = stageboxTab ? 'Stageboxen' : monitoring ? 'Monitorwege' : 'Instrumente';
      const filtered = items.filter(item => normalized([item.name, ...(item.rows || []).map(row => row.instrument)].join(' ')).includes(normalized(query)));
      const rows = filtered.map(item => {
        const selected = item.id === (stageboxTab ? activeBox : monitoring ? activeMonitor : activeSource);
        const related = stageboxTab ? [...(state.routing.inputs || []), ...(state.routing.outputs || [])].filter(row => row.stagebox === item.id && row.stageboxPort) : item.rows;
        const total = related.length, linked = stageboxTab ? total : connected(related), complete = stageboxTab || total > 0 && linked === total;
        const subtitle = stageboxTab ? (state.routing.inputs || []).filter(row => row.stagebox === item.id && row.stageboxPort).length + '/' + item.inputs + ' In · ' + (state.routing.outputs || []).filter(row => row.stagebox === item.id && row.stageboxPort).length + '/' + item.outputs + ' Out' : monitoring ? kindName(item.kind) + ' · ' + (item.rows.length > 1 && item.rows[0].stereoGroup ? 'Stereo' : 'Mono') : total ? total + (total === 1 ? ' Signal' : ' Signale') + (monoLabel(item.rows) === 'Stereo' ? ' · Stereo' : '') : 'Noch keine Abnahme';
        return '<button type="button" class="rw-list-item"' + attrs({'data-rw-select':item.id,'aria-pressed':String(selected)}) + '><span class="rw-list-art">' + icon(stageboxTab ? item.type : item.object || (monitoring ? item.kind === 'monitor' ? 'wedge' : 'rack' : 'mic')) + '</span><span class="rw-list-copy"><strong>' + esc(item.name) + '</strong><small>' + esc(subtitle) + '</small></span><span class="rw-state-dot" data-complete="' + complete + '" aria-label="' + (complete ? 'Verbunden' : linked + ' von ' + total + ' verbunden') + '">' + (complete ? '✓' : '•') + '</span></button>';
      }).join('');
      let add = '';
      if (!readonly() && (stageboxTab || monitoring)) {
        const key = stageboxTab ? 'add-box' : 'add-monitor';
        add = '<div class="rw-sidebar-add">' + button('<span aria-hidden="true">＋</span> ' + (stageboxTab ? 'Stagebox' : 'Monitorweg'), {'data-rw-open':key,'aria-expanded':String(openCard === key)}, {className:'rw-add',mutation:true});
        if (openCard === key) add += '<div class="rw-inline-choices">' + (stageboxTab ? Object.values(state.catalog || {}).filter(item => /^stagebox-/.test(item.id)).map(item => button(icon(item.id) + '<span>' + esc(item.short || item.name) + '</span>', {'data-rw-add-box':item.id}, {className:'rw-model-tile',mutation:true})).join('') : ['iem','monitor','line'].map(kind => button(kindName(kind), {'data-rw-add-monitor':kind}, {mutation:true})).join('')) + '</div>';
        add += '</div>';
      }
      return '<aside class="rw-sidebar"><div class="rw-sidebar-heading"><h2>' + title + '</h2><label class="rw-search"><span aria-hidden="true">⌕</span><input type="search" data-rw-search data-rw-focus="source-search" value="' + esc(query) + '" placeholder="Suchen" aria-label="' + title + ' suchen" autocomplete="off"></label></div><div class="rw-source-list">' + (rows || '<p class="rw-empty-small">' + (query ? 'Keine Treffer.' : 'Noch keine ' + title + '.') + '</p>') + add + '</div><figure class="rw-minimap-wrap"><div class="rw-minimap" data-rw-stage id="sp-routing-minimap"></div><figcaption>Bühne · Draufsicht</figcaption></figure></aside>';
    }

    function ports(direction, selectedBox, selectedRows = [], purpose = 'patch') {
      if (!selectedBox) return '<p class="rw-empty-small">Noch keine Stagebox auf der Bühne.</p>';
      const count = selectedBox[direction] || 0, selectedIds = new Set(selectedRows.map(row => row.id));
      const assigned = new Map((state.routing[direction] || []).filter(row => row.stagebox === selectedBox.id && row.stageboxPort).map(row => [Number(row.stageboxPort), row]));
      return '<div class="rw-port-grid" data-port-purpose="' + purpose + '">' + Array.from({length:count}, (_, index) => {
        const port = index + 1, occupant = assigned.get(port), selected = purpose === 'overview' ? activePort?.boxId === selectedBox.id && activePort.direction === direction && activePort.port === port : !!occupant && selectedIds.has(occupant.id);
        const pair = selectedRows.length > 1, conflict = purpose === 'patch' && (Array.from({length:pair ? selectedRows.length : 1}, (_, offset) => assigned.get(port + offset)).some(row => row && !selectedIds.has(row.id)) || port + selectedRows.length - 1 > count);
        const attrsForPort = purpose === 'overview' ? {'data-rw-port':port,'data-rw-box':selectedBox.id,'data-rw-direction':direction} : {'data-rw-patch':port,'data-rw-box':selectedBox.id,'data-rw-direction':direction,'data-rw-rows':idsOf(selectedRows)};
        const stereo = occupant?.stereoGroup, paired = stereo && [...assigned.values()].some(row => row.id !== occupant.id && row.stereoGroup === stereo), side = occupant?.mode === 'Stereo R' ? 'right' : 'left';
        return '<button type="button" class="rw-port"' + attrs({...attrsForPort,'data-used':String(!!occupant),'data-selected':String(selected),'data-stereo':paired ? side : undefined,'aria-pressed':String(selected),'aria-label':(direction === 'inputs' ? 'Eingang ' : 'Ausgang ') + port + ' · ' + (occupant?.instrument || 'Frei') + (conflict ? ' · belegt' : '')}) + (conflict || purpose === 'patch' && readonly() ? ' disabled' : '') + '><span class="rw-port-number">' + String(port).padStart(2,'0') + '</span>' + (purpose === 'overview' ? '<span class="sp-stagebox-socket" aria-hidden="true"></span>' : '') + (occupant?.phantom ? '<span class="rw-port-phantom">48 V</span>' : '') + '<span class="rw-port-name">' + esc(occupant?.instrument?.replace(/^Drums\s*·\s*/, '') || 'Frei') + '</span>' + (paired ? '<span class="rw-stereo-mark" aria-label="Stereo-Paar">' + (side === 'left' ? 'L' : 'R') + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }

    function patchEditor(rows, direction, key) {
      if (openCard !== key || readonly()) return '';
      const boxes = (state.boxes || []).filter(item => item[direction] > 0);
      const chosen = boxes.find(item => item.id === pickerBox) || boxes.find(item => item.id === rows[0]?.stagebox) || boxes[0];
      return '<div class="rw-card-editor"><div class="rw-choice-row" role="group" aria-label="Stagebox wählen">' + boxes.map(item => button(esc(item.name), {'data-rw-picker-box':item.id}, {pressed:item.id === chosen?.id})).join('') + '</div>' + ports(direction, chosen, rows) + (rows.some(row => row.stagebox) ? button('Verbindung lösen', {'data-rw-unpatch':idsOf(rows),'data-rw-direction':direction}, {className:'rw-quiet-danger',mutation:true}) : '') + '</div>';
    }

    function patchCard(rows, direction, suffix = '') {
      const key = 'patch-' + direction + '-' + idsOf(rows) + suffix, first = rows[0], assignedBox = box(first?.stagebox), linked = rows.length > 1;
      if (direction === 'inputs' && first?.connector === 'Dante') {
        const source = object(sourceId(first));
        return '<article class="rw-card rw-patch-card">' + cardHead('Anschluss',null,art(icon(source || 'laptop'))) + '<strong class="rw-network-label">Dante · Netzwerk</strong><p class="rw-card-meta">RJ45 · CAT5e / CAT6</p><p class="rw-card-meta">' + esc(source?.playback?.target || 'Ziel noch offen') + '</p>' + (source?.type === 'laptop' && !readonly() ? button('Playback-Setup',{'data-rw-playback':source.id},{mutation:true}) : '') + '</article>';
      }
      const locations = [...new Set(rows.map(row => box(row.stagebox)?.name).filter(Boolean))].join(' / ');
      const patchRows = stereoRows(rows,direction);
      return '<article class="rw-card rw-patch-card" data-rw-card="' + esc(key) + '">' + cardHead(direction === 'inputs' ? 'Anschluss' : 'Ausgänge', key, art(icon(assignedBox?.type || 'stagebox-16'), 'rw-stagebox-art')) + button(esc(locations || 'Stagebox wählen') + pencil, {'data-rw-open':key,'aria-expanded':String(openCard === key)}, {className:'rw-card-value',mutation:true}) + '<div class="rw-port-pills">' + rows.map((row,index) => button(esc((direction === 'inputs' ? 'IN ' : 'OUT ') + (row.stageboxPort ? String(row.stageboxPort).padStart(2,'0') : '—') + (linked ? index === 0 ? ' · L' : ' · R' : row.stereoGroup ? row.mode === 'Stereo R' ? ' · R' : ' · L' : '')), {'data-rw-open':key,'aria-expanded':String(openCard === key)}, {className:row.stageboxPort ? 'rw-connected' : '',mutation:true})).join('') + '</div>' + (openCard === key && patchRows.length > 1 ? '<p class="rw-card-meta">Stereo · L / R · erste Buchse wählen</p>' : '') + patchEditor(patchRows, direction, key) + '</article>';
    }

    function diPortButtons(row, item, compact = false) {
      const rows = state.routing.inputs || [];
      return '<div class="rw-di-ports" role="group" aria-label="Anschlüsse der DI-Box">' + Array.from({length:diChannels(item)}, (_, index) => {
        const channel = index + 1, occupant = rows.find(other => other.diDeviceId === item.id && Number(other.diChannel) === channel), chosen = occupant?.id === row.id;
        return button('<b>' + channel + '</b><span>' + esc(occupant ? baseName(occupant.instrument) : 'Frei') + '</span>', {'data-rw-di-device':item.id,'data-rw-di-channel':channel,'data-rw-row':row.id,'aria-label':deviceName(item) + ' Kanal ' + channel + ' · ' + (occupant?.instrument || 'Frei')}, {className:(compact ? 'rw-di-port-compact ' : '') + (chosen ? 'rw-connected' : ''),pressed:chosen,disabled:!!occupant && !chosen,mutation:true});
      }).join('') + '</div>';
    }

    function diEditor(row) {
      const chosen = device(row.diDeviceId), devices = state.routing.devices || [], models = state.diModels || [];
      const existing = devices.length ? '<h4>Vorhandene DI-Box</h4><div class="rw-existing-di-list">' + devices.map(item => '<div class="rw-existing-di"><span class="rw-existing-di-art">' + diPhoto(item) + '</span><strong>' + esc(deviceName(item)) + '</strong><small>' + esc(diDetails(item)) + '</small>' + diPortButtons(row,item) + '</div>').join('') + '</div>' : '';
      const modelTile = item => button('<span class="rw-model-art">' + diPhoto(item) + '</span><strong>' + esc(item.name) + '</strong><small>' + esc(diDetails(item)) + '</small>', {'data-rw-create-di':item.id,'data-rw-row':row.id}, {className:'rw-model-tile',mutation:true});
      const modelChoices = [['Modelle',models.filter(item => item.id !== 'custom' && !item.id.startsWith('generic-'))],['Generisch',models.filter(item => item.id.startsWith('generic-'))]].filter(([,items]) => items.length).map(([title,items]) => '<section class="rw-di-model-group"><h4>' + title + '</h4><div class="rw-model-grid">' + items.map(modelTile).join('') + '</div></section>').join('');
      const customChoice = models.some(item => item.id === 'custom') ? button('＋ Eigene DI',{'data-rw-create-di':'custom','data-rw-row':row.id},{className:'rw-custom-di',mutation:true}) : '';
      let settings = '';
      if (chosen) {
        const custom = chosen.modelId === 'custom';
        settings = field('Gerätename', chosen.name, {'data-rw-device-field':'name','data-rw-device':chosen.id}, {maxlength:80});
        if (custom) {
          settings += '<div class="rw-choice-row" role="group" aria-label="DI-Kanäle">' + [1,2].map(count => button(count === 1 ? '1 Kanal' : '2 Kanäle', {'data-rw-device-value':'channels','data-rw-device':chosen.id,'data-rw-value':count}, {pressed:diChannels(chosen) === count,mutation:true})).join('') + '</div>';
          settings += '<div class="rw-choice-row" role="group" aria-label="DI-Bauart">' + [false,true].map(active => button(active ? 'Aktiv' : 'Passiv', {'data-rw-device-value':'active','data-rw-device':chosen.id,'data-rw-value':String(active)}, {pressed:!!chosen.active === active,mutation:true})).join('') + '</div>';
        }
        if (chosen.active && (custom || diModel(chosen)?.configurablePower)) {
          settings += '<div class="rw-choice-row" role="group" aria-label="DI-Stromversorgung">' + [['48V','48 V'],['battery','Batterie'],['external','Netzteil']].map(([value,label]) => button(label, {'data-rw-device-value':'power','data-rw-device':chosen.id,'data-rw-value':value}, {pressed:chosen.power === value,mutation:true})).join('') + '</div>';
        }
        settings = '<div class="rw-device-fields">' + settings + '</div>';
      }
      return '<div class="rw-editor-section">' + existing + '<div class="rw-di-model-options" role="region" aria-label="DI-Modelle" tabindex="0">' + modelChoices + '</div>' + customChoice + settings + '</div>';
    }

    function microphoneChoices(row) {
      let microphones = state.microphones || [];
      if (!Array.isArray(microphones)) microphones = Object.values(microphones);
      const queryText = normalized(micQuery);
      return microphones.filter(item => normalized([item.name,item.type,item.brand].join(' ')).includes(queryText)).map(item => button('<span class="rw-mic-photo">' + micIcon(item.name) + '</span><strong>' + esc(item.name) + '</strong><small>' + esc(item.type || '') + (item.phantom ? ' · 48 V' : '') + '</small>', {'data-rw-mic':item.name,'data-rw-row':row.id,'data-rw-phantom':String(!!item.phantom)}, {className:'rw-model-tile',pressed:row.microphone === item.name,mutation:true})).join('') || '<p class="rw-empty-small">Kein passendes Mikrofon.</p>';
    }

    function pickupCard(row) {
      const key = 'pickup-' + row.id, kind = pickupKind(row), di = device(row.diDeviceId), title = kind === 'DI' ? deviceName(di) : kind === 'Mic' ? row.microphone || 'Mikrofon wählen' : pickupName(kind);
      const picture = kind === 'Mic' ? micIcon(row.microphone) : kind === 'DI' ? diPhoto(di) : icon(object(sourceId(row)) || 'laptop');
      let editor = '';
      if (openCard === key && !readonly()) {
        editor = '<div class="rw-card-editor"><div class="rw-choice-row rw-pickup-types" role="group" aria-label="Abnahmeart">' + ['Mic','DI','Direct','Digital'].map(value => button(pickupName(value), {'data-rw-pickup':value,'data-rw-row':row.id}, {pressed:kind === value,mutation:true})).join('') + '</div>' + (kind === 'DI' ? diEditor(row) : kind === 'Mic' ? '<label class="rw-search"><span aria-hidden="true">⌕</span><input type="search" data-rw-mic-search data-rw-focus="mic-search-' + esc(row.id) + '" data-rw-row="' + esc(row.id) + '" value="' + esc(micQuery) + '" placeholder="Mikrofon suchen" aria-label="Mikrofon suchen" autocomplete="off"></label><div class="rw-model-grid rw-mic-options" data-rw-mic-options>' + microphoneChoices(row) + '</div>' + field('Eigenes Mikrofon', row.microphone, {'data-rw-channel-field':'microphone','data-rw-row':row.id,'data-rw-direction':'inputs'}) : '<div class="rw-choice-row" role="group" aria-label="Anschlussart">' + (kind === 'Digital' ? ['Dante','MADI','USB','Digital'] : ['XLR','Klinke']).map(connector => button(connector, {'data-rw-connector':connector,'data-rw-row':row.id}, {pressed:row.connector === connector,mutation:true})).join('') + '</div>') + button('Abnahme entfernen', {'data-rw-remove-pickup':row.id}, {className:'rw-quiet-danger',mutation:true}) + '</div>';
      }
      return '<article class="rw-card rw-pickup-card" data-rw-row-card="' + esc(row.id) + '">' + cardHead('Abnahme', key, art(picture, kind === 'Mic' ? 'rw-microphone-art' : '')) + button(esc(title) + pencil, {'data-rw-open':key,'aria-expanded':String(openCard === key)}, {className:'rw-card-value',mutation:true}) + '<p class="rw-card-meta">' + esc(kind === 'DI' && di ? diDetails(di) : pickupName(kind)) + '</p>' + (kind === 'DI' && di ? diPortButtons(row,di,true) : '') + (kind === 'Mic' || kind === 'DI' && (!di || di.power === '48V') ? button('<span class="rw-phantom-dot" aria-hidden="true"></span> 48 V' + (kind === 'DI' && di?.power === '48V' ? ' benötigt' : ''), {'data-rw-toggle-phantom':row.id,'aria-label':'48 V für ' + row.instrument}, {className:'rw-phantom',pressed:!!row.phantom,disabled:kind === 'DI' && !!di,mutation:true}) : '') + editor + '</article>';
    }

    function channelCard(row, direction = 'inputs') {
      return '<article class="rw-card rw-channel-card">' + cardHead('Kanal', null, '<div class="rw-channel-emblem" aria-hidden="true"><small>' + (direction === 'inputs' ? 'CH' : 'BUS') + '</small><strong>' + esc(row.number ? String(row.number).padStart(2,'0') : '—') + '</strong></div>') + field('Kanalnummer',row.number,{'data-rw-channel-field':'number','data-rw-row':row.id,'data-rw-direction':direction},{type:'number',min:1,max:999,placeholder:'—',className:'rw-number-field'}) + field('Kanalname',row.instrument,{'data-rw-channel-field':'instrument','data-rw-row':row.id,'data-rw-direction':direction}) + '<p class="rw-card-meta">' + esc(row.stereoGroup ? row.mode === 'Stereo R' ? 'Stereo · R' : 'Stereo · L' : 'Mono') + '</p></article>';
    }

    const arrow = (stereo = false) => '<div class="rw-arrow' + (stereo ? ' rw-arrow-stereo' : '') + '" aria-hidden="true">' + (stereo ? '<span><small>L</small>→</span><span><small>R</small>→</span>' : '<span>→</span>') + '</div>';

    function sourceFlow(group, onlyRow = null) {
      const rows = onlyRow ? [onlyRow] : group.rows, count = rows.length, linked = count > 1 && monoLabel(rows) === 'Stereo';
      const sourceCard = '<article class="rw-card rw-source-card" style="grid-row:2 / ' + (count + 2) + '">' + cardHead('Quelle', null, art(icon(group.object))) + field('Instrument',group.name,{'data-rw-source-field':'label','data-rw-source':group.id},{maxlength:42}) + '<p class="rw-card-meta">' + count + (count === 1 ? ' Abnahme' : ' Abnahmen') + '</p></article>';
      let markup = '<div class="rw-flow-scroll"><div class="rw-source-flow" data-row-count="' + count + '"><span class="rw-column-title rw-column-source">Quelle</span><span class="rw-column-title rw-column-pickup">Abnahme</span><span class="rw-column-title rw-column-patch">Anschluss</span><span class="rw-column-title rw-column-channel">Kanal</span>' + sourceCard;
      rows.forEach((row,index) => {
        const gridRow = index + 2;
        markup += '<div class="rw-branch" data-branch="' + (count === 1 ? 'single' : index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle') + '" style="grid-row:' + gridRow + '" aria-hidden="true"><span>→</span></div><div class="rw-flow-pickup" style="grid-row:' + gridRow + '">' + pickupCard(row) + '</div><div class="rw-flow-arrow-one" style="grid-row:' + gridRow + '">' + arrow() + '</div><div class="rw-flow-patch" style="grid-row:' + gridRow + '">' + patchCard([row],'inputs') + '</div><div class="rw-flow-arrow-two" style="grid-row:' + gridRow + '">' + arrow() + '</div><div class="rw-flow-channel" style="grid-row:' + gridRow + '">' + channelCard(row) + '</div>';
      });
      if (!onlyRow && !readonly()) markup += '<div class="rw-add-pickup" style="grid-row:' + (count + 2) + '">' + button('＋ Weitere Abnahme',{'data-rw-add-pickup':group.id},{className:'rw-add',mutation:true}) + '</div>';
      markup += '</div></div>';
      if (!onlyRow && count >= 2 && !readonly()) markup += '<div class="rw-format-controls" role="group" aria-label="Kanalformat">' + button('Unabhängig · Dual-Mono',{'data-rw-unlink':idsOf(rows)},{pressed:!linked,mutation:true}) + (count === 2 ? button('Stereo · L / R',{'data-rw-link':idsOf(rows)},{pressed:linked,mutation:true}) : '') + '</div>';
      return markup;
    }

    function notes(rows, direction) {
      if (!rows.length) return '';
      const ids = idsOf(rows), first = rows[0];
      return '<label class="rw-notes"><span>Notiz für die Technik</span><textarea rows="2" maxlength="240" data-rw-notes="' + esc(ids) + '" data-rw-direction="' + direction + '" data-rw-focus="notes-' + esc(ids) + '" placeholder="' + (direction === 'outputs' ? 'Monitormix, besondere Wünsche …' : 'Mikrofonposition, Hinweise …') + '"' + (readonly() ? ' readonly' : '') + '>' + esc(first.notes) + '</textarea></label>';
    }

    function sourcesView() {
      const group = sources.find(item => item.id === activeSource);
      if (!group) return '<div class="rw-empty"><strong>Noch keine Quellen</strong><p>Instrumente auf der Bühne erscheinen hier mit ihren Abnahmen.</p></div>';
      highlighted = group.object ? [group.object.id] : [];
      return heading(group.name, '<span class="rw-format-badge">' + (group.rows.length ? monoLabel(group.rows) : 'Offen') + '</span>') + (group.rows.length ? sourceFlow(group) + notes(group.rows,'inputs') : '<div class="rw-empty"><strong>Abnahme hinzufügen</strong><div class="rw-choice-row">' + ['Mic','DI','Direct'].map(kind => button(pickupName(kind),{'data-rw-first-pickup':kind,'data-rw-source':group.id},{mutation:true})).join('') + '</div></div>');
    }

    function monitorView(group = monitors.find(item => item.id === activeMonitor), embedded = false) {
      if (!group) return '<div class="rw-empty"><strong>Noch keine Monitorwege</strong><p>Lege links einen IEM-, Wedge- oder Line-Weg an.</p></div>';
      const rows = group.rows, first = rows[0], stereo = rows.length > 1 && !!first.stereoGroup, ids = idsOf(rows), kind = group.kind, transport = first.iemTransport || 'wireless';
      if (!embedded) highlighted = [...new Set([group.object?.id,...rows.map(row => row.stagebox)].filter(Boolean))];
      const mode = '<span class="rw-format-badge">' + kindName(kind) + '</span><div class="rw-choice-row rw-heading-choices" role="group" aria-label="Monitorformat">' + ['mono','stereo'].map(format => button(format === 'mono' ? 'Mono' : 'Stereo',{'data-rw-monitor-format':format,'data-rw-rows':ids},{pressed:stereo === (format === 'stereo'),mutation:true})).join('') + '</div>';
      const mix = '<article class="rw-card rw-mix-card">' + cardHead('Mix',null,art(icon('mixer-wing-compact'))) + field('Mixname',group.name,{'data-rw-monitor-field':'name','data-rw-rows':ids}) + '<div class="rw-bus-fields">' + rows.map((row,index) => field(stereo ? index === 0 ? 'Bus · L' : 'Bus · R' : 'Bus',row.number,{'data-rw-channel-field':'number','data-rw-row':row.id,'data-rw-direction':'outputs'},{type:'number',min:1,max:999,placeholder:'—'})).join('') + '</div><p class="rw-card-meta">' + (stereo ? 'L / R' : 'Mono') + '</p></article>';
      const equipment = '<article class="rw-card rw-monitor-device">' + cardHead('Gerät',null,art(icon(kind === 'monitor' ? 'wedge' : kind === 'iem' ? 'rack' : group.object || 'rack'))) + '<div class="rw-choice-row" role="group" aria-label="Monitorgerät">' + ['iem','monitor','line'].map(value => button(kindName(value),{'data-rw-monitor-kind':value,'data-rw-rows':ids},{pressed:kind === value,mutation:true})).join('') + '</div>' + field(kind === 'iem' ? transport === 'wireless' ? 'IEM-Sender' : 'Kopfhörerverstärker' : 'Modell',first.monitorDeviceName || '',{'data-rw-monitor-field':'monitorDeviceName','data-rw-rows':ids},{placeholder:'Gerätename'}) + (kind === 'iem' ? '<div class="rw-choice-row" role="group" aria-label="IEM-Übertragung">' + [['wireless','Funk'],['cable','Kabel']].map(([value,label]) => button(label,{'data-rw-monitor-value':'iemTransport','data-rw-value':value,'data-rw-rows':ids},{pressed:transport === value,mutation:true})).join('') + '</div>' + (transport === 'wireless' ? field('Frequenz',first.frequencyBand,{'data-rw-monitor-field':'frequencyBand','data-rw-rows':ids},{placeholder:'MHz'}) : '') : kind === 'monitor' ? '<div class="rw-choice-row" role="group" aria-label="Wedge-Bauart">' + [true,false].map(active => button(active ? 'Aktiv' : 'Passiv',{'data-rw-monitor-value':'monitorActive','data-rw-value':String(active),'data-rw-rows':ids},{pressed:(first.monitorActive !== false) === active,mutation:true})).join('') + '</div>' + (first.monitorActive === false ? field('Endstufe',first.monitorAmplifierName,{'data-rw-monitor-field':'monitorAmplifierName','data-rw-rows':ids},{placeholder:'Endstufenmodell'}) : '') : '') + '<p class="rw-card-meta">' + (stereo ? 'Stereo' : 'Mono') + '</p></article>';
      const recipient = '<article class="rw-card rw-monitor-recipient">' + cardHead(kind === 'iem' ? 'Empfänger' : 'Musiker',null,art(icon(kind === 'iem' ? 'iem-earphones' : group.object || 'wedge'))) + field('Musiker',first.monitorReceiverName || first.iemName || group.name,{'data-rw-monitor-field':'monitorReceiverName','data-rw-rows':ids}) + '<p class="rw-card-meta">' + (kind === 'iem' ? transport === 'wireless' ? 'Bodypack · ' : 'Kabel · ' : '') + (stereo ? 'Stereo' : 'Mono') + '</p></article>';
      const chosenBox = box(first.stagebox), compactPorts = chosenBox ? '<section class="rw-monitor-ports"><h3>' + esc(chosenBox.name) + ' · Ausgänge</h3>' + ports('outputs', chosenBox,rows) + '</section>' : '';
      return (embedded ? '' : heading(group.name,mode)) + '<div class="rw-flow-scroll"><div class="rw-monitor-flow">' + mix + arrow(stereo) + patchCard(rows,'outputs',embedded ? '-embedded' : '') + arrow(stereo) + equipment + arrow() + recipient + '</div></div>' + compactPorts + (embedded ? '' : notes(rows,'outputs'));
    }

    function stageboxView() {
      const selectedBox = box(activeBox);
      if (!selectedBox) return '<div class="rw-empty"><strong>Noch keine Stagebox</strong><p>Füge links eine Stagebox hinzu.</p></div>';
      if (!activePort) {
        const preferred = sources.find(item => item.id === activeSource)?.rows.find(row => row.stagebox === selectedBox.id && row.stageboxPort);
        const first = preferred || (state.routing.inputs || []).find(row => row.stagebox === selectedBox.id && row.stageboxPort) || (state.routing.outputs || []).find(row => row.stagebox === selectedBox.id && row.stageboxPort);
        if (first) activePort = {boxId:selectedBox.id,direction:(state.routing.inputs || []).includes(first) ? 'inputs' : 'outputs',port:Number(first.stageboxPort)};
      }
      highlighted = [selectedBox.id];
      const key = 'box-' + selectedBox.id, editing = openCard === key && !readonly();
      let content = heading(selectedBox.name, (!readonly() ? button(pencil,{'data-rw-open':key,'aria-label':'Stagebox bearbeiten','aria-expanded':String(editing)},{className:'rw-edit'}) : '') + '<div class="rw-choice-row rw-heading-choices" role="group" aria-label="Stagebox-Darstellung">' + [['grid','Buchsen'],['list','Liste']].map(([value,label]) => button(label,{'data-rw-box-layout':value},{pressed:stageboxLayout === value})).join('') + '</div>') + '<p class="rw-capacity">' + selectedBox.inputs + ' Eingänge · ' + selectedBox.outputs + ' Ausgänge</p>';
      if (editing) content += '<div class="rw-box-editor">' + field('Stagebox-Name',selectedBox.name,{'data-rw-box-field':'name','data-rw-box':selectedBox.id},{maxlength:42}) + '<div class="rw-choice-row" role="group" aria-label="Eingangsbuchsen">' + [false,true].map(combo => button(combo ? 'XLR / Klinke' : 'XLR',{'data-rw-combo':String(combo),'data-rw-box':selectedBox.id},{pressed:!!selectedBox.comboJacks === combo,mutation:true})).join('') + '</div></div>';
      for (const direction of ['inputs','outputs']) if (selectedBox[direction]) content += '<section class="rw-stagebox-section" data-rw-port-layout="' + stageboxLayout + '" data-combo-jacks="' + String(selectedBox.comboJacks === true) + '"><header><h3>' + (direction === 'inputs' ? 'Eingänge' : 'Ausgänge') + '</h3><span>' + (state.routing[direction] || []).filter(row => row.stagebox === selectedBox.id && row.stageboxPort).length + ' / ' + selectedBox[direction] + ' belegt</span></header>' + ports(direction,selectedBox,[],'overview') + '</section>';
      if (activePort?.boxId === selectedBox.id) {
        const direction = activePort.direction, occupied = (state.routing[direction] || []).find(row => row.stagebox === selectedBox.id && Number(row.stageboxPort) === activePort.port);
        content += '<section class="rw-selected-route"><h3>' + (direction === 'inputs' ? 'Eingang ' : 'Ausgang ') + String(activePort.port).padStart(2,'0') + '</h3>';
        if (occupied) {
          const source = sources.find(item => item.rows.some(row => row.id === occupied.id));
          const monitor = monitors.find(item => item.rows.some(row => row.id === occupied.id));
          content += direction === 'inputs' && source ? sourceFlow(source,occupied) : monitor ? monitorView(monitor,true) : channelCard(occupied,direction);
          if (!readonly()) content += button('Verbindung lösen',{'data-rw-unpatch':occupied.id,'data-rw-direction':direction},{className:'rw-quiet-danger',mutation:true});
        } else {
          content += '<div class="rw-open-port"><strong>Freie Buchse</strong>' + (readonly() ? '' : '<div class="rw-route-choices">' + (state.routing[direction] || []).filter(row => (!row.stagebox || !row.stageboxPort) && row.connector !== 'Dante' && (!row.stereoGroup || row.mode !== 'Stereo R')).map(row => {
            const members = stereoRows([row],direction), pair = members.length > 1, invalid = members.some((member,index) => activePort.port + index > selectedBox[direction] || (state.routing[direction] || []).some(occupant => !members.some(item => item.id === occupant.id) && occupant.stagebox === selectedBox.id && Number(occupant.stageboxPort) === activePort.port + index));
            return button('<strong>' + esc(pair ? baseName(row.instrument) : row.instrument) + '</strong><small>' + (pair ? 'Stereo · L / R · ' : '') + esc(direction === 'inputs' ? row.microphone || pickupName(pickupKind(row)) : kindName(monitorKind(row,object(sourceId(row))))) + '</small>',{'data-rw-patch':activePort.port,'data-rw-box':selectedBox.id,'data-rw-direction':direction,'data-rw-rows':idsOf(members)},{className:'rw-route-choice',disabled:invalid,mutation:true});
          }).join('') + '</div>') + '</div>';
        }
        content += '</section>';
      }
      return content;
    }

    function footer() {
      const saved = state.saveState || api.getSaveState?.();
      const label = readonly() ? 'Nur Ansicht' : typeof saved === 'string' ? saved : saved?.text || 'Lokaler Entwurf';
      const list = state.tab === 'outputs' ? monitors : sources, active = state.tab === 'outputs' ? activeMonitor : activeSource;
      const index = list.findIndex(item => item.id === active), next = list.length > 1 ? list[(index + 1) % list.length] : null;
      return '<footer class="rw-footer"><span class="rw-save-state"><span aria-hidden="true">' + (readonly() ? '◉' : '✓') + '</span>' + esc(label) + '</span>' + (state.tab === 'stageboxes' ? button('Patchliste exportieren',{'data-rw-export':'all'},{className:'rw-export'}) : next ? button((state.tab === 'outputs' ? 'Nächster Monitorweg' : 'Nächste Quelle') + ' <span aria-hidden="true">→</span>',{'data-rw-select':next.id},{className:'rw-primary'}) : '') + '</footer>';
    }

    function preserveFocus() {
      const active = host.ownerDocument.activeElement;
      if (!active || !host.contains(active)) return null;
      return {key:active.dataset?.rwFocus, attributes:active.matches('button') ? [...active.attributes].filter(attr => attr.name.startsWith('data-rw-')).map(attr => [attr.name,attr.value]) : null, row:active.dataset?.rwRow, start:active.selectionStart, end:active.selectionEnd};
    }
    function restoreFocus(saved) {
      if (!saved) return;
      let input = saved.key ? [...host.querySelectorAll('[data-rw-focus]')].find(element => element.dataset.rwFocus === saved.key) : saved.attributes?.length ? [...host.querySelectorAll('button')].find(element => saved.attributes.every(([name,value]) => element.getAttribute(name) === value)) : null;
      if (!input && saved.row) input = [...host.querySelectorAll('[data-rw-open]')].find(element => element.dataset.rwOpen === 'pickup-' + saved.row);
      if (!input) return;
      input.focus({preventScroll:true});
      if (saved.start !== null && typeof input.setSelectionRange === 'function') try { input.setSelectionRange(saved.start,saved.end); } catch (_) {}
    }
    function renderStage() {
      if (destroyed) return;
      const element = host.querySelector('[data-rw-stage]');
      if (element && element.getBoundingClientRect().width > 0) api.renderStage?.(element,highlighted.slice());
      if (typeof ResizeObserver !== 'undefined' && resizeTarget !== element) {
        stageObserver?.disconnect(); resizeTarget = element;
        if (element) { stageObserver = new ResizeObserver(() => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; if (!destroyed && element.isConnected) api.renderStage?.(element,highlighted.slice()); }); }); stageObserver.observe(element); }
      }
    }
    function render() {
      if (destroyed) return;
      const focus = preserveFocus(), mainScroll = host.querySelector('.rw-main')?.scrollTop || 0, listScroll = host.querySelector('.rw-source-list')?.scrollTop || 0;
      state = api.getState() || {}; state.routing = state.routing || state.stage?.routing || {inputs:[],outputs:[]};
      if (!['inputs','outputs','stageboxes'].includes(state.tab)) state.tab = 'inputs';
      if (state.tab !== lastTab) { query = ''; openCard = ''; lastTab = state.tab; error = ''; }
      groups(); highlighted = [];
      const content = state.tab === 'stageboxes' ? stageboxView() : state.tab === 'outputs' ? monitorView() : sourcesView();
      host.dataset.readonly = String(readonly()); host.dataset.tab = state.tab;
      host.innerHTML = header() + '<div class="rw-layout">' + sidebar() + '<div class="rw-detail" id="sp-routing-detail-v2" role="tabpanel"><main class="rw-main">' + (error ? '<p class="rw-error" role="alert">' + esc(error) + '</p>' : '') + content + '</main>' + footer() + '</div></div>';
      host.querySelector('.rw-main').scrollTop = mainScroll;
      host.querySelector('.rw-source-list').scrollTop = listScroll;
      restoreFocus(focus); renderStage();
    }

    function onClick(event) {
      const target = event.target.closest('button'); if (!target || !host.contains(target) || target.disabled) return;
      const data = {...target.dataset};
      if (pendingField) {const input = pendingField;pendingField = null;const saved = onChange({target:input});if(saved === false || error)return;}
      if (data.rwTab) {doAction({type:'selectTab',tab:data.rwTab});return;}
      if (data.rwTools) {toolsOpen = !toolsOpen;render();return;}
      if (data.rwBoxLayout) {stageboxLayout = data.rwBoxLayout;render();return;}
      if (data.rwTool) {if(readonly() && !['pdf','xlsx'].includes(data.rwTool))return;doAction({type:data.rwTool,direction:state.tab === 'outputs' ? 'outputs' : 'inputs'});return;}
      if (data.rwSelect) { if (state.tab === 'stageboxes') {activeBox = data.rwSelect;activePort = null;} else if (state.tab === 'outputs') activeMonitor = data.rwSelect; else activeSource = data.rwSelect; openCard = ''; error = ''; render(); return; }
      if (data.rwPort) {activeBox = data.rwBox;activePort = {boxId:activeBox,direction:data.rwDirection,port:Number(data.rwPort)};openCard = '';render();return;}
      if (data.rwExport) {doAction({type:'exportPatch',direction:data.rwExport});return;}
      if (readonly()) return;
      if (data.rwOpen) {openCard = openCard === data.rwOpen ? '' : data.rwOpen;pickerBox = '';micQuery = '';error = '';render();if(openCard.startsWith('pickup-'))host.querySelector('[data-rw-mic-search]')?.focus({preventScroll:true});return;}
      if (data.rwPickerBox) {pickerBox = data.rwPickerBox;render();return;}
      if (data.rwPlayback) return doAction({type:'openPlayback',sourceId:data.rwPlayback});
      if (data.rwAddPickup) return doAction({type:'addPickup',sourceId:data.rwAddPickup,kind:'Mic'});
      if (data.rwFirstPickup) return doAction({type:'addPickup',sourceId:data.rwSource,kind:data.rwFirstPickup});
      if (data.rwRemovePickup) return doAction({type:'removePickup',rowId:data.rwRemovePickup},{close:true});
      if (data.rwPickup) return doAction({type:'setPickup',rowId:data.rwRow,kind:data.rwPickup});
      if (data.rwMic !== undefined) return doAction({type:'setPickup',rowId:data.rwRow,kind:'Mic',microphone:data.rwMic,phantom:data.rwPhantom === 'true'},{close:true});
      if (data.rwCreateDi) return doAction({type:'createDi',rowId:data.rwRow,modelId:data.rwCreateDi});
      if (data.rwDiDevice) return doAction({type:'assignDi',rowId:data.rwRow,deviceId:data.rwDiDevice,channel:Number(data.rwDiChannel)});
      if (data.rwDeviceValue) return doAction({type:'updateDi',deviceId:data.rwDevice,fields:{[data.rwDeviceValue]:data.rwDeviceValue === 'channels' ? Number(data.rwValue) : data.rwDeviceValue === 'active' ? data.rwValue === 'true' : data.rwValue}});
      if (data.rwPatch) return doAction({type:'patch',direction:data.rwDirection,rowIds:splitIds(data.rwRows),boxId:data.rwBox,port:Number(data.rwPatch)},{close:true});
      if (data.rwUnpatch) return doAction({type:'unpatch',direction:data.rwDirection,rowIds:splitIds(data.rwUnpatch)},{close:true});
      if (data.rwTogglePhantom) {const row = route(data.rwTogglePhantom);if(row)return doAction({type:'editChannel',direction:'inputs',rowId:row.id,fields:{phantom:!row.phantom}});}
      if (data.rwConnector) return doAction({type:'editChannel',direction:'inputs',rowId:data.rwRow,fields:{connector:data.rwConnector}});
      if (data.rwLink) return doAction({type:'linkStereo',rowIds:splitIds(data.rwLink)});
      if (data.rwUnlink) return doAction({type:'unlinkStereo',rowIds:splitIds(data.rwUnlink)});
      if (data.rwMonitorFormat) return doAction({type:'setMonitorFormat',rowIds:splitIds(data.rwRows),format:data.rwMonitorFormat});
      if (data.rwMonitorKind) return doAction({type:'editMonitor',rowIds:splitIds(data.rwRows),fields:{outputKind:data.rwMonitorKind}});
      if (data.rwMonitorValue) return doAction({type:'editMonitor',rowIds:splitIds(data.rwRows),fields:{[data.rwMonitorValue]:data.rwMonitorValue === 'monitorActive' ? data.rwValue === 'true' : data.rwValue}});
      if (data.rwAddMonitor) return doAction({type:'addMonitor',kind:data.rwAddMonitor},{close:true});
      if (data.rwAddBox) return doAction({type:'addStagebox',objectType:data.rwAddBox},{close:true});
      if (data.rwCombo !== undefined) return doAction({type:'editStagebox',boxId:data.rwBox,fields:{comboJacks:data.rwCombo === 'true'}});
    }

    function onInput(event) {
      if (event.target.matches('[data-rw-search]')) {query = event.target.value;render();}
      if (event.target.matches('[data-rw-mic-search]')) {micQuery = event.target.value;const row = route(event.target.dataset.rwRow);if(row){const panel = host.querySelector('[data-rw-mic-options]');if(panel)panel.innerHTML = microphoneChoices(row);}}
    }
    function onPointerDown(event) {
      const active = host.ownerDocument.activeElement;
      if (!readonly() && event.target.closest('button') && active && host.contains(active) && active.matches('input:not([type="search"]),textarea') && active.value !== active.defaultValue) {
        // Commit the edited field and the clicked action together; replacing the DOM
        // on blur otherwise consumes the first click on a neighbouring card.
        pendingField = active;event.preventDefault();
      }
    }
    function onChange(event) {
      const input = event.target, data = input.dataset; if (readonly()) return;
      if (input.validity && !input.validity.valid) { input.reportValidity(); return false; }
      if (data.rwSourceField) return doAction({type:'editSource',sourceId:data.rwSource,fields:{[data.rwSourceField]:input.value}});
      if (data.rwChannelField) return doAction({type:'editChannel',direction:data.rwDirection,rowId:data.rwRow,fields:{[data.rwChannelField]:data.rwChannelField === 'number' ? input.value === '' ? null : Number(input.value) : input.value}});
      if (data.rwDeviceField) return doAction({type:'updateDi',deviceId:data.rwDevice,fields:{[data.rwDeviceField]:input.value}});
      if (data.rwMonitorField) return doAction({type:'editMonitor',rowIds:splitIds(data.rwRows),fields:{[data.rwMonitorField]:input.value}});
      if (data.rwBoxField) return doAction({type:'editStagebox',boxId:data.rwBox,fields:{[data.rwBoxField]:input.value}});
      if (data.rwNotes) return doAction({type:data.rwDirection === 'outputs' ? 'editMonitor' : 'editChannel',direction:data.rwDirection,rowId:splitIds(data.rwNotes)[0],rowIds:splitIds(data.rwNotes),fields:{notes:input.value}});
    }
    function onKeydown(event) {
      if (event.target.matches('[data-rw-tab]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
        const tabs = ['inputs','outputs','stageboxes'], current = tabs.indexOf(state.tab), next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
        event.preventDefault();doAction({type:'selectTab',tab:tabs[next]});host.querySelector('[data-rw-tab="' + tabs[next] + '"]')?.focus();return;
      }
      if (event.key === 'Escape' && openCard) {openCard = '';error = '';render();event.stopPropagation();}
      if (event.key === 'Enter' && event.target.matches('input:not([type="search"])')) {event.preventDefault();event.target.blur();}
    }
    host.addEventListener('click',onClick); host.addEventListener('pointerdown',onPointerDown); host.addEventListener('input',onInput); host.addEventListener('change',onChange); host.addEventListener('keydown',onKeydown);
    return {
      render,
      selectSource(id) {if(state?.tab === 'outputs')activeMonitor = monitors.find(group => group.id === id || group.object?.id === id || group.rows.some(row => row.id === id || sourceId(row) === id))?.id || id;else activeSource = sources.find(group => group.id === id || group.rows.some(row => row.id === id))?.id || id;openCard = '';render();},
      selectStagebox(id,direction,port) {activeBox = id;activePort = direction && port ? {boxId:id,direction,port:Number(port)} : null;openCard = '';render();},
      destroy() {destroyed = true;stageObserver?.disconnect();if(frame)cancelAnimationFrame(frame);host.removeEventListener('click',onClick);host.removeEventListener('pointerdown',onPointerDown);host.removeEventListener('input',onInput);host.removeEventListener('change',onChange);host.removeEventListener('keydown',onKeydown);host.replaceChildren();}
    };
  }
  global.StageplotRoutingWorkspace = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
})(typeof window !== 'undefined' ? window : globalThis);
