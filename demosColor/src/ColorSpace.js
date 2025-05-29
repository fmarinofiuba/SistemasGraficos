import * as THREE from 'three';

export class ColorSpace {
	constructor(scene) {
		this.scene = scene;
		this.currentVisuals = new THREE.Group();
		this.scene.add(this.currentVisuals);
		this.fullSpaceOutlineObject = null;
		this.modelType = ''; // To be set by subclass or SceneManager
	}

	// Main method to be called by SceneManager to render the space
	display(limits) {
		this.clearCurrentVisuals();
		console.log(`Displaying space for ${this.constructor.name} with limits:`, limits);

		this._buildAxesAndLabels();
		this.fullSpaceOutlineObject = this._buildFullSpaceOutlineObject();
		if (this.fullSpaceOutlineObject) {
			this.currentVisuals.add(this.fullSpaceOutlineObject);
		}
		this._updateSubSpaceVolume(limits);
	}

	// New method specifically for slider changes to update only the sub-volume
	refreshSubSpaceVolume(limits) {
		// Remove only the previous subspace volume
		const existingSubspace = this.currentVisuals.getObjectByName('subspaceVolume');
		if (existingSubspace) {
			this.currentVisuals.remove(existingSubspace);
			if (existingSubspace.geometry) existingSubspace.geometry.dispose();
			if (existingSubspace.material) {
				// Check for uniforms that might hold disposable resources (like textures in some shaders)
				if (existingSubspace.material.uniforms) {
					for (const key in existingSubspace.material.uniforms) {
						const uniform = existingSubspace.material.uniforms[key];
						if (uniform.value && typeof uniform.value.dispose === 'function') {
							uniform.value.dispose();
						}
					}
				}
				existingSubspace.material.dispose();
			}
		}
		// Call the subclass's implementation to create and add the new one
		this._updateSubSpaceVolume(limits);
	}

	clearCurrentVisuals() {
		while (this.currentVisuals.children.length > 0) {
			const child = this.currentVisuals.children[0];
			this.currentVisuals.remove(child);
			if (child.geometry) child.geometry.dispose();
			if (child.material) {
				if (Array.isArray(child.material)) {
					child.material.forEach((material) => material.dispose());
				} else {
					child.material.dispose();
				}
			}
		}
		// console.log('Cleared current visuals for', this.constructor.name);
	}

	// Methods to be implemented by subclasses
	_buildAxesAndLabels() {
		throw new Error("Method '_buildAxesAndLabels()' must be implemented by subclass.");
	}

	_buildFullSpaceOutlineObject() {
		throw new Error("Method '_buildFullSpaceOutlineObject()' must be implemented by subclass.");
	}

	_updateSubSpaceVolume(limits) {
		throw new Error("Method '_updateSubSpaceVolume()' must be implemented by subclass.");
	}

	// Utility method, can remain in base class or be moved to a utility file
	makeTextSprite(message, position) {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		const fontSize = 25;
		context.font = `Bold ${fontSize}px Arial`;
		const textWidth = context.measureText(message).width;

		canvas.width = textWidth;
		canvas.height = fontSize;
		context.font = `Bold ${fontSize}px Arial`;
		context.fillStyle = 'rgba(255, 255, 255, 1.0)';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(message, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
		const sprite = new THREE.Sprite(spriteMaterial);
		const desiredHeightInWorldUnits = 0.1;
		sprite.scale.set(desiredHeightInWorldUnits * (canvas.width / canvas.height), desiredHeightInWorldUnits, 1.0);
		sprite.position.set(position.x, position.y, position.z);
		return sprite;
	}

	getCurrentSpaceBoundingBox() {
		if (this.fullSpaceOutlineObject && this.fullSpaceOutlineObject.geometry) {
			this.fullSpaceOutlineObject.geometry.computeBoundingBox();
			return this.fullSpaceOutlineObject.geometry.boundingBox;
		}
		console.warn(
			'getCurrentSpaceBoundingBox called but fullSpaceOutlineObject or its geometry is null/undefined for',
			this.constructor.name
		);
		return new THREE.Box3(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
	}

	// Call this when the instance is no longer needed to clean up Three.js resources from the scene
	dispose() {
		this.clearCurrentVisuals();
		this.scene.remove(this.currentVisuals);
		// Any other specific disposals for the base class if necessary
		console.log(`${this.constructor.name} disposed.`);
	}
	// or they will be part of shader materials.
}
