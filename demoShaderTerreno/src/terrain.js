import * as THREE from 'three';
import { fbm2, noise2 } from './noise.js';

export const TERRAIN_SIZE = 1200;

export function terrainHeight(x, z) {
  const peak = (cx, cz, sx, sz, height) => height * Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));
  const mass = peak(-105, -85, 190, 210, 270)
    + peak(120, -5, 145, 180, 235)
    + peak(-195, 155, 150, 130, 170)
    + peak(185, 205, 170, 145, 145);
  const ridge = 1 - Math.abs(2 * noise2(x / 48 + 19, z / 48 - 7, 42) - 1);
  const variation = (fbm2(x / 100, z / 100, 31, 6) - 0.5) * 90;
  const falloff = Math.max(0, 1 - (Math.max(Math.abs(x), Math.abs(z)) / 600) ** 6);
  return Math.max(0, (mass * (0.7 + 0.4 * ridge) + variation + 12) * falloff);
}

export function createTerrain(segments = 384) {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    position.setY(i, terrainHeight(position.getX(i), position.getZ(i)));
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createTerrainWireframe(terrain) {
  const material = new THREE.MeshBasicMaterial({
    color: '#111111', wireframe: true, transparent: true, opacity: 0.3,
    depthTest: true, depthWrite: false, toneMapped: false,
  });
  const overlay = new THREE.Mesh(terrain.geometry, material);
  overlay.name = 'Wireframe superpuesto';
  overlay.visible = false;
  overlay.renderOrder = 20;
  terrain.add(overlay);
  return overlay;
}

export function createTerrainBase(geometry) {
  // Cerramos el corte del terreno con una pared; no forma parte del shader editable.
  const p = geometry.attributes.position;
  const side = Math.sqrt(p.count), last = side - 1;
  const perimeter = [];
  for (let i = 0; i < last; i++) perimeter.push(i);
  for (let i = 0; i < last; i++) perimeter.push(i * side + last);
  for (let i = last; i > 0; i--) perimeter.push(last * side + i);
  for (let i = last; i > 0; i--) perimeter.push(i * side);
  const positions = [];
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i], b = perimeter[(i + 1) % perimeter.length];
    const topA = [p.getX(a), p.getY(a), p.getZ(a)];
    const topB = [p.getX(b), p.getY(b), p.getZ(b)];
    const bottomA = [p.getX(a), -22, p.getZ(a)];
    const bottomB = [p.getX(b), -22, p.getZ(b)];
    positions.push(...topA, ...bottomA, ...topB, ...topB, ...bottomA, ...bottomB);
  }
  const wall = new THREE.BufferGeometry();
  wall.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  wall.computeVertexNormals();
  return new THREE.Mesh(wall, new THREE.MeshPhongMaterial({ color: '#625b49', side: THREE.DoubleSide }));
}
