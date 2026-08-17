import * as THREE from 'three';
import { BLOCK, BLOCK_DEFS } from './world.js';

// SVG Assets for authentic pixel HUD look
// SVG Assets for authentic pixel HUD look
const HEART_SVG = {
  full: `<svg viewBox="0 0 9 9" width="18" height="18">
    <path d="M1,2 h1 v-1 h1 v1 h1 v1 h1 v-1 h1 v1 h1 v-1 h1 v1 h1 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="#ff2222"/>
    <path d="M0,1 h2 v1 h1 v-1 h3 v1 h1 v-1 h2 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="none" stroke="#000000" stroke-width="1"/>
    <rect x="2" y="2" width="1" height="1" fill="#ffdddd"/>
  </svg>`,
  half: `<svg viewBox="0 0 9 9" width="18" height="18">
    <path d="M1,2 h1 v-1 h1 v1 h1 v1 h1 v-1 h1 v1 h1 v-1 h1 v1 h1 v2 h-1 v-4 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 z" fill="#ff2222"/>
    <path d="M0,1 h2 v1 h1 v-1 h3 v1 h1 v-1 h2 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="none" stroke="#000000" stroke-width="1"/>
    <rect x="2" y="2" width="1" height="1" fill="#ffdddd"/>
  </svg>`,
  empty: `<svg viewBox="0 0 9 9" width="18" height="18">
    <path d="M1,2 h1 v-1 h1 v1 h1 v1 h1 v-1 h1 v1 h1 v-1 h1 v1 h1 v2 h-1 v1 h-1 v-4 h-1 v-1 h-1 v1 h-1 v1 h-1 z" fill="#555555"/>
    <path d="M0,1 h2 v1 h1 v-1 h3 v1 h1 v-1 h2 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 z" fill="none" stroke="#000000" stroke-width="1"/>
  </svg>`
};

const FOOD_SVG = {
  full: `<svg viewBox="0 0 9 9" width="18" height="18">
    <path d="M5,1 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 v1 h-2 v-1 h-1 v-2 h1 v-1 h1 v-1 z" fill="#c68a4c"/>
    <path d="M2,6 h1 v1 h-1 z" fill="#e5c19e"/>
    <path d="M5,0 h3 v1 h1 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-2 h1 v-1 h-1 v-2 h1 v-1 h1 v-1 z" fill="none" stroke="#000000" stroke-width="1"/>
  </svg>`,
  half: `<svg viewBox="0 0 9 9" width="18" height="18">
    <path d="M5,1 h1 v4 h-1 v1 h-1 v1 h-2 v-1 h-1 v-2 h1 v-1 h1 v-1 z" fill="#c68a4c"/>
    <path d="M2,6 h1 v1 h-1 z" fill="#e5c19e"/>
    <path d="M5,0 h3 v1 h1 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-2 h1 v-1 h-1 v-2 h1 v-1 h1 v-1 z" fill="none" stroke="#000000" stroke-width="1"/>
  </svg>`,
  empty: `<svg viewBox="0 0 9 9" width="18" height="18">
    <path d="M5,0 h3 v1 h1 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-2 h1 v-1 h-1 v-2 h1 v-1 h1 v-1 z" fill="none" stroke="#000000" stroke-width="1"/>
  </svg>`
};

export class Player {
  constructor(engine) {
    this.engine = engine;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // Physical attributes
    this.width = 0.6;
    this.height = 1.8;
    this.onGround = false;

    // Movement speeds
    this.speed = 4.3; // blocks per sec
    this.sprintSpeed = 5.6;
    this.jumpForce = 8.5;
    
    // States
    this.health = 20;
    this.hunger = 20;
    this.isFlying = false;
    this.isDead = false;
    
    // Inputs state
    this.keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
    this.isSprinting = false;

    // Creative double tap space variables
    this.lastSpaceTime = 0;

    // Selected hotbar index (0 to 8)
    this.selectedHotbarIndex = 0;

    // Block mining/interaction tracking
    this.isMining = false;
    this.mineTarget = null; // Vector3
    this.mineTimer = 0;
    this.mineDurability = 0; // Total duration to break block

    this.initInputs();
    this.updateHUD();
  }

