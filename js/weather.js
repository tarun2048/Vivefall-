import * as THREE from 'three';

export class WeatherManager {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.scene;
    
    // Weather state: 'clear', 'rain', 'snow'
    this.weatherType = 'clear';
    this.targetWeatherType = 'clear';
    this.weatherTimer = 240; // Seconds until next natural weather check
    this.isForced = false;

    // Transition factor
    this.rainOpacity = 0.0;
    this.snowOpacity = 0.0;

    // 3D Line-Segment Rain Streak System (2,400 physical 3D rain streaks)
    this.rainStreakCount = 2400;
    this.rainLength = 0.95; // Length of individual rain streak in blocks
    this.rainSpeed = 52.0;  // High velocity in blocks/sec
    this.windX = 1.4;       // Natural wind angle
    this.windZ = 0.7;

    this.rainGeometry = null;
    this.rainLines = null;
    this.rainPositions = null;
    this.rainColors = null;
    this.rainSeeds = null;

    // 3D Snow Particle System
    this.snowCount = 900;
    this.snowGeometry = null;
    this.snowPoints = null;
    this.snowPositions = null;
    this.snowVelocities = null;
    this.snowPhases = null;

    // Ground impact splashes
    this.splashes = [];

    // Current active biome
    this.currentBiome = 'plains';

