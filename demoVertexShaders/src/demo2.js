import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper';

let scene, camera, renderer, container, box, customMaterial;

function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x999999);
	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(2, 2, 2);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(1, 0, 0);
	controls.update();

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

	scene.add(grid);

	const axes = new THREE.AxesHelper(1);
	scene.add(axes);
}

function buildBox() {
	THREE.Material.enableDebug = true;
	// Se crea un material personalizado
	// La clase RawShaderMaterial permite definir los shaders de forma directa
	customMaterial = new THREE.RawShaderMaterial({
		// Se definen los uniforms que se usarán en los shaders
		uniforms: {
			modelMatrix: { value: new THREE.Matrix4() },
			normalMatrix: { value: new THREE.Matrix4() },
			normalMatrix2: { value: new THREE.Matrix4() },
			viewMatrix: { value: new THREE.Matrix4() },
			projectionMatrix: { value: new THREE.Matrix4() },
		},
		// Se definen los shaders
		vertexShader: `
			// Esto sirve para que el compilador no se queje de que no se ha definido la precision de los floats
			precision highp float;

			// Atributos de los vértices
			attribute vec3 position; 	// Posición del vértice
            attribute vec3 normal;		// Normal del vértice
			attribute vec2 uv;		 	// Coordenadas de textura

			// Uniforms
			uniform mat4 modelMatrix;		// Matriz de transformación del objeto
            uniform mat4 normalMatrix;	    // Matriz de transformación de las normales en coord de cámara
			uniform mat4 normalMatrix2;	    // Matriz de transformación de las normales en coord de mundo
			uniform mat4 viewMatrix;		// Matriz de transformación de la cámara
			uniform mat4 projectionMatrix;	//	Matriz de proyección de la cámara

			// Varying
			varying vec2 vUv;	    // Coordenadas de textura que se pasan al fragment shader
            varying vec3 vNormal;   // Normal del vértice que se pasa al fragment shader

			void main() {
				
				// Lee la posición del vértice desde los atributos

				vec3 pos = position;	

				// Se calcula la posición final del vértice
				// Se aplica la transformación del objeto, la de la cámara y la de proyección

				gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);

                // Se calcula la normal del vértice

				// Sin transformar
				//vNormal = normal;

				// Transformada a coordenadas de cámara
                vNormal = (normalMatrix * vec4(normal,1.0)).xyz;

				// Transformada a coordenadas de mundo
				//vNormal = (normalMatrix2 * vec4(normal,1.0)).xyz;
                

				// Se pasan las coordenadas de textura al fragment shader
				vUv = uv;
			}
		`,
		fragmentShader: `
			precision highp float;
			varying vec2 vUv;
            varying vec3 vNormal;

			void main() {
				// Se pinta el fragmento con las coordenadas de textura
				gl_FragColor = vec4(vNormal, 1.0);
			}
		`,
		// Se definen las directivas de preprocesador
		defines: {
			// Por ejemplo, se puede definir una constante
			PI: '3.1415926535897932384626433832795',
		},
	});

	// Se añade un callback que se ejecutará antes de renderizar el objeto
	customMaterial.onBeforeRender = (renderer, scene, camera, geometry, mesh) => {
		// Se actualizan las matrices de transformación del objeto y de la cámara
		let uniforms = mesh.material.uniforms;

		// La matriz de transformación del objeto respecto al mundo
		uniforms.modelMatrix.value = box.matrixWorld;

		let m = box.matrixWorld.clone();
		m.invert();
		m.transpose();

		uniforms.normalMatrix2.value = m;
		// La matriz de transformación del mundo respecto a la cámara
		uniforms.viewMatrix.value = camera.matrixWorldInverse;
		// La matriz de proyección de la cámara
		uniforms.projectionMatrix.value = camera.projectionMatrix;
	};

	// Se crea un toro con el material personalizado
	box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), customMaterial);
	box.position.set(1, 0, 0);
	scene.add(box);
}

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

let firstRender = true;

function animate() {
	requestAnimationFrame(animate);

	box.rotation.x += 0.005;
	renderer.render(scene, camera);
}

setupThreeJs();
buildScene();
buildBox();
animate();
