// Texturas diagnósticas de baja resolución (16 × 16 texels) y el muestreo nearest / linear sobre ellas.
// Fila 0 = borde inferior de la textura (v = 0), igual que un DataTexture de Three.js sin flipY.
export const TEX_N = 16;

function hsl(h, s, l) {
	s /= 100;
	l /= 100;
	const k = (n) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function build(fn) {
	const data = new Uint8Array(TEX_N * TEX_N * 4);
	for (let j = 0; j < TEX_N; j++)
		for (let i = 0; i < TEX_N; i++) {
			const [r, g, b] = fn(i, j);
			const o = (j * TEX_N + i) * 4;
			data[o] = r;
			data[o + 1] = g;
			data[o + 2] = b;
			data[o + 3] = 255;
		}
	return data;
}

// Colores bien distintos entre vecinos: se ve con claridad qué texel(es) elige el sampler.
function texelColors() {
	let seed = 7;
	const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
	return build(() => hsl(Math.floor(rnd() * 12) * 30 + rnd() * 10, 65 + rnd() * 30, 38 + rnd() * 28));
}

// Gradiente rojo (U) / verde (V) con tramas alternadas: cada texel se identifica por su color.
function numbered() {
	return build((i, j) => {
		const k = (i + j) % 2 ? 0.82 : 1;
		return [Math.round((40 + (i / (TEX_N - 1)) * 200) * k), Math.round((40 + (j / (TEX_N - 1)) * 200) * k), Math.round(90 * k)];
	});
}

function checker() {
	return build((i, j) => ((i >> 1) + (j >> 1)) % 2 ? [232, 232, 236] : [40, 46, 62]);
}

export const SAMPLING_TEXTURES = [
	{ value: 'texels', label: 'Texels de colores', data: texelColors() },
	{ value: 'numbered', label: 'Cuadrícula UV numerada', data: numbered(), numbered: true },
	{ value: 'checker', label: 'Checker', data: checker() },
];

export const textureByValue = (v) => SAMPLING_TEXTURES.find((t) => t.value === v) || SAMPLING_TEXTURES[0];

const clampI = (i) => (i < 0 ? 0 : i > TEX_N - 1 ? TEX_N - 1 : i);

export function texelAt(tex, i, j) {
	const o = (clampI(j) * TEX_N + clampI(i)) * 4;
	return [tex.data[o], tex.data[o + 1], tex.data[o + 2]];
}

// La mezcla se hace en espacio lineal, como la GPU con una textura sRGB.
const toLin = (c) => Math.pow(c / 255, 2.2);
const toSrgb = (x) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, x)), 1 / 2.2));

export function mix(colors, weights) {
	return [0, 1, 2].map((ch) => toSrgb(colors.reduce((a, c, k) => a + weights[k] * toLin(c[ch]), 0)));
}

export function sampleNearest(tex, u, v) {
	const i = clampI(Math.floor(u * TEX_N));
	const j = clampI(Math.floor(v * TEX_N));
	return { i, j, color: texelAt(tex, i, j) };
}

// Vecinos A (arriba-izq), B (arriba-der), C (abajo-izq), D (abajo-der) alrededor del punto,
// con pesos bilineales. Los centros de texel están en (i + 0.5) / N.
export function sampleLinear(tex, u, v) {
	const x = u * TEX_N - 0.5;
	const y = v * TEX_N - 0.5;
	const i0 = Math.floor(x);
	const j0 = Math.floor(y);
	const fx = x - i0;
	const fy = y - j0;
	const cells = [
		{ key: 'A', i: i0, j: j0 + 1, w: (1 - fx) * fy },
		{ key: 'B', i: i0 + 1, j: j0 + 1, w: fx * fy },
		{ key: 'C', i: i0, j: j0, w: (1 - fx) * (1 - fy) },
		{ key: 'D', i: i0 + 1, j: j0, w: fx * (1 - fy) },
	];
	for (const c of cells) c.color = texelAt(tex, c.i, c.j);
	return { cells, fx, fy, color: mix(cells.map((c) => c.color), cells.map((c) => c.w)) };
}

export const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
export const hex = (c) => '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
