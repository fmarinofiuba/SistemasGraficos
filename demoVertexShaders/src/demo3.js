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
	camera.position.set(1, 1, 1);

	const controls = new OrbitControls(camera, renderer.domElement);

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

function buildbox() {
	customMaterial = new THREE.RawShaderMaterial({
		uniforms: {
			modelMatrix: { value: new THREE.Matrix4() },
			normalMatrix: { value: new THREE.Matrix4() },
			viewMatrix: { value: new THREE.Matrix4() },
			projectionMatrix: { value: new THREE.Matrix4() },
			time: { value: 0.0 },
		},

		vertexShader: `			
			precision highp float;
			
			attribute vec3 position; 	// Posición del vértice
            attribute vec3 normal;		// Normal del vértice
			attribute vec2 uv;		 	// Coordenadas de textura

            uniform float time;			// Tiempo de la animación

			uniform mat4 modelMatrix;		// Matriz de transformación del objeto
            uniform mat4 normalMatrix;	    // Matriz de transformación de las normales en coord de cámara			
			uniform mat4 viewMatrix;		// Matriz de transformación de la cámara
			uniform mat4 projectionMatrix;	//	Matriz de proyección de la cámara
			
			varying vec2 vUv;	    // Coordenadas de textura que se pasan al fragment shader
            varying vec3 vNormal;   // Normal del vértice que se pasa al fragment shader

			void main() {
				
				vec3 pos=position;
				pos.y+=sin(time+position.x*8.0)*0.1;

				//pos.y+=cos(time*2.0+position.z*13.0)*0.1;
				//pos.xz+=normalize(pos.xz)*cos(time+position.y*8.0)*0.2;

				gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);                
                vNormal = (normalMatrix * vec4(normal,1.0)).xyz;
				vUv = uv;
			}
		`,
		fragmentShader: `

			precision highp float;
			varying vec2 vUv;
            varying vec3 vNormal;

			void main() {		
				
				gl_FragColor = vec4(vNormal, 1.0);
			}
		`,
		//version: THREE.GLSL3,
		defines: {},
		wireframe: true,
	});

	customMaterial.onBeforeRender = (renderer, scene, camera, geometry, mesh) => {
		let uniforms = mesh.material.uniforms;

		uniforms.modelMatrix.value = box.matrixWorld;
		uniforms.viewMatrix.value = camera.matrixWorldInverse;
		uniforms.projectionMatrix.value = camera.projectionMatrix;
		uniforms.time.value = performance.now() / 1000;
	};

	box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 50, 50, 50), customMaterial);
	scene.add(box);
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
buildScene();
buildbox();
animate();
