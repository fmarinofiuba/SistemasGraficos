import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let scene, camera, renderer, container, font, text;

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x333333);
	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 2, 4);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	window.addEventListener('resize', onResize);
	onResize();
}

function loadFont() {
	const loader = new FontLoader();
	loader.load('fonts/gentilis_regular.typeface.json', function (response) {
		font = response;
		buildScene();
	});
}

function buildScene() {
	const gridHelper = new THREE.GridHelper(10, 10);
	scene.add(gridHelper);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x0000ff, 1);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(1, 1, 1);
	scene.add(directionalLight);

	const coneGeometry = new THREE.ConeGeometry(0.25, 1);
	const coneMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
	const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
	coneMesh.position.set(-2, 0.5, -2);
	scene.add(coneMesh);

	let coneMesh2 = coneMesh.clone();
	coneMesh2.material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
	coneMesh2.position.set(2, 0.5, -2);
	scene.add(coneMesh2);

	const parameters = {
		font: font,

		size: 0.6,
		height: 0.1,
		curveSegments: 16,

		bevelThickness: 0.1,
		bevelSize: 0,
		bevelEnabled: false,
	};

	let geo = new TextGeometry('3D', parameters);
	let mat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
	text = new THREE.Mesh(geo, mat);
	text.matrixAutoUpdate = false;
	window.text = text;

	const axesHelper = new THREE.AxesHelper(1);
	scene.add(axesHelper);

	const axesHelper2 = new THREE.AxesHelper(0.5);
	text.add(axesHelper2);
	scene.add(text);

	// *************************************************************************************
	//	Modificar código a partir de aquí
	// *************************************************************************************

	const matrix = new THREE.Matrix4();
	matrix.makeTranslation(1, 0, 0);
	text.matrix.copy(matrix);

	// *************************************************************************************
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
loadFont();
animate();
