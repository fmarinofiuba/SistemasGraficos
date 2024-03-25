import * as THREE from 'three';

export function Trail(container, maxPoints, initialPos, tone) {
	let points = [];
	let frame = 0;

	let segments = maxPoints;

	let trailsGeo = new THREE.BufferGeometry();
	let trailsMat = new THREE.LineBasicMaterial({ vertexColors: true });

	let positions = new Float32Array(segments * 3);
	let colors = new Float32Array(segments * 3);

	for (let i = 0; i < segments; i++) {
		// positions
		positions[i * 3] = initialPos.x;
		positions[i * 3 + 1] = initialPos.y;
		positions[i * 3 + 2] = initialPos.z;

		let col = new THREE.Color();
		let sat = (0.5 * i) / segments + 0.5;
		col.setHSL(tone, 1, sat);

		colors[i * 3] = col.r;
		colors[i * 3 + 1] = col.g;
		colors[i * 3 + 2] = col.b;
	}

	trailsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	trailsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	trailsGeo.computeBoundingSphere();

	let trailsMesh = new THREE.Line(trailsGeo, trailsMat);
	trailsMesh.frustumCulled = false;
	container.add(trailsMesh);

	this.reset = function () {
		points = [];
	};

	this.pushPosition = function (pos) {
		//console.log('pushPosition ' + pos.x + ' ' + pos.y + ' ' + pos.z + ' ');
		points.push(pos);
		if (points.length > maxPoints) points.shift();
		if (frame < 1) points.shift();
		let i, j;

		if (trailsGeo && points.length > 10) {
			let att = trailsGeo.getAttribute('position');
			let att2 = trailsGeo.getAttribute('color');

			for (let i = 0; i < maxPoints; i++) {
				if (i < points.length) j = i;
				else j = points.length - 1;

				let col = new THREE.Color();
				let sat = (0.5 * j) / points.length + 0.1;
				col.setHSL(tone, 1, sat);

				att.setXYZ(i, points[j].x, points[j].y, points[j].z);
				att2.setXYZ(i, col.r, col.g, col.b);
			}

			att.needsUpdate = true;
			att2.needsUpdate = true;
		} //if
		frame++;
	};
}
