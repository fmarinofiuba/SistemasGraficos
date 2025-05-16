import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


let camera, scene, renderer, stats;
let controls;


function setupThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(-8, 6,-8);

    const ambient = new THREE.HemisphereLight(0x555555, 0xffffff,2);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(5, 12.5, -12.5);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(0, 2, 0);
    controls.update();

    let grid=new THREE.GridHelper(10,10); 
    scene.add(grid); 
   

    let axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    
    

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);



    const loader = new GLTFLoader();
    loader.load('models/cybertruck.glb', onModelLoaded, onProgress, onLoadError);
}


function onModelLoaded(gltf) {
	console.log('Model loaded', gltf);
	gltf.scene;

    let mat=new THREE.MeshPhongMaterial({color:0xCCCCCC,shininess:128});  

    gltf.scene.traverse((child)=>{
        child.material=mat;
    })

	scene.add(gltf.scene);
}

function onProgress(event) {
	console.log((event.loaded / event.total) * 100 + '% loaded');
}

function onLoadError(event) {
	console.error('Error loading', event);
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {    
    if (controls)  controls.update();   
    renderer.render(scene, camera);
    
}

function start() {
    setupThree();    
    renderer.setAnimationLoop(animate);
}

start();
