// src/UIManager.js
import GUI from 'lil-gui';

export class UIManager {
    constructor(sceneManager, colorSpace) {
        this.sceneManager = sceneManager;
        this.colorSpace = colorSpace;
        this.gui = new GUI();
        this.limits = {
            // RGB
            rMin: 0, rMax: 1,
            gMin: 0, gMax: 1,
            bMin: 0, bMax: 1,
            // CMY
            cMin: 0, cMax: 1,
            mMin: 0, mMax: 1,
            yMin: 0, yMax: 1,
            // HSV
            hMin: 0, hMax: 360,
            sMin: 0, sMax: 1,
            vMin: 0, vMax: 1,
            // HSL
            hMinHSL: 0, hMaxHSL: 360, // Renamed to avoid conflict with HSV hMin/hMax in the limits object
            sMinHSL: 0, sMaxHSL: 1,
            lMin: 0, lMax: 1,
        };
        this.currentModel = 'RGB'; // Default model

        this.initUI();
    }

    initUI() {
        // UI elements will be initialized here
        this.rgbFolder = null;
        this.cmyFolder = null;
        this.hsvFolder = null;
        this.hslFolder = null;

        this.setupModelSelector();
        this.setupLimitsControls();
        this.setupCommandButtons();

        this.updateLimitsFolderVisibility(); // Show RGB by default
        console.log('UIManager UI initialized');
    }

    setupModelSelector() {
        const modelOptions = { 'RGB': 'RGB', 'CMY': 'CMY', 'HSV': 'HSV', 'HSL': 'HSL' };
        this.gui.add(this, 'currentModel', modelOptions).name('Modelo de Color').onChange(model => {
            console.log('Modelo cambiado a:', model);
            this.sceneManager.setModel(model);
            this.resetLimitsToDefault(model); // Reset sliders to full range for the new model
            this.updateLimitsFolderVisibility();
            // Trigger a redraw with new model and full limits
            this.notifySubspaceChange(); 
        });
    }

