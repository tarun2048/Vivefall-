import * as THREE from 'three';
import { BLOCK, BLOCK_DEFS } from './world.js';

export class Physics {
  constructor(engine) {
    this.engine = engine;
    this.gravity = -30; // Block units per sec squared
    this.terminalVelocity = -50;
  }

  // Raycast from camera to select targeted block face
  getLookBlock(camera, maxDistance = 5) {
    const world = this.engine.world;
    const start = camera.position;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    
    const current = start.clone();
    const stepSize = 0.03;
    const steps = maxDistance / stepSize;
    
    let prevBlockPos = new THREE.Vector3(
      Math.floor(start.x),
      Math.floor(start.y),
      Math.floor(start.z)
    );
    
    for (let i = 0; i < steps; i++) {
      current.addScaledVector(dir, stepSize);
      
      const bx = Math.floor(current.x);
      const by = Math.floor(current.y);
      const bz = Math.floor(current.z);
      
      const bid = world.getBlock(bx, by, bz);
      
      if (bid !== BLOCK.AIR && bid !== BLOCK.WATER) {
        // We hit a target!
        const target = new THREE.Vector3(bx, by, bz);
        const place = prevBlockPos.clone();
        
        // Calculate hit normal pointing outward
        const normal = target.clone().sub(place);
        
        return { target, place, normal };
      }
      
      // If we crossed a block boundary, update previous block position
      if (bx !== prevBlockPos.x || by !== prevBlockPos.y || bz !== prevBlockPos.z) {
        prevBlockPos.set(bx, by, bz);
      }
    }
    return null;
  }

  // Check if a bounding box overlaps with any solid voxel block in the world
  checkCollision(box) {
    const world = this.engine.world;
    
    // Bounds of the bounding box
    const minX = Math.floor(box.min.x);
    const maxX = Math.floor(box.max.x);
    const minY = Math.floor(box.min.y);
    const maxY = Math.floor(box.max.y);
    const minZ = Math.floor(box.min.z);
    const maxZ = Math.floor(box.max.z);

    // Scan all blocks covered by the bounding box
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const bid = world.getBlock(x, y, z);
          const def = BLOCK_DEFS[bid];
          
          if (def && def.solid) {
            // Check box overlap
            const blockBox = new THREE.Box3(
              new THREE.Vector3(x, y, z),
              new THREE.Vector3(x + 1, y + 1, z + 1)
            );
            if (box.intersectsBox(blockBox)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // Update entity position with velocity, resolving collisions component-by-component
  applyMovement(position, velocity, width, height, delta, isFlying = false) {
    const halfW = width / 2;
    const entityBox = new THREE.Box3();
    
    // 1. Apply Gravity (if not flying)
    if (!isFlying) {
      velocity.y += this.gravity * delta;
      if (velocity.y < this.terminalVelocity) {
        velocity.y = this.terminalVelocity;
      }
    }

    let onGround = false;

    // 2. Resolve Y Axis Movement
    position.y += velocity.y * delta;
    entityBox.set(
      new THREE.Vector3(position.x - halfW, position.y, position.z - halfW),
      new THREE.Vector3(position.x + halfW, position.y + height, position.z + halfW)
    );
    if (this.checkCollision(entityBox)) {
      if (velocity.y < 0) {
        // Landed on floor
        position.y = Math.ceil(position.y); // Snap to block top
        velocity.y = 0;
        onGround = true;
      } else if (velocity.y > 0) {
        // Hit head
        position.y = Math.floor(position.y + height) - height - 0.01;
        velocity.y = 0;
      }
    }

    // 3. Resolve X Axis Movement
    position.x += velocity.x * delta;
    entityBox.set(
      new THREE.Vector3(position.x - halfW, position.y, position.z - halfW),
      new THREE.Vector3(position.x + halfW, position.y + height, position.z + halfW)
    );
    if (this.checkCollision(entityBox)) {
      // Collided, revert and zero out X velocity
      position.x -= velocity.x * delta;
      velocity.x = 0;
    }

    // 4. Resolve Z Axis Movement
    position.z += velocity.z * delta;
    entityBox.set(
      new THREE.Vector3(position.x - halfW, position.y, position.z - halfW),
      new THREE.Vector3(position.x + halfW, position.y + height, position.z + halfW)
    );
    if (this.checkCollision(entityBox)) {
      // Collided, revert and zero out Z velocity
      position.z -= velocity.z * delta;
      velocity.z = 0;
    }

    return onGround;
  }
}