  spawn(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.engine.controls.getObject().position.copy(this.position);
    this.engine.controls.getObject().position.y += 1.6; // camera at eye level
    this.isFlying = false;
    this.updateHUD();
  }

  initInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      // If inventory or workstation UI is open, allow E and Escape to close it
      if (this.engine.gameState === 'inventory') {
        if (key === 'e' || key === 'escape') {
          e.preventDefault();
          this.engine.openInventory();
        }
        return;
      }

      if (this.engine.gameState !== 'playing') return;

      if (key === 'w') this.keys.w = true;
      if (key === 'a') this.keys.a = true;
      if (key === 's') this.keys.s = true;
      if (key === 'd') this.keys.d = true;
      if (key === 'shift') this.keys.shift = true;
      
      if (key === ' ') {
        this.keys.space = true;
        // Fly mode double tap space check (Creative mode only)
        if (this.engine.gameMode === 'creative') {
          const now = performance.now();
          if (now - this.lastSpaceTime < 280) {
            this.isFlying = !this.isFlying;
            this.velocity.y = 0;
          }
          this.lastSpaceTime = now;
        }
      }

      // Hotbar selection
      if (key >= '1' && key <= '9') {
        const slotIdx = parseInt(key) - 1;
        this.selectHotbarSlot(slotIdx);
      }

