import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';

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
        console.log('RGBColorSpace: Building full space outline');
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const outlineObject = new THREE.LineSegments(edges, material);
        outlineObject.position.set(0.5, 0.5, 0.5); // Center the 1x1x1 cube
        return outlineObject;
    }

    _updateSubSpaceVolume(limits) {
        console.log('RGBColorSpace: Updating subspace volume with limits:', limits);
        let currentLimits = limits;
        if (!currentLimits || typeof currentLimits.rMin === 'undefined') {
            console.warn('RGB limits not fully defined for subspace volume. Using defaults.');
            currentLimits = { rMin: 0, rMax: 1, gMin: 0, gMax: 1, bMin: 0, bMax: 1, ...currentLimits }; 
        }

        const width = currentLimits.rMax - currentLimits.rMin;
        const height = currentLimits.gMax - currentLimits.gMin;
        const depth = currentLimits.bMax - currentLimits.bMin;

        if (width <= 0 || height <= 0 || depth <= 0) {
            console.log('RGB Subspace volume has zero or negative dimension, not rendering.');
            return;
        }

        const subBoxGeo = new THREE.BoxGeometry(width, height, depth);
        subBoxGeo.translate(currentLimits.rMin + width / 2, currentLimits.gMin + height / 2, currentLimits.bMin + depth / 2);

        const vertexShader = `
            varying vec3 vLocalPosition;
            void main() {
                vLocalPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vLocalPosition;
            uniform float u_rMin, u_rMax, u_gMin, u_gMax, u_bMin, u_bMax;

            void main() {
                float r = (vLocalPosition.x - u_rMin) / (u_rMax - u_rMin);
                float g = (vLocalPosition.y - u_gMin) / (u_gMax - u_gMin);
                float b = (vLocalPosition.z - u_bMin) / (u_bMax - u_bMin);
                
                gl_FragColor = vec4(clamp(r,0.0,1.0), clamp(g,0.0,1.0), clamp(b,0.0,1.0), 1.0);
            }
        `;

        const rgbShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_rMin: { value: currentLimits.rMin }, u_rMax: { value: currentLimits.rMax },
                u_gMin: { value: currentLimits.gMin }, u_gMax: { value: currentLimits.gMax },
                u_bMin: { value: currentLimits.bMin }, u_bMax: { value: currentLimits.bMax },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const subBoxMeshRGB = new THREE.Mesh(subBoxGeo, rgbShaderMaterial);
        subBoxMeshRGB.name = 'subspaceVolume'; // Name used by clearCurrentVisuals if needed for specific removal, though full clear is typical
        this.currentVisuals.add(subBoxMeshRGB);
    }
}
