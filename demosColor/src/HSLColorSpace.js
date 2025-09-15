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
import hslVertexShader from './shaders/hsl/hslVertex.glsl';
import hslFragmentShader from './shaders/hsl/hslFragment.glsl';
import {
	outlineEdgeThickness,
	L_MID_POINT,
	MAX_VISUAL_RADIUS_AT_MID,
	arrowRadius,
	arrowLength,
	axisThickness,
} from './constants.js';

// Constants for HSL geometry
const RADIAL_SEGMENTS = 64;
const HEIGHT_SEGMENTS = 16;

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
		console.log('HSL Axes and Labels building');
		// HSL: Cylindrical (double-cone) model
		// L: height (0 to 1), S: radius, H: angle
		// Origin is at (0,0,0), L extends from 0 to 1
		// Clear any existing visuals
		this.clearCurrentVisuals();

		//axes helpers
		this.scene.add(new THREE.AxesHelper(1));

		// Common material for axes and arrowheads
		const axisMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

		// Extension factor for axes (make them 20% longer for better visibility)
		const axisExtensionFactor = 1.2;

		// L-axis (Lightness) - vertical, extends from 0 to axisExtensionFactor
		createAxis(
			this.currentVisuals,
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, axisExtensionFactor, 0),
			'L',
			new THREE.Vector3(0, 0.1, 0),
			0xffffff,
			this.makeTextSprite.bind(this)
		);

		// Add a TorusGeometry for the H ring at L=0.5
		const torusRadius = 0.5; // Outer radius (distance from center to middle of tube)
		const tubeRadius = outlineEdgeThickness; // Using centralized constant for tube thickness
		const torusGeometry = new THREE.TorusGeometry(
			torusRadius,
			tubeRadius,
			16, // tubular segments
			64, // radial segments
			Math.PI * 2 // arc
		);
		const torusMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
		const torus = new THREE.Mesh(torusGeometry, torusMaterial);
		torus.position.set(0, 0.5, 0);
		torus.rotation.x = Math.PI / 2; // Rotate to be horizontal in XZ plane
		this.currentVisuals.add(torus);

		// S-axis (Saturation) - from L-axis outwards at L=0.5, extended by 20%
		const s_axisLength = 0.5 * axisExtensionFactor; // Extended by 20%

		// Create S-axis using the shared utility function
		createAxis(
			this.currentVisuals,
			new THREE.Vector3(0, 0.5, 0),
			new THREE.Vector3(0, 0.5, s_axisLength),
			'S',
			new THREE.Vector3(0.1, 0, 0),
			0xffffff,
			this.makeTextSprite.bind(this)
		);

		// H-arcs (Hue) - around L-axis at L=0.5, moved outward
		const h_arcRadius = s_axisLength + 0.1; // Slightly larger than S-axis extent
		const h_arcY = 0.5;

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
			h_arcRadius,
			h_arcY,
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
		// H label moved further out
		this.currentVisuals.add(this.makeTextSprite('H', { x: h_arcRadius + 0.15, y: h_arcY, z: 0 }));
	}

	_buildFullSpaceOutlineObject() {}

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

	_createHSLHalfVolume(lMin, lMax, sMin, sMax, hMin, hMax) {
		lMin = Math.min(lMin, lMax);
		sMin = Math.min(sMin, sMax);
		hMin = Math.min(hMin, hMax);

		const hRange = hMax - hMin;

		let phiStart = hMin * Math.PI * 2;
		let phiLength = hRange * Math.PI * 2;

		const p1A = new THREE.Vector2(0, 1);
		const p1B = new THREE.Vector2(1, 1);
		const p2A = new THREE.Vector2(1, 0);
		const p2B = new THREE.Vector2(0, 0);

		let points = [p1A, p1B, p2B, p2A, p1A];

		let lRange = lMax - lMin;
		let sRange = sMax - sMin;
		points.forEach((point) => {
			point.y *= lRange + lMin;
			point.x *= sRange + sMin;
			point.x *= 1 - point.y; // compress x as y increases
		});

		const geometry = new THREE.LatheGeometry(points, 128, phiStart, phiLength);

		return geometry;
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

		let lMin = limits.l.min; // 0 a 1, 0.5 en el centro
		let lMax = limits.l.max; // 0 a 1
		let sMin = limits.s.min;
		let sMax = limits.s.max;
		let hMin = limits.h.min;
		let hMax = limits.h.max;

		if (lMax > 0.5) {
			// draw the top cone
			// hMin should be in the range of 0 and hMax
			let l2Max = (lMax - 0.5) * 2;
			let l2Min = (Math.max(0.5, lMin) - 0.5) * 2;

			const geometry = this._createHSLHalfVolume(l2Min, l2Max, sMin, sMax, hMin, hMax);
			const lathe = new THREE.Mesh(geometry, shaderMaterial);
			volumeMeshGroup.add(lathe);
		}

		if (lMin < 0.5) {
			// draw the bottom cone
			let l2Max = (1 - lMin - 0.5) * 2;
			let l2Min = (Math.max(0.5, 1 - lMax) - 0.5) * 2;
			const geometry = this._createHSLHalfVolume(l2Min, l2Max, sMin, sMax, hMin, hMax);
			geometry.rotateX(Math.PI);
			const lathe = new THREE.Mesh(geometry, shaderMaterial);
			volumeMeshGroup.add(lathe);
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
		let { y_bottom, y_top, r_bottom, r_top, angle_rad } = params;

		//angle_rad += Math.PI / 2;
		let x = Math.cos(angle_rad);
		let z = Math.sin(angle_rad);

		const p0 = new THREE.Vector3(0, y_bottom, 0); // Center-bottom
		const p1 = new THREE.Vector3(r_bottom * x, y_bottom, r_bottom * z); // Outer-bottom
		const p2 = new THREE.Vector3(r_top * x, y_top, r_top * z); // Outer-top
		const p3 = new THREE.Vector3(0, y_top, 0); // Center-top

		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array([
			p0.x,
			p0.y,
			p0.z,

			p2.x,
			p2.y,
			p2.z,

			p1.x,
			p1.y,
			p1.z,

			p0.x,
			p0.y,
			p0.z,

			p3.x,
			p3.y,
			p3.z,
			p2.x,
			p2.y,
			p2.z,
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
