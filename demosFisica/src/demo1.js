// Importar Three.js y Cannon.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import * as dat from 'dat.gui';

// Configuración básica de la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 15, 25);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Iluminación
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.HemisphereLight(0x87ceeb, 0xffffff, 0.5);
scene.add(ambientLight);

// Motor de física - Cannon.js
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Material de contacto
const stoneMaterial = new CANNON.Material('stone');
const stoneContactMaterial = new CANNON.ContactMaterial(stoneMaterial, stoneMaterial, {
	friction: 0.4,
	restitution: 0.3,
});
world.addContactMaterial(stoneContactMaterial);

// Suelo físico y visual
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundBody = new CANNON.Body({ mass: 0, material: stoneMaterial });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Variables de la torre de cubos
let cubeBodies = [];
let cubeMeshes = [];
let savedTransforms = [];
let towerParams = { width: 5, height: 10, depth: 5, frameLimit: 300 };

// Función para crear la torre de cubos
function createCubeTower() {
	cubeBodies.forEach((body) => world.removeBody(body));
	cubeMeshes.forEach((mesh) => scene.remove(mesh));
	cubeBodies = [];
	cubeMeshes = [];

	const cubeSize = 1;
	const halfExtents = new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2);
	const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

	for (let i = 0; i < towerParams.width; i++) {
		for (let j = 0; j < towerParams.height; j++) {
			for (let k = 0; k < towerParams.depth; k++) {
				const x = i - towerParams.width / 2;
				const y = j;
				const z = k - towerParams.depth / 2;

				const cubeBody = new CANNON.Body({ mass: 1, material: stoneMaterial });
				cubeBody.addShape(new CANNON.Box(halfExtents));
				cubeBody.position.set(x, y, z);
				world.addBody(cubeBody);
				cubeBodies.push(cubeBody);

				const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
				cubeMesh.castShadow = true;
				cubeMesh.position.set(x, y, z);
				scene.add(cubeMesh);
				cubeMeshes.push(cubeMesh);
			}
		}
	}
}

// Esfera pesada para demoler la torre
let ballBody, ballMesh;
function createDemolitionBall() {
	const radius = 2;
	const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
	const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
	ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
	ballMesh.castShadow = true;
	scene.add(ballMesh);

	ballBody = new CANNON.Body({ mass: 50, material: stoneMaterial });
	ballBody.addShape(new CANNON.Sphere(radius));
	ballBody.position.set(0, 20, 0);
	world.addBody(ballBody);
}

// Inicializar la torre y la bola
createCubeTower();
createDemolitionBall();

// Configuración del menú GUI
const gui = new dat.GUI();
const towerFolder = gui.addFolder('Tower Parameters');
towerFolder.add(towerParams, 'width', 1, 10, 1).onChange(createCubeTower);
towerFolder.add(towerParams, 'height', 1, 20, 1).onChange(createCubeTower);
towerFolder.add(towerParams, 'depth', 1, 10, 1).onChange(createCubeTower);
towerFolder.add(towerParams, 'frameLimit', 100, 1000, 1).name('Frame Limit');
towerFolder.open();

gui.add({ start: startSimulation }, 'start').name('Start Simulation');
gui.add({ reset: () => (createCubeTower(), createDemolitionBall()) }, 'reset').name('Reset Simulation');
gui.add({ replay: replaySimulation }, 'replay').name('Replay Animation');

let frameCount = 0;
let recording = false;

function startSimulation() {
	ballBody.velocity.set(0, 0, 0);
	ballBody.position.set(0, 20, 0);
	savedTransforms = [];
	frameCount = 0;
	recording = true;
}

function replaySimulation() {
	cubeMeshes.forEach((mesh) => scene.remove(mesh));
	scene.remove(ballMesh);

	const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
	const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
	const instancedMesh = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, savedTransforms.length);
	const dummy = new THREE.Object3D();

	savedTransforms.forEach((transform, index) => {
		dummy.position.set(transform.position.x, transform.position.y, transform.position.z);
		dummy.quaternion.set(
			transform.quaternion.x,
			transform.quaternion.y,
			transform.quaternion.z,
			transform.quaternion.w
		);
		dummy.updateMatrix();
		instancedMesh.setMatrixAt(index, dummy.matrix);
	});

	scene.add(instancedMesh);
}

// Loop de animación
function animate() {
	requestAnimationFrame(animate);

	if (recording && frameCount < towerParams.frameLimit) {
		world.step(1 / 60);

		cubeMeshes.forEach((mesh, index) => {
			mesh.position.copy(cubeBodies[index].position);
			mesh.quaternion.copy(cubeBodies[index].quaternion);
		});

		ballMesh.position.copy(ballBody.position);
		ballMesh.quaternion.copy(ballBody.quaternion);

		const currentTransforms = cubeBodies.map((body) => ({
			position: { x: body.position.x, y: body.position.y, z: body.position.z },
			quaternion: { x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w },
		}));

		savedTransforms.push(...currentTransforms);
		frameCount++;
	} else if (recording) {
		recording = false;
	}

	controls.update();
	renderer.render(scene, camera);
}

animate();
