import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
import cmyVertexShader from './shaders/cmy/cmyVertex.glsl';
import cmyFragmentShader from './shaders/cmy/cmyFragment.glsl';

export class CMYColorSpace extends ColorSpace {
    constructor(scene) {
        super(scene);
        this.modelType = 'CMY';
    }

    _buildAxesAndLabels() {
        console.log('CMYColorSpace: Building axes and labels');
        const axisLength = 1.2;
        const C_axisMaterial = new THREE.LineBasicMaterial({ color: 0x00FFFF }); // Cyan
        const M_axisMaterial = new THREE.LineBasicMaterial({ color: 0xFF00FF }); // Magenta
        const Y_axisMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00 }); // Yellow

        const pointsC = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)];
        const pointsM = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)];
        const pointsY = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)];

        const C_geometry = new THREE.BufferGeometry().setFromPoints(pointsC);
        const M_geometry = new THREE.BufferGeometry().setFromPoints(pointsM);
        const Y_geometry = new THREE.BufferGeometry().setFromPoints(pointsY);

        const C_axis = new THREE.Line(C_geometry, C_axisMaterial);
        const M_axis = new THREE.Line(M_geometry, M_axisMaterial);
        const Y_axis = new THREE.Line(Y_geometry, Y_axisMaterial);

        this.currentVisuals.add(C_axis, M_axis, Y_axis);

        // Labels
        this.currentVisuals.add(this.makeTextSprite("C", { x: axisLength + 0.1, y: 0, z: 0 }));
        this.currentVisuals.add(this.makeTextSprite("M", { x: 0, y: axisLength + 0.1, z: 0 }));
        this.currentVisuals.add(this.makeTextSprite("Y", { x: 0, y: 0, z: axisLength + 0.1 }));
    }

    _buildFullSpaceOutlineObject() {
        console.log('CMYColorSpace: Building full space outline');
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff }); // White outline
        const outlineObject = new THREE.LineSegments(edges, material);
        outlineObject.position.set(0.5, 0.5, 0.5); // Center the 1x1x1 cube
        return outlineObject;
    }

    _updateSubSpaceVolume(limits) {
        console.log('CMYColorSpace: Updating subspace volume with limits:', limits);
        let currentLimits = limits;
        if (!currentLimits || typeof currentLimits.cMin === 'undefined') {
            console.warn('CMY limits not fully defined for subspace volume. Using defaults.');
            currentLimits = { cMin: 0, cMax: 1, mMin: 0, mMax: 1, yMin: 0, yMax: 1, ...currentLimits }; 
        }

        const width = currentLimits.cMax - currentLimits.cMin;
        const height = currentLimits.mMax - currentLimits.mMin;
        const depth = currentLimits.yMax - currentLimits.yMin;

        if (width <= 0 || height <= 0 || depth <= 0) {
            console.log('CMY Subspace volume has zero or negative dimension, not rendering.');
            return;
        }

        const subBoxGeo = new THREE.BoxGeometry(width, height, depth);
        subBoxGeo.translate(currentLimits.cMin + width / 2, currentLimits.mMin + height / 2, currentLimits.yMin + depth / 2);

        const cmyShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: cmyVertexShader,
            fragmentShader: cmyFragmentShader,
            uniforms: {
                u_cMin: { value: currentLimits.cMin }, u_cMax: { value: currentLimits.cMax },
                u_mMin: { value: currentLimits.mMin }, u_mMax: { value: currentLimits.mMax },
                u_yMin: { value: currentLimits.yMin }, u_yMax: { value: currentLimits.yMax },
            },
            vertexShader: cmyVertexShader,
            fragmentShader: cmyFragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const subBoxMeshCMY = new THREE.Mesh(subBoxGeo, cmyShaderMaterial);
        subBoxMeshCMY.name = 'subspaceVolume';
        this.currentVisuals.add(subBoxMeshCMY);
    }
}
