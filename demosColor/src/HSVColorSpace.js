import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import { createTubesFromEdges, createDirectionalArcs, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS } from './GeometryUtils.js';
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
		// TODO: Implement HSV axes and labels
		// V: Vertical axis (e.g., Y axis from 0 to 1)
		// S: Radius from V-axis (e.g., along XZ plane from 0 to 1)
		// H: Angle around V-axis (0 to 360 degrees)

		// Using centralized constant for axis thickness
		const V_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: constants.axisThickness });
		const S_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: constants.axisThickness }); // Could be different colors

		// Common material and dimensions for arrowheads
		const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
		// Using centralized constants for arrow dimensions
		const coneRadius = constants.arrowRadius;
		const coneHeight = constants.arrowLength;

		// Value Axis (Y)
		const v_points = [];
		v_points.push(new THREE.Vector3(0, 0, 0));
		v_points.push(new THREE.Vector3(0, 1.2, 0));
		const v_geometry = new THREE.BufferGeometry().setFromPoints(v_points);
		const v_axisLine = new THREE.Line(v_geometry, V_axisMaterial);
		this.currentVisuals.add(v_axisLine);
		this.currentVisuals.add(this.makeTextSprite('V', new THREE.Vector3(0, 1.3, 0)));

		// V-axis arrowhead
		const v_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const v_arrowhead = new THREE.Mesh(v_coneGeometry, arrowMaterial);
		v_arrowhead.position.set(0, 1.2, 0); // Tip of V-axis
		// Cone's axis is Y, already points up, no rotation needed if V is along Y
		v_arrowhead.position.addScaledVector(new THREE.Vector3(0, 1, 0), coneHeight / 2); // Offset base to end of line
		this.currentVisuals.add(v_arrowhead);

		// Saturation Axis (e.g., along X for visualization)
		const s_axisLength = 1.0;
		const s_axisExtendedLength = s_axisLength * 1.2;
		const s_points = [];
		s_points.push(new THREE.Vector3(0, 0, 0)); // Assuming V=0, S can be represented at this plane
		s_points.push(new THREE.Vector3(s_axisExtendedLength, 0, 0));
		const s_geometry = new THREE.BufferGeometry().setFromPoints(s_points);
		const s_axisLine = new THREE.Line(s_geometry, S_axisMaterial);
		this.currentVisuals.add(s_axisLine);
		this.currentVisuals.add(this.makeTextSprite('S', new THREE.Vector3(s_axisExtendedLength + 0.1, 0, 0)));

		// S-axis arrowhead
		const s_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const s_arrowhead = new THREE.Mesh(s_coneGeometry, arrowMaterial);
		s_arrowhead.position.set(s_axisExtendedLength, 0, 0); // Tip of S-axis
		const s_direction = new THREE.Vector3(1, 0, 0);
		const s_quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), s_direction);
		s_arrowhead.quaternion.multiply(s_quaternion);
		s_arrowhead.position.addScaledVector(s_direction, coneHeight / 2); // Offset base to end of line
		this.currentVisuals.add(s_arrowhead);

		// Hue is represented by the circumference. Position 'H' label near the top circle, slightly outside its radius.
		const outlineTopY = 1.0; // Height of the top circle of the outline
		const outlineRadius = 1.0; // Radius of the outline cylinder
		this.currentVisuals.add(this.makeTextSprite('H', new THREE.Vector3(outlineRadius + 0.25, outlineTopY, 0)));

		// Add arcs with arrowheads to illustrate Hue direction
		const arcRadius = outlineRadius + 0.1; // Slightly larger than the main outline
		const arcY = outlineTopY;

		// Arc data for hue direction indicators
		const arcsData = [
			{ startAngleDeg: 0, endAngleDeg: 60 },
			{ startAngleDeg: 180, endAngleDeg: 240 },
		];

		// Use the shared utility function to create directional arcs
		createDirectionalArcs(this.currentVisuals, arcsData, arcRadius, arcY, arrowMaterial);

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
