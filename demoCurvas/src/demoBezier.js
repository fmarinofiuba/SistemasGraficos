import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, container;

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xcccccc);
	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 1000);
	camera.position.set(0, 10, 0);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	const light = new THREE.DirectionalLight(0xffffff, 1);

	light.position.set(1, 1, 1);
	scene.add(light);

	const ambientLight = new THREE.AmbientLight(0x666666);
	scene.add(ambientLight);

	const grid = new THREE.GridHelper(20, 10);
	scene.add(grid);

	window.addEventListener('resize', onResize);
	onResize();
}

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.left = -10 * camera.aspect;
	camera.right = 10 * camera.aspect;
	camera.top = 10;
	camera.bottom = -10;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function buildCurve() {}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

setupThreeJs();
buildCurve();
animate();
