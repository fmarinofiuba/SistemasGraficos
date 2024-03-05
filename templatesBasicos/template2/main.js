// Importamos todas las funcionalidades de THREE
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, torusKnot, container;

function setupThreeJs() {
	// Creamos una nueva escena
	scene = new THREE.Scene();

	// Creamos una nueva cámara con perspectiva
	// Los argumentos son: campo de visión, relación de aspecto, plano cercano, plano lejano
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	// Creamos un nuevo renderizador WebGL
	renderer = new THREE.WebGLRenderer();

	container = document.getElementById('container3D');

	// Establecemos el tamaño del renderizador al tamaño de la ventana
	renderer.setSize(container.offsetWidth, container.offsetHeight);

	// Agregamos el elemento DOM del renderizador al cuerpo del documento
	container.appendChild(renderer.domElement);

	// Posicionamos la cámara
	camera.position.set(4, 4, 4);
	camera.lookAt(0, 0, 0);

	// agregamos OrbitControls para poder mover la cámara con el mouse
	const controls = new OrbitControls(camera, renderer.domElement);

	// Escuchamos el evento de redimensionamiento de la ventana
	window.addEventListener('resize', onResize);
	// llamamos a la función onResize para que se ajuste
	// la relacion de aspecto de la cámara

	onResize();
}

function buildScene() {
	// Creamos una nueva luz direccional
	// Los argumentos son: color, intensidad
	const light = new THREE.DirectionalLight(0xffffff, 1);
	// establecemos la posición de la luz
	light.position.set(1, 1, 1);
	scene.add(light);

	// Creamos una nueva luz ambiental
	// Los argumentos son: color
	const ambientLight = new THREE.AmbientLight(0x4040ff);
	scene.add(ambientLight);

	// creamos una grilla de tamaño 10x10, con 10 divisiones
	const grid = new THREE.GridHelper(10, 10);
	scene.add(grid);

	// agregamos ejes de coordenadas
	const axes = new THREE.AxesHelper(3);
	scene.add(axes);

	// Creamos una nueva geometría de toro
	const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
	// Creamos un nuevo material
	// El argumento es un objeto con propiedades del material
	const material = new THREE.MeshPhongMaterial({ color: 0x99ff99 });

	// Creamos una nueva malla con la geometría y el material
	torusKnot = new THREE.Mesh(geometry, material);

	// Agregamos la malla a la escena
	scene.add(torusKnot);
}

function onResize() {
	// Actualizamos la relación de aspecto de la cámara
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();

	// Actualizamos el tamaño del renderizador
	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

// Definimos la función de animación
function animate() {
	// Solicitamos el próximo cuadro de animación
	requestAnimationFrame(animate);

	// Rotamos el cubo en los ejes x e y

	torusKnot.rotation.y += 0.01;

	// Renderizamos la escena con la cámara
	renderer.render(scene, camera);
}

setupThreeJs();
buildScene();
animate();
