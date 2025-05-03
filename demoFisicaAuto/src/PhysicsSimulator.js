import { RapierPhysics } from 'three/addons/physics/RapierPhysics.js';
import { RapierHelper } from 'three/addons/helpers/RapierHelper.js';
import * as THREE from 'three';
import { min, step } from 'three/tsl';


export const defaultVehicleParams = {
    wheelSeparation: 2.5, // distance between the wheels
    axesSeparation: 3, // distance between the front and rear wheels
    wheelRadius: 0.6,
    wheelWidth: 0.4,
    suspensionRestLength: 0.8,
    initialPosition:new THREE.Vector3(0,2,0), // initial position of the vehicle
    initialYRotation:0, // angle in radians
    steeringReaction:0.1, // how fast the steering reacts to input
    maxSteeringAngle: Math.PI / 16, // maximum steering angle in radians
    mass:10,
    accelerateForce:{
        min:-15,
        max:40,
        step:2,
    },
    brakeForce:{
        min:0,
        max:1,
        step:0.05,
    },
}

export const defaultGroundParams = {
    width: 1000,
    height: 1,
    length:1000,
}

export class PhysicsSimulator {

    params={}

    initComplete=false;
    physics = null;
    vehicleController = null;
    chassis = null;
    wheels = [];
    wheelPositions = [];
        
    vehicleState = {
        forward: 0,
        right: 0,
        brake: 0,
        reset: false,
        accelerateForce:0,
        brakeForce: 0,
    };

    constructor(vehicleParams={},groundParams={}) {
        this.params.vehicle = Object.assign(defaultVehicleParams, vehicleParams);
        this.params.ground = Object.assign(defaultGroundParams, groundParams);        

        const wheelSeparation = this.params.vehicle.wheelSeparation;
        const axesSeparation = this.params.vehicle.axesSeparation;

        this.wheelPositions = [
            { x: -wheelSeparation / 2, y: 0, z: -axesSeparation/2 },
            { x: wheelSeparation / 2, y: 0, z: -axesSeparation/2},
            { x: -wheelSeparation / 2, y: 0, z: axesSeparation/2},
            { x: wheelSeparation / 2, y: 0, z: axesSeparation/2},
        ];
    }   

    async initSimulation() {
        this.physics = await RapierPhysics();
        this.physics.world.gravity.set(0, -9.81, 0);

        const genericMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // check if this params.ground is defined and has the required properties
        let gr=this.params.ground;
        let w=gr?.width;
        let h=gr?.height;  
        let l=gr?.length;  

        if (!w || !h || !l) { throw Error('Invalid ground parameters'); }  
        // create ground plane
        let geo;
        
        geo = new THREE.BoxGeometry(gr.width, gr.height,gr.length);                
        const ground = new THREE.Mesh(geo, genericMaterial);        
        ground.userData.physics = { mass: 0 }; 
        
        this.physics.addMesh(ground);

        // create chassis
        geo = new THREE.BoxGeometry(2, 0.1, 4);
        
        const chasisMesh = new THREE.Mesh(geo, genericMaterial);
        chasisMesh.position.copy(this.params.vehicle.initialPosition); 
        chasisMesh.rotation.y = this.params.vehicle.initialYRotation;       
        this.physics.addMesh(chasisMesh, this.params.vehicle.mass, 0.8);
        this.chassis = chasisMesh.userData.physics.body;

        this.vehicleController = this.physics.world.createVehicleController(this.chassis);

        this.addWheels();
        this.setupEventListeners();
        this.initComplete = true;
    }

    addRigidBody(mesh, mass = 0, restitution = 0.8) {
        this.physics.addMesh(mesh, mass, restitution);
    }

    addWheels() {
        const { wheelSeparation, wheelRadius, wheelWidth, suspensionRestLength } = this.params.vehicle;

        this.wheelPositions.forEach((pos, index) => {
            const wheelDirection = { x: 0.0, y: -1.0, z: 0.0 };
            const wheelAxle = { x: -1.0, y: 0.0, z: 0.0 };

            this.vehicleController.addWheel(pos, wheelDirection, wheelAxle, suspensionRestLength, wheelRadius);
            this.vehicleController.setWheelSuspensionStiffness(index, 24.0);
            this.vehicleController.setWheelFrictionSlip(index, 1000.0);
            this.vehicleController.setWheelSteering(index, pos.z < 0);
        });
    }

    resetVehicle() {
        this.chassis.setTranslation(this.params.vehicle.initialPosition , true);

        // create quaternion for initialYRotation
        const alpha =this.params.vehicle.initialYRotation
        const axis = new THREE.Vector3(0, 1, 0); 
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, alpha);
         
        this.chassis.setRotation(quaternion, true);
        this.chassis.setLinvel(new this.physics.RAPIER.Vector3(0, 0, 0), true);
        this.chassis.setAngvel(new this.physics.RAPIER.Vector3(0, 0, 0), true);

