import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import { createTubesFromEdges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS } from './GeometryUtils.js';
import hslVertexShader from './shaders/hsl/hslVertex.glsl';
import hslFragmentShader from './shaders/hsl/hslFragment.glsl';

// Constants for HSL geometry
const RADIAL_SEGMENTS = 64;
const HEIGHT_SEGMENTS = 16;
const L_MID_POINT = 0.5;
const MAX_VISUAL_RADIUS_AT_MID = 0.5; // Visual radius of the HSL shape at L=0.5 when S=1

export class HSLColorSpace extends ColorSpace {
	constructor(scene) {
		super(scene);
		this.modelType = 'HSL';
		this.subSpaceLimits = {
			h: { min: 0, max: 1 }, // Default to full hue range
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

	// Helper method to dispose of visuals and their resources
	_disposeVisuals(object3D) {
		if (object3D) {
			object3D.traverse((child) => {
				if (child.isMesh) {
					if (child.geometry) {
						child.geometry.dispose();
					}
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((material) => material.dispose());
						} else {
							child.material.dispose();
						}
					}
				}
			});
			if (object3D.parent) {
				object3D.parent.remove(object3D);
			}
		}
	}

	// Helper to calculate radius at a given L value and saturation scaling
	_getRadiusAtL(l_value, s_value_for_radius_scaling = 1) {
		let radius_at_s1;
		if (l_value <= L_MID_POINT) {
			radius_at_s1 = (l_value / L_MID_POINT) * MAX_VISUAL_RADIUS_AT_MID;
		} else {
			radius_at_s1 = ((1 - l_value) / (1 - L_MID_POINT)) * MAX_VISUAL_RADIUS_AT_MID;
		}
		return Math.max(0, radius_at_s1 * s_value_for_radius_scaling);
	}

