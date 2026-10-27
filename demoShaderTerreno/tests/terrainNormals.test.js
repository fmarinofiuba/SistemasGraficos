import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTerrain, createTerrainWireframe } from '../src/terrain.js';
import { createTerrainNormalTexture } from '../src/terrainNormals.js';

test('un plano inclinado conserva una normal constante con precisión de 16 bits', () => {
  const geometry = new THREE.PlaneGeometry(40, 40, 8, 8).rotateX(-Math.PI / 2);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getX(i) * 0.25 - p.getZ(i) * 0.4);
  const positions = p.array.slice();
  const texture = createTerrainNormalTexture(geometry);
  const expected = new THREE.Vector3(-0.25, 1, 0.4).normalize();
  for (let i = 0; i < p.count; i++) {
    assert.ok(Math.abs(THREE.DataUtils.fromHalfFloat(texture.image.data[i * 4]) - expected.x) < 0.001);
    assert.ok(Math.abs(THREE.DataUtils.fromHalfFloat(texture.image.data[i * 4 + 1]) - expected.y) < 0.001);
    assert.ok(Math.abs(THREE.DataUtils.fromHalfFloat(texture.image.data[i * 4 + 2]) - expected.z) < 0.001);
  }
  assert.deepEqual(p.array, positions);
  assert.equal(texture.type, THREE.HalfFloatType);
  assert.equal(texture.colorSpace, THREE.NoColorSpace);
  texture.dispose(); geometry.dispose();
});

test('el campo de normales no depende de las diagonales de los triángulos', () => {
  const first = createTerrain(8), second = first.clone();
  const indices = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const a = y * 9 + x, b = a + 9, c = b + 1, d = a + 1;
    indices.push(a, b, c, a, c, d);
  }
  second.setIndex(indices);
  const normalA = createTerrainNormalTexture(first), normalB = createTerrainNormalTexture(second);
  assert.deepEqual(normalA.image.data, normalB.image.data);
  normalA.dispose(); normalB.dispose(); first.dispose(); second.dispose();
});

test('el wireframe se superpone sin sustituir el material de la superficie', () => {
  const geometry = createTerrain(8);
  const material = new THREE.MeshPhongMaterial();
  const terrain = new THREE.Mesh(geometry, material);
  const overlay = createTerrainWireframe(terrain);
  assert.equal(terrain.material, material);
  assert.equal(material.wireframe, false);
  assert.equal(overlay.parent, terrain);
  assert.equal(overlay.geometry, terrain.geometry);
  assert.equal(overlay.material.wireframe, true);
  assert.equal(overlay.material.depthTest, true);
  assert.equal(overlay.material.depthWrite, false);
  assert.equal(overlay.visible, false);
  overlay.material.dispose(); material.dispose(); geometry.dispose();
});
