import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import { createTubesFromEdges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS } from './GeometryUtils.js';
import hslVertexShader from './shaders/hsl/hslVertex.glsl';
import hslFragmentShader from './shaders/hsl/hslFragment.glsl';

export class HSLColorSpace extends ColorSpace {
	constructor(scene) {
		super(scene);
		this.modelType = 'HSL';
		this.subSpaceLimits = {
			h: { min: 0, max: 1 },
			s: { min: 0, max: 1 },
			l: { min: 0, max: 1 },
		};
		console.log('HSLColorSpace initialized with default limits:', this.subSpaceLimits);
	}

	_buildAxesAndLabels() {
		console.log('HSLColorSpace: Building axes and labels');

		// Common material and dimensions for arrowheads
		const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const coneRadius = 0.03;
		const coneHeight = 0.06;

		// Lightness Axis (Y) - L goes from y=0 (black) to y=1 (white).
		const L_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
		const pointsL = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)];
		const L_geometry = new THREE.BufferGeometry().setFromPoints(pointsL);
		const L_axis = new THREE.Line(L_geometry, L_axisMaterial);
		this.currentVisuals.add(L_axis);

		// Labels for L
		this.currentVisuals.add(this.makeTextSprite('L=0', { x: 0.05, y: 0, z: 0 }));
		this.currentVisuals.add(this.makeTextSprite('L=1', { x: 0.05, y: 1.05, z: 0 })); // Adjusted L=1 label slightly for arrowhead
		this.currentVisuals.add(this.makeTextSprite('L=0.5', { x: 0.05, y: 0.5, z: 0 }));

		// L-axis arrowhead
		const l_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const l_arrowhead = new THREE.Mesh(l_coneGeometry, arrowMaterial);
		l_arrowhead.position.set(0, 1, 0); // Tip of L-axis
		l_arrowhead.position.addScaledVector(new THREE.Vector3(0, 1, 0), coneHeight / 2); // Offset base to end of line
		this.currentVisuals.add(l_arrowhead);

		// Hue/Saturation indication (circle at L=0.5)
		// Max saturation (radius = 0.5) occurs at L=0.5.
		const hueCircleGeometry = new THREE.RingGeometry(0.5 - 0.01, 0.5 + 0.01, 32); // A thin ring
		const hueCircleMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
		const hueCircle = new THREE.Mesh(hueCircleGeometry, hueCircleMaterial);
		hueCircle.position.set(0, 0.5, 0);
		hueCircle.rotation.x = -Math.PI / 2;
		//this.currentVisuals.add(hueCircle); // Keep the circle as a guide

		// S-axis (Saturation) - from L-axis outwards at L=0.5
		const s_axisLength = 0.5;
		const S_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
		const pointsS = [new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(s_axisLength, 0.5, 0)];
		const S_geometry = new THREE.BufferGeometry().setFromPoints(pointsS);
		const S_axis = new THREE.Line(S_geometry, S_axisMaterial);
		this.currentVisuals.add(S_axis);
		this.currentVisuals.add(this.makeTextSprite('S', { x: s_axisLength + 0.1, y: 0.5, z: 0 }));

		// S-axis arrowhead
		const s_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const s_arrowhead = new THREE.Mesh(s_coneGeometry, arrowMaterial);
		s_arrowhead.position.set(s_axisLength, 0.5, 0); // Tip of S-axis
		const s_direction = new THREE.Vector3(1, 0, 0);
		const s_quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), s_direction);
		s_arrowhead.quaternion.multiply(s_quaternion);
		s_arrowhead.position.addScaledVector(s_direction, coneHeight / 2); // Offset base
		this.currentVisuals.add(s_arrowhead);

		// H-arcs (Hue) - around L-axis at L=0.5
		const h_arcRadius = s_axisLength + 0.1; // Slightly larger than S-axis extent
		const h_arcY = 0.5;
		const h_arcSegments = 16;
		const h_arcTubeRadius = TUBE_RADIUS * 0.8;

		const h_arcsData = [
			{ startAngleDeg: 15, endAngleDeg: 60 },
			{ startAngleDeg: 195, endAngleDeg: 240 },
		];

		h_arcsData.forEach((arcData) => {
			const edges = [];
			const points = [];
			const startRad = THREE.MathUtils.degToRad(arcData.startAngleDeg);
			const endRad = THREE.MathUtils.degToRad(arcData.endAngleDeg);
			const angleStep = (endRad - startRad) / h_arcSegments;

			for (let i = 0; i <= h_arcSegments; i++) {
				const angle = startRad + i * angleStep;
				points.push(new THREE.Vector3(h_arcRadius * Math.cos(angle), h_arcY, h_arcRadius * Math.sin(angle)));
			}
			for (let i = 0; i < h_arcSegments; i++) {
				edges.push({ start: points[i], end: points[i + 1] });
			}
			const arcTubeGeom = createTubesFromEdges(edges, h_arcTubeRadius, TUBE_RADIAL_SEGMENTS);
			if (arcTubeGeom) {
				const arcMesh = new THREE.Mesh(arcTubeGeom, arrowMaterial);
				this.currentVisuals.add(arcMesh);
			}

			// Arrowhead cone for H-arc
			const h_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
			const h_arrowhead = new THREE.Mesh(h_coneGeometry, arrowMaterial);
			const endPoint = points[points.length - 1];
			const prevPoint = points[points.length - 2];
			h_arrowhead.position.copy(endPoint);
			const direction = new THREE.Vector3().subVectors(endPoint, prevPoint).normalize();
			const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
			h_arrowhead.quaternion.multiply(quaternion);
			h_arrowhead.position.addScaledVector(direction, coneHeight / 2);
			this.currentVisuals.add(h_arrowhead);
		});
		this.currentVisuals.add(this.makeTextSprite('H', { x: h_arcRadius + 0.15, y: h_arcY, z: 0 }));
	}

	_buildFullSpaceOutlineObject() {
		console.log('HSLColorSpace: Building full space outline with tubes (central ring only)');
		const edges = [];
		const outlineRadius = 0.5; // Radius of the central ring at L=0.5
		const centralRingY = 0.5; // Y-coordinate of the central ring
		const numSegments = 64; // Number of segments for the central ring

		const centralRingPoints = [];
		for (let i = 0; i < numSegments; i++) {
			const angle = (i / numSegments) * Math.PI * 2;
			centralRingPoints.push(
				new THREE.Vector3(outlineRadius * Math.cos(angle), centralRingY, outlineRadius * Math.sin(angle))
			);
		}

		// Edges for the central ring
		for (let i = 0; i < numSegments; i++) {
			edges.push({ start: centralRingPoints[i], end: centralRingPoints[(i + 1) % numSegments] });
		}

		const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const outlineTubeGeom = createTubesFromEdges(edges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS);

		if (outlineTubeGeom) {
			const outlineMesh = new THREE.Mesh(outlineTubeGeom, outlineMaterial);
			this.currentVisuals.add(outlineMesh);
		} else {
			console.warn('HSLColorSpace: Failed to create outline tube geometry for central ring.');
		}
		console.log('HSL Outline (central ring) built');
	}

	_updateSubSpaceVolume(limits) {
		console.log(`Updating HSL SubSpace Volume with limits:`, limits);

		// Remove previous subspace volume if it exists
		const existingVolumeGroup = this.currentVisuals.getObjectByName('subspaceVolume');
		if (existingVolumeGroup) {
			// Properly dispose of geometries and materials of children
			existingVolumeGroup.traverse((child) => {
				if (child.isMesh) {
					if (child.geometry) {
						child.geometry.dispose();
					}
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((material) => material.dispose());
						} else {
							// Assuming the material is the ShaderMaterial created in the previous call
							child.material.dispose();
						}
					}
				}
			});
			this.currentVisuals.remove(existingVolumeGroup);
		}

		// For HSL, the subspace volume will be a double cone geometry,
		// rendered with a shader that discards fragments outside the HSL limits.
		const radius = 0.5;
		const heightCone = 0.5; // Height of each individual cone
		const radialSegments = 64; // Increased for smoother surface
		const heightSegments = 16; // Increased for smoother surface

		const shaderMaterial = new THREE.ShaderMaterial({
			vertexShader: hslVertexShader,
			fragmentShader: hslFragmentShader,
			uniforms: {
				h_min: { value: limits.h.min },
				h_max: { value: limits.h.max },
				s_min: { value: limits.s.min },
				s_max: { value: limits.s.max },
				l_min: { value: limits.l.min },
				l_max: { value: limits.l.max },
			},
			transparent: true, // Allows discard to make parts invisible
			side: THREE.DoubleSide,
			// depthWrite: true, // Default. Set to false if alpha blending issues with other transparent objects.
		});

		const volumeMeshGroup = new THREE.Group();
		volumeMeshGroup.name = 'subspaceVolume';

		const l_min = limits.l.min;
		const l_max = limits.l.max;
		const s_max_limit = limits.s.max; // Saturation limit from UI (0-1)
		const h_min_rad = THREE.MathUtils.degToRad(limits.h.min * 360); // Assuming H is 0-1 from UI
		const h_length_rad = THREE.MathUtils.degToRad((limits.h.max - limits.h.min) * 360);

		const l_midPoint = 0.5;
		const maxVisualRadiusAtMid = 0.5; // Visual radius of the HSL shape at L=0.5 when S=1

		// Calculate actual radius at L=0.5 based on s_max_limit
		const currentMaxRadius = maxVisualRadiusAtMid * s_max_limit;

		// Lower part (cone/cylinder segment)
		if (l_min < l_midPoint) {
			const heightLower = Math.min(l_midPoint, l_max) - l_min;
			if (heightLower > 0.001) {
				// Avoid zero-height geometry
				// Radius at l_min (bottom of this segment)
				const radiusAtLMin = (l_min / l_midPoint) * currentMaxRadius;
				// Radius at l_midPoint or l_max if l_max < l_midPoint (top of this segment)
				const radiusAtLMidOrLMax = (Math.min(l_midPoint, l_max) / l_midPoint) * currentMaxRadius;

				const lowerGeometry = new THREE.CylinderGeometry(
					radiusAtLMidOrLMax, // radiusTop
					radiusAtLMin, // radiusBottom
					heightLower,
					radialSegments,
					heightSegments,
					false, // openEnded
					h_min_rad,
					h_length_rad
				);
				const lowerMesh = new THREE.Mesh(lowerGeometry, shaderMaterial);
				lowerMesh.position.set(0, l_min + heightLower / 2, 0);
				// Shader expects L to range from 0 to 1 across the entire double cone height (0 to 1 in world Y)
				// The vertex shader's v_hsl.z (l) is calculated based on world Y, so this direct positioning is okay.
				volumeMeshGroup.add(lowerMesh);
			}
		}

		// Upper part (cone/cylinder segment)
		if (l_max > l_midPoint) {
			const heightUpper = l_max - Math.max(l_midPoint, l_min);
			if (heightUpper > 0.001) {
				// Avoid zero-height geometry
				// Radius at l_max (top of this segment)
				const radiusAtLMax = ((1.0 - l_max) / (1.0 - l_midPoint)) * currentMaxRadius;
				// Radius at l_midPoint or l_min if l_min > l_midPoint (bottom of this segment)
				const radiusAtLMidOrLMin =
					((1.0 - Math.max(l_midPoint, l_min)) / (1.0 - l_midPoint)) * currentMaxRadius;

				const upperGeometry = new THREE.CylinderGeometry(
					radiusAtLMax, // radiusTop
					radiusAtLMidOrLMin, // radiusBottom
					heightUpper,
					radialSegments,
					heightSegments,
					false, // openEnded
					h_min_rad,
					h_length_rad
				);
				const upperMesh = new THREE.Mesh(upperGeometry, shaderMaterial);
				upperMesh.position.set(0, Math.max(l_midPoint, l_min) + heightUpper / 2, 0);
				volumeMeshGroup.add(upperMesh);
			}
		}

		this.currentVisuals.add(volumeMeshGroup);
		console.log('HSL SubSpace Volume updated/created.');
	}
}