    setupLimitsControls() {
        const limitsFolder = this.gui.addFolder('Límites');

        // RGB Sliders
        this.rgbFolder = limitsFolder.addFolder('RGB');
        this.rgbFolder.add(this.limits, 'rMin', 0, 1, 0.01).name('R Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.rgbFolder.add(this.limits, 'rMax', 0, 1, 0.01).name('R Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.rgbFolder.add(this.limits, 'gMin', 0, 1, 0.01).name('G Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.rgbFolder.add(this.limits, 'gMax', 0, 1, 0.01).name('G Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.rgbFolder.add(this.limits, 'bMin', 0, 1, 0.01).name('B Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.rgbFolder.add(this.limits, 'bMax', 0, 1, 0.01).name('B Max').onChange(() => this.notifySubspaceChangeWithDebounce());

        // CMY Sliders (initially hidden)
        this.cmyFolder = limitsFolder.addFolder('CMY');
        this.cmyFolder.add(this.limits, 'cMin', 0, 1, 0.01).name('C Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.cmyFolder.add(this.limits, 'cMax', 0, 1, 0.01).name('C Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.cmyFolder.add(this.limits, 'mMin', 0, 1, 0.01).name('M Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.cmyFolder.add(this.limits, 'mMax', 0, 1, 0.01).name('M Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.cmyFolder.add(this.limits, 'yMin', 0, 1, 0.01).name('Y Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.cmyFolder.add(this.limits, 'yMax', 0, 1, 0.01).name('Y Max').onChange(() => this.notifySubspaceChangeWithDebounce());

        // HSV Sliders (initially hidden)
        this.hsvFolder = limitsFolder.addFolder('HSV');
        this.hsvFolder.add(this.limits, 'hMin', 0, 360, 1).name('H Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hsvFolder.add(this.limits, 'hMax', 0, 360, 1).name('H Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hsvFolder.add(this.limits, 'sMin', 0, 1, 0.01).name('S Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hsvFolder.add(this.limits, 'sMax', 0, 1, 0.01).name('S Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hsvFolder.add(this.limits, 'vMin', 0, 1, 0.01).name('V Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hsvFolder.add(this.limits, 'vMax', 0, 1, 0.01).name('V Max').onChange(() => this.notifySubspaceChangeWithDebounce());

        // HSL Sliders (initially hidden)
        this.hslFolder = limitsFolder.addFolder('HSL');
        this.hslFolder.add(this.limits, 'hMinHSL', 0, 360, 1).name('H Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hslFolder.add(this.limits, 'hMaxHSL', 0, 360, 1).name('H Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hslFolder.add(this.limits, 'sMinHSL', 0, 1, 0.01).name('S Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hslFolder.add(this.limits, 'sMaxHSL', 0, 1, 0.01).name('S Max').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hslFolder.add(this.limits, 'lMin', 0, 1, 0.01).name('L Min').onChange(() => this.notifySubspaceChangeWithDebounce());
        this.hslFolder.add(this.limits, 'lMax', 0, 1, 0.01).name('L Max').onChange(() => this.notifySubspaceChangeWithDebounce());
    }

    updateLimitsFolderVisibility() {
        this.rgbFolder.domElement.style.display = this.currentModel === 'RGB' ? '' : 'none';
        this.cmyFolder.domElement.style.display = this.currentModel === 'CMY' ? '' : 'none';
        this.hsvFolder.domElement.style.display = this.currentModel === 'HSV' ? '' : 'none';
        this.hslFolder.domElement.style.display = this.currentModel === 'HSL' ? '' : 'none';
    }

    setupCommandButtons() {
        const commandsFolder = this.gui.addFolder('Comandos');
        commandsFolder.add(this, 'resetCurrentLimits').name('Reset Límites');
        commandsFolder.add(this.sceneManager, 'fitCameraToCurrentSpace').name('Ajustar Vista');
    }

    resetLimitsToDefault(model) {
        const defaults = {
            RGB: { rMin: 0, rMax: 1, gMin: 0, gMax: 1, bMin: 0, bMax: 1 },
            CMY: { cMin: 0, cMax: 1, mMin: 0, mMax: 1, yMin: 0, yMax: 1 },
            HSV: { hMin: 0, hMax: 360, sMin: 0, sMax: 1, vMin: 0, vMax: 1 },
            HSL: { hMinHSL: 0, hMaxHSL: 360, sMinHSL: 0, sMaxHSL: 1, lMin: 0, lMax: 1 }
        };
        if (defaults[model]) {
            for (const key in defaults[model]) {
                this.limits[key] = defaults[model][key];
            }
        }
        // Refresh GUI to show new values
        this.gui.controllersRecursive().forEach(controller => controller.updateDisplay());
    }

    resetCurrentLimits() {
        this.resetLimitsToDefault(this.currentModel);
        this.notifySubspaceChange(); // Update visuals after reset
    }

    getCurrentLimits() {
        // Returns an object with only the limits relevant to the current model
        let currentLimits = {};
        switch (this.currentModel) {
            case 'RGB':
                currentLimits = { rMin: this.limits.rMin, rMax: this.limits.rMax, gMin: this.limits.gMin, gMax: this.limits.gMax, bMin: this.limits.bMin, bMax: this.limits.bMax };
                break;
            case 'CMY':
                currentLimits = { cMin: this.limits.cMin, cMax: this.limits.cMax, mMin: this.limits.mMin, mMax: this.limits.mMax, yMin: this.limits.yMin, yMax: this.limits.yMax };
                break;
            case 'HSV':
                currentLimits = { hMin: this.limits.hMin, hMax: this.limits.hMax, sMin: this.limits.sMin, sMax: this.limits.sMax, vMin: this.limits.vMin, vMax: this.limits.vMax };
                break;
            case 'HSL':
                currentLimits = { hMin: this.limits.hMinHSL, hMax: this.limits.hMaxHSL, sMin: this.limits.sMinHSL, sMax: this.limits.sMaxHSL, lMin: this.limits.lMin, lMax: this.limits.lMax }; // Note: HSL uses hMinHSL etc.
                break;
        }
        return currentLimits;
    }

    notifySubspaceChange() {
        const limits = this.getCurrentLimits();
        this.sceneManager.updateColorSubspace(limits);
        // This will also trigger colorSpace.displaySpace indirectly if model changed, or updateSubSpaceVolume directly
        this.colorSpace.displaySpace(this.currentModel, limits); // Ensure the displaySpace is called with the correct, filtered limits

    }

    // Debounce implementation
    debounceTimeout = null;
    notifySubspaceChangeWithDebounce() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.notifySubspaceChange();
        }, 500); // 500ms debounce
    }
}
