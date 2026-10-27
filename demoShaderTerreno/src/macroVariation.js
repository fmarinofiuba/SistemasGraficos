import * as THREE from 'three';
import { noise2 } from './noise.js';

export const MACRO_SIZE = 256;

// Un mapa para todo el terreno, no un mosaico que se repite. R/G/B contienen
// campos independientes para pasto, suelo y roca. El cálculo se hace una vez.
export function createMacroData(size = MACRO_SIZE, frequency = 1) {
  const fields = new Float32Array(size * size * 3);
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  const seeds = [107, 263, 419];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Escalamos alrededor del centro sin repetir ni recortar el mapa.
      const u = (x / (size - 1) - 0.5) * frequency + 0.5;
      const v = (y / (size - 1) - 0.5) * frequency + 0.5;
      for (let channel = 0; channel < 3; channel++) {
        const seed = seeds[channel];
        // Predominan extensiones de 180–520 m; el tercer nivel es secundario.
        const value = noise2(u * 2.3 + 17, v * 2.3 + 23, seed) * 0.68
          + noise2(u * 6.4 + 47, v * 6.4 + 9, seed + 13) * 0.25
          + noise2(u * 13.2 + 7, v * 13.2 + 31, seed + 37) * 0.07;
        fields[(y * size + x) * 3 + channel] = value;
        minimum[channel] = Math.min(minimum[channel], value);
        maximum[channel] = Math.max(maximum[channel], value);
      }
    }
  }
  const bytes = new Uint8Array(size * size * 4);
  for (let pixel = 0; pixel < size * size; pixel++) {
    for (let channel = 0; channel < 3; channel++) {
      const normalized = (fields[pixel * 3 + channel] - minimum[channel]) / Math.max(1e-6, maximum[channel] - minimum[channel]);
      const t = Math.min(1, Math.max(0, (normalized - 0.12) / 0.76));
      bytes[pixel * 4 + channel] = Math.round(255 * t * t * (3 - 2 * t));
    }
    bytes[pixel * 4 + 3] = 255;
  }
  return bytes;
}

export function createMacroTexture() {
  const texture = new THREE.DataTexture(createMacroData(MACRO_SIZE, 2), MACRO_SIZE, MACRO_SIZE, THREE.RGBAFormat);
  texture.name = 'Variación macro · R pasto, G suelo, B roca';
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
