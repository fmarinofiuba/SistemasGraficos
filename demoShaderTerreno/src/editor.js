import { basicSetup, EditorView } from 'codemirror';
import { keymap } from '@codemirror/view';
import { cpp } from '@codemirror/lang-cpp';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const grayscaleHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#eeeeee', fontWeight: '600' },
  { tag: [tags.typeName, tags.className], color: '#c7c7c7' },
  { tag: [tags.number, tags.bool, tags.null], color: '#b8b8b8' },
  { tag: [tags.string, tags.character], color: '#d0d0d0' },
  { tag: tags.comment, color: '#858585', fontStyle: 'italic' },
  { tag: [tags.meta, tags.operator], color: '#aaaaaa' },
]);

export function createShaderEditor(parent, source, onChange, onCompile, onPageChange = () => {}) {
  let replacing = false;
  let page = 0, total = 1, pageHeight = 1, pendingFrame = 0, destroyed = false;

  function publishPage() {
    const start = view.lineBlockAtHeight(page * pageHeight);
    const end = view.lineBlockAtHeight((page + 1) * pageHeight - 1);
    onPageChange({
      page, total,
      firstLine: view.state.doc.lineAt(start.from).number,
      lastLine: view.state.doc.lineAt(end.to).number,
    });
  }

  function showPage(next) {
    page = Math.max(0, Math.min(next, total - 1));
    view.scrollDOM.scrollTop = page * pageHeight;
    publishPage();
  }

  function scheduleMeasure() {
    if (destroyed || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      if (destroyed) return;
      view.requestMeasure({
        key: parent,
        read(current) {
          const lineHeight = current.defaultLineHeight || 18;
          const rows = Math.max(1, Math.floor((parent.clientHeight - 16) / lineHeight));
          return { height: rows * lineHeight, documentHeight: current.lineBlockAt(current.state.doc.length).bottom };
        },
        write({ height, documentHeight }) {
          if (destroyed) return;
          pageHeight = height;
          total = Math.max(1, Math.ceil(documentHeight / pageHeight));
          // Ajustamos a filas completas y rellenamos la última página. El
          // documento y su historial siguen completos dentro de CodeMirror.
          const editorHeight = `${pageHeight + 16}px`;
          const bottomPadding = `${Math.max(8, total * pageHeight - documentHeight + 8)}px`;
          if (view.dom.style.height !== editorHeight) view.dom.style.height = editorHeight;
          if (view.contentDOM.style.paddingBottom !== bottomPadding) view.contentDOM.style.paddingBottom = bottomPadding;
          showPage(page);
        },
      });
    });
  }

  const view = new EditorView({
    doc: source,
    parent,
    extensions: [
      basicSetup, cpp(), syntaxHighlighting(grayscaleHighlight), EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Editor GLSL del material de terreno', spellcheck: 'false' }),
      EditorView.theme({
        '&': { height: '100%', backgroundColor: '#1e1e1e', color: '#d4d4d4', fontSize: '12px' },
        '.cm-scroller': { overflow: 'hidden', fontFamily: 'Consolas, "Cascadia Code", monospace', lineHeight: '1.5' },
        '.cm-gutters': { backgroundColor: '#1e1e1e', color: '#777777', border: 'none' },
        '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#292929' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#eeeeee' },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#444444' },
        '.cm-selectionMatch, .cm-searchMatch': { backgroundColor: '#393939', outlineColor: '#666666' },
        '.cm-searchMatch-selected': { backgroundColor: '#555555' },
        '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': { backgroundColor: '#444444', color: '#ffffff' },
        '.cm-nonmatchingBracket, &.cm-focused .cm-nonmatchingBracket': { color: '#ffffff', textDecoration: 'underline' },
        '.cm-foldPlaceholder': { backgroundColor: '#303030', borderColor: '#555555', color: '#bbbbbb' },
        '.cm-panels, .cm-tooltip': { backgroundColor: '#252525', borderColor: '#555555', color: '#dddddd' },
        '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: '#4a4a4a', color: '#ffffff' },
        '.cm-button': { background: '#383838', borderColor: '#666666', color: '#eeeeee' },
        '.cm-textfield': { backgroundColor: '#181818', borderColor: '#666666', color: '#eeeeee' },
        '.cm-content': { padding: '8px 0', overflowWrap: 'anywhere' },
        '&.cm-focused': { outline: 'none' },
      }, { dark: true }),
      keymap.of([
        { key: 'Mod-Enter', run: () => { onCompile(); return true; } },
        { key: 'Alt-PageDown', run: () => { showPage(page + 1); return true; } },
        { key: 'Alt-PageUp', run: () => { showPage(page - 1); return true; } },
      ]),
      EditorView.scrollHandler.of((current, range) => {
        const block = current.lineBlockAt(range.head);
        const top = page * pageHeight;
        if (block.top < top || block.top >= top + pageHeight) showPage(Math.floor(block.top / pageHeight));
        return true;
      }),
      EditorView.domEventHandlers({ wheel(event) { event.preventDefault(); return true; } }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !replacing) onChange(view.state.doc.toString());
        if (update.docChanged || update.geometryChanged) scheduleMeasure();
      }),
    ],
  });
  const observer = new ResizeObserver(scheduleMeasure);
  observer.observe(parent);
  scheduleMeasure();
  return {
    get source() { return view.state.doc.toString(); },
    setSource(next) {
      replacing = true;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next }, selection: { anchor: 0 } });
      replacing = false;
      page = 0;
      view.scrollDOM.scrollTop = 0;
      scheduleMeasure();
    },
    goToLine(line) {
      const target = view.state.doc.line(Math.min(Math.max(line, 1), view.state.doc.lines));
      view.dispatch({ selection: { anchor: target.from }, effects: EditorView.scrollIntoView(target.from, { y: 'center' }) });
      view.focus();
    },
    previousPage: () => showPage(page - 1),
    nextPage: () => showPage(page + 1),
    get pagination() { return { page, total }; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(pendingFrame);
      observer.disconnect();
      view.destroy();
    },
  };
}