    this.initParticles();
  }

  initParticles() {
    // =========================================================================
    // 1. SETUP ULTRA-REALISTIC 3D RAIN STREAKS (True 3D World-Space Line Segments)
    // =========================================================================
    // Each streak has 2 vertices (Top: transparent, Bottom: crisp bright droplet tip)
    const vertexCount = this.rainStreakCount * 2;
    this.rainPositions = new Float32Array(vertexCount * 3);
    this.rainColors = new Float32Array(vertexCount * 3);
    this.rainSeeds = new Float32Array(this.rainStreakCount * 4); // [origX, origY, origZ, speed]

    // Wind vector normalized offset for tail
    const streakVecX = (this.windX / this.rainSpeed) * this.rainLength;
    const streakVecY = this.rainLength;
    const streakVecZ = (this.windZ / this.rainSpeed) * this.rainLength;

    for (let i = 0; i < this.rainStreakCount; i++) {
      const rx = (Math.random() - 0.5) * 50;
      const ry = Math.random() * 32;
      const rz = (Math.random() - 0.5) * 50;
      const speed = this.rainSpeed + (Math.random() - 0.5) * 12;

      this.rainSeeds[i * 4 + 0] = rx;
      this.rainSeeds[i * 4 + 1] = ry;
      this.rainSeeds[i * 4 + 2] = rz;
      this.rainSeeds[i * 4 + 3] = speed;

      const idx = i * 6;

      // Vertex 1: Trailing Top (Faded)
      this.rainPositions[idx + 0] = rx + streakVecX;
      this.rainPositions[idx + 1] = ry + streakVecY;
      this.rainPositions[idx + 2] = rz + streakVecZ;

      // Vertex 2: Leading Tip (Crisp Droplet)
      this.rainPositions[idx + 3] = rx;
      this.rainPositions[idx + 4] = ry;
      this.rainPositions[idx + 5] = rz;

      // Vertex Colors (Top is faint translucent cyan, Bottom is bright translucent white-cyan)
      this.rainColors[idx + 0] = 0.55; // R
      this.rainColors[idx + 1] = 0.75; // G
      this.rainColors[idx + 2] = 0.95; // B

      this.rainColors[idx + 3] = 0.88; // R
      this.rainColors[idx + 4] = 0.95; // G
      this.rainColors[idx + 5] = 1.0;  // B
    }

    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainGeometry.setAttribute('color', new THREE.BufferAttribute(this.rainColors, 3));

    const rainMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.NormalBlending,
      depthWrite: false,
      fog: false,
      linewidth: 1
    });

    this.rainLines = new THREE.LineSegments(this.rainGeometry, rainMat);
    this.rainLines.visible = false;
    this.scene.add(this.rainLines);

    // =========================================================================
    // 2. SETUP SOFT 3D SNOW PARTICLES
    // =========================================================================
    this.snowPositions = new Float32Array(this.snowCount * 3);
    this.snowVelocities = new Float32Array(this.snowCount);
    this.snowPhases = new Float32Array(this.snowCount);

    for (let i = 0; i < this.snowCount; i++) {
      this.snowPositions[i * 3 + 0] = (Math.random() - 0.5) * 45;
      this.snowPositions[i * 3 + 1] = Math.random() * 26;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 45;
      this.snowVelocities[i] = 2.2 + Math.random() * 1.8;
      this.snowPhases[i] = Math.random() * Math.PI * 2;
    }

    this.snowGeometry = new THREE.BufferGeometry();
    this.snowGeometry.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

    // Snowflake texture
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 16;
    snowCanvas.height = 16;
    const sCtx = snowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sGrad.addColorStop(0.5, 'rgba(235, 245, 255, 0.85)');
    sGrad.addColorStop(1, 'rgba(220, 240, 255, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 16, 16);

    const snowTex = new THREE.CanvasTexture(snowCanvas);
    const snowMat = new THREE.PointsMaterial({
      size: 0.28,
      map: snowTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      fog: false
    });

    this.snowPoints = new THREE.Points(this.snowGeometry, snowMat);
    this.snowPoints.visible = false;
    this.scene.add(this.snowPoints);
  }

  setWeather(type, force = true) {
    if (this.weatherType === type && !force) return;
    this.weatherType = type;
    this.targetWeatherType = type;
    this.isForced = force;

    if (type === 'rain') {
      if (this.engine.sounds && this.engine.sounds.startRainSound) {
        this.engine.sounds.startRainSound();
      }
    } else {
      if (this.engine.sounds && this.engine.sounds.stopRainSound) {
        this.engine.sounds.stopRainSound();
      }
    }
  }

  getEffectivePrecipitation() {
    if (this.weatherType === 'clear') return 'clear';
    if (this.weatherType === 'snow') return 'snow';

    if (this.currentBiome === 'snow' || this.currentBiome === 'mountains') {
      return 'snow';
    }

    if (
      this.currentBiome === 'jungle' ||
      this.currentBiome === 'forest' ||
      this.currentBiome === 'cherry_blossom' ||
      this.currentBiome === 'floral' ||
      this.currentBiome === 'plains'
    ) {
      return 'rain';
    }

    if (this.currentBiome === 'desert') {
      return 'clear';
    }

    return 'rain';
  }

  update(delta) {
    if (!this.engine.player || !this.engine.world) return;

    const px = this.engine.player.position.x;
    const py = this.engine.player.position.y;
    const pz = this.engine.player.position.z;

    this.currentBiome = this.engine.world.getBiome(px, pz);

    // Natural weather cycling (every 3-6 mins if not commanded)
    if (!this.isForced) {
      this.weatherTimer -= delta;
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 180 + Math.random() * 200;
        const roll = Math.random();
        if (roll < 0.75) {
          this.setWeather('clear', false);
        } else {
          this.setWeather('rain', false);
        }
      }
    }

    const effective = this.getEffectivePrecipitation();

    // =========================================================================
    // 1. UPDATE 3D REALISTIC RAIN STREAKS
    // =========================================================================
    if (effective === 'rain') {
      this.rainLines.visible = true;
      this.rainOpacity = Math.min(0.78, this.rainOpacity + delta * 2.0);
      this.rainLines.material.opacity = this.rainOpacity;

      const pos = this.rainPositions;
      const seeds = this.rainSeeds;

      const streakVecX = (this.windX / this.rainSpeed) * this.rainLength;
      const streakVecY = this.rainLength;
      const streakVecZ = (this.windZ / this.rainSpeed) * this.rainLength;

      const halfBox = 24;
      const topSpawn = py + 18;
      const bottomFloor = py - 2;

      for (let i = 0; i < this.rainStreakCount; i++) {
        const sIdx = i * 4;
        const pIdx = i * 6;

        // Advance vertical drop
        seeds[sIdx + 1] -= seeds[sIdx + 3] * delta;
        seeds[sIdx + 0] += this.windX * delta;
        seeds[sIdx + 2] += this.windZ * delta;

        // Wrap around player bounding cylinder
        let rx = seeds[sIdx + 0];
        let ry = seeds[sIdx + 1];
        let rz = seeds[sIdx + 2];

        if (ry < bottomFloor || Math.abs(rx - px) > halfBox || Math.abs(rz - pz) > halfBox) {
          rx = px + (Math.random() - 0.5) * (halfBox * 2);
          ry = topSpawn + Math.random() * 12;
          rz = pz + (Math.random() - 0.5) * (halfBox * 2);

          seeds[sIdx + 0] = rx;
          seeds[sIdx + 1] = ry;
          seeds[sIdx + 2] = rz;

          // Ground splash chance
          if (Math.random() < 0.09) {
            this.spawnRainSplash(rx, py, rz);
          }
        }

        // Vertex 1: Top of streak (trailing into the sky)
        pos[pIdx + 0] = rx + streakVecX;
        pos[pIdx + 1] = ry + streakVecY;
        pos[pIdx + 2] = rz + streakVecZ;

        // Vertex 2: Bottom of streak (leading droplet tip)
        pos[pIdx + 3] = rx;
        pos[pIdx + 4] = ry;
        pos[pIdx + 5] = rz;
      }

      this.rainGeometry.attributes.position.needsUpdate = true;
    } else {
      if (this.rainOpacity > 0) {
        this.rainOpacity = Math.max(0, this.rainOpacity - delta * 2.5);
        this.rainLines.material.opacity = this.rainOpacity;
        if (this.rainOpacity === 0) this.rainLines.visible = false;
      }
    }

    // =========================================================================
    // 2. UPDATE SOFT SNOW PARTICLES
    // =========================================================================
    if (effective === 'snow') {
      this.snowPoints.visible = true;
      this.snowOpacity = Math.min(0.85, this.snowOpacity + delta * 1.5);
      this.snowPoints.material.opacity = this.snowOpacity;

      const sPos = this.snowPositions;
      const sVel = this.snowVelocities;
      const sPhases = this.snowPhases;

      for (let i = 0; i < this.snowCount; i++) {
        sPhases[i] += delta * 2.0;
        sPos[i * 3 + 1] -= sVel[i] * delta;
        sPos[i * 3 + 0] += Math.sin(sPhases[i]) * 0.45 * delta;
        sPos[i * 3 + 2] += Math.cos(sPhases[i]) * 0.35 * delta;

        if (sPos[i * 3 + 1] < py - 2 || Math.abs(sPos[i * 3 + 0] - px) > 24 || Math.abs(sPos[i * 3 + 2] - pz) > 24) {
          sPos[i * 3 + 0] = px + (Math.random() - 0.5) * 44;
          sPos[i * 3 + 1] = py + 14 + Math.random() * 10;
          sPos[i * 3 + 2] = pz + (Math.random() - 0.5) * 44;
        }
      }
      this.snowGeometry.attributes.position.needsUpdate = true;
    } else {
      if (this.snowOpacity > 0) {
        this.snowOpacity = Math.max(0, this.snowOpacity - delta * 2.0);
        this.snowPoints.material.opacity = this.snowOpacity;
        if (this.snowOpacity === 0) this.snowPoints.visible = false;
      }
    }

    // Update Ground Splash particles
    this.updateSplashes(delta);
  }

  spawnRainSplash(x, y, z) {
    if (this.splashes.length >= 20) return;

    const geo = new THREE.PlaneGeometry(0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xd9f2ff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      fog: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y + 0.02, z);
    this.scene.add(mesh);

    this.splashes.push({ mesh, mat, geo, life: 0.18 });
  }

  updateSplashes(delta) {
    for (let i = 0; i < this.splashes.length; i++) {
      const s = this.splashes[i];
      s.life -= delta;
      s.mesh.scale.addScalar(delta * 2.6);
      s.mat.opacity -= delta * 4.2;

      if (s.life <= 0 || s.mat.opacity <= 0) {
        this.scene.remove(s.mesh);
        s.geo.dispose();
        s.mat.dispose();
        this.splashes.splice(i, 1);
        i--;
      }
    }
  }

  cleanup() {
    if (this.rainLines) {
      this.scene.remove(this.rainLines);
      this.rainGeometry.dispose();
      this.rainLines.material.dispose();
    }
    if (this.snowPoints) {
      this.scene.remove(this.snowPoints);
      this.snowGeometry.dispose();
      this.snowPoints.material.dispose();
    }
    this.splashes.forEach(s => {
      this.scene.remove(s.mesh);
      s.geo.dispose();
      s.mat.dispose();
    });
    this.splashes = [];
  }
}
