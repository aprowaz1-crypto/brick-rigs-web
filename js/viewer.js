import * as THREE from 'three';
import { OrbitControls } from '../vendor/addons/OrbitControls.js';
import * as CANNON from '../vendor/cannon-es.js';
import { colorToRgb } from './brv.js';

const SCALE = 0.01; // Brick Rigs centimetres → Three.js metres
const MATERIALS = {
  Plastic: { roughness: 0.62, metalness: 0.02 },
  Aluminium: { roughness: 0.3, metalness: 0.85 },
  BrushedAlu: { roughness: 0.4, metalness: 0.8 },
  ChannelledAlu: { roughness: 0.45, metalness: 0.75 },
  Carbon: { roughness: 0.38, metalness: 0.35 },
  Chrome: { roughness: 0.12, metalness: 1.0 },
  CloudyGlass: { roughness: 0.18, metalness: 0.0, transparent: true, opacity: 0.55 },
  Glass: { roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.42 },
  Concrete: { roughness: 0.95, metalness: 0.0 },
  Copper: { roughness: 0.3, metalness: 0.95 },
  Foam: { roughness: 0.98, metalness: 0.0 },
  Glow: { roughness: 0.5, metalness: 0.1, glow: true },
  Gold: { roughness: 0.2, metalness: 1.0 },
  LEDMatrix: { roughness: 0.5, metalness: 0.2, glow: true },
  Oak: { roughness: 0.85, metalness: 0.0 },
  Pine: { roughness: 0.85, metalness: 0.0 },
  RoughWood: { roughness: 0.95, metalness: 0.0 },
  Rubber: { roughness: 0.96, metalness: 0.0 },
  RustedSteel: { roughness: 0.8, metalness: 0.55 },
  Steel: { roughness: 0.35, metalness: 0.85 },
  Tungsten: { roughness: 0.25, metalness: 1.0 },
};

function degrees(value) {
  return ((Number(value) || 0) * Math.PI) / 180;
}