        this.vehicleState.accelerateForce = 0;
        this.vehicleState.brakeForce= 0;
    }

    updateCarControl() {
        if (!this.initComplete) return; // Ensure the simulation is initialized

        // update car control
        if (this.vehicleState.reset) {
            this.resetVehicle();
            return;
        }

        // update accelerateForce
        const vp=this.params.vehicle;
        let accelerateForce = 0;

        if (this.vehicleState.forward > 0) {
            accelerateForce = this.vehicleState.accelerateForce + vp.accelerateForce.step;
            if (accelerateForce > vp.accelerateForce.max) accelerateForce = vp.accelerateForce.max;
            
        } else if (this.vehicleState.forward < 0) {
            accelerateForce = this.vehicleState.accelerateForce - vp.accelerateForce.step;
            if (accelerateForce < vp.accelerateForce.min) accelerateForce = vp.accelerateForce.min;
        }

        //console.log("accelerate force: ", accelerateForce );
        this.vehicleState.accelerateForce = accelerateForce;

        // update brakeForce
        let brakeForce = 0;

        if (this.vehicleState.brake > 0) {
            brakeForce = this.vehicleState.brakeForce + vp.brakeForce.step;
            if (brakeForce > vp.brakeForce.max) brakeForce = vp.brakeForce.max;
        }

        this.vehicleState.brakeForce = brakeForce;

        const engineForce = -accelerateForce;

        this.vehicleController.setWheelEngineForce(0, engineForce);
        this.vehicleController.setWheelEngineForce(1, engineForce);

        const currentSteering = this.vehicleController.wheelSteering(0);
        const steerDirection = this.vehicleState.right;
        const steerAngle = this.params.vehicle.maxSteeringAngle;;
        const steerReaction = this.params.vehicle.steeringReaction;

        const steering = THREE.MathUtils.lerp(currentSteering, steerAngle * steerDirection, steerReaction);

        this.vehicleController.setWheelSteering(0, steering);
        this.vehicleController.setWheelSteering(1, steering);

        const wheelBrake = this.vehicleState.brake * brakeForce;
        this.vehicleController.setWheelBrake(0, wheelBrake);
        this.vehicleController.setWheelBrake(1, wheelBrake);
        this.vehicleController.setWheelBrake(2, wheelBrake);
        this.vehicleController.setWheelBrake(3, wheelBrake);
    }

    setupEventListeners() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'w' || event.key === 'ArrowUp') this.vehicleState.forward = 1;
            if (event.key === 's' || event.key === 'ArrowDown') this.vehicleState.forward = -1;
            if (event.key === 'a' || event.key === 'ArrowLeft') this.vehicleState.right = 1;
            if (event.key === 'd' || event.key === 'ArrowRight') this.vehicleState.right = -1;
            if (event.key === 'r') this.vehicleState.reset = true;
            if (event.key === ' ') this.vehicleState.brake = 1;
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'w' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown')
                this.vehicleState.forward = 0;
            if (event.key === 'a' || event.key === 'd' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')
                this.vehicleState.right = 0;
            if (event.key === 'r') this.vehicleState.reset = false;
            if (event.key === ' ') this.vehicleState.brake = 0;
        });
    }

    getVehicleTransform() {
        if (!this.initComplete) return null; // Ensure the simulation is initialized
        return {
            position: this.chassis.translation(),
            quaternion: this.chassis.rotation(),
        };
    }

    getWheelTransform(index) {
        if (!this.vehicleController) return;
    
        const wheelSteeringQuat = new THREE.Quaternion();
        const wheelRotationQuat = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
    
        const wheelAxleCs = this.vehicleController.wheelAxleCs(index);
        const connection = this.vehicleController.wheelChassisConnectionPointCs(index).y;
        const suspension = this.vehicleController.wheelSuspensionLength(index) ;
        const steering = this.vehicleController.wheelSteering(index);
        const rotationRad = this.vehicleController.wheelRotation(index);

        let pos= new THREE.Vector3()
        
        pos.x=this.wheelPositions[index].x;
        pos.y=connection - suspension;        
        pos.z=this.wheelPositions[index].z;

        wheelSteeringQuat.setFromAxisAngle(up, steering);
        wheelRotationQuat.setFromAxisAngle(wheelAxleCs, rotationRad);

        let quat=new THREE.Quaternion(0, 0, 0, 1).multiplyQuaternions(wheelSteeringQuat, wheelRotationQuat);

        return {
            position:pos,
            quaternion: quat,
        };
    }

    update(deltaTime=1/60){
        if (!this.vehicleController) return;
        this.updateCarControl();
        this.vehicleController.updateVehicle(deltaTime);        
    }

}