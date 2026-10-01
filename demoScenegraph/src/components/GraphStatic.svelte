<script>
  // Grafo estático (sin interacción) para impresión y exportación.
  // focus: id de un nodo; si se indica, solo se dibuja su subárbol y la vista se recorta a él.
  import { layoutTree, nodeW, labelW, NODE_H } from '../core/graphLayout.js';
  import GraphNodes from './GraphNodes.svelte';

  // levels: con focus, limita la profundidad (1 = el nodo y sus hijos directos)
  let { doc, hide = false, focus = null, levels = Infinity, badges = null, svg = $bindable(null) } = $props();

  const layout = $derived(layoutTree(doc, hide));

  const sub = $derived.by(() => {
    if (!focus) return null;
    const root = layout.nodes.find((n) => n.data.id === focus);
    return root ? root.descendants().filter((n) => n.depth - root.depth <= levels) : null;
  });
  const only = $derived(sub ? new Set(sub.map((n) => n.data.id)) : null);

  const vb = $derived.by(() => {
    const pad = 16;
    if (!sub) {
      const b = layout.bounds;
      return `${b.x0 - pad} ${b.y0 - pad} ${b.x1 - b.x0 + 2 * pad} ${b.y1 - b.y0 + 2 * pad}`;
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const n of sub) {
      const w = Math.max(nodeW(doc, n.data), n.data.id === focus ? 0 : labelW(doc, n.data, hide));
      x0 = Math.min(x0, n.x - w / 2);
      x1 = Math.max(x1, n.x + w / 2);
      y0 = Math.min(y0, n.y - NODE_H / 2);
      y1 = Math.max(y1, n.y + NODE_H / 2 + 14);
    }
    return `${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`;
  });
</script>

<svg bind:this={svg} viewBox={vb} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Grafo de escena">
  <GraphNodes {doc} {layout} {hide} {only} {badges} />
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
