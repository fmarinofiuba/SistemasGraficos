import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, container, sceneManager;
let terrenoGeo;

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

	const controls = new OrbitControls(camera, renderer.domElement);

	let grid = new THREE.GridHelper(100, 10);
	grid.position.y = -15;
	scene.add(grid);

	window.addEventListener('resize', onResize);
	onResize();
}

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function loadGLB() {
	const loader = new GLTFLoader();
	loader.load('models/terreno.glb', function (gltf) {
		gltf.scene.traverse(function (child) {
			if (child.isMesh) {
				terrenoGeo = child.geometry;
			}
		});

		setupThreeJs();
		buildLights();
		buildScene();
		animate();
	});
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
	let grassTexture = new THREE.TextureLoader().load('maps/pasto.jpg');
	let rockTexture = new THREE.TextureLoader().load('maps/roca.jpg');
	rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping;
	grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;

	// creo un material MeshPhongMaterial
	const material = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		specular: 0x333333,
		shininess: 2,
	});

	// definos las variables uniformes adicionales que necesitamos
	let additionalUniforms = {
		grassTexture: { value: grassTexture, type: 't' },
		rockTexture: { value: rockTexture, type: 't' },
	};
	// le decimos al material que vamos a usar UVs para que incluya las coordenadas UV en el shader
	material.defines = { USE_UV: true };

	// Este callback se ejecuta antes de compilar el shader
	// Hay que ver como referencia el archivo
	// node_modules/three/src/renderers/shaders/ShaderLib/meshphong.glsl.js
	// para saber que chunks podemos reemplazar

	material.onBeforeCompile = function (shader) {
		// le agregamos las variables uniformes adicionales al shader
		shader.uniforms.grassTexture = additionalUniforms.grassTexture;
		shader.uniforms.rockTexture = additionalUniforms.rockTexture;

		// hacemos un search and replace en el vertex shader
		// buscamos la linea que dice
		// vViewPosition = - mvPosition.xyz;
		// y le agregamos una linea mas que guarde la posicion del vertice en el espacio del mundo
		shader.vertexShader = shader.vertexShader.replace(
			'vViewPosition = - mvPosition.xyz;',
			`
		vViewPosition = - mvPosition.xyz;
		vWorldPosition = (modelMatrix*vec4(transformed,1.0)).xyz;
			`
		);

		// agregamos una variable varying al comienzo del vertex shader
		// para pasar la posicion del vertice en coordenadas del mundo al fragment shader
		shader.vertexShader =
			`
		varying vec3 vWorldPosition;
		` + shader.vertexShader;

		// agregamos las variables uniformes y varying al fragment shader
		// Siempre hay que tener cuidado con los nombres de las variables que definimos
		// no deben coincidir con las variables que usa Three.js

		shader.fragmentShader =
			` 
		uniform sampler2D grassTexture ;
		uniform sampler2D rockTexture;
		varying vec3 vWorldPosition;
			
			` + shader.fragmentShader;

		// reemplazamos el include del chunk map_fragment por nuestro propio codigo
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <map_fragment>',
			`
		// calculamos las coordenadas UV en base a las coordenadas de mundo
		vec2 uvCoords=vWorldPosition.xz/100.0;

		// si quisieramos podriamos usar la variabl vUv tambien que son las coordenadas UV del vertice

		// leemos los colores de las texturas
		vec4 grassColor = texture2D( grassTexture,uvCoords );
		vec4 rockColor = texture2D( rockTexture,uvCoords );

		// mezclamos los colores en base a la altura del vertice
		diffuseColor = mix( grassColor, rockColor, smoothstep(0.0,5.0,vWorldPosition.y));	
			`
		);
		// imprimimos el shader para debuggear
		console.log(shader.vertexShader);
		console.log(shader.fragmentShader);
	};

	const plane = new THREE.Mesh(terrenoGeo, material);

	plane.rotation.x = Math.PI / 2;
	plane.scale.set(100, 100, 100);

	scene.add(plane);
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

loadGLB();
