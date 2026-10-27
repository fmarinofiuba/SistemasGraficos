import './style.css';
import { PRESETS } from './presets.js';
import { TerrainScene } from './scene.js';
import { createShaderEditor } from './editor.js';
import { createControls } from './controls.js';
import { migrateLegacyShader } from './shaderMigration.js';
import { HELP_MARKUP, setupHelp } from './help.js';

const $ = (selector) => document.querySelector(selector);
const storageKey = 'terrain-shader-lab-v1';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Almacenamiento opcional. */ }
if (typeof stored !== 'object' || Array.isArray(stored)) stored = {};
let stage = 4, timer, editor, lab, controls, disposed = false;
const sources = PRESETS.map((preset) => migrateLegacyShader(typeof stored[preset.id] === 'string' ? stored[preset.id] : preset.source));
if (PRESETS.some((preset, i) => typeof stored[preset.id] === 'string' && stored[preset.id] !== sources[i])) {
  try {
    const backupKey = `${storageKey}-before-banding-fix`;
    if (!localStorage.getItem(backupKey)) localStorage.setItem(backupKey, JSON.stringify(stored));
  } catch { /* La corrección funciona también sin almacenamiento local. */ }
}

$('#app').innerHTML = `
  <nav class="stages" aria-label="Ejemplos de complejidad del material">
    ${PRESETS.map((preset, i) => `<button class="stage-button" data-stage="${i}" aria-pressed="${i === stage}" title="${preset.short}"><span class="stage-number">0${i + 1}</span><span class="stage-name">${preset.title}</span></button>`).join('')}
    <button id="open-help" class="stage-button" aria-haspopup="dialog" aria-controls="help-dialog">Ayuda</button>
  </nav>
  <main class="workspace">
    <section class="editor-panel" aria-label="Código del material">
      <div class="editor-toolbar">
        <span class="file-name" title="Editar el material · GLSL">material.glsl<span id="edited-label" hidden title="Código modificado">*</span></span>
        <label class="auto-label"><input type="checkbox" id="auto-compile" checked /> En vivo</label>
        <button id="restore" title="Restaurar el código de este ejemplo">Restaurar</button>
        <button id="download" title="Descargar el shader completo">↓ GLSL</button>
        <button id="compile" title="Aplicar el shader · Ctrl+Enter">Aplicar</button>
        <span id="compile-status" role="status" aria-live="polite">Preparando material…</span>
        <span class="editor-pages"><button id="previous-page" aria-label="Página anterior del shader">‹</button><output id="editor-page" aria-live="polite">1/1</output><button id="next-page" aria-label="Página siguiente del shader">›</button></span>
      </div>
      <div id="shader-editor"></div>
      <div id="compile-errors" role="alert" hidden><button id="dismiss-errors" aria-label="Cerrar errores de compilación">×</button><strong>Error de compilación</strong><pre id="error-text"></pre><button id="error-line" hidden>Ir a la línea</button><p>Se conserva el último shader válido.</p></div>
    </section>
    <section class="scene-panel" aria-label="Vista del terreno">
      <div class="viewport" id="viewport">
        <div id="floating-controls" aria-label="Menú de parámetros y acciones"></div>
        <div class="compare-labels" hidden><span id="previous-label">Ejemplo anterior</span><span>Shader actual</span></div><div class="compare-divider" hidden></div>
        <div class="weights-legend" hidden><span><i class="grass"></i>Pasto</span><span><i class="dirt"></i>Suelo</span><span><i class="rock"></i>Roca</span><span><i class="snow"></i>Nieve</span></div>
      </div>
    </section>
  </main>
  ${HELP_MARKUP}
`;
setupHelp();

function toggleMenuShortcut(event) {
  if (event.key.toLowerCase() !== 'h' || event.repeat || event.isComposing
    || event.ctrlKey || event.altKey || event.metaKey) return;
  const target = event.target;
  if (target instanceof Element && (target.isContentEditable
    || target.closest('input, textarea, select, .cm-editor'))) return;
  if (document.querySelector('dialog[open]')) return;
  event.preventDefault();
  const menu = $('#floating-controls');
  menu.hidden = !menu.hidden;
}
document.addEventListener('keydown', toggleMenuShortcut);

function saveSources() {
  try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(PRESETS.map((preset, i) => [preset.id, sources[i]])))); } catch { /* Almacenamiento opcional. */ }
}

