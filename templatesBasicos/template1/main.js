// Importamos todas las funcionalidades de THREE
import * as THREE from 'three';

// Creamos una nueva escena
const scene = new THREE.Scene();

// Creamos una nueva cámara con perspectiva
// Los argumentos son: campo de visión, relación de aspecto, plano cercano, plano lejano
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Creamos un nuevo renderizador WebGL
const renderer = new THREE.WebGLRenderer();

// Establecemos el tamaño del renderizador al tamaño de la ventana
renderer.setSize(window.innerWidth, window.innerHeight);

// Agregamos el elemento DOM del renderizador al cuerpo del documento
document.body.appendChild(renderer.domElement);

// Creamos una nueva geometría de caja
// Los argumentos son: ancho, altura, profundidad
const geometry = new THREE.BoxGeometry(1, 1, 1);

// Creamos un nuevo material básico
// El argumento es un objeto con propiedades del material
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

// Creamos una nueva malla con la geometría y el material
const cube = new THREE.Mesh(geometry, material);

// Agregamos la malla a la escena
scene.add(cube);

// Posicionamos la cámara
camera.position.set(4, 4, 4);
camera.lookAt(0, 0, 0);

// Creamos una nueva luz direccional
// Los argumentos son: color, intensidad
const light = new THREE.DirectionalLight(0xffffff, 1);
// establecemos la posición de la luz
light.position.set(1, 1, 1);
scene.add(light);

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

    // Rotamos el cubo en los ejes x e y

    cube.rotation.y += 0.01;

    // Renderizamos la escena con la cámara
    renderer.render(scene, camera);
}

animate();
