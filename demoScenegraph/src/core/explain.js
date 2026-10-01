// Explicación de la resolución paso a paso: una etapa por nodo interno, de las
// hojas a la raíz (el mismo orden que la animación de la línea de tiempo).

import { buildTimeline } from './timeline.js';
import { findNode } from './doc.js';
import { fmtNum, format } from './formula.js';

const signo = (v) => (v < 0 ? `−${fmtNum(-v)}` : fmtNum(v));

/** Frase que explica una operación. */
export function describeOp(o) {
  switch (o.op) {
    case 'T': {
      const partes = [];
      if (o.x) partes.push(`${signo(o.x)} en X`);
      if (o.y) partes.push(`${signo(o.y)} en Y`);
      return partes.length ? `traslada ${partes.join(' y ')}` : 'no mueve nada (traslación nula)';
    }
    case 'R':
      return o.ang === 0
        ? 'no gira (rotación nula)'
        : `gira ${fmtNum(Math.abs(o.ang))}° en sentido ${o.ang > 0 ? 'antihorario' : 'horario'} alrededor del origen`;
    case 'E': {
      const extra = [];
      if (o.x < 0) extra.push('espeja respecto del eje Y');
      if (o.y < 0) extra.push('espeja respecto del eje X');
      const base =
        o.x === o.y
          ? `escala ×${signo(o.x)} en ambos ejes`
          : `escala ×${signo(o.x)} en X y ×${signo(o.y)} en Y`;
      return extra.length ? `${base} (${extra.join(' y ')})` : base;
    }
    default:
      return '';
  }
}

/**
 * Devuelve la lista de pasos:
 * [{ index, numero, nodeId, esFinal, titulo, padre, hijos: [{ n, nodeId, descripcion,
 *    formula, ops: [{ formula, texto }] }] }]
 * `numero` es el paso (1..N); el mismo número se usa como insignia en el grafo.
 */
export function explainSteps(doc) {
  const { stages } = buildTimeline(doc);
  const numeroDe = new Map(stages.map((s) => [s.nodeId, s.index + 1]));
  const total = stages.length;

  return stages.map((st) => {
    const P = findNode(doc, st.nodeId);
    const esFinal = P.id === doc.raiz.id;
    const hijos = P.hijos.map((c, i) => {
      const interno = (c.hijos?.length ?? 0) > 0;
      let descripcion;
      if (c.modelo && !interno) descripcion = `modelo ${c.modelo}`;
      else if (c.modelo && interno) descripcion = `modelo ${c.modelo} con su subárbol (armado en el paso ${numeroDe.get(c.id)})`;
      else if (interno) descripcion = `contenedor armado en el paso ${numeroDe.get(c.id)}`;
      else descripcion = 'contenedor vacío';
      const ops = [...(c.t ?? [])].reverse().map((o) => ({ formula: format([o]), texto: describeOp(o) }));
      return { n: i + 1, nodeId: c.id, descripcion, formula: format(c.t ?? []), ops };
    });

    let padre;
    if (esFinal) padre = 'La Raíz es el origen del mundo: sus hijos arman la escena final.';
    else if (P.modelo) padre = `Este nodo es el modelo ${P.modelo}: queda en el origen y sus hijos se ubican respecto de él.`;
    else padre = 'Este nodo es un contenedor (no dibuja nada): su origen es el centro de la grilla y sus hijos se ubican respecto de él.';

    const nh = hijos.length;
    const titulo = esFinal
      ? `Escena final (Raíz, ${nh} ${nh === 1 ? 'hijo' : 'hijos'})`
      : `${P.modelo ? `Nodo ${P.modelo}` : 'Contenedor'} con ${nh} ${nh === 1 ? 'hijo' : 'hijos'}`;

    return { index: st.index, numero: st.index + 1, total, nodeId: P.id, esFinal, titulo, padre, hijos };
  });
}
