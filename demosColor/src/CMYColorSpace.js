import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import { createTubesFromEdges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS } from './GeometryUtils.js';
import cmyVertexShader from './shaders/cmy/cmyVertex.glsl';
import cmyFragmentShader from './shaders/cmy/cmyFragment.glsl';
import { outlineEdgeThickness, arrowRadius, arrowLength, axisThickness } from './constants.js';

export class CMYColorSpace extends ColorSpace {
	constructor(scene) {
		super(scene);
		this.modelType = 'CMY';
	}

	_buildAxesAndLabels() {
		console.log('CMYColorSpace: Building axes and labels');
		const axisLength = 1.2;
		// Using centralized constant for axis thickness
		const C_axisMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: axisThickness }); // Cyan
		const M_axisMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: axisThickness }); // Magenta
		const Y_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: axisThickness }); // Yellow

		const pointsC = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)];
		const pointsM = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)];
		const pointsY = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)];

		const C_geometry = new THREE.BufferGeometry().setFromPoints(pointsC);
		const M_geometry = new THREE.BufferGeometry().setFromPoints(pointsM);
		const Y_geometry = new THREE.BufferGeometry().setFromPoints(pointsY);

		const C_axis = new THREE.Line(C_geometry, C_axisMaterial);
		const M_axis = new THREE.Line(M_geometry, M_axisMaterial);
		const Y_axis = new THREE.Line(Y_geometry, Y_axisMaterial);

		this.currentVisuals.add(C_axis, M_axis, Y_axis);

		// Labels
		this.currentVisuals.add(this.makeTextSprite('C', { x: axisLength + 0.1, y: 0, z: 0 }));
		this.currentVisuals.add(this.makeTextSprite('M', { x: 0, y: axisLength + 0.1, z: 0 }));
		this.currentVisuals.add(this.makeTextSprite('Y', { x: 0, y: 0, z: axisLength + 0.1 }));

		// Arrowheads using centralized constants
		const coneRadius = arrowRadius;
		const coneHeight = arrowLength;
		const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

		// C-axis arrowhead
		const c_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const c_arrowhead = new THREE.Mesh(c_coneGeometry, arrowMaterial);
		c_arrowhead.position.set(axisLength, 0, 0);
		const c_direction = new THREE.Vector3(1, 0, 0);
		const c_quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), c_direction);
		c_arrowhead.quaternion.multiply(c_quaternion);
		c_arrowhead.position.addScaledVector(c_direction, coneHeight / 2);
		this.currentVisuals.add(c_arrowhead);

		// M-axis arrowhead
		const m_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const m_arrowhead = new THREE.Mesh(m_coneGeometry, arrowMaterial);
		m_arrowhead.position.set(0, axisLength, 0);
		// M-axis is along Y, cone's default orientation is Y-up, no rotation needed for quaternion.
		m_arrowhead.position.addScaledVector(new THREE.Vector3(0, 1, 0), coneHeight / 2);
		this.currentVisuals.add(m_arrowhead);

		// Y-axis (Yellow) arrowhead
		const y_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const y_arrowhead = new THREE.Mesh(y_coneGeometry, arrowMaterial);
		y_arrowhead.position.set(0, 0, axisLength);
		const y_direction = new THREE.Vector3(0, 0, 1);
		const y_quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), y_direction);
		y_arrowhead.quaternion.multiply(y_quaternion);
		y_arrowhead.position.addScaledVector(y_direction, coneHeight / 2);
		this.currentVisuals.add(y_arrowhead);
	}

	_buildFullSpaceOutlineObject() {
		console.log('CMYColorSpace: Building full space outline with tubes');

		const s = 1.0; // Size of the cube
		const offset = 0.0; // Assuming cube starts at origin (0,0,0) to (1,1,1)

		// Define the 8 vertices of the cube
		const v = [
			new THREE.Vector3(offset, offset, offset), // V0: 0,0,0
			new THREE.Vector3(offset + s, offset, offset), // V1: 1,0,0
			new THREE.Vector3(offset + s, offset + s, offset), // V2: 1,1,0
			new THREE.Vector3(offset, offset + s, offset), // V3: 0,1,0
			new THREE.Vector3(offset, offset, offset + s), // V4: 0,0,1
			new THREE.Vector3(offset + s, offset, offset + s), // V5: 1,0,1
			new THREE.Vector3(offset + s, offset + s, offset + s), // V6: 1,1,1
			new THREE.Vector3(offset, offset + s, offset + s), // V7: 0,1,1
		];

		// Define the 12 edges of the cube
		const edges = [
			// Bottom face
			{ start: v[0], end: v[1] },
			{ start: v[1], end: v[2] },
			{ start: v[2], end: v[3] },
			{ start: v[3], end: v[0] },
			// Top face
			{ start: v[4], end: v[5] },
			{ start: v[5], end: v[6] },
			{ start: v[6], end: v[7] },
			{ start: v[7], end: v[4] },
			// Vertical edges
			{ start: v[0], end: v[4] },
			{ start: v[1], end: v[5] },
			{ start: v[2], end: v[6] },
			{ start: v[3], end: v[7] },
		];

		const tubeGeometry = createTubesFromEdges(edges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS);

		if (!tubeGeometry) {
			console.warn('CMYColorSpace: Tube geometry for outline could not be created.');
			return new THREE.Group(); // Return an empty group or null
		}

		const tubeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // White outline
		const outlineObject = new THREE.Mesh(tubeGeometry, tubeMaterial);
		// Vertices are 0->1, so effective center is (0.5,0.5,0.5) for s=1, offset=0.
		return outlineObject;
	}

	_updateSubSpaceVolume(limits) {
		console.log('CMYColorSpace: Updating subspace volume with limits:', limits);

		const cMin = limits && limits.c && typeof limits.c.min === 'number' ? limits.c.min : 0;
		const cMax = limits && limits.c && typeof limits.c.max === 'number' ? limits.c.max : 1;
		const mMin = limits && limits.m && typeof limits.m.min === 'number' ? limits.m.min : 0;
		const mMax = limits && limits.m && typeof limits.m.max === 'number' ? limits.m.max : 1;
		const yMin = limits && limits.y && typeof limits.y.min === 'number' ? limits.y.min : 0;
		const yMax = limits && limits.y && typeof limits.y.max === 'number' ? limits.y.max : 1;

		if (!limits || !limits.c || !limits.m || !limits.y) {
			console.warn('CMY limits structure not fully defined. Using defaults for missing parts.');
		}

		const width = cMax - cMin;
		const height = mMax - mMin;
		const depth = yMax - yMin;

		if (width <= 0 || height <= 0 || depth <= 0) {
			console.log('CMY Subspace volume has zero or negative dimension, not rendering.');
			return;
		}

		const subBoxGeo = new THREE.BoxGeometry(width, height, depth);
		subBoxGeo.translate(cMin + width / 2, mMin + height / 2, yMin + depth / 2);

		const cmyShaderMaterial = new THREE.ShaderMaterial({
			vertexShader: cmyVertexShader,
			fragmentShader: cmyFragmentShader,
			uniforms: {
				u_cMin: { value: cMin },
				u_cMax: { value: cMax },
				u_mMin: { value: mMin },
				u_mMax: { value: mMax },
				u_yMin: { value: yMin },
				u_yMax: { value: yMax },
			},
			vertexShader: cmyVertexShader,
			fragmentShader: cmyFragmentShader,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.8,
		});

		const subBoxMeshCMY = new THREE.Mesh(subBoxGeo, cmyShaderMaterial);
		subBoxMeshCMY.name = 'subspaceVolume';
		this.currentVisuals.add(subBoxMeshCMY);
	}
}