export class VehicleViewer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.onStats = options.onStats || (() => {});
    this.onMode = options.onMode || (() => {});
    this.mode = 'studio';
    this.vehicle = null;
    this.theme = options.theme || 'dark';
    this.input = { forward: false, back: false, left: false, right: false, brake: false };
    this.keys = new Set();
    this._animation = null;
    this._lastTime = 0;
    this._cameraPosition = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._tmp2 = new THREE.Vector3();
    this._crateSync = [];

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0c11, 14, 48);

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.05, 250);
    this.camera.position.set(6, 4, 6);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 40;
    this.controls.target.set(0, 1, 0);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.model = new THREE.Group();
    this.model.rotation.x = -Math.PI / 2;
    this.pivot.add(this.model);

    this.studio = new THREE.Group();
    this.arena = new THREE.Group();
    this.arena.visible = false;
    this.scene.add(this.studio, this.arena);

    this._buildLights();
    this._buildStudio();
    this._buildArena();
    this._bindKeys();

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
    this._animate = this._animate.bind(this);
    this._animation = requestAnimationFrame(this._animate);
  }

  _buildLights() {
    this.hemi = new THREE.HemisphereLight(0xd9e8ff, 0x191d24, 1.4);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff4dd, 2.5);
    this.sun.position.set(6, 10, 7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 40;
    this.sun.shadow.camera.left = -12;
    this.sun.shadow.camera.right = 12;
    this.sun.shadow.camera.top = 12;
    this.sun.shadow.camera.bottom = -12;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);

    const fill = new THREE.DirectionalLight(0x8fb7ff, 0.8);
    fill.position.set(-7, 5, -6);
    this.scene.add(fill);

    const rim = new THREE.PointLight(0xffd36b, 18, 18, 2);
    rim.position.set(-3, 2.5, 5);
    this.scene.add(rim);
  }

  _buildStudio() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.94, metalness: 0.02 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.studio.add(ground);
    this.studioGround = ground;

    this.gridDivisions = 70;
    const grid = new THREE.GridHelper(70, this.gridDivisions, 0x3c4555, 0x252c37);
    grid.position.y = 0.003;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    this.studio.add(grid);
    this.studioGrid = grid;

    // A softly glowing brick-stud platform under the vehicle.
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 4.8, 0.12, 64),
      new THREE.MeshStandardMaterial({ color: 0x1b212b, roughness: 0.7, metalness: 0.1 })
    );
    platform.position.y = 0.06;
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.studio.add(platform);
    this.studioPlatform = platform;

    const studMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b3442,
      roughness: 0.6,
      metalness: 0.15,
    });
    const studGeometry = new THREE.CylinderGeometry(0.17, 0.19, 0.05, 20);
    for (let i = 0; i < 42; i += 1) {
      const angle = (i / 42) * Math.PI * 2;
      const radius = 4.05;
      const stud = new THREE.Mesh(studGeometry, studMaterial);
      stud.position.set(Math.cos(angle) * radius, 0.14, Math.sin(angle) * radius);
      stud.castShadow = true;
      stud.receiveShadow = true;
      this.studio.add(stud);
    }
  }

  _buildArena() {
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x252a33, roughness: 0.92, metalness: 0.02 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.arena.add(ground);
    this.arenaGround = ground;

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 13),
      new THREE.MeshStandardMaterial({ color: 0x303642, roughness: 0.9, metalness: 0.03 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.004;
    road.receiveShadow = true;
    this.arena.add(road);

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xe9d36b });
    for (let x = -110; x <= 110; x += 10) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.18), lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.012, 0);
      this.arena.add(line);
    }

    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7484, roughness: 0.6 });
    for (const z of [-7.2, 7.2]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(240, 0.12, 0.25), edgeMaterial);
      edge.position.set(0, 0.06, z);
      edge.receiveShadow = true;
      edge.castShadow = true;
      this.arena.add(edge);
    }

    // Hills in the distance.
    const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2029, roughness: 1 });
    for (let i = 0; i < 14; i += 1) {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(8 + (i % 4) * 4, 5 + (i % 3) * 2, 7), hillMaterial);
      hill.position.set(-110 + i * 17, 1, (i % 2 === 0 ? 1 : -1) * (26 + (i % 5) * 6));
      hill.rotation.y = i;
      this.arena.add(hill);
    }

    this.driveGroup = new THREE.Group();
    this.arena.add(this.driveGroup);
  }

  _setGridColors(colorCenter, colorLine) {
    const attribute = this.studioGrid.geometry.getAttribute('color');
    if (!attribute) return;
    const center = this.gridDivisions / 2;
    const centerColor = new THREE.Color(colorCenter);
    const lineColor = new THREE.Color(colorLine);
    let index = 0;
    for (let i = 0; i <= this.gridDivisions; i += 1) {
      const color = i === center ? centerColor : lineColor;
      for (let vertex = 0; vertex < 4; vertex += 1) {
        attribute.setXYZ(index, color.r, color.g, color.b);
        index += 1;
      }
    }
    attribute.needsUpdate = true;
  }

  setTheme(theme) {
    this.theme = theme;
    const dark = theme !== 'light';
    this.scene.fog.color.setHex(dark ? 0x0a0c11 : 0xdfe7f1);
    this.studioGround.material.color.setHex(dark ? 0x141820 : 0xd8e1ec);
    this._setGridColors(dark ? 0x3c4555 : 0x9fb0c4, dark ? 0x252c37 : 0xc3cfdd);
    this.studioPlatform.material.color.setHex(dark ? 0x1b212b : 0xeef3f9);
    this.arenaGround.material.color.setHex(dark ? 0x252a33 : 0xb9c3cf);
    this.hemi.groundColor.setHex(dark ? 0x191d24 : 0xb9c4d0);
  }

  _bindKeys() {
    this._keydown = (event) => {
      if (this.mode !== 'drive') return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        event.preventDefault();
      }
      if (key === 'r') this.resetDrive();
      if (key === 'escape') this.stopDrive();
      this.keys.add(key);
    };
    this._keyup = (event) => {
      this.keys.delete(event.key.toLowerCase());
    };
    window.addEventListener('keydown', this._keydown, { passive: false });
    window.addEventListener('keyup', this._keyup);
  }

  setInput(action, value) {
    if (action in this.input) this.input[action] = value;
  }

  resize() {
    const parent = this.canvas.parentElement || this.canvas;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  attachTo(parent) {
    if (!parent) return;
    if (this.canvas.parentElement !== parent) {
      parent.prepend(this.canvas);
    }
    this._resizeObserver.disconnect();
    this._resizeObserver.observe(parent);
    this.resize();
  }

  clearModel() {
    for (const child of [...this.model.children]) {
      this.model.remove(child);
      child.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
      });
    }
  }

  _materialFor(brick, opacityOverride) {
    const { r, g, b, a } = colorToRgb(brick.color);
    const base = MATERIALS[brick.material] || MATERIALS.Plastic;
    const transparent = a < 0.99 || Boolean(base.transparent);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(r, g, b),
      roughness: base.roughness,
      metalness: base.metalness,
      transparent,
      opacity: Math.min(a, base.opacity ?? 1) * (opacityOverride ?? 1),
      depthWrite: !transparent || a > 0.6,
      side: THREE.FrontSide,
    });
    if (base.glow) {
      material.emissive = new THREE.Color(r, g, b);
      material.emissiveIntensity = 0.9;
    }
    return material;
  }

  _geometryFor(brick) {
    const { x, y, z, shape, axis } = brick.dims;
    const dx = x * SCALE;
    const dy = y * SCALE;
    const dz = z * SCALE;
    if (shape === 'sphere') {
      return new THREE.SphereGeometry(Math.max(dx, dy, dz) / 2, 18, 12);
    }
    if (shape === 'cone') {
      const geometry = new THREE.ConeGeometry(Math.max(dx, dy) / 2, dz, 18);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }
    if (shape === 'cylinder' || shape === 'wheel') {
      if (axis === 'y') {
        return new THREE.CylinderGeometry(dx / 2, dx / 2, dy, 20);
      }
      const geometry = new THREE.CylinderGeometry(Math.max(dx, dy) / 2, Math.max(dx, dy) / 2, dz, 20);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }
    return new THREE.BoxGeometry(dx, dy, dz);
  }

  _buildIndividual(vehicle) {
    const canAddStuds = vehicle.bricks.length <= 220;
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.16,
    });
    const studGeometry = new THREE.CylinderGeometry(0.022, 0.024, 0.014, 12);
    const wheelHubGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20);

    for (const brick of vehicle.bricks) {
      const group = new THREE.Group();
      group.position.set(brick.pos.x * SCALE, brick.pos.y * SCALE, brick.pos.z * SCALE);
      group.rotation.set(degrees(brick.rot.x), degrees(brick.rot.y), degrees(brick.rot.z));

      const material = this._materialFor(brick);
      const geometry = this._geometryFor(brick);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      if (brick.dims.shape === 'box' || brick.dims.shape === 'wheel') {
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMaterial);
        group.add(edges);
      }

      if (brick.dims.wheel) {
        const hubMaterial = new THREE.MeshStandardMaterial({
          color: 0xc6ccd6,
          roughness: 0.3,
          metalness: 0.8,
        });
        const hub = new THREE.Mesh(wheelHubGeometry, hubMaterial);
        const width = brick.dims.y * SCALE;
        hub.scale.x = Math.max(1, brick.dims.x / 70);
        hub.scale.y = width / 0.08;
        hub.scale.z = Math.max(1, brick.dims.z / 70);
        hub.castShadow = true;
        group.add(hub);
        this._wheels = this._wheels || [];
        this._wheels.push({ group, brick, baseRotation: group.rotation.z });
      }

      if (canAddStuds && brick.dims.studs && brick.dims.shape === 'box') {
        const width = brick.dims.x * SCALE;
        const depth = brick.dims.y * SCALE;
        const columns = Math.min(6, Math.max(1, Math.round(width / 0.08)));
        const rows = Math.min(6, Math.max(1, Math.round(depth / 0.08)));
        const studMaterial = this._materialFor({ ...brick, color: brick.color });
        for (let cx = 0; cx < columns; cx += 1) {
          for (let cy = 0; cy < rows; cy += 1) {
            const stud = new THREE.Mesh(studGeometry, studMaterial);
            stud.position.set(
              (cx - (columns - 1) / 2) * (width / columns),
              (cy - (rows - 1) / 2) * (depth / rows),
              brick.dims.z * SCALE * 0.5 + 0.007
            );
            stud.castShadow = true;
            group.add(stud);
          }
        }
      }

      this.model.add(group);
    }
  }

  _unitGeometry(brick) {
    const { shape, axis } = brick.dims;
    if (shape === 'box') return new THREE.BoxGeometry(1, 1, 1);
    if (shape === 'sphere') return new THREE.SphereGeometry(0.5, 12, 8);
    if (shape === 'cone') {
      const geometry = new THREE.ConeGeometry(0.5, 1, 14);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }
    if (shape === 'cylinder' || shape === 'wheel') {
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
      if (axis !== 'y') geometry.rotateX(Math.PI / 2);
      return geometry;
    }
    return new THREE.BoxGeometry(1, 1, 1);
  }

  _buildInstanced(vehicle) {
    const groups = new Map();
    for (const brick of vehicle.bricks) {
      const { shape, axis } = brick.dims;
      const key = `${shape}-${axis || 'z'}-${brick.material}-${brick.color >>> 0}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(brick);
    }

    const dummy = new THREE.Object3D();
    for (const [, bricks] of groups) {
      const sample = bricks[0];
      const geometry = this._unitGeometry(sample);
      const material = this._materialFor(sample);
      const mesh = new THREE.InstancedMesh(geometry, material, bricks.length);
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      bricks.forEach((brick, index) => {
        const { x, y, z } = brick.dims;
        dummy.position.set(brick.pos.x * SCALE, brick.pos.y * SCALE, brick.pos.z * SCALE);
        dummy.rotation.set(degrees(brick.rot.x), degrees(brick.rot.y), degrees(brick.rot.z));
        dummy.scale.set(x * SCALE, y * SCALE, z * SCALE);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        const { r, g, b } = colorToRgb(brick.color);
        mesh.setColorAt(index, new THREE.Color(r, g, b));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.model.add(mesh);
    }
  }

  setVehicle(vehicle) {
    if (this.mode === 'drive') this.stopDrive();
    this.clearModel();
    this._wheels = [];
    this.vehicle = vehicle;

    if (!vehicle || !vehicle.bricks.length) {
      this.pivot.position.set(0, 0, 0);
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(6, 4, 6);
      return;
    }

    if (vehicle.bricks.length > 260) {
      this._buildInstanced(vehicle);
    } else {
      this._buildIndividual(vehicle);
    }

    const { min, max, size } = vehicle.bounds;
    const center = {
      x: ((min.x + max.x) / 2) * SCALE,
      y: ((min.y + max.y) / 2) * SCALE,
      z: ((min.z + max.z) / 2) * SCALE,
    };
    // The model group is rotated -90° around X to turn Brick Rigs' Z-up
    // coordinates into Three.js Y-up. Its offset must be expressed in the
    // pivot's space, i.e. with Y and Z swapped.
    this.model.position.set(-center.x, -center.z, center.y);
    this.model.updateMatrixWorld(true);

    this.dimensions = {
      x: size.x * SCALE,
      y: size.z * SCALE,
      z: size.y * SCALE,
    };
    this.halfHeight = (size.z * SCALE) / 2;
    this.pivot.position.set(0, this.halfHeight, 0);

    this.resetCamera();
    this.onStats(vehicle);
  }

  resetCamera() {
    if (!this.dimensions) return;
    const maxDim = Math.max(this.dimensions.x, this.dimensions.y, this.dimensions.z);
    const distance = maxDim * 1.35 + 1.6;
    this.camera.fov = 35;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(distance * 0.82, this.halfHeight + maxDim * 0.62, distance * 0.82);
    this.controls.target.set(0, this.halfHeight * 0.92, 0);
    this.controls.minDistance = Math.max(0.8, maxDim * 0.45);
    this.controls.maxDistance = Math.max(12, maxDim * 5);
    this.controls.update();
  }

  _buildDriveWorld() {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = false;

    const groundMaterial = new CANNON.Material('ground');
    const carMaterial = new CANNON.Material('car');
    world.addContactMaterial(
      new CANNON.ContactMaterial(groundMaterial, carMaterial, {
        friction: 0.55,
        restitution: 0.08,
        contactEquationStiffness: 1e7,
      })
    );

    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    const { x, y, z } = this.dimensions;
    const body = new CANNON.Body({
      mass: Math.min(5000, Math.max(350, this.vehicle.bricks.length * 18)),
      material: carMaterial,
      linearDamping: 0.12,
      angularDamping: 0.92,
    });
    body.addShape(new CANNON.Box(new CANNON.Vec3(x / 2, y / 2, z / 2)));
    body.position.set(0, this.halfHeight + 0.35, 0);
    world.addBody(body);

    this.drive = {
      world,
      body,
      speed: 0,
      distance: 0,
      crates: [],
    };

    this._addArenaObstacles(world, groundMaterial);
    this.driveGroup.visible = true;
  }

  _addArenaObstacles(world, groundMaterial) {
    const obstacleMaterial = new CANNON.Material('obstacle');
    world.addContactMaterial(
      new CANNON.ContactMaterial(groundMaterial, obstacleMaterial, { friction: 0.5, restitution: 0.15 })
    );

    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a53c, roughness: 0.7, metalness: 0.1 });
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 7), rampMaterial);
    ramp.position.set(18, 0.7, 0);
    ramp.rotation.z = -0.22;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    this.driveGroup.add(ramp);

    const rampBody = new CANNON.Body({ mass: 0, material: obstacleMaterial });
    rampBody.addShape(new CANNON.Box(new CANNON.Vec3(2.5, 0.2, 3.5)));
    rampBody.position.copy(ramp.position);
    rampBody.quaternion.setFromEuler(0, 0, -0.22);
    world.addBody(rampBody);

    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x4c7bd9, roughness: 0.55, metalness: 0.15 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 5), blockMaterial);
    block.position.set(-24, 0.7, -9);
    block.castShadow = true;
    block.receiveShadow = true;
    this.driveGroup.add(block);

    const blockBody = new CANNON.Body({ mass: 0, material: obstacleMaterial });
    blockBody.addShape(new CANNON.Box(new CANNON.Vec3(1.5, 0.7, 2.5)));
    blockBody.position.copy(block.position);
    world.addBody(blockBody);

    // A pile of loose bricks to scatter.
    const crateGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const colors = [0xe94b4b, 0xf5c542, 0x4c9be8, 0x55c57a, 0xe58b3a];
    const crateMaterial = new CANNON.Material('crate');
    world.addContactMaterial(
      new CANNON.ContactMaterial(groundMaterial, crateMaterial, { friction: 0.45, restitution: 0.2 })
    );
    world.addContactMaterial(
      new CANNON.ContactMaterial(crateMaterial, crateMaterial, { friction: 0.4, restitution: 0.2 })
    );

    for (let i = 0; i < 14; i += 1) {
      const mesh = new THREE.Mesh(
        crateGeometry,
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.55 })
      );
      const column = i % 5;
      const row = Math.floor(i / 5);
      mesh.position.set(-8 + column * 0.55, 0.3 + row * 0.52, 2.4 + (i % 3) * 0.1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.driveGroup.add(mesh);

      const crateBody = new CANNON.Body({
        mass: 8,
        material: crateMaterial,
        linearDamping: 0.06,
        angularDamping: 0.2,
      });
      crateBody.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)));
      crateBody.position.copy(mesh.position);
      world.addBody(crateBody);
      this.drive.crates.push({ mesh, body: crateBody });
    }
  }

  startDrive() {
    if (!this.vehicle || this.mode === 'drive') return false;
    this.mode = 'drive';
    this.controls.enabled = false;
    this.studio.visible = false;
    this.arena.visible = true;
    this.pivot.position.set(0, this.halfHeight, 0);
    this.pivot.quaternion.identity();
    this.camera.fov = 55;
    this.camera.updateProjectionMatrix();
    this._buildDriveWorld();
    this.onMode('drive');
    return true;
  }

  resetDrive() {
    if (!this.drive) return;
    const { body } = this.drive;
    body.position.set(0, this.halfHeight + 0.35, 0);
    body.quaternion.set(0, 0, 0, 1);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.wakeUp();
    this.drive.speed = 0;
    this.drive.distance = 0;
    for (const crate of this.drive.crates) {
      crate.mesh.position.set(-8 + (crate.body.id % 5) * 0.55, 0.3, 2.4);
      crate.body.position.copy(crate.mesh.position);
      crate.body.velocity.set(0, 0, 0);
      crate.body.angularVelocity.set(0, 0, 0);
    }
    this._onDriveHud?.(0);
  }

  stopDrive() {
    if (this.mode !== 'drive') return;
    this.mode = 'studio';
    this.drive = null;
    this.keys.clear();
    this.input = { forward: false, back: false, left: false, right: false, brake: false };
    this.controls.enabled = true;
    this.studio.visible = true;
    this.arena.visible = false;
    for (const child of [...this.driveGroup.children]) {
      this.driveGroup.remove(child);
      child.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
    }
    this.pivot.position.set(0, this.halfHeight || 0, 0);
    this.pivot.quaternion.identity();
    this.camera.fov = 35;
    this.camera.updateProjectionMatrix();
    this.resetCamera();
    this.onMode('studio');
  }

  _driveControls() {
    const keys = this.keys;
    return {
      forward: this.input.forward || keys.has('w') || keys.has('arrowup'),
      back: this.input.back || keys.has('s') || keys.has('arrowdown'),
      left: this.input.left || keys.has('a') || keys.has('arrowleft'),
      right: this.input.right || keys.has('d') || keys.has('arrowright'),
      brake: this.input.brake || keys.has(' '),
    };
  }

  _updateDrive(dt) {
    if (!this.drive) return;
    const { world, body } = this.drive;
    const controls = this._driveControls();
    const forward = body.quaternion.vmult(new CANNON.Vec3(1, 0, 0));
    forward.y = 0;
    if (forward.lengthSquared() > 0.0001) forward.normalize();
    const speed = body.velocity.dot(forward);

    if (controls.forward) {
      body.applyForce(new CANNON.Vec3(forward.x * 9500, 0, forward.z * 9500));
    }
    if (controls.back) {
      if (speed > 0.8) {
        body.applyForce(new CANNON.Vec3(-forward.x * 7000, 0, -forward.z * 7000));
      } else {
        body.applyForce(new CANNON.Vec3(-forward.x * 5200, 0, -forward.z * 5200));
      }
    }
    if (controls.brake) {
      body.velocity.x *= 0.94;
      body.velocity.z *= 0.94;
    }

    const steer = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    if (steer !== 0 && Math.abs(speed) > 0.35) {
      const target = (steer * Math.sign(speed) * Math.min(1.5, Math.abs(speed) * 0.12));
      body.angularVelocity.y += (target - body.angularVelocity.y) * 0.12;
    } else {
      body.angularVelocity.y *= 0.9;
    }

    // Keep the car upright and planted.
    const up = body.quaternion.vmult(new CANNON.Vec3(0, 1, 0));
    const uprightTorque = new CANNON.Vec3(up.z, 0, -up.x).scale(2600);
    body.torque.x += uprightTorque.x;
    body.torque.z += uprightTorque.z;
    body.angularVelocity.x *= 0.86;
    body.angularVelocity.z *= 0.86;

    if (speed > 32) {
      body.velocity.x *= 0.995;
      body.velocity.z *= 0.995;
    }

    world.step(1 / 60, dt, 3);

    this.pivot.position.copy(body.position);
    this.pivot.quaternion.copy(body.quaternion);
    this.drive.speed = body.velocity.length() * 3.6;
    this.drive.distance += body.velocity.length() * dt;

    for (const crate of this.drive.crates) {
      crate.mesh.position.copy(crate.body.position);
      crate.mesh.quaternion.copy(crate.body.quaternion);
    }

    if (this._wheels) {
      const spin = body.velocity.length() * dt * 4;
      for (const wheel of this._wheels) {
        wheel.group.rotation.y += spin;
        if (steer !== 0) wheel.group.rotation.z = wheel.baseRotation + steer * 0.35;
      }
    }

    // Chase camera.
    const behind = body.quaternion.vmult(new CANNON.Vec3(-7.5, 3.1, 0));
    const desired = new THREE.Vector3(
      body.position.x + behind.x,
      Math.max(1.8, body.position.y + behind.y),
      body.position.z + behind.z
    );
    const look = new THREE.Vector3(body.position.x, body.position.y + 0.6, body.position.z);
    const forwardLook = body.quaternion.vmult(new CANNON.Vec3(4, 0, 0));
    look.x += forwardLook.x;
    look.z += forwardLook.z;
    this._cameraPosition.lerp(desired, 0.09);
    this._lookTarget.lerp(look, 0.16);
    this.camera.position.copy(this._cameraPosition);
    this.camera.lookAt(this._lookTarget);

    this._onDriveHud?.(this.drive.speed, this.drive.distance);
  }

  onDriveHud(callback) {
    this._onDriveHud = callback;
  }

  _animate(time) {
    const delta = this._lastTime ? Math.min(0.05, (time - this._lastTime) / 1000) : 0.016;
    this._lastTime = time;

    if (this.mode === 'drive') {
      if (!this._cameraPosition.lengthSq()) {
        this._cameraPosition.copy(this.camera.position);
        this._lookTarget.set(0, 1, 0);
      }
      this._updateDrive(delta);
    } else {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
    this._animation = requestAnimationFrame(this._animate);
  }

  dispose() {
    cancelAnimationFrame(this._animation);
    this._resizeObserver.disconnect();
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
