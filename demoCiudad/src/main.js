import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { CityGenerator } from "./cityGenerator.js";
import * as dat from "dat.gui";

let scene, camera, renderer, container, cityGenerator;

function setupThreeJs() {
  container = document.getElementById("container3D");

  renderer = new THREE.WebGLRenderer();
  scene = new THREE.Scene();

  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(80, 50, 60);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", onResize);
  onResize();
}

function buildScene() {
  const gridHelper = new THREE.GridHelper(500, 50);
  scene.add(gridHelper);

  cityGenerator = new CityGenerator(scene, renderer);

  cityGenerator.generate();
  cityGenerator.factorDiaNoche = 0;
}

function createMenu() {
  const gui = new dat.GUI();
  gui.add(cityGenerator, "dayNightFactor", 0, 1, 0.01);
}

function onResize() {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

setupThreeJs();
buildScene();
createMenu();
animate();
