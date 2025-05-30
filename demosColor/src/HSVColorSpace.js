import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import {
	createTubesFromEdges,
	createDirectionalArcs,
	createDirectionalArc,
	createAxis,
	TUBE_RADIUS,
	TUBE_RADIAL_SEGMENTS,
} from './GeometryUtils.js';
import hsvVertexShader from './shaders/hsv/hsvVertex.glsl';
import hsvFragmentShader from './shaders/hsv/hsvFragment.glsl';
import * as constants from './constants.js';

export class HSVColorSpace extends ColorSpace {
	constructor(scene) {
		super(scene);
		this.modelType = 'HSV';
		console.log('HSVColorSpace initialized');
	}

	_buildAxesAndLabels() {
		console.log('HSVColorSpace: Building axes and labels');

		// HSV: Cylindrical model
		// V: height (0 to 1), S: radius from V-axis, H: angle around V-axis
		// V: Value (Y-axis) - vertical, 0 to 1
		// S: Saturation (radial) - horizontal, outward from V-axis, 0 to 1
		// H: Angle around V-axis (0 to 360 degrees)

		// Extension factor for axes (make them 20% longer for better visibility)
		const axisExtensionFactor = 1.2;

		// Value Axis (Y) - vertical, extends from 0 to axisExtensionFactor
		createAxis(
			this.currentVisuals,
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, axisExtensionFactor, 0),
			'V',
			new THREE.Vector3(0, 0.1, 0),
			0xffffff,
			this.makeTextSprite.bind(this)
		);

		// Saturation Axis (X at y=1) - horizontal at the top of V axis
		const s_axisLength = 1.0 * axisExtensionFactor; // Extended by 20%
		createAxis(
			this.currentVisuals,
			new THREE.Vector3(0, 1.0, 0),
			new THREE.Vector3(0, 1.0, s_axisLength),
			'S',
			new THREE.Vector3(0.1, 0, 0),
			0xffffff,
			this.makeTextSprite.bind(this)
		);

		// Hue is represented by the circumference. Position 'H' label near the top circle, slightly outside its radius.
		const outlineTopY = 1.0; // Height of the top circle of the outline
		const outlineRadius = 1.0; // Radius of the outline cylinder
		this.currentVisuals.add(this.makeTextSprite('H', new THREE.Vector3(outlineRadius + 0.25, outlineTopY, 0)));

		// Add arcs with arrowheads to illustrate Hue direction
		const arcRadius = outlineRadius + 0.1; // Slightly larger than the main outline
		const arcY = outlineTopY;

		// Create material for the arcs and arrowheads
		const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

		// Create a single directional arc
		const startAngleDeg = 0;
		const endAngleDeg = 45;

		// Create the first directional arc (don't pass parent to control adding ourselves)
		const firstArc = createDirectionalArc(
			null, // Don't add to parent yet
			startAngleDeg,
			endAngleDeg,
			arcRadius,
			arcY,
			arrowMaterial
		);

		// Add the first arc to the scene
		this.currentVisuals.add(firstArc);

		// Clone the first arc to create the second
		const secondArc = firstArc.clone();

		// Rotate the second arc 180 degrees around Y axis
		secondArc.rotateY(Math.PI);

		// Add the second arc to the scene
		this.currentVisuals.add(secondArc);

