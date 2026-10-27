// Ruido determinista en CPU. También permite generar mosaicos periódicos:
// period es el número de celdas que se repiten, no el tamaño en píxeles.
export function hash2(x, y, seed = 0) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 144269);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

const wrap = (n, period) => ((n % period) + period) % period;
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;

export function noise2(x, y, seed = 0, period = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x - ix), fy = fade(y - iy);
  const sample = (a, b) => hash2(period ? wrap(a, period) : a, period ? wrap(b, period) : b, seed);
  return mix(mix(sample(ix, iy), sample(ix + 1, iy), fx),
    mix(sample(ix, iy + 1), sample(ix + 1, iy + 1), fx), fy);
}

export function fbm2(x, y, seed = 0, octaves = 5) {
  let value = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2(x, y, seed + i * 7);
    total += amplitude;
    x = x * 2.03 + 17.1;
    y = y * 2.03 - 9.2;
    amplitude *= 0.5;
  }
  return value / total;
}

export function periodicFbm(u, v, seed = 0, cells = 4, octaves = 5) {
  let value = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    const period = cells * 2 ** i;
    value += amplitude * noise2(u * period, v * period, seed + i * 7, period);
    total += amplitude;
    amplitude *= 0.5;
  }
  return value / total;
}

export function cellular(u, v, seed, cells = 7) {
  const x = u * cells, y = v * cells;
  const ix = Math.floor(x), iy = Math.floor(y);
  let first = 10, second = 10;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = ix + i, cy = iy + j;
      const wx = wrap(cx, cells), wy = wrap(cy, cells);
      const dx = cx + hash2(wx, wy, seed) - x;
      const dy = cy + hash2(wx, wy, seed + 1) - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < first) { second = first; first = d; }
      else if (d < second) second = d;
    }
  }
  return second - first;
}
