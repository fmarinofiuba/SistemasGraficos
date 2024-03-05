// Importamos todas las funcionalidades de THREE
import * as THREE from 'three';

// Creamos una nueva escena
const scene = new THREE.Scene();

// Creamos una nueva cámara con perspectiva
// Los argumentos son: campo de visión, relación de aspecto, plano cercano, plano lejano
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

// Creamos un nuevo renderizador WebGL
const renderer = new THREE.WebGLRenderer();

// Establecemos el tamaño del renderizador al tamaño de la ventana
renderer.setSize(window.innerWidth, window.innerHeight);

// Agregamos el elemento DOM del renderizador al cuerpo del documento
document.body.appendChild(renderer.domElement);

// Posicionamos la cámara
camera.position.set(0, 8, 8);
camera.lookAt(0, 0, 0);

// creamos una grilla de tamaño 10x10, con 10 divisiones
const grid = new THREE.GridHelper(10, 10);
scene.add(grid);

// agregamos ejes de coordenadas
const axes = new THREE.AxesHelper(3);
scene.add(axes);

// Definimos la función de animación
function animate() {
    // Solicitamos el próximo cuadro de animación
    requestAnimationFrame(animate);
    // Renderizamos la escena con la cámara
    renderer.render(scene, camera);
}

animate();
