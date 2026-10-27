import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, createTerrainBase, createTerrainWireframe } from './terrain.js';
import { createTerrainNormalTexture } from './terrainNormals.js';
import { createMacroData } from './macroVariation.js';
import { createSurfaceTextures } from './textures.js';
import { createTerrainUniforms, createTerrainMaterial } from './terrainMaterial.js';
import { DroneFlight } from './droneCamera.js';

export class TerrainScene {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.dirty = true;
    this.renderer.domElement.setAttribute('aria-label', 'Terreno 3D. Arrastrá para orbitar, rueda para acercar y botón derecho para desplazar.');
    container.prepend(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#bdd2e2');
    this.scene.fog = new THREE.Fog('#bdd2e2', 2100, 5200);
    this.camera = new THREE.PerspectiveCamera(40, 1, 1, 8000);
    this.orbitalCamera = this.camera;
    this.cameraMode = 'orbital';
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.addEventListener('change', () => this.invalidate());
    this.controls.minDistance = 12;
    this.controls.maxDistance = 2800;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.resetCamera();

    this.fillLight = new THREE.HemisphereLight('#e8f0ff', '#91815d', 0.8);
    this.scene.add(this.fillLight);
    this.sun = new THREE.DirectionalLight('#fff2db', 4.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -900, right: 900, top: 900, bottom: -900, near: 1, far: 3200 });
    this.sun.shadow.bias = -0.0002;
    this.sun.shadow.normalBias = 1.5;
    this.scene.add(this.sun, this.sun.target);
    this.setSun(135);