		console.log('HSV Axes and Labels built');
	}

	_buildFullSpaceOutlineObject() {
		console.log('HSVColorSpace: Building full space outline with TorusGeometry');

		// Create a group to hold the top and bottom torus rings
		const outlineGroup = new THREE.Group();
		outlineGroup.name = 'fullSpaceOutline_HSV';

		const ringRadius = 1.0; // Radius of the HSV cylinder
		const tubeRadius = constants.outlineEdgeThickness; // Using centralized constant for tube thickness
		const radialSegments = 16; // Segments around the tube
		const tubularSegments = 64; // Segments around the torus

		// Common material for both rings
		const ringMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

		// Bottom ring (y=0)
		const bottomTorusGeometry = new THREE.TorusGeometry(
			ringRadius, // Torus radius
			tubeRadius, // Tube radius using the centralized constant
			radialSegments,
			tubularSegments
		);
		const bottomTorus = new THREE.Mesh(bottomTorusGeometry, ringMaterial);
		bottomTorus.rotation.x = Math.PI / 2; // Rotate to lay flat in XZ plane
		bottomTorus.position.y = 0; // Position at bottom of cylinder
		outlineGroup.add(bottomTorus);

		// Top ring (y=1)
		const topTorusGeometry = new THREE.TorusGeometry(
			ringRadius, // Torus radius
			tubeRadius, // Tube radius using the centralized constant
			radialSegments,
			tubularSegments
		);
		const topTorus = new THREE.Mesh(topTorusGeometry, ringMaterial);
		topTorus.rotation.x = Math.PI / 2; // Rotate to lay flat in XZ plane
		topTorus.position.y = 1; // Position at top of cylinder
		outlineGroup.add(topTorus);

		return outlineGroup;
	}

	_updateSubSpaceVolume(limits) {
		// limits = { h.min, h.max, s.min, s.max, v.min, v.max }
		console.log(`Updating HSV SubSpace Volume with limits:`, limits);

		// Remove previous subspace volume if it exists
		const existingVolume = this.currentVisuals.getObjectByName('subspaceVolume');
		if (existingVolume) {
			this.currentVisuals.remove(existingVolume); // Remove from scene
			existingVolume.traverse((object) => {
				// Traverse all children
				if (object.isMesh) {
					if (object.geometry) {
						object.geometry.dispose();
					}
					// Material is shared and created new each time, so no need to dispose here.
				}
			});
		}

		const hsvShaderMaterial = new THREE.ShaderMaterial({
			vertexShader: hsvVertexShader,
			fragmentShader: hsvFragmentShader,
			uniforms: {
				hMin: { value: limits.h && typeof limits.h.min === 'number' ? limits.h.min : 0 },
				hMax: { value: limits.h && typeof limits.h.max === 'number' ? limits.h.max : 360 },
				sMin: { value: limits.s && typeof limits.s.min === 'number' ? limits.s.min : 0 },
				sMax: { value: limits.s && typeof limits.s.max === 'number' ? limits.s.max : 1 },
				vMin: { value: limits.v && typeof limits.v.min === 'number' ? limits.v.min : 0 },
				vMax: { value: limits.v && typeof limits.v.max === 'number' ? limits.v.max : 1 },
			},
			side: THREE.DoubleSide,
			transparent: true,
		});

		const hMinDeg = limits.h && typeof limits.h.min === 'number' ? limits.h.min : 0;
		const hMaxDeg = limits.h && typeof limits.h.max === 'number' ? limits.h.max : 360;
		const sMin = limits.s && typeof limits.s.min === 'number' ? limits.s.min : 0;
		const sMax = limits.s && typeof limits.s.max === 'number' ? limits.s.max : 1;
		const vMin = limits.v && typeof limits.v.min === 'number' ? limits.v.min : 0;
		const vMax = limits.v && typeof limits.v.max === 'number' ? limits.v.max : 1;

		const height = vMax - vMin;
		// Use full circle for geometry, shader handles hue clipping
		const thetaStartRad = 0;
		const thetaLengthRad = Math.PI * 2;

		const volumeMeshGroup = new THREE.Group();
		volumeMeshGroup.name = 'subspaceVolume';

		const cylinderRadialSegments = 64;
		const cylinderHeightSegments = 1; // Shader handles V segments

		// Outer cylinder
		if (height > 0.001 && sMax > 0.001) {
			const openEndedOuter = sMin > 0.0001 && sMin < sMax;
			const outerCylinderGeometry = new THREE.CylinderGeometry(
				sMax, // radiusTop
				sMax, // radiusBottom
				height,
				cylinderRadialSegments,
				cylinderHeightSegments,
				openEndedOuter,
				thetaStartRad,
				thetaLengthRad
			);
			outerCylinderGeometry.translate(0, vMin + height / 2, 0);
			const outerCylinderMesh = new THREE.Mesh(outerCylinderGeometry, hsvShaderMaterial);
			volumeMeshGroup.add(outerCylinderMesh);
		}

		// Inner cylinder and Ring caps (only if sMin > 0 and creates a valid tube)
		if (sMin > 0.0001 && sMin < sMax && height > 0.001) {
			// Inner cylinder
			const innerCylinderGeometry = new THREE.CylinderGeometry(
				sMin, // radiusTop
				sMin, // radiusBottom
				height,
				cylinderRadialSegments,
				cylinderHeightSegments,
				true, // Always openEnded for the inner tube
				thetaStartRad,
				thetaLengthRad
			);
			innerCylinderGeometry.translate(0, vMin + height / 2, 0);
			const innerCylinderMesh = new THREE.Mesh(innerCylinderGeometry, hsvShaderMaterial);
			volumeMeshGroup.add(innerCylinderMesh);

			// Ring caps
			const ringThetaSegments = cylinderRadialSegments;
			const ringPhiSegments = 1;

			// Bottom Ring
			const bottomRingGeometry = new THREE.RingGeometry(
				sMin, // innerRadius
				sMax, // outerRadius
				ringThetaSegments,
				ringPhiSegments,
				thetaStartRad,
				thetaLengthRad
			);
			bottomRingGeometry.rotateX(-Math.PI / 2); // Orient it flat on XZ plane
			bottomRingGeometry.translate(0, vMin, 0); // Position it at the bottom
			const bottomRingMesh = new THREE.Mesh(bottomRingGeometry, hsvShaderMaterial);
			volumeMeshGroup.add(bottomRingMesh);

			// Top Ring
			const topRingGeometry = new THREE.RingGeometry(
				sMin, // innerRadius
				sMax, // outerRadius
				ringThetaSegments,
				ringPhiSegments,
				thetaStartRad,
				thetaLengthRad
			);
			topRingGeometry.rotateX(-Math.PI / 2); // Orient it flat on XZ plane
			topRingGeometry.translate(0, vMax, 0); // Position it at the top
			const topRingMesh = new THREE.Mesh(topRingGeometry, hsvShaderMaterial);
			volumeMeshGroup.add(topRingMesh);
		}

		if (volumeMeshGroup.children.length === 0) {
			console.log('HSV subspace volume is zero or invalid, not rendering.');
			hsvShaderMaterial.dispose(); // Dispose the material if no meshes were created
			return;
		}

		this.currentVisuals.add(volumeMeshGroup);
		console.log('HSV SubSpace Volume updated and added to scene.');
	}
}
