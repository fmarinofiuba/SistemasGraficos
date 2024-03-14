import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

export function CityGenerator(scene, renderer) {
  let isDaytime = false;
  let c1 = 0;
  let SEED1 = 49823.3232;
  let SEED2 = 92733.112;

  let dayNight = 0;
  let cityContainer;

  let directionalLight;
  let hemiLight;

  const skyDay = new THREE.Color(0xccccff);
  const skyNight = new THREE.Color(0x222299);

  let lights = [];

  const materials = {
    ground: new THREE.MeshPhongMaterial({ color: 0x887755, name: "ground" }),
    trunk: new THREE.MeshPhongMaterial({ color: 0x996611, name: "trunk" }),

    foliage1: new THREE.MeshPhongMaterial({
      color: 0x009900,
      name: "foliage1",
    }),
    foliage2: new THREE.MeshPhongMaterial({
      color: 0x11aa00,
      name: "foliage2",
    }),
    foliage3: new THREE.MeshPhongMaterial({
      color: 0x008811,
      name: "foliage3",
    }),

    house1: new THREE.MeshPhongMaterial({ color: 0xffcccc, name: "house1" }),
    house2: new THREE.MeshPhongMaterial({ color: 0xffccff, name: "house2" }),
    house3: new THREE.MeshPhongMaterial({ color: 0xccffcc, name: "house3" }),

    floor: new THREE.MeshPhongMaterial({ color: 0x444444, name: "floor" }),

    window: new THREE.MeshPhongMaterial({
      color: 0x9999ff,
      emissive: 0xffffff,
      shininess: 64,
      name: "window",
    }),

    roof: new THREE.MeshPhongMaterial({
      color: 0x993333,
      shininess: 2,
      name: "roof",
    }),
    door: new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      shininess: 2,
      name: "door",
    }),

    grass: new THREE.MeshPhongMaterial({ color: 0x33ff633, name: "grass" }),

    post: new THREE.MeshPhongMaterial({
      color: 0x222222,
      shininess: 64,
      name: "post",
    }),

    light1: new THREE.MeshPhongMaterial({ emissive: 0xffff00, name: "light1" }),
    light2: new THREE.MeshPhongMaterial({ emissive: 0xff00ff, name: "light2" }),
    light3: new THREE.MeshPhongMaterial({ emissive: 0x77ffff, name: "light3" }),
    light4: new THREE.MeshPhongMaterial({ emissive: 0xff5577, name: "light4" }),
    light5: new THREE.MeshPhongMaterial({ emissive: 0x7777ff, name: "light5" }),
  };

  this.generate = function () {
    if (cityContainer) {
      scene.remove(cityContainer);
    }
    cityContainer = new THREE.Group();

    buildScenario();
    buildNeighborhood();

    mergeGeometries();
    updateDayNight();
  };

  function mergeGeometries() {
    let geometries = {};
    let meshes = [];

    cityContainer.updateMatrixWorld(true, true);

    cityContainer.traverse((obj) => {
      if (obj.isMesh) {
        meshes.push(obj);
        let geometry = obj.geometry.index
          ? obj.geometry.toNonIndexed()
          : obj.geometry().clone();

        let materialName = obj.material.name;
        if (!geometries.hasOwnProperty(materialName)) {
          geometries[materialName] = [];
        }

        geometry.applyMatrix4(obj.matrixWorld);
        geometries[materialName].push(geometry);
      }

      if (obj.isLight) {
        lights.push(obj);
      }
    });

    for (const [materialName, geometryList] of Object.entries(geometries)) {
      let mergedGeometry = BufferGeometryUtils.mergeGeometries(
        geometryList,
        true
      );
      mergedGeometry.applyMatrix4(cityContainer.matrix.clone().invert());
      let mesh = new THREE.Mesh(mergedGeometry, materials[materialName]);
      scene.add(mesh);
    }

    lights.forEach((light, i) => {
      let matrix = light.matrixWorld.clone();

      let position = light.getWorldPosition(new THREE.Vector3());
      if (light.parent) light.parent.remove(light);
      light.position.copy(position);
      scene.add(light);
    });
  }
  // generate random integer between from and to
  function randomInteger(from, to) {
    let value =
      from + Math.floor((0.5 + 0.5 * Math.sin(c1 * SEED1)) * (to - from));
    c1 += value;
    return value;
  }

  // generate random float between from and to
  function randomFloat(from, to) {
    let value = from + (0.5 + 0.5 * Math.sin(c1 * SEED2)) * (to - from);
    c1 += value;
    return value;
  }

  function buildScenario() {
    // add grid and axes
    const size = 400;
    const divisions = 40;

    const axesHelper = new THREE.AxesHelper(5);
    cityContainer.add(axesHelper);

    // create lights
    // daytime

    const groundGeometry = new THREE.PlaneGeometry(220, 80, 1, 1);
    const mm = new THREE.MeshPhongMaterial({
      color: 0x000000,
      shininess: 0,
    });
    const ground = new THREE.Mesh(groundGeometry, materials["ground"]);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.1, 0);
    cityContainer.add(ground);

    directionalLight = new THREE.DirectionalLight(0xeeeeff, 0.2);
    directionalLight.position.set(-1, 2, 3);
    hemiLight = new THREE.HemisphereLight(0x8888dd, 0x080866, 0.2);

    scene.add(directionalLight);
    scene.add(hemiLight);
  }

  function createTree(height, diameter) {
    let tree = new THREE.Group();

    let foliageGeometry = new THREE.SphereGeometry(diameter / 2, 32, 16);
    let foliageMaterial = materials["foliage" + randomInteger(1, 3)];
    let foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(0, height, 0);

    let trunkDiameter = Math.max(0.1, diameter * 0.1);

    let trunkGeometry = new THREE.CylinderGeometry(
      trunkDiameter / 2,
      trunkDiameter,
      height,
      32
    );
    trunkGeometry.translate(0, height / 2, 0);
    let trunk = new THREE.Mesh(trunkGeometry, materials["trunk"]);

    tree.add(trunk);
    tree.add(foliage);

    return tree;
  }

  function createPark(width, length) {
    let parkGeometry = new THREE.BoxGeometry(width, 0.05, length);

    let park = new THREE.Mesh(parkGeometry, materials["grass"]);
    return park;
  }

  function createLampPost(height, intensity, color) {
    // create post

    if (!intensity) intensity = 0.3;

    let lampPost = new THREE.Group();
    let postGeometry = new THREE.CylinderGeometry(0.1, 0.1, height, 12);

    postGeometry.translate(0, height / 2, 0);
    let post = new THREE.Mesh(postGeometry, materials["post"]);

    let lampGeometry = new THREE.SphereGeometry(0.3, 32, 16);
    let lightMaterial = materials["light" + randomInteger(1, 5)];
    let lamp = new THREE.Mesh(lampGeometry, lightMaterial);
    lamp.position.set(0, height, 0);

    lampPost.add(post);
    lampPost.add(lamp);

    if (!isDaytime) {
      const light = new THREE.PointLight(
        lightMaterial.emissive,
        intensity,
        10,
        1
      );
      light.position.set(0, height, 0);
      lampPost.add(light);
    }

    return lampPost;
  }
  // create a color from HSL
  function hslColor(hue, saturation, lightness) {
    let color = new THREE.Color();
    color.setHSL(hue, saturation, lightness);
    return parseInt("0x" + color.getHexString());
  }

  function createHouse(floors, frontWidth, color) {
    if (!color) color = 0xffffff;
    if (!floors) floors = 0;

    // create the container that represents the entire house
    let house = new THREE.Group();
    let floorHeight = 4;

    // create the main body of the house
    let houseGeometry = new THREE.BoxGeometry(frontWidth, floorHeight, 10);
    houseGeometry.translate(0, floorHeight / 2, 0);

    let cube = new THREE.Mesh(
      houseGeometry,
      materials["house" + randomInteger(1, 3)]
    );

    // create the roof
    let roofGeometry = new THREE.BoxGeometry(frontWidth + 1, 0.5, 11);

    let roofPanel = new THREE.Mesh(roofGeometry, materials["roof"]);
    roofPanel.position.set(0, floorHeight * floors, 0);
    house.add(roofPanel);

    let windowGeometry = new THREE.BoxGeometry(3, 1.5, 0.1);
    windowGeometry.rotateY(Math.PI / 2);

    let window0 = new THREE.Mesh(windowGeometry, materials["window"]);

    // create upper floors

    for (let i = 0; i < floors; i++) {
      let floorGeometry = new THREE.BoxGeometry(frontWidth + 1, 0.1, 11);
      let floor = new THREE.Mesh(floorGeometry, materials["floor"]);
      floor.position.set(0, floorHeight * i, 0);
      house.add(floor);

      let upperFloor = cube.clone();
      upperFloor.position.y = i * floorHeight;
      house.add(upperFloor);

      let window = window0.clone();
      window.position.set(-frontWidth / 2 - 0.1, i * floorHeight + 2, 2);
      house.add(window);

      window = window0.clone();
      window.position.set(+frontWidth / 2 + 0.1, i * floorHeight + 2, -2);
      house.add(window);
    }

    // create the door
    let doorGeometry = new THREE.BoxGeometry(1, 2.2, 0.2);

    let door = new THREE.Mesh(doorGeometry, materials["door"]);
    door.position.set(0, 1.1, 5);
    house.add(door);

    return house;
  }

  function createLot() {
    let lot = new THREE.Group();
    let house = createHouse(randomInteger(2, 10), randomFloat(3, 8), 0xffffff);
    lot.add(house);

    let park = createPark(20, 20);
    lot.add(park);
    let lampPostHeight = randomFloat(2, 7);

    let numberOfLampPosts = randomInteger(1, 1);
    let lampPostLineSpacing = 16;
    let lampPostHue = randomFloat(0, 1);

    for (let i = 1; i <= numberOfLampPosts; i++) {
      let lampPost = createLampPost(
        lampPostHeight,
        0.65,
        hslColor(lampPostHue, 1, 0.75)
      );
      let lampPostSpacing = lampPostLineSpacing / numberOfLampPosts;
      lampPost.position.set(
        lampPostLineSpacing / 2 - i * lampPostSpacing,
        0,
        8
      );
      lot.add(lampPost);
    }

    for (let j = 0; j < 10; j++) {
      let treeHeight = randomFloat(3, 7);
      let radius = randomFloat(1, 4);

      let tree = createTree(treeHeight, radius);

      let offsetX = randomFloat(0, 2);
      tree.position.set(9 - offsetX, 0, 5 - j * 1);
      lot.add(tree);
    }

    return lot;
  }

  function buildNeighborhood() {
    const spacing = 15;
    let lot;
    let TOTAL = 4;
    for (let i = -TOTAL; i < TOTAL; i++) {
      lot = createLot();
      lot.position.set(i * 22, 0, -spacing);
      cityContainer.add(lot);
    }

    for (let i = -TOTAL; i < TOTAL; i++) {
      lot = createLot();
      lot.position.set(i * 22, 0, spacing);
      lot.rotation.set(0, 3.1415, 0);
      cityContainer.add(lot);
    }
  }

  function updateDayNight() {
    let sky = skyDay.clone();
    sky.lerp(skyNight, dayNight);

    renderer.setClearColor(sky.getHex());
    materials["window"].emissive = new THREE.Color().setHSL(0.5, 0, dayNight);

    lights.forEach((light, i) => {
      light.intensity = dayNight * 0.6;
    });
    directionalLight.intensity = 1 - dayNight;
    hemiLight.intensity = 0.1 + (1 - dayNight) * 0.3;
  }

  // public properties
  // dayNightFactor
  // 0: day
  // 1: night
  Object.defineProperty(this, "dayNightFactor", {
    get() {
      return dayNight;
    },
    set(value) {
      dayNight = value;
      updateDayNight();
    },
  });
}