	// Helper to create cylinder segment for HSL shape
	_createHslCylinderSegmentMesh(params, material) {
		const geometry = new THREE.CylinderGeometry(
			params.radiusTop,
			params.radiusBottom,
			params.height,
			params.radialSegments,
			params.heightSegments,
			false, // openEnded
			params.h_min_rad,
			params.h_length_rad
		);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, params.yBase + params.height / 2, 0);
		return mesh;
	}

	// Helper to create side cap for HSL shape when not full circle
	_createSideCapMesh(params, material) {
		const { y_bottom, y_top, r_bottom, r_top, angle_rad } = params;

		const p0 = new THREE.Vector3(0, y_bottom, 0); // Center-bottom
		const p1 = new THREE.Vector3(r_bottom * Math.cos(angle_rad), y_bottom, r_bottom * Math.sin(angle_rad)); // Outer-bottom
		const p2 = new THREE.Vector3(r_top * Math.cos(angle_rad), y_top, r_top * Math.sin(angle_rad)); // Outer-top
		const p3 = new THREE.Vector3(0, y_top, 0); // Center-top

		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array([
			p0.x, p0.y, p0.z,
			p1.x, p1.y, p1.z,
			p2.x, p2.y, p2.z,

			p0.x, p0.y, p0.z,
			p2.x, p2.y, p2.z,
			p3.x, p3.y, p3.z,
		]);
		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.computeVertexNormals(); // Important for proper lighting
		return new THREE.Mesh(geometry, material);
	}

	// Helper to create circular end caps for HSL shape
	_createEndCapMesh(params, material) {
		const { yPos, innerRadius, outerRadius, h_min_rad, h_length_rad, radialSegments } = params;
		
		if (outerRadius <= 0.001) return null; // No cap if radius is negligible

		// Ensure innerRadius is less than outerRadius
		const actualInnerRadius = Math.min(innerRadius, outerRadius - 0.0001);

		const geometry = new THREE.RingGeometry(
			Math.max(0, actualInnerRadius), // innerRadius cannot be negative
			outerRadius,
			radialSegments,
			1, // thetaSegments for RingGeometry
			h_min_rad,
			h_length_rad
		);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, yPos, 0);
		mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
		return mesh;
	}

	_updateSubSpaceVolume(limits) {
		console.log(`Updating HSL SubSpace Volume with limits:`, limits);

		// Remove previous subspace volume if it exists
		this._disposeVisuals(this.currentVisuals.getObjectByName('subspaceVolume'));
		// Create shader material for the HSL subspace visualization
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
			transparent: true,
			side: THREE.DoubleSide,
		});

		const volumeMeshGroup = new THREE.Group();
		volumeMeshGroup.name = 'subspaceVolume';

		const l_min_limit = limits.l.min;
		const l_max_limit = limits.l.max;
		const s_min_limit = limits.s.min;
		const s_max_limit = limits.s.max;

		const h_min_rad = THREE.MathUtils.degToRad(limits.h.min * 360);
		const h_length_rad = THREE.MathUtils.degToRad((limits.h.max - limits.h.min) * 360);
		const h_end_rad = h_min_rad + h_length_rad;

		const fullCircle = Math.abs(h_length_rad - 2.0 * Math.PI) < 0.001;

		// Lower segment (from l_min_limit up to L_MID_POINT or l_max_limit)
		if (l_min_limit < L_MID_POINT && s_max_limit > 0.001) {
			const segmentLTop = Math.min(L_MID_POINT, l_max_limit);
			const heightLower = segmentLTop - l_min_limit;

			if (heightLower > 0.001) {
				const radiusBottomOuter = this._getRadiusAtL(l_min_limit, s_max_limit);
				const radiusTopOuter = this._getRadiusAtL(segmentLTop, s_max_limit);

				const lowerCylinderMesh = this._createHslCylinderSegmentMesh({
					yBase: l_min_limit,
					height: heightLower,
					radiusTop: radiusTopOuter,
					radiusBottom: radiusBottomOuter,
					h_min_rad: h_min_rad,
					h_length_rad: h_length_rad,
					radialSegments: RADIAL_SEGMENTS,
					heightSegments: HEIGHT_SEGMENTS,
				}, shaderMaterial);
				volumeMeshGroup.add(lowerCylinderMesh);

				if (!fullCircle) {
					const capParams = { y_bottom: l_min_limit, y_top: segmentLTop, r_bottom: radiusBottomOuter, r_top: radiusTopOuter };
					volumeMeshGroup.add(this._createSideCapMesh({ ...capParams, angle_rad: h_min_rad }, shaderMaterial));
					volumeMeshGroup.add(this._createSideCapMesh({ ...capParams, angle_rad: h_end_rad }, shaderMaterial));
				}
			}
		}

		// Upper segment (from L_MID_POINT or l_min_limit up to l_max_limit)
		if (l_max_limit > L_MID_POINT && s_max_limit > 0.001) {
			const segmentLBottom = Math.max(L_MID_POINT, l_min_limit);
			const heightUpper = l_max_limit - segmentLBottom;

			if (heightUpper > 0.001) {
				const radiusBottomOuter = this._getRadiusAtL(segmentLBottom, s_max_limit);
				const radiusTopOuter = this._getRadiusAtL(l_max_limit, s_max_limit);

				const upperCylinderMesh = this._createHslCylinderSegmentMesh({
					yBase: segmentLBottom,
					height: heightUpper,
					radiusTop: radiusTopOuter,
					radiusBottom: radiusBottomOuter,
					h_min_rad: h_min_rad,
					h_length_rad: h_length_rad,
					radialSegments: RADIAL_SEGMENTS,
					heightSegments: HEIGHT_SEGMENTS,
				}, shaderMaterial);
				volumeMeshGroup.add(upperCylinderMesh);

				if (!fullCircle) {
					const capParams = { y_bottom: segmentLBottom, y_top: l_max_limit, r_bottom: radiusBottomOuter, r_top: radiusTopOuter };
					volumeMeshGroup.add(this._createSideCapMesh({ ...capParams, angle_rad: h_min_rad }, shaderMaterial));
					volumeMeshGroup.add(this._createSideCapMesh({ ...capParams, angle_rad: h_end_rad }, shaderMaterial));
				}
			}
		}

		// End Caps (Top and Bottom)
		if (s_max_limit > 0.001) {
			// Bottom Cap
			if (l_min_limit > 0.001) {
				const radiusOuter_lmin = this._getRadiusAtL(l_min_limit, s_max_limit);
				const radiusInner_lmin = this._getRadiusAtL(l_min_limit, s_min_limit);
				const bottomCap = this._createEndCapMesh({
					yPos: l_min_limit,
					innerRadius: radiusInner_lmin,
					outerRadius: radiusOuter_lmin,
					h_min_rad: h_min_rad,
					h_length_rad: h_length_rad,
					radialSegments: RADIAL_SEGMENTS
				}, shaderMaterial);
				if (bottomCap) volumeMeshGroup.add(bottomCap);
			}

			// Top Cap
			if (l_max_limit < 0.999) {
				const radiusOuter_lmax = this._getRadiusAtL(l_max_limit, s_max_limit);
				const radiusInner_lmax = this._getRadiusAtL(l_max_limit, s_min_limit);
				const topCap = this._createEndCapMesh({
					yPos: l_max_limit,
					innerRadius: radiusInner_lmax,
					outerRadius: radiusOuter_lmax,
					h_min_rad: h_min_rad,
					h_length_rad: h_length_rad,
					radialSegments: RADIAL_SEGMENTS
				}, shaderMaterial);
				if (topCap) volumeMeshGroup.add(topCap);
			}
		}

		this.currentVisuals.add(volumeMeshGroup);
		console.log('HSL SubSpace Volume updated. Group contains:', volumeMeshGroup.children.length, 'meshes.');
	}

	// Helper method to dispose of visuals and their resources
	_disposeVisuals(object3D) {
		if (object3D) {
			object3D.traverse((child) => {
				if (child.isMesh) {
					if (child.geometry) {
						child.geometry.dispose();
					}
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((material) => material.dispose());
						} else {
							child.material.dispose();
						}
					}
				}
			});
			if (object3D.parent) {
				object3D.parent.remove(object3D);
			}
		}
	}

	// Helper to calculate radius at a given L value and saturation scaling
	_getRadiusAtL(l_value, s_value_for_radius_scaling = 1) {
		let radius_at_s1;
		if (l_value <= L_MID_POINT) {
			radius_at_s1 = (l_value / L_MID_POINT) * MAX_VISUAL_RADIUS_AT_MID;
		} else {
			radius_at_s1 = ((1 - l_value) / (1 - L_MID_POINT)) * MAX_VISUAL_RADIUS_AT_MID;
		}
		return Math.max(0, radius_at_s1 * s_value_for_radius_scaling);
	}

	// Helper to create cylinder segment for HSL shape
	_createHslCylinderSegmentMesh(params, material) {
		const geometry = new THREE.CylinderGeometry(
			params.radiusTop,
			params.radiusBottom,
			params.height,
			params.radialSegments,
			params.heightSegments,
			false, // openEnded
			params.h_min_rad,
			params.h_length_rad
		);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, params.yBase + params.height / 2, 0);
		return mesh;
	}

	// Helper to create side cap for HSL shape when not full circle
	_createSideCapMesh(params, material) {
		const { y_bottom, y_top, r_bottom, r_top, angle_rad } = params;

		const p0 = new THREE.Vector3(0, y_bottom, 0); // Center-bottom
		const p1 = new THREE.Vector3(r_bottom * Math.cos(angle_rad), y_bottom, r_bottom * Math.sin(angle_rad)); // Outer-bottom
		const p2 = new THREE.Vector3(r_top * Math.cos(angle_rad), y_top, r_top * Math.sin(angle_rad)); // Outer-top
		const p3 = new THREE.Vector3(0, y_top, 0); // Center-top

		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array([
			p0.x, p0.y, p0.z,
			p1.x, p1.y, p1.z,
			p2.x, p2.y, p2.z,

			p0.x, p0.y, p0.z,
			p2.x, p2.y, p2.z,
			p3.x, p3.y, p3.z,
		]);
		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.computeVertexNormals(); // Important for proper lighting
		return new THREE.Mesh(geometry, material);
	}

	// Helper to create circular end caps for HSL shape
	_createEndCapMesh(params, material) {
		const { yPos, innerRadius, outerRadius, h_min_rad, h_length_rad, radialSegments } = params;
		
		if (outerRadius <= 0.001) return null; // No cap if radius is negligible

		// Ensure innerRadius is less than outerRadius
		const actualInnerRadius = Math.min(innerRadius, outerRadius - 0.0001);

		const geometry = new THREE.RingGeometry(
			Math.max(0, actualInnerRadius), // innerRadius cannot be negative
			outerRadius,
			radialSegments,
			1, // thetaSegments for RingGeometry
			h_min_rad,
			h_length_rad
		);

		const mesh = new THREE.Mesh(geometry, material);
		mesh.rotation.x = -Math.PI / 2; // Rotate to XZ plane
		mesh.position.set(0, yPos, 0);
		return mesh;
	}
}
