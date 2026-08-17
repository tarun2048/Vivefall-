import { BLOCK } from './world.js';

export class Structures {
  constructor(engine) {
    this.engine = engine;
  }

  // Generates trees and villages inside a newly created chunk
  generateDecorations(cx, cz) {
    const world = this.engine.world;
    const chunkSize = world.chunkSize;
    const chunkHeight = world.chunkHeight;

    const baseWX = cx * chunkSize;
    const baseWZ = cz * chunkSize;

    // Check if this chunk is designated as a village center
    // We place villages in plains biomes on a grid
    const centerWX = baseWX + Math.floor(chunkSize / 2);
    const centerWZ = baseWZ + Math.floor(chunkSize / 2);
    const biome = world.getBiome(centerWX, centerWZ);

    // Check if Dark Castle needs to be auto-generated in new chunk
    if (this.engine.darkCastleReady && !this.engine.darkCastleSpawned && (Math.abs(cx) >= 3 || Math.abs(cz) >= 3)) {
      this.engine.darkCastleSpawned = true;
      const groundY = world.getTerrainHeight(centerWX, centerWZ);
      this.generateDarkCastle(centerWX, groundY, centerWZ);
      this.engine.darkCastleCoords = { x: centerWX, y: groundY, z: centerWZ };
      return;
    }

    const isVillageChunk = (cx === 1 && cz === 0) || ((Math.abs(cx) % 10 === 0) && (Math.abs(cz) % 10 === 0) && (cx !== 0 || cz !== 0));

    if (isVillageChunk && biome === 'plains') {
      this.generateVillage(centerWX, centerWZ);
      return; // Skip standard tree spawning inside village area
    }

    // Standard decorations: Trees & Cacti
    const noise = this.engine.noise;
    
    // Seeded random for the chunk (strictly positive values)
    let seedVal = Math.abs(Math.sin(cx * 12.9898 + cz * 78.233) * 43758.5453);
    const chunkRandom = () => {
      seedVal = (seedVal * 9301 + 49297) % 233280;
      return Math.abs(seedVal) / 233280;
    };

    for (let lx = 1; lx < chunkSize - 1; lx++) {
      for (let lz = 1; lz < chunkSize - 1; lz++) {
        const wx = baseWX + lx;
        const wz = baseWZ + lz;

        const groundY = world.getTerrainHeight(wx, wz);
        const cellBiome = world.getBiome(wx, wz);
        
        // Ensure coordinate is within height limits
        if (groundY <= 0 || groundY >= chunkHeight - 8) continue;

        // Skip decorations directly at the player spawn point
        if (Math.abs(wx) < 6 && Math.abs(wz) < 6) continue;

        if (cellBiome === 'forest') {
          // Forest has medium density of trees (0.6% chance per column)
          if (chunkRandom() < 0.006) {
            this.generateTree(wx, groundY + 1, wz, chunkRandom);
          }
        } else if (cellBiome === 'plains') {
          // Plains has very low tree density (0.05% chance)
          if (chunkRandom() < 0.0005) {
            this.generateTree(wx, groundY + 1, wz, chunkRandom);
          }
        } else if (cellBiome === 'desert') {
          // Desert has cacti (0.15% chance)
          if (chunkRandom() < 0.0015) {
            this.generateCactus(wx, groundY + 1, wz, chunkRandom);
          }
        } else if (cellBiome === 'cherry_blossom') {
          // Cherry Blossom has cherry trees (1% chance) and pink petals (5% chance)
          const rand = chunkRandom();
          if (rand < 0.01) {
            this.generateCherryTree(wx, groundY + 1, wz, chunkRandom);
          } else if (rand < 0.06) {
            this.placeRawBlock(wx, groundY + 1, wz, BLOCK.FLOWER_PINK);
          }
        } else if (cellBiome === 'floral') {
          // Floral biome has dense flowers (8% chance) and occasional standard tree (0.1% chance)
          const rand = chunkRandom();
          if (rand < 0.001) {
            this.generateTree(wx, groundY + 1, wz, chunkRandom);
          } else if (rand < 0.081) {
            const flowerChoice = Math.floor(chunkRandom() * 4);
            const flowerBlock = [BLOCK.FLOWER_RED, BLOCK.FLOWER_YELLOW, BLOCK.FLOWER_BLUE, BLOCK.FLOWER_PINK][flowerChoice];
            this.placeRawBlock(wx, groundY + 1, wz, flowerBlock);
          }
        }
      }
    }
  }

