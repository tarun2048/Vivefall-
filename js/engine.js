import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { SimplexNoise } from './simplex-noise.js';
import { World, BLOCK_DEFS } from './world.js';
import { Player } from './player.js';
import { Physics } from './physics.js';
import { MobsManager } from './mobs.js';
import { InventoryManager, ITEM_SVGS } from './inventory.js';
import { Structures } from './structures.js';
import { SoundManager } from './sound.js';

export class Engine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.clock = new THREE.Clock();
    
    this.gameState = 'start'; // 'start', 'playing', 'paused', 'inventory', 'gameover'
    this.seed = '';
    this.gameMode = 'story'; // 'story' or 'creative'

    // Story Quest State
    this.storySlideIndex = 0;
    this.isVictoryEnding = false;
    this.storySlides = [
      {
        title: "CHAPTER 1: THE BURIED BOOK",
        img: "images/zuzu_finding_book.png",
        text: "Zuzu was playing in the park when he spotted something unusual... a glowing, mysterious ancient book buried half in the dirt!"
      },
      {
        title: "CHAPTER 2: INTO THE VOXEL PORTAL",
        img: "images/zuzu_falling_in_book.png",
        text: "Curious, Zuzu wiped off the mud and opened the cover. Suddenly, a blinding magical vortex opened up and pulled him inside!"
      },
      {
        title: "CHAPTER 3: THE BLOCKY REALM",
        img: "images/zuzu_voxel_world_arrival.png",
        text: "Zuzu crashed down into a strange realm where EVERYTHING was made of cubic blocks! Fortunately, his futuristic SmartWatch synced with the dimension."
      },
      {
        title: "CHAPTER 4: THE RETURN QUEST",
        img: "images/zuzu_dark_castle_boss.png",
        text: "SmartWatch Alert: 'To reveal the Dark Castle and retrieve the Mystic Book of Return, complete 5 Realm Achievements: Sleep, Eat, Trade, Farm, and Defeat Mobs!'"
      }
    ];

    this.achievements = {
      sleep: false,
      eat: false,
      trade: false,
      farm: false,
      defeat_mobs: false
    };

    this.darkCastleReady = false;
    this.darkCastleSpawned = false;

    // Core modules (will be initialized in initGame)
    this.noise = null;
    this.world = null;
    this.player = null;
    this.physics = null;
    this.mobs = null;
    this.inventory = null;

    // Time cycle variables
    this.timeOfDay = 8000; // 0 to 24000 ticks. 6000 is midday, 18000 is midnight.
    this.timeScale = 1.5;   // Speed of time.

    this.initThree();
    this.initUI();
    this.animate();
  }

  initThree() {
    // 1. Scene setup
    this.scene = new THREE.Scene();

    // Sky colors
    this.skyColors = {
      day: new THREE.Color(0x7ec0ee),
      sunset: new THREE.Color(0xee7942),
      night: new THREE.Color(0x0a0a18)
    };
    
    this.scene.background = this.skyColors.day.clone();
    this.scene.fog = new THREE.FogExp2(this.skyColors.day, 0.015);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 40, 0); // Temporary before world generation

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; // Enable shadow maps
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // Optimized PCF filtering for high FPS
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.sunLight.position.set(50, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 512; // Optimized resolution
    this.sunLight.shadow.mapSize.height = 512;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 250;
    const d = 26; // Optimized focus shadow camera bounds around player coordinates
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    // Add secondary light for moon/under-fill
    this.moonLight = new THREE.DirectionalLight(0x5555aa, 0.2);
    this.moonLight.position.set(-50, -100, -50);
    this.scene.add(this.moonLight);

    // 5. Controls setup
    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());

    // Bind events
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initUI() {
    // Check if saved game exists to enable/disable load button
    const hasSave = localStorage.getItem('vivefall_save');
    const loadBtn = document.getElementById('btn-load');
    if (hasSave && loadBtn) {
      loadBtn.classList.remove('disabled');
      loadBtn.removeAttribute('disabled');
    }

    // Start Screen Button binds
    const btnStory = document.getElementById('btn-story');
    const btnCreative = document.getElementById('btn-creative');
    const btnPlay = document.getElementById('btn-play');

    if (btnStory) {
      btnStory.addEventListener('click', () => {
        this.gameMode = 'story';
        btnStory.classList.add('active');
        if (btnCreative) btnCreative.classList.remove('active');
        if (btnPlay) btnPlay.textContent = "PLAY STORY MODE";
      });
    }

    if (btnCreative) {
      btnCreative.addEventListener('click', () => {
        this.gameMode = 'creative';
        btnCreative.classList.add('active');
        if (btnStory) btnStory.classList.remove('active');
        if (btnPlay) btnPlay.textContent = "PLAY CREATIVE MODE";
      });
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.seed = document.getElementById('world-seed').value || Math.random().toString(36).substring(2, 10);
        if (this.gameMode === 'story') {
          this.showStorySlideshow(false);
        } else {
          this.startGame();
        }
      });
    }

    // Story Slideshow Binds
    document.getElementById('btn-story-prev').addEventListener('click', () => this.prevStorySlide());
    document.getElementById('btn-story-next').addEventListener('click', () => this.nextStorySlide());
    document.getElementById('btn-story-start').addEventListener('click', () => {
      document.getElementById('story-modal').classList.add('hidden');
      if (this.isVictoryEnding) {
        this.quitGame();
      } else {
        this.startGame();
      }
    });

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        this.loadGame();
      });
    }

    // Pause Menu binds
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.controls.lock();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
      this.saveGame();
    });
    
    document.getElementById('btn-toggle-fly').addEventListener('click', () => {
      if (this.player) {
        this.player.isFlying = !this.player.isFlying;
        document.getElementById('btn-toggle-fly').textContent = this.player.isFlying ? "Fly Mode: ON" : "Fly Mode: OFF";
      }
    });

    const toggleTimeBtn = document.getElementById('btn-toggle-time');
    if (toggleTimeBtn) {
      toggleTimeBtn.addEventListener('click', () => {
        const isNight = this.timeOfDay > 18000 || this.timeOfDay < 6000;
        if (isNight) {
          this.timeOfDay = 8000; // Switch to Day (8:00 AM)
          toggleTimeBtn.textContent = "🌙 Switch to Night";
        } else {
          this.timeOfDay = 20000; // Switch to Night (8:00 PM)
          toggleTimeBtn.textContent = "☀️ Switch to Day";
          if (this.mobs) this.mobs.spawnNightHordeAroundPlayer();
        }
      });
    }

    document.getElementById('btn-respawn').addEventListener('click', () => {
      this.respawnPlayer();
      this.controls.lock();
    });
    
    document.getElementById('btn-respawn-death').addEventListener('click', () => {
      this.respawnPlayer();
      this.controls.lock();
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
      this.quitGame();
    });
    document.getElementById('btn-quit-death').addEventListener('click', () => {
      this.quitGame();
    });

    const exportBtn = document.getElementById('btn-export-db');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportWorldFile());
    
    const exportPauseBtn = document.getElementById('btn-export-db-pause');
    if (exportPauseBtn) exportPauseBtn.addEventListener('click', () => this.exportWorldFile());

    const importBtn = document.getElementById('btn-import-db');
    const fileInput = document.getElementById('file-import-world');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.importWorldFile(e.target.files[0]);
        }
      });
    }

    // PointerLock event listeners
    this.controls.addEventListener('lock', () => {
      if (this.gameState === 'inventory' || this.gameState === 'start' || this.gameState === 'gameover') return;
      this.gameState = 'playing';
      document.getElementById('pause-screen').classList.add('hidden');
      document.getElementById('ui-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
    });

    this.controls.addEventListener('unlock', () => {
      // If we clicked inventory or died, don't open pause menu
      if (this.gameState === 'playing') {
        this.gameState = 'paused';
        document.getElementById('pause-screen').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        
        // Show fly button only in creative
        if (this.gameMode === 'creative') {
          document.getElementById('btn-toggle-fly').classList.remove('hidden');
          document.getElementById('btn-toggle-fly').textContent = this.player.isFlying ? "Fly Mode: ON" : "Fly Mode: OFF";
        } else {
          document.getElementById('btn-toggle-fly').classList.add('hidden');
        }
      }
    });
  }

  startGame() {
    // Hide title menu
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.gameState = 'playing';

    const watchHud = document.getElementById('smartwatch-hud');
    if (watchHud) {
      if (this.gameMode === 'story') {
        watchHud.classList.remove('hidden');
      } else {
        watchHud.classList.add('hidden');
      }
    }

    // Clear scene (remove any existing world blocks/entities)
    // Keep lights, controls camera
    while(this.scene.children.length > 0){ 
      this.scene.remove(this.scene.children[0]); 
    }
    this.scene.add(this.ambientLight);
    this.scene.add(this.sunLight);
    this.scene.add(this.moonLight);
    this.scene.add(this.controls.getObject());

    // Initialize systems
    this.noise = new SimplexNoise(this.seed);
    this.physics = new Physics(this);
    this.structures = new Structures(this);
    this.world = new World(this);
    this.inventory = new InventoryManager(this);
    this.player = new Player(this);
    this.mobs = new MobsManager(this);

    this.itemDrops = [];
    this.petals = [];
    
    this.sounds = new SoundManager();
    this.arrows = [];
    this.initTorchLightsPool();

    // Initial world generation
    this.world.generateAroundPlayer();
    
    // Spawn player
    this.respawnPlayer();

    // Spawn Clouds
    this.initClouds();

    // Lock pointer
    setTimeout(() => {
      this.controls.lock();
    }, 100);
  }

  respawnPlayer() {
    // Spawn player at a high enough point
    const spawnX = 0;
    const spawnZ = 0;
    const groundY = this.world.getTerrainHeight(spawnX, spawnZ);
    this.player.spawn(spawnX, groundY + 2, spawnZ);
    this.player.health = 20;
    this.player.hunger = 20;
    this.player.isDead = false;
    this.gameState = 'playing';
    
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  quitGame() {
    this.gameState = 'start';
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('ui-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    this.controls.unlock();
  }

  triggerGameOver(reason = "You died!") {
    this.gameState = 'gameover';
    document.getElementById('death-reason').textContent = reason;
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    this.controls.unlock();
  }

  openInventory(screenId = 'screen-inventory') {
    if (this.gameState !== 'playing' && this.gameState !== 'inventory') return;
    
    if (this.gameState === 'playing') {
      this.gameState = 'inventory';
      this.controls.unlock();
      
      document.getElementById('hud').classList.add('hidden');
      document.getElementById('ui-screen').classList.remove('hidden');
      
      // Hide all panels
      document.getElementById('screen-inventory').classList.add('hidden');
      document.getElementById('screen-creative-palette').classList.add('hidden');
      document.getElementById('screen-crafting-3x3').classList.add('hidden');
      document.getElementById('screen-chest').classList.add('hidden');
      document.getElementById('screen-trading').classList.add('hidden');

      // If creative mode and requesting inventory, open creative palette instead!
      if (this.gameMode === 'creative' && screenId === 'screen-inventory') {
        screenId = 'screen-creative-palette';
      }

      // Show specific panel
      document.getElementById(screenId).classList.remove('hidden');
      
      // Refresh inventory UI elements
      this.inventory.renderAll();
    } else {
      // Close inventory
      this.gameState = 'playing';
      document.getElementById('ui-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.controls.lock();
    }
  }

  updateTimeCycle(delta) {
    // Advance time
    this.timeOfDay = (this.timeOfDay + delta * this.timeScale * 20) % 24000;
    
    // Convert ticks to 24 hour string format
    const totalMinutes = Math.floor((this.timeOfDay / 24000) * 1440);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const hoursStr = hours.toString().padStart(2, '0');
    const minsStr = minutes.toString().padStart(2, '0');
    
    let cyclePhase = 'Morning';
    if (hours >= 6 && hours < 12) cyclePhase = 'Morning';
    else if (hours >= 12 && hours < 18) cyclePhase = 'Afternoon';
    else if (hours >= 18 && hours < 20) cyclePhase = 'Sunset';
    else if (hours >= 20 || hours < 5) cyclePhase = 'Night';
    else cyclePhase = 'Sunrise';

    document.getElementById('time-display').textContent = `Day ${Math.floor(this.clock.getElapsedTime() / 300) + 1} - ${hoursStr}:${minsStr} (${cyclePhase})`;

    // Rotate Sun and Moon
    const angle = ((this.timeOfDay - 6000) / 24000) * Math.PI * 2;
    
    // Positions
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle);
    
    this.sunLight.position.set(sunX * 100, sunY * 100, 50);
    this.moonLight.position.set(-sunX * 100, -sunY * 100, -50);

    // Calculate light intensities and colors
    let skyColor, fogDensity;
    
    if (sunY > 0.1) {
      // Day time
      const factor = Math.min((sunY - 0.1) / 0.3, 1.0); // interpolation factor
      skyColor = this.skyColors.day.clone().lerp(this.skyColors.sunset, 1 - factor);
      this.sunLight.intensity = 0.85 * factor;
      this.ambientLight.intensity = 0.45 + 0.15 * factor;
      this.ambientLight.color.setHex(0xffffff);
      this.moonLight.intensity = 0;
      fogDensity = 0.012;
    } else if (sunY <= 0.1 && sunY > -0.1) {
      // Sunset / Sunrise transitions
      const factor = (sunY + 0.1) / 0.2;
      skyColor = this.skyColors.sunset.clone().lerp(this.skyColors.night, 1 - factor);
      this.sunLight.intensity = 0.85 * factor;
      this.ambientLight.intensity = 0.25 + 0.2 * factor;
      this.ambientLight.color.setHex(0xffaa44);
      this.moonLight.intensity = 0.2 * (1 - factor);
      fogDensity = 0.018;
    } else {
      // Night time
      const factor = Math.min((-sunY - 0.1) / 0.3, 1.0);
      skyColor = this.skyColors.night.clone();
      this.sunLight.intensity = 0;
      this.ambientLight.intensity = 0.15 + 0.05 * (1 - factor);
      this.ambientLight.color.setHex(0x555588); // Blue tint ambient light at night
      this.moonLight.intensity = 0.22 * factor;
      fogDensity = 0.022;
    }

    // Set background sky and fog color
    this.scene.background.copy(skyColor);
    this.scene.fog.color.copy(skyColor);
    this.scene.fog.density = fogDensity;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to avoid physical instability when lagging

    if (this.gameState === 'playing' || this.gameState === 'inventory' || this.gameState === 'paused') {
      // Update environment time
      this.updateTimeCycle(delta);

      // Update cloud drifting
      this.updateClouds(delta);
      
      if (this.gameState === 'playing') {
        // Update Player mechanics & physics
        this.player.update(delta);
        
        // Update World chunk loaders
        this.world.update(delta);
        
        // Update Villagers AI / physics
        this.mobs.update(delta);

        // Update Arrows projectiles
        this.updateArrows(delta);

        // Update Torch Lights pool
        if (!this.torchScanTimer) this.torchScanTimer = 0;
        this.torchScanTimer++;
        if (this.torchScanTimer >= 10) {
          this.torchScanTimer = 0;
          this.updateTorchLights();
        }

        // Update Item Drops physics
        this.updateItemDrops(delta);

        // Update TNT fuses & explosions
        this.updateTNT(delta);

        // Update Cherry Leaves particle petals
        this.updatePetals(delta);

        // Make directional shadow camera follow player position dynamically
        if (this.player && this.sunLight.castShadow) {
          const p = this.player.position;
          // Align light coordinates relative to player to cascade high-res shadows
          const angle = ((this.timeOfDay - 6000) / 24000) * Math.PI * 2;
          const sunY = Math.sin(angle);
          const sunX = Math.cos(angle);
          
          this.sunLight.position.set(p.x + sunX * 100, p.y + sunY * 100, p.z + 50);
          this.sunLight.target.position.set(p.x, p.y, p.z);
          this.sunLight.target.updateMatrixWorld();
        }
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  initClouds() {
    if (this.cloudsGroup) {
      this.scene.remove(this.cloudsGroup);
    }
    this.cloudsGroup = new THREE.Group();
    this.scene.add(this.cloudsGroup);
    
    // Spawn low-poly cloud blocks at Y=50
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 22; i++) {
      const w = 16 + Math.random() * 24;
      const h = 2.5 + Math.random() * 1.5;
      const d = 16 + Math.random() * 24;
      const geom = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geom, cloudMat);
      
      // Position randomly in a 400x400 space around coordinates
      const cx = (Math.random() - 0.5) * 400;
      const cz = (Math.random() - 0.5) * 400;
      mesh.position.set(cx, 52, cz);
      
      this.cloudsGroup.add(mesh);
    }
  }

  updateClouds(delta) {
    if (!this.cloudsGroup) return;

    this.cloudsGroup.children.forEach(cloud => {
      cloud.position.x += delta * 1.2; // Slow wind drift
      
      // If drifts past positive coordinate boundaries, wrap to opposite side
      if (cloud.position.x > 250) {
        cloud.position.x = -250;
        cloud.position.z = (Math.random() - 0.5) * 400;
      }
    });
  }

  // Initialize a pool of PointLight objects to dynamically display warm torch glow
  initTorchLightsPool() {
    if (this.torchLightsGroup) {
      this.scene.remove(this.torchLightsGroup);
    }
    this.torchLightsGroup = new THREE.Group();
    this.scene.add(this.torchLightsGroup);
    
    this.torchLightsPool = [];
    for (let i = 0; i < 8; i++) {
      const pl = new THREE.PointLight(0xffaa44, 1.3, 14);
      pl.castShadow = false; // keep false for high performance 60 FPS
      pl.visible = false;
      this.torchLightsGroup.add(pl);
      this.torchLightsPool.push(pl);
    }
  }

  // Position PointLights on the 8 closest torches using O(1) active torch coordinates cache
  updateTorchLights() {
    if (!this.world || !this.player) return;

    const px = this.player.position.x;
    const py = this.player.position.y;
    const pz = this.player.position.z;
    
    const torches = [];

    // Check of active torches in currently loaded chunk meshes
    if (this.world.loadedTorches) {
      for (const [chunkKey, list] of this.world.loadedTorches.entries()) {
        list.forEach(t => {
          const dx = t.x + 0.5 - px;
          const dy = t.y + 0.4 - py;
          const dz = t.z + 0.5 - pz;
          const distSq = dx*dx + dy*dy + dz*dz;
          // Only pull torches within 24 blocks radius to keep it efficient
          if (distSq < 576) {
            torches.push({ x: t.x + 0.5, y: t.y + 0.4, z: t.z + 0.5, distSq: distSq });
          }
        });
      }
    }

    torches.sort((a, b) => a.distSq - b.distSq);

    for (let i = 0; i < this.torchLightsPool.length; i++) {
      const pl = this.torchLightsPool[i];
      if (i < torches.length) {
        const torch = torches[i];
        pl.position.set(torch.x, torch.y, torch.z);
        pl.visible = true;
      } else {
        pl.visible = false;
      }
    }
  }

  // Spawn flying 3D Skeleton arrow projectiles
  spawnArrow(x, y, z, dir) {
    if (!this.arrows) this.arrows = [];
    
    const geom = new THREE.BoxGeometry(0.08, 0.08, 0.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    
    // Align direction
    const angle = Math.atan2(dir.x, dir.z);
    mesh.rotation.y = angle;
    mesh.rotation.x = -Math.asin(dir.y);

    this.scene.add(mesh);
    this.sounds.playShoot();

    this.arrows.push({
      mesh: mesh,
      velocity: dir.clone().multiplyScalar(15.0), // 15 blocks per second
      age: 0
    });
  }

  // Update and collide flying arrow entities
  updateArrows(delta) {
    if (!this.arrows) this.arrows = [];

    for (let i = 0; i < this.arrows.length; i++) {
      const arrow = this.arrows[i];
      arrow.age += delta;

      // Apply downward gravity to trajectory
      arrow.velocity.y -= 9.8 * delta;

      const nextPos = arrow.mesh.position.clone().addScaledVector(arrow.velocity, delta);

      // Hit Player boundary
      if (this.player && !this.player.isDead && this.player.position.distanceTo(nextPos) < 1.0) {
        this.player.takeDamage(3, "Shot by a Skeleton");
        this.scene.remove(arrow.mesh);
        arrow.mesh.geometry.dispose();
        arrow.mesh.material.dispose();
        this.arrows.splice(i, 1);
        i--;
        continue;
      }

      // Hit Solid Voxel blocks check
      const bx = Math.floor(nextPos.x);
      const by = Math.floor(nextPos.y);
      const bz = Math.floor(nextPos.z);
      const bid = this.world.getBlock(bx, by, bz);
      
      if (World.BLOCK_DEFS[bid]?.solid || arrow.age > 4.0) {
        this.scene.remove(arrow.mesh);
        arrow.mesh.geometry.dispose();
        arrow.mesh.material.dispose();
        this.arrows.splice(i, 1);
        i--;
        continue;
      }

      arrow.mesh.position.copy(nextPos);
      
      const dir = arrow.velocity.clone().normalize();
      arrow.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      arrow.mesh.rotation.x = -Math.asin(dir.y);
    }
  }

  // Spawn a rotating 3D floating voxel/item drop
  spawnItemDrop(x, y, z, itemId) {
    if (!this.itemDrops) this.itemDrops = [];
    if (this.itemDrops.length > 100) {
      const oldest = this.itemDrops.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
      }
    }

    const nameMap = {
      'grass_block': 1, 'grass': 1,
      'dirt': 2,
      'stone': 3,
      'cobblestone': 4,
      'wood_log': 5, 'wood': 5,
      'leaves': 6,
      'sand': 7,
      'water': 8,
      'glass': 9,
      'crafting_table': 10,
      'chest': 11,
      'wooden_planks': 12, 'planks': 12,
      'bed': 13,
      'cherry_leaves': 15,
      'cherry_log': 16, 'cherry_wood': 16,
      'red_flower': 17, 'flower_red': 17,
      'yellow_flower': 18, 'flower_yellow': 18,
      'blue_flower': 19, 'flower_blue': 19,
      'pink_flower': 20, 'flower_pink': 20,
      'torch': 21,
      'tnt': 22,
      'redstone_wire': 23,
      'lever': 24,
      'button': 25
    };

    let mesh = null;
    const blockId = nameMap[itemId] || 0;

    if (blockId !== 0 && World.BLOCK_DEFS[blockId]) {
      const def = World.BLOCK_DEFS[blockId];
      const size = 0.26;
      const geom = new THREE.BoxGeometry(size, size, size);
      const uvAttr = geom.getAttribute('uv');
      const uvs = uvAttr.array;
      const faces = [
        { name: 'side' }, { name: 'side' }, { name: 'top' },
        { name: 'bottom' }, { name: 'side' }, { name: 'side' }
      ];

      for (let f = 0; f < 6; f++) {
        const face = faces[f];
        let tileIndex = def[face.name] !== undefined ? def[face.name] : def.top;
        const tileCol = tileIndex % 8;
        const tileRow = Math.floor(tileIndex / 8);
        const u0 = tileCol / 8 + 0.005;
        const u1 = (tileCol + 1) / 8 - 0.005;
        const v0 = (7 - tileRow) / 8 + 0.005;
        const v1 = (8 - tileRow) / 8 - 0.005;
        const offset = f * 8;
        uvs[offset + 0] = u0; uvs[offset + 1] = v1;
        uvs[offset + 2] = u1; uvs[offset + 3] = v1;
        uvs[offset + 4] = u0; uvs[offset + 5] = v0;
        uvs[offset + 6] = u1; uvs[offset + 7] = v0;
      }
      uvAttr.needsUpdate = true;
      const isTrans = def.transparent;
      const mat = isTrans ? this.world.transparentMaterial : this.world.material;
      mesh = new THREE.Mesh(geom, mat);
    } else {
      // Custom Non-Block Item Drop (Meat, Bones, Arrows, String, Tools)
      const size = 0.28;
      const geom = new THREE.BoxGeometry(size, size, 0.06);
      let mat;

      const svgString = ITEM_SVGS[itemId];
      if (svgString) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });

        img.onload = () => {
          ctx.drawImage(img, 0, 0, 64, 64);
          texture.needsUpdate = true;
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      }

      mesh = new THREE.Mesh(geom, mat);
    }

    if (!mesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = false;
    
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.2,
      y + (Math.random() - 0.5) * 0.2,
      z + (Math.random() - 0.5) * 0.2
    );
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 1.5;
    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed * 0.5,
      2.0 + Math.random() * 2.0,
      Math.sin(angle) * speed * 0.5
    );

    this.scene.add(mesh);
    
    this.itemDrops.push({
      mesh: mesh,
      itemId: itemId,
      velocity: velocity,
      time: Math.random() * 100,
      age: 0,
      onGround: false
    });
  }

  // Update item physics, voxel collisions, and magnet collection
  updateItemDrops(delta) {
    if (!this.itemDrops) return;
    const playerPos = this.player.position.clone();
    playerPos.y += 0.8; // center height

    for (let i = 0; i < this.itemDrops.length; i++) {
      const drop = this.itemDrops[i];
      const dist = drop.mesh.position.distanceTo(playerPos);

      // Collection check
      if (dist < 0.6) {
        this.inventory.addItem(drop.itemId, 1);
        this.playCollectSound();
        this.scene.remove(drop.mesh);
        drop.mesh.geometry.dispose();
        this.itemDrops.splice(i, 1);
        i--;
        continue;
      }

      // Magnet pull check
      if (dist < 1.8) {
        drop.onGround = false;
        const pullDir = new THREE.Vector3().subVectors(playerPos, drop.mesh.position).normalize();
        const pullSpeed = 4.5;
        drop.velocity.copy(pullDir).multiplyScalar(pullSpeed);
      } else {
        // standard gravity & friction
        if (!drop.onGround) {
          drop.velocity.y -= 12.0 * delta;
        } else {
          drop.velocity.y = 0;
          drop.velocity.x *= 0.85;
          drop.velocity.z *= 0.85;
        }
      }

      // Movement step
      const nextPos = drop.mesh.position.clone().addScaledVector(drop.velocity, delta);

      const checkSolid = (x, y, z) => {
        const bid = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        const def = World.BLOCK_DEFS[bid];
        return def && def.solid;
      };

      // Collide Y
      if (checkSolid(nextPos.x, nextPos.y - 0.13, nextPos.z)) {
        drop.mesh.position.y = Math.floor(nextPos.y - 0.13) + 1.0 + 0.13;
        drop.velocity.y = 0;
        drop.onGround = true;
      } else {
        drop.mesh.position.y = nextPos.y;
        drop.onGround = false;
      }

      // Collide X
      if (checkSolid(nextPos.x - 0.13, drop.mesh.position.y, nextPos.z) || 
          checkSolid(nextPos.x + 0.13, drop.mesh.position.y, nextPos.z)) {
        drop.velocity.x = 0;
      } else {
        drop.mesh.position.x = nextPos.x;
      }

      // Collide Z
      if (checkSolid(drop.mesh.position.x, drop.mesh.position.y, nextPos.z - 0.13) || 
          checkSolid(drop.mesh.position.x, drop.mesh.position.y, nextPos.z + 0.13)) {
        drop.velocity.z = 0;
      } else {
        drop.mesh.position.z = nextPos.z;
      }

      // Spin
      drop.mesh.rotation.y += 1.5 * delta;

      // Bobbing on ground
      drop.time += delta;
      if (drop.onGround) {
        drop.mesh.position.y = Math.floor(drop.mesh.position.y - 0.13) + 1.0 + 0.13 + Math.sin(drop.time * 4.0) * 0.05 + 0.05;
      }

      // Age check
      drop.age += delta;
      if (drop.age > 300) {
        this.scene.remove(drop.mesh);
        drop.mesh.geometry.dispose();
        this.itemDrops.splice(i, 1);
        i--;
        continue;
      }
    }
  }

  // Play satisfying pick-up pop sound
  playCollectSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch(e) {
      // Audio fails are safe to ignore
    }
  }

  // Spawn and update falling cherry blossom petals
  updatePetals(delta) {
    if (!this.petals) this.petals = [];
    
    const playerBiome = this.world.getBiome(this.player.position.x, this.player.position.z);
    
    if (playerBiome === 'cherry_blossom' && this.petals.length < 40 && Math.random() < 0.15) {
      if (!this.petalMaterial) {
        this.petalMaterial = new THREE.MeshBasicMaterial({
          color: 0xffb7d5,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        this.petalGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.08);
      }

      const pMesh = new THREE.Mesh(this.petalGeometry, this.petalMaterial);
      pMesh.position.set(
        this.player.position.x + (Math.random() - 0.5) * 30,
        this.player.position.y + 12 + Math.random() * 4,
        this.player.position.z + (Math.random() - 0.5) * 30
      );
      
      this.scene.add(pMesh);
      
      this.petals.push({
        mesh: pMesh,
        velocity: new THREE.Vector3(
          -0.5 + Math.random() * 1.0,
          -1.2 - Math.random() * 0.8,
          -0.5 + Math.random() * 1.0
        ),
        time: Math.random() * 10
      });
    }

    // Sway and fall
    for (let i = 0; i < this.petals.length; i++) {
      const petal = this.petals[i];
      petal.time += delta;

      petal.mesh.position.x += (petal.velocity.x + Math.sin(petal.time * 2.0) * 0.3) * delta;
      petal.mesh.position.y += petal.velocity.y * delta;
      petal.mesh.position.z += (petal.velocity.z + Math.cos(petal.time * 2.0) * 0.3) * delta;

      petal.mesh.rotation.y += 0.8 * delta;
      petal.mesh.rotation.z += 0.4 * delta;

      const bx = Math.floor(petal.mesh.position.x);
      const by = Math.floor(petal.mesh.position.y);
      const bz = Math.floor(petal.mesh.position.z);
      const bid = this.world.getBlock(bx, by, bz);
      
      const isSolid = World.BLOCK_DEFS[bid]?.solid;
      
      if (isSolid || petal.mesh.position.y < this.player.position.y - 6) {
        this.scene.remove(petal.mesh);
        this.petals.splice(i, 1);
        i--;
      }
    }
  }

  saveGame() {
    if (this.gameState === 'start' || !this.player || !this.world) return;

    try {
      const saveData = {
        seed: this.seed,
        timeOfDay: this.timeOfDay,
        gameMode: this.gameMode,
        player: {
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z,
          rotation: {
            x: this.camera.rotation.x,
            y: this.camera.rotation.y,
            z: this.camera.rotation.z
          },
          health: this.player.health,
          hunger: this.player.hunger,
          isFlying: this.player.isFlying,
          inventory: {
            storage: this.inventory.storage,
            hotbar: this.inventory.hotbar
          }
        },
        achievements: this.achievements,
        darkCastleReady: this.darkCastleReady,
        darkCastleSpawned: this.darkCastleSpawned,
        decoratedChunks: Array.from(this.world.decoratedChunks),
        chests: Object.fromEntries(this.inventory.chests),
        modifications: this.world.modifications
      };

      localStorage.setItem('vivefall_save', JSON.stringify(saveData));

      // Display clean visual feedback popup
      const msg = document.createElement('div');
      msg.style.position = 'absolute';
      msg.style.top = '30%';
      msg.style.left = '50%';
      msg.style.transform = 'translate(-50%, -50%)';
      msg.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
      msg.style.color = '#7baf3a';
      msg.style.padding = '15px 30px';
      msg.style.fontFamily = "'VT323', monospace";
      msg.style.fontSize = '32px';
      msg.style.border = '4px solid #7baf3a';
      msg.style.zIndex = '9999';
      msg.textContent = 'GAME SAVED SUCCESSFULLY!';
      document.body.appendChild(msg);

      setTimeout(() => { msg.remove(); }, 2000);

      // Instantly update title load button
      const loadBtn = document.getElementById('btn-load');
      if (loadBtn) {
        loadBtn.classList.remove('disabled');
        loadBtn.removeAttribute('disabled');
      }
    } catch (e) {
      console.error('Failed to save game:', e);
      alert('Save failed: local storage space exceeded.');
    }
  }

  loadGame() {
    const rawData = localStorage.getItem('vivefall_save');
    if (!rawData) return;

    try {
      const savedData = JSON.parse(rawData);
      
      this.seed = savedData.seed;
      this.timeOfDay = savedData.timeOfDay;
      this.gameMode = savedData.gameMode;

      // Update Start Screen inputs
      document.getElementById('world-seed').value = this.seed || '';
      const btnStory = document.getElementById('btn-story');
      const btnCreative = document.getElementById('btn-creative');
      if (this.gameMode === 'story' || this.gameMode === 'survival') {
        if (btnStory) btnStory.classList.add('active');
        if (btnCreative) btnCreative.classList.remove('active');
      } else {
        if (btnCreative) btnCreative.classList.add('active');
        if (btnStory) btnStory.classList.remove('active');
      }

      // Hide start screen
      document.getElementById('start-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.gameState = 'playing';

      // Clear scene
      while(this.scene.children.length > 0){ 
        this.scene.remove(this.scene.children[0]); 
      }
      this.scene.add(this.ambientLight);
      this.scene.add(this.sunLight);
      this.scene.add(this.moonLight);
      this.scene.add(this.controls.getObject());

      // Initialize components
      this.noise = new SimplexNoise(this.seed);
      this.physics = new Physics(this);
      this.structures = new Structures(this);
      this.world = new World(this);
      this.inventory = new InventoryManager(this);
      this.player = new Player(this);
      this.mobs = new MobsManager(this);

      this.itemDrops = [];
      this.petals = [];
      
      this.sounds = new SoundManager();
      this.arrows = [];
      this.initTorchLightsPool();

      // Restore specific loaded states
      // Clean up old legacy save modifications that block doorways or clear beds
      const cleanedModifications = savedData.modifications ? { ...savedData.modifications } : {};
      
      for (let cx = -30; cx <= 30; cx++) {
        for (let cz = -30; cz <= 30; cz++) {
          const isVillageChunk = (cx === 1 && cz === 0) || ((Math.abs(cx) % 10 === 0) && (Math.abs(cz) % 10 === 0) && (cx !== 0 || cz !== 0));
          if (isVillageChunk) {
            const centerX = cx * 16 + 8;
            const centerZ = cz * 16 + 8;
            const villageY = this.world.getTerrainHeight(centerX, centerZ);
            
            const addHouseCoords = (hx, hz, doorSide) => {
              // 1. Clean doorway and step (3 blocks high)
              const dz = doorSide === 'south' ? -4 : 4;
              const sz = doorSide === 'south' ? -3 : 3;
              
              for (let yOffset = 1; yOffset <= 3; yOffset++) {
                delete cleanedModifications[`${hx},${villageY + yOffset},${hz + dz}`];
                delete cleanedModifications[`${hx},${villageY + yOffset},${hz + sz}`];
              }
              
              // 2. Clean entire 3x3 interior (from villageY + 1 to villageY + 4)
              for (let ix = hx - 1; ix <= hx + 1; ix++) {
                for (let iz = hz - 1; iz <= hz + 1; iz++) {
                  for (let iy = villageY + 1; iy <= villageY + 4; iy++) {
                    delete cleanedModifications[`${ix},${iy},${iz}`];
                  }
                }
              }
            };
            
            addHouseCoords(centerX - 6, centerZ - 6, 'south');
            addHouseCoords(centerX + 6, centerZ - 6, 'south');
            addHouseCoords(centerX - 6, centerZ + 6, 'north');
            addHouseCoords(centerX + 6, centerZ + 6, 'north');
          }
        }
      }
      this.world.modifications = cleanedModifications;
      this.inventory.storage = savedData.player.inventory.storage;
      this.inventory.hotbar = savedData.player.inventory.hotbar;
      
      // Load chests contents mapping
      const chestsMap = new Map();
      if (savedData.chests) {
        for (const [k, v] of Object.entries(savedData.chests)) {
          chestsMap.set(k, v);
        }
      }
      this.inventory.chests = chestsMap;

      // Initialize Clouds
      this.initClouds();

      // Regenerate chunks around the player coordinate first
      const p = savedData.player;
      this.player.position.set(p.x, p.y, p.z);
      this.world.generateAroundPlayer();

      // Position the player
      this.player.health = p.health;
      this.player.hunger = p.hunger;
      this.player.isFlying = p.isFlying;
      this.player.isDead = false;

      this.controls.getObject().position.copy(this.player.position);
      this.controls.getObject().position.y += 1.6;
      this.camera.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);

      // Restore achievements state
      if (savedData.achievements) {
        this.achievements = savedData.achievements;
        Object.keys(this.achievements).forEach(key => {
          if (this.achievements[key]) {
            const itemEl = document.getElementById(`quest-${key}`);
            if (itemEl) itemEl.classList.add('completed');
          }
        });
        const count = Object.values(this.achievements).filter(Boolean).length;
        const footer = document.getElementById('quest-status-footer');
        if (footer) footer.textContent = `[${count}/5 Achievements Unlocked]`;
      }
      this.darkCastleReady = savedData.darkCastleReady || false;
      this.darkCastleSpawned = savedData.darkCastleSpawned || false;

      const watchHud = document.getElementById('smartwatch-hud');
      if (watchHud) {
        if (this.gameMode === 'story') watchHud.classList.remove('hidden');
        else watchHud.classList.add('hidden');
      }

      this.player.updateHUD();
      this.inventory.renderAll();

      // Lock controls
      setTimeout(() => {
        this.controls.lock();
      }, 100);

      // Message overlay
      const msg = document.createElement('div');
      msg.style.position = 'absolute';
      msg.style.top = '30%';
      msg.style.left = '50%';
      msg.style.transform = 'translate(-50%, -50%)';
      msg.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
      msg.style.color = '#ffff55';
      msg.style.padding = '15px 30px';
      msg.style.fontFamily = "'VT323', monospace";
      msg.style.fontSize = '32px';
      msg.style.border = '4px solid #ffff55';
      msg.style.zIndex = '9999';
      msg.textContent = 'WORLD LOADED SUCCESSFULLY!';
      document.body.appendChild(msg);

      setTimeout(() => { msg.remove(); }, 2000);
    } catch (e) {
      console.error('Failed to load game:', e);
      alert('Failed to load saved world.');
    }
  }

  exportWorldFile() {
    this.saveGame();
    const rawData = localStorage.getItem('vivefall_save');
    if (!rawData) return;

    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vivefall_world_${this.seed || 'save'}.db`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importWorldFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        JSON.parse(content); // Validate JSON
        localStorage.setItem('vivefall_save', content);
        this.loadGame();
      } catch (err) {
        alert('Invalid .db world save file.');
      }
    };
    reader.readAsText(file);
  }

  igniteTNT(x, y, z) {
    if (this.world.getBlock(x, y, z) === World.BLOCK.TNT) {
      this.world.setBlock(x, y, z, World.BLOCK.AIR, true);
      this.spawnPrimedTNT(x + 0.5, y, z + 0.5);
    }
  }

  spawnPrimedTNT(x, y, z) {
    if (!this.tntEntities) this.tntEntities = [];
    
    const geom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y + 0.5, z);
    this.scene.add(mesh);
    this.sounds.playShoot();

    this.tntEntities.push({
      mesh: mesh,
      x: x, y: y, z: z,
      fuse: 2.5
    });
  }

  updateTNT(delta) {
    if (!this.tntEntities) return;
    for (let i = 0; i < this.tntEntities.length; i++) {
      const tnt = this.tntEntities[i];
      tnt.fuse -= delta;
      
      const flash = Math.sin(performance.now() * 0.03) > 0;
      tnt.mesh.material.color.setHex(flash ? 0xffffff : 0xff0000);

      if (tnt.fuse <= 0) {
        this.explodeTNT(tnt.mesh.position.x, tnt.mesh.position.y, tnt.mesh.position.z);
        this.scene.remove(tnt.mesh);
        tnt.mesh.geometry.dispose();
        tnt.mesh.material.dispose();
        this.tntEntities.splice(i, 1);
        i--;
      }
    }
  }

  explodeTNT(ex, ey, ez) {
    this.sounds.playExplode();
    const radius = 3.5;
    const rSq = radius * radius;

    const bx0 = Math.floor(ex - radius), bx1 = Math.floor(ex + radius);
    const by0 = Math.floor(ey - radius), by1 = Math.floor(ey + radius);
    const bz0 = Math.floor(ez - radius), bz1 = Math.floor(ez + radius);

    for (let x = bx0; x <= bx1; x++) {
      for (let y = by0; y <= by1; y++) {
        for (let z = bz0; z <= bz1; z++) {
          const dx = x + 0.5 - ex;
          const dy = y + 0.5 - ey;
          const dz = z + 0.5 - ez;
          if (dx*dx + dy*dy + dz*dz <= rSq) {
            const bid = this.world.getBlock(x, y, z);
            if (bid !== World.BLOCK.AIR && bid !== World.BLOCK.STONE) {
              this.world.setBlock(x, y, z, World.BLOCK.AIR, true);
              if (Math.random() < 0.4) {
                const defName = World.BLOCK_DEFS[bid]?.name;
                if (defName) {
                  this.spawnItemDrop(x + 0.5, y + 0.5, z + 0.5, defName.toLowerCase().replace(/ /g, '_'));
                }
              }
            }
          }
        }
      }
    }

    if (this.player && !this.player.isDead) {
      const pDist = this.player.position.distanceTo(new THREE.Vector3(ex, ey, ez));
      if (pDist < radius + 1) {
        const dmg = Math.floor((1 - pDist / (radius + 2)) * 15);
        if (dmg > 0) this.player.takeDamage(dmg, "Blown up by TNT");
      }
    }

    if (this.mobs) {
      this.mobs.mobs.forEach(mob => {
        if (!mob.isDead && mob.position.distanceTo(new THREE.Vector3(ex, ey, ez)) < radius + 1) {
          mob.takeDamage(15);
        }
      });
    }
  }

  toggleLever(x, y, z) {
    this.sounds.playClick();
    this.checkRedstoneNeighbors(x, y, z);
  }

  pressButton(x, y, z) {
    this.sounds.playClick();
    this.checkRedstoneNeighbors(x, y, z);
  }

  showStorySlideshow(isEnding = false) {
    this.isVictoryEnding = isEnding;
    this.storySlideIndex = 0;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('story-modal').classList.remove('hidden');
    
    if (isEnding) {
      this.storySlides = [
        {
          title: "VICTORY! THE MYSTIC BOOK",
          img: "images/zuzu_falling_in_book.png",
          text: "Zuzu defeated the Dark Lord and picked up the Mystic Book! As he turned the ancient pages, a brilliant beam of light enveloped him!"
        },
        {
          title: "RETURN TO HOME",
          img: "images/zuzu_finding_book.png",
          text: "WHOOSH! Zuzu opened his eyes to find himself back in the park, clutching his SmartWatch! He had escaped Vivefall and returned home a hero!"
        }
      ];
    }
    this.renderStorySlide();
  }

  renderStorySlide() {
    const slide = this.storySlides[this.storySlideIndex];
    if (!slide) return;

    document.getElementById('story-title').textContent = slide.title;
    document.getElementById('story-img').src = slide.img;
    document.getElementById('story-text').textContent = slide.text;

    const prevBtn = document.getElementById('btn-story-prev');
    const nextBtn = document.getElementById('btn-story-next');
    const startBtn = document.getElementById('btn-story-start');

    if (this.storySlideIndex === 0) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }

    if (this.storySlideIndex === this.storySlides.length - 1) {
      nextBtn.classList.add('hidden');
      startBtn.classList.remove('hidden');
      startBtn.textContent = this.isVictoryEnding ? "RETURN TO MENU" : "START STORY QUEST!";
    } else {
      nextBtn.classList.remove('hidden');
      startBtn.classList.add('hidden');
    }
  }

  nextStorySlide() {
    if (this.storySlideIndex < this.storySlides.length - 1) {
      this.storySlideIndex++;
      this.renderStorySlide();
    }
  }

  prevStorySlide() {
    if (this.storySlideIndex > 0) {
      this.storySlideIndex--;
      this.renderStorySlide();
    }
  }

  unlockAchievement(key) {
    if (!this.achievements || this.achievements[key]) return;
    this.achievements[key] = true;

    // Update SmartWatch HUD
    const itemEl = document.getElementById(`quest-${key}`);
    if (itemEl) itemEl.classList.add('completed');

    const count = Object.values(this.achievements).filter(Boolean).length;
    const footer = document.getElementById('quest-status-footer');
    if (footer) footer.textContent = `[${count}/5 Achievements Unlocked]`;

    this.sounds.playEat();

    // Show achievement notification popup
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '15%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'rgba(10, 25, 45, 0.95)';
    popup.style.border = '3px solid #00ffcc';
    popup.style.color = '#ffff55';
    popup.style.padding = '12px 24px';
    popup.style.fontFamily = "'VT323', monospace";
    popup.style.fontSize = '26px';
    popup.style.borderRadius = '8px';
    popup.style.zIndex = '9999';
    popup.textContent = `🏆 ACHIEVEMENT UNLOCKED: ${key.toUpperCase()}!`;
    document.body.appendChild(popup);

    setTimeout(() => { popup.remove(); }, 2500);

    // Check if all 5 completed
    if (count === 5 && !this.darkCastleReady) {
      this.darkCastleReady = true;
      const questMsg = document.createElement('div');
      questMsg.style.position = 'absolute';
      questMsg.style.top = '30%';
      questMsg.style.left = '50%';
      questMsg.style.transform = 'translate(-50%, -50%)';
      questMsg.style.backgroundColor = 'rgba(40, 0, 10, 0.95)';
      questMsg.style.border = '4px solid #ff0044';
      questMsg.style.color = '#ff3366';
      questMsg.style.padding = '20px 40px';
      questMsg.style.fontFamily = "'VT323', monospace";
      questMsg.style.fontSize = '32px';
      questMsg.style.borderRadius = '10px';
      questMsg.style.zIndex = '9999';
      questMsg.style.textAlign = 'center';
      questMsg.innerHTML = `🏰 ALL ACHIEVEMENTS UNLOCKED!<br><span style="color:#fff; font-size:24px;">The Dark Castle has risen in unexplored lands! Explore to find it!</span>`;
      document.body.appendChild(questMsg);

      setTimeout(() => { questMsg.remove(); }, 5000);
    }
  }

  triggerVictoryEnding() {
    this.controls.unlock();
    this.showStorySlideshow(true);
  }

  quitGame() {
    this.controls.unlock();
    this.gameState = 'start';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('ui-screen').classList.add('hidden');
    document.getElementById('story-modal').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    const watchHud = document.getElementById('smartwatch-hud');
    if (watchHud) watchHud.classList.add('hidden');
  }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new Engine();
});
