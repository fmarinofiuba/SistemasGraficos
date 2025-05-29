// src/ColorSpace.js
import * as THREE from 'three';

export class ColorSpace {
    constructor(scene) {
        this.scene = scene;
        this.currentVisuals = new THREE.Group(); // Group to hold all visuals for a color space
        this.scene.add(this.currentVisuals);
        this.fullSpaceOutlineObject = null; // To store the current full space outline mesh for BBox calculation
    }

    displaySpace(modelType, limits) {
        this.clearCurrentVisuals();
        console.log(`Displaying space for ${modelType} with limits:`, limits);

        this.buildAxesAndLabels(modelType);
        this.fullSpaceOutlineObject = this.buildFullSpaceOutline(modelType); // Store the outline object
        if (this.fullSpaceOutlineObject) {
            this.currentVisuals.add(this.fullSpaceOutlineObject);
        }
        this.updateSubSpaceVolume(modelType, limits);
    }

    clearCurrentVisuals() {
        while (this.currentVisuals.children.length > 0) {
            const child = this.currentVisuals.children[0];
            this.currentVisuals.remove(child);
            // Dispose geometry and material if necessary
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        console.log('Cleared current visuals');
    }

    buildAxesAndLabels(modelType) {
        console.log(`Building axes and labels for ${modelType}`);
        if (modelType === 'RGB') {
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
        // Add cases for CMY, HSV, HSL later
    }

    makeTextSprite(message, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 25;
        context.font = `Bold ${fontSize}px Arial`;
        const textWidth = context.measureText(message).width;

        canvas.width = textWidth;
        canvas.height = fontSize;
        // Refill font settings after canvas resize
        context.font = `Bold ${fontSize}px Arial`;
        context.fillStyle = "rgba(255, 255, 255, 1.0)";
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(message, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMaterial);
        // Scale down to 20% of original attempt, and keep aspect ratio based on canvas dimensions
        const scaleFactor = 0.1; // Was 0.5, now 20% of that for X. Let Y scale proportionally.
        // To maintain aspect ratio, scale Y relative to X based on canvas aspect ratio
        const aspectRatio = canvas.height / canvas.width;
        sprite.scale.set(scaleFactor, scaleFactor * aspectRatio * (canvas.width/fontSize), 1.0); // Corrected aspect ratio scaling
        // The (canvas.width/fontSize) is a heuristic to compensate for typical font width to height ratios.
        // A more robust way would be to set sprite.scale.x and then sprite.scale.y = sprite.scale.x * (canvas.height / canvas.width)
        // Let's simplify and use a fixed smaller scale and ensure x and y are similar if text is roughly square.
        // For single characters, width and height of the character itself are somewhat similar.
        const finalScale = 0.1; // Significantly smaller
        sprite.scale.set(finalScale, finalScale * (canvas.height / canvas.width) * 2, 1.0); // Make Y scale relative to X and canvas aspect. Factor 2 is empirical.
        // Let's try a simpler approach: make the sprite itself have a certain world unit size.
        // If we want the text to be roughly 0.1 world units high:
        const desiredHeightInWorldUnits = 0.1;
        sprite.scale.set(desiredHeightInWorldUnits * (canvas.width / canvas.height), desiredHeightInWorldUnits, 1.0);

        sprite.position.set(position.x, position.y, position.z);
        return sprite;
    }

    buildFullSpaceOutline(modelType) {
        console.log(`Building full space outline for ${modelType}`);
        let outlineObject = null;
        if (modelType === 'RGB') {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const edges = new THREE.EdgesGeometry(geometry);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            outlineObject = new THREE.LineSegments(edges, material);
            outlineObject.position.set(0.5, 0.5, 0.5); // Center the 1x1x1 cube around (0.5,0.5,0.5) if origin is (0,0,0)
        }
        // Add cases for CMY, HSV, HSL later
        return outlineObject;
    }

    updateSubSpaceVolume(modelType, limits) {
        console.log(`Updating subspace volume for ${modelType} with limits:`, limits);
        // Remove previous subspace volume if it exists
        const existingSubspace = this.currentVisuals.getObjectByName('subspaceVolume');
        if (existingSubspace) {
            this.currentVisuals.remove(existingSubspace);
            if (existingSubspace.geometry) existingSubspace.geometry.dispose();
            if (existingSubspace.material) {
                if (existingSubspace.material.uniforms && existingSubspace.material.uniforms.tDiffuse) {
                    existingSubspace.material.uniforms.tDiffuse.value.dispose();
                }
                existingSubspace.material.dispose();
            }
        }

        if (modelType === 'RGB') {
            if (!limits || typeof limits.rMin === 'undefined') {
                console.warn('RGB limits not fully defined for subspace volume. Using defaults.');
                limits = { rMin: 0, rMax: 1, gMin: 0, gMax: 1, bMin: 0, bMax: 1, ...limits }; 
            }

            const width = limits.rMax - limits.rMin;
            const height = limits.gMax - limits.gMin;
            const depth = limits.bMax - limits.bMin;

            if (width <= 0 || height <= 0 || depth <= 0) {
                console.log('Subspace volume has zero or negative dimension, not rendering.');
                return;
            }

            const subBoxGeo = new THREE.BoxGeometry(width, height, depth);
            // Position the geometry so its corner is at (rMin, gMin, bMin)
            subBoxGeo.translate(limits.rMin + width / 2, limits.gMin + height / 2, limits.bMin + depth / 2);

            const vertexShader = `
                varying vec3 vLocalPosition;
                void main() {
                    vLocalPosition = position; // Already in local coords relative to the sub-box's origin
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;

            const fragmentShader = `
                varying vec3 vLocalPosition;
                uniform float u_rMin, u_rMax, u_gMin, u_gMax, u_bMin, u_bMax;

                void main() {
                    // vLocalPosition is relative to the center of the BoxGeometry (width/2, height/2, depth/2)
                    // We need to map it back to the 0..1 range of the sub-box, then to the rMin..rMax range
                    
                    // The BoxGeometry is created with dimensions (width, height, depth)
                    // Its local coordinates range from -width/2 to +width/2, etc.
                    // The translation applied (limits.rMin + width/2, ...) means that a vertex at
                    // local position (-width/2, -height/2, -depth/2) corresponds to world (rMin, gMin, bMin)
                    // and (+width/2, +height/2, +depth/2) corresponds to world (rMax, gMax, bMax)
                    
                    // So, we can directly use the translated vLocalPosition as the color components
                    // if the geometry is defined from 0 to width, 0 to height, 0 to depth and then translated.
                    // However, BoxGeometry is centered at its local origin. 
                    // The translation puts the point (0,0,0) of the geometry at (rMin + width/2, ...)
                    // A vertex at local (-width/2, -height/2, -depth/2) becomes (rMin, gMin, bMin) in world space.
                    // A vertex at local (width/2, height/2, depth/2) becomes (rMax, gMax, bMax) in world space.

                    // Let's use the uniforms to define the color based on the world position passed through vLocalPosition
                    // after the BoxGeometry's translate().
                    // vLocalPosition here IS the world position of the fragment within the sub-box's bounds.
                    float r = (vLocalPosition.x - u_rMin) / (u_rMax - u_rMin);
                    float g = (vLocalPosition.y - u_gMin) / (u_gMax - u_gMin);
                    float b = (vLocalPosition.z - u_bMin) / (u_bMax - u_bMin);
                    
                    // Clamp to ensure valid colors, though geometry should be within these bounds.
                    gl_FragColor = vec4(clamp(r,0.0,1.0), clamp(g,0.0,1.0), clamp(b,0.0,1.0), 1.0);
                }
            `;

            const subBoxMat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    u_rMin: { value: limits.rMin },
                    u_rMax: { value: limits.rMax },
                    u_gMin: { value: limits.gMin },
                    u_gMax: { value: limits.gMax },
                    u_bMin: { value: limits.bMin },
                    u_bMax: { value: limits.bMax },
                },
                side: THREE.DoubleSide, // Render both sides
                // transparent: true, // If opacity is needed
            });

            const subBoxMesh = new THREE.Mesh(subBoxGeo, subBoxMat);
            subBoxMesh.name = 'subspaceVolume';
            this.currentVisuals.add(subBoxMesh);
        }
        // Add cases for CMY, HSV, HSL later
    }

    getCurrentSpaceBoundingBox() {
        if (this.fullSpaceOutlineObject) {
            // Ensure matrix world is up to date for accurate bounding box calculation
            this.fullSpaceOutlineObject.updateMatrixWorld(true);
            const bbox = new THREE.Box3().setFromObject(this.fullSpaceOutlineObject);
            console.log('getCurrentSpaceBoundingBox from outline object:', bbox);
            return bbox;
        } else {
            console.warn('Full space outline object not available for bounding box. Returning default.');
            // Default for a 1x1x1 cube centered at 0.5,0.5,0.5
            return new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
        }
    }

    // Add hsvToRgb and hslToRgb GLSL utility functions later if needed directly here
    // or they will be part of shader materials.
}
