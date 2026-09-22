import * as THREE from 'three';

const makeCanvas = (size = 768) => {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	return canvas;
};

export function createUvDiagnosticTexture(size = 768) {
	const canvas = makeCanvas(size);
	const ctx = canvas.getContext('2d');
	const cell = size / 8;
	ctx.fillStyle = '#18243b';
	ctx.fillRect(0, 0, size, size);
	for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
		ctx.fillStyle = (x + y) % 2 ? '#283b61' : '#35517f';
		ctx.fillRect(x * cell, y * cell, cell, cell);
	}
	ctx.lineWidth = Math.max(2, size / 256);
	ctx.strokeStyle = 'rgba(255,255,255,.54)';
	for (let i = 0; i <= 8; i++) {
		ctx.beginPath();
		ctx.moveTo(i * cell, 0);
		ctx.lineTo(i * cell, size);
		ctx.moveTo(0, i * cell);
		ctx.lineTo(size, i * cell);
		ctx.stroke();
	}
	ctx.font = `700 ${Math.round(size / 31)}px system-ui`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
		ctx.lineWidth = size / 180;
		ctx.strokeStyle = 'rgba(0,0,0,.75)';
		ctx.strokeText(`${x},${7 - y}`, (x + 0.5) * cell, (y + 0.5) * cell);
		ctx.fillStyle = '#fff';
		ctx.fillText(`${x},${7 - y}`, (x + 0.5) * cell, (y + 0.5) * cell);
	}
	ctx.fillStyle = '#ff5c69';
	ctx.fillRect(0, size - size * 0.035, size, size * 0.035);
	ctx.fillStyle = '#48df91';
	ctx.fillRect(0, 0, size * 0.035, size);
	ctx.fillStyle = '#fff';
	ctx.font = `800 ${Math.round(size / 16)}px system-ui`;
	ctx.textAlign = 'right';
	ctx.fillText('U →', size - size * 0.035, size - size * 0.07);
	ctx.save();
	ctx.translate(size * 0.075, size * 0.14);
	ctx.rotate(-Math.PI / 2);
	ctx.fillText('V →', 0, 0);
	ctx.restore();
	return canvas;
}

export function createCheckerTexture(size = 768) {
	const canvas = makeCanvas(size);
	const ctx = canvas.getContext('2d');
	const cell = size / 12;
	for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
		ctx.fillStyle = (x + y) % 2 ? '#162035' : '#e7edf8';
		ctx.fillRect(x * cell, y * cell, cell, cell);
	}
	ctx.fillStyle = '#ffcf4a';
	ctx.beginPath();
	ctx.moveTo(size * 0.08, size * 0.9);
	ctx.lineTo(size * 0.28, size * 0.9);
	ctx.lineTo(size * 0.28, size * 0.84);
	ctx.lineTo(size * 0.41, size * 0.94);
	ctx.lineTo(size * 0.28, size);
	ctx.lineTo(size * 0.28, size * 0.95);
	ctx.lineTo(size * 0.08, size * 0.95);
	ctx.fill();
	return canvas;
}

export function createSweepBandsTexture(size = 768) {
	const canvas = makeCanvas(size);
	const ctx = canvas.getContext('2d');
	const bands = ['#173456', '#24628a', '#2b8f9d', '#38b99a', '#86d06c', '#d8c951'];
	for (let x = 0; x < bands.length; x++) {
		ctx.fillStyle = bands[x];
		ctx.fillRect((x * size) / bands.length, 0, size / bands.length + 1, size);
	}
	ctx.globalAlpha = 0.72;
	for (let y = 0; y < 12; y++) {
		ctx.fillStyle = y % 2 ? '#06111c' : '#fff';
		ctx.fillRect(0, (y * size) / 12, size, size / 42);
	}
	ctx.globalAlpha = 1;
	ctx.fillStyle = '#fff';
	ctx.font = `800 ${Math.round(size / 17)}px system-ui`;
	ctx.textAlign = 'center';
	ctx.fillText('u · recorrido →', size / 2, size * 0.12);
	ctx.save();
	ctx.translate(size * 0.08, size / 2);
	ctx.rotate(-Math.PI / 2);
	ctx.fillText('v · sección →', 0, 0);
	ctx.restore();
	return canvas;
}

export function canvasTexture(canvas) {
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 8;
	texture.needsUpdate = true;
	return texture;
}

export function loadColorTexture(url, onLoad, onError) {
	return new THREE.TextureLoader().load(url, (texture) => {
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = 8;
		texture.needsUpdate = true;
		onLoad?.(texture);
	}, undefined, onError);
}

export const ASSET_URLS = {
	terrain: new URL('../../../maps/terrain-planar-topdown.png', import.meta.url).href,
	cylindricalStone: new URL('../../../maps/piedra-cilindrica-seamless.png', import.meta.url).href,
	boxRock: new URL('../../../maps/roca-box-seamless.png', import.meta.url).href,
	earth: `${import.meta.env.BASE_URL}earth-equirectangular.jpg`,
	unwrapModel: `${import.meta.env.BASE_URL}modelo-unwrap.glb`,
	unwrapAtlas: `${import.meta.env.BASE_URL}modelo-unwrap-atlas.png`,
};
