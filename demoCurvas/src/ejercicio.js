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

	const grid = new THREE.GridHelper(20, 2);
	scene.add(grid);

	let texture = new THREE.TextureLoader().load('maps/s.png');
	let plane = new THREE.Mesh(
		new THREE.PlaneGeometry(20, 20),
		new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture })
	);
	plane.rotation.x = Math.PI / 2;
	plane.position.y = -5;
	scene.add(plane);

	window.addEventListener('resize', onResize);
	onResize();
}

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.left = -10 * camera.aspect;
	camera.right = 10 * camera.aspect;
	camera.top = -10;
	camera.bottom = 10;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function buildCurve() {
	const curve = new THREE.CubicBezierCurve3(
		new THREE.Vector3(-8, 0, -5),
		new THREE.Vector3(-8, 0, -1),
		new THREE.Vector3(-4, 0, -1),
		new THREE.Vector3(-4, 0, 5)
	);

	const points = curve.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);

	const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

	// Create the final object to add to the scene
	const curveObject = new THREE.Line(geometry, material);

	// Create the final object to add to the scene

	scene.add(curveObject);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

setupThreeJs();
buildCurve();
animate();
