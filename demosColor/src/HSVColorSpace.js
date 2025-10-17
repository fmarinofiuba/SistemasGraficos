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

                const clampToUnit = (value, fallback) => {
                        const numericValue = typeof value === 'number' ? value : fallback;
                        return THREE.MathUtils.clamp(numericValue, 0, 1);
                };

                const hMinNorm = clampToUnit(limits.h && limits.h.min, 0);
                const hMaxNorm = clampToUnit(limits.h && limits.h.max, 1);
                const sMin = clampToUnit(limits.s && limits.s.min, 0);
                const sMax = clampToUnit(limits.s && limits.s.max, 1);
                const vMin = clampToUnit(limits.v && limits.v.min, 0);
                const vMax = clampToUnit(limits.v && limits.v.max, 1);

                const hsvShaderMaterial = new THREE.ShaderMaterial({
                        vertexShader: hsvVertexShader,
                        fragmentShader: hsvFragmentShader,
                        uniforms: {
                                hMin: { value: hMinNorm * 360 },
                                hMax: { value: hMaxNorm * 360 },
                                sMin: { value: sMin },
                                sMax: { value: sMax },
                                vMin: { value: vMin },
                                vMax: { value: vMax },
                        },
                        side: THREE.DoubleSide,
                        transparent: true,
                });

                const height = vMax - vMin;

                const volumeMeshGroup = new THREE.Group();
                volumeMeshGroup.name = 'subspaceVolume';

                const cylinderRadialSegments = 64;
                const cylinderHeightSegments = 1; // Shader handles V segments
                const ringThetaSegments = cylinderRadialSegments;
                const ringPhiSegments = 1;
                const epsilon = 0.0001;
                const twoPi = Math.PI * 2;

                const normalizedHueDiff = hMaxNorm - hMinNorm;
                const wrappedHueDiff = normalizedHueDiff >= 0 ? normalizedHueDiff : normalizedHueDiff + 1;

                const hueSegments = [];

                if (height > epsilon && sMax > epsilon) {
                        if (sMax - sMin <= epsilon) {
                                console.log('HSV subspace saturation range collapsed; skipping volume creation.');
                                hsvShaderMaterial.dispose();
                                return;
                        }

                        if (Math.abs(normalizedHueDiff) < epsilon && wrappedHueDiff < epsilon) {
                                console.log('HSV subspace hue range collapsed; skipping volume creation.');
                        } else if (Math.abs(wrappedHueDiff - 1) < epsilon) {
                                hueSegments.push({ start: 0, length: twoPi });
                        } else if (normalizedHueDiff >= 0) {
                                hueSegments.push({ start: hMinNorm * twoPi, length: wrappedHueDiff * twoPi });
                        } else {
                                hueSegments.push({ start: hMinNorm * twoPi, length: (1 - hMinNorm) * twoPi });
                                if (hMaxNorm > epsilon) {
                                        hueSegments.push({ start: 0, length: hMaxNorm * twoPi });
                                }
                        }
                }

                const addHueSegmentGeometry = (thetaStartRad, thetaLengthRad) => {
                        if (thetaLengthRad <= epsilon) {
                                return;
                        }

                        const openEndedOuter = true;
                        const outerCylinderGeometry = new THREE.CylinderGeometry(
                                sMax,
                                sMax,
                                height,
                                cylinderRadialSegments,
                                cylinderHeightSegments,
                                openEndedOuter,
                                thetaStartRad,
                                thetaLengthRad
                        );
                        outerCylinderGeometry.translate(0, vMin + height / 2, 0);
                        volumeMeshGroup.add(new THREE.Mesh(outerCylinderGeometry, hsvShaderMaterial));

                        if (sMin > epsilon && sMin < sMax) {
                                const innerCylinderGeometry = new THREE.CylinderGeometry(
                                        sMin,
                                        sMin,
                                        height,
                                        cylinderRadialSegments,
                                        cylinderHeightSegments,
                                        true,
                                        thetaStartRad,
                                        thetaLengthRad
                                );
                                innerCylinderGeometry.translate(0, vMin + height / 2, 0);
                                volumeMeshGroup.add(new THREE.Mesh(innerCylinderGeometry, hsvShaderMaterial));

                                const bottomRingGeometry = new THREE.RingGeometry(
                                        sMin,
                                        sMax,
                                        ringThetaSegments,
                                        ringPhiSegments,
                                        thetaStartRad,
                                        thetaLengthRad
                                );
                                bottomRingGeometry.rotateX(-Math.PI / 2);
                                bottomRingGeometry.translate(0, vMin, 0);
                                volumeMeshGroup.add(new THREE.Mesh(bottomRingGeometry, hsvShaderMaterial));

                                const topRingGeometry = new THREE.RingGeometry(
                                        sMin,
                                        sMax,
                                        ringThetaSegments,
                                        ringPhiSegments,
                                        thetaStartRad,
                                        thetaLengthRad
                                );
                                topRingGeometry.rotateX(-Math.PI / 2);
                                topRingGeometry.translate(0, vMax, 0);
                                volumeMeshGroup.add(new THREE.Mesh(topRingGeometry, hsvShaderMaterial));
                        } else if (sMin <= epsilon) {
                                const bottomDiskGeometry = new THREE.CircleGeometry(
                                        sMax,
                                        ringThetaSegments,
                                        thetaStartRad,
                                        thetaLengthRad
                                );
                                bottomDiskGeometry.rotateX(-Math.PI / 2);
                                bottomDiskGeometry.translate(0, vMin, 0);
                                volumeMeshGroup.add(new THREE.Mesh(bottomDiskGeometry, hsvShaderMaterial));

                                const topDiskGeometry = new THREE.CircleGeometry(
                                        sMax,
                                        ringThetaSegments,
                                        thetaStartRad,
                                        thetaLengthRad
                                );
                                topDiskGeometry.rotateX(-Math.PI / 2);
                                topDiskGeometry.translate(0, vMax, 0);
                                volumeMeshGroup.add(new THREE.Mesh(topDiskGeometry, hsvShaderMaterial));
                        }

                        if (thetaLengthRad < twoPi - epsilon) {
                                const addRadialSurface = (angle) => {
                                        const cosAngle = Math.cos(angle);
                                        const sinAngle = Math.sin(angle);
                                        const hasInnerRadius = sMin > epsilon;
                                        const vertices = hasInnerRadius
                                                ? [
                                                          sMin * cosAngle,
                                                          vMin,
                                                          sMin * sinAngle,
                                                          sMin * cosAngle,
                                                          vMax,
                                                          sMin * sinAngle,
                                                          sMax * cosAngle,
                                                          vMax,
                                                          sMax * sinAngle,
                                                          sMax * cosAngle,
                                                          vMin,
                                                          sMax * sinAngle,
                                                  ]
                                                : [
                                                          0,
                                                          vMin,
                                                          0,
                                                          0,
                                                          vMax,
                                                          0,
                                                          sMax * cosAngle,
                                                          vMax,
                                                          sMax * sinAngle,
                                                          sMax * cosAngle,
                                                          vMin,
                                                          sMax * sinAngle,
                                                  ];

                                        const radialGeometry = new THREE.BufferGeometry();
                                        radialGeometry.setAttribute(
                                                'position',
                                                new THREE.Float32BufferAttribute(vertices, 3)
                                        );
                                        radialGeometry.setIndex([0, 1, 2, 0, 2, 3]);
                                        radialGeometry.computeVertexNormals();
                                        volumeMeshGroup.add(new THREE.Mesh(radialGeometry, hsvShaderMaterial));
                                };

                                addRadialSurface(thetaStartRad);
                                addRadialSurface(thetaStartRad + thetaLengthRad);
                        }
                };

                hueSegments.forEach(({ start, length }) => addHueSegmentGeometry(start, length));

                if (volumeMeshGroup.children.length === 0) {
                        console.log('HSV subspace volume is zero or invalid, not rendering.');
                        hsvShaderMaterial.dispose();
                        return;
                }

                this.currentVisuals.add(volumeMeshGroup);
                console.log('HSV SubSpace Volume updated and added to scene.');
	}
}
