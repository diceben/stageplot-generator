/* Stage geometry in metres. Source shapes stay editable; derived contours are shared by all views. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./stageplot-assets/vendor/polygon-clipping.js') : root.polygonClipping);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StageplotGeometry = api;
})(typeof globalThis === 'object' ? globalThis : this, function (clip) {
  'use strict';
  const VERSION = 1, TOLERANCE = .001, MAX_PARTS = 64, MAX_POINTS = 96;
  const kinds = new Set(['floor', 'opening', 'obstacle', 'zone', 'stairs', 'ramp', 'line']);
  const shapes = new Set(['rect', 'ellipse', 'polygon', 'segment']);
  const clean = (s, n = 80) => String(s ?? '').slice(0, n);
  const copy = value => JSON.parse(JSON.stringify(value));
  const round = n => Math.round(n * 1e6) / 1e6;
  const number = (n, min, max, label) => {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Error('Ungültig: ' + label + '.');
    return round(n);
  };
  const optionalHeight = n => n === null || n === undefined || n === '' ? null : number(n, -20, 50, 'Höhe');
  const id = () => 'shape-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  function part(input = {}) {
    const p = { id: input.id || id(), name: clean(input.name || 'Bühnenfläche'), kind: input.kind || 'floor', shape: input.shape || 'rect',
      x: input.x ?? 0, y: input.y ?? 0, w: input.w ?? 2, d: input.d ?? 1, angle: input.angle ?? 0,
      height: input.height ?? null, role: clean(input.role || 'stage', 30), locked: input.locked === true, note: clean(input.note, 500) };
    if (p.shape === 'polygon') p.points = copy(input.points || [[0, 0], [p.w, 0], [p.w, p.d], [0, p.d]]);
    if (p.shape === 'segment') p.rise = input.rise ?? Math.min(p.w / 2, p.d);
    if (input.target) p.target = clean(input.target, 100);
    if (input.anchor) p.anchor = copy(input.anchor);
    return p;
  }
  function normalize(input) {
    if (!input || input.version !== VERSION || !Array.isArray(input.parts) || input.parts.length > MAX_PARTS) throw new Error('Unbekanntes oder zu großes Bühnenformat.');
    const ids = new Set();
    const parts = input.parts.map(raw => {
      if (!raw || typeof raw !== 'object') throw new Error('Ungültiges Bühnenelement.');
      const p = part(raw);
      if (typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(p.id) || ids.has(p.id)) throw new Error('Bühnenelement ohne eindeutige Kennung.');
      ids.add(p.id);
      if (!kinds.has(p.kind) || !shapes.has(p.shape)) throw new Error('Unbekanntes Bühnenelement.');
      p.x = number(p.x, -200, 200, 'Position X'); p.y = number(p.y, -200, 200, 'Position Y');
      p.w = number(p.w, .02, 100, 'Breite'); p.d = number(p.d, .02, 100, 'Tiefe');
      p.angle = ((number(p.angle, -36000, 36000, 'Drehung') % 360) + 360) % 360;
      p.height = optionalHeight(p.height);
      if (p.shape === 'polygon') {
        if (!Array.isArray(p.points) || p.points.length < 3 || p.points.length > MAX_POINTS) throw new Error('Ein Umriss braucht 3–96 Punkte.');
        p.points = p.points.map(v => {
          if (!Array.isArray(v) || v.length < 2 || v.length > 3) throw new Error('Ungültiger Eckpunkt.');
          return [number(v[0], -100, 100, 'Punkt X'), number(v[1], -100, 100, 'Punkt Y'), number(v[2] ?? 0, -50, 50, 'Rundung')];
        });
      }
      if (p.shape === 'segment') p.rise = number(p.rise, .02, p.w / 2, 'Ausladung der Rundung');
      if (p.anchor) {
        const a = p.anchor;
        p.anchor = { partId: clean(a.partId, 100), edge: Math.floor(number(a.edge, 0, MAX_POINTS - 1, 'Anschlusskante')), t: number(a.t, 0, 1, 'Position auf der Kante') };
      }
      const ring = localRing(p);
      if (Math.abs(ringArea(ring)) < .0001 || crossesItself(ring)) throw new Error('„' + p.name + '“ hat einen überkreuzten oder leeren Umriss.');
      return p;
    });
    for (const p of parts) if (p.target && !parts.some(q => q.id === p.target && q.kind === 'floor')) throw new Error('Ausschnitt verweist auf eine fehlende Bühnenfläche.');
    const g = { version: VERSION, parts, height: optionalHeight(input.height), clearance: input.clearance == null || input.clearance === '' ? null : number(input.clearance, .02, 100, 'Lichte Höhe'), showModules: input.showModules === true,
      name: clean(input.name, 60), measured: input.measured === true, notes: clean(input.notes, 2000), revision: Math.max(1, Math.min(1000000, Math.floor(Number(input.revision) || 1))) };
    const compiled = compile(g);
    if (!compiled.floor.length || compiled.area < .01) throw new Error('Mindestens eine verbleibende Bühnenfläche wird benötigt.');
    return g;
  }
  function legacy(stage) {
    return { version: VERSION, parts: [part({ id: 'main-stage', name: 'Hauptbühne', w: stage.w, d: stage.d })], height: null, clearance: null, showModules: false, name: '', measured: false, notes: '', revision: 1 };
  }
  function transform(p, point) {
    const a = p.angle * Math.PI / 180;
    return [round(p.x + point[0] * Math.cos(a) - point[1] * Math.sin(a)), round(p.y + point[0] * Math.sin(a) + point[1] * Math.cos(a))];
  }
  function inverse(p, point) {
    const a = -p.angle * Math.PI / 180, x = point[0] - p.x, y = point[1] - p.y;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  }
  function arc(a, b, rise) {
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    if (Math.abs(rise) < .000001) return [a.slice(0, 2), b.slice(0, 2)];
    if (length < .02 || Math.abs(rise) > length / 2 + .000001) throw new Error('Rundung darf höchstens eine halbe Kantenlänge tief sein.');
    const h = Math.abs(rise), r = length * length / (8 * h) + h / 2, nx = -dy / length, ny = dx / length;
    const sign = Math.sign(rise), cx = (a[0] + b[0]) / 2 - sign * nx * (r - h), cy = (a[1] + b[1]) / 2 - sign * ny * (r - h);
    const start = Math.atan2(a[1] - cy, a[0] - cx), sweep = -sign * 2 * Math.asin(Math.min(1, length / (2 * r)));
    const step = 2 * Math.acos(Math.max(-1, 1 - TOLERANCE / r)), count = Math.max(2, Math.ceil(Math.abs(sweep) / step / 2) * 2);
    return Array.from({ length: count + 1 }, (_, i) => i === 0 ? a.slice(0, 2) : i === count ? b.slice(0, 2) : [cx + r * Math.cos(start + sweep * i / count), cy + r * Math.sin(start + sweep * i / count)]);
  }
  function localRing(p) {
    if (p.shape === 'ellipse') {
      const radius = Math.max(p.w, p.d) / 2, count = Math.max(24, Math.ceil(Math.PI / Math.acos(Math.max(-1, 1 - TOLERANCE / radius)) / 4) * 4);
      return Array.from({ length: count }, (_, i) => [p.w / 2 + p.w / 2 * Math.cos(i * 2 * Math.PI / count), p.d / 2 + p.d / 2 * Math.sin(i * 2 * Math.PI / count)]);
    }
    if (p.shape === 'segment') return arc([0, 0], [p.w, 0], p.rise);
    if (p.shape === 'polygon') return p.points.flatMap((v, i) => arc(v, p.points[(i + 1) % p.points.length], v[2] || 0).slice(0, -1));
    return [[0, 0], [p.w, 0], [p.w, p.d], [0, p.d]];
  }
  const ring = p => localRing(p).map(v => transform(p, v));
  const polygon = p => [ring(p)];
  function ringArea(points) { return points.reduce((sum, a, i) => { const b = points[(i + 1) % points.length]; return sum + a[0] * b[1] - b[0] * a[1]; }, 0) / 2; }
  const area = multi => multi.reduce((sum, poly) => sum + Math.abs(ringArea(poly[0])) - poly.slice(1).reduce((n, hole) => n + Math.abs(ringArea(hole)), 0), 0);
  function crossesItself(points) {
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i = 0; i < points.length; i++) for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue;
      const a = points[i], b = points[(i + 1) % points.length], c = points[j], d = points[(j + 1) % points.length];
      if (cross(a, b, c) * cross(a, b, d) < -1e-12 && cross(c, d, a) * cross(c, d, b) < -1e-12) return true;
    }
    return false;
  }
  const union = list => list.length ? clip.union(...list) : [];
  function compile(g, extensions = []) {
    const parts = [...g.parts, ...extensions], openings = parts.filter(p => p.kind === 'opening'), floors = parts.filter(p => p.kind === 'floor');
    const surfaces = floors.map(p => { const holes = openings.filter(h => !h.target || h.target === p.id).map(polygon); return { part: p, polygon: holes.length ? clip.difference(polygon(p), ...holes) : [polygon(p)] }; });
    const floor = union(surfaces.map(s => s.polygon).filter(p => p.length));
    const blockers = parts.filter(p => p.kind === 'obstacle' || p.kind === 'zone' && p.role === 'reserve').map(polygon);
    const usable = floor.length && blockers.length ? clip.difference(floor, ...blockers) : floor;
    const allPoints = parts.filter(p => p.kind !== 'opening').flatMap(ring);
    const bounds = allPoints.length ? { minX: Math.min(...allPoints.map(p => p[0])), minY: Math.min(...allPoints.map(p => p[1])), maxX: Math.max(...allPoints.map(p => p[0])), maxY: Math.max(...allPoints.map(p => p[1])) } : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { floor, usable, surfaces, bounds, area: area(floor), usableArea: area(usable) };
  }
  function path(multi, scale = 1, x = 0, y = 0) {
    return multi.flatMap(poly => poly.map(r => r.map((p, i) => (i ? 'L' : 'M') + round(x + p[0] * scale) + ' ' + round(y + p[1] * scale)).join('') + 'Z')).join('');
  }
  function containsFootprint(multi, footprint) {
    if (!multi.length) return false;
    return area(clip.difference([footprint], multi)) < .0001;
  }
  function resize(p, w, d) {
    const next = copy(p), sx = w / p.w, sy = d / p.d;
    next.w = w; next.d = d;
    if (p.points) next.points = p.points.map(v => [v[0] * sx, v[1] * sy, (v[2] || 0) * Math.min(sx, sy)]);
    if (p.shape === 'segment') next.rise = Math.min(w / 2, p.rise * sy);
    return next;
  }
  function vertices(p) { return p.shape === 'polygon' ? p.points : [[0, 0], [p.w, 0], [p.w, p.d], [0, p.d]]; }
  function edgePoint(p, index, t) {
    const points = vertices(p), a = points[index % points.length], b = points[(index + 1) % points.length], pointsOnArc = arc(a, b, a[2] || 0), f = t * (pointsOnArc.length - 1), i = Math.min(pointsOnArc.length - 2, Math.floor(f)), k = f - i;
    const v = [pointsOnArc[i][0] * (1 - k) + pointsOnArc[i + 1][0] * k, pointsOnArc[i][1] * (1 - k) + pointsOnArc[i + 1][1] * k];
    const start = transform(p, pointsOnArc[i]), end = transform(p, pointsOnArc[i + 1]);
    return { point: transform(p, v), angle: Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI };
  }
  function syncAnchors(g) {
    for (const p of g.parts) if (p.anchor) {
      const owner = g.parts.find(q => q.id === p.anchor.partId);
      if (!owner || !['rect', 'polygon'].includes(owner.shape) || p.anchor.edge >= vertices(owner).length) continue;
      const pose = edgePoint(owner, p.anchor.edge, p.anchor.t), direction = ringArea(localRing(owner)) >= 0 ? -1 : 1;
      p.angle = pose.angle + (direction < 0 ? 180 : 0);
      const a = p.angle * Math.PI / 180;
      p.x = round(pose.point[0] - p.w / 2 * Math.cos(a)); p.y = round(pose.point[1] - p.w / 2 * Math.sin(a));
    }
    return g;
  }
  function attachmentIssues(g) {
    const issues=[];
    for(const p of g.parts.filter(p=>p.anchor)){
      const owner=g.parts.find(q=>q.id===p.anchor.partId),points=owner&&vertices(owner),a=points?.[p.anchor.edge],b=points?.[(p.anchor.edge+1)%points.length];
      if(!owner||!a||!b){issues.push(p.name+': Anschluss neu zuordnen');continue;}
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(p.w>length+.001||p.anchor.t*length<p.w/2-.001||(1-p.anchor.t)*length<p.w/2-.001)issues.push(p.name+': Anschluss ragt über die Kante');
    }
    return issues;
  }
  function preset(name, w = 8, d = 5) {
    const g = legacy({ w, d }), main = g.parts[0];
    if (name === 'round') g.parts.push(part({ name: 'Vorbühne', shape: 'segment', x: 0, y: d, w, d: w / 4, rise: w / 4 }));
    if (name === 'circle') Object.assign(main, { shape: 'ellipse', d: w, name: 'Rundbühne' });
    if (name === 'trapezoid') Object.assign(main, { shape: 'polygon', points: [[w * .15, 0], [w * .85, 0], [w, d], [0, d]] });
    if (name === 'thrust' || name === 't') g.parts.push(part({ name: 'Steg', x: w / 2 - 1, y: d, w: 2, d: 4 }));
    if (name === 't') g.parts.push(part({ name: 'Querpodest', x: w / 2 - 3, y: d + 4, w: 6, d: 2 }));
    if (name === 'wings') g.parts.push(part({ name: 'Seitenbühne SR', role: 'side', x: -2, y: 1, w: 2, d: Math.max(1, d - 2) }), part({ name: 'Seitenbühne SL', role: 'side', x: w, y: 1, w: 3, d: Math.max(1, d - 1) }));
    if (name === 'l' || name === 'u') g.parts.push(part({ name: 'Ausschnitt', kind: 'opening', x: name === 'l' ? w / 2 : w / 3, y: d / 2, w: name === 'l' ? w / 2 : w / 3, d: d / 2 }));
    if (name === 'notch') g.parts.push(part({ name: 'Treppenausschnitt', kind: 'opening', x: w - 1.4, y: d - 1.4, w: 1.4, d: 1.4 }), part({ name: 'Treppe', kind: 'stairs', x: w - 1.35, y: d - 1.35, w: 1.3, d: 1.3, angle: 0 }));
    if (name === 'irregular') Object.assign(main, { shape: 'polygon', points: [[0, 0], [w * .8, 0], [w, d * .3], [w, d], [w * .1, d], [0, d * .7]] });
    return normalize(g);
  }
  return { VERSION, TOLERANCE, MAX_PARTS, MAX_POINTS, part, normalize, legacy, transform, inverse, ring, localRing, polygon, compile, path, area, containsFootprint, resize, vertices, edgePoint, syncAnchors, attachmentIssues, preset, copy, round };
});
