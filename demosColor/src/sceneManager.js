import * as THREE from 'three';

export class SceneManager {
    constructor(scene, camera, renderer, controls) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.controls = controls; // OrbitControls instance

        this.colorSpace = null; // Will be set by main.js or UIManager
        this.uiManager = null;  // Will be set by main.js or UIManager

        this.currentModel = ''; // To keep track of the current color model

        // Scene setup is now minimal here, main.js handles basic lights.
        // ColorSpace will handle its specific visuals (axes, outlines, etc.)
        // const axes = new THREE.AxesHelper(1); // Optional: for dev, to see scene orientation
        // this.scene.add(axes);

        console.log('SceneManager initialized');
    }

    // Method to be called from main.js or UIManager to link instances
    setDependencies(colorSpace, uiManager) {
        this.colorSpace = colorSpace;
        this.uiManager = uiManager;
        console.log('SceneManager dependencies set.');
    }

    setModel(modelType) {
        console.log(`SceneManager: Setting model to ${modelType}`);
        this.currentModel = modelType;
        if (this.colorSpace) {
            // UIManager will provide the initial limits for the new model
            // For now, let's assume UIManager handles getting those limits
            // const initialLimits = this.uiManager.getInitialLimitsForModel(modelType);
            // this.colorSpace.displaySpace(modelType, initialLimits);
            console.log('SceneManager: Would call colorSpace.displaySpace() here.');
        } else {
            console.error('ColorSpace not set in SceneManager');
        }
        // Inform UIManager to update UI elements (e.g., reset sliders, visibility)
        // if (this.uiManager) {
        //     this.uiManager.onModelChanged(modelType);
        // }
    }

    updateColorSubspace(limits) {
        console.log('SceneManager: Updating color subspace with limits:', limits);
        if (this.colorSpace && this.currentModel) {
            this.colorSpace.updateSubSpaceVolume(this.currentModel, limits);
        } else {
            console.error('ColorSpace or currentModel not set in SceneManager');
        }
    }

    fitCameraToCurrentSpace() {
        console.log('SceneManager: Adjusting camera to fit current space');
        if (this.colorSpace) {
            const boundingBox = this.colorSpace.getCurrentSpaceBoundingBox();
            if (boundingBox) {
                const center = new THREE.Vector3();
                boundingBox.getCenter(center);

                const size = new THREE.Vector3();
                boundingBox.getSize(size);

                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = this.camera.fov * (Math.PI / 180);
                let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                
                // Add some padding so the object isn't edge-to-edge
                distance *= 2.5; // Increased multiplier for more distance 

                // Position the camera along the (1,1,1) vector from the center
                const offsetDirection = new THREE.Vector3(1, 1, 1).normalize();
                this.camera.position.copy(center).addScaledVector(offsetDirection, distance);
                this.controls.target.copy(center);
                this.controls.update();
                this.camera.lookAt(center);
                this.camera.updateProjectionMatrix();
                console.log('SceneManager: Camera adjusted.');
            } else {
                console.error('Could not get bounding box from ColorSpace.');
            }
        } else {
            console.error('ColorSpace not set in SceneManager for fitCameraToCurrentSpace.');
        }
    }

    animate() {
        // This method can be used for animations managed by SceneManager itself.
        // For now, it's empty as OrbitControls.update() is in main.js's animate loop.
    }
}

