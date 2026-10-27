import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTerrain } from '../src/terrain.js';
import { DroneFlight, terrainSampler } from '../src/droneCamera.js';

test('el muestreador respeta la superficie triangular y sus vértices', () => {
  const geometry = createTerrain(32);
  const sample = terrainSampler(geometry), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) assert.ok(Math.abs(sample(p.getX(i), p.getZ(i)) - p.getY(i)) < 1e-6);
  const side = 33, a = 14 * side + 15;
  const x = p.getX(a) * 0.5 + p.getX(a + 1) * 0.5;
  const z = p.getZ(a) * 0.5 + p.getZ(a + side) * 0.5;
  assert.ok(Math.abs(sample(x, z) - (p.getY(a + 1) + p.getY(a + side)) / 2) < 1e-6);
  geometry.dispose();
});

test('el vuelo sale de la cumbre, mantiene separación y termina hacia el exterior para todos los rumbos', () => {
  const geometry = createTerrain(128), flight = new DroneFlight(geometry);
  assert.ok(flight.camera.fov >= 70);
  for (const heading of [0, 35, 90, 180, 270, 360]) {
    flight.settings.heading = heading;
    flight.buildRoute(); flight.restart();
    assert.ok(Math.abs(flight.camera.position.x - flight.peak.x) < 1e-6);
    assert.ok(Math.abs(flight.camera.position.z - flight.peak.z) < 1e-6);
    for (let i = 0; i <= 500; i++) {
      const point = flight.positionAt(flight.length * i / 500);
      assert.ok(point.y - flight.sampleHeight(point.x, point.z) >= flight.settings.clearance - 1e-6);
      assert.ok(Math.abs(point.x) < 600 && Math.abs(point.z) < 600);
    }
    const end = flight.positionAt(flight.length);
    assert.ok(Math.max(Math.abs(end.x), Math.abs(end.z)) > 500);
    flight.update(1e6, true);
    assert.equal(flight.settings.playing, false);
    assert.ok(flight.camera.getWorldDirection(new THREE.Vector3()).y < -0.1);
    assert.ok(flight.camera.quaternion.toArray().every(Number.isFinite));
  }
  geometry.dispose();
});

test('velocidad, pausa y reinicio del dron funcionan independientemente del frame rate', () => {
  const geometry = createTerrain(64), flight = new DroneFlight(geometry);
  flight.settings.speed = 12;
  for (let i = 0; i < 60; i++) flight.update(1 / 60);
  assert.ok(Math.abs(flight.distance - 12) < 1e-6);
  flight.settings.playing = false;
  flight.update(10);
  assert.ok(Math.abs(flight.distance - 12) < 1e-6);
  flight.restart();
  assert.equal(flight.distance, 0);
  assert.equal(flight.settings.playing, true);
  geometry.dispose();
});
