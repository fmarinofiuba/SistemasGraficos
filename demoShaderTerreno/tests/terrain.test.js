import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { periodicFbm, cellular } from '../src/noise.js';
import { createTerrain } from '../src/terrain.js';
import { PRESETS } from '../src/presets.js';
import { patchTerrainShader, createTerrainMaterial } from '../src/terrainMaterial.js';
import { SURFACE_URLS, TILE_SIZE } from '../src/textures.js';

test('los campos periódicos auxiliares son continuos al repetir en ambos ejes', () => {
  for (const field of [
    (u, v) => periodicFbm(u, v, 15, 8, 4),
    (u, v) => periodicFbm(u, v, 62, 3, 4),
    (u, v) => cellular(u, v, 80, 6),
  ]) {
    for (const t of [0, 0.13, 0.49, 0.89, 1]) {
      assert.ok(Math.abs(field(0, t) - field(1, t)) < 1e-10);
      assert.ok(Math.abs(field(t, 0) - field(t, 1)) < 1e-10);
      assert.ok(Math.abs(field(-0.23, t) - field(0.77, t)) < 1e-10);
    }
  }
});

test('las tres imágenes IA existen y tienen la resolución cuadrada declarada', async () => {
  assert.equal(Object.keys(SURFACE_URLS).length, 3);
  for (const url of Object.values(SURFACE_URLS)) {
    const png = await readFile(new URL(url));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), TILE_SIZE);
    assert.equal(png.readUInt32BE(20), TILE_SIZE);
  }
});

test('el terreno tiene normales unitarias hacia arriba, índices válidos y extensión completa', () => {
  const geometry = createTerrain(32);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  assert.equal(position.count, 33 * 33);
  assert.equal(geometry.index.count, 32 * 32 * 6);
  assert.equal(geometry.boundingBox.min.x, -600);
  assert.equal(geometry.boundingBox.max.x, 600);
  assert.equal(geometry.boundingBox.min.z, -600);
  assert.equal(geometry.boundingBox.max.z, 600);
  for (let i = 0; i < position.count; i++) {
    assert.ok(Number.isFinite(position.getY(i)));
    assert.ok(Math.abs(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1) < 1e-6);
    assert.ok(normal.getY(i) > 0);
  }
  for (const index of geometry.index.array) assert.ok(index < position.count);
  geometry.dispose();
});

test('los cinco presets se integran con los chunks reales de la versión instalada sin mutarlos', () => {
  const originalVertex = THREE.ShaderLib.phong.vertexShader;
  const originalFragment = THREE.ShaderLib.phong.fragmentShader;
  const keys = new Set();
  for (const preset of PRESETS) {
    const shader = { vertexShader: originalVertex, fragmentShader: originalFragment, uniforms: {} };
    patchTerrainShader(shader, preset.source, {});
    assert.ok(shader.fragmentShader.includes('#line 1\n' + preset.source));
    assert.ok(shader.fragmentShader.includes('diffuseColor.rgb = max(terrainC'));
    assert.ok(shader.fragmentShader.includes('#include <lights_fragment_begin>'));
    const material = createTerrainMaterial(preset.source, {});
    keys.add(material.customProgramCacheKey());
    material.dispose();
  }
  assert.equal(keys.size, 5);
  assert.equal(THREE.ShaderLib.phong.vertexShader, originalVertex);
  assert.equal(THREE.ShaderLib.phong.fragmentShader, originalFragment);
});

test('la integración informa si una actualización elimina un punto de extensión', () => {
  assert.throws(() => patchTerrainShader({ vertexShader: '', fragmentShader: '', uniforms: {} }, '', {}), /falta #include/);
});
