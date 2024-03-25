import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SolarSystem } from './solarSystem.js';
//import { SolarSystem } from './solarSystem.ignore.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as dat from 'dat.gui';

let scene, camera, renderer, container, solarSystem, composer, renderPass;

let currentCameraNumber = 0;
let clock = new THREE.Clock();
let rebuildTimer = null;

const solarSystemCameras = ['earth', 'moon', 'iss', 'apollo'];
let params = {
	showHelpers: false,
	showTrails: false,
};

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.set(-800, 800, 800);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	const gridHelper = new THREE.GridHelper(1000, 10, new THREE.Color(0x333333), new THREE.Color(0x222222));
	scene.add(gridHelper);

	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 2);
	scene.add(hemiLight);

	const pointLight = new THREE.PointLight(0xffcc99, 1000, 10000, 0.7);
	pointLight.castShadow = true;
	pointLight.shadow.bias = -0.01;
	pointLight.shadow.mapSize.width = 2048; // default
	pointLight.shadow.mapSize.height = 2048; // default
	pointLight.shadow.camera.near = 50; // default
	pointLight.shadow.camera.far = 1000; // default
	pointLight.position.set(0, 0, 0);
	scene.add(pointLight);

	buildRenderPipeline();

	window.addEventListener('resize', onResize);

	onResize();
}
function buildRenderPipeline() {
	console.log('Build Render Pipeline width: ', container.offsetWidth, ' height: ', container.offsetHeight);
	renderPass = new RenderPass(scene, camera);

	let bloomPass = new UnrealBloomPass(
		new THREE.Vector2(container.offsetWidth, container.offsetHeight),
		1.5,
		0.4,
		0.85
	);
	bloomPass.threshold = 0.5;
	bloomPass.strength = 0.2;
	bloomPass.radius = 1;

	const outputPass = new OutputPass();
	composer = new EffectComposer(renderer);
	composer.addPass(renderPass);
	composer.addPass(bloomPass);
	composer.addPass(outputPass);
}

function onResize() {
	let aspect = container.offsetWidth / container.offsetHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
	composer.setSize(container.offsetWidth, container.offsetHeight);
	if (solarSystem) solarSystem.onResize(aspect);

	clearTimeout(rebuildTimer);
	rebuildTimer = setTimeout(() => {
		buildRenderPipeline();
	}, 250);
}
function createMenu() {
	let gui = new dat.GUI();
	gui.add(params, 'showHelpers')
		.name('Show Helpers')
		.onChange((value) => {
			solarSystem.showHelpers(value);
		});
	gui.add(params, 'showTrails')
		.name('Show Trails')
		.onChange((value) => {
			solarSystem.showTrails(value);
		});
}

function buildScene() {
	solarSystem = new SolarSystem(scene);
	let infoDiv = document.getElementById('info');

	document.addEventListener('keydown', (event) => {
		if (event.key === 'c') {
			currentCameraNumber++;
			if (currentCameraNumber > 4) currentCameraNumber = 0;
			if (currentCameraNumber > 0) {
				solarSystem.setCurrentCamera(solarSystemCameras[currentCameraNumber - 1]);
				infoDiv.innerHTML = 'Camera: ' + solarSystemCameras[currentCameraNumber - 1];
			} else {
				infoDiv.innerHTML = 'Camera: global';
			}
		}
	});
}

function animate() {
	requestAnimationFrame(animate);
	let cam = camera;
	if (solarSystem) {
		solarSystem.update(clock.getElapsedTime());
		if (currentCameraNumber !== 0) {
			cam = solarSystem.getCurrentCamera();
		}
	}

	renderPass.camera = cam;
	composer.render();
}

setupThreeJs();
buildScene();
createMenu();
animate();
