import * as THREE from 'three';
import { BLOCK, BLOCK_DEFS } from './world.js';

// Procedural Canvas Texture for Villager Face details
function createVillagerHeadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Base skin
  ctx.fillStyle = '#df9f7f';
  ctx.fillRect(0, 0, 32, 32);
  
  // Add pixel noise
  for (let x = 0; x < 32; x += 2) {
    for (let y = 0; y < 32; y += 2) {
      if (Math.random() > 0.6) {
        ctx.fillStyle = Math.random() > 0.5 ? '#d29070' : '#ebaa8b';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  
  // Unibrow (dark brown)
  ctx.fillStyle = '#3a2113';
  ctx.fillRect(6, 10, 20, 3);
  
  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, 15, 6, 4);
  ctx.fillStyle = '#17c43d';
  ctx.fillRect(8, 15, 2, 4);
  ctx.fillStyle = '#000000';
  ctx.fillRect(8, 16, 2, 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 15, 6, 4);
  ctx.fillStyle = '#17c43d';
  ctx.fillRect(20, 15, 2, 4);
  ctx.fillStyle = '#000000';
  ctx.fillRect(20, 16, 2, 2);

  // Mouth
  ctx.fillStyle = '#bd7757';
  ctx.fillRect(10, 24, 12, 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// Procedural Canvas Texture for Villager Robe details
function createVillagerRobeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Robe brown
  ctx.fillStyle = '#82543d';
  ctx.fillRect(0, 0, 32, 32);
  
  // Add noise
  for (let x = 0; x < 32; x += 2) {
    for (let y = 0; y < 32; y += 2) {
      if (Math.random() > 0.6) {
        ctx.fillStyle = Math.random() > 0.5 ? '#704530' : '#93634c';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  
  ctx.fillStyle = '#613b28';
  ctx.fillRect(0, 0, 32, 4);
  ctx.fillRect(14, 4, 4, 28);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export class MobsManager {
  constructor(engine) {
    this.engine = engine;
    this.mobs = [];
    this.mobsGroup = new THREE.Group();
    this.engine.scene.add(this.mobsGroup);
    
    this.spawnTimer = 0;
  }

  spawnVillager(x, y, z) {
    const villager = new Villager(this.engine, x, y, z);
    this.mobs.push(villager);
    this.mobsGroup.add(villager.mesh);
    return villager;
  }

  spawnSheep(x, y, z, biome = 'plains') {
    const sheep = new Sheep(this.engine, x, y, z, biome);
    this.mobs.push(sheep);
    this.mobsGroup.add(sheep.mesh);
    return sheep;
  }

  spawnZombie(x, y, z, biome = 'plains') {
    const zombie = new Zombie(this.engine, x, y, z, biome);
    this.mobs.push(zombie);
    this.mobsGroup.add(zombie.mesh);
    return zombie;
  }

  spawnCow(x, y, z) {
    const cow = new Cow(this.engine, x, y, z);
    this.mobs.push(cow);
    this.mobsGroup.add(cow.mesh);
    return cow;
  }

  spawnChicken(x, y, z) {
    const chicken = new Chicken(this.engine, x, y, z);
    this.mobs.push(chicken);
    this.mobsGroup.add(chicken.mesh);
    return chicken;
  }

  spawnSkeleton(x, y, z, biome = 'plains') {
    const skeleton = new Skeleton(this.engine, x, y, z, biome);
    this.mobs.push(skeleton);
    this.mobsGroup.add(skeleton.mesh);
    return skeleton;
  }

  spawnSpider(x, y, z, biome = 'plains') {
    const spider = new Spider(this.engine, x, y, z, biome);
    this.mobs.push(spider);
    this.mobsGroup.add(spider.mesh);
    return spider;
  }

  spawnDarkBoss(x, y, z) {
    const boss = new DarkBoss(this.engine, x, y, z);
    this.mobs.push(boss);
    this.mobsGroup.add(boss.mesh);
    return boss;
  }

  spawnPolarBear(x, y, z) {
    const bear = new PolarBear(this.engine, x, y, z);
    this.mobs.push(bear);
    this.mobsGroup.add(bear.mesh);
    return bear;
  }

  spawnGoat(x, y, z) {
    const goat = new Goat(this.engine, x, y, z);
    this.mobs.push(goat);
    this.mobsGroup.add(goat.mesh);
    return goat;
  }

  spawnPanther(x, y, z) {
    const panther = new Panther(this.engine, x, y, z);
    this.mobs.push(panther);
    this.mobsGroup.add(panther.mesh);
    return panther;
  }

  checkMobClick(camera, maxDistance = 5) {
    const start = camera.position;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    
    const ray = new THREE.Ray(start, dir);
    let closestMob = null;
    let closestDist = maxDistance;

    this.mobs.forEach(mob => {
      if (mob instanceof Villager && !mob.isDead) {
        const center = mob.position.clone().add(new THREE.Vector3(0, 0.9, 0));
        const sphere = new THREE.Sphere(center, 0.7);
        
        const intersection = new THREE.Vector3();
        if (ray.intersectSphere(sphere, intersection)) {
          const dist = start.distanceTo(intersection);
          if (dist < closestDist) {
            closestDist = dist;
            closestMob = mob;
          }
        }
      }
    });

    return closestMob;
  }

  checkMobHit(camera, maxDistance = 4) {
    const start = camera.position;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const ray = new THREE.Ray(start, dir);
    
    let closestMob = null;
    let closestDist = maxDistance;

    this.mobs.forEach(mob => {
      if (mob.isDead) return;
      const hOffset = mob.height !== undefined ? mob.height / 2 : 0.8;
      const wRad = mob.width !== undefined ? mob.width : 0.6;
      
      const center = mob.position.clone().add(new THREE.Vector3(0, hOffset, 0));
      const sphere = new THREE.Sphere(center, Math.max(wRad, hOffset));
      
      const intersection = new THREE.Vector3();
      if (ray.intersectSphere(sphere, intersection)) {
        const dist = start.distanceTo(intersection);
        if (dist < closestDist) {
          closestDist = dist;
          closestMob = mob;
        }
      }
    });

    return closestMob;
  }

  spawnNightHordeAroundPlayer() {
    if (!this.engine.player) return;
    const playerPos = this.engine.player.position;
    const world = this.engine.world;

    const horde = [
      'zombie', 'zombie', 'zombie', 'zombie',
      'skeleton', 'skeleton', 'skeleton', 'skeleton',
      'spider', 'spider'
    ];

    horde.forEach((mobType, idx) => {
      const angle = (idx / horde.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 22 + Math.random() * 12; // 22 to 34 blocks away (safe distance!)
      const rx = playerPos.x + Math.cos(angle) * distance;
      const rz = playerPos.z + Math.sin(angle) * distance;
      let ry = world.getTerrainHeight(rx, rz);
      if (ry < world.seaLevel) ry = world.seaLevel + 1;

      if (mobType === 'zombie') this.spawnZombie(rx, ry + 1, rz);
      else if (mobType === 'skeleton') this.spawnSkeleton(rx, ry + 1, rz);
      else if (mobType === 'spider') this.spawnSpider(rx, ry + 1, rz);
    });

    const msg = document.createElement('div');
    msg.style.position = 'absolute';
    msg.style.top = '20%';
    msg.style.left = '50%';
    msg.style.transform = 'translate(-50%, -50%)';
    msg.style.backgroundColor = 'rgba(30, 0, 0, 0.9)';
    msg.style.border = '3px solid #ff0044';
    msg.style.color = '#ff3366';
    msg.style.padding = '14px 28px';
    msg.style.fontFamily = "'VT323', monospace";
    msg.style.fontSize = '30px';
    msg.style.borderRadius = '8px';
    msg.style.zIndex = '9999';
    msg.style.textAlign = 'center';
    msg.innerHTML = `🌙 NIGHT HAS FALLEN!<br><span style="color:#fff;font-size:22px;">Zombies, Skeletons & Spiders are emerging!</span>`;
    document.body.appendChild(msg);

    setTimeout(() => { msg.remove(); }, 3500);
  }

  spawnRandomMobsAroundPlayer() {
    if (!this.engine.player || this.mobs.length > 50) return;

    const playerPos = this.engine.player.position;
    const world = this.engine.world;

    const isNight = this.engine.timeOfDay > 18000 || this.engine.timeOfDay < 6000;
    const spawnBatch = isNight ? 4 : 2;

    for (let batch = 0; batch < spawnBatch; batch++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 16; // 20 to 36 blocks away
      const rx = playerPos.x + Math.cos(angle) * distance;
      const rz = playerPos.z + Math.sin(angle) * distance;
      let ry = world.getTerrainHeight(rx, rz);
      if (ry < world.seaLevel) ry = world.seaLevel + 1;

      const cellBiome = world.getBiome(rx, rz);
      const rand = Math.random();
          if (isNight) {
        if (cellBiome === 'snow') {
          if (rand < 0.40) this.spawnPolarBear(rx, ry + 1, rz);
          else if (rand < 0.75) this.spawnSkeleton(rx, ry + 1, rz, cellBiome);
          else this.spawnSpider(rx, ry + 1, rz, cellBiome);
        } else if (cellBiome === 'jungle') {
          if (rand < 0.45) this.spawnPanther(rx, ry + 1, rz);
          else if (rand < 0.75) this.spawnSpider(rx, ry + 1, rz, cellBiome);
          else this.spawnZombie(rx, ry + 1, rz, cellBiome);
        } else if (cellBiome === 'mountains') {
          if (rand < 0.40) this.spawnGoat(rx, ry + 1, rz);
          else if (rand < 0.75) this.spawnSkeleton(rx, ry + 1, rz, cellBiome);
          else this.spawnZombie(rx, ry + 1, rz, cellBiome);
        } else {
          if (rand < 0.45) this.spawnZombie(rx, ry + 1, rz, cellBiome);
          else if (rand < 0.8) this.spawnSkeleton(rx, ry + 1, rz, cellBiome);
          else this.spawnSpider(rx, ry + 1, rz, cellBiome);
        }
      } else {
        if (cellBiome === 'snow') {
          if (rand < 0.55) this.spawnPolarBear(rx, ry + 1, rz);
          else if (rand < 0.80) this.spawnSheep(rx, ry + 1, rz, cellBiome);
          else this.spawnCow(rx, ry + 1, rz);
        } else if (cellBiome === 'mountains') {
          if (rand < 0.65) this.spawnGoat(rx, ry + 1, rz);
          else if (rand < 0.85) this.spawnSheep(rx, ry + 1, rz, cellBiome);
          else this.spawnCow(rx, ry + 1, rz);
        } else if (cellBiome === 'jungle') {
          if (rand < 0.50) this.spawnPanther(rx, ry + 1, rz);
          else if (rand < 0.80) this.spawnChicken(rx, ry + 1, rz);
          else this.spawnCow(rx, ry + 1, rz);
        } else {
          if (rand < 0.35) this.spawnSheep(rx, ry + 1, rz, cellBiome);
          else if (rand < 0.7) this.spawnCow(rx, ry + 1, rz);
          else this.spawnChicken(rx, ry + 1, rz);
        }
      }
    }
  }

  update(delta) {
    const isNight = this.engine.timeOfDay > 18000 || this.engine.timeOfDay < 6000;
    if (isNight && !this.wasNight) {
      this.wasNight = true;
      this.spawnNightHordeAroundPlayer();
    } else if (!isNight && this.wasNight) {
      this.wasNight = false;
    }

    this.spawnTimer += delta;
    if (this.spawnTimer > 1.8) {
      this.spawnTimer = 0;
      this.spawnRandomMobsAroundPlayer();
    }

    this.mobs = this.mobs.filter(mob => {
      if (!mob.mesh.parent) return false;

      // Despawn non-essential mobs that are too far (> 65 blocks) to keep biome spawning active!
      if (this.engine.player && !(mob instanceof Villager) && !(mob instanceof DarkBoss)) {
        const dist = mob.position.distanceTo(this.engine.player.position);
        if (dist > 65) {
          mob.mesh.parent?.remove(mob.mesh);
          return false;
        }
      }

      mob.update(delta);
      return true;
    });
  }
}

class Villager {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    this.width = 0.6;
    this.height = 1.8;
    this.onGround = false;
    this.speed = 1.2;
    this.health = 20;
    this.isDead = false;

    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.targetBed = null;
    this.isSleeping = false;
    this.sleepCheckTimer = 0;
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    
    this.trades = [
      { input1: { id: 'wheat', count: 6 }, input2: null, output: { id: 'emerald', count: 1 } },
      { input1: { id: 'emerald', count: 1 }, input2: null, output: { id: 'bread', count: 3 } },
      { input1: { id: 'cobblestone', count: 8 }, input2: null, output: { id: 'emerald', count: 1 } },
      { input1: { id: 'emerald', count: 2 }, input2: null, output: { id: 'iron_ingot', count: 1 } }
    ];

    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const headTex = createVillagerHeadTexture();
    const robeTex = createVillagerRobeTexture();

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xdf9f7f });
    const headFrontMat = new THREE.MeshLambertMaterial({ map: headTex });
    
    const headMaterials = [
      skinMat, skinMat, skinMat, skinMat, headFrontMat, skinMat
    ];

    const robeMat = new THREE.MeshLambertMaterial({ map: robeTex });
    const collarMat = new THREE.MeshLambertMaterial({ color: 0x613b28 });
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x242424 });

    const torsoGeom = new THREE.BoxGeometry(0.55, 0.85, 0.45);
    const torsoMesh = new THREE.Mesh(torsoGeom, robeMat);
    torsoMesh.position.set(0, 0.82, 0);
    this.mesh.add(torsoMesh);

    const collarGeom = new THREE.BoxGeometry(0.58, 0.1, 0.48);
    const collarMesh = new THREE.Mesh(collarGeom, collarMat);
    collarMesh.position.set(0, 1.2, 0);
    this.mesh.add(collarMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0);
    
    const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const headMesh = new THREE.Mesh(headGeom, headMaterials);
    this.headGroup.add(headMesh);
    
    const noseGeom = new THREE.BoxGeometry(0.12, 0.22, 0.16);
    const noseMesh = new THREE.Mesh(noseGeom, skinMat);
    noseMesh.position.set(0, -0.06, 0.28);
    this.headGroup.add(noseMesh);
    
    this.mesh.add(this.headGroup);

    const armGeom = new THREE.BoxGeometry(0.65, 0.22, 0.24);
    const armMesh = new THREE.Mesh(armGeom, robeMat);
    armMesh.position.set(0, 0.72, 0.26);
    this.mesh.add(armMesh);

    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.18), shoeMat);
    this.leftLeg.position.set(-0.11, 0.24, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.18), shoeMat);
    this.rightLeg.position.set(0.11, 0.24, 0);
    this.mesh.add(this.rightLeg);

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    if (this.isSleeping) {
      this.isSleeping = false;
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;
    }
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    this.isRunningAway = true;
    this.runAwayTimer = 3.5;
    this.wanderTimer = 0;

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.5);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 4.0;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material && !Array.isArray(child.material) && child.material.color) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && !Array.isArray(child.material) && child.material.color && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 450;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.3;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }

    const isNight = this.engine.timeOfDay > 18000 || this.engine.timeOfDay < 6000;

    if (isNight && !this.isRunningAway) {
      if (!this.isSleeping) {
        this.sleepCheckTimer -= delta;
        if (!this.targetBed && this.sleepCheckTimer <= 0) {
          this.sleepCheckTimer = 1.0;
          this.findNearestBed();
        }

        if (this.targetBed) {
          const dx = this.targetBed.x + 0.5 - this.position.x;
          const dz = this.targetBed.z + 0.5 - this.position.z;
          const dist2D = Math.sqrt(dx * dx + dz * dz);

          if (dist2D < 0.8) {
            this.isSleeping = true;
            this.velocity.set(0, 0, 0);
            
            let headX = this.targetBed.x, headY = this.targetBed.y, headZ = this.targetBed.z;
            let footX = this.targetBed.x, footZ = this.targetBed.z;
            
            const bid = this.engine.world.getBlock(this.targetBed.x, this.targetBed.y, this.targetBed.z);
            if (bid === BLOCK.BED_FOOT) {
              const neighbors = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
              for (const n of neighbors) {
                if (this.engine.world.getBlock(this.targetBed.x + n.x, this.targetBed.y, this.targetBed.z + n.z) === BLOCK.BED_HEAD) {
                  headX = this.targetBed.x + n.x;
                  headZ = this.targetBed.z + n.z;
                  break;
                }
              }
            } else if (bid === BLOCK.BED_HEAD) {
              const neighbors = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
              for (const n of neighbors) {
                if (this.engine.world.getBlock(this.targetBed.x + n.x, this.targetBed.y, this.targetBed.z + n.z) === BLOCK.BED_FOOT) {
                  footX = this.targetBed.x + n.x;
                  footZ = this.targetBed.z + n.z;
                  break;
                }
              }
            }

            const angle = Math.atan2(headX - footX, headZ - footZ);
            this.position.set(footX + 0.5, headY + 1.0, footZ + 0.5);
            this.mesh.position.copy(this.position);
            
            this.mesh.rotation.y = angle;
            this.mesh.rotation.x = Math.PI / 2;
            this.mesh.rotation.z = 0;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
          } else {
            this.velocity.x = (dx / dist2D) * this.speed;
            this.velocity.z = (dz / dist2D) * this.speed;
            this.mesh.rotation.y = Math.atan2(dx, dz);
            this.isMoving = true;

            const swing = Math.sin(performance.now() * 0.008) * 0.45;
            this.leftLeg.rotation.x = swing;
            this.rightLeg.rotation.x = -swing;

            if (this.onGround) {
              const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.4);
              const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.4);
              const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
              const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 1.0), az);
              if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
                this.velocity.y = 8.5;
              }
            }

            this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
            this.mesh.position.copy(this.position);
          }
        } else {
          this.wander(delta);
        }
      } else {
        this.velocity.set(0, 0, 0);
        if (Math.random() < 0.01) this.spawnZzzParticle();
      }
      return;
    } else {
      if (this.isSleeping) {
        this.isSleeping = false;
        this.targetBed = null;
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
      }
      this.wander(delta);
    }
  }

  wander(delta) {
    this.wanderTimer -= delta;
    
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.6) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.8 : 1.5 + Math.random() * 2.5;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
      } else {
        this.isMoving = false;
        this.wanderTimer = 1.0 + Math.random() * 2.0;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.5 : this.speed;

    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;
      
      const swing = Math.sin(performance.now() * (this.isRunningAway ? 0.016 : 0.008)) * 0.45;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }

    if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.4);
      const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.4);
      const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
      const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 1.0), az);
      if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
        this.velocity.y = 8.5;
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);
  }

  findNearestBed() {
    const world = this.engine.world;
    const px = Math.floor(this.position.x), py = Math.floor(this.position.y), pz = Math.floor(this.position.z);
    let closestBed = null, closestDistSq = Infinity;
    const radius = 15, yRadius = 4;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dy = -yRadius; dy <= yRadius; dy++) {
          const bx = px + dx, by = py + dy, bz = pz + dz;
          const block = world.getBlock(bx, by, bz);
          if (block === BLOCK.BED_HEAD || block === BLOCK.BED_FOOT) {
            const bedCoords = [{ x: bx, y: by, z: bz }];
            const partnerType = block === BLOCK.BED_HEAD ? BLOCK.BED_FOOT : BLOCK.BED_HEAD;
            const neighbors = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
            for (const n of neighbors) {
              if (world.getBlock(bx + n.x, by, bz + n.z) === partnerType) {
                bedCoords.push({ x: bx + n.x, y: by, z: bz + n.z });
                break;
              }
            }

            let taken = false;
            this.engine.mobs.mobs.forEach(mob => {
              if (mob !== this && mob instanceof Villager && mob.targetBed) {
                const isTargetingBed = bedCoords.some(coord => 
                  mob.targetBed.x === coord.x && mob.targetBed.y === coord.y && mob.targetBed.z === coord.z
                );
                if (isTargetingBed) taken = true;
              }
            });

            if (!taken) {
              const distSq = dx * dx + dy * dy + dz * dz;
              if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closestBed = new THREE.Vector3(bx, by, bz);
              }
            }
          }
        }
      }
    }
    if (closestBed) this.targetBed = closestBed;
  }

  spawnZzzParticle() {
    const text = document.createElement('div');
    text.className = 'zzz-text';
    text.textContent = 'Zzz';
    text.style.position = 'absolute';
    text.style.color = '#aa88ff';
    text.style.fontFamily = "'VT323', monospace";
    text.style.fontSize = '20px';
    text.style.textShadow = '1px 1px 0 #000';
    text.style.pointerEvents = 'none';
    text.style.zIndex = '100';

    const headPos = this.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    headPos.project(this.engine.camera);
    if (headPos.z > 1) return;

    const x = (headPos.x * .5 + .5) * window.innerWidth;
    const y = (-(headPos.y * .5) + .5) * window.innerHeight;
    text.style.left = `${x}px`;
    text.style.top = `${y}px`;
    document.body.appendChild(text);

    let startTime = performance.now();
    const duration = 1200;
    const anim = () => {
      const progress = (performance.now() - startTime) / duration;
      if (progress >= 1) {
        text.remove();
      } else {
        text.style.left = `${x + Math.sin(progress * 10) * 15}px`;
        text.style.top = `${y - progress * 40}px`;
        text.style.opacity = 1 - progress;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }
}

class Sheep {
  constructor(engine, x, y, z, biome = 'plains') {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.biome = biome;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.6;
    this.height = 0.9;
    this.onGround = false;
    this.speed = 1.0;
    this.health = 8;
    this.isDead = false;

    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    this.drops = [
      { id: 'raw_mutton', min: 1, max: 2 },
      { id: 'wool', min: 1, max: 2 }
    ];
    
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    let woolColor = 0xfafafa;
    if (this.biome === 'cherry_blossom') woolColor = 0xffb7d5;
    else if (this.biome === 'jungle') woolColor = 0xffd700;
    else if (this.biome === 'snow') woolColor = 0xe6f2ff;
    else if (this.biome === 'mountains') woolColor = 0xd0d0d0;

    const woolMat = new THREE.MeshLambertMaterial({ color: woolColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xdfbca7 });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.8), woolMat);
    body.position.set(0, 0.45, 0);
    this.mesh.add(body);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.65, 0.45);
    
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), woolMat);
    this.head.add(headMesh);
    
    const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.08), skinMat);
    faceMesh.position.set(0, -0.06, 0.16);
    this.head.add(faceMesh);

    const eyeGeom = new THREE.BoxGeometry(0.06, 0.04, 0.02);
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.08, -0.04, 0.2);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.08, -0.04, 0.2);
    this.head.add(rightEye);

    this.mesh.add(this.head);

    const legGeom = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    this.legs = [];
    const legPositions = [
      [-0.18, 0.175, 0.25], [0.18, 0.175, 0.25], [-0.18, 0.175, -0.25], [0.18, 0.175, -0.25]
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeom, woolMat);
      leg.position.set(...pos);
      this.mesh.add(leg);
      this.legs.push(leg);
    });

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    this.isRunningAway = true;
    this.runAwayTimer = 3.5;
    this.wanderTimer = 0;

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.0);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 3.5;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    const x = this.position.x, y = this.position.y + 0.3, z = this.position.z;
    this.drops.forEach(drop => {
      const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(x, y, z, drop.id);
      }
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 400;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.2;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }

    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.5) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.8 : 2.0 + Math.random() * 3.0;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
      } else {
        this.isMoving = false;
        this.wanderTimer = 1.5 + Math.random() * 2.5;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.5 : this.speed;

    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;

      const swing = Math.sin(performance.now() * (this.isRunningAway ? 0.016 : 0.008)) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.legs.forEach(l => l.rotation.x = 0);
    }

    if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.4);
      const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.4);
      const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
      const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 1.0), az);
      if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
        this.velocity.y = 8.5;
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);

    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Zombie {
  constructor(engine, x, y, z, biome = 'plains') {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.biome = biome;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.6;
    this.height = 1.8;
    this.onGround = false;
    this.speed = 1.8;
    this.health = 20;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.drops = [{ id: 'rotten_flesh', min: 1, max: 2 }];

    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    let skinColor = 0x44aa44;
    let shirtColor = 0x2244aa;
    let pantsColor = 0x552255;

    if (this.biome === 'snow') {
      skinColor = 0x99ccff; // Frost Yeti Zombie
      shirtColor = 0xe6f2ff;
      pantsColor = 0x3b5998;
    } else if (this.biome === 'desert') {
      skinColor = 0xd2b48c; // Sand Husk Zombie
      shirtColor = 0xc2a649;
      pantsColor = 0x6e5223;
    } else if (this.biome === 'jungle') {
      skinColor = 0x1b5e20; // Deep Jungle Serpent Zombie
      shirtColor = 0x33691e;
      pantsColor = 0x2e7d32;
    }

    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.4), shirtMat);
    torso.position.set(0, 0.8, 0);
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), skinMat);
    head.position.set(0, 1.44, 0);
    this.mesh.add(head);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), skinMat);
    leftArm.position.set(-0.35, 0.9, 0.22);
    leftArm.rotation.x = Math.PI / 2;
    this.mesh.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), skinMat);
    rightArm.position.set(0.35, 0.9, 0.22);
    rightArm.rotation.x = Math.PI / 2;
    this.mesh.add(rightArm);

    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), pantsMat);
    this.leftLeg.position.set(-0.11, 0.25, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), pantsMat);
    this.rightLeg.position.set(0.11, 0.25, 0);
    this.mesh.add(this.rightLeg);

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.0);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 3.5;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    const x = this.position.x, y = this.position.y + 0.5, z = this.position.z;
    this.drops.forEach(drop => {
      const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(x, y, z, drop.id);
      }
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 400;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.3;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    const isDay = this.engine.timeOfDay >= 6000 && this.engine.timeOfDay <= 18000;
    if (isDay) {
      const bx = Math.floor(this.position.x);
      const bz = Math.floor(this.position.z);
      const terrainH = this.engine.world.getTerrainHeight(bx, bz);
      if (this.position.y >= terrainH - 0.5) {
        this.health -= delta * 5.0;
        if (this.health <= 0) {
          this.mesh.parent?.remove(this.mesh);
          return;
        }
      }
    }

    if (this.engine.player && !this.engine.player.isDead) {
      const playerPos = this.engine.player.position;
      const dist = this.position.distanceTo(playerPos);

      if (dist < 40) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        dir.y = 0;
        dir.normalize();

        this.velocity.x = dir.x * this.speed;
        this.velocity.z = dir.z * this.speed;
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        const swing = Math.sin(performance.now() * 0.01) * 0.5;
        this.leftLeg.rotation.x = swing;
        this.rightLeg.rotation.x = -swing;

        if (dist < 1.1) {
          if (Math.random() < 0.02) {
            this.engine.player.takeDamage(2, "Slain by a Zombie");
          }
        }
      } else {
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          if (Math.random() < 0.4) {
            this.isMoving = true;
            const angle = Math.random() * Math.PI * 2;
            this.moveDir.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
            this.wanderTimer = 2.0 + Math.random() * 3.0;
            this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
          } else {
            this.isMoving = false;
            this.wanderTimer = 1.5 + Math.random() * 2.5;
          }
        }

        if (this.isMoving) {
          this.velocity.x = this.moveDir.x * (this.speed * 0.6);
          this.velocity.z = this.moveDir.z * (this.speed * 0.6);
          const swing = Math.sin(performance.now() * 0.005) * 0.3;
          this.leftLeg.rotation.x = swing;
          this.rightLeg.rotation.x = -swing;
        } else {
          this.velocity.set(0, 0, 0);
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        }
      }
    }

    if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.4);
      const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.4);
      const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
      const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 1.0), az);
      if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
        this.velocity.y = 8.5;
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);

    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Cow {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.8;
    this.height = 1.2;
    this.onGround = false;
    this.speed = 1.0;
    this.health = 10;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    this.drops = [{ id: 'raw_beef', min: 1, max: 3 }];
    
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const skinMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const hornMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 1.1), skinMat);
    body.position.set(0, 0.6, 0);
    this.mesh.add(body);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.9, 0.6);
    
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), skinMat);
    this.head.add(headMesh);

    const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), hornMat);
    leftHorn.position.set(-0.16, 0.2, -0.06);
    leftHorn.rotation.z = 0.2;
    this.head.add(leftHorn);

    const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), hornMat);
    rightHorn.position.set(0.16, 0.2, -0.06);
    rightHorn.rotation.z = -0.2;
    this.head.add(rightHorn);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    leftEye.position.set(-0.09, 0.05, 0.18);
    this.head.add(leftEye);
    
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    rightEye.position.set(0.09, 0.05, 0.18);
    this.head.add(rightEye);

    this.mesh.add(this.head);

    const legGeom = new THREE.BoxGeometry(0.16, 0.45, 0.16);
    this.legs = [];
    const legPos = [
      [-0.22, 0.225, 0.35], [0.22, 0.225, 0.35], [-0.22, 0.225, -0.35], [0.22, 0.225, -0.35]
    ];
    legPos.forEach(pos => {
      const leg = new THREE.Mesh(legGeom, skinMat);
      leg.position.set(...pos);
      this.mesh.add(leg);
      this.legs.push(leg);
    });

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    this.isRunningAway = true;
    this.runAwayTimer = 3.5;
    this.wanderTimer = 0;

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.0);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 3.5;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    const x = this.position.x, y = this.position.y + 0.4, z = this.position.z;
    this.drops.forEach(drop => {
      const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(x, y, z, drop.id);
      }
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 400;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.3;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }

    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.6) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.8 : 2.0 + Math.random() * 3.0;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
      } else {
        this.isMoving = false;
        this.wanderTimer = 1.5 + Math.random() * 2.5;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.5 : this.speed;

    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;

      const swing = Math.sin(performance.now() * (this.isRunningAway ? 0.016 : 0.008)) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.legs.forEach(l => l.rotation.x = 0);
    }

    if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.5);
      const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.5);
      const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
      const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 1.0), az);
      if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
        this.velocity.y = 8.5;
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);

    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Chicken {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.35;
    this.height = 0.5;
    this.onGround = false;
    this.speed = 0.8;
    this.health = 4;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    this.drops = [{ id: 'raw_chicken', min: 1, max: 1 }];
    
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const featherMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    const wattleMat = new THREE.MeshLambertMaterial({ color: 0xff2222 });
    const legMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), featherMat);
    body.position.set(0, 0.22, 0);
    this.mesh.add(body);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.4, 0.15);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), featherMat);
    this.head.add(headMesh);

    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), beakMat);
    beak.position.set(0, 0, 0.12);
    this.head.add(beak);

    const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), wattleMat);
    wattle.position.set(0, -0.08, 0.08);
    this.head.add(wattle);

    this.mesh.add(this.head);

    this.leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.25), featherMat);
    this.leftWing.position.set(-0.16, 0.24, 0);
    this.mesh.add(this.leftWing);

    this.rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.25), featherMat);
    this.rightWing.position.set(0.16, 0.24, 0);
    this.mesh.add(this.rightWing);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), legMat);
    leftLeg.position.set(-0.06, 0.075, 0);
    this.mesh.add(leftLeg);
    this.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), legMat);
    rightLeg.position.set(0.06, 0.075, 0);
    this.mesh.add(rightLeg);
    this.rightLeg = rightLeg;

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    this.isRunningAway = true;
    this.runAwayTimer = 3.5;
    this.wanderTimer = 0;

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.0);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 3.0;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    const x = this.position.x, y = this.position.y + 0.2, z = this.position.z;
    this.drops.forEach(drop => {
      this.engine.spawnItemDrop(x, y, z, drop.id);
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 400;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.2;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }

    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.6) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.8 : 2.0 + Math.random() * 3.0;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
      } else {
        this.isMoving = false;
        this.wanderTimer = 1.5 + Math.random() * 2.5;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.5 : this.speed;

    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;

      const swing = Math.sin(performance.now() * (this.isRunningAway ? 0.024 : 0.012)) * 0.6;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;

      const flap = Math.sin(performance.now() * 0.03) * 0.4;
      this.leftWing.rotation.z = -Math.abs(flap);
      this.rightWing.rotation.z = Math.abs(flap);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftWing.rotation.z = 0;
      this.rightWing.rotation.z = 0;
    }

    if (!this.onGround && this.velocity.y < 0) {
      this.velocity.y = -1.5;
      const flap = Math.sin(performance.now() * 0.05) * 0.6;
      this.leftWing.rotation.z = -Math.abs(flap);
      this.rightWing.rotation.z = Math.abs(flap);
    } else {
      this.velocity.y -= 20.0 * delta;
    }

    if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.3);
      const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.3);
      const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
      const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 0.6), az);
      if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
        this.velocity.y = 5.0;
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);

    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Skeleton {
  constructor(engine, x, y, z, biome = 'plains') {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.biome = biome;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.6;
    this.height = 1.8;
    this.onGround = false;
    this.speed = 1.6;
    this.health = 20;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.shootTimer = 0;
    this.drops = [
      { id: 'arrow', min: 1, max: 2 },
      { id: 'bone', min: 1, max: 2 }
    ];

    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    let boneColor = 0xdddddd;
    if (this.biome === 'snow' || this.biome === 'mountains') {
      boneColor = 0x80d8ff; // Frost Ice Skeleton
    } else if (this.biome === 'jungle') {
      boneColor = 0xa5d6a7; // Mossy Skeleton
    }

    const boneMat = new THREE.MeshLambertMaterial({ color: boneColor });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.12), boneMat);
    torso.position.set(0, 0.8, 0);
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), boneMat);
    head.position.set(0, 1.39, 0);
    this.mesh.add(head);

    this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), boneMat);
    this.leftArm.position.set(-0.2, 0.8, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), boneMat);
    this.rightArm.position.set(0.2, 0.8, 0);
    this.mesh.add(this.rightArm);

    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), boneMat);
    this.leftLeg.position.set(-0.08, 0.25, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), boneMat);
    this.rightLeg.position.set(0.08, 0.25, 0);
    this.mesh.add(this.rightLeg);

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.0);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 3.5;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    const x = this.position.x, y = this.position.y + 0.5, z = this.position.z;
    this.drops.forEach(drop => {
      const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(x, y, z, drop.id);
      }
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 400;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.3;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    const isDay = this.engine.timeOfDay >= 6000 && this.engine.timeOfDay <= 18000;
    if (isDay) {
      const bx = Math.floor(this.position.x);
      const bz = Math.floor(this.position.z);
      const terrainH = this.engine.world.getTerrainHeight(bx, bz);
      if (this.position.y >= terrainH - 0.5) {
        this.health -= delta * 5.0;
        if (this.health <= 0) {
          this.mesh.parent?.remove(this.mesh);
          return;
        }
      }
    }

    if (this.engine.player && !this.engine.player.isDead) {
      const playerPos = this.engine.player.position;
      const dist = this.position.distanceTo(playerPos);

      if (dist < 40) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        dir.y = 0;
        dir.normalize();

        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        this.leftArm.rotation.x = Math.PI / 2;
        this.rightArm.rotation.x = Math.PI / 2;

        if (dist > 8) {
          this.velocity.x = dir.x * this.speed;
          this.velocity.z = dir.z * this.speed;
          
          const swing = Math.sin(performance.now() * 0.008) * 0.5;
          this.leftLeg.rotation.x = swing;
          this.rightLeg.rotation.x = -swing;
        } else {
          this.velocity.set(0, 0, 0);
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        }

        this.shootTimer += delta;
        if (dist < 18 && this.shootTimer >= 2.0) {
          this.shootTimer = 0;
          const arrowDir = new THREE.Vector3().subVectors(
            playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)),
            this.position.clone().add(new THREE.Vector3(0, 1.0, 0))
          ).normalize();
          
          this.engine.spawnArrow(this.position.x, this.position.y + 1.0, this.position.z, arrowDir);
        }
      } else {
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          if (Math.random() < 0.4) {
            this.isMoving = true;
            const angle = Math.random() * Math.PI * 2;
            this.moveDir.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
            this.wanderTimer = 2.0 + Math.random() * 3.0;
            this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
          } else {
            this.isMoving = false;
            this.wanderTimer = 1.5 + Math.random() * 2.5;
          }
        }

        if (this.isMoving) {
          this.velocity.x = this.moveDir.x * (this.speed * 0.6);
          this.velocity.z = this.moveDir.z * (this.speed * 0.6);
          
          const swing = Math.sin(performance.now() * 0.005) * 0.3;
          this.leftLeg.rotation.x = swing;
          this.rightLeg.rotation.x = -swing;
        } else {
          this.velocity.set(0, 0, 0);
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        }
      }
    }

    if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
      const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.4);
      const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.4);
      const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
      const blockAbove = this.engine.world.getBlock(ax, Math.floor(this.position.y + 1.0), az);
      if (BLOCK_DEFS[blockAhead]?.solid && !BLOCK_DEFS[blockAbove]?.solid) {
        this.velocity.y = 8.5;
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);

    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Spider {
  constructor(engine, x, y, z, biome = 'plains') {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.biome = biome;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.8;
    this.height = 0.4;
    this.onGround = false;
    this.speed = 2.4;
    this.health = 16;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.jumpAttackTimer = 0;
    this.drops = [{ id: 'string', min: 1, max: 2 }];

    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    let bodyColor = 0x1f1f1f;
    let eyeColor = 0xcc0000;

    if (this.biome === 'jungle') {
      bodyColor = 0x00c853; // Emerald Poison Jungle Spider
      eyeColor = 0xff1744;
    } else if (this.biome === 'desert') {
      bodyColor = 0xd7ccc8; // Sand Spider
      eyeColor = 0xff9100;
    } else if (this.biome === 'snow') {
      bodyColor = 0x81d4fa; // Frost Spider
      eyeColor = 0x00e5ff;
    }

    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });

    const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.75), bodyMat);
    abdomen.position.set(0, 0.22, -0.1);
    this.mesh.add(abdomen);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), bodyMat);
    head.position.set(0, 0.22, 0.28);
    this.mesh.add(head);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    leftEye.position.set(-0.08, 0.26, 0.45);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    rightEye.position.set(0.08, 0.26, 0.45);
    this.mesh.add(rightEye);

    this.legs = [];
    const legGeom = new THREE.BoxGeometry(0.48, 0.06, 0.06);
    
    const hingesList = [
      [-0.2, 0.22, 0.15, 0.5], [0.2, 0.22, 0.15, -0.5],
      [-0.2, 0.22, 0.0, 0.3], [0.2, 0.22, 0.0, -0.3],
      [-0.2, 0.22, -0.15, -0.3], [0.2, 0.22, -0.15, 0.3],
      [-0.2, 0.22, -0.3, -0.5], [0.2, 0.22, -0.3, 0.5]
    ];

    hingesList.forEach(h => {
      const leg = new THREE.Mesh(legGeom, bodyMat);
      leg.position.set(h[0], h[1], h[2]);
      leg.rotation.y = h[3];
      leg.rotation.z = -0.2 * Math.sign(h[0]);
      this.mesh.add(leg);
      this.legs.push(leg);
    });

    this.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();

    const playerPos = this.engine.player.position;
    const kb = new THREE.Vector3().subVectors(this.position, playerPos);
    kb.y = 0;
    kb.normalize().multiplyScalar(4.0);
    this.velocity.x = kb.x;
    this.velocity.z = kb.z;
    this.velocity.y = 3.5;

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff3333);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    const x = this.position.x, y = this.position.y + 0.2, z = this.position.z;
    this.drops.forEach(drop => {
      const count = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(x, y, z, drop.id);
      }
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 400;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.15;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.engine.player && !this.engine.player.isDead) {
      const playerPos = this.engine.player.position;
      const dist = this.position.distanceTo(playerPos);

      const isNight = this.engine.timeOfDay > 18000 || this.engine.timeOfDay < 6000;
      const isAggressive = isNight || this.health < 16;

      if (isAggressive && dist < 30) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        dir.y = 0;
        dir.normalize();

        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        this.velocity.x = dir.x * this.speed;
        this.velocity.z = dir.z * this.speed;

        const time = performance.now() * 0.02;
        this.legs.forEach((l, idx) => {
          l.rotation.y = hingesData[idx][3] + Math.sin(time + idx) * 0.15;
        });

        this.jumpAttackTimer += delta;
        if (dist < 4.0 && this.onGround && this.jumpAttackTimer >= 1.8) {
          this.jumpAttackTimer = 0;
          this.velocity.y = 5.0;
          this.velocity.x = dir.x * this.speed * 1.5;
          this.velocity.z = dir.z * this.speed * 1.5;
        }

        if (dist < 1.0) {
          if (Math.random() < 0.03) {
            this.engine.player.takeDamage(2, "Bitten by a Spider");
          }
        }
      } else {
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          if (Math.random() < 0.4) {
            this.isMoving = true;
            const angle = Math.random() * Math.PI * 2;
            this.moveDir.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
            this.wanderTimer = 2.0 + Math.random() * 3.0;
            this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
          } else {
            this.isMoving = false;
            this.wanderTimer = 1.5 + Math.random() * 2.5;
          }
        }

        if (this.isMoving) {
          this.velocity.x = this.moveDir.x * (this.speed * 0.5);
          this.velocity.z = this.moveDir.z * (this.speed * 0.5);
          
          const time = performance.now() * 0.01;
          this.legs.forEach((l, idx) => {
            l.rotation.y = hingesData[idx][3] + Math.sin(time + idx) * 0.08;
          });
        } else {
          this.velocity.set(0, 0, 0);
          this.legs.forEach((l, idx) => l.rotation.y = hingesData[idx][3]);
        }
      }
    }

    const frontX = this.position.x + Math.sign(this.velocity.x) * 0.55;
    const frontZ = this.position.z + Math.sign(this.velocity.z) * 0.55;
    const blockAhead = this.engine.world.getBlock(Math.floor(frontX), Math.floor(this.position.y), Math.floor(frontZ));
    if (BLOCK_DEFS[blockAhead]?.solid) {
      this.velocity.y = 5.0;
      this.onGround = false;
    } else {
      if (this.onGround && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
        const ax = Math.floor(this.position.x + Math.sign(this.velocity.x) * 0.4);
        const az = Math.floor(this.position.z + Math.sign(this.velocity.z) * 0.4);
        const blockAhead = this.engine.world.getBlock(ax, Math.floor(this.position.y), az);
        if (BLOCK_DEFS[blockAhead]?.solid) {
          this.velocity.y = 6.0;
        }
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);

    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

const hingesData = [
  [-0.2, 0.22, 0.15, 0.5], [0.2, 0.22, 0.15, -0.5],
  [-0.2, 0.22, 0.0, 0.3], [0.2, 0.22, 0.0, -0.3],
  [-0.2, 0.22, -0.15, -0.3], [0.2, 0.22, -0.15, 0.3],
  [-0.2, 0.22, -0.3, -0.5], [0.2, 0.22, -0.3, 0.5]
];

export class DarkBoss {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 1.2;
    this.height = 2.8;
    this.onGround = false;
    this.speed = 2.0;
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.spellTimer = 0;
    this.drops = [{ id: 'mystic_book', min: 1, max: 1 }];

    this.buildModel();
    this.updateBossUI();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111122 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.6), darkMat);
    torso.position.set(0, 1.4, 0);
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), darkMat);
    head.position.set(0, 2.4, 0);
    this.mesh.add(head);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), redMat);
    leftEye.position.set(-0.16, 2.45, 0.36);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), redMat);
    rightEye.position.set(0.16, 2.45, 0.36);
    this.mesh.add(rightEye);

    const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), goldMat);
    leftHorn.position.set(-0.28, 2.85, 0);
    leftHorn.rotation.z = 0.3;
    this.mesh.add(leftHorn);

    const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), goldMat);
    rightHorn.position.set(0.28, 2.85, 0);
    rightHorn.rotation.z = -0.3;
    this.mesh.add(rightHorn);

    this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 0.3), darkMat);
    this.leftArm.position.set(-0.68, 1.4, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 0.3), darkMat);
    this.rightArm.position.set(0.68, 1.4, 0);
    this.mesh.add(this.rightArm);

    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), darkMat);
    this.leftLeg.position.set(-0.25, 0.4, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), darkMat);
    this.rightLeg.position.set(0.25, 0.4, 0);
    this.mesh.add(this.rightLeg);

    this.mesh.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }

  updateBossUI() {
    let container = document.getElementById('boss-bar-container');
    if (!container) return;
    if (this.isDead || this.health <= 0) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    const bar = document.getElementById('boss-bar-fill');
    const text = document.getElementById('boss-bar-text');
    const pct = Math.max(0, (this.health / this.maxHealth) * 100);
    if (bar) bar.style.width = `${pct}%`;
    if (text) text.textContent = `👹 DARK LORD - HP: ${this.health} / ${this.maxHealth}`;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.engine.sounds.playHit();
    this.flashRed();
    this.updateBossUI();

    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.materialIsCloned) {
          child.material = child.material.clone();
          child.materialIsCloned = true;
          child.originalColor = child.material.color.clone();
        }
        child.material.color.setHex(0xff0000);
      }
    });
    setTimeout(() => {
      this.mesh.traverse(child => {
        if (child.isMesh && child.material && child.originalColor) {
          child.material.color.copy(child.originalColor);
        }
      });
    }, 200);
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    this.updateBossUI();
    const x = this.position.x, y = this.position.y + 1.0, z = this.position.z;
    this.drops.forEach(drop => {
      this.engine.spawnItemDrop(x, y, z, drop.id);
    });

    let startTime = performance.now();
    const anim = () => {
      const progress = (performance.now() - startTime) / 600;
      if (progress >= 1) {
        this.mesh.parent?.remove(this.mesh);
      } else {
        this.mesh.rotation.z = progress * (Math.PI / 2);
        this.mesh.position.y = this.position.y - progress * 0.5;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.engine.player && !this.engine.player.isDead) {
      const playerPos = this.engine.player.position;
      const dist = this.position.distanceTo(playerPos);

      if (dist < 45) {
        this.updateBossUI();
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        dir.y = 0;
        dir.normalize();

        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        if (dist > 2.5) {
          this.velocity.x = dir.x * this.speed;
          this.velocity.z = dir.z * this.speed;
          const swing = Math.sin(performance.now() * 0.008) * 0.6;
          this.leftLeg.rotation.x = swing;
          this.rightLeg.rotation.x = -swing;
        } else {
          this.velocity.set(0, 0, 0);
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
          if (Math.random() < 0.04) {
            this.engine.player.takeDamage(4, "Struck by the Dark Lord");
          }
        }

        this.spellTimer += delta;
        if (dist < 25 && this.spellTimer >= 3.0) {
          this.spellTimer = 0;
          const spellDir = new THREE.Vector3().subVectors(
            playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)),
            this.position.clone().add(new THREE.Vector3(0, 1.8, 0))
          ).normalize();
          this.engine.spawnArrow(this.position.x, this.position.y + 1.8, this.position.z, spellDir);
        }
      }
    }

    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);
  }
}

