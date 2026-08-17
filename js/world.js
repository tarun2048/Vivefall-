import * as THREE from 'three';

// Block ID declarations
export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  WOOD: 5,
  LEAVES: 6,
  SAND: 7,
  WATER: 8,
  GLASS: 9,
  CRAFTING_TABLE: 10,
  CHEST: 11,
  PLANKS: 12,
  BED_HEAD: 13,
  BED_FOOT: 14,
  CHERRY_LEAVES: 15,
  CHERRY_WOOD: 16,
  FLOWER_RED: 17,
  FLOWER_YELLOW: 18,
  FLOWER_BLUE: 19,
  FLOWER_PINK: 20,
  TORCH: 21,
  TNT: 22,
  REDSTONE_WIRE: 23,
  LEVER: 24,
  BUTTON: 25
};

// Define block characteristics
export const BLOCK_DEFS = {
  [BLOCK.AIR]: { name: 'Air', solid: false, transparent: true },
  [BLOCK.GRASS]: { name: 'Grass Block', solid: true, transparent: false, top: 0, side: 1, bottom: 2 },
  [BLOCK.DIRT]: { name: 'Dirt', solid: true, transparent: false, top: 2, side: 2, bottom: 2 },
  [BLOCK.STONE]: { name: 'Stone', solid: true, transparent: false, top: 3, side: 3, bottom: 3 },
  [BLOCK.COBBLESTONE]: { name: 'Cobblestone', solid: true, transparent: false, top: 4, side: 4, bottom: 4 },
  [BLOCK.WOOD]: { name: 'Wood Log', solid: true, transparent: false, top: 6, side: 5, bottom: 6 },
  [BLOCK.LEAVES]: { name: 'Leaves', solid: true, transparent: true, top: 7, side: 7, bottom: 7 },
  [BLOCK.SAND]: { name: 'Sand', solid: true, transparent: false, top: 8, side: 8, bottom: 8, gravity: true },
  [BLOCK.WATER]: { name: 'Water', solid: false, transparent: true, top: 9, side: 9, bottom: 9, liquid: true },
  [BLOCK.GLASS]: { name: 'Glass', solid: true, transparent: true, top: 10, side: 10, bottom: 10 },
  [BLOCK.CRAFTING_TABLE]: { name: 'Crafting Table', solid: true, transparent: false, top: 11, side: 12, bottom: 15 },
  [BLOCK.CHEST]: { name: 'Chest', solid: true, transparent: false, top: 14, side: 13, bottom: 13 },
  [BLOCK.PLANKS]: { name: 'Wooden Planks', solid: true, transparent: false, top: 15, side: 15, bottom: 15 },
  [BLOCK.BED_HEAD]: { name: 'Bed', solid: true, transparent: false, top: 16, side: 18, bottom: 15 },
  [BLOCK.BED_FOOT]: { name: 'Bed', solid: true, transparent: false, top: 17, side: 18, bottom: 15 },
  [BLOCK.CHERRY_LEAVES]: { name: 'Cherry Leaves', solid: true, transparent: true, top: 19, side: 19, bottom: 19 },
  [BLOCK.CHERRY_WOOD]: { name: 'Cherry Log', solid: true, transparent: false, top: 21, side: 20, bottom: 21 },
  [BLOCK.FLOWER_RED]: { name: 'Red Flower', solid: false, transparent: true, top: 22, side: 22, bottom: 22 },
  [BLOCK.FLOWER_YELLOW]: { name: 'Yellow Flower', solid: false, transparent: true, top: 23, side: 23, bottom: 23 },
  [BLOCK.FLOWER_BLUE]: { name: 'Blue Flower', solid: false, transparent: true, top: 24, side: 24, bottom: 24 },
  [BLOCK.FLOWER_PINK]: { name: 'Pink Flower', solid: false, transparent: true, top: 25, side: 25, bottom: 25 },
  [BLOCK.TORCH]: { name: 'Torch', solid: false, transparent: true, top: 26, side: 26, bottom: 26 },
  [BLOCK.TNT]: { name: 'TNT', solid: true, transparent: false, top: 27, side: 28, bottom: 27 },
  [BLOCK.REDSTONE_WIRE]: { name: 'Redstone Dust', solid: false, transparent: true, top: 29, side: 29, bottom: 29 },
  [BLOCK.LEVER]: { name: 'Lever', solid: false, transparent: true, top: 30, side: 30, bottom: 30 },
  [BLOCK.BUTTON]: { name: 'Button', solid: false, transparent: true, top: 31, side: 31, bottom: 31 }
};

export class World {
  static BLOCK = BLOCK;
  static BLOCK_DEFS = BLOCK_DEFS;

  constructor(engine) {
    this.engine = engine;
    this.chunkSize = 16;
    this.chunkHeight = 64;
    this.renderDistance = 4; // radius in chunks
    this.seaLevel = 20;

    this.chunks = new Map(); // Key: 'cx,cz' -> Chunk data
    this.decoratedChunks = new Set(); // Key: 'cx,cz' -> Chunks that generated decorations
    this.chunkMeshes = new Map(); // Key: 'cx,cz' -> THREE.Mesh
    this.modifications = {}; // Key: 'x,y,z' -> blockId

    this.textureAtlas = null;
    this.material = null;
    this.waterMaterial = null;
    
    // Create the procedural texture atlas and materials
    this.createTextureAtlas();
    
    // Keep track of active block placement adjustments to be processed by physics
    this.fallingBlocks = [];
    this.flowingWater = [];
    this.loadedTorches = new Map(); // Key: 'cx,cz' -> Array of {x, y, z} torch positions in that chunk
  }

