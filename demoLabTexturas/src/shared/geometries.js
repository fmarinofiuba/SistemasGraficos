import * as THREE from 'three';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js';

export function normalizeGeometry(geo, size = 3) {
	geo.computeBoundingBox();
	const c = geo.boundingBox.getCenter(new THREE.Vector3());
	const s = geo.boundingBox.getSize(new THREE.Vector3());
	geo.translate(-c.x, -c.y, -c.z);
	geo.scale(size / Math.max(s.x, s.y, s.z), size / Math.max(s.x, s.y, s.z), size / Math.max(s.x, s.y, s.z));
	geo.computeBoundingSphere();
	return geo;
}

export function makeTeapot(size = 3, segments = 12) {
	return normalizeGeometry(new TeapotGeometry(1, segments), size);
}

export function makeSphere(radius = 1.4) {
	return new THREE.SphereGeometry(radius, 64, 32);
}

// Punto y normal interpolados en el punto de impacto de un raycast (en coordenadas de mundo).
export function hitNormalWorld(hit) {
	const geo = hit.object.geometry;
	const nAttr = geo.attributes.normal;
	const pos = geo.attributes.position;
	const { a, b, c } = hit.face;
	const local = hit.object.worldToLocal(hit.point.clone());
	const bary = new THREE.Vector3();
	THREE.Triangle.getBarycoord(
		local,
		new THREE.Vector3().fromBufferAttribute(pos, a),
		new THREE.Vector3().fromBufferAttribute(pos, b),
		new THREE.Vector3().fromBufferAttribute(pos, c),
		bary
	);
	const n = new THREE.Vector3()
		.fromBufferAttribute(nAttr, a)
		.multiplyScalar(bary.x)
		.addScaledVector(new THREE.Vector3().fromBufferAttribute(nAttr, b), bary.y)
		.addScaledVector(new THREE.Vector3().fromBufferAttribute(nAttr, c), bary.z);
	return n.transformDirection(hit.object.matrixWorld);
}