class PolarBear {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.9;
    this.height = 1.2;
    this.onGround = false;
    this.speed = 1.2;
    this.health = 25;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    this.drops = [{ id: 'raw_mutton', min: 1, max: 3 }];
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const furMat = new THREE.MeshLambertMaterial({ color: 0xf5f7fa });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 1.3), furMat);
    body.position.set(0, 0.65, 0);
    this.mesh.add(body);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.85, 0.75);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.5), furMat);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), furMat);
    snout.position.set(0, -0.05, 0.32);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), noseMat);
    nose.position.set(0, 0.02, 0.47);
    this.head.add(headMesh, snout, nose);
    this.mesh.add(this.head);

    this.legs = [];
    const legGeo = new THREE.BoxGeometry(0.26, 0.45, 0.26);
    const pos = [[-0.32, 0.22, 0.45], [0.32, 0.22, 0.45], [-0.32, 0.22, -0.45], [0.32, 0.22, -0.45]];
    pos.forEach(p => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(...p);
      this.mesh.add(leg);
      this.legs.push(leg);
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    this.isRunningAway = true;
    this.runAwayTimer = 4.0;
    this.flashRed();
    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh) {
        const orig = child.material.color.getHex();
        child.material.color.setHex(0xff3333);
        setTimeout(() => child.material?.color.setHex(orig), 200);
      }
    });
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    this.drops.forEach(d => {
      const count = Math.floor(d.min + Math.random() * (d.max - d.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(this.position.x, this.position.y + 0.5, this.position.z, d.id);
      }
    });
    this.mesh.parent?.remove(this.mesh);
  }

  update(delta) {
    if (this.isDead) return;
    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.5) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.8 : 2.5 + Math.random() * 3.0;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
      } else {
        this.isMoving = false;
        this.wanderTimer = 2.0 + Math.random() * 3.0;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.2 : this.speed;
    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;
      const swing = Math.sin(performance.now() * 0.008) * 0.4;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.legs.forEach(l => l.rotation.x = 0);
    }
    this.velocity.y -= 20.0 * delta;
    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);
    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Goat {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.6;
    this.height = 0.9;
    this.onGround = false;
    this.speed = 1.6;
    this.health = 12;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    this.drops = [{ id: 'raw_mutton', min: 1, max: 2 }, { id: 'wool', min: 1, max: 1 }];
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const coatMat = new THREE.MeshLambertMaterial({ color: 0xededed });
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x4a3b32 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.75), coatMat);
    body.position.set(0, 0.45, 0);
    this.mesh.add(body);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.65, 0.4);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.32), coatMat);
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), hornMat);
    hornL.position.set(-0.1, 0.22, -0.05);
    hornL.rotation.x = -0.3;
    const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), hornMat);
    hornR.position.set(0.1, 0.22, -0.05);
    hornR.rotation.x = -0.3;
    this.head.add(headMesh, hornL, hornR);
    this.mesh.add(this.head);

    this.legs = [];
    const legGeo = new THREE.BoxGeometry(0.14, 0.35, 0.14);
    const pos = [[-0.18, 0.17, 0.25], [0.18, 0.17, 0.25], [-0.18, 0.17, -0.25], [0.18, 0.17, -0.25]];
    pos.forEach(p => {
      const leg = new THREE.Mesh(legGeo, coatMat);
      leg.position.set(...p);
      this.mesh.add(leg);
      this.legs.push(leg);
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    this.isRunningAway = true;
    this.runAwayTimer = 4.0;
    this.flashRed();
    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh) {
        const orig = child.material.color.getHex();
        child.material.color.setHex(0xff3333);
        setTimeout(() => child.material?.color.setHex(orig), 200);
      }
    });
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    this.drops.forEach(d => {
      const count = Math.floor(d.min + Math.random() * (d.max - d.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(this.position.x, this.position.y + 0.5, this.position.z, d.id);
      }
    });
    this.mesh.parent?.remove(this.mesh);
  }

  update(delta) {
    if (this.isDead) return;
    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.5) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.8 : 2.0 + Math.random() * 3.0;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
        if (this.onGround && Math.random() < 0.4) this.velocity.y = 8.0;
      } else {
        this.isMoving = false;
        this.wanderTimer = 1.5 + Math.random() * 2.5;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.5 : this.speed;
    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;
      const swing = Math.sin(performance.now() * 0.012) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.legs.forEach(l => l.rotation.x = 0);
    }
    this.velocity.y -= 20.0 * delta;
    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);
    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}