  // Generates 64 pixel art textures on a single 512x512 canvas (8x8 grid of 64x64 tiles)
  createTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Helper to paint high-quality 2x2 noise-based textures with depth
    const paintNoise = (x, y, w, h, baseColor, noiseColors) => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(x, y, w, h);
      for (let px = 0; px < w; px += 2) {
        for (let py = 0; py < h; py += 2) {
          if (Math.random() > 0.4) {
            ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
            ctx.fillRect(x + px, y + py, 2, 2);
          }
        }
      }
    };

    const paintAO = (x, y, w, h) => {
      // Subtle top/left lighting, bottom/right shadow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x, y, w, 2);
      ctx.fillRect(x, y, 2, h);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(x, y + h - 2, w, 2);
      ctx.fillRect(x + w - 2, y, 2, h);
    };

    // Row 0
    // 0: Grass Top
    paintNoise(0, 0, 64, 64, '#5c8e32', ['#4d7529', '#70ab3e', '#3e5c21', '#669c37']);
    paintAO(0, 0, 64, 64);
    
    // 1: Grass Side
    paintNoise(64, 0, 64, 64, '#866043', ['#573d26', '#a0734f', '#6d4c33']);
    // Shaded grass top border hanging down
    ctx.fillStyle = '#3e5c21'; // Grass shadow border
    ctx.fillRect(64, 16, 64, 4);
    for (let dx = 64; dx < 128; dx += 8) {
      ctx.fillRect(dx, 16, 8, 4 + Math.floor(Math.random() * 3) * 2);
    }
    ctx.fillStyle = '#5c8e32'; // Grass top border
    ctx.fillRect(64, 0, 64, 16);
    for (let dx = 64; dx < 128; dx += 8) {
      const h = 16 + Math.floor(Math.random() * 3) * 4;
      ctx.fillRect(dx, 0, 8, h);
    }
    paintAO(64, 0, 64, 64);
    
    // 2: Dirt
    paintNoise(128, 0, 64, 64, '#866043', ['#573d26', '#a0734f', '#44301e', '#755339']);
    paintAO(128, 0, 64, 64);

    // 3: Stone
    paintNoise(192, 0, 64, 64, '#7c7c7c', ['#525252', '#939393', '#676767', '#8a8a8a']);
    // Draw raw stone fissures
    ctx.fillStyle = '#444444';
    ctx.fillRect(192 + 8, 12, 16, 2);
    ctx.fillRect(192 + 24, 14, 2, 8);
    ctx.fillRect(192 + 36, 44, 18, 2);
    ctx.fillRect(192 + 12, 32, 2, 12);
    paintAO(192, 0, 64, 64);

    // 4: Cobblestone
    paintNoise(256, 0, 64, 64, '#757575', ['#454545', '#919191', '#545454', '#828282']);
    // Cobblestone brick borders
    ctx.fillStyle = '#2d2d2d'; // Shadow/mortar lines
    ctx.fillRect(256, 12, 64, 2);
    ctx.fillRect(256, 28, 64, 2);
    ctx.fillRect(256, 44, 64, 2);
    ctx.fillRect(256, 60, 64, 2);
    
    ctx.fillRect(256 + 16, 0, 2, 12);
    ctx.fillRect(256 + 48, 0, 2, 12);
    ctx.fillRect(256 + 32, 12, 2, 16);
    ctx.fillRect(256 + 12, 28, 2, 16);
    ctx.fillRect(256 + 44, 28, 2, 16);
    ctx.fillRect(256 + 28, 44, 2, 16);
    
    // Highlights
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(256 + 2, 2, 10, 2);
    ctx.fillRect(256 + 18, 14, 12, 2);
    ctx.fillRect(256 + 2, 30, 8, 2);
    ctx.fillRect(256 + 30, 46, 12, 2);
    paintAO(256, 0, 64, 64);

    // 5: Wood Side
    paintNoise(320, 0, 64, 64, '#5c4033', ['#3c271c', '#755444', '#4b3328']);
    // Bark vertical grooves
    ctx.fillStyle = '#22140e';
    ctx.fillRect(320 + 8, 0, 4, 64);
    ctx.fillRect(320 + 24, 0, 6, 64);
    ctx.fillRect(320 + 44, 0, 4, 64);
    ctx.fillRect(320 + 56, 0, 4, 64);
    // Bark highlights
    ctx.fillStyle = '#825e4d';
    ctx.fillRect(320 + 12, 0, 2, 64);
    ctx.fillRect(320 + 30, 0, 2, 64);
    ctx.fillRect(320 + 48, 0, 2, 64);
    paintAO(320, 0, 64, 64);

    // 6: Wood Top
    paintNoise(384, 0, 64, 64, '#dfbe9f', ['#ccaa88', '#d0ac8b']);
    // Concentric growth rings
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 3;
    ctx.strokeRect(388, 4, 56, 56);
    ctx.strokeRect(396, 12, 40, 40);
    ctx.strokeRect(404, 20, 24, 24);
    ctx.strokeRect(412, 28, 8, 8);
    // Darker log outer bark boundary
    ctx.strokeStyle = '#3c271c';
    ctx.lineWidth = 4;
    ctx.strokeRect(384, 0, 64, 64);
    paintAO(384, 0, 64, 64);

    // 7: Leaves
    paintNoise(448, 0, 64, 64, '#1b4d18', ['#10350d', '#286f24', '#0d220b', '#358a30']);
    paintAO(448, 0, 64, 64);

    // Row 1
    // 8: Sand
    paintNoise(0, 64, 64, 64, '#dfd59f', ['#cfc38c', '#ebdca7', '#d0c386']);
    // Sand ripples
    ctx.fillStyle = '#bfae70';
    ctx.fillRect(0, 76, 20, 2);
    ctx.fillRect(32, 84, 24, 2);
    ctx.fillRect(10, 100, 30, 2);
    ctx.fillRect(40, 114, 24, 2);
    paintAO(0, 64, 64, 64);

    // 9: Water
    paintNoise(64, 64, 64, 64, '#4070da', ['#355db5', '#5783eb', '#3f67cc', '#4f7beb']);
    // Wave highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(68, 72, 12, 2);
    ctx.fillRect(96, 80, 8, 2);
    ctx.fillRect(80, 96, 16, 2);
    ctx.fillRect(104, 112, 12, 2);
    paintAO(64, 64, 64, 64);

    // 10: Glass
    ctx.clearRect(128, 64, 64, 64);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(128, 64, 64, 64);
    ctx.fillStyle = '#ffffff';
    // Glass borders
    ctx.fillRect(128, 64, 64, 4);
    ctx.fillRect(128, 124, 64, 4);
    ctx.fillRect(128, 64, 4, 64);
    ctx.fillRect(188, 64, 4, 64);
    // Shiny glare streaks
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(138, 74, 8, 4);
    ctx.fillRect(144, 78, 4, 8);
    ctx.fillRect(158, 94, 16, 4);
    ctx.fillRect(170, 98, 4, 12);

    // 11: Crafting Table Top
    paintNoise(192, 64, 64, 64, '#ab7a4e', ['#7d512a', '#c7986b', '#96673d']);
    ctx.strokeStyle = '#3d2511';
    ctx.lineWidth = 4;
    ctx.strokeRect(196, 68, 56, 56);
    ctx.beginPath();
    ctx.moveTo(224, 64); ctx.lineTo(224, 128);
    ctx.moveTo(192, 96); ctx.lineTo(256, 96);
    ctx.stroke();
    // Tiny tool carvings
    ctx.fillStyle = '#3a210d';
    ctx.fillRect(202, 74, 8, 8);
    ctx.fillRect(238, 106, 10, 6);
    paintAO(192, 64, 64, 64);

    // 12: Crafting Table Side
    paintNoise(256, 64, 64, 64, '#9e6e43', ['#6e4726', '#ab7a4e']);
    ctx.fillStyle = '#3d2511'; // Planks texture lines
    ctx.fillRect(256, 76, 64, 4);
    ctx.fillRect(256, 112, 64, 4);
    // Draw hanging tools (saw & hammer)
    ctx.fillStyle = '#555555';
    ctx.fillRect(272, 84, 4, 16); // saw blade
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(270, 80, 8, 4);  // saw handle
    ctx.fillStyle = '#777';
    ctx.fillRect(296, 80, 10, 6);  // hammer head
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(300, 86, 2, 14);  // hammer handle
    paintAO(256, 64, 64, 64);

    // 13: Chest Side
    paintNoise(320, 64, 64, 64, '#7a4e2b', ['#533218', '#a06a3f', '#663f20']);
    ctx.fillStyle = '#3a210d';
    ctx.strokeRect(322, 66, 60, 60);
    // Metal strap corners
    ctx.fillStyle = '#373737';
    ctx.fillRect(324, 64, 6, 64);
    ctx.fillRect(374, 64, 6, 64);
    // Lock plate
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(348, 88, 8, 12);
    ctx.fillStyle = '#ffd700'; // gold latch pin
    ctx.fillRect(350, 94, 4, 4);
    paintAO(320, 64, 64, 64);

    // 14: Chest Top
    paintNoise(384, 64, 64, 64, '#7a4e2b', ['#533218', '#a06a3f']);
    ctx.fillStyle = '#3a210d';
    ctx.strokeRect(386, 66, 60, 60);
    // Metal corner bands
    ctx.fillStyle = '#373737';
    ctx.fillRect(388, 64, 6, 64);
    ctx.fillRect(438, 64, 6, 64);
    ctx.fillRect(384, 68, 64, 6);
    ctx.fillRect(384, 118, 64, 6);
    paintAO(384, 64, 64, 64);

    // 15: Planks
    paintNoise(448, 64, 64, 64, '#ab7a4e', ['#7d512a', '#c7986b', '#96673d']);
    ctx.fillStyle = '#3d2511'; // Planks separations
    ctx.fillRect(448, 76, 64, 4);
    ctx.fillRect(448, 92, 64, 4);
    ctx.fillRect(448, 108, 64, 4);
    // Vertical seams
    ctx.fillRect(480, 64, 4, 12);
    ctx.fillRect(464, 80, 4, 12);
    ctx.fillRect(496, 96, 4, 12);
    ctx.fillRect(472, 112, 4, 16);
    paintAO(448, 64, 64, 64);

    // Row 2
    // 16: Bed Top Head
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(0, 128, 64, 64);
    ctx.fillStyle = '#eeeeee'; // white pillow
    ctx.fillRect(8, 136, 48, 18);
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(12, 150, 40, 2);
    paintAO(0, 128, 64, 64);
    
    // 17: Bed Top Foot
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(64, 128, 64, 64);
    ctx.fillStyle = '#aa1111'; // quilt folds
    ctx.fillRect(64, 144, 64, 4);
    ctx.fillRect(64, 168, 64, 4);
    paintAO(64, 128, 64, 64);

    // 18: Bed Side
    ctx.fillStyle = '#ab7a4e'; // wood frame
    ctx.fillRect(128, 128, 64, 64);
    ctx.fillStyle = '#cc2222'; // red quilt hanging down
    ctx.fillRect(128, 128, 64, 20);
    ctx.fillStyle = '#eeeeee'; // white pillow side
    ctx.fillRect(128 + 44, 128, 20, 12);
    ctx.fillStyle = '#3d2511'; // bed posts
    ctx.fillRect(128 + 4, 128 + 48, 8, 16);
    ctx.fillRect(128 + 52, 128 + 48, 8, 16);
    paintAO(128, 128, 64, 64);

    // 19: Cherry Leaves
    paintNoise(192, 128, 64, 64, '#ffb7d5', ['#ff8da1', '#ffa4b8', '#ffccd5', '#f8bbd0']);
    paintAO(192, 128, 64, 64);
    
    // 20: Cherry Log Side
    paintNoise(256, 128, 64, 64, '#4a2711', ['#5c341a', '#30160a', '#3e1c0c', '#6d3f21']);
    ctx.fillStyle = '#220e05';
    ctx.fillRect(256 + 8, 128, 4, 64);
    ctx.fillRect(256 + 24, 128, 6, 64);
    ctx.fillRect(256 + 44, 128, 4, 64);
    ctx.fillRect(256 + 56, 128, 4, 64);
    ctx.fillStyle = '#804020';
    ctx.fillRect(256 + 12, 128, 2, 64);
    ctx.fillRect(256 + 30, 128, 2, 64);
    ctx.fillRect(256 + 48, 128, 2, 64);
    paintAO(256, 128, 64, 64);

    // 21: Cherry Log Top
    paintNoise(320, 128, 64, 64, '#ffd1dc', ['#fbc6d3', '#ffa6c9']);
    ctx.strokeStyle = '#e67399';
    ctx.lineWidth = 3;
    ctx.strokeRect(324, 132, 56, 56);
    ctx.strokeRect(332, 140, 40, 40);
    ctx.strokeRect(340, 148, 24, 24);
    ctx.strokeRect(348, 156, 8, 8);
    ctx.strokeStyle = '#30160a';
    ctx.lineWidth = 4;
    ctx.strokeRect(320, 128, 64, 64);
    paintAO(320, 128, 64, 64);

    const drawFlower = (fx, fy, stemColor, petalColor, centerColor) => {
      ctx.clearRect(fx, fy, 64, 64);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(fx, fy, 64, 64);
      ctx.fillStyle = stemColor;
      ctx.fillRect(fx + 30, fy + 24, 4, 40);
      ctx.fillRect(fx + 24, fy + 36, 6, 4);
      ctx.fillRect(fx + 34, fy + 44, 6, 4);
      ctx.fillStyle = petalColor;
      ctx.fillRect(fx + 22, fy + 16, 20, 12);
      ctx.fillRect(fx + 26, fy + 8, 12, 28);
      ctx.fillStyle = centerColor;
      ctx.fillRect(fx + 30, fy + 16, 4, 4);
    };

    // 22: Red Flower
    drawFlower(384, 128, '#2e7d32', '#d32f2f', '#ffeb3b');
    // 23: Yellow Flower
    drawFlower(448, 128, '#2e7d32', '#fbc02d', '#f57c00');
    // 24: Blue Flower
    drawFlower(0, 192, '#2e7d32', '#1976d2', '#ffeb3b');
    // 25: Pink Flower
    drawFlower(64, 192, '#2e7d32', '#ec407a', '#ffeb3b');
    
    // 26: Torch
    ctx.clearRect(128, 192, 64, 64);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(128, 192, 64, 64);
    // Draw wood post
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(128 + 26, 192 + 22, 12, 32);
    ctx.fillStyle = '#6d4520'; // shadow post
    ctx.fillRect(128 + 26, 192 + 38, 12, 6);
    // Draw charcoal top
    ctx.fillStyle = '#222222';
    ctx.fillRect(128 + 24, 192 + 16, 16, 6);
    // Draw burning flame particles
    ctx.fillStyle = '#ff7700'; // outer flame
    ctx.fillRect(128 + 20, 192 + 2, 24, 14);
    ctx.fillStyle = '#ffcc00'; // inner flame
    ctx.fillRect(128 + 26, 192 + 6, 12, 8);
    ctx.fillStyle = '#ffffff'; // core heat
    ctx.fillRect(128 + 30, 192 + 8, 4, 4);

    // 27: TNT Top & Bottom
    paintNoise(192, 192, 64, 64, '#d32f2f', ['#b71c1c', '#f44336']);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(192 + 16, 192 + 16, 32, 32);
    ctx.fillStyle = '#000000';
    ctx.fillRect(192 + 28, 192 + 28, 8, 8);
    paintAO(192, 192, 64, 64);

    // 28: TNT Side
    paintNoise(256, 192, 64, 64, '#d32f2f', ['#b71c1c', '#f44336']);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(256, 192 + 20, 64, 24);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TNT', 256 + 32, 192 + 38);
    paintAO(256, 192, 64, 64);

    // 29: Redstone Dust Wire
    ctx.clearRect(320, 192, 64, 64);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(320 + 24, 192, 16, 64);
    ctx.fillRect(320, 192 + 24, 64, 16);
    ctx.fillStyle = '#ff7777';
    ctx.fillRect(320 + 28, 192 + 28, 8, 8);

    // 30: Lever
    ctx.clearRect(384, 192, 64, 64);
    ctx.fillStyle = '#757575';
    ctx.fillRect(384 + 16, 192 + 44, 32, 16);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(384 + 28, 192 + 12, 8, 32);
    ctx.fillStyle = '#333333';
    ctx.fillRect(384 + 26, 192 + 6, 12, 10);

    // 31: Button
    ctx.clearRect(448, 192, 64, 64);
    ctx.fillStyle = '#999999';
    ctx.fillRect(448 + 16, 192 + 20, 32, 24);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 4;
    ctx.strokeRect(448 + 16, 192 + 20, 32, 24);

    this.textureAtlas = new THREE.CanvasTexture(canvas);
    this.textureAtlas.magFilter = THREE.NearestFilter;
    this.textureAtlas.minFilter = THREE.NearestFilter;

    // Solid Materials (opaque blocks)
    this.material = new THREE.MeshLambertMaterial({
      map: this.textureAtlas,
      side: THREE.FrontSide
    });

    // Transparent materials (glass, leaves)
    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: this.textureAtlas,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1
    });

    // Liquid Materials (water) - shiny standard material for realistic reflections
    this.waterMaterial = new THREE.MeshStandardMaterial({
      map: this.textureAtlas,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.62,
      roughness: 0.15,
      metalness: 0.1,
      color: 0x3d70e0
    });
  }

  // Get block ID at world coordinates
  getBlock(x, y, z) {
    const cx = Math.floor(x / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    const chunkKey = `${cx},${cz}`;
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return BLOCK.AIR;

    const lx = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
    const lz = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

    if (y < 0 || y >= this.chunkHeight) return BLOCK.AIR;
    
    return chunk[(lx * this.chunkSize + lz) * this.chunkHeight + y];
  }

  // Set block ID at world coordinates and regenerate local chunk mesh
  setBlock(x, y, z, blockId, updateMesh = true) {
    const cx = Math.floor(x / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    const chunkKey = `${cx},${cz}`;
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return false;

    const lx = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
    const lz = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

    if (y < 0 || y >= this.chunkHeight) return false;
    
    const index = (lx * this.chunkSize + lz) * this.chunkHeight + y;
    const oldBlock = chunk[index];
    chunk[index] = blockId;

    // Update loaded torches cache
    if (blockId === BLOCK.TORCH) {
      if (!this.loadedTorches.has(chunkKey)) {
        this.loadedTorches.set(chunkKey, []);
      }
      const list = this.loadedTorches.get(chunkKey);
      if (!list.some(t => t.x === x && t.y === y && t.z === z)) {
        list.push({ x, y, z });
      }
    } else if (oldBlock === BLOCK.TORCH) {
      const list = this.loadedTorches.get(chunkKey);
      if (list) {
        const idx = list.findIndex(t => t.x === x && t.y === y && t.z === z);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
      }
    }

    // Track block modification
    this.modifications[`${x},${y},${z}`] = blockId;

    if (updateMesh) {
      this.generateChunkMesh(cx, cz);
      
      // Update adjacent chunk meshes if block is on the border
      if (lx === 0) this.generateChunkMesh(cx - 1, cz);
      if (lx === this.chunkSize - 1) this.generateChunkMesh(cx + 1, cz);
      if (lz === 0) this.generateChunkMesh(cx, cz - 1);
      if (lz === this.chunkSize - 1) this.generateChunkMesh(cx, cz + 1);
    }

    // Trigger physics triggers for this block
    this.triggerBlockUpdates(x, y, z, blockId, oldBlock);
    return true;
  }

  // Trigger sand falling or water flowing around a newly modified block
  triggerBlockUpdates(x, y, z, blockId, oldBlock) {
    // Check neighbor blocks (above, sides) to see if they need updates
    this.checkBlockStability(x, y + 1, z);
    this.checkBlockStability(x + 1, y, z);
    this.checkBlockStability(x - 1, y, z);
    this.checkBlockStability(x, y, z + 1);
    this.checkBlockStability(x, y, z - 1);

    // Also check self if placed sand or water
    this.checkBlockStability(x, y, z);
  }

  checkBlockStability(x, y, z) {
    const bid = this.getBlock(x, y, z);
    if (BLOCK_DEFS[bid]?.gravity) {
      if (!this.fallingBlocks.some(b => b.x === x && b.y === y && b.z === z)) {
        this.fallingBlocks.push({ x, y, z });
      }
    }
    if (BLOCK_DEFS[bid]?.liquid) {
      if (!this.flowingWater.some(b => b.x === x && b.y === y && b.z === z)) {
        this.flowingWater.push({ x, y, z });
      }
    }
  }

  // Get terrain height for spawning
  getTerrainHeight(x, z) {
    const noise = this.engine.noise;
    
    // Determine biome first
    const biome = this.getBiome(x, z);
    let height = 24; // baseline height

    if (biome === 'desert') {
      const hn = noise.fbm2D(x * 0.008, z * 0.008, 2) * 8;
      height += hn; // desert is flat with minor dunes
    } else if (biome === 'forest') {
      const hn = noise.fbm2D(x * 0.012, z * 0.012, 4) * 18;
      height += hn + 4; // forest is hilly
    } else if (biome === 'cherry_blossom') {
      const hn = noise.fbm2D(x * 0.01, z * 0.01, 3) * 12;
      height += hn + 2; // cherry blossom biome is rolling pink hills
    } else if (biome === 'floral') {
      const hn = noise.fbm2D(x * 0.006, z * 0.006, 3) * 7;
      height += hn; // floral biome is relatively flat meadow
    } else { // plains
      const hn = noise.fbm2D(x * 0.005, z * 0.005, 3) * 6;
      height += hn; // plains is relatively flat
    }
    
    return Math.floor(height);
  }

  // Resolve Biome type
  getBiome(x, z) {
    const noise = this.engine.noise;
    // Biome weight determines dryness vs green forest
    const moisture = noise.noise2D(x * 0.003, z * 0.003); // range [-1, 1]
    const temperature = noise.noise2D((x + 1000) * 0.003, (z + 1000) * 0.003); // range [-1, 1]
    
    if (temperature > 0.4 && moisture < -0.2) {
      return 'desert';
    } else if (temperature > 0.2 && moisture > 0.4) {
      return 'cherry_blossom';
    } else if (temperature < -0.1 && moisture > 0.1) {
      return 'forest';
    } else if (temperature > 0.0 && moisture > 0.0 && moisture <= 0.4) {
      return 'floral';
    } else {
      return 'plains';
    }
  }

  // Ensure a chunk is allocated and has basic terrain blocks (but no decorations yet)
  ensureChunkExists(cx, cz) {
    const chunkKey = `${cx},${cz}`;
    if (this.chunks.has(chunkKey)) {
      return this.chunks.get(chunkKey);
    }

    const chunk = new Uint8Array(this.chunkSize * this.chunkSize * this.chunkHeight);
    this.chunks.set(chunkKey, chunk);

    // Fill blocks based on height map noise
    for (let lx = 0; lx < this.chunkSize; lx++) {
      for (let lz = 0; lz < this.chunkSize; lz++) {
        const wx = cx * this.chunkSize + lx;
        const wz = cz * this.chunkSize + lz;

        const groundY = this.getTerrainHeight(wx, wz);
        const biome = this.getBiome(wx, wz);

        for (let y = 0; y < this.chunkHeight; y++) {
          const index = (lx * this.chunkSize + lz) * this.chunkHeight + y;
          
          if (y === 0) {
            chunk[index] = BLOCK.STONE; // Bedrock bottom
          } else if (y <= groundY) {
            // Under ground
            if (y === groundY) {
              // Surface block
              if (biome === 'desert') {
                chunk[index] = BLOCK.SAND;
              } else {
                chunk[index] = BLOCK.GRASS;
              }
            } else if (y > groundY - 4) {
              // Subsurface block
              if (biome === 'desert') {
                chunk[index] = BLOCK.SAND;
              } else {
                chunk[index] = BLOCK.DIRT;
              }
            } else {
              chunk[index] = BLOCK.STONE; // deep stone
            }
          } else {
            // Above ground, check for water
            if (y <= this.seaLevel) {
              // Water block
              if (biome === 'desert') {
                chunk[index] = BLOCK.AIR; // Deserts don't fill with low sea level ponds
              } else {
                chunk[index] = BLOCK.WATER;
              }
            } else {
              chunk[index] = BLOCK.AIR;
            }
          }
        }
      }
    }
    return chunk;
  }

  // Generate blocks in a chunk
  generateChunkData(cx, cz) {
    const chunkKey = `${cx},${cz}`;
    
    // Ensure basic terrain is initialized
    this.ensureChunkExists(cx, cz);

    // Run decorations only once per chunk
    if (!this.decoratedChunks.has(chunkKey)) {
      this.decoratedChunks.add(chunkKey);
      if (this.engine.structures) {
        this.engine.structures.generateDecorations(cx, cz);
      }
    }

    // Apply player block modifications for this chunk!
    const chunk = this.chunks.get(chunkKey);
    if (chunk) {
      for (const [posKey, blockId] of Object.entries(this.modifications)) {
        const [x, y, z] = posKey.split(',').map(Number);
        const ccx = Math.floor(x / this.chunkSize);
        const ccz = Math.floor(z / this.chunkSize);
        if (ccx === cx && ccz === cz) {
          const lx = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
          const lz = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
          if (y >= 0 && y < this.chunkHeight) {
            const index = (lx * this.chunkSize + lz) * this.chunkHeight + y;
            chunk[index] = blockId;
          }
        }
      }
    }
  }

  // Optimized chunk geometry builder. Emits faces exposed to transparency
  generateChunkMesh(cx, cz) {
    const chunkKey = `${cx},${cz}`;
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return;

    const chunkTorches = [];

    // Remove old mesh if exists
    const oldMesh = this.chunkMeshes.get(chunkKey);
    if (oldMesh) {
      this.engine.scene.remove(oldMesh);
      oldMesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
      });
      this.chunkMeshes.delete(chunkKey);
    }

    // Lists to accumulate solid and transparent geometry separately
    // We will generate TWO geometries: one for Solid blocks and one for Opaque/Transparent/Water
    const solidData = { positions: [], normals: [], uvs: [] };
    const transData = { positions: [], normals: [], uvs: [] };
    const waterData = { positions: [], normals: [], uvs: [] };

    // Offsets for 6 faces
    const faces = [
      { dir: [0, 1, 0],  uvRow: 'top',    verts: [ [0,1,1], [1,1,1], [0,1,0], [1,1,0] ], norm: [0, 1, 0] },    // Up
      { dir: [0, -1, 0], uvRow: 'bottom', verts: [ [0,0,0], [1,0,0], [0,0,1], [1,0,1] ], norm: [0, -1, 0] },   // Down
      { dir: [-1, 0, 0], uvRow: 'side',   verts: [ [0,0,0], [0,0,1], [0,1,0], [0,1,1] ], norm: [-1, 0, 0] },   // Left (West)
      { dir: [1, 0, 0],  uvRow: 'side',   verts: [ [1,0,1], [1,0,0], [1,1,1], [1,1,0] ], norm: [1, 0, 0] },    // Right (East)
      { dir: [0, 0, -1], uvRow: 'side',   verts: [ [1,0,0], [0,0,0], [1,1,0], [0,1,0] ], norm: [0, 0, -1] },   // Back (North)
      { dir: [0, 0, 1],  uvRow: 'side',   verts: [ [0,0,1], [1,0,1], [0,1,1], [1,1,1] ], norm: [0, 0, 1] }     // Front (South)
    ];

    for (let lx = 0; lx < this.chunkSize; lx++) {
      for (let lz = 0; lz < this.chunkSize; lz++) {
        const wx = cx * this.chunkSize + lx;
        const wz = cz * this.chunkSize + lz;

        for (let y = 0; y < this.chunkHeight; y++) {
          const index = (lx * this.chunkSize + lz) * this.chunkHeight + y;
          const blockId = chunk[index];

          if (blockId === BLOCK.AIR) continue;

          const def = BLOCK_DEFS[blockId];
          const isLiquid = def.liquid;
          const isTransparent = def.transparent;

          const isFlower = blockId === BLOCK.FLOWER_RED || blockId === BLOCK.FLOWER_YELLOW || blockId === BLOCK.FLOWER_BLUE || blockId === BLOCK.FLOWER_PINK;
          if (isFlower) {
            const list = transData;
            let tileIndex = def.top;
            const tileCol = tileIndex % 8;
            const tileRow = Math.floor(tileIndex / 8);
            const u0 = tileCol / 8 + 0.0005;
            const u1 = (tileCol + 1) / 8 - 0.0005;
            const v0 = (7 - tileRow) / 8 + 0.0005;
            const v1 = (8 - tileRow) / 8 - 0.0005;

            // Diagonal 1
            list.positions.push(
              wx, y, wz,
              wx + 1, y, wz + 1,
              wx, y + 1, wz,
              
              wx, y + 1, wz,
              wx + 1, y, wz + 1,
              wx + 1, y + 1, wz + 1
            );

            // Diagonal 2
            list.positions.push(
              wx + 1, y, wz,
              wx, y, wz + 1,
              wx + 1, y + 1, wz,
              
              wx + 1, y + 1, wz,
              wx, y, wz + 1,
              wx, y + 1, wz + 1
            );

            const norm1 = [0.707, 0, -0.707];
            const norm2 = [0.707, 0, 0.707];
            list.normals.push(...norm1, ...norm1, ...norm1, ...norm1, ...norm1, ...norm1);
            list.normals.push(...norm2, ...norm2, ...norm2, ...norm2, ...norm2, ...norm2);

            list.uvs.push(
              u0, v0, u1, v0, u0, v1,
              u0, v1, u1, v0, u1, v1,
              
              u0, v0, u1, v0, u0, v1,
              u0, v1, u1, v0, u1, v1
            );
            continue;
          }

          const isTorch = blockId === BLOCK.TORCH;
          if (isTorch) {
            chunkTorches.push({ x: wx, y: y, z: wz });
            const list = transData;
            
            // --- Part 1: Wooden Stick ---
            // Use Wood Log Side texture (tile index 5)
            const stickTile = 5;
            const sCol = stickTile % 8;
            const sRow = Math.floor(stickTile / 8);
            const su0 = sCol / 8 + 0.005;
            const su1 = (sCol + 1) / 8 - 0.005;
            const sv0 = (7 - sRow) / 8 + 0.005;
            const sv1 = (8 - sRow) / 8 - 0.005;

            const sx0 = wx + 0.46, sx1 = wx + 0.54;
            const sz0 = wz + 0.46, sz1 = wz + 0.54;
            const sy0 = y, sy1 = y + 0.42;

            const stickFaces = [
              // Up
              { verts: [ [sx0,sy1,sz1], [sx1,sy1,sz1], [sx0,sy1,sz0], [sx1,sy1,sz0] ], norm: [0, 1, 0] },
              // Down
              { verts: [ [sx0,sy0,sz0], [sx1,sy0,sz0], [sx0,sy0,sz1], [sx1,sy0,sz1] ], norm: [0, -1, 0] },
              // Left
              { verts: [ [sx0,sy0,sz0], [sx0,sy0,sz1], [sx0,sy1,sz0], [sx0,sy1,sz1] ], norm: [-1, 0, 0] },
              // Right
              { verts: [ [sx1,sy0,sz1], [sx1,sy0,sz0], [sx1,sy1,sz1], [sx1,sy1,sz0] ], norm: [1, 0, 0] },
              // Back
              { verts: [ [sx1,sy0,sz0], [sx0,sy0,sz0], [sx1,sy1,sz0], [sx0,sy1,sz0] ], norm: [0, 0, -1] },
              // Front
              { verts: [ [sx0,sy0,sz1], [sx1,sy0,sz1], [sx0,sy1,sz1], [sx1,sy1,sz1] ], norm: [0, 0, 1] }
            ];

            for (let tf = 0; tf < stickFaces.length; tf++) {
              const tface = stickFaces[tf];
              const tv = tface.verts;
              list.positions.push(...tv[0], ...tv[1], ...tv[2]);
              list.positions.push(...tv[2], ...tv[1], ...tv[3]);
              for (let i = 0; i < 6; i++) list.normals.push(...tface.norm);
              list.uvs.push(
                su0, sv0, su1, sv0, su0, sv1,
                su0, sv1, su1, sv0, su1, sv1
              );
            }

            // --- Part 2: Burning Flame Top ---
            // Use Torch texture (tile index 26)
            const flameTile = 26;
            const fCol = flameTile % 8;
            const fRow = Math.floor(flameTile / 8);
            
            // Map strictly to the burning flame sprite area inside the tile
            const fu0 = (fCol + 20/64) / 8;
            const fu1 = (fCol + 44/64) / 8;
            const fv0 = (7 - fRow + 48/64) / 8;
            const fv1 = (7 - fRow + 62/64) / 8;

            const fx0 = wx + 0.42, fx1 = wx + 0.58;
            const fz0 = wz + 0.42, fz1 = wz + 0.58;
            const fy0 = y + 0.42, fy1 = y + 0.62;

            const flameFaces = [
              // Up
              { verts: [ [fx0,fy1,fz1], [fx1,fy1,fz1], [fx0,fy1,fz0], [fx1,fy1,fz0] ], norm: [0, 1, 0] },
              // Down
              { verts: [ [fx0,fy0,fz0], [fx1,fy0,fz0], [fx0,fy0,fz1], [fx1,fy0,fz1] ], norm: [0, -1, 0] },
              // Left
              { verts: [ [fx0,fy0,fz0], [fx0,fy0,fz1], [fx0,fy1,fz0], [fx0,fy1,fz1] ], norm: [-1, 0, 0] },
              // Right
              { verts: [ [fx1,fy0,fz1], [fx1,fy0,fz0], [fx1,fy1,fz1], [fx1,fy1,fz0] ], norm: [1, 0, 0] },
              // Back
              { verts: [ [fx1,fy0,fz0], [fx0,fy0,fz0], [fx1,fy1,fz0], [fx0,fy1,fz0] ], norm: [0, 0, -1] },
              // Front
              { verts: [ [fx0,fy0,fz1], [fx1,fy0,fz1], [fx0,fy1,fz1], [fx1,fy1,fz1] ], norm: [0, 0, 1] }
            ];

            for (let tf = 0; tf < flameFaces.length; tf++) {
              const tface = flameFaces[tf];
              const tv = tface.verts;
              list.positions.push(...tv[0], ...tv[1], ...tv[2]);
              list.positions.push(...tv[2], ...tv[1], ...tv[3]);
              for (let i = 0; i < 6; i++) list.normals.push(...tface.norm);
              list.uvs.push(
                fu0, fv0, fu1, fv0, fu0, fv1,
                fu0, fv1, fu1, fv0, fu1, fv1
              );
            }
            continue;
          }

          // Check all 6 faces
          for (let f = 0; f < faces.length; f++) {
            const face = faces[f];
            const nx = wx + face.dir[0];
            const ny = y + face.dir[1];
            const nz = wz + face.dir[2];

            const neighborId = this.getBlock(nx, ny, nz);
            const neighborDef = BLOCK_DEFS[neighborId];

            // Render face if neighbor is transparent (Air, Water, Glass)
            // Water doesn't render faces against other water blocks to avoid interior water walls!
            let shouldRender = false;
            if (neighborId === BLOCK.AIR) {
              shouldRender = true;
            } else if (neighborDef.transparent) {
              if (isLiquid && neighborId === BLOCK.WATER) {
                shouldRender = false; // Skip water adjacent to water
              } else if (blockId === neighborId) {
                shouldRender = false; // Skip adjacent identical transparent blocks (e.g. interior glass walls)
              } else {
                shouldRender = true;
              }
            }

            if (shouldRender) {
              // Pick target buffer list
              let list = solidData;
              if (isLiquid) list = waterData;
              else if (isTransparent) list = transData;

              // Append vertex positions
              const v = face.verts;
              // Map corners to world coordinates
              const c0 = [wx + v[0][0], ny === y + 1 && isLiquid ? y + 0.88 : y + v[0][1], wz + v[0][2]]; // depress water level slightly for cool look
              const c1 = [wx + v[1][0], ny === y + 1 && isLiquid ? y + 0.88 : y + v[1][1], wz + v[1][2]];
              const c2 = [wx + v[2][0], ny === y + 1 && isLiquid ? y + 0.88 : y + v[2][1], wz + v[2][2]];
              const c3 = [wx + v[3][0], ny === y + 1 && isLiquid ? y + 0.88 : y + v[3][1], wz + v[3][2]];

              // Triangle 1: c0, c1, c2
              list.positions.push(...c0, ...c1, ...c2);
              // Triangle 2: c2, c1, c3
              list.positions.push(...c2, ...c1, ...c3);

              // Append normals (6 normals per face block)
              for (let i = 0; i < 6; i++) {
                list.normals.push(...face.norm);
              }

              // Determine UVs in Texture Atlas (4x4 tiles grid)
              let tileIndex = def[face.uvRow] !== undefined ? def[face.uvRow] : def.top;
              
              const tileCol = tileIndex % 8;
              const tileRow = Math.floor(tileIndex / 8);
              
              // normalized UV coordinates for this tile
              const u0 = tileCol / 8 + 0.0005;
              const u1 = (tileCol + 1) / 8 - 0.0005;
              const v0 = (7 - tileRow) / 8 + 0.0005; // flip Y
              const v1 = (8 - tileRow) / 8 - 0.0005;

              // UV map matching face corner structures
              list.uvs.push(
                u0, v0,
                u1, v0,
                u0, v1,
                
                u0, v1,
                u1, v0,
                u1, v1
              );
            }
          }
        }
      }
    }

    // Build the combined meshes for the chunk
    const chunkGroup = new THREE.Group();
    chunkGroup.position.set(0, 0, 0);

    const makeMesh = (data, mat, cast, receive) => {
      if (data.positions.length === 0) return null;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
      geom.computeBoundingSphere();
      
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      return mesh;
    };

    const solidMesh = makeMesh(solidData, this.material, true, true);
    if (solidMesh) chunkGroup.add(solidMesh);

    const transMesh = makeMesh(transData, this.transparentMaterial, true, true);
    if (transMesh) chunkGroup.add(transMesh);

    const waterMesh = makeMesh(waterData, this.waterMaterial, false, true);
    if (waterMesh) chunkGroup.add(waterMesh);

    if (chunkGroup.children.length > 0) {
      this.engine.scene.add(chunkGroup);
      this.chunkMeshes.set(chunkKey, chunkGroup);
    }

    if (chunkTorches.length > 0) {
      this.loadedTorches.set(chunkKey, chunkTorches);
    } else {
      this.loadedTorches.delete(chunkKey);
    }
  }

  // Generates terrain chunks dynamically around where player is standing
  generateAroundPlayer() {
    const px = this.engine.player ? this.engine.player.position.x : 0;
    const pz = this.engine.player ? this.engine.player.position.z : 0;

    const pcx = Math.floor(px / this.chunkSize);
    const pcz = Math.floor(pz / this.chunkSize);

    // 1. Generate chunk grid data first
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const cx = pcx + x;
        const cz = pcz + z;
        this.generateChunkData(cx, cz);
      }
    }

    // 2. Build meshes after all local block structures are placed
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const cx = pcx + x;
        const cz = pcz + z;
        const chunkKey = `${cx},${cz}`;
        if (!this.chunkMeshes.has(chunkKey)) {
          this.generateChunkMesh(cx, cz);
        }
      }
    }
  }

  // Dynamic chunk loading & cleanup
  update(delta) {
    if (!this.engine.player) return;

    // Check if player crossed a chunk border
    const px = this.engine.player.position.x;
    const pz = this.engine.player.position.z;
    const pcx = Math.floor(px / this.chunkSize);
    const pcz = Math.floor(pz / this.chunkSize);

    // Slow ticks checking chunks to avoid frame hiccups
    if (Math.random() < 0.05) {
      this.generateAroundPlayer();
      this.unloadDistantChunks(pcx, pcz);
    }

    // Update block physics events
    this.updateVoxelPhysics();
  }

  unloadDistantChunks(pcx, pcz) {
    // Collect keys to delete
    for (const [key, mesh] of this.chunkMeshes.entries()) {
      const [cx, cz] = key.split(',').map(Number);
      if (Math.abs(cx - pcx) > this.renderDistance + 1 || Math.abs(cz - pcz) > this.renderDistance + 1) {
        this.engine.scene.remove(mesh);
        // Dispose geometries
        mesh.traverse(child => {
          if (child.geometry) child.geometry.dispose();
        });
        this.chunkMeshes.delete(key);
        this.loadedTorches.delete(key);
      }
    }
  }

  // Simple cell-by-cell water flow simulation & sand gravity updates
  updateVoxelPhysics() {
    // 1. Falling blocks (Sand)
    if (this.fallingBlocks.length > 0 && Math.random() < 0.15) {
      const active = [...this.fallingBlocks];
      this.fallingBlocks = [];

      active.forEach(fb => {
        const bid = this.getBlock(fb.x, fb.y, fb.z);
        if (BLOCK_DEFS[bid]?.gravity) {
          const belowId = this.getBlock(fb.x, fb.y - 1, fb.z);
          if (belowId === BLOCK.AIR || belowId === BLOCK.WATER) {
            // Block falls!
            this.setBlock(fb.x, fb.y, fb.z, BLOCK.AIR, true);
            this.setBlock(fb.x, fb.y - 1, fb.z, bid, true);
            
            // Queue below and surrounding updates
            this.checkBlockStability(fb.x, fb.y - 1, fb.z);
            this.checkBlockStability(fb.x, fb.y + 1, fb.z);
          }
        }
      });
    }

    // 2. Liquid Flow (Water spreads to adjacent empty nodes)
    if (this.flowingWater.length > 0 && Math.random() < 0.2) {
      const active = [...this.flowingWater];
      this.flowingWater = [];

      active.forEach(water => {
        const bid = this.getBlock(water.x, water.y, water.z);
        if (bid === BLOCK.WATER) {
          // Check downwards
          const belowId = this.getBlock(water.x, water.y - 1, water.z);
          if (belowId === BLOCK.AIR) {
            this.setBlock(water.x, water.y - 1, water.z, BLOCK.WATER, true);
            this.flowingWater.push({ x: water.x, y: water.y - 1, z: water.z });
          } else if (belowId !== BLOCK.WATER) {
            // Flow sideways if bottom is blocked
            const sides = [
              [1, 0], [-1, 0], [0, 1], [0, -1]
            ];
            sides.forEach(dir => {
              const nx = water.x + dir[0];
              const nz = water.z + dir[1];
              // Water can flow up to 4 blocks in distance from source, but we will make it flow simple sideways if Air
              if (this.getBlock(nx, water.y, nz) === BLOCK.AIR) {
                // Find distance to water source or just place flow block
                this.setBlock(nx, water.y, nz, BLOCK.WATER, true);
                this.flowingWater.push({ x: nx, y: water.y, z: nz });
              }
            });
          }
        }
      });
    }
  }
}
