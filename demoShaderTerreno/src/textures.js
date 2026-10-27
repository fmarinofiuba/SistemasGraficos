import * as THREE from 'three';
import { createMacroTexture } from './macroVariation.js';
export const TILE_SIZE = 1254;
export const TILE_METERS = Object.freeze({ grass: 4, dirt: 3, rock: 12 });
export const SURFACE_URLS = Object.freeze({
  grass: new URL('../maps/grass-ai-v1.png', import.meta.url).href,
  dirt: new URL('../maps/dirt-ai-v1.png', import.meta.url).href,
  rock: new URL('../maps/rock-ai-v1.png', import.meta.url).href,
});

// Imágenes de color generadas con IA. Su luminancia no determina el relieve.
export function createSurfaceTextures(renderer) {
  const loader = new THREE.TextureLoader();
  const textures = {};
  const pending = [];
  for (const [kind, url] of Object.entries(SURFACE_URLS)) {
    let texture;
    const loaded = new Promise((resolve, reject) => {
      texture = loader.load(url, () => resolve(texture), undefined,
        () => reject(new Error(`No se pudo cargar la textura ${kind}: ${url}`)));
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures[kind] = texture;
    pending.push(loaded);
  }
  textures.macro = createMacroTexture();
  const ready = Promise.all(pending).then(() => textures).catch((error) => {
    for (const texture of Object.values(textures)) texture.dispose();
    throw error;
  });
  return { textures, ready };
}
