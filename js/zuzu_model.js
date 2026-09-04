import * as THREE from 'three';

/**
 * Procedural Canvas Texture for Zuzu's Pixar-style Face
 * High-contrast, bold facial features positioned cleanly beneath the bowl cut
 */
function createZuzuPixarFaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Warm peach skin tone
  const skinGrad = ctx.createLinearGradient(0, 0, 0, 512);
  skinGrad.addColorStop(0, '#ffdfc4');
  skinGrad.addColorStop(0.5, '#fcd2b2');
  skinGrad.addColorStop(1, '#f5c19e');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Rosy Cheeks Blush
  const drawCheekBlush = (cx, cy) => {
    const blush = ctx.createRadialGradient(cx, cy, 10, cx, cy, 75);
    blush.addColorStop(0, 'rgba(248, 113, 113, 0.55)');
    blush.addColorStop(0.6, 'rgba(248, 113, 113, 0.25)');
    blush.addColorStop(1, 'rgba(248, 113, 113, 0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCheekBlush(110, 320);
  drawCheekBlush(402, 320);

  // 3. Freckles across nose bridge and upper cheeks
  ctx.fillStyle = 'rgba(160, 80, 35, 0.65)';
  const frecklePositions = [
    [130, 305, 3.0], [150, 320, 2.5], [175, 308, 3.0], [200, 315, 3.5],
    [225, 305, 3.0], [242, 312, 3.5], [256, 302, 3.0], [270, 312, 3.5],
    [287, 305, 3.0], [312, 315, 3.5], [337, 308, 3.0], [362, 320, 2.5],
    [382, 305, 3.0], [235, 290, 2.5], [256, 285, 2.5], [277, 290, 2.5]
  ];
  frecklePositions.forEach(([fx, fy, fr]) => {
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Soft Arched Eyebrows (Rich dark chestnut)
  ctx.strokeStyle = '#3e1d08';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';

  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(85, 190);
  ctx.quadraticCurveTo(150, 160, 210, 185);
  ctx.stroke();

  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(302, 185);
  ctx.quadraticCurveTo(362, 160, 427, 190);
  ctx.stroke();

  // 5. Big Expressive Animated Brown Eyes
  function drawEye(cx, cy, radiusX, radiusY, isRight = false) {
    ctx.save();
    // Eye white
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Dark eyelid rim
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#281104';
    ctx.stroke();

    ctx.clip();

    // Outer Iris (Warm amber-brown)
    const irisR = radiusX * 0.78;
    const irisGrad = ctx.createRadialGradient(cx, cy - 6, 4, cx, cy, irisR);
    irisGrad.addColorStop(0, '#b45309');
    irisGrad.addColorStop(0.55, '#78350f');
    irisGrad.addColorStop(0.9, '#451a03');
    irisGrad.addColorStop(1, '#1c0a02');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, irisR, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#050507';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, radiusX * 0.44, 0, Math.PI * 2);
    ctx.fill();

    // Bold White Catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - (isRight ? 10 : 15), cy - 14, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + (isRight ? 16 : 12), cy + 12, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Upper eyelash stroke
    ctx.strokeStyle = '#220d03';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, radiusX + 2, radiusY + 2, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }

  drawEye(146, 245, 52, 62, false);
  drawEye(366, 245, 52, 62, true);

  // 6. Cute Button Nose
  const noseGrad = ctx.createRadialGradient(256, 320, 2, 256, 322, 20);
  noseGrad.addColorStop(0, '#e58260');
  noseGrad.addColorStop(0.7, '#d96c46');
  noseGrad.addColorStop(1, 'rgba(217, 108, 70, 0)');
  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.arc(256, 322, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#b84e2a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 325, 11, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  // 7. Joyful Open Smile with Upper Teeth
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(175, 385);
  ctx.quadraticCurveTo(256, 480, 337, 385);
  ctx.quadraticCurveTo(256, 400, 175, 385);
  ctx.closePath();
  ctx.fillStyle = '#831818';
  ctx.fill();
  ctx.clip();

  // White upper teeth row
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(188, 382, 136, 30, [0, 0, 10, 10]);
  ctx.fill();

  // Pink tongue
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.arc(256, 460, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Smile outline
  ctx.strokeStyle = '#5a1010';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(170, 380);
  ctx.quadraticCurveTo(176, 385, 182, 388);
  ctx.quadraticCurveTo(256, 480, 330, 388);
  ctx.quadraticCurveTo(336, 385, 342, 380);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * ZuzuCharacterModel
 * - Sleek, smooth 3D Bowl Cut (Zero spiky cones, zero lumpy capsules)
 * - Grounded sneaker soles resting at y = 0.00 (Zero ground clipping)
 * - Green hoodie with 3D physical Orange "Z" emblem & white border
 * - White hoodie drawstrings
 * - Smartwatch on left wrist
 * - Brown leather backpack
 * - Denim blue shorts
 * - Orange & white high-top sneakers
 */
export class ZuzuCharacterModel {
  constructor(options = {}) {
    this.options = {
      isInventoryPreview: options.isInventoryPreview || false,
      scale: options.scale || 1.0,
      ...options
    };

    // Textures
    this.faceTexture = createZuzuPixarFaceTexture();

    // High Quality Materials
    this.materials = {
      skin: new THREE.MeshStandardMaterial({
        color: 0xfcd2b2,
        roughness: 0.6,
        metalness: 0.02
      }),
      face: new THREE.MeshStandardMaterial({
        map: this.faceTexture,
        roughness: 0.6,
        metalness: 0.02
      }),
      hair: new THREE.MeshStandardMaterial({
        color: 0x542c13, // Classic rich chocolate brown bowl cut
        roughness: 0.55,
        metalness: 0.08
      }),
      hoodie: new THREE.MeshStandardMaterial({
        color: 0x16a34a, // Vibrant Kelly green hoodie
        roughness: 0.65,
        metalness: 0.04
      }),
      hoodieRib: new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.7,
        metalness: 0.04
      }),
      emblemWhite: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.05
      }),
      emblemOrange: new THREE.MeshStandardMaterial({
        color: 0xea580c, // Bright orange Z
        roughness: 0.3,
        metalness: 0.1
      }),
      shorts: new THREE.MeshStandardMaterial({
        color: 0x2563eb, // Denim blue shorts
        roughness: 0.75,
        metalness: 0.06
      }),
      backpack: new THREE.MeshStandardMaterial({
        color: 0x854d0e, // Warm brown leather backpack
        roughness: 0.6,
        metalness: 0.12
      }),
      strap: new THREE.MeshStandardMaterial({
        color: 0x713f12,
        roughness: 0.65,
        metalness: 0.15
      }),
      sneakerOrange: new THREE.MeshStandardMaterial({
        color: 0xea580c, // Bright orange sneaker canvas
        roughness: 0.5,
        metalness: 0.05
      }),
      sneakerWhite: new THREE.MeshStandardMaterial({
        color: 0xf8fafc, // Clean rubber sole & toe cap
        roughness: 0.35,
        metalness: 0.05
      }),
      sock: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.7,
        metalness: 0.02
      }),
      watchBody: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.3,
        metalness: 0.8
      }),
      watchScreen: new THREE.MeshBasicMaterial({
        color: 0x00f0ff
      })
    };

    // Root Group
    this.mesh = new THREE.Group();
    this.mesh.name = 'ZuzuPixarCharacter';

    this.rootPivot = new THREE.Group();
    this.mesh.add(this.rootPivot);

    this.torsoGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.leftArmGroup = new THREE.Group();
    this.rightArmGroup = new THREE.Group();
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();
    this.backpackGroup = new THREE.Group();

    // Sockets
    this.rightHandSocket = new THREE.Group();
    this.leftHandSocket = new THREE.Group();
    this.activeHeldItemMesh = null;
    this.equippedArmor = { head: null, chest: null, legs: null, feet: null };

    // Build the complete body with exact ground-level feet at y = 0.00
    this.buildCharacter();

    // Scale to standard 1.8-block height in world
    const scaleFactor = 0.72 * this.options.scale;
    this.mesh.scale.setScalar(scaleFactor);

    this.animTime = 0;
  }

  buildCharacter() {
    // 1. Torso at y = 1.32
    this.torsoGroup.position.set(0, 1.32, 0);

    // Green Hoodie Body
    const torsoGeom = new THREE.CylinderGeometry(0.32, 0.29, 0.68, 20);
    torsoGeom.scale(1.15, 1.0, 0.85);
    const torsoMesh = new THREE.Mesh(torsoGeom, this.materials.hoodie);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Ribbed waist hem
    const hemGeom = new THREE.CylinderGeometry(0.31, 0.31, 0.08, 20);
    hemGeom.scale(1.16, 1.0, 0.86);
    hemGeom.translate(0, -0.34, 0);
    const hemMesh = new THREE.Mesh(hemGeom, this.materials.hoodieRib);
    this.torsoGroup.add(hemMesh);

    // Draped Hood on back of neck
    const hoodGeom = new THREE.SphereGeometry(0.24, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hoodGeom.rotateX(Math.PI * 0.65);
    hoodGeom.scale(1.1, 0.65, 0.9);
    const hoodMesh = new THREE.Mesh(hoodGeom, this.materials.hoodie);
    hoodMesh.position.set(0, 0.28, -0.18);
    this.torsoGroup.add(hoodMesh);

    // 3D PHYSICAL EMBLEM: Bright Orange "Z" with White Border
    const emblemGroup = new THREE.Group();
    emblemGroup.position.set(0, 0.06, 0.25);

    // White backing plate
    const plateGeom = new THREE.BoxGeometry(0.2, 0.22, 0.015);
    const plate = new THREE.Mesh(plateGeom, this.materials.emblemWhite);
    emblemGroup.add(plate);

    // Orange Z constructed from 3 bold bars
    const zGroup = new THREE.Group();
    zGroup.position.set(0, 0, 0.012);

    // Top bar
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.01), this.materials.emblemOrange);
    topBar.position.set(0, 0.065, 0);
    zGroup.add(topBar);

    // Diagonal bar
    const diagBar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.01), this.materials.emblemOrange);
    diagBar.rotation.z = -Math.PI / 4;
    zGroup.add(diagBar);

    // Bottom bar
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.01), this.materials.emblemOrange);
    botBar.position.set(0, -0.065, 0);
    zGroup.add(botBar);

    emblemGroup.add(zGroup);
    this.torsoGroup.add(emblemGroup);

    // White Hoodie Drawstrings
    [-0.07, 0.07].forEach((dx) => {
      const stringMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8),
        this.materials.emblemWhite
      );
      stringMesh.position.set(dx, 0.22, 0.25);
      this.torsoGroup.add(stringMesh);

      // Silver aglet tip
      const aglet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.035, 8),
        this.materials.strap
      );
      aglet.position.set(dx, 0.12, 0.25);
      this.torsoGroup.add(aglet);
    });

    this.rootPivot.add(this.torsoGroup);

    // 2. Head & Clean 3D Bowl Cut
    this.buildHead();

    // 3. Brown Leather Backpack
    this.buildBackpack();

    // 4. Arms & Smartwatch
    this.buildArms();

    // 5. Legs, Shorts & Orange Sneakers
    this.buildLegs();
  }

  buildHead() {
    this.headGroup.position.set(0, 0.44, 0);

    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.12, 0.13, 0.14, 16);
    const neckMesh = new THREE.Mesh(neckGeom, this.materials.skin);
    neckMesh.position.set(0, -0.02, 0);
    this.headGroup.add(neckMesh);

    // Cute rounded kid face block
    const headBox = new THREE.BoxGeometry(0.56, 0.58, 0.52, 6, 6, 6);
    const p = headBox.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.normalize().multiplyScalar(0.35);
      p.setXYZ(i, v.x * 0.96, v.y * 1.04, v.z * 0.98);
    }
    headBox.computeVertexNormals();

    const headMaterials = [
      this.materials.skin,
      this.materials.skin,
      this.materials.skin,
      this.materials.skin,
      this.materials.face, // Front face
      this.materials.skin
    ];

    const headMesh = new THREE.Mesh(headBox, headMaterials);
    headMesh.position.set(0, 0.28, 0);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Kid ears
    [-1, 1].forEach((side) => {
      const earGeom = new THREE.SphereGeometry(0.08, 12, 12);
      earGeom.scale(0.4, 0.9, 0.7);
      const earMesh = new THREE.Mesh(earGeom, this.materials.skin);
      earMesh.position.set(side * 0.35, 0.26, -0.02);
      earMesh.rotation.y = side * 0.2;
      this.headGroup.add(earMesh);
    });

    // 3D BOWL CUT
    this.buildBowlCut();

    this.torsoGroup.add(this.headGroup);
  }

  /**
   * Builds clean, stylish 3D Bowl Cut hair
   * Single continuous mathematical manifold geometry:
   * Covers front neatly above eyebrows, curves above ears, and wraps entire back down to neck.
   * Zero gaps, zero seams, zero distortion.
   */
  buildBowlCut() {
    this.hairGroup = new THREE.Group();

    // 1. Single Continuous Mathematical 3D Bowl Cut Geometry
    const geom = new THREE.BufferGeometry();
    const latSegments = 32;
    const lonSegments = 48;
    const radius = 0.36;

    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= latSegments; i++) {
      const vFraction = i / latSegments;

      for (let j = 0; j <= lonSegments; j++) {
        const uFraction = j / lonSegments;
        const lon = uFraction * Math.PI * 2;

        // lon = 0: front (+Z), lon = PI: back (-Z)
        const backFactor = (1 - Math.cos(lon)) * 0.5; // 0 at front, 1 at back
        const maxTheta = (0.44 + backFactor * 0.28) * Math.PI;

        const theta = vFraction * maxTheta;

        // Subtle soft rim thickening at the bottom edge
        const rimThick = (vFraction > 0.8) ? Math.sin((vFraction - 0.8) / 0.2 * Math.PI) * 0.015 : 0;
        const r = radius + rimThick;

        const x = r * Math.sin(theta) * Math.sin(lon);
        const y = r * Math.cos(theta);
        const z = r * Math.sin(theta) * Math.cos(lon);

        positions.push(x, y, z);
        uvs.push(uFraction, vFraction);
      }
    }

    const stride = lonSegments + 1;
    for (let i = 0; i < latSegments; i++) {
      for (let j = 0; j < lonSegments; j++) {
        const a = i * stride + j;
        const b = (i + 1) * stride + j;
        const c = (i + 1) * stride + (j + 1);
        const d = i * stride + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const hairMesh = new THREE.Mesh(geom, this.materials.hair);
    hairMesh.position.set(0, 0.32, 0);
    hairMesh.castShadow = true;
    hairMesh.receiveShadow = true;
    this.hairGroup.add(hairMesh);

    // 2. Soft Continuous Beveled Rim along the cut perimeter
    const rimPoints = [];
    const segments = 48;
    for (let j = 0; j <= segments; j++) {
      const lon = (j / segments) * Math.PI * 2;
      const backFactor = (1 - Math.cos(lon)) * 0.5;
      const maxTheta = (0.44 + backFactor * 0.28) * Math.PI;
      const r = 0.365;
      const x = r * Math.sin(maxTheta) * Math.sin(lon);
      const y = r * Math.cos(maxTheta);
      const z = r * Math.sin(maxTheta) * Math.cos(lon);
      rimPoints.push(new THREE.Vector3(x, y, z));
    }
    const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true);
    const rimTubeGeom = new THREE.TubeGeometry(rimCurve, 48, 0.016, 8, true);
    const rimTube = new THREE.Mesh(rimTubeGeom, this.materials.hair);
    rimTube.position.set(0, 0.32, 0);
    rimTube.castShadow = true;
    this.hairGroup.add(rimTube);

    this.headGroup.add(this.hairGroup);
  }

  buildBackpack() {
    this.backpackGroup.position.set(0, 0.06, -0.24);

    // Smooth clean leather backpack
    const bagGeom = new THREE.BoxGeometry(0.36, 0.42, 0.16);
    const bagMesh = new THREE.Mesh(bagGeom, this.materials.backpack);
    bagMesh.castShadow = true;
    this.backpackGroup.add(bagMesh);

    // Top leather flap
    const flapGeom = new THREE.BoxGeometry(0.38, 0.16, 0.18);
    const flapMesh = new THREE.Mesh(flapGeom, this.materials.strap);
    flapMesh.position.set(0, 0.14, -0.01);
    this.backpackGroup.add(flapMesh);

    // Brass buckle on flap
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.85 })
    );
    buckle.position.set(0, 0.08, -0.10);
    this.backpackGroup.add(buckle);

    // Front pocket
    const pouchGeom = new THREE.BoxGeometry(0.28, 0.18, 0.06);
    const pouchMesh = new THREE.Mesh(pouchGeom, this.materials.backpack);
    pouchMesh.position.set(0, -0.09, -0.10);
    this.backpackGroup.add(pouchMesh);

    // Shoulder straps
    [-0.14, 0.14].forEach((sx) => {
      const strapGeom = new THREE.BoxGeometry(0.055, 0.62, 0.025);
      const strap = new THREE.Mesh(strapGeom, this.materials.strap);
      strap.position.set(sx, 0.05, 0.15);
      strap.rotation.x = -0.15;
      this.torsoGroup.add(strap);
    });

    this.torsoGroup.add(this.backpackGroup);
  }

  buildArms() {
    [-1, 1].forEach((side) => {
      const armGroup = side === -1 ? this.leftArmGroup : this.rightArmGroup;
      armGroup.position.set(side * 0.42, 0.24, 0);

      const upperGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.36, 16);
      upperGeom.translate(0, -0.18, 0);
      const upperMesh = new THREE.Mesh(upperGeom, this.materials.hoodie);
      upperMesh.castShadow = true;
      armGroup.add(upperMesh);

      const cuffGeom = new THREE.CylinderGeometry(0.105, 0.095, 0.08, 16);
      cuffGeom.translate(0, -0.34, 0);
      const cuffMesh = new THREE.Mesh(cuffGeom, this.materials.hoodieRib);
      armGroup.add(cuffMesh);

      const forearmGroup = new THREE.Group();
      forearmGroup.position.set(0, -0.36, 0);

      const foreGeom = new THREE.CylinderGeometry(0.085, 0.075, 0.32, 16);
      foreGeom.translate(0, -0.14, 0);
      const foreMesh = new THREE.Mesh(foreGeom, this.materials.skin);
      foreMesh.castShadow = true;
      forearmGroup.add(foreMesh);

      // Smartwatch on left wrist
      if (side === -1) {
        const watchGroup = new THREE.Group();
        watchGroup.position.set(0, -0.12, 0.04);

        const watchBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.092, 0.092, 0.09, 16),
          this.materials.watchBody
        );
        watchGroup.add(watchBody);

        const screenGeom = new THREE.BoxGeometry(0.08, 0.07, 0.03);
        const screenMesh = new THREE.Mesh(screenGeom, this.materials.watchScreen);
        screenMesh.position.set(0, 0, 0.08);
        watchGroup.add(screenMesh);

        const watchLight = new THREE.PointLight(0x00f0ff, 0.8, 0.5);
        watchLight.position.set(0, 0, 0.12);
        watchGroup.add(watchLight);

        forearmGroup.add(watchGroup);
      }

      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.3, 0);

      const palmGeom = new THREE.BoxGeometry(0.12, 0.11, 0.07);
      palmGeom.translate(0, -0.04, 0);
      const palm = new THREE.Mesh(palmGeom, this.materials.skin);
      handGroup.add(palm);

      const thumbGeom = new THREE.CylinderGeometry(0.024, 0.022, 0.08, 8);
      thumbGeom.rotateZ(side * 0.6);
      thumbGeom.translate(side * 0.06, -0.02, 0.03);
      const thumb = new THREE.Mesh(thumbGeom, this.materials.skin);
      handGroup.add(thumb);

      const fingerGeom = new THREE.BoxGeometry(0.11, 0.06, 0.06);
      fingerGeom.translate(0, -0.11, 0);
      const fingers = new THREE.Mesh(fingerGeom, this.materials.skin);
      handGroup.add(fingers);

      if (side === 1) {
        this.rightHandSocket.position.set(0, -0.08, 0.02);
        this.rightHandSocket.rotation.x = Math.PI / 4;
        handGroup.add(this.rightHandSocket);
      } else {
        this.leftHandSocket.position.set(0, -0.08, 0.02);
        handGroup.add(this.leftHandSocket);
      }

      forearmGroup.add(handGroup);
      armGroup.add(forearmGroup);

      armGroup.rotation.z = side * -0.1;
      armGroup.rotation.x = 0.05;

      this.torsoGroup.add(armGroup);
    });
  }

  buildLegs() {
    [-1, 1].forEach((side) => {
      const legGroup = side === -1 ? this.leftLegGroup : this.rightLegGroup;
      legGroup.position.set(side * 0.18, -0.34, 0);

      // Denim Shorts
      const shortsGeom = new THREE.CylinderGeometry(0.14, 0.13, 0.38, 16);
      shortsGeom.translate(0, -0.19, 0);
      const shortsMesh = new THREE.Mesh(shortsGeom, this.materials.shorts);
      shortsMesh.castShadow = true;
      legGroup.add(shortsMesh);

      const hemGeom = new THREE.CylinderGeometry(0.145, 0.145, 0.06, 16);
      hemGeom.translate(0, -0.37, 0);
      const hemMesh = new THREE.Mesh(hemGeom, this.materials.shorts);
      legGroup.add(hemMesh);

      // Bare Knee & Calf
      const calfGroup = new THREE.Group();
      calfGroup.position.set(0, -0.38, 0);

      const legSkinGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.38, 16);
      legSkinGeom.translate(0, -0.19, 0);
      const legSkin = new THREE.Mesh(legSkinGeom, this.materials.skin);
      legSkin.castShadow = true;
      calfGroup.add(legSkin);

      // White Crew Socks
      const sockGeom = new THREE.CylinderGeometry(0.105, 0.1, 0.12, 16);
      sockGeom.translate(0, -0.34, 0);
      const sockMesh = new THREE.Mesh(sockGeom, this.materials.sock);
      calfGroup.add(sockMesh);

      // Orange & White Sneakers (Grounded at y = 0.00 exactly)
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.38, 0);

      const shoeGeom = new THREE.BoxGeometry(0.18, 0.16, 0.34, 2, 2, 2);
      shoeGeom.translate(0, 0.08, 0.06);
      const shoeMesh = new THREE.Mesh(shoeGeom, this.materials.sneakerOrange);
      shoeMesh.castShadow = true;
      shoeGroup.add(shoeMesh);

      const soleGeom = new THREE.BoxGeometry(0.2, 0.06, 0.37);
      soleGeom.translate(0, -0.03, 0.06);
      const soleMesh = new THREE.Mesh(soleGeom, this.materials.sneakerWhite);
      shoeGroup.add(soleMesh);

      const toeGeom = new THREE.SphereGeometry(0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      toeGeom.scale(1.0, 0.7, 1.1);
      const toeMesh = new THREE.Mesh(toeGeom, this.materials.sneakerWhite);
      toeMesh.position.set(0, 0.04, 0.2);
      shoeGroup.add(toeMesh);

      for (let lz = 0.04; lz <= 0.16; lz += 0.04) {
        const lace = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 0.015, 0.02),
          this.materials.sneakerWhite
        );
        lace.position.set(0, 0.14, lz);
        shoeGroup.add(lace);
      }

      calfGroup.add(shoeGroup);
      legGroup.add(calfGroup);

      this.torsoGroup.add(legGroup);
    });
  }

  setHeldItem(itemId) {
    if (this.activeHeldItemId === itemId && this.activeHeldItemMesh) return;
    this.activeHeldItemId = itemId;

    while (this.rightHandSocket.children.length > 0) {
      this.rightHandSocket.remove(this.rightHandSocket.children[0]);
    }
    this.activeHeldItemMesh = null;

    if (!itemId) return;

    const propGroup = new THREE.Group();

    if (itemId.includes('pickaxe')) {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8),
        this.materials.backpack
      );
      handle.position.set(0, 0.15, 0);

      const headGeom = new THREE.TorusGeometry(0.22, 0.03, 6, 12, Math.PI * 0.6);
      headGeom.rotateZ(-Math.PI * 0.8);
      const head = new THREE.Mesh(headGeom, new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 }));
      head.position.set(0, 0.4, 0);

      propGroup.add(handle);
      propGroup.add(head);
      propGroup.rotation.x = Math.PI / 2;
      propGroup.rotation.z = -Math.PI / 4;
    } else if (itemId.includes('sword')) {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8),
        this.materials.backpack
      );
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.55, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 })
      );
      blade.position.set(0, 0.38, 0);
      propGroup.add(handle);
      propGroup.add(blade);
      propGroup.rotation.x = Math.PI / 2;
    } else if (itemId.includes('torch')) {
      const stick = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.38, 0.05),
        this.materials.backpack
      );
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      flame.position.set(0, 0.2, 0);
      propGroup.add(stick);
      propGroup.add(flame);
      propGroup.rotation.x = Math.PI / 3;
    } else if (itemId.includes('lantern')) {
      const lanternBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.24, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 })
      );
      const glowCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      propGroup.add(lanternBox);
      propGroup.add(glowCore);
      propGroup.position.set(0, -0.15, 0);
    } else {
      const miniBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.18),
        this.materials.hoodie
      );
      propGroup.add(miniBlock);
    }

    this.activeHeldItemMesh = propGroup;
    this.rightHandSocket.add(propGroup);
  }

  setArmor(slot, armorType) {
    this.equippedArmor[slot] = armorType;
  }

  update(delta, time = 0, walkSpeed = 0, isMoving = false, isJumping = false, isMining = false) {
    this.animTime += delta;
    const t = this.animTime;

    // Idle Breathing
    const breath = Math.sin(t * 2.2) * 0.02;
    this.torsoGroup.position.y = 1.32 + breath;
    this.torsoGroup.scale.set(1.0 + breath * 0.4, 1.0 + breath * 0.8, 1.0 + breath * 0.4);

    // Subtle head tilt
    this.headGroup.rotation.y = Math.sin(t * 0.7) * 0.05;
    this.headGroup.rotation.x = Math.sin(t * 1.4) * 0.02;

    // Movement swing
    if (isMoving && walkSpeed > 0.1) {
      const freq = walkSpeed * 7.5;
      const legAngle = Math.sin(t * freq) * 0.6;
      const armAngle = Math.sin(t * freq) * 0.5;

      this.leftLegGroup.rotation.x = legAngle;
      this.rightLegGroup.rotation.x = -legAngle;

      if (!isMining) {
        this.leftArmGroup.rotation.x = -armAngle;
        this.rightArmGroup.rotation.x = armAngle;
      }

      this.torsoGroup.position.y += Math.abs(Math.sin(t * freq)) * 0.05;
      this.backpackGroup.rotation.x = Math.sin(t * freq) * 0.06;
    } else if (!isJumping) {
      this.leftLegGroup.rotation.x *= 0.85;
      this.rightLegGroup.rotation.x *= 0.85;
      if (!isMining) {
        this.leftArmGroup.rotation.x = Math.sin(t * 1.5) * 0.03;
        this.rightArmGroup.rotation.x = Math.sin(t * 1.5) * 0.03;
      }
      this.backpackGroup.rotation.x *= 0.9;
    }

    // Mining swing
    if (isMining) {
      const swingSpeed = t * 14;
      this.rightArmGroup.rotation.x = -Math.PI / 4 + Math.sin(swingSpeed) * 0.75;
      this.rightArmGroup.rotation.y = -Math.sin(swingSpeed) * 0.3;
    }

    // Jumping
    if (isJumping) {
      this.leftLegGroup.rotation.x = -0.35;
      this.rightLegGroup.rotation.x = 0.25;
      this.leftArmGroup.rotation.x = 0.5;
      this.rightArmGroup.rotation.x = -0.5;
    }
  }

  dispose() {
    this.faceTexture.dispose();
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