  // Helper to place a block safely (overwriting air, water, grass, dirt, sand, leaves) without rendering updates
  placeRawBlock(x, y, z, blockId) {
    const world = this.engine.world;
    const cx = Math.floor(x / world.chunkSize);
    const cz = Math.floor(z / world.chunkSize);
    const chunk = world.ensureChunkExists(cx, cz);

    const lx = ((x % world.chunkSize) + world.chunkSize) % world.chunkSize;
    const lz = ((z % world.chunkSize) + world.chunkSize) % world.chunkSize;
    
    if (y < 0 || y >= world.chunkHeight) return;
    const index = (lx * world.chunkSize + lz) * world.chunkHeight + y;
    
    const current = chunk[index];
    if (current === BLOCK.AIR || current === BLOCK.WATER || 
        current === BLOCK.GRASS || current === BLOCK.DIRT || 
        current === BLOCK.SAND || current === BLOCK.LEAVES) {
      chunk[index] = blockId;
    }
  }

  // Generates a classical oak tree
  generateTree(x, y, z, randFunc) {
    const height = 4 + Math.floor(randFunc() * 3); // 4 to 6 logs high
    
    // Trunk
    for (let h = 0; h < height; h++) {
      this.placeRawBlock(x, y + h, z, BLOCK.WOOD);
    }

    // Leaves Crown
    const leafYStart = y + height - 2;
    for (let ly = leafYStart; ly <= y + height + 1; ly++) {
      const radius = ly === y + height + 1 ? 1 : (ly === y + height ? 1.5 : 2);
      const isTop = ly === y + height + 1;

      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          const dist = Math.abs(lx) + Math.abs(lz);
          
          if (isTop && dist > 1) continue;
          if (dist > radius) continue;
          if (lx === 0 && lz === 0 && ly < y + height) continue; // Skip wood trunk intersection

          this.placeRawBlock(x + lx, ly, z + lz, BLOCK.LEAVES);
        }
      }
    }
  }

  // Generates a cherry tree with cherry logs and pink leaves
  generateCherryTree(x, y, z, randFunc) {
    const height = 5 + Math.floor(randFunc() * 3); // 5 to 7 logs high (slightly taller)
    
    // Trunk
    for (let h = 0; h < height; h++) {
      this.placeRawBlock(x, y + h, z, BLOCK.CHERRY_WOOD);
    }

    // Leaves Crown
    const leafYStart = y + height - 3;
    for (let ly = leafYStart; ly <= y + height + 2; ly++) {
      const isTop = ly === y + height + 2;
      const isUpper = ly === y + height + 1;
      const radius = isTop ? 1 : (isUpper ? 2 : 3);

      for (let lx = -3; lx <= 3; lx++) {
        for (let lz = -3; lz <= 3; lz++) {
          const dist = Math.abs(lx) + Math.abs(lz);
          
          if (dist > radius) continue;
          if (lx === 0 && lz === 0 && ly < y + height) continue; // Skip trunk

          this.placeRawBlock(x + lx, ly, z + lz, BLOCK.CHERRY_LEAVES);
        }
      }
    }
  }

  // Generates a Desert Cactus (cacti stack)
  generateCactus(x, y, z, randFunc) {
    const height = 2 + Math.floor(randFunc() * 2); // 2 to 3 blocks high
    for (let h = 0; h < height; h++) {
      // Use leaves as cactus representation for simplicity, but we can paint a custom color
      this.placeRawBlock(x, y + h, z, BLOCK.LEAVES);
    }
  }

  generatePathBlock(x, z, groundY) {
    // Place cobblestone at ground level
    this.placeRawBlock(x, groundY, z, BLOCK.COBBLESTONE);
    // Clear air above (3 blocks high)
    this.placeRawBlock(x, groundY + 1, z, BLOCK.AIR);
    this.placeRawBlock(x, groundY + 2, z, BLOCK.AIR);
    this.placeRawBlock(x, groundY + 3, z, BLOCK.AIR);
  }

  // Spawns a full village structure: a central well, four houses, two crop farms, and a blacksmith, all connected by roads
  generateVillage(centerX, centerZ) {
    const world = this.engine.world;
    const villageY = world.getTerrainHeight(centerX, centerZ);

    // 1. Generate core well
    this.generateVillageWell(centerX, centerZ, villageY);

    // 2. Generate roads (Main streets cross at the well)
    // North-South main street
    for (let z = -9; z <= 9; z++) {
      if (Math.abs(z) > 1) { // Skip inside the well
        this.generatePathBlock(centerX, centerZ + z, villageY);
      }
    }
    // East-West main street
    for (let x = -9; x <= 9; x++) {
      if (Math.abs(x) > 1) { // Skip inside the well
        this.generatePathBlock(centerX + x, centerZ, villageY);
      }
    }

    // 3. Generate Houses (placed at offsets of 6)
    // North houses: Door side is south
    this.generateVillageHouse(centerX - 6, centerZ - 6, villageY, 'south');
    this.generateVillageHouse(centerX + 6, centerZ - 6, villageY, 'south');

    // South houses: Door side is north
    this.generateVillageHouse(centerX - 6, centerZ + 6, villageY, 'north');
    this.generateVillageHouse(centerX + 6, centerZ + 6, villageY, 'north');

    // Connect houses to main streets
    // House 1 (NW): Z from centerZ - 3 to centerZ - 1
    for (let z = -3; z <= -1; z++) this.generatePathBlock(centerX - 6, centerZ + z, villageY);
    // House 4 (NE): Z from centerZ - 3 to centerZ - 1
    for (let z = -3; z <= -1; z++) this.generatePathBlock(centerX + 6, centerZ + z, villageY);
    // House 3 (SW): Z from centerZ + 1 to centerZ + 3
    for (let z = 1; z <= 3; z++) this.generatePathBlock(centerX - 6, centerZ + z, villageY);
    // House 2 (SE): Z from centerZ + 1 to centerZ + 3
    for (let z = 1; z <= 3; z++) this.generatePathBlock(centerX + 6, centerZ + z, villageY);

    // 4. Generate Crop Farms (North/South main street extensions)
    this.generateVillageCropFarm(centerX, centerZ + 11, villageY);
    this.generateVillageCropFarm(centerX, centerZ - 11, villageY);

    // Extend paths to farms
    this.generatePathBlock(centerX, centerZ + 10, villageY);
    this.generatePathBlock(centerX, centerZ - 10, villageY);

    // 5. Generate Blacksmith (East main street extension)
    this.generateVillageBlacksmith(centerX + 11, centerZ, villageY);

    // Extend path to Blacksmith
    this.generatePathBlock(centerX + 10, centerZ, villageY);

    // 6. Spawn extra villagers wandering near the well
    setTimeout(() => {
      if (this.engine.mobs) {
        const x1 = centerX - 2;
        const z1 = centerZ + 2;
        this.engine.mobs.spawnVillager(x1, villageY + 1, z1);

        const x2 = centerX + 2;
        const z2 = centerZ - 2;
        this.engine.mobs.spawnVillager(x2, villageY + 1, z2);
        
        const x3 = centerX;
        const z3 = centerZ + 3;
        this.engine.mobs.spawnVillager(x3, villageY + 1, z3);
      }
    }, 100);
  }

  // Generates a cobblestone well filled with water and supported by pillars
  generateVillageWell(centerX, centerZ, groundY) {
    const world = this.engine.world;

    // Level 5x5 foundation
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        this.placeRawBlock(wx, groundY, wz, BLOCK.COBBLESTONE);

        // Clear air space up to 5 blocks high
        for (let y = groundY + 1; y <= groundY + 5; y++) {
          this.placeRawBlock(wx, y, wz, BLOCK.AIR);
        }
      }
    }

    // Place Cobblestone well ring and central Water
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        if (lx === 0 && lz === 0) {
          this.placeRawBlock(wx, groundY, wz, BLOCK.WATER);
        } else {
          this.placeRawBlock(wx, groundY + 1, wz, BLOCK.COBBLESTONE);
        }
      }
    }

    // 4 Corner Pillars
    this.placeRawBlock(centerX - 1, groundY + 2, centerZ - 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 3, centerZ - 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX + 1, groundY + 2, centerZ - 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX + 1, groundY + 3, centerZ - 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 2, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 3, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX + 1, groundY + 2, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX + 1, groundY + 3, centerZ + 1, BLOCK.COBBLESTONE);

    // Cobblestone well roof
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        this.placeRawBlock(wx, groundY + 4, wz, BLOCK.COBBLESTONE);
      }
    }
  }

  // Generates a complete village house with wood corners, pointed roof, chimney, front step, and a Bed
  generateVillageHouse(centerX, centerZ, groundY, doorSide = 'south') {
    const world = this.engine.world;

    const houseW = 5; // 5x5 structure
    const houseH = 4; // 4 blocks tall walls

    // 1. Level the foundation
    for (let lx = -3; lx <= 3; lx++) {
      for (let lz = -3; lz <= 3; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        
        // Fill up or clear down to level ground
        for (let y = groundY - 5; y < groundY; y++) {
          this.placeRawBlock(wx, y, wz, BLOCK.STONE);
        }
        this.placeRawBlock(wx, groundY, wz, BLOCK.COBBLESTONE); // Cobblestone floor base

        // Clear airspace above house foundation (up to 8 blocks to fit pointed roof!)
        for (let y = groundY + 1; y <= groundY + 8; y++) {
          this.placeRawBlock(wx, y, wz, BLOCK.AIR);
        }
      }
    }

    // 2. Build Walls
    for (let y = groundY + 1; y <= groundY + houseH; y++) {
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          const isEdge = Math.abs(lx) === 2 || Math.abs(lz) === 2;
          if (!isEdge) continue; // Inside is air
          
          const wx = centerX + lx;
          const wz = centerZ + lz;

          // Corner pillars are Wood Logs, walls are Planks
          let blockType = BLOCK.PLANKS;
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2) {
            blockType = BLOCK.WOOD; // Wood Log corners
          }

          // Door opening (dynamic based on doorSide)
          if (doorSide === 'south') {
            if (lx === 0 && lz === 2 && (y === groundY + 1 || y === groundY + 2)) {
              blockType = BLOCK.AIR; // Door gap
            }
          } else {
            if (lx === 0 && lz === -2 && (y === groundY + 1 || y === groundY + 2)) {
              blockType = BLOCK.AIR; // Door gap
            }
          }

          // Windows (dynamic based on doorSide)
          if (doorSide === 'south') {
            if (((lx === -2 && lz === 0) || (lx === 2 && lz === 0) || (lz === -2 && lx === 0)) && (y === groundY + 2)) {
              blockType = BLOCK.GLASS;
            }
          } else {
            if (((lx === -2 && lz === 0) || (lx === 2 && lz === 0) || (lz === 2 && lx === 0)) && (y === groundY + 2)) {
              blockType = BLOCK.GLASS;
            }
          }

          this.placeRawBlock(wx, y, wz, blockType);
        }
      }
    }

    // 3. Build Pointed Pyramid Roof
    // Layer 1 (Cobble trim border + wood planks center)
    const roofY1 = groundY + houseH + 1;
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        const isTrim = Math.abs(lx) === 2 || Math.abs(lz) === 2;
        this.placeRawBlock(wx, roofY1, wz, isTrim ? BLOCK.COBBLESTONE : BLOCK.PLANKS);
      }
    }
    // Layer 2 (3x3 Planks)
    const roofY2 = groundY + houseH + 2;
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        this.placeRawBlock(centerX + lx, roofY2, centerZ + lz, BLOCK.PLANKS);
      }
    }
    // Layer 3 (1x1 Cobble Peak)
    const roofY3 = groundY + houseH + 3;
    this.placeRawBlock(centerX, roofY3, centerZ, BLOCK.COBBLESTONE);

    // 4. Chimney on the back left corner
    this.placeRawBlock(centerX - 2, groundY + 1, centerZ - 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 2, centerZ - 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 3, centerZ - 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 4, centerZ - 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 5, centerZ - 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 6, centerZ - 2, BLOCK.COBBLESTONE);

    // 5. Front step outside the door (Clear air to prevent blocking)
    if (doorSide === 'south') {
      this.placeRawBlock(centerX, groundY + 1, centerZ + 3, BLOCK.AIR);
      this.placeRawBlock(centerX, groundY + 2, centerZ + 3, BLOCK.AIR);
    } else {
      this.placeRawBlock(centerX, groundY + 1, centerZ - 3, BLOCK.AIR);
      this.placeRawBlock(centerX, groundY + 2, centerZ - 3, BLOCK.AIR);
    }

    // 6. Place internal structures (Crafting Table, Chest, Bed)
    let tableX = centerX - 1;
    let tableZ = centerZ - 1;
    let chestX = centerX + 1;
    let chestZ = centerZ - 1;
    let bedX = centerX - 1;
    let bedZ = centerZ + 1;
    let bedZFoot = centerZ;

    if (doorSide === 'north') {
      tableZ = centerZ + 1;
      chestZ = centerZ + 1;
      bedZ = centerZ - 1;
      bedZFoot = centerZ;
    }

    // Place blocks
    this.placeRawBlock(tableX, groundY + 1, tableZ, BLOCK.CRAFTING_TABLE);
    this.placeRawBlock(chestX, groundY + 1, chestZ, BLOCK.CHEST);
    this.placeRawBlock(bedX, groundY + 1, bedZ, BLOCK.BED_HEAD);
    this.placeRawBlock(bedX, groundY + 1, bedZFoot, BLOCK.BED_FOOT); // 2-block long bed!
    
    // Place torch inside house ceiling center
    this.placeRawBlock(centerX, groundY + 3, centerZ, BLOCK.TORCH);

    // Initialize Chest Inventory Loot Table
    if (this.engine.inventory) {
      const lootList = [
        { id: 'planks', count: 12, prob: 0.8 },
        { id: 'stone', count: 8, prob: 0.6 },
        { id: 'wood', count: 4, prob: 0.5 },
        { id: 'bread', count: 3, prob: 0.7 },
        { id: 'emerald', count: 2, prob: 0.4 },
        { id: 'iron_axe', count: 1, prob: 0.2 },
        { id: 'iron_pickaxe', count: 1, prob: 0.2 },
        { id: 'iron_ingot', count: 5, prob: 0.3 }
      ];

      const chestKey = `${chestX},${groundY + 1},${chestZ}`;
      if (!this.engine.inventory.chests.has(chestKey)) {
        const chestItems = new Array(27).fill(null);
        
        // Populate random loot
        let slotIdx = 0;
        lootList.forEach(item => {
          if (Math.random() < item.prob && slotIdx < 27) {
            chestItems[slotIdx] = {
              id: item.id,
              count: 1 + Math.floor(Math.random() * item.count)
            };
            slotIdx += Math.floor(1 + Math.random() * 3); // space them out
          }
        });

        this.engine.inventory.chests.set(chestKey, chestItems);
      }
    }

    // 7. Spawn Villagers outside the door
    if (this.engine.mobs) {
      // Spawn 1 villager near the door
      setTimeout(() => {
        if (this.engine.mobs) {
          const spawnX = centerX;
          const spawnZ = doorSide === 'south' ? centerZ + 4 : centerZ - 4;
          const spawnY = world.getTerrainHeight(spawnX, spawnZ) + 1;
          this.engine.mobs.spawnVillager(spawnX, spawnY, spawnZ);
        }
      }, 50);
    }
  }

  // Generates a Crop Farm (5x5, water channel in center, leafy crops)
  generateVillageCropFarm(centerX, centerZ, groundY) {
    const world = this.engine.world;

    // Foundation & airspace
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        this.placeRawBlock(wx, groundY, wz, BLOCK.DIRT);
        for (let y = groundY + 1; y <= groundY + 4; y++) {
          this.placeRawBlock(wx, y, wz, BLOCK.AIR);
        }
      }
    }

    // Outer border (Cobblestone)
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        if (Math.abs(lx) === 2 || Math.abs(lz) === 2) {
          this.placeRawBlock(centerX + lx, groundY + 1, centerZ + lz, BLOCK.COBBLESTONE);
        }
      }
    }

    // Inner 3x3 (Water channel in center, crops on left/right)
    for (let lz = -1; lz <= 1; lz++) {
      // Water center channel
      this.placeRawBlock(centerX, groundY, centerZ + lz, BLOCK.DIRT);
      this.placeRawBlock(centerX, groundY + 1, centerZ + lz, BLOCK.WATER);

      // Left column crops
      this.placeRawBlock(centerX - 1, groundY + 1, centerZ + lz, BLOCK.DIRT);
      this.placeRawBlock(centerX - 1, groundY + 2, centerZ + lz, BLOCK.LEAVES); // crop plants

      // Right column crops
      this.placeRawBlock(centerX + 1, groundY + 1, centerZ + lz, BLOCK.DIRT);
      this.placeRawBlock(centerX + 1, groundY + 2, centerZ + lz, BLOCK.LEAVES); // crop plants
    }
  }

  // Generates a blacksmith forge (cobblestone workspace, cooling trough, high-tier loot chest)
  generateVillageBlacksmith(centerX, centerZ, groundY) {
    const world = this.engine.world;

    // 1. Level foundation
    for (let lx = -3; lx <= 3; lx++) {
      for (let lz = -4; lz <= 3; lz++) {
        const wx = centerX + lx;
        const wz = centerZ + lz;
        for (let y = groundY - 5; y < groundY; y++) {
          this.placeRawBlock(wx, y, wz, BLOCK.STONE);
        }
        this.placeRawBlock(wx, groundY, wz, BLOCK.COBBLESTONE);
        for (let y = groundY + 1; y <= groundY + 8; y++) {
          this.placeRawBlock(wx, y, wz, BLOCK.AIR);
        }
      }
    }

    // 2. Build Blacksmith structures
    // Cobblestone walls on the back and sides
    for (let y = groundY + 1; y <= groundY + 3; y++) {
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -3; lz <= 2; lz++) {
          const isBack = lz === -3;
          const isLeft = lx === -2;
          const isRight = lx === 2;

          if (isBack || isLeft || isRight) {
            // Leave window slots
            if (y === groundY + 2 && ((isLeft && lz === 0) || (isRight && lz === 0))) {
              this.placeRawBlock(centerX + lx, y, centerZ + lz, BLOCK.GLASS);
            } else {
              this.placeRawBlock(centerX + lx, y, centerZ + lz, BLOCK.COBBLESTONE);
            }
          }
        }
      }
    }

    // Front area is open porch (blacksmith forge workspace)
    // Left side has the cooling trough: 2x2 cobblestone pool with water
    this.placeRawBlock(centerX - 2, groundY + 1, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 1, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 1, centerZ + 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 1, centerZ + 2, BLOCK.COBBLESTONE);
    
    this.placeRawBlock(centerX - 2, groundY + 2, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 2, centerZ + 1, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 2, groundY + 2, centerZ + 2, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX - 1, groundY + 2, centerZ + 2, BLOCK.COBBLESTONE);
    
    // Water in the middle
    this.placeRawBlock(centerX - 2, groundY + 1, centerZ + 2, BLOCK.WATER);

    // Stone anvil in the center of the porch
    this.placeRawBlock(centerX, groundY + 1, centerZ + 1, BLOCK.STONE);

    // Roof (flat cobblestone slabs)
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -3; lz <= 2; lz++) {
        this.placeRawBlock(centerX + lx, groundY + 4, centerZ + lz, BLOCK.COBBLESTONE);
      }
    }

    // Cobblestone Chimney rising on the right back corner
    this.placeRawBlock(centerX + 2, groundY + 4, centerZ - 3, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX + 2, groundY + 5, centerZ - 3, BLOCK.COBBLESTONE);
    this.placeRawBlock(centerX + 2, groundY + 6, centerZ - 3, BLOCK.COBBLESTONE);

    // Crafting table and Blacksmith Loot Chest
    this.placeRawBlock(centerX + 1, groundY + 1, centerZ - 2, BLOCK.CRAFTING_TABLE);
    this.placeRawBlock(centerX - 1, groundY + 1, centerZ - 2, BLOCK.CHEST);
    
    // Place torch on blacksmith porch area
    this.placeRawBlock(centerX + 1, groundY + 3, centerZ + 1, BLOCK.TORCH);

    // High tier Blacksmith loot
    if (this.engine.inventory) {
      const lootList = [
        { id: 'emerald', count: 5, prob: 0.8 },
        { id: 'iron_ingot', count: 12, prob: 0.9 },
        { id: 'iron_pickaxe', count: 1, prob: 0.6 },
        { id: 'iron_axe', count: 1, prob: 0.5 },
        { id: 'stone', count: 16, prob: 0.7 },
        { id: 'cobblestone', count: 16, prob: 0.8 },
        { id: 'bed', count: 1, prob: 0.3 }
      ];

      const chestKey = `${centerX - 1},${groundY + 1},${centerZ - 2}`;
      if (!this.engine.inventory.chests.has(chestKey)) {
        const chestItems = new Array(27).fill(null);
        let slotIdx = 0;
        lootList.forEach(item => {
          if (Math.random() < item.prob && slotIdx < 27) {
            chestItems[slotIdx] = { id: item.id, count: Math.max(1, Math.floor(Math.random() * item.count)) };
            slotIdx += Math.floor(1 + Math.random() * 3);
          }
        });
        this.engine.inventory.chests.set(chestKey, chestItems);
      }
    }
  }

  generateDarkCastle(wx, wy, wz) {
    const world = this.engine.world;
    const baseY = wy;
    
    // Clear 16x16 footprint up to 16 height
    for (let dx = -8; dx <= 8; dx++) {
      for (let dz = -8; dz <= 8; dz++) {
        for (let dy = 1; dy <= 16; dy++) {
          this.placeRawBlock(wx + dx, baseY + dy, wz + dz, BLOCK.AIR);
        }
      }
    }

    // Cobblestone foundation floor
    for (let dx = -8; dx <= 8; dx++) {
      for (let dz = -8; dz <= 8; dz++) {
        this.placeRawBlock(wx + dx, baseY, wz + dz, BLOCK.COBBLESTONE);
      }
    }

    // Outer Obsidian Walls (15x15)
    for (let dx = -7; dx <= 7; dx++) {
      for (let dz = -7; dz <= 7; dz++) {
        const isWall = (Math.abs(dx) === 7 || Math.abs(dz) === 7);
        if (isWall) {
          for (let dy = 1; dy <= 8; dy++) {
            if (dz === 7 && Math.abs(dx) <= 1 && dy <= 4) continue;
            this.placeRawBlock(wx + dx, baseY + dy, wz + dz, BLOCK.STONE);
          }
        }
      }
    }

    // Corner Towers (12 height)
    const corners = [[-7, -7], [7, -7], [-7, 7], [7, 7]];
    corners.forEach(c => {
      for (let tx = c[0] - 1; tx <= c[0] + 1; tx++) {
        for (let tz = c[1] - 1; tz <= c[1] + 1; tz++) {
          for (let dy = 1; dy <= 12; dy++) {
            this.placeRawBlock(wx + tx, baseY + dy, wz + tz, BLOCK.STONE);
          }
        }
      }
      this.placeRawBlock(wx + c[0], baseY + 13, wz + c[1], BLOCK.TORCH);
    });

    // Interior Torches
    this.placeRawBlock(wx - 4, baseY + 3, wz - 4, BLOCK.TORCH);
    this.placeRawBlock(wx + 4, baseY + 3, wz - 4, BLOCK.TORCH);
    this.placeRawBlock(wx - 4, baseY + 3, wz + 4, BLOCK.TORCH);
    this.placeRawBlock(wx + 4, baseY + 3, wz + 4, BLOCK.TORCH);

    // Throne at back center
    this.placeRawBlock(wx, baseY + 1, wz - 5, BLOCK.WOOD);
    this.placeRawBlock(wx, baseY + 2, wz - 5, BLOCK.WOOD);
    this.placeRawBlock(wx - 1, baseY + 1, wz - 5, BLOCK.PLANKS);
    this.placeRawBlock(wx + 1, baseY + 1, wz - 5, BLOCK.PLANKS);

    // Spawn Dark Boss inside
    if (this.engine.mobs) {
      this.engine.mobs.spawnDarkBoss(wx, baseY + 1, wz - 2);
    }
  }
}
