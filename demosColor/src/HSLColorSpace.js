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
            l: { min: 0, max: 1 }
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
        this.currentVisuals.add(this.makeTextSprite("L=0", { x: 0.05, y: 0, z: 0 }));
        this.currentVisuals.add(this.makeTextSprite("L=1", { x: 0.05, y: 1.05, z: 0 })); // Adjusted L=1 label slightly for arrowhead
        this.currentVisuals.add(this.makeTextSprite("L=0.5", { x: 0.05, y: 0.5, z: 0 }));

        // L-axis arrowhead
        const l_coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
        const l_arrowhead = new THREE.Mesh(l_coneGeometry, arrowMaterial);
        l_arrowhead.position.set(0, 1, 0); // Tip of L-axis
        l_arrowhead.position.addScaledVector(new THREE.Vector3(0,1,0), coneHeight / 2); // Offset base to end of line
        this.currentVisuals.add(l_arrowhead);

        // Hue/Saturation indication (circle at L=0.5)
        // Max saturation (radius = 0.5) occurs at L=0.5.
        const hueCircleGeometry = new THREE.RingGeometry(0.5 - 0.01, 0.5 + 0.01, 32); // A thin ring
        const hueCircleMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const hueCircle = new THREE.Mesh(hueCircleGeometry, hueCircleMaterial);
        hueCircle.position.set(0, 0.5, 0);
        hueCircle.rotation.x = -Math.PI / 2;
        this.currentVisuals.add(hueCircle); // Keep the circle as a guide

        // S-axis (Saturation) - from L-axis outwards at L=0.5
        const s_axisLength = 0.5;
        const S_axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const pointsS = [new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(s_axisLength, 0.5, 0)];
        const S_geometry = new THREE.BufferGeometry().setFromPoints(pointsS);
        const S_axis = new THREE.Line(S_geometry, S_axisMaterial);
        this.currentVisuals.add(S_axis);
        this.currentVisuals.add(this.makeTextSprite("S", { x: s_axisLength + 0.1, y: 0.5, z: 0 }));

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
            { startAngleDeg: 195, endAngleDeg: 240 }
        ];

        h_arcsData.forEach(arcData => {
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
                edges.push({ start: points[i], end: points[i+1] });
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
        this.currentVisuals.add(this.makeTextSprite("H", { x: h_arcRadius + 0.15, y: h_arcY, z: 0 }));
    }

    _buildFullSpaceOutlineObject() {
        console.log('HSLColorSpace: Building full space outline with tubes (double cone)');
        const edges = [];
        const outlineRadius = 0.5; // Radius of the central ring at L=0.5
        const centralRingY = 0.5;  // Y-coordinate of the central ring
        const numSegments = 16;    // Number of segments for the central ring and cone generators

        const bottomTip = new THREE.Vector3(0, 0, 0);
        const topTip = new THREE.Vector3(0, 1, 0);

        const centralRingPoints = [];
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * Math.PI * 2;
            const x = outlineRadius * Math.cos(angle);
            const z = outlineRadius * Math.sin(angle);
            centralRingPoints.push(new THREE.Vector3(x, centralRingY, z));
        }

        // Edges for the central ring
        for (let i = 0; i < numSegments; i++) {
            edges.push({ start: centralRingPoints[i], end: centralRingPoints[(i + 1) % numSegments] });
        }

        // Edges connecting central ring to bottom tip and top tip
        for (let i = 0; i < numSegments; i++) {
            edges.push({ start: centralRingPoints[i], end: bottomTip });
            edges.push({ start: centralRingPoints[i], end: topTip });
        }

        const tubeGeometry = createTubesFromEdges(edges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS);

        if (!tubeGeometry) {
            console.warn('HSLColorSpace: Tube geometry for outline could not be created.');
            const group = new THREE.Group();
            group.name = "hslFullSpaceOutline";
            return group; // Return an empty group
        }

        const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const outlineObject = new THREE.Mesh(tubeGeometry, tubeMaterial);
        outlineObject.name = "hslFullSpaceOutline";
        return outlineObject;
    }

    _updateSubSpaceVolume(limits) {
        console.log(`Updating HSL SubSpace Volume with limits:`, limits);

        // Remove previous subspace volume if it exists
        const existingVolumeGroup = this.currentVisuals.getObjectByName('subspaceVolume');
        if (existingVolumeGroup) {
            // Properly dispose of geometries and materials of children
            existingVolumeGroup.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
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
        const heightSegments = 16;  // Increased for smoother surface

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

        // Bottom Cone: Tip at Y_world=0, Base at Y_world=0.5.
        // ConeGeometry(radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
        // Default orientation: base on XY plane at Y=0, tip at Y=height.
        // We need its tip at local (0,0,0) and base at local (0, heightCone, 0) for the shader's L calculation.
        const bottomConeGeometry = new THREE.ConeGeometry(radius, heightCone, radialSegments, heightSegments, false /*not openEnded*/);
        // Default Cone: Base at local Y=0, Tip at local Y=heightCone. Points UP.
        const bottomCone = new THREE.Mesh(bottomConeGeometry, shaderMaterial);
        bottomCone.rotation.x = Math.PI; // Point DOWN. Original base is now top (flat), original tip is bottom (pointy).
        // Position so its (new) tip is at Y_world=0 and (new) base is at Y_world=heightCone (0.5).
        bottomCone.position.set(0, heightCone, 0);
        volumeMeshGroup.add(bottomCone);

        // Top Cone: Tip at Y_world=1, Base at Y_world=0.5.
        // Local space: tip at (0,0,0), base at (0,heightCone,0)
        const topConeGeometry = new THREE.ConeGeometry(radius, heightCone, radialSegments, heightSegments, false /*not openEnded*/);
        // Default Cone: Base at local Y=0, Tip at local Y=heightCone. Points UP.
        const topCone = new THREE.Mesh(topConeGeometry, shaderMaterial); // Share the same material instance
        // No rotation needed, it should point UP.
        // Position so its base is at Y_world=heightCone (0.5) and tip is at Y_world=1.0.
        topCone.position.set(0, heightCone, 0);
        volumeMeshGroup.add(topCone);

        this.currentVisuals.add(volumeMeshGroup);
    }
}
