import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import {
	createDirectionalArc,
	createAxis,
} from './GeometryUtils.js';
import { buildHSLVolume } from './HSLVolumeBuilder.js';
import { createHSLVolumeMaterial } from './HSLVolumeMaterial.js';
import { outlineEdgeThickness } from './constants.js';

export class HSLColorSpace extends ColorSpace {
	constructor(scene) {
		super(scene);
		this.modelType = 'HSL';
		this.subSpaceLimits = {
			h: { min: 0, max: 1 },
			s: { min: 0, max: 1 },
			l: { min: 0, max: 1 },
		};
	}

	// ── Axes & labels (kept from original) ─────────────────────

	_buildAxesAndLabels() {
		const axisExtensionFactor = 1.2;

		const axesGroup = new THREE.Group();
		axesGroup.name = 'axesGroup';

		// L-axis (vertical)
		createAxis(
			axesGroup,
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, axisExtensionFactor, 0),
			'L',
			new THREE.Vector3(0, 0.1, 0),
			0xffffff,
			this.makeTextSprite.bind(this)
		);

		// S-axis (radial at L = 0.5)
		const s_axisLength = 0.5 * axisExtensionFactor;
		createAxis(
			axesGroup,
			new THREE.Vector3(0, 0.5, 0),
			new THREE.Vector3(0, 0.5, s_axisLength),
			'S',
			new THREE.Vector3(0.1, 0, 0),
			0xffffff,
			this.makeTextSprite.bind(this)
		);

		// H arcs
		const h_arcRadius = s_axisLength + 0.1;
		const h_arcY = 0.5;
		const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

		const firstArc = createDirectionalArc(null, 0, 45, h_arcRadius, h_arcY, arrowMaterial);
		axesGroup.add(firstArc);

		const secondArc = firstArc.clone();
		secondArc.rotateY(Math.PI);
		axesGroup.add(secondArc);

		// H labels (one at each arrow tip)
		axesGroup.add(this.makeTextSprite('H', { x: h_arcRadius + 0.15, y: h_arcY, z: 0 }));
		axesGroup.add(this.makeTextSprite('H', { x: -(h_arcRadius + 0.15), y: h_arcY, z: 0 }));

		this.currentVisuals.add(axesGroup);
	}

	_buildFullSpaceOutlineObject() {
		// No outline object needed for now
	}

