import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import { createTubesFromEdges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS } from './GeometryUtils.js';
import hsvVertexShader from './shaders/hsv/hsvVertex.glsl';
import hsvFragmentShader from './shaders/hsv/hsvFragment.glsl';

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

		const V_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
		const S_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff }); // Could be different colors

		// Common material and dimensions for arrowheads
		const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const coneRadius = 0.03;
		const coneHeight = 0.06;

		// Value Axis (Y)
		const v_points = [];
		v_points.push(new THREE.Vector3(0, 0, 0));
		v_points.push(new THREE.Vector3(0, 1, 0));
		const v_geometry = new THREE.BufferGeometry().setFromPoints(v_points);
		const v_axisLine = new THREE.Line(v_geometry, V_axisMaterial);
		this.currentVisuals.add(v_axisLine);
		this.currentVisuals.add(this.makeTextSprite('V', new THREE.Vector3(0, 1.1, 0)));

		// V-axis arrowhead
		const v_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
		const v_arrowhead = new THREE.Mesh(v_coneGeometry, arrowMaterial);
		v_arrowhead.position.set(0, 1, 0); // Tip of V-axis
		// Cone's axis is Y, already points up, no rotation needed if V is along Y
		v_arrowhead.position.addScaledVector(new THREE.Vector3(0,1,0), coneHeight / 2); // Offset base to end of line
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
		this.currentVisuals.add(this.makeTextSprite('H', new THREE.Vector3(outlineRadius + 0.15, outlineTopY, 0)));

        // Add arcs with arrowheads to illustrate Hue direction
        const arcRadius = outlineRadius + 0.1; // Slightly larger than the main outline
        const arcY = outlineTopY;
        const arcSegments = 16; // Number of segments for each arc
        const arcTubeRadius = TUBE_RADIUS * 0.8; // Thinner tubes for arrows
        // arrowMaterial is already defined

        const arcsData = [
            { startAngleDeg: 15, endAngleDeg: 60 },
            { startAngleDeg: 195, endAngleDeg: 240 }
        ];

        arcsData.forEach(arcData => {
            const edges = [];
            const points = [];
            const startRad = THREE.MathUtils.degToRad(arcData.startAngleDeg);
            const endRad = THREE.MathUtils.degToRad(arcData.endAngleDeg);
            const angleStep = (endRad - startRad) / arcSegments;

            for (let i = 0; i <= arcSegments; i++) {
                const angle = startRad + i * angleStep;
                points.push(new THREE.Vector3(arcRadius * Math.cos(angle), arcY, arcRadius * Math.sin(angle)));
            }
            for (let i = 0; i < arcSegments; i++) {
                edges.push({ start: points[i], end: points[i+1] });
            }
            const arcTubeGeom = createTubesFromEdges(edges, arcTubeRadius, TUBE_RADIAL_SEGMENTS);
            if (arcTubeGeom) {
                const arcMesh = new THREE.Mesh(arcTubeGeom, arrowMaterial);
                this.currentVisuals.add(arcMesh);
            }

            // Arrowhead cone
            const coneRadius = 0.03;
            const coneHeight = 0.06;
            const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
            const arrowhead = new THREE.Mesh(coneGeometry, arrowMaterial);
            
            // Position and orient arrowhead
            const endPoint = points[points.length - 1];
            const prevPoint = points[points.length - 2]; // Point before the end to determine direction
            arrowhead.position.copy(endPoint);
            
            // Direction vector for the arrowhead
            const direction = new THREE.Vector3().subVectors(endPoint, prevPoint).normalize();
            // Align cone's axis (Y) with the direction vector
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            arrowhead.quaternion.multiply(quaternion); // Sets cone's Y-axis (tip) along 'direction'
            // The following rotation was likely incorrect for a tangential arrowhead:
            // arrowhead.rotateX(Math.PI / 2); 
            // Small offset to position the base of the cone at the endpoint
            // The cone's center is initially at endPoint, tip points along 'direction'.
            // This moves the cone so its base (center of the -Y face) is at endPoint.
            arrowhead.position.addScaledVector(direction, coneHeight / 2);

            this.currentVisuals.add(arrowhead);
        });

        console.log('HSV Axes and Labels built');
    }

	_buildFullSpaceOutlineObject() {
		console.log('HSVColorSpace: Building full space outline with tubes (cylinder)');
		const edges = [];
		const outlineRadius = 1.0; // Matches existing CylinderGeometry radius
		const outlineHeight = 1.0; // Matches existing CylinderGeometry height
		const numSegments = 32; // Number of segments for the circles

		const bottomY = 0;
		const topY = outlineHeight;

		const bottomRingPoints = [];
		const topRingPoints = [];

		for (let i = 0; i < numSegments; i++) {
			const angle = (i / numSegments) * Math.PI * 2;
			const x = outlineRadius * Math.cos(angle);
			const z = outlineRadius * Math.sin(angle);
			bottomRingPoints.push(new THREE.Vector3(x, bottomY, z));
			topRingPoints.push(new THREE.Vector3(x, topY, z));
		}

		// Edges for bottom and top rings
		for (let i = 0; i < numSegments; i++) {
			edges.push({ start: bottomRingPoints[i], end: bottomRingPoints[(i + 1) % numSegments] });
			edges.push({ start: topRingPoints[i], end: topRingPoints[(i + 1) % numSegments] });
			// Vertical edges removed as per user request
		}

		const tubeGeometry = createTubesFromEdges(edges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS);

		if (!tubeGeometry) {
			console.warn('HSVColorSpace: Tube geometry for outline could not be created.');
			const group = new THREE.Group();
			group.name = 'fullSpaceOutline_HSV';
			return group; // Return an empty group
		}

		const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const outlineObject = new THREE.Mesh(tubeGeometry, tubeMaterial);
		outlineObject.name = 'fullSpaceOutline_HSV';
		return outlineObject;
	}

	_updateSubSpaceVolume(limits) {
		// limits = { hMin, hMax, sMin, sMax, vMin, vMax }
		console.log(`Updating HSV SubSpace Volume with limits:`, limits);

		// Remove previous subspace volume if it exists
		const existingVolume = this.currentVisuals.getObjectByName('subspaceVolume');
		if (existingVolume) {
			this.currentVisuals.remove(existingVolume);
			if (existingVolume.geometry) existingVolume.geometry.dispose();
			if (existingVolume.material) {
				if (existingVolume.material.uniforms) {
					// Dispose textures in uniforms if any
				}
				existingVolume.material.dispose();
			}
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
			transparent: true, // if opacity < 1 in gl_FragColor
		});

		// Geometry for the subspace volume: a cylinder segment
		// Assuming limits are now nested: limits.h.min, limits.s.max etc.
		const hMin = limits.h && typeof limits.h.min === 'number' ? limits.h.min : 0;
		const hMax = limits.h && typeof limits.h.max === 'number' ? limits.h.max : 360;
		const sMin = limits.s && typeof limits.s.min === 'number' ? limits.s.min : 0; // sMin for HSV is often 0 for the full cone/cylinder base
		const sMax = limits.s && typeof limits.s.max === 'number' ? limits.s.max : 1;
		const vMin = limits.v && typeof limits.v.min === 'number' ? limits.v.min : 0;
		const vMax = limits.v && typeof limits.v.max === 'number' ? limits.v.max : 1;

		if (!limits || !limits.h || !limits.s || !limits.v) {
			console.warn('HSV limits structure not fully defined. Using defaults for missing parts.');
		}

		// Radius is sMax, height is vMax-vMin, angle is hMax-hMin
		// ThetaStart is hMin. Cylinder is built around Y axis.
		const radius = sMax;
		const height = vMax - vMin;
		let thetaStartRad = THREE.MathUtils.degToRad(hMin);
		let thetaLengthRad = THREE.MathUtils.degToRad(hMax - hMin);

		thetaStartRad = 0;
		thetaLengthRad = Math.PI * 2;

		if (height <= 0 || radius <= 0 || thetaLengthRad <= 0) {
			console.log('HSV subspace volume is zero or invalid, not rendering.');
			return; // Avoid creating empty geometry
		}

		const subSpaceGeometry = new THREE.CylinderGeometry(
			radius, // radiusTop
			radius, // radiusBottom
			height, // height
			64, // radialSegments (more for smoother curve)
			8, // heightSegments
			false, // openEnded
			thetaStartRad, // thetaStart
			thetaLengthRad // thetaLength
		);
		// The geometry's local Y goes from -height/2 to +height/2.
		// We need its local Y to correspond to V values from vMin to vMax.
		// So, translate it up by vMin + height/2.
		subSpaceGeometry.translate(0, vMin + height / 2, 0);

		const subSpaceMesh = new THREE.Mesh(subSpaceGeometry, hsvShaderMaterial);
		subSpaceMesh.name = 'subspaceVolume';
		this.currentVisuals.add(subSpaceMesh);
		console.log('HSV SubSpace Volume updated/created.');
	}
}
