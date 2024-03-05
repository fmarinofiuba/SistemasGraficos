import * as THREE from 'three';
import { loadModels } from './loader.js';

const modelPaths = [
	'/models/antebrazo.dae',
	'/models/brazo.dae',
	'/models/cabina.dae',
	'/models/chasis.dae',
	'/models/cubierta.dae',
	'/models/eje.dae',
	'/models/llanta.dae',
	'/models/pala.dae',
	'/models/tuerca.dae',
];

export class SceneManager {
	constructor(scene) {
		this.scene = scene;
		const light = new THREE.DirectionalLight(0xffffff, 1);

		light.position.set(1, 1, 1);
		scene.add(light);

		const ambientLight = new THREE.AmbientLight(0x666666);
		scene.add(ambientLight);

		const grid = new THREE.GridHelper(1000, 10);
		scene.add(grid);

		const axes = new THREE.AxesHelper(3);
		scene.add(axes);

		loadModels(modelPaths, (models) => {
			models.forEach((model, i) => {
				model.add(new THREE.AxesHelper(20)); // Debugging helpers
				// model.rotation.set(0, 0, 0); // Arreglamos la rotación de los modelos
				model.position.setX(i * 100 - (models.length * 100) / 2); // Distribuimos las piezas en el eje X para una linda presentación (?)
				scene.add(model);
			});

			//this.solve();
		});
	}

	solve() {
		const cabina = this.scene.getObjectByName('cabina');
		const brazo = this.scene.getObjectByName('brazo');
		const antebrazo = this.scene.getObjectByName('antebrazo');
		const pala = this.scene.getObjectByName('pala');
		const chasis = this.scene.getObjectByName('chasis');
		const eje = this.scene.getObjectByName('eje');
		const llanta = this.scene.getObjectByName('llanta');
		const cubierta = this.scene.getObjectByName('cubierta');
		const tuerca = this.scene.getObjectByName('tuerca');
		const vehiculo = new THREE.Group();

		// **************************************************************
		// Ejercicio:
		// **************************************************************
		//
		// Desplazamientos relativos entre piezas:
		//
		// chasis       >>      cabina        0,25,0
		// cabina       >>      brazo         20, 20, -10
		// brazo        >>      antebrazo     -102,0,0
		// antebrazo    >>      pala          -60,0,0
		// chasis       >>      eje            20,5,0
		// eje          >>      llanta         0,25,0
		// llanta       >>      cubierta       0,0,0
		// llanta       >>      tuerca         0,3,0
		//
		// ***************************************************************

		chasis.position.set(0, 0, 0);

		chasis.add(cabina);
		cabina.position.set(0, 25, 0);

		cabina.add(brazo);
		brazo.position.set(20, 20, -10);
		brazo.rotation.z = -Math.PI / 4;

		brazo.add(antebrazo);
		antebrazo.position.set(-102, 0, 0);

		antebrazo.add(pala);
		pala.position.set(-60, 0, 0);

		chasis.add(eje);
		eje.position.set(20, 5, 0);
		eje.rotation.x = Math.PI / 2;

		eje.add(llanta);
		llanta.position.set(0, 25, 0);

		llanta.add(cubierta);
		cubierta.position.set(0, 0, 0);

		llanta.add(tuerca);
		tuerca.position.set(0, 3, 0);

		const llanta2 = llanta.clone();
		llanta2.position.y *= -1;
		llanta2.scale.y *= -1;
		eje.add(llanta2);

		const eje2 = eje.clone();
		eje2.position.x *= -1;
		chasis.add(eje2);

		vehiculo.add(cabina);
		vehiculo.add(chasis);
		this.scene.add(vehiculo);
	}
	animate() {}
}
