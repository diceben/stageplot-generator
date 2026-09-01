// Baut die eingebetteten Modul-Kopien in stageplot-studio.html aus den
// eigenständigen Quelldateien neu auf. Die .js-Dateien sind die EINZIGE Quelle;
// die Einbettung in die HTML ist ein generiertes Artefakt, damit die App eine
// autarke, offline öffenbare Datei bleibt (siehe README/CLAUDE.md).
//
//   node scripts/build-inline.cjs           -> HTML aktualisieren (schreibt)
//   node scripts/build-inline.cjs --check   -> nur prüfen, Exitcode 1 bei Drift
//
// Beim ersten Lauf sind noch keine Marker vorhanden: Die eingebettete Kopie wird
// dann anhand ihres Inhalts gefunden und mit Markern umschlossen.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const HTML = path.join(root, 'stageplot-studio.html');

// Reihenfolge = Ladereihenfolge in der HTML (export vor drums vor symbols).
// transform() muss exakt den Text erzeugen, der eingebettet werden soll.
const MODULES = [
  { file: 'stageplot-export-v42.js', transform: stripCommonJsExport },
  { file: 'stageplot-drums-v12.js', transform: (s) => s.trim() },
  { file: 'stageplot-symbols-v3.js', transform: (s) => s.trim() },
];

// Die CommonJS-Exportzeile am Dateiende ist nur für node/Tests; im Browser ist
// `module` undefiniert. Sie wird aus der Einbettung entfernt.
function stripCommonJsExport(source) {
  return source.trim().split('\nif(typeof module')[0].trim();
}

const startMark = (file) =>
  `/* build-inline:start ${file} — generiert via scripts/build-inline.cjs, nicht hier editieren */`;
const endMark = (file) => `/* build-inline:end ${file} */`;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function render(html) {
  for (const mod of MODULES) {
    const source = mod.transform(fs.readFileSync(path.join(root, mod.file), 'utf8'));
    const start = startMark(mod.file);
    const end = endMark(mod.file);
    const block = `${start}\n${source}\n${end}`;
    const markerRe = new RegExp(`${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}`);

    if (markerRe.test(html)) {
      html = html.replace(markerRe, () => block);
      continue;
    }
    // Erstlauf: Kopie anhand des Inhalts finden und mit Markern umschließen.
    const idx = html.indexOf(source);
    if (idx < 0) {
      throw new Error(
        `Eingebetteter Block für ${mod.file} nicht gefunden. ` +
          `Bitte einmalig manuell prüfen, ob die Quelle noch in der HTML steht.`
      );
    }
    if (html.indexOf(source, idx + source.length) !== -1) {
      throw new Error(`Eingebetteter Block für ${mod.file} kommt mehrfach vor — mehrdeutig.`);
    }
    html = html.slice(0, idx) + block + html.slice(idx + source.length);
  }
  return html;
}

function main() {
  const check = process.argv.includes('--check');
  const current = fs.readFileSync(HTML, 'utf8');
  const next = render(current);

  if (check) {
    if (current !== next) {
      console.error(
        'DRIFT: stageplot-studio.html ist nicht mit den Modulquellen synchron. ' +
          'Bitte `npm run build` ausführen und committen.'
      );
      process.exit(1);
    }
    console.log('OK: eingebettete Module sind mit den Quelldateien synchron.');
    return;
  }

  if (current === next) {
    console.log('Unverändert: eingebettete Module bereits aktuell.');
    return;
  }
  fs.writeFileSync(HTML, next);
  console.log(`Aktualisiert: ${MODULES.map((m) => m.file).join(', ')} in stageplot-studio.html eingebettet.`);
}

main();
