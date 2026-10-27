import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { createMacroData, createMacroTexture, MACRO_SIZE } from '../src/macroVariation.js';
import { createTerrainMaterial } from '../src/terrainMaterial.js';

test('el mapa macro es determinista y contiene tres campos independientes de baja frecuencia', () => {
  assert.deepEqual(createMacroData(32), createMacroData(32));
  const data = createMacroData();
  let nearbyDifference = 0, distantDifference = 0, channelDifference = 0;
  const minima = [255, 255, 255], maxima = [0, 0, 0];
  for (let y = 0; y < MACRO_SIZE; y++) {
    for (let x = 0; x < MACRO_SIZE; x++) {
      const i = (y * MACRO_SIZE + x) * 4;
      assert.equal(data[i + 3], 255);
      for (let c = 0; c < 3; c++) {
        minima[c] = Math.min(minima[c], data[i + c]);
        maxima[c] = Math.max(maxima[c], data[i + c]);
      }
      channelDifference += Math.abs(data[i] - data[i + 1]) + Math.abs(data[i + 1] - data[i + 2]);
      if (x < MACRO_SIZE - 1) nearbyDifference += Math.abs(data[i] - data[i + 4]);
      if (x < MACRO_SIZE / 2) distantDifference += Math.abs(data[i] - data[i + (MACRO_SIZE / 2) * 4]);
    }
  }
  assert.deepEqual(minima, [0, 0, 0]);
  assert.deepEqual(maxima, [255, 255, 255]);
  assert.ok(channelDifference / (MACRO_SIZE ** 2 * 2) > 20);
  const nearbyMean = nearbyDifference / (MACRO_SIZE * (MACRO_SIZE - 1));
  const distantMean = distantDifference / (MACRO_SIZE ** 2 / 2);
  assert.ok(nearbyMean < 5, 'el mapa debe ser suave entre texels vecinos');
  assert.ok(distantMean > nearbyMean * 5, 'la variación debe aparecer a escala amplia');
});

test('el mapa macro se muestrea como datos lineales y no se repite', () => {
  const texture = createMacroTexture();
  assert.equal(texture.colorSpace, THREE.NoColorSpace);
  assert.equal(texture.wrapS, THREE.ClampToEdgeWrapping);
  assert.equal(texture.wrapT, THREE.ClampToEdgeWrapping);
  assert.equal(texture.image.data.length, MACRO_SIZE * MACRO_SIZE * 4);
  texture.dispose();
});

test('cada material puede habilitar la capa macro independientemente para comparar etapas', () => {
  const previous = createTerrainMaterial('shader compartido', {}, { useMacro: false });
  const current = createTerrainMaterial('shader compartido', {}, { useMacro: true });
  assert.equal(previous.defines.TERRAIN_USE_MACRO, 0);
  assert.equal(current.defines.TERRAIN_USE_MACRO, 1);
  previous.dispose(); current.dispose();
});

test('la paleta propia de la interfaz y del editor solo contiene grises', async () => {
  for (const path of ['../src/style.css', '../src/editor.js']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    for (const match of source.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
      let hex = match[1];
      if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
      if (hex.length !== 6 && hex.length !== 8) continue;
      assert.equal(hex.slice(0, 2), hex.slice(2, 4), `${path}: ${match[0]}`);
      assert.equal(hex.slice(2, 4), hex.slice(4, 6), `${path}: ${match[0]}`);
    }
    assert.ok(!/hsla?\(/i.test(source), 'la interfaz no debe reintroducir matices HSL');
  }
});