<<<<<<< HEAD
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

        _createRadialSurfaceMesh(limits, saturationValue, hMin, hMax, material) {
                if (saturationValue <= 0) return null;

                const { l } = limits;
                const lMin = l.min;
                const lMax = l.max;

                if (lMax <= lMin) return null;

                const hueRange = Math.max(0, hMax - hMin);
                if (hueRange <= 0) return null;

                const radialSegments = Math.max(1, Math.floor(RADIAL_SEGMENTS * hueRange));
                const positions = [];

                for (let i = 0; i < HEIGHT_SEGMENTS; i++) {
                        const t0 = i / HEIGHT_SEGMENTS;
                        const t1 = (i + 1) / HEIGHT_SEGMENTS;
                        const l0 = THREE.MathUtils.lerp(lMin, lMax, t0);
                        const l1 = THREE.MathUtils.lerp(lMin, lMax, t1);
                        const r0 = this._getRadiusAtL(l0, saturationValue);
                        const r1 = this._getRadiusAtL(l1, saturationValue);

                        for (let j = 0; j < radialSegments; j++) {
                                const s0 = j / radialSegments;
                                const s1 = (j + 1) / radialSegments;
                                const h0 = THREE.MathUtils.lerp(hMin, hMax, s0) * Math.PI * 2;
                                const h1 = THREE.MathUtils.lerp(hMin, hMax, s1) * Math.PI * 2;

                                const cos0 = Math.cos(h0);
                                const sin0 = Math.sin(h0);
                                const cos1 = Math.cos(h1);
                                const sin1 = Math.sin(h1);

                                const x00 = r0 * cos0;
                                const z00 = r0 * sin0;
                                const x01 = r0 * cos1;
                                const z01 = r0 * sin1;
                                const x10 = r1 * cos0;
                                const z10 = r1 * sin0;
                                const x11 = r1 * cos1;
                                const z11 = r1 * sin1;

                                positions.push(
                                        x00,
                                        l0,
                                        z00,
                                        x01,
                                        l0,
                                        z01,
                                        x11,
                                        l1,
                                        z11,

                                        x00,
                                        l0,
                                        z00,
                                        x11,
                                        l1,
                                        z11,
                                        x10,
                                        l1,
                                        z10
                                );
                        }
                }

                if (positions.length === 0) return null;

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geometry.computeVertexNormals();

                return new THREE.Mesh(geometry, material);
        }

        _createLightnessCap(lValue, sMin, sMax, hMin, hMax, material) {
                const outerRadius = this._getRadiusAtL(lValue, sMax);
                if (outerRadius <= 0.0001) return null;

                const innerRadius = Math.min(this._getRadiusAtL(lValue, sMin), outerRadius - 0.0001);
                const thetaStart = hMin * Math.PI * 2;
                const thetaLength = Math.max(0, hMax - hMin) * Math.PI * 2;

                if (thetaLength <= 0) return null;

                const geometry = new THREE.RingGeometry(innerRadius, outerRadius, RADIAL_SEGMENTS, 1, thetaStart, thetaLength);
                const mesh = new THREE.Mesh(geometry, material);
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.y = lValue;
                return mesh;
        }

        _createHueBoundarySurface(limits, hueValue, material) {
                const { l, s } = limits;
                const lMin = l.min;
                const lMax = l.max;
                const hueAngle = hueValue * Math.PI * 2;

                if (lMax <= lMin) return null;

                const cosAngle = Math.cos(hueAngle);
                const sinAngle = Math.sin(hueAngle);
                const positions = [];
                const EPS = 0.0001;

                for (let i = 0; i < HEIGHT_SEGMENTS; i++) {
                        const t0 = i / HEIGHT_SEGMENTS;
                        const t1 = (i + 1) / HEIGHT_SEGMENTS;
                        const l0 = THREE.MathUtils.lerp(lMin, lMax, t0);
                        const l1 = THREE.MathUtils.lerp(lMin, lMax, t1);

                        const outer0 = this._getRadiusAtL(l0, s.max);
                        const outer1 = this._getRadiusAtL(l1, s.max);
                        const inner0 = this._getRadiusAtL(l0, s.min);
                        const inner1 = this._getRadiusAtL(l1, s.min);

                        const hasOuter = outer0 > EPS || outer1 > EPS;
                        const hasInner = inner0 > EPS || inner1 > EPS;

                        if (!hasOuter) {
                                continue;
                        }

                        if (hasInner) {
                                positions.push(
                                        inner0 * cosAngle,
                                        l0,
                                        inner0 * sinAngle,
                                        outer0 * cosAngle,
                                        l0,
                                        outer0 * sinAngle,
                                        outer1 * cosAngle,
                                        l1,
                                        outer1 * sinAngle,

                                        inner0 * cosAngle,
                                        l0,
                                        inner0 * sinAngle,
                                        outer1 * cosAngle,
                                        l1,
                                        outer1 * sinAngle,
                                        inner1 * cosAngle,
                                        l1,
                                        inner1 * sinAngle
                                );
                        } else {
                                positions.push(
                                        0,
                                        l0,
                                        0,
                                        outer0 * cosAngle,
                                        l0,
                                        outer0 * sinAngle,
                                        outer1 * cosAngle,
                                        l1,
                                        outer1 * sinAngle,

                                        0,
                                        l0,
                                        0,
                                        outer1 * cosAngle,
                                        l1,
                                        outer1 * sinAngle,
                                        0,
                                        l1,
                                        0
                                );
                        }
                }

                if (positions.length === 0) return null;

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geometry.computeVertexNormals();

                return new THREE.Mesh(geometry, material);
        }

        _updateSubSpaceVolume(limits) {
                console.log(`Updating HSL SubSpace Volume with limits:`, limits);

                this._disposeVisuals(this.currentVisuals.getObjectByName('subspaceVolume'));

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

                const { l, s, h } = limits;
                const hueRange = Math.max(0, h.max - h.min);

                const outerSurface = this._createRadialSurfaceMesh(limits, s.max, h.min, h.max, shaderMaterial);
                if (outerSurface) {
                        volumeMeshGroup.add(outerSurface);
                }

                if (s.min > 0.0001) {
                        const innerSurface = this._createRadialSurfaceMesh(limits, s.min, h.min, h.max, shaderMaterial);
                        if (innerSurface) {
                                volumeMeshGroup.add(innerSurface);
                        }
                }

                const lowerCap = this._createLightnessCap(l.min, s.min, s.max, h.min, h.max, shaderMaterial);
                if (lowerCap) {
                        volumeMeshGroup.add(lowerCap);
                }

                const upperCap = this._createLightnessCap(l.max, s.min, s.max, h.min, h.max, shaderMaterial);
                if (upperCap) {
                        volumeMeshGroup.add(upperCap);
                }

                if (hueRange > 0 && hueRange < 1) {
                        const minHueSurface = this._createHueBoundarySurface(limits, h.min, shaderMaterial);
                        if (minHueSurface) {
                                volumeMeshGroup.add(minHueSurface);
                        }

                        const maxHueSurface = this._createHueBoundarySurface(limits, h.max, shaderMaterial);
                        if (maxHueSurface) {
                                volumeMeshGroup.add(maxHueSurface);
                        }
                }

                this.currentVisuals.add(volumeMeshGroup);
                console.log('HSL SubSpace Volume updated. Group contains:', volumeMeshGroup.children.length, 'meshes.');
        }
=======
	// ── Volume construction (NEW) ──────────────────────────────

	_updateSubSpaceVolume(limits) {
		// Convert normalized hue [0,1] → degrees [0,360]
		const hMinDeg = limits.h.min * 360;
		const hMaxDeg = limits.h.max * 360;
		const sMin = limits.s.min;
		const sMax = limits.s.max;
		const lMin = limits.l.min;
		const lMax = limits.l.max;

		// Create shared material
		const material = createHSLVolumeMaterial();

		// Build volume boundary faces
		const volumeGroup = buildHSLVolume(
			hMinDeg, hMaxDeg,
			sMin, sMax,
			lMin, lMax,
			material
		);

		this.currentVisuals.add(volumeGroup);
	}

>>>>>>> 386a6e9 (Guarda cambios locales y templateBasico)
}

