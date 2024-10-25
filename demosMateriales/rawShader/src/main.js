import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { vertexShader } from './shaders/vertex.js';
import { fragmentShader } from './shaders/fragment2.js';

let scene, camera, renderer, container, sceneManager;
let material;

// Basado en este tutorial
// https://medium.com/@pailhead011/extending-three-js-materials-with-glsl-78ea7bbb9270

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(120, 120, 120);
	camera.lookAt(0, 0, 0);

	window.addEventListener('resize', onResize);
	onResize();
}

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function buildLights() {
	let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
	hemiLight.color.setHSL(0.6, 1, 0.6);
	//scene.add(hemiLight);

	let dirLight = new THREE.DirectionalLight(0xffffff, 1);
	dirLight.position.set(1, 1, 1);
	scene.add(dirLight);
	let pointLight = new THREE.PointLight(0xffffff, 1);
	pointLight.position.set(0, 10, 0);
	scene.add(pointLight);
}

function buildScene() {
	// cargo las texturas
	let eifel = new THREE.TextureLoader().load('maps/eifel.jpg');
	let checker2 = new THREE.TextureLoader().load('maps/checker2.jpg');
	eifel.wrapS = eifel.wrapT = THREE.RepeatWrapping;
	checker2.wrapS = checker2.wrapT = THREE.RepeatWrapping;

	material = new THREE.RawShaderMaterial({
		uniforms: {
			time: { value: 1.0 },
			texture: { value: eifel, type: 't' },
			checker: { value: checker2, type: 't' },
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
	});

	let planeGeo = new THREE.PlaneGeometry(20, 20);
	const plane = new THREE.Mesh(planeGeo, material);

	plane.rotation.x = Math.PI / 2;
	plane.scale.set(100, 100, 100);

	scene.add(plane);
}

function animate() {
	requestAnimationFrame(animate);
	material.uniforms.time.value += 0.05;
	renderer.render(scene, camera);
}

setupThreeJs();
buildLights();
buildScene();
animate();