      // Open Inventory
      if (key === 'e') {
        e.preventDefault();
        this.engine.openInventory('screen-inventory');
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w') this.keys.w = false;
      if (key === 'a') this.keys.a = false;
      if (key === 's') this.keys.s = false;
      if (key === 'd') this.keys.d = false;
      if (key === 'shift') this.keys.shift = false;
      if (key === ' ') this.keys.space = false;
    });

    // Double click to sprint
    window.addEventListener('dblclick', (e) => {
      if (this.engine.gameState === 'playing') {
        this.isSprinting = true;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (this.engine.gameState !== 'playing') return;

      if (e.button === 0) {
        // Left Click: Attack mob first if looking at one, else start mining blocks
        const hitMob = this.engine.mobs.checkMobHit(this.engine.camera, 4.0);
        if (hitMob) {
          this.attackMob(hitMob);
        } else {
          this.startMining();
        }
      } else if (e.button === 2) {
        // Right Click: Place block / Eat / Interact
        this.handleRightClick();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.stopMining();
      }
    });
  }

  selectHotbarSlot(index) {
    this.selectedHotbarIndex = index;
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    hotbarSlots.forEach((slot, i) => {
      if (i === index) slot.classList.add('active');
      else slot.classList.remove('active');
    });
  }

  attackMob(mob) {
    if (!mob || mob.isDead) return;

    const activeItem = this.engine.inventory.hotbar[this.selectedHotbarIndex];
    let damage = 1;
    if (activeItem) {
      if (activeItem.id === 'iron_sword') damage = 6;
      else if (activeItem.id === 'iron_axe') damage = 5;
      else if (activeItem.id === 'iron_pickaxe') damage = 4;
    }

    mob.takeDamage(damage);
    this.animateWeaponSwing();
  }

  animateWeaponSwing() {
    const hotbarElem = document.querySelector('.hotbar-slot.active');
    if (hotbarElem) {
      hotbarElem.style.transform = 'scale(0.85) rotate(-15deg)';
      setTimeout(() => {
        hotbarElem.style.transform = 'none';
      }, 150);
    }
  }

  startMining() {
    const ray = this.engine.physics.getLookBlock(this.engine.camera, 5);
    if (!ray) return;

    this.isMining = true;
    this.mineTarget = ray.target;
    this.mineTimer = 0;

    const bid = this.engine.world.getBlock(ray.target.x, ray.target.y, ray.target.z);
    
    // Creative mode: Instant break
    if (this.engine.gameMode === 'creative') {
      this.breakTargetBlock();
      this.isMining = false;
      return;
    }

    // Determine block breaking durability (time in ms)
    switch(bid) {
      case BLOCK.LEAVES: this.mineDurability = 100; break;
      case BLOCK.GRASS:
      case BLOCK.DIRT:
      case BLOCK.SAND:
        this.mineDurability = 300; break;
      case BLOCK.WOOD:
      case BLOCK.PLANKS:
        this.mineDurability = 700; break;
      case BLOCK.COBBLESTONE:
      case BLOCK.STONE:
      case BLOCK.CRAFTING_TABLE:
      case BLOCK.CHEST:
        this.mineDurability = 1200; break;
      default:
        this.mineDurability = 500;
    }

    // Show block progress element
    document.getElementById('break-progress-container').classList.remove('hidden');
    document.getElementById('break-progress-bar').style.width = '0%';
  }

  stopMining() {
    this.isMining = false;
    this.mineTarget = null;
    document.getElementById('break-progress-container').classList.add('hidden');
  }

  breakTargetBlock() {
    if (!this.mineTarget) return;

    const world = this.engine.world;
    const x = this.mineTarget.x;
    const y = this.mineTarget.y;
    const z = this.mineTarget.z;

    const bid = world.getBlock(x, y, z);

    // Break the block
    world.setBlock(x, y, z, BLOCK.AIR, true);
    this.engine.sounds.playBreak();

    // If it's a bed block, also break the other half
    if (bid === BLOCK.BED_HEAD || bid === BLOCK.BED_FOOT) {
      const targetPartner = bid === BLOCK.BED_HEAD ? BLOCK.BED_FOOT : BLOCK.BED_HEAD;
      const neighbors = [
        { x: x + 1, y: y, z: z },
        { x: x - 1, y: y, z: z },
        { x: x, y: y, z: z + 1 },
        { x: x, y: y, z: z - 1 }
      ];
      for (const n of neighbors) {
        if (world.getBlock(n.x, n.y, n.z) === targetPartner) {
          world.setBlock(n.x, n.y, n.z, BLOCK.AIR, true);
          break;
        }
      }
    }

    // Drop block as item in survival or story mode
    if (this.engine.gameMode === 'survival' || this.engine.gameMode === 'story') {
      let droppedItemId = null;
      // Map block ID to drops
      if (bid === BLOCK.GRASS) droppedItemId = 'dirt';
      else if (bid === BLOCK.STONE) droppedItemId = 'cobblestone';
      else if (bid === BLOCK.BED_HEAD || bid === BLOCK.BED_FOOT) {
        droppedItemId = 'bed';
      } else {
        // Drop matching def
        const defName = BLOCK_DEFS[bid]?.name;
        if (defName) {
          droppedItemId = defName.toLowerCase().replace(/ /g, '_');
        }
      }

      if (droppedItemId) {
        this.engine.spawnItemDrop(x + 0.5, y + 0.5, z + 0.5, droppedItemId);
      }
    }
  }

  handleRightClick() {
    const ray = this.engine.physics.getLookBlock(this.engine.camera, 5);
    if (!ray) return;

    const x = ray.target.x;
    const y = ray.target.y;
    const z = ray.target.z;

    const bid = this.engine.world.getBlock(x, y, z);

    // 1. Check if clicking on interactive workstation blocks
    if (bid === BLOCK.CHEST) {
      this.engine.openInventory('screen-chest');
      // Set active chest pointer
      this.engine.inventory.activeChestCoords = `${x},${y},${z}`;
      this.engine.inventory.renderChest();
      return;
    }
    
    if (bid === BLOCK.CRAFTING_TABLE) {
      this.engine.openInventory('screen-crafting-3x3');
      return;
    }

    if (bid === BLOCK.BED_HEAD || bid === BLOCK.BED_FOOT) {
      // Sleep interaction (skips night)
      const isNight = this.engine.timeOfDay > 18000 || this.engine.timeOfDay < 6000;
      if (isNight) {
        this.engine.timeOfDay = 6000; // Reset to 6:00 AM (Sunrise)
        this.health = 20; // Heal fully
        this.hunger = 20; // Feed fully
        this.updateHUD();
        this.engine.unlockAchievement('sleep');

        const textOverlay = document.createElement('div');
        textOverlay.style.position = 'absolute';
        textOverlay.style.top = '25%';
        textOverlay.style.left = '50%';
        textOverlay.style.transform = 'translate(-50%, -50%)';
        textOverlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        textOverlay.style.border = '4px solid #fff';
        textOverlay.style.color = '#ffff55';
        textOverlay.style.padding = '15px 30px';
        textOverlay.style.fontFamily = "'VT323', monospace";
        textOverlay.style.fontSize = '32px';
        textOverlay.style.zIndex = '999';
        textOverlay.textContent = 'Sleeping... Night Skipped!';
        document.body.appendChild(textOverlay);

        setTimeout(() => { textOverlay.remove(); }, 2500);
      } else {
        const textOverlay = document.createElement('div');
        textOverlay.style.position = 'absolute';
        textOverlay.style.top = '25%';
        textOverlay.style.left = '50%';
        textOverlay.style.transform = 'translate(-50%, -50%)';
        textOverlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        textOverlay.style.border = '4px solid #fff';
        textOverlay.style.color = '#ff5555';
        textOverlay.style.padding = '15px 30px';
        textOverlay.style.fontFamily = "'VT323', monospace";
        textOverlay.style.fontSize = '32px';
        textOverlay.style.zIndex = '999';
        textOverlay.textContent = 'You can only sleep at night!';
        document.body.appendChild(textOverlay);

        setTimeout(() => { textOverlay.remove(); }, 2000);
      }
      return;
    }

    // Check if right clicking interactive TNT, Lever, or Button blocks!
    const targetBlockId = this.engine.world.getBlock(ray.target.x, ray.target.y, ray.target.z);
    if (targetBlockId === BLOCK.TNT) {
      this.engine.igniteTNT(ray.target.x, ray.target.y, ray.target.z);
      return;
    }
    if (targetBlockId === BLOCK.LEVER) {
      this.engine.toggleLever(ray.target.x, ray.target.y, ray.target.z);
      return;
    }
    if (targetBlockId === BLOCK.BUTTON) {
      this.engine.pressButton(ray.target.x, ray.target.y, ray.target.z);
      return;
    }

    // 2. Check if right clicking a Villager (Mob AI raycast check)
    const villagerHit = this.engine.mobs.checkMobClick(this.engine.camera, 5);
    if (villagerHit) {
      this.engine.openInventory('screen-trading');
      this.engine.inventory.activeVillager = villagerHit;
      this.engine.inventory.renderTrades();
      return;
    }

    // 3. Check if right clicking to eat food!
    const activeItem = this.engine.inventory.hotbar[this.selectedHotbarIndex];
    if (activeItem) {
      const foodHeal = {
        'bread': 5,
        'raw_beef': 3,
        'cooked_beef': 8,
        'raw_mutton': 2,
        'cooked_mutton': 6,
        'raw_chicken': 2,
        'cooked_chicken': 6,
        'rotten_flesh': 2
      };
      if (foodHeal[activeItem.id] !== undefined) {
        if (this.hunger < 20) {
          this.hunger = Math.min(20, this.hunger + foodHeal[activeItem.id]);
          this.updateHUD();
          this.engine.sounds.playEat();
          this.engine.unlockAchievement('eat');
          if (this.engine.gameMode === 'survival' || this.engine.gameMode === 'story') {
            this.engine.inventory.removeHotbarItem(this.selectedHotbarIndex, 1);
          }
        }
        return;
      }

      if (activeItem.id === 'mystic_book') {
        this.engine.triggerVictoryEnding();
        return;
      }

      // Check Spawn Eggs
      if (activeItem.id.startsWith('spawn_egg_')) {
        const mobType = activeItem.id.replace('spawn_egg_', '');
        const sx = ray.place.x + 0.5;
        const sy = ray.place.y;
        const sz = ray.place.z + 0.5;
        
        if (mobType === 'zombie') this.engine.mobs.spawnZombie(sx, sy, sz);
        else if (mobType === 'skeleton') this.engine.mobs.spawnSkeleton(sx, sy, sz);
        else if (mobType === 'spider') this.engine.mobs.spawnSpider(sx, sy, sz);
        else if (mobType === 'cow') this.engine.mobs.spawnCow(sx, sy, sz);
        else if (mobType === 'sheep') this.engine.mobs.spawnSheep(sx, sy, sz);
        else if (mobType === 'chicken') this.engine.mobs.spawnChicken(sx, sy, sz);

        if (this.engine.gameMode === 'survival') {
          this.engine.inventory.removeHotbarItem(this.selectedHotbarIndex, 1);
        }
        return;
      }
    }

    if (!activeItem) return;

    // Convert item ID back to BLOCK ID
    const blockIdToPlace = this.getItemBlockId(activeItem.id);
    if (blockIdToPlace === BLOCK.AIR) return;

    const px = ray.place.x;
    const py = ray.place.y;
    const pz = ray.place.z;

    // Check if new placed block will intersect with the player's bounding box
    const halfW = this.width / 2;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.position.x - halfW, this.position.y, this.position.z - halfW),
      new THREE.Vector3(this.position.x + halfW, this.position.y + this.height, this.position.z + halfW)
    );
    const placeBox = new THREE.Box3(
      new THREE.Vector3(px, py, pz),
      new THREE.Vector3(px + 1, py + 1, pz + 1)
    );

    if (playerBox.intersectsBox(placeBox)) {
      return; // Can't suffocate yourself!
    }

    // Place block
    if (blockIdToPlace === BLOCK.BED_HEAD) {
      // Determine direction of bed foot
      const dir = new THREE.Vector3();
      this.engine.camera.getWorldDirection(dir);
      let fx = px;
      let fz = pz;
      if (Math.abs(dir.x) > Math.abs(dir.z)) {
        if (dir.x > 0) fx = px - 1;
        else fx = px + 1;
      } else {
        if (dir.z > 0) fz = pz - 1;
        else fz = pz + 1;
      }

      // Check if neighboring foot block is within bounds and doesn't intersect player
      const footBox = new THREE.Box3(
        new THREE.Vector3(fx, py, fz),
        new THREE.Vector3(fx + 1, py + 1, fz + 1)
      );
      if (playerBox.intersectsBox(footBox)) {
        return; // Don't place on top of yourself!
      }

      // Place head and foot
      this.engine.world.setBlock(px, py, pz, BLOCK.BED_HEAD, true);
      this.engine.world.setBlock(fx, py, fz, BLOCK.BED_FOOT, true);
    } else {
      this.engine.world.setBlock(px, py, pz, blockIdToPlace, true);
    }

    // Play place sound effect
    this.engine.sounds.playPlace();
    if (activeItem.id.includes('flower') || activeItem.id === 'wheat') {
      this.engine.unlockAchievement('farm');
    }

    // Consume item in survival
    if (this.engine.gameMode === 'survival') {
      this.engine.inventory.removeHotbarItem(this.selectedHotbarIndex, 1);
    }
  }

  getItemBlockId(itemId) {
    if (itemId === 'grass_block') return BLOCK.GRASS;
    if (itemId === 'dirt') return BLOCK.DIRT;
    if (itemId === 'stone') return BLOCK.STONE;
    if (itemId === 'cobblestone') return BLOCK.COBBLESTONE;
    if (itemId === 'wood_log') return BLOCK.WOOD;
    if (itemId === 'leaves') return BLOCK.LEAVES;
    if (itemId === 'sand') return BLOCK.SAND;
    if (itemId === 'water') return BLOCK.WATER;
    if (itemId === 'glass') return BLOCK.GLASS;
    if (itemId === 'crafting_table') return BLOCK.CRAFTING_TABLE;
    if (itemId === 'chest') return BLOCK.CHEST;
    if (itemId === 'wooden_planks') return BLOCK.PLANKS;
    if (itemId === 'bed') return BLOCK.BED_HEAD;
    if (itemId === 'cherry_leaves') return BLOCK.CHERRY_LEAVES;
    if (itemId === 'cherry_log') return BLOCK.CHERRY_WOOD;
    if (itemId === 'red_flower') return BLOCK.FLOWER_RED;
    if (itemId === 'yellow_flower') return BLOCK.FLOWER_YELLOW;
    if (itemId === 'blue_flower') return BLOCK.FLOWER_BLUE;
    if (itemId === 'pink_flower') return BLOCK.FLOWER_PINK;
    if (itemId === 'torch') return BLOCK.TORCH;
    if (itemId === 'tnt') return BLOCK.TNT;
    if (itemId === 'redstone_wire') return BLOCK.REDSTONE_WIRE;
    if (itemId === 'lever') return BLOCK.LEVER;
    if (itemId === 'button') return BLOCK.BUTTON;
    return BLOCK.AIR;
  }

  takeDamage(amount, reason = "Died") {
    if (this.engine.gameMode === 'creative' || this.isDead) return;
    
    this.health = Math.max(0, this.health - amount);
    this.updateHUD();

    if (this.health <= 0) {
      this.isDead = true;
      this.engine.triggerGameOver(reason);
    }
  }

  update(delta) {
    if (this.isDead) return;

    // Apply movement controls
    const velocity = this.velocity;
    const speed = this.isSprinting ? this.sprintSpeed : this.speed;

    const cameraObj = this.engine.controls.getObject();
    
    // Direction vectors matching looking angle
    const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraObj.quaternion);
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraObj.quaternion);
    
    // Flat movement project on ground plane
    forwardVec.y = 0; forwardVec.normalize();
    rightVec.y = 0; rightVec.normalize();

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.w) { moveX += forwardVec.x; moveZ += forwardVec.z; }
    if (this.keys.s) { moveX -= forwardVec.x; moveZ -= forwardVec.z; }
    if (this.keys.a) { moveX -= rightVec.x; moveZ -= rightVec.z; }
    if (this.keys.d) { moveX += rightVec.x; moveZ += rightVec.z; }

    const inputMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (inputMag > 0) {
      velocity.x = (moveX / inputMag) * speed;
      velocity.z = (moveZ / inputMag) * speed;
    } else {
      velocity.x = 0;
      velocity.z = 0;
    }

    // Y flying controls vs gravity
    if (this.isFlying) {
      velocity.y = 0;
      if (this.keys.space) velocity.y = speed;
      if (this.keys.shift) velocity.y = -speed;
    } else {
      // Jump
      if (this.keys.space && this.onGround) {
        velocity.y = this.jumpForce;
      }
    }

    // Call physics module solver
    const prevY = this.position.y;
    this.onGround = this.engine.physics.applyMovement(
      this.position,
      velocity,
      this.width,
      this.height,
      delta,
      this.isFlying
    );

    // Apply camera position (offset camera eye level)
    cameraObj.position.copy(this.position);
    cameraObj.position.y += 1.6;

    // Footstep audio triggers
    const velocityMag = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (velocityMag > 0.05 && this.onGround && !this.isFlying) {
      if (!this.stepTimer) this.stepTimer = 0;
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.isSprinting ? 0.28 : 0.38;
        
        const bx = Math.floor(this.position.x);
        const by = Math.floor(this.position.y - 0.1);
        const bz = Math.floor(this.position.z);
        const bid = this.engine.world.getBlock(bx, by, bz);
        
        const mat = this.getStepMaterial(bid);
        this.engine.sounds.playStep(mat);
      }
    } else {
      this.stepTimer = 0;
    }

    // Fall damage calculation (Survival and Story mode)
    if (!this.isFlying && (this.engine.gameMode === 'survival' || this.engine.gameMode === 'story')) {
      const dy = prevY - this.position.y;
      // If we landed with high downward speed, take fall damage
      if (this.onGround && velocity.y === 0 && dy > 4) {
        const dmg = Math.floor((dy - 3.5) * 1.5);
        if (dmg > 0) {
          this.takeDamage(dmg, "Fell from a high place");
        }
      }

      // Void death trigger
      if (this.position.y < -30) {
        this.takeDamage(20, "Fell out of the world");
      }
    }

    // Update block mining timers
    if (this.isMining && this.mineTarget) {
      // Check if look target matches mining target
      const ray = this.engine.physics.getLookBlock(this.engine.camera, 5);
      if (ray && ray.target.equals(this.mineTarget)) {
        this.mineTimer += delta * 1000;
        
        const pct = Math.min((this.mineTimer / this.mineDurability) * 100, 100);
        document.getElementById('break-progress-bar').style.width = `${pct}%`;

        if (this.mineTimer >= this.mineDurability) {
          this.breakTargetBlock();
          this.stopMining();
        }
      } else {
        // Looked away, reset progress
        this.stopMining();
      }
    }

    // Stats decay (Hunger & Health Regeneration) in Survival and Story modes
    if (!this.isFlying && (this.engine.gameMode === 'survival' || this.engine.gameMode === 'story')) {
      if (!this.hungerDecayTimer) this.hungerDecayTimer = 0;
      
      const activityMult = (this.isSprinting ? 2.5 : 1.0) * (inputMag > 0 ? 1.0 : 0.2);
      this.hungerDecayTimer += delta * activityMult;

      // Lose 1 hunger point every 14 seconds of activity
      if (this.hungerDecayTimer >= 14.0) {
        this.hungerDecayTimer = 0;
        if (this.hunger > 0) {
          this.hunger = Math.max(0, this.hunger - 1);
          this.updateHUD();
        }
      }

      // Starving damage
      if (!this.starveTimer) this.starveTimer = 0;
      if (this.hunger === 0) {
        this.starveTimer += delta;
        if (this.starveTimer >= 4.0) {
          this.starveTimer = 0;
          this.takeDamage(1, "Starved to death");
        }
      } else {
        this.starveTimer = 0;
      }

      // Health regeneration when full
      if (!this.regenTimer) this.regenTimer = 0;
      if (this.hunger >= 18 && this.health < 20) {
        this.regenTimer += delta;
        if (this.regenTimer >= 4.0) {
          this.regenTimer = 0;
          this.health = Math.min(20, this.health + 1);
          this.updateHUD();
        }
      } else {
        this.regenTimer = 0;
      }
    }
  }

  updateHUD() {
    const healthBar = document.getElementById('health-bar');
    const hungerBar = document.getElementById('hunger-bar');

    if (this.engine.gameMode === 'creative') {
      if (healthBar) healthBar.style.display = 'none';
      if (hungerBar) hungerBar.style.display = 'none';
      return;
    } else {
      if (healthBar) healthBar.style.display = 'flex';
      if (hungerBar) hungerBar.style.display = 'flex';
    }

    // 1. Health Bar
    if (healthBar) {
      healthBar.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        let type = 'empty';
        if (this.health >= (i + 1) * 2) {
          type = 'full';
        } else if (this.health >= i * 2 + 1) {
          type = 'half';
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = HEART_SVG[type];
        healthBar.appendChild(tempDiv.firstChild);
      }
    }

    // 2. Hunger Bar
    if (hungerBar) {
      hungerBar.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        let type = 'empty';
        if (this.hunger >= (i + 1) * 2) {
          type = 'full';
        } else if (this.hunger >= i * 2 + 1) {
          type = 'half';
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = FOOD_SVG[type];
        hungerBar.appendChild(tempDiv.firstChild);
      }
    }
  }

  getStepMaterial(bid) {
    if (bid === BLOCK.GRASS || bid === BLOCK.LEAVES || bid === BLOCK.CHERRY_LEAVES) return 'grass';
    if (bid === BLOCK.SAND) return 'sand';
    if (bid === BLOCK.STONE || bid === BLOCK.COBBLESTONE) return 'stone';
    if (bid === BLOCK.WOOD || bid === BLOCK.PLANKS || bid === BLOCK.CHERRY_WOOD) return 'wood';
    return 'wood';
  }
}