function setStatus(message, state = 'valid') {
  const status = $('#compile-status');
  status.className = state;
  status.textContent = message;
  status.title = message;
}

function updateEdited() {
  $('#edited-label').hidden = editor.source === PRESETS[stage].source;
}

function compile() {
  clearTimeout(timer);
  if (!lab || disposed) return;
  const source = editor.source;
  sources[stage] = source;
  saveSources();
  const result = lab.compile(source);
  $('#compile-errors').hidden = result.ok;
  if (result.ok) {
    setStatus('Shader compilado');
  } else {
    setStatus('Revisá el código', 'invalid');
    $('#error-text').textContent = result.error;
    const match = result.error.match(/(?:ERROR:\s*\d+:|\b0\()(\d+)/);
    const line = match ? Number(match[1]) : 0;
    const button = $('#error-line');
    button.hidden = !line || line >= 1000 || line > source.split('\n').length;
    button.textContent = `Ir a la línea ${line}`;
    button.onclick = () => editor.goToLine(line);
  }
  updateEdited();
  return result;
}

function selectStage(next) {
  clearTimeout(timer);
  sources[stage] = editor.source;
  saveSources();
  stage = next;
  const preset = PRESETS[stage];
  lab.useMacro = stage >= 3;
  document.querySelectorAll('[data-stage]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === stage)));
  $('#previous-label').textContent = stage ? PRESETS[stage - 1].title : 'Material uniforme';
  editor.setSource(sources[stage]);
  lab.setPrevious(stage ? PRESETS[stage - 1].source : null, stage >= 4);
  if (sources[stage] !== preset.source) lab.compile(preset.source);
  compile();
  controls?.setStage(stage);
}

try {
  lab = new TerrainScene($('#viewport'));
  setStatus('Cargando imágenes…', 'pending');
  await lab.ready;
  editor = createShaderEditor($('#shader-editor'), sources[stage], (source) => {
    sources[stage] = source;
    saveSources();
    updateEdited();
    clearTimeout(timer);
    setStatus('Cambios pendientes', 'pending');
    if ($('#auto-compile').checked) timer = setTimeout(compile, 650);
  }, compile, ({ page, total, firstLine, lastLine }) => {
    $('#editor-page').textContent = `${page + 1}/${total}`;
    $('#editor-page').title = `Líneas ${firstLine}–${lastLine} · Alt+RePág / Alt+AvPág`;
    $('#previous-page').disabled = page === 0;
    $('#next-page').disabled = page === total - 1;
  });
  controls = createControls($('#floating-controls'), lab, {
    inspect: (value) => { $('.weights-legend').hidden = value !== 1; },
    compare: (active) => { $('.compare-labels').hidden = $('.compare-divider').hidden = !active; },
  });
  document.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => selectStage(Number(button.dataset.stage))));
  $('#previous-page').addEventListener('click', () => editor.previousPage());
  $('#next-page').addEventListener('click', () => editor.nextPage());
  $('#compile').addEventListener('click', compile);
  $('#restore').addEventListener('click', () => { editor.setSource(PRESETS[stage].source); compile(); });
  $('#auto-compile').addEventListener('change', () => { clearTimeout(timer); if ($('#auto-compile').checked) compile(); });
  $('#download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([editor.source], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `terreno-${PRESETS[stage].id}.glsl`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('#dismiss-errors').addEventListener('click', () => { $('#compile-errors').hidden = true; });
  selectStage(stage);
  if (import.meta.env.DEV) window.terrainLab = { lab, editor, controls, presets: PRESETS, selectStage, compile, get stage() { return stage; } };
} catch (error) {
  setStatus('No se pudo iniciar el laboratorio', 'invalid');
  const message = document.createElement('div');
  message.className = 'startup-error';
  const title = document.createElement('h2');
  title.textContent = 'No se pudo iniciar el laboratorio';
  const detail = document.createElement('p');
  detail.textContent = error.message;
  message.append(title, detail);
  $('#viewport').append(message);
  console.error(error);
}


if (import.meta.hot) import.meta.hot.dispose(() => {
  document.removeEventListener('keydown', toggleMenuShortcut);
  disposed = true;
  clearTimeout(timer);
  editor?.destroy();
  controls?.dispose();
  lab?.dispose();
});
