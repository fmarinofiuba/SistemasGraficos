import * as THREE from 'three';
import { TERRAIN_GLSL, APPLY_COLOR, APPLY_NORMAL, APPLY_DIAGNOSTIC } from './shaderChunks.js';
import { TERRAIN_SIZE } from './terrain.js';

export function createTerrainUniforms(textures) {
  return {
    uGrass: { value: textures.grass }, uDirt: { value: textures.dirt }, uRock: { value: textures.rock },
    uMacroMap: { value: textures.macro },
    uMacroBounds: { value: new THREE.Vector4(-TERRAIN_SIZE / 2, -TERRAIN_SIZE / 2, 1 / TERRAIN_SIZE, 1 / TERRAIN_SIZE) },
    uMacroEnabled: { value: 1 }, uMacroStrength: { value: 1.0 },
    uTerrainNormalMap: { value: textures.terrainNormals || null },
    uTerrainNormalsEnabled: { value: textures.terrainNormals ? 1 : 0 },
    uTerrainNormalSize: { value: new THREE.Vector2(textures.terrainNormals?.image.width || 1, textures.terrainNormals?.image.height || 1) },
    uTerrainWorldNormalMatrix: { value: new THREE.Matrix3() },
    uPixelFootprint: { value: new THREE.Vector2(0.001, 0) },
    uSnowDetail: { value: 1 }, uSnowBlend: { value: 1 },
    uSnowMaxSlope: { value: THREE.MathUtils.radToDeg(Math.acos(0.45)) },
    uSnowHeight: { value: 205 }, uRockSlope: { value: 0.32 },
    uNoiseScale: { value: 0.015 }, uNoiseAmount: { value: 0.55 },
    uWindAngle: { value: 0.7 }, uRelief: { value: 1.0 },
    uTriplanar: { value: 1 }, uView: { value: 0 },
  };
}

function insert(source, marker, replacement) {
  if (!source.includes(marker)) throw new Error(`El shader de Three.js cambió: falta ${marker}.`);
  return source.replace(marker, replacement);
}

// Único punto de acoplamiento con los chunks internos de Three.js r186.
// No modificamos ShaderChunk globalmente: cada material tiene su propio programa.
export function patchTerrainShader(shader, source, uniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = insert(shader.vertexShader, '#include <common>', `#include <common>
varying vec3 vTerrainPosition;
varying vec3 vTerrainNormal;
varying vec2 vTerrainMacroUv;
uniform vec4 uMacroBounds;`);
  shader.vertexShader = insert(shader.vertexShader, '#include <begin_vertex>', `#include <begin_vertex>
vTerrainPosition = (modelMatrix * vec4(position, 1.0)).xyz;
vTerrainNormal = inverseTransformDirection(transformedNormal, viewMatrix);
vTerrainMacroUv = (position.xz - uMacroBounds.xy) * uMacroBounds.zw;`);
  shader.fragmentShader = insert(shader.fragmentShader, '#include <common>', `#include <common>
${TERRAIN_GLSL}
// Las líneas 1..999 corresponden al código visible en el editor.
#line 1
${source}
#line 1000
`);
  shader.fragmentShader = insert(shader.fragmentShader, '#include <map_fragment>', `#include <map_fragment>\n${APPLY_COLOR}`);
  shader.fragmentShader = insert(shader.fragmentShader, '#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${APPLY_NORMAL}`);
  shader.fragmentShader = insert(shader.fragmentShader, '#include <opaque_fragment>', `${APPLY_DIAGNOSTIC}\n#include <opaque_fragment>`);
  shader.fragmentShader = insert(shader.fragmentShader, '#include <tonemapping_fragment>', 'if (uView < 0.5) {\n#include <tonemapping_fragment>\n}');
}

export function createTerrainMaterial(source, uniforms, { useMacro = true } = {}) {
  const material = new THREE.MeshPhongMaterial({
    color: '#ffffff', specular: '#222222', shininess: 22,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  material.name = 'Terreno · GLSL sobre MeshPhongMaterial';
  material.defines = { TERRAIN_USE_MACRO: useMacro ? 1 : 0 };
  material.onBeforeCompile = (shader) => patchTerrainShader(shader, source, uniforms);
  const bufferSize = new THREE.Vector2();
  material.onBeforeRender = (renderer, scene, camera, geometry, object) => {
    uniforms.uTerrainWorldNormalMatrix?.value.getNormalMatrix(object.matrixWorld);
    if (uniforms.uPixelFootprint) {
      renderer.getDrawingBufferSize(bufferSize);
      const height = Math.max(1, bufferSize.y);
      if (camera.isPerspectiveCamera) uniforms.uPixelFootprint.value.set(2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / height, 0);
      else uniforms.uPixelFootprint.value.set(0, Math.abs(camera.top - camera.bottom) / (camera.zoom * height));
    }
  };
  // El callback captura source: su texto de función no identifica sus cambios.
  material.customProgramCacheKey = () => source;
  return material;
}
