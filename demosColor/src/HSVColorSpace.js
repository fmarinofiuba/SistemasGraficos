import * as THREE from 'three';
import { ColorSpace } from './ColorSpace.js';
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

        // Value Axis (Y)
        const v_points = [];
        v_points.push(new THREE.Vector3(0, 0, 0));
        v_points.push(new THREE.Vector3(0, 1, 0));
        const v_geometry = new THREE.BufferGeometry().setFromPoints(v_points);
        const v_axisLine = new THREE.Line(v_geometry, V_axisMaterial);
        this.currentVisuals.add(v_axisLine);
        this.currentVisuals.add(this.makeTextSprite('V', new THREE.Vector3(0, 1.1, 0)));

        // Saturation Axis (e.g., along X for visualization)
        const s_points = [];
        s_points.push(new THREE.Vector3(0, 0, 0)); // Assuming V=0, S can be represented at this plane
        s_points.push(new THREE.Vector3(1, 0, 0)); 
        const s_geometry = new THREE.BufferGeometry().setFromPoints(s_points);
        const s_axisLine = new THREE.Line(s_geometry, S_axisMaterial);
        this.currentVisuals.add(s_axisLine);
        this.currentVisuals.add(this.makeTextSprite('S', new THREE.Vector3(1.1, 0, 0)));

        // Hue is represented by the circumference, label 'H' can be placed near it.
        this.currentVisuals.add(this.makeTextSprite('H', new THREE.Vector3(0.7, 0.7, 0.7))); // Arbitrary position for H

        console.log('HSV Axes and Labels built');
    }

    _buildFullSpaceOutlineObject() {
        // Outline of a cylinder: Radius 1, Height 1. Positioned to sit on XZ plane.
        const radius = 1;
        const height = 1;
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true); // openEnded = true
        cylinderGeometry.translate(0, height / 2, 0); // Move base to y=0

        const edges = new THREE.EdgesGeometry(cylinderGeometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 })); // Linewidth might not work on all systems
        line.name = "fullSpaceOutline_HSV";
        console.log('HSV Full Space Outline built');
        return line;
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
                hMin: { value: limits.hMin },
                hMax: { value: limits.hMax },
                sMin: { value: limits.sMin },
                sMax: { value: limits.sMax },
                vMin: { value: limits.vMin },
                vMax: { value: limits.vMax },
            },
            side: THREE.DoubleSide,
            transparent: true, // if opacity < 1 in gl_FragColor
        });

        // Geometry for the subspace volume: a cylinder segment
        // Radius is sMax, height is vMax-vMin, angle is hMax-hMin
        // ThetaStart is hMin. Cylinder is built around Y axis.
        const radius = limits.sMax;
        const height = limits.vMax - limits.vMin;
        const thetaStartRad = THREE.MathUtils.degToRad(limits.hMin);
        const thetaLengthRad = THREE.MathUtils.degToRad(limits.hMax - limits.hMin);

        if (height <= 0 || radius <= 0 || thetaLengthRad <= 0) {
            console.log('HSV subspace volume is zero or invalid, not rendering.');
            return; // Avoid creating empty geometry
        }

        const subSpaceGeometry = new THREE.CylinderGeometry(
            radius,         // radiusTop
            radius,         // radiusBottom
            height,         // height
            64,             // radialSegments (more for smoother curve)
            8,              // heightSegments
            false,          // openEnded
            thetaStartRad,  // thetaStart
            thetaLengthRad  // thetaLength
        );
        // The geometry's local Y goes from -height/2 to +height/2.
        // We need its local Y to correspond to V values from vMin to vMax.
        // So, translate it up by vMin + height/2.
        subSpaceGeometry.translate(0, limits.vMin + height / 2, 0);

        const subSpaceMesh = new THREE.Mesh(subSpaceGeometry, hsvShaderMaterial);
        subSpaceMesh.name = 'subspaceVolume';
        this.currentVisuals.add(subSpaceMesh);
        console.log('HSV SubSpace Volume updated/created.');
    }
}
