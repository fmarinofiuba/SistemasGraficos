<script>
  // Escena estática (sin interacción) para impresión y exportación.
  import { gridPaths, gridTicks } from '../core/grid.js';
  import { staticItems } from '../core/timeline.js';
  import { findNode } from '../core/doc.js';
  import { evaluate } from '../core/evaluate.js';
  import { apply } from '../core/mat3.js';
  import Shape from './Shape.svelte';
  import ModelStrip from './ModelStrip.svelte';

  // frameId: dibuja el subárbol de ese nodo en su propio marco (el nodo en el origen).
  // markChildren: numera los hijos directos del marco en su origen (1, 2, 3…).
  // fill: la escena ocupa todo el alto disponible de su contenedor.
  let { doc, showShapes = true, showLegend = true, frameId = null, markChildren = false, fill = false, svg = $bindable(null) } = $props();

  const g = $derived(doc.grilla);
  const pad = 10;
  const side = $derived(g.max - g.min + 2 * pad);
  const paths = $derived(gridPaths(g));
  const ticks = $derived(gridTicks(g));
  const items = $derived(staticItems(doc, frameId));
  const markers = $derived.by(() => {
    if (!markChildren) return [];
    const ev = evaluate(doc, frameId);
    const frame = frameId ? findNode(doc, frameId) : doc.raiz;
    return (frame?.hijos ?? []).map((c, i) => {
      const [x, y] = apply(ev.get(c.id).world, [0, 0]);
      return { n: i + 1, x, y };
    });
  });
</script>

<div class="scene" class:fill>
  <svg bind:this={svg} viewBox="{g.min - pad} {-(g.max + pad)} {side} {side}" role="img" aria-label="Escena 2D">
    <rect x={g.min - pad} y={-(g.max + pad)} width={side} height={side} fill="var(--panel)" />
    <g transform="scale(1 -1)">
      <path d={paths.minor} stroke="var(--grid)" stroke-width="1" vector-effect="non-scaling-stroke" fill="none" />
      <path d={paths.major} stroke="var(--grid-strong)" stroke-width="1.5" vector-effect="non-scaling-stroke" fill="none" />
      <rect x={g.min} y={g.min} width={g.max - g.min} height={g.max - g.min} fill="none" stroke="var(--grid-strong)" stroke-width="1" vector-effect="non-scaling-stroke" />
      {#each ticks as v}
        <text transform="translate({v} -1.2) scale(1 -1)" font-size="3.4" font-family="system-ui, Arial, sans-serif" text-anchor="middle" fill="var(--muted)" dominant-baseline="hanging">{v}</text>
        <text transform="translate(-1.2 {v}) scale(1 -1)" font-size="3.4" font-family="system-ui, Arial, sans-serif" text-anchor="end" fill="var(--muted)" dominant-baseline="central">{v}</text>
      {/each}
      {#if showShapes}
        {#each items as it (it.id)}
          {@const node = findNode(doc, it.id)}
          {#if node && (it.id !== doc.raiz.id || node.modelo)}
            <Shape modelo={node.modelo ? doc.modelos[node.modelo] : null} letra={node.modelo ?? ''} matrix={it.matrix} />
          {/if}
        {/each}
      {/if}
      <circle r="1.4" fill="var(--text)" />
      {#if showShapes}
        {#each markers as m (m.n)}
          <g transform="translate({m.x} {m.y})">
            <circle r="4.2" fill="#fff" stroke="var(--accent)" stroke-width="1.4" vector-effect="non-scaling-stroke" />
            <text transform="scale(1 -1)" text-anchor="middle" dominant-baseline="central" font-size="5.4" font-weight="700" font-family="system-ui, Arial, sans-serif" fill="var(--accent)">{m.n}</text>
          </g>
        {/each}
      {/if}
    </g>
  </svg>

  {#if showLegend}
    <div class="legend"><ModelStrip {doc} /></div>
  {/if}
</div>

<style>
  .scene.fill {
    height: 100%;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .fill svg {
    height: 100%;
  }
  .legend {
    margin-top: 6px;
  }
</style>
