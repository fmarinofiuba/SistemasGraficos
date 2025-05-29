import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SceneManager } from './sceneManager.js';
import { UIManager } from './UIManager.js';
import { ColorSpace } from './ColorSpace.js';

let scene, camera, renderer, container;
let sceneManager, uiManager, colorSpace, controls; // Added uiManager, colorSpace, and made controls accessible

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(5, 5, 5); // Adjusted camera for a 1x1x1 cube view
	camera.lookAt(0, 0, 0);

	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 1;
	controls.maxDistance = 10;
	// controls.target.set(0, 0, 0); // OrbitControls target is (0,0,0) by default

	// Basic lighting (as per spec: main.js or similar for initial setup)
	const ambientLight = new THREE.AmbientLight(0x666666); // Softer ambient light
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(1, 1.5, 1).normalize();
	scene.add(directionalLight);

	scene.background = new THREE.Color(0x333333); // Add a background color

	window.addEventListener('resize', onResize);
	onResize();
}

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
	requestAnimationFrame(animate);
	controls.update(); // Update OrbitControls

	// If SceneManager has its own animation logic (e.g. for animated transitions later)
	if (sceneManager && typeof sceneManager.animate === 'function') {
		sceneManager.animate();
	}

	renderer.render(scene, camera);
}

setupThreeJs();

// Instantiate managers
// SceneManager will be updated to accept camera and renderer for functionalities like 'fitCameraToCurrentSpace'
sceneManager = new SceneManager(scene, camera, renderer, controls);
colorSpace = new ColorSpace(scene);
uiManager = new UIManager(sceneManager, colorSpace); // UIManager's constructor will call its initUI
sceneManager.setDependencies(colorSpace, uiManager); // Set dependencies after all are instantiated

// Initial display call will be triggered by UIManager.initUI() -> sceneManager.setModel()
// For now, we can manually trigger the first display if UIManager isn't doing it yet.
// Initial display call will be triggered by UIManager's initUI, which should call sceneManager.setModel()
// For now, let's explicitly call it to see something on screen if UIManager.initUI is not yet complete.
if (uiManager.currentModel && uiManager.limits) {
	// Extract the limits for the current model. For RGB, it's { rMin, rMax, ... }
	// For HSV, it's { hMin, hMax, ... }. UIManager stores them flat, so we need to pick.
	let currentLimits = {};
	if (uiManager.currentModel === 'RGB') {
		currentLimits = {
			rMin: uiManager.limits.rMin,
			rMax: uiManager.limits.rMax,
			gMin: uiManager.limits.gMin,
			gMax: uiManager.limits.gMax,
			bMin: uiManager.limits.bMin,
			bMax: uiManager.limits.bMax,
		};
	}
	// Add similar blocks for CMY, HSV, HSL as they are implemented

	// Ensure colorSpace.displaySpace is called to render the initial model
	// This will eventually be driven by UIManager interactions.
	colorSpace.displaySpace(uiManager.currentModel, currentLimits);
	sceneManager.setModel(uiManager.currentModel); // Also inform SceneManager about the current model
	sceneManager.fitCameraToCurrentSpace(); // Adjust camera to the default space
}

animate();

// Add a console log to confirm main.js has run and initialized managers
console.log('main.js executed: Scene, Managers, and ColorSpace initialized.');
console.log('UIManager instance:', uiManager);
console.log('SceneManager instance:', sceneManager);
console.log('ColorSpace instance:', colorSpace);