    const surfaceAssets = createSurfaceTextures(this.renderer);
    this.textures = surfaceAssets.textures;
    this.macroFrequency = 2;
    this.ready = surfaceAssets.ready.then(() => { this.invalidate(); return this; });
    const terrainGeometry = createTerrain();
    this.drone = new DroneFlight(terrainGeometry);
    this.textures.terrainNormals = createTerrainNormalTexture(terrainGeometry);
    this.uniforms = createTerrainUniforms(this.textures);
    this.terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshPhongMaterial({ color: '#727f56' }));
    this.terrain.receiveShadow = this.terrain.castShadow = true;
    this.scene.add(this.terrain);
    this.wireframe = createTerrainWireframe(this.terrain);
    const base = createTerrainBase(this.terrain.geometry);
    base.receiveShadow = base.castShadow = true;
    this.scene.add(base);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.MeshPhongMaterial({ color: '#d1d3c5', shininess: 0 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -22.2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.compareMaterial = null;
    this.comparison = false;
    this.useMacro = true;
    this.animateSun = false;
    this.sunAngle = 135;
    this.validationTarget = new THREE.WebGLRenderTarget(8, 8);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.previousTime = 0;
    this.renderer.setAnimationLoop((time) => this.render(time));
  }

  resetCamera() {
    this.controls.target.set(0, 45, 0);
    this.framingFactor = Math.max(1, 1.35 / this.orbitalCamera.aspect);
    this.orbitalCamera.position.set(1180, 850, 1280).sub(this.controls.target)
      .multiplyScalar(this.framingFactor).add(this.controls.target);
    this.controls.update();
  }

  closeCamera() {
    this.controls.target.set(80, 170, 20);
    this.orbitalCamera.position.set(340, 260, 355).sub(this.controls.target)
      .multiplyScalar(this.framingFactor).add(this.controls.target);
    this.controls.update();
  }

  setCameraMode(mode) {
    if (mode === this.cameraMode) return;
    this.cameraMode = mode;
    this.controls.enabled = mode === 'orbital';
    this.camera = mode === 'drone' ? this.drone.camera : this.orbitalCamera;
    if (mode === 'drone') this.drone.update(0, true);
    this.previousTime = 0;
    this.resize();
  }

  updateDrone(key, value) {
    this.drone.settings[key] = value;
    if (key === 'heading') {
      this.drone.buildRoute();
      this.drone.restart();
      this.onDroneEnd?.();
    } else this.drone.update(0, true);
    this.invalidate();
  }

  restartDrone() {
    this.drone.restart();
    this.onDroneEnd?.();
    this.invalidate();
  }

  invalidate() {
    this.dirty = true;
  }

  setWireframe(visible) {
    this.wireframe.visible = visible;
    this.invalidate();
  }

  setMacroFrequency(frequency) {
    this.macroFrequency = THREE.MathUtils.clamp(frequency, 0.5, 3.5);
    const texture = this.textures.macro;
    texture.image.data = createMacroData(texture.image.width, this.macroFrequency);
    texture.needsUpdate = true;
    this.invalidate();
  }

  setShadows(enabled) {
    if (this.renderer.shadowMap.enabled === enabled) return;
    this.renderer.shadowMap.enabled = enabled;
    this.renderer.shadowMap.needsUpdate = enabled;
    // Cambiar el flag del renderer detiene el mapa, pero los programas ya
    // compilados conservan USE_SHADOWMAP hasta invalidar los materiales.
    const materials = new Set([this.compareMaterial]);
    this.scene.traverse((object) => {
      if (Array.isArray(object.material)) object.material.forEach((material) => materials.add(material));
      else if (object.material) materials.add(object.material);
    });
    for (const material of materials) if (material) material.needsUpdate = true;
    this.invalidate();
  }

  // Azimut: 0° en +X y 90° en +Z. Elevación: 0° horizonte, 90° cenit.
  setSun(degrees, elevation = this.sunElevation ?? 37) {
    this.sunAngle = degrees;
    this.sunElevation = THREE.MathUtils.clamp(elevation, 0, 90);
    const azimuth = THREE.MathUtils.degToRad(degrees);
    const altitude = THREE.MathUtils.degToRad(this.sunElevation);
    const radius = 1400;
    this.sun.target.position.set(0, 80, 0);
    this.sun.position.set(
      radius * Math.cos(altitude) * Math.cos(azimuth),
      radius * Math.sin(altitude),
      radius * Math.cos(altitude) * Math.sin(azimuth),
    ).add(this.sun.target.position);
    this.renderer.shadowMap.needsUpdate = true;
    this.invalidate();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.orbitalCamera.aspect = width / height;
    const nextFactor = Math.max(1, 1.35 / this.orbitalCamera.aspect);
    this.orbitalCamera.position.sub(this.controls.target).multiplyScalar(nextFactor / this.framingFactor).add(this.controls.target);
    this.framingFactor = nextFactor;
    this.orbitalCamera.updateProjectionMatrix();
    this.drone.camera.aspect = width / height;
    this.drone.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.invalidate();
  }

  compile(source) {
    const candidate = createTerrainMaterial(source, this.uniforms, { useMacro: this.useMacro });
    const oldMaterial = this.terrain.material;
    const previousErrorHandler = this.renderer.debug.onShaderError;
    const previousTarget = this.renderer.getRenderTarget();
    const viewport = this.renderer.getViewport(new THREE.Vector4());
    const scissor = this.renderer.getScissor(new THREE.Vector4());
    const scissorTest = this.renderer.getScissorTest();
    const shadowEnabled = this.renderer.shadowMap.enabled;
    let diagnostics = '';
    this.renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      diagnostics = [gl.getShaderInfoLog(fragment), gl.getShaderInfoLog(vertex), gl.getProgramInfoLog(program)]
        .filter(Boolean).join('\n');
    };
    try {
      this.terrain.material = candidate;
      this.renderer.setScissorTest(false);
      this.renderer.setRenderTarget(this.validationTarget);
      // Conservamos el mismo programa de luces/sombras que el render visible.
      // El primer draw fuerza la compilación y expone los errores del driver.
      this.renderer.render(this.scene, this.camera);
      if (diagnostics) throw new Error(diagnostics);
      this.terrain.material = candidate;
      oldMaterial.dispose();
      return { ok: true };
    } catch (error) {
      this.terrain.material = oldMaterial;
      candidate.dispose();
      return { ok: false, error: diagnostics || error.message };
    } finally {
      this.renderer.debug.onShaderError = previousErrorHandler;
      this.renderer.shadowMap.enabled = shadowEnabled;
      this.renderer.setRenderTarget(previousTarget);
      this.renderer.setViewport(viewport);
      this.renderer.setScissor(scissor);
      this.renderer.setScissorTest(scissorTest);
      this.invalidate();
    }
  }

  setPrevious(source, useMacro = true) {
    this.compareMaterial?.dispose();
    this.compareMaterial = source
      ? createTerrainMaterial(source, this.uniforms, { useMacro })
      : new THREE.MeshPhongMaterial({ color: '#727f56', shininess: 22 });
    this.invalidate();
  }

  render(time) {
    const delta = this.previousTime ? Math.min((time - this.previousTime) / 1000, 0.1) : 0;
    this.previousTime = time;
    if (this.animateSun) this.setSun((this.sunAngle + delta * 10) % 360);
    if (this.cameraMode === 'orbital') this.controls.update();
    if (this.cameraMode === 'drone' && this.drone.settings.playing) {
      if (this.drone.update(delta)) this.onDroneEnd?.();
      this.invalidate();
    }
    // Escena estática: no consumimos GPU cuando nadie cambia cámara o material.
    if (!this.dirty && !this.animateSun) return;
    this.dirty = false;
    const { renderer, scene, camera } = this;
    if (this.comparison && this.compareMaterial) {
      const width = this.container.clientWidth, height = this.container.clientHeight;
      const current = this.terrain.material;
      renderer.setScissorTest(true);
      renderer.setScissor(0, 0, width / 2, height);
      this.terrain.material = this.compareMaterial;
      renderer.render(scene, camera);
      renderer.setScissor(width / 2, 0, width / 2, height);
      this.terrain.material = current;
      renderer.render(scene, camera);
      renderer.setScissorTest(false);
    } else {
      renderer.render(scene, camera);
    }
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    const materials = new Set();
    const geometries = new Set();
    this.scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    for (const geometry of geometries) geometry.dispose();
    materials.add(this.compareMaterial);
    for (const material of materials) material?.dispose();
    for (const texture of Object.values(this.textures)) texture.dispose();
    this.validationTarget.dispose();
    this.renderer.dispose();
  }
}
