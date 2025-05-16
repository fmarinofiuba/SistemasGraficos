import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsSimulator } from './PhysicsSimulator.js';
import Stats from 'three/addons/libs/stats.module.js';

let camera, scene, renderer, stats;
let controls;
let physicsSimulator;
let chassis;
let wheels=[];


async function setupThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(30, 30,30);

    const ambient = new THREE.HemisphereLight(0x555555, 0xffffff,2);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 12.5, 12.5);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(0, 2, 0);
    controls.update();

    const geometry = new THREE.PlaneGeometry(1000, 1000,1,1);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshPhongMaterial({ color: 0x999999 });

    const ground = new THREE.Mesh(geometry, material);

    new THREE.TextureLoader().load( 'maps/grid.png', function ( texture ) {

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 200, 200 );
        ground.material.map = texture;
        ground.material.needsUpdate = true;

    } );

    
    scene.add(ground);

    let axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);
}

async function initPhysics() {


    
    physicsSimulator = new PhysicsSimulator();
    await physicsSimulator.initSimulation();

    createCarModel();

    // cylinder obstacle
    const geometry = new THREE.CylinderGeometry(2, 2, 10, 16);
    geometry.translate(0, 5, 0);
    const material = new THREE.MeshPhongMaterial({color:'#666699'} );
    const column = new THREE.Mesh(geometry, material);
    column.position.set(-10, 0.5, 0);

    scene.add(column);
    physicsSimulator.addRigidBody(column,0,0.01);
    
    // ramp obstacle (should be a BoxGeometry)
    const rampGeometry = new THREE.BoxGeometry(10, 1, 20);    
    const rampMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial );
    ramp.position.set(0,1 , -30 );
    ramp.rotation.x = Math.PI / 12;
    scene.add(ramp);
   
    physicsSimulator.addRigidBody(ramp);


}



function createCarModel() {
    // chassis
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    chassis = new THREE.Mesh(geometry, material);   
    scene.add(chassis);

    // axes helper
    let axesHelper = new THREE.AxesHelper(5);
    chassis.add(axesHelper);


    // add spolight on the front of the car
    const light = new THREE.SpotLight(0xffDD99, 100);    
    light.decay = 1;
    light.penumbra = 0.5;
    
    
    light.position.set(0, 0, -2);
    light.target.position.set(0, 0,-10);
    chassis.add(light.target);

    // add spotlight helper
    //const lightHelper = new THREE.SpotLightHelper(light);
    //light.add(lightHelper);
 
    
    chassis.add(light );  

    // wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    wheelGeometry.rotateZ(Math.PI * 0.5);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, wireframe: true });

    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);                
        chassis.add(wheel);
        wheel.position.set(10*i,2,20*i)
        wheels.push(wheel);
    };
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateVehicleTransforms() {
    const vt = physicsSimulator.getVehicleTransform();
    if (chassis && vt) {
        const { position, quaternion } = vt;                
        chassis.position.set(position.x, position.y, position.z);
        chassis.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w); 
        
        wheels.forEach((wheel, index) => {
            const wheelTransform = physicsSimulator.getWheelTransform(index);
            if (wheelTransform) {
                const { position, quaternion } = wheelTransform;
                wheel.position.set(position.x, position.y, position.z);
                wheel.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
            }
        })

    }
}

function animate() {
    physicsSimulator.update();
    updateVehicleTransforms();

    if (controls)  controls.update();    

    renderer.render(scene, camera);
    stats.update();
}

function start() {
    setupThree();
    initPhysics();
    renderer.setAnimationLoop(animate);
}

start();