class Panther {
  constructor(engine, x, y, z) {
    this.engine = engine;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.width = 0.5;
    this.height = 0.6;
    this.onGround = false;
    this.speed = 2.2;
    this.health = 14;
    this.isDead = false;
    this.wanderTimer = 0;
    this.isMoving = false;
    this.moveDir = new THREE.Vector3();
    this.isRunningAway = false;
    this.runAwayTimer = 0;
    this.drops = [{ id: 'raw_mutton', min: 1, max: 2 }];
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    const furMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.85), furMat);
    body.position.set(0, 0.35, 0);
    this.mesh.add(body);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.48, 0.45);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.28), furMat);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    eyeL.position.set(-0.08, 0.04, 0.15);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    eyeR.position.set(0.08, 0.04, 0.15);
    this.head.add(headMesh, eyeL, eyeR);
    this.mesh.add(this.head);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.45), furMat);
    tail.position.set(0, 0.42, -0.6);
    tail.rotation.x = -0.4;
    this.mesh.add(tail);

    this.legs = [];
    const legGeo = new THREE.BoxGeometry(0.12, 0.28, 0.12);
    const pos = [[-0.16, 0.14, 0.3], [0.16, 0.14, 0.3], [-0.16, 0.14, -0.3], [0.16, 0.14, -0.3]];
    pos.forEach(p => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(...p);
      this.mesh.add(leg);
      this.legs.push(leg);
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    this.isRunningAway = true;
    this.runAwayTimer = 4.0;
    this.flashRed();
    if (this.health <= 0) this.die();
  }

  flashRed() {
    this.mesh.traverse(child => {
      if (child.isMesh) {
        const orig = child.material.color.getHex();
        child.material.color.setHex(0xff3333);
        setTimeout(() => child.material?.color.setHex(orig), 200);
      }
    });
  }

  die() {
    this.isDead = true;
    this.engine.unlockAchievement('defeat_mobs');
    this.drops.forEach(d => {
      const count = Math.floor(d.min + Math.random() * (d.max - d.min + 1));
      for (let i = 0; i < count; i++) {
        this.engine.spawnItemDrop(this.position.x, this.position.y + 0.5, this.position.z, d.id);
      }
    });
    this.mesh.parent?.remove(this.mesh);
  }

  update(delta) {
    if (this.isDead) return;
    if (this.isRunningAway) {
      this.runAwayTimer -= delta;
      if (this.runAwayTimer <= 0) this.isRunningAway = false;
    }
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (this.isRunningAway || Math.random() < 0.6) {
        this.isMoving = true;
        const angle = this.isRunningAway ? Math.atan2(this.position.x - this.engine.player.position.x, this.position.z - this.engine.player.position.z) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
        this.moveDir.set(Math.sin(angle), 0, Math.cos(angle)).normalize();
        this.wanderTimer = this.isRunningAway ? 0.6 : 1.5 + Math.random() * 2.5;
        this.mesh.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.z);
      } else {
        this.isMoving = false;
        this.wanderTimer = 1.0 + Math.random() * 2.0;
      }
    }

    const currentSpeed = this.isRunningAway ? this.speed * 2.4 : this.speed;
    if (this.isMoving) {
      this.velocity.x = this.moveDir.x * currentSpeed;
      this.velocity.z = this.moveDir.z * currentSpeed;
      const swing = Math.sin(performance.now() * 0.016) * 0.6;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.legs.forEach(l => l.rotation.x = 0);
    }
    this.velocity.y -= 20.0 * delta;
    this.onGround = this.engine.physics.applyMovement(this.position, this.velocity, this.width, this.height, delta, false);
    this.mesh.position.copy(this.position);
    if (this.position.y < -30) this.mesh.parent?.remove(this.mesh);
  }
}
