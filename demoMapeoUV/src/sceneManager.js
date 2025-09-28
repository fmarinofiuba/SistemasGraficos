import * as THREE from 'three';

let torus, cube, cone;

export class SceneManager {
	constructor(scene) {
		const light = new THREE.DirectionalLight(0xffffff, 1);

		light.position.set(1, 1, 1);
		scene.add(light);

		const ambientLight = new THREE.AmbientLight(0x666666);
		scene.add(ambientLight);

		const grid = new THREE.GridHelper(10, 10);
		scene.add(grid);

		const axes = new THREE.AxesHelper(3);
		scene.add(axes);

		cone = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1, 6, 32),
			new THREE.MeshPhongMaterial({ color: 0xffffff })
		);
		cone.position.set(0, 1.2, 0);
		cone.rotation.x = Math.PI / 2;
		scene.add(cone);
	}

	animate() {}
}
