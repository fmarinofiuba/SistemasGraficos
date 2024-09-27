import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, container, sceneManager;

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x999999);
	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(2, 1, 2);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	window.addEventListener('resize', onResize);
	onResize();
}

function buildScene() {
	const light = new THREE.DirectionalLight(0xffffff, 3);

	light.position.set(1, 1, 1);
	scene.add(light);

	const ambientLight = new THREE.AmbientLight(0x666666);
	scene.add(ambientLight);

	const hemiLight = new THREE.HemisphereLight(0x9999ff, 0x996644);

	scene.add(hemiLight);

	const grid = new THREE.GridHelper(5, 10);
	grid.position.y = -2;
	scene.add(grid);

	const axes = new THREE.AxesHelper(3);
	scene.add(axes);

	const loader = new GLTFLoader();
	loader.load('models/helmet/DamagedHelmet.gltf', onModelLoaded, onProgress, onLoadError);
}

function onModelLoaded(gltf) {
	console.log('Model loaded', gltf);
	gltf.scene;

	scene.add(gltf.scene);
}

function onProgress(event) {
	console.log((event.loaded / event.total) * 100 + '% loaded');
}

function onLoadError(event) {
	console.error('Error loading', event);
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
animate();
