<script>
  // Tira con los modelos del ejercicio (forma, letra y dimensiones).
  import { describeParams, modelPolygon, polygonBBox } from '../core/primitives.js';
  import Shape from './Shape.svelte';

  let { doc, size = 60 } = $props();

  const models = $derived(Object.entries(doc.modelos));

  function box(modelo) {
    const bb = polygonBBox(modelPolygon(modelo));
    const s = Math.max(bb.w, bb.h, 20) * 0.7;
    return `${bb.cx - s} ${-(bb.cy + s)} ${2 * s} ${2 * s}`;
  }
</script>

<div class="strip">
  {#each models as [letra, m] (letra)}
    <div class="model">
      <svg viewBox={box(m)} width={size} height={size}>
        <g transform="scale(1 -1)"><Shape modelo={m} {letra} matrix={[1, 0, 0, 1, 0, 0]} /></g>
      </svg>
      <div class="name">modelo {letra}</div>
      <div class="dims">{describeParams(m)}</div>
    </div>
  {/each}
</div>

<style>
  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: center;
  }
  .model {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
  }
  .model svg {
    display: block;
  }
  .name {
    font-weight: 700;
  }
  .dims {
    font-size: 11px;
    color: var(--muted);
  }
</style>
