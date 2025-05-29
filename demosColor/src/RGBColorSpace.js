import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import { createTubesFromEdges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS } from './GeometryUtils.js';
import rgbVertexShader from './shaders/rgb/rgbVertex.glsl';
import rgbFragmentShader from './shaders/rgb/rgbFragment.glsl';

export class RGBColorSpace extends ColorSpace {
    constructor(scene) {
        super(scene);
        this.modelType = 'RGB'; // For logging or specific checks if needed
    }

    _buildAxesAndLabels() {
        console.log('RGBColorSpace: Building axes and labels');
        const axisLength = 1.2;
        const R_axisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const G_axisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const B_axisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

        const pointsR = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)];
        const pointsG = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)];
        const pointsB = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)];

        const R_geometry = new THREE.BufferGeometry().setFromPoints(pointsR);
        const G_geometry = new THREE.BufferGeometry().setFromPoints(pointsG);
        const B_geometry = new THREE.BufferGeometry().setFromPoints(pointsB);

        const R_axis = new THREE.Line(R_geometry, R_axisMaterial);
        const G_axis = new THREE.Line(G_geometry, G_axisMaterial);
        const B_axis = new THREE.Line(B_geometry, B_axisMaterial);

        this.currentVisuals.add(R_axis, G_axis, B_axis);

        // Labels
        this.currentVisuals.add(this.makeTextSprite("R", { x: axisLength + 0.1, y: 0, z: 0 }));
        this.currentVisuals.add(this.makeTextSprite("G", { x: 0, y: axisLength + 0.1, z: 0 }));
        this.currentVisuals.add(this.makeTextSprite("B", { x: 0, y: 0, z: axisLength + 0.1 }));
    }

    _buildFullSpaceOutlineObject() {
        console.log('RGBColorSpace: Building full space outline with tubes');

        const s = 1.0; // Size of the cube
        const offset = 0.0; // Assuming cube starts at origin (0,0,0) to (1,1,1)

        // Define the 8 vertices of the cube
        const v = [
            new THREE.Vector3(offset, offset, offset),       // V0: 0,0,0
            new THREE.Vector3(offset + s, offset, offset),   // V1: 1,0,0
            new THREE.Vector3(offset + s, offset + s, offset), // V2: 1,1,0
            new THREE.Vector3(offset, offset + s, offset),   // V3: 0,1,0
            new THREE.Vector3(offset, offset, offset + s),   // V4: 0,0,1
            new THREE.Vector3(offset + s, offset, offset + s), // V5: 1,0,1
            new THREE.Vector3(offset + s, offset + s, offset + s), // V6: 1,1,1
            new THREE.Vector3(offset, offset + s, offset + s)    // V7: 0,1,1
        ];

        // Define the 12 edges of the cube
        const edges = [
            // Bottom face
            { start: v[0], end: v[1] }, { start: v[1], end: v[2] }, { start: v[2], end: v[3] }, { start: v[3], end: v[0] },
            // Top face
            { start: v[4], end: v[5] }, { start: v[5], end: v[6] }, { start: v[6], end: v[7] }, { start: v[7], end: v[4] },
            // Vertical edges
            { start: v[0], end: v[4] }, { start: v[1], end: v[5] }, { start: v[2], end: v[6] }, { start: v[3], end: v[7] }
        ];

        const tubeGeometry = createTubesFromEdges(edges, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS);

        if (!tubeGeometry) {
            console.warn('RGBColorSpace: Tube geometry for outline could not be created.');
            return new THREE.Group(); // Return an empty group or null
        }

        const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const outlineObject = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // The cube vertices are defined from 0 to 1. If you want the cube centered at (0.5,0.5,0.5) 
        // like the original BoxGeometry(1,1,1).translate(0.5,0.5,0.5), then all vertices
        // should be defined relative to that center, or the final mesh positioned.
        // Since our vertices are 0->1, the effective center is already (0.5,0.5,0.5) if s=1 and offset=0.
        // No additional translation needed for the mesh itself if vertices are defined this way.

        return outlineObject;
    }

    _updateSubSpaceVolume(limits) {
        console.log('RGBColorSpace: Updating subspace volume with limits:', limits);

        // Ensure limits and their nested properties exist, providing defaults if not
        const rMin = limits && limits.r && typeof limits.r.min === 'number' ? limits.r.min : 0;
        const rMax = limits && limits.r && typeof limits.r.max === 'number' ? limits.r.max : 1;
        const gMin = limits && limits.g && typeof limits.g.min === 'number' ? limits.g.min : 0;
        const gMax = limits && limits.g && typeof limits.g.max === 'number' ? limits.g.max : 1;
        const bMin = limits && limits.b && typeof limits.b.min === 'number' ? limits.b.min : 0;
        const bMax = limits && limits.b && typeof limits.b.max === 'number' ? limits.b.max : 1;

        if (!limits || !limits.r || !limits.g || !limits.b) {
            console.warn('RGB limits structure not fully defined. Using defaults for missing parts.');
        }

        const width = rMax - rMin;
        const height = gMax - gMin;
        const depth = bMax - bMin;

        if (width <= 0 || height <= 0 || depth <= 0) {
            console.log('RGB Subspace volume has zero or negative dimension, not rendering.');
            return;
        }

        const subBoxGeo = new THREE.BoxGeometry(width, height, depth);
        subBoxGeo.translate(rMin + width / 2, gMin + height / 2, bMin + depth / 2);

        const rgbShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: rgbVertexShader,
            fragmentShader: rgbFragmentShader,
            uniforms: {
                u_rMin: { value: rMin }, u_rMax: { value: rMax },
                u_gMin: { value: gMin }, u_gMax: { value: gMax },
                u_bMin: { value: bMin }, u_bMax: { value: bMax },
            },
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const subBoxMeshRGB = new THREE.Mesh(subBoxGeo, rgbShaderMaterial);
        subBoxMeshRGB.name = 'subspaceVolume'; // Name used by clearCurrentVisuals if needed for specific removal, though full clear is typical
        this.currentVisuals.add(subBoxMeshRGB);
    }
}
