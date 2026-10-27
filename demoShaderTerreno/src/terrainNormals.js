import * as THREE from 'three';

// Campo estructurado independiente de cómo se divida cada celda en triángulos.
// Las pendientes se estiman sobre la grilla, no promediando normales de caras.
export function createTerrainNormalTexture(geometry) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const side = Math.round(Math.sqrt(position.count));
  if (side * side !== position.count || side < 3) throw new Error('El campo de normales requiere una grilla cuadrada.');
  const data = new Uint16Array(side * side * 4);
  for (let z = 0; z < side; z++) {
    for (let x = 0; x < side; x++) {
      const left = z * side + Math.max(0, x - 1);
      const right = z * side + Math.min(side - 1, x + 1);
      const back = Math.max(0, z - 1) * side + x;
      const front = Math.min(side - 1, z + 1) * side + x;
      const slopeX = (position.getY(right) - position.getY(left)) / (position.getX(right) - position.getX(left));
      const slopeZ = (position.getY(front) - position.getY(back)) / (position.getZ(front) - position.getZ(back));
      const length = Math.hypot(slopeX, 1, slopeZ);
      const nx = -slopeX / length, ny = 1 / length, nz = -slopeZ / length;
      const index = z * side + x;
      normal.setXYZ(index, nx, ny, nz);
      data[index * 4] = THREE.DataUtils.toHalfFloat(nx);
      data[index * 4 + 1] = THREE.DataUtils.toHalfFloat(ny);
      data[index * 4 + 2] = THREE.DataUtils.toHalfFloat(nz);
      data[index * 4 + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }
  normal.needsUpdate = true;
  const texture = new THREE.DataTexture(data, side, side, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.name = 'Normales del terreno · precisión de 16 bits';
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
