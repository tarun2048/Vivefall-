import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { SimplexNoise } from './simplex-noise.js?v=4';
import { World, BLOCK, BLOCK_DEFS } from './world.js?v=4';
import { Player } from './player.js?v=4';
import { Physics } from './physics.js?v=4';
import { MobsManager } from './mobs.js?v=4';
import { InventoryManager, ITEM_SVGS } from './inventory.js?v=4';
import { Structures } from './structures.js?v=4';
import { SoundManager } from './sound.js?v=4';
import { WeatherManager } from './weather.js?v=4';
import { SmartWatchController } from './smartwatch.js?v=4';
import { MultiplayerManager } from './multiplayer.js?v=4';

export class Engine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.clock = new THREE.Clock();
    
    this.gameState = 'start'; // 'start', 'playing', 'paused', 'inventory', 'gameover'
    this.seed = '';
    this.gameMode = 'story'; // 'story' or 'creative'
    this.multiplayer = new MultiplayerManager(this);
    this.smartwatch = new SmartWatchController(this);

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

    // 5. Initialize Voxel Sun, Moon, Halos, and Starfield
    this.initCelestialBodies();

    // 6. Controls setup
    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());

    // Bind events
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initUI() {
    this.activeWorldId = null;

    // Main Menu Navigation Binds
    const btnMenuPlay = document.getElementById('btn-menu-play');
    const btnMenuMultiplayer = document.getElementById('btn-menu-multiplayer');
    const btnMenuSettings = document.getElementById('btn-menu-settings');
    const btnOpenCreate = document.getElementById('btn-open-create-world');
    
    const btnPlayBack = document.getElementById('btn-play-back');
    const btnCreateBack = document.getElementById('btn-create-back');
    const btnMultiplayerBack = document.getElementById('btn-multiplayer-back');
    const btnSettingsBack = document.getElementById('btn-settings-back');

    if (btnMenuPlay) {
      btnMenuPlay.addEventListener('click', () => this.switchMenuView('play'));
    }
    if (btnMenuMultiplayer) {
      btnMenuMultiplayer.addEventListener('click', () => this.switchMenuView('multiplayer'));
    }
    if (btnMenuSettings) {
      btnMenuSettings.addEventListener('click', () => this.switchMenuView('settings'));
    }
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => this.switchMenuView('create'));
    }

    if (btnPlayBack) {
      btnPlayBack.addEventListener('click', () => this.switchMenuView('root'));
    }
    if (btnCreateBack) {
      btnCreateBack.addEventListener('click', () => this.switchMenuView('play'));
    }
    if (btnMultiplayerBack) {
      btnMultiplayerBack.addEventListener('click', () => this.switchMenuView('root'));
    }
    if (btnSettingsBack) {
      btnSettingsBack.addEventListener('click', () => this.switchMenuView('root'));
    }

    // Multiplayer Hub Tab Switching
    document.querySelectorAll('.mp-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-mptab');
        document.querySelectorAll('.mp-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['host', 'join', 'saved'].forEach(t => {
          const panel = document.getElementById(`mp-panel-${t}`);
          if (panel) {
            if (t === tab) panel.classList.remove('hidden');
            else panel.classList.add('hidden');
          }
        });
        if (tab === 'saved') this.renderSavedMultiplayerWorlds();
      });
    });

    // Multiplayer Host Mode Selection Cards
    let mpHostGameMode = 'story';
    const mpCardStory = document.getElementById('mp-mode-card-story');
    const mpCardCreative = document.getElementById('mp-mode-card-creative');

    if (mpCardStory) {
      mpCardStory.addEventListener('click', () => {
        mpHostGameMode = 'story';
        mpCardStory.classList.add('active');
        if (mpCardCreative) mpCardCreative.classList.remove('active');
      });
    }

    if (mpCardCreative) {
      mpCardCreative.addEventListener('click', () => {
        mpHostGameMode = 'creative';
        mpCardCreative.classList.add('active');
        if (mpCardStory) mpCardStory.classList.remove('active');
      });
    }

    // Multiplayer Host Random Seed
    const btnMpSeedRandom = document.getElementById('btn-mp-seed-random');
    if (btnMpSeedRandom) {
      btnMpSeedRandom.addEventListener('click', () => {
        document.getElementById('mp-host-seed').value = Math.random().toString(36).substring(2, 10);
      });
    }

    // Multiplayer Host Launch Button
    const btnMpHostLaunch = document.getElementById('btn-mp-host-launch');
    if (btnMpHostLaunch) {
      btnMpHostLaunch.addEventListener('click', async () => {
        const worldName = document.getElementById('mp-host-world-name').value.trim() || "Zuzu's Realm";
        const nick = document.getElementById('mp-host-nickname').value.trim() || 'Zuzu_Host';
        const seed = document.getElementById('mp-host-seed').value.trim() || Math.random().toString(36).substring(2, 10);

        this.seed = seed;
        this.activeWorldName = worldName;
        this.gameMode = mpHostGameMode;
        this.multiplayer.playerName = nick;
        localStorage.setItem('vivecraft_player_name', nick);

        await this.multiplayer.hostWorld(worldName, seed, mpHostGameMode);

        this.startGame();
        this.updateMultiplayerHUD();
      });
    }

    // Multiplayer Join Launch Button
    const btnMpJoinLaunch = document.getElementById('btn-mp-join-launch');
    if (btnMpJoinLaunch) {
      btnMpJoinLaunch.addEventListener('click', async () => {
        const code = document.getElementById('mp-join-code').value.trim().toUpperCase();
        const nick = document.getElementById('mp-join-nickname').value.trim() || 'Zuzu_Guest';
        if (!code) {
          alert('Please enter a room code!');
          return;
        }

        this.activeWorldName = `Realm ${code}`;
        this.multiplayer.playerName = nick;
        localStorage.setItem('vivecraft_player_name', nick);

        // Show connecting overlay while syncing terrain with host
        const connOverlay = document.getElementById('mp-connecting-overlay');
        if (connOverlay) {
          connOverlay.classList.remove('hidden');
          const connText = document.getElementById('mp-connecting-text');
          if (connText) connText.textContent = `Connecting to Host [${code}] & syncing terrain seed...`;
        }

        await this.multiplayer.joinWorld(code, nick);
      });
    }

    // Cancel multiplayer connecting button
    const btnCancelMp = document.getElementById('btn-cancel-mp-connect');
    if (btnCancelMp) {
      btnCancelMp.addEventListener('click', () => {
        const connOverlay = document.getElementById('mp-connecting-overlay');
        if (connOverlay) connOverlay.classList.add('hidden');
        if (this.multiplayer && this.multiplayer.joinTimeout) {
          clearTimeout(this.multiplayer.joinTimeout);
        }
      });
    }

    // World Creation Mode Selection Cards
    const cardStory = document.getElementById('mode-card-story');
    const cardCreative = document.getElementById('mode-card-creative');

    if (cardStory) {
      cardStory.addEventListener('click', () => {
        this.gameMode = 'story';
        cardStory.classList.add('active');
        if (cardCreative) cardCreative.classList.remove('active');
      });
    }

    if (cardCreative) {
      cardCreative.addEventListener('click', () => {
        this.gameMode = 'creative';
        cardCreative.classList.add('active');
        if (cardStory) cardStory.classList.remove('active');
      });
    }

    // Randomize Seed Button
    const btnSeedRandom = document.getElementById('btn-seed-random');
    if (btnSeedRandom) {
      btnSeedRandom.addEventListener('click', () => {
        const randomSeed = Math.random().toString(36).substring(2, 10);
        document.getElementById('world-seed').value = randomSeed;
      });
    }

    // Launch World Button
    const btnLaunch = document.getElementById('btn-play-create-start');
    if (btnLaunch) {
      btnLaunch.addEventListener('click', () => {
        const worldName = document.getElementById('world-name-input').value.trim() || 'My Voxel World';
        const seedInput = document.getElementById('world-seed').value.trim() || Math.random().toString(36).substring(2, 10);
        
        this.seed = seedInput;
        this.activeWorldName = worldName;
        this.activeWorldId = 'world_' + Date.now();

        if (this.gameMode === 'story') {
          this.showStorySlideshow(false);
        } else {
          this.startGame();
        }
      });
    }

    // Settings Render Distance Slider
    const renderSlider = document.getElementById('setting-render-distance');
    const renderValLabel = document.getElementById('val-render-distance');
    if (renderSlider && renderValLabel) {
      renderSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        renderValLabel.textContent = `${val} Chunks`;
        if (this.world) {
          this.world.renderDistance = val;
        }
      });
    }

    // Initial render of saved worlds list
    this.renderSavedWorldsList();

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
      if (this.gameState === 'inventory' || this.gameState === 'start' || this.gameState === 'gameover' || this.gameState === 'smartwatch') return;
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

    // Clear scene (remove any existing world blocks/entities)
    // Keep lights, controls camera
    while(this.scene.children.length > 0){ 
      this.scene.remove(this.scene.children[0]); 
    }
    this.scene.add(this.ambientLight);
    this.scene.add(this.sunLight);
    this.scene.add(this.moonLight);
    if (this.celestialGroup) this.scene.add(this.celestialGroup);
    this.scene.add(this.controls.getObject());

    // Clean up existing player event listeners to prevent duplicate listener accumulation
    if (this.player && typeof this.player.cleanup === 'function') {
      this.player.cleanup();
    }

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

    // Initialize Weather & SmartWatch
    if (this.weather) this.weather.cleanup();
    this.weather = new WeatherManager(this);
    if (!this.smartwatch) {
      this.smartwatch = new SmartWatchController(this);
    } else {
      this.smartwatch.refreshMessengerHeader();
    }

    const watchHud = document.getElementById('smartwatch-hud');
    if (watchHud) {
      watchHud.classList.remove('hidden');
    }

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
    // Advance time (unless paused via SmartWatch)
    if (!this.isTimePaused) {
      this.timeOfDay = (this.timeOfDay + delta * this.timeScale * 20) % 24000;
    }
    
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

    // Calculate orbital angle (Sun rises in East +X, peaks overhead +Y, sets in West -X)
    const angle = ((this.timeOfDay - 6000) / 24000) * Math.PI * 2;
    
    const distance = 260;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const px = this.player ? this.player.position.x : 0;
    const py = this.player ? this.player.position.y : 0;
    const pz = this.player ? this.player.position.z : 0;

    // Precise 3D World Positions for Sun and Moon
    const sunX = px + cosA * distance;
    const sunY = py + sinA * distance;
    const sunZ = pz + 40;

    const moonX = px - cosA * distance;
    const moonY = py - sinA * distance;
    const moonZ = pz - 40;

    // 1. Position Directional Lights EXACTLY at Sun and Moon positions!
    this.sunLight.position.set(sunX, sunY, sunZ);
    this.moonLight.position.set(moonX, moonY, moonZ);

    // 2. Position 3D Voxel Sun and Moon Meshes DIRECTLY at the light sources!
    if (this.sunMesh) {
      this.sunMesh.position.set(sunX, sunY, sunZ);
      this.sunMesh.lookAt(px, py, pz); // Face player!
    }

    if (this.moonMesh) {
      this.moonMesh.position.set(moonX, moonY, moonZ);
      this.moonMesh.lookAt(px, py, pz); // Face player!
    }

    if (this.stars) {
      this.stars.position.set(px, py, pz);
    }

    // 3. Update Sun & Moon Halo Opacities dynamically based on elevation
    const sunNormY = sinA;
    if (this.sunHalo && this.moonHalo) {
      if (sunNormY > 0) {
        this.sunHalo.material.opacity = Math.min(1.0, sunNormY * 1.5 + 0.2);
        this.moonHalo.material.opacity = 0;
      } else {
        this.sunHalo.material.opacity = 0;
        this.moonHalo.material.opacity = Math.min(1.0, -sunNormY * 1.5 + 0.2);
      }
    }

    // Twinkling stars in night sky (strictly hidden during daytime!)
    const isNight = this.timeOfDay > 18000 || this.timeOfDay < 6000;
    if (this.stars) {
      this.stars.visible = isNight;
    }
    if (this.starMaterial) {
      if (isNight) {
        let nightFactor = 1.0;
        if (this.timeOfDay > 18000 && this.timeOfDay < 20000) {
          nightFactor = (this.timeOfDay - 18000) / 2000;
        } else if (this.timeOfDay > 4000 && this.timeOfDay < 6000) {
          nightFactor = 1.0 - (this.timeOfDay - 4000) / 2000;
        }
        this.starMaterial.opacity = (0.75 + Math.sin(performance.now() * 0.003) * 0.2) * nightFactor;
      } else {
        this.starMaterial.opacity = 0;
      }
    }

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

    // Weather Atmosphere Modulation
    if (this.weather) {
      const prec = this.weather.getEffectivePrecipitation();
      if (prec === 'rain') {
        skyColor.lerp(new THREE.Color(0x384c60), 0.5);
        this.sunLight.intensity *= 0.55;
        this.ambientLight.intensity *= 0.75;
        fogDensity = Math.max(fogDensity, 0.024);
      } else if (prec === 'snow') {
        skyColor.lerp(new THREE.Color(0xceddec), 0.45);
        this.sunLight.intensity *= 0.7;
        this.ambientLight.intensity *= 0.85;
        fogDensity = Math.max(fogDensity, 0.022);
      }
    }

    // Set background sky and fog color
    this.scene.background.copy(skyColor);
    this.scene.fog.color.copy(skyColor);
    this.scene.fog.density = fogDensity;
  }

  initCelestialBodies() {
    this.celestialGroup = new THREE.Group();

    // 1. Sun Texture (Voxel Radiant Solar Face)
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 128;
    sunCanvas.height = 128;
    const sCtx = sunCanvas.getContext('2d');
    
    // Pure bright radiant core center matching Minecraft reference picture
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, 128, 128);
    sCtx.fillStyle = '#ffffea';
    sCtx.fillRect(8, 8, 112, 112);
    
    // Solar corona edges
    for (let i = 0; i < 128; i += 8) {
      if (Math.random() < 0.4) {
        sCtx.fillStyle = '#ffe082';
        sCtx.fillRect(i, 0, 8, 8);
        sCtx.fillRect(i, 120, 8, 8);
        sCtx.fillRect(0, i, 8, 8);
        sCtx.fillRect(120, i, 8, 8);
      }
    }

    const sunTex = new THREE.CanvasTexture(sunCanvas);
    sunTex.magFilter = THREE.NearestFilter;
    sunTex.minFilter = THREE.NearestFilter;

    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, fog: false });
    const sunGeom = new THREE.BoxGeometry(32, 32, 32);
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.celestialGroup.add(this.sunMesh);

    // Sun Volumetric Solar Corona Halo (fog: false)
    const sunHaloCanvas = document.createElement('canvas');
    sunHaloCanvas.width = 256;
    sunHaloCanvas.height = 256;
    const shCtx = sunHaloCanvas.getContext('2d');
    const sGrad = shCtx.createRadialGradient(128, 128, 16, 128, 128, 128);
    sGrad.addColorStop(0, 'rgba(255, 255, 240, 0.98)');
    sGrad.addColorStop(0.25, 'rgba(255, 210, 80, 0.7)');
    sGrad.addColorStop(0.55, 'rgba(255, 140, 20, 0.35)');
    sGrad.addColorStop(0.85, 'rgba(255, 80, 0, 0.1)');
    sGrad.addColorStop(1.0, 'rgba(255, 50, 0, 0)');
    shCtx.fillStyle = sGrad;
    shCtx.fillRect(0, 0, 256, 256);

    const sunHaloTex = new THREE.CanvasTexture(sunHaloCanvas);
    const sunHaloMat = new THREE.SpriteMaterial({ map: sunHaloTex, transparent: true, blending: THREE.AdditiveBlending, fog: false });
    this.sunHalo = new THREE.Sprite(sunHaloMat);
    this.sunHalo.scale.set(220, 220, 1);
    this.sunMesh.add(this.sunHalo);

    // 2. Moon Texture (Realistic Voxel Lunar Craters)
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 128;
    moonCanvas.height = 128;
    const mCtx = moonCanvas.getContext('2d');
    
    mCtx.fillStyle = '#ffffff';
    mCtx.fillRect(0, 0, 128, 128);
    
    // Lunar Maria & Highland Craters matching reference picture
    for (let x = 0; x < 128; x += 8) {
      for (let y = 0; y < 128; y += 8) {
        const r = Math.random();
        if (r < 0.3) {
          mCtx.fillStyle = '#cbd5e1';
          mCtx.fillRect(x, y, 8, 8);
        } else if (r < 0.5) {
          mCtx.fillStyle = '#94a3b8';
          mCtx.fillRect(x, y, 8, 8);
        }
      }
    }
    
    // Distinct crater rings
    const drawMoonCrater = (cx, cy, radius) => {
      mCtx.fillStyle = '#475569';
      mCtx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      mCtx.fillStyle = '#64748b';
      mCtx.fillRect(cx - radius + 2, cy - radius + 2, radius * 2 - 4, radius * 2 - 4);
      mCtx.fillStyle = '#e2e8f0';
      mCtx.fillRect(cx - radius, cy - radius, radius * 2, 2);
    };
    drawMoonCrater(36, 36, 14);
    drawMoonCrater(88, 76, 18);
    drawMoonCrater(76, 28, 12);
    drawMoonCrater(28, 88, 16);

    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.magFilter = THREE.NearestFilter;
    moonTex.minFilter = THREE.NearestFilter;

    const moonMat = new THREE.MeshBasicMaterial({ map: moonTex, fog: false });
    const moonGeom = new THREE.BoxGeometry(28, 28, 28);
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.celestialGroup.add(this.moonMesh);

    // Moon Volumetric Lunar Halo (fog: false)
    const moonHaloCanvas = document.createElement('canvas');
    moonHaloCanvas.width = 256;
    moonHaloCanvas.height = 256;
    const mhCtx = moonHaloCanvas.getContext('2d');
    const mGrad = mhCtx.createRadialGradient(128, 128, 16, 128, 128, 128);
    mGrad.addColorStop(0, 'rgba(240, 248, 255, 0.92)');
    mGrad.addColorStop(0.3, 'rgba(170, 215, 255, 0.55)');
    mGrad.addColorStop(0.6, 'rgba(90, 160, 255, 0.2)');
    mGrad.addColorStop(1.0, 'rgba(30, 80, 200, 0)');
    mhCtx.fillStyle = mGrad;
    mhCtx.fillRect(0, 0, 256, 256);

    const moonHaloTex = new THREE.CanvasTexture(moonHaloCanvas);
    const moonHaloMat = new THREE.SpriteMaterial({ map: moonHaloTex, transparent: true, blending: THREE.AdditiveBlending, fog: false });
    this.moonHalo = new THREE.Sprite(moonHaloMat);
    this.moonHalo.scale.set(200, 200, 1);
    this.moonMesh.add(this.moonHalo);

    // 3. Twinkling Night Stars Field (fog: false)
    const starsGeo = new THREE.BufferGeometry();
    const starPos = [];
    
    for (let i = 0; i < 350; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 270;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      starPos.push(x, y, z);
    }

    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3.5,
      transparent: true,
      opacity: 0,
      fog: false
    });
    
    this.stars = new THREE.Points(starsGeo, this.starMaterial);
    this.stars.visible = false;
    this.celestialGroup.add(this.stars);

    this.scene.add(this.celestialGroup);
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

        // Update TNT Primed Explosives & Fuse animations
        this.updatePrimedTNTs(delta);

        // Update Arrows projectiles
        this.updateArrows(delta);

        // Update Torch Lights pool
        if (!this.torchScanTimer) this.torchScanTimer = 0;
        this.torchScanTimer++;
        if (this.torchScanTimer >= 10) {
          this.torchScanTimer = 0;
          this.updateTorchLights();
        }

        // Update Biome HUD badge
        if (!this.biomeScanTimer) this.biomeScanTimer = 0;
        this.biomeScanTimer++;
        if (this.biomeScanTimer >= 10) {
          this.biomeScanTimer = 0;
          this.updateBiomeHUD();
        }

        // Update Item Drops physics
        this.updateItemDrops(delta);

        // Update Cherry Leaves particle petals
        this.updatePetals(delta);

        // Update Biome-Specific Weather Manager
        if (this.weather) this.weather.update(delta);

        // Update SmartWatch OS HUD & Debugger
        if (this.smartwatch) this.smartwatch.update(delta);

        // Update Multiplayer Peers, Remote Avatars & Offline Sync
        if (this.multiplayer) this.multiplayer.update(delta);

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

  updateBiomeHUD() {
    if (!this.player || !this.world) return;
    const px = Math.floor(this.player.position.x);
    const pz = Math.floor(this.player.position.z);
    const currentBiome = this.world.getBiome(px, pz);

    if (this.currentDisplayedBiome === currentBiome) return;
    this.currentDisplayedBiome = currentBiome;

    const displayEl = document.getElementById('biome-display');
    if (!displayEl) return;

    const biomeData = {
      mountains: { name: 'Alpine Peaks', icon: '🏔️' },
      snow: { name: 'Frozen Tundra', icon: '❄️' },
      jungle: { name: 'Tropical Jungle', icon: '🌴' },
      cherry_blossom: { name: 'Cherry Blossom Hills', icon: '🌸' },
      desert: { name: 'Arid Desert', icon: '🌵' },
      forest: { name: 'Dark Forest', icon: '🌲' },
      floral: { name: 'Floral Meadow', icon: '🌺' },
      plains: { name: 'Sunlit Plains', icon: '🌾' }
    };

    const data = biomeData[currentBiome] || biomeData.plains;
    displayEl.textContent = `Biome: ${data.icon} ${data.name}`;
  }

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
      'button': 25,
      'snow_grass': World.BLOCK.SNOW_GRASS,
      'snow_block': World.BLOCK.SNOW, 'snow': World.BLOCK.SNOW,
      'ice': World.BLOCK.ICE,
      'pine_log': World.BLOCK.PINE_WOOD, 'pine_wood': World.BLOCK.PINE_WOOD,
      'pine_leaves': World.BLOCK.PINE_LEAVES,
      'jungle_log': World.BLOCK.JUNGLE_WOOD, 'jungle_wood': World.BLOCK.JUNGLE_WOOD,
      'jungle_leaves': World.BLOCK.JUNGLE_LEAVES,
      'mossy_cobblestone': World.BLOCK.MOSSY_COBBLE
    };

    let mesh = null;
    let blockId = (this.player ? this.player.getItemBlockId(itemId) : 0) || nameMap[itemId] || 0;

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

        // Draw initial fallback backdrop immediately
        ctx.fillStyle = '#e8a838';
        ctx.fillRect(4, 4, 56, 56);
        texture.needsUpdate = true;

        mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });

        img.onload = () => {
          ctx.clearRect(0, 0, 64, 64);
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

  switchMenuView(viewName) {
    const views = ['root', 'play', 'create', 'settings'];
    views.forEach(v => {
      const el = document.getElementById(`menu-view-${v}`);
      if (el) {
        if (v === viewName) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    if (viewName === 'play') {
      this.renderSavedWorldsList();
    }
  }

  // TNT, Lever, Button & Copper Signal Circuit Mechanics
  igniteTNT(x, y, z, fuseTime = 3.0) {
    if (!this.world) return;
    const blockId = this.world.getBlock(x, y, z);
    if (blockId !== BLOCK.TNT && fuseTime === 3.0) return;

    // Clear static TNT block
    this.world.setBlock(x, y, z, BLOCK.AIR, true);

    // Create 3D Primed TNT mesh
    const tntGroup = new THREE.Group();
    tntGroup.position.set(x + 0.5, y + 0.5, z + 0.5);

    const geom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const mat = this.world.material.clone();
    const mesh = new THREE.Mesh(geom, mat);
    tntGroup.add(mesh);

    // Flashing white overlay
    const flashGeom = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const flashMesh = new THREE.Mesh(flashGeom, flashMat);
    tntGroup.add(flashMesh);

    this.scene.add(tntGroup);

    if (!this.primedTNTs) this.primedTNTs = [];
    this.primedTNTs.push({
      group: tntGroup,
      flashMesh: flashMesh,
      x: x + 0.5,
      y: y + 0.5,
      z: z + 0.5,
      fuse: fuseTime
    });

    if (this.sounds && this.sounds.playFuse) {
      this.sounds.playFuse();
    }
  }

  updatePrimedTNTs(delta) {
    if (!this.primedTNTs || this.primedTNTs.length === 0) return;

    for (let i = 0; i < this.primedTNTs.length; i++) {
      const tnt = this.primedTNTs[i];
      tnt.fuse -= delta;

      // Flashing white effect
      const flashSpeed = tnt.fuse < 1.0 ? 16 : 8;
      const isWhite = Math.floor(tnt.fuse * flashSpeed) % 2 === 0;
      tnt.flashMesh.material.opacity = isWhite ? 0.75 : 0.0;

      // Subtle pulse scaling
      const pulse = 1.0 + Math.sin(tnt.fuse * 14) * 0.06;
      tnt.group.scale.set(pulse, pulse, pulse);

      // Fuse smoke particles
      if (Math.random() < 0.3) {
        this.spawnSmokeParticle(tnt.x, tnt.y + 0.6, tnt.z);
      }

      if (tnt.fuse <= 0) {
        // Detonate TNT!
        this.detonateTNT(tnt.x, tnt.y, tnt.z);
        this.scene.remove(tnt.group);
        this.primedTNTs.splice(i, 1);
        i--;
      }
    }
  }

  detonateTNT(x, y, z) {
    // Explosion sound & Camera Shake
    if (this.sounds && this.sounds.playExplosion) {
      this.sounds.playExplosion();
    }

    const radius = 3.5;
    const rSq = radius * radius;

    const minX = Math.floor(x - radius);
    const maxX = Math.ceil(x + radius);
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(63, Math.ceil(y + radius));
    const minZ = Math.floor(z - radius);
    const maxZ = Math.ceil(z + radius);

    // 1. Voxel Block Destruction & Drops
    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          const dx = bx + 0.5 - x;
          const dy = by + 0.5 - y;
          const dz = bz + 0.5 - z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq <= rSq) {
            const blockId = this.world.getBlock(bx, by, bz);
            if (blockId !== BLOCK.AIR && blockId !== BLOCK.WATER) {
              this.world.setBlock(bx, by, bz, BLOCK.AIR, true);

              // 75% chance to spawn 3D mini-voxel item drop
              if (Math.random() < 0.75) {
                const itemId = this.getDropItemIdForBlock(blockId);
                if (itemId) {
                  this.spawnItemDrop(bx + 0.5, by + 0.5, bz + 0.5, itemId);
                }
              }

              // Chain reaction: If neighboring TNT is hit, ignite with short fuse!
              if (blockId === BLOCK.TNT) {
                this.igniteTNT(bx, by, bz, 0.2 + Math.random() * 0.3);
              }
            }
          }
        }
      }
    }

    // 2. Fiery Explosion Particles
    for (let p = 0; p < 30; p++) {
      this.spawnExplosionParticle(x, y, z);
    }

    // 3. Player Knockback & Damage
    if (this.player) {
      const pdx = this.player.position.x - x;
      const pdy = this.player.position.y - y;
      const pdz = this.player.position.z - z;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);

      if (pDist <= 6.0) {
        const force = (6.0 - pDist) / 6.0;
        const damage = Math.round(force * 14);
        if (damage > 0) {
          this.player.takeDamage(damage, "Blown up by TNT!");
        }
        // Knockback vector
        this.player.velocity.x += (pdx / (pDist + 0.1)) * force * 15;
        this.player.velocity.y += force * 12;
        this.player.velocity.z += (pdz / (pDist + 0.1)) * force * 15;
      }
    }
  }

  toggleLever(x, y, z) {
    if (this.sounds && this.sounds.playClick) {
      this.sounds.playClick();
    }
    this.triggerCopperSignal(x, y, z);
  }

  pressButton(x, y, z) {
    if (this.sounds && this.sounds.playClick) {
      this.sounds.playClick();
    }
    this.triggerCopperSignal(x, y, z);
  }

  toggleLantern(x, y, z) {
    if (this.sounds && this.sounds.playClick) {
      this.sounds.playClick();
    }
    const current = this.world.getBlock(x, y, z);
    if (current === BLOCK.LANTERN_ON) {
      this.world.setBlock(x, y, z, BLOCK.LANTERN, true);
      this.removePointLight(x, y, z);
    } else {
      this.world.setBlock(x, y, z, BLOCK.LANTERN_ON, true);
      this.addPointLight(x, y, z, 0xfffaed, 1.5, 14); // Whitish radiant glow
      this.spawnSparkParticle(x + 0.5, y + 0.5, z + 0.5);
    }
  }

  toggleGlowBlock(x, y, z) {
    if (this.sounds && this.sounds.playClick) {
      this.sounds.playClick();
    }
    const current = this.world.getBlock(x, y, z);
    if (current === BLOCK.GLOW_BLOCK_ON) {
      this.world.setBlock(x, y, z, BLOCK.GLOW_BLOCK, true);
      this.removePointLight(x, y, z);
    } else {
      this.world.setBlock(x, y, z, BLOCK.GLOW_BLOCK_ON, true);
      this.addPointLight(x, y, z, 0x38d4f0, 1.6, 16); // Bluish radiant glow
      this.spawnSparkParticle(x + 0.5, y + 0.5, z + 0.5);
    }
  }

  addPointLight(x, y, z, color, intensity, distance) {
    if (!this.pointLights) this.pointLights = new Map();
    const key = `${x},${y},${z}`;
    if (this.pointLights.has(key)) {
      const pl = this.pointLights.get(key);
      pl.color.setHex(color);
      pl.intensity = intensity;
      return;
    }
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.scene.add(light);
    this.pointLights.set(key, light);
  }

  removePointLight(x, y, z) {
    if (!this.pointLights) return;
    const key = `${x},${y},${z}`;
    if (this.pointLights.has(key)) {
      const light = this.pointLights.get(key);
      this.scene.remove(light);
      if (light.dispose) light.dispose();
      this.pointLights.delete(key);
    }
  }

  triggerCopperSignal(startX, startY, startZ) {
    // Breadth-First Search (BFS) for Copper Wires, TNT, Lanterns, and Glow Blocks
    const visited = new Set();
    const queue = [{ x: startX, y: startY, z: startZ, dist: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y},${current.z}`;
      if (visited.has(key) || current.dist > 18) continue;
      visited.add(key);

      // Check all 6 directions
      const dirs = [
        [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]
      ];

      for (const d of dirs) {
        const nx = current.x + d[0];
        const ny = current.y + d[1];
        const nz = current.z + d[2];
        const nKey = `${nx},${ny},${nz}`;

        if (visited.has(nKey)) continue;
        const nBlock = this.world.getBlock(nx, ny, nz);

        if (nBlock === BLOCK.TNT) {
          this.igniteTNT(nx, ny, nz);
        } else if (nBlock === BLOCK.LANTERN || nBlock === BLOCK.LANTERN_ON) {
          this.toggleLantern(nx, ny, nz);
          this.spawnSparkParticle(nx + 0.5, ny + 0.5, nz + 0.5);
        } else if (nBlock === BLOCK.GLOW_BLOCK || nBlock === BLOCK.GLOW_BLOCK_ON) {
          this.toggleGlowBlock(nx, ny, nz);
          this.spawnSparkParticle(nx + 0.5, ny + 0.5, nz + 0.5);
        } else if (nBlock === BLOCK.REDSTONE_WIRE || nBlock === BLOCK.COPPER_WIRE) {
          // Spark particle on copper wire
          this.spawnSparkParticle(nx + 0.5, ny + 0.1, nz + 0.5);
          queue.push({ x: nx, y: ny, z: nz, dist: current.dist + 1 });
        }
      }
    }
  }

  spawnSmokeParticle(x, y, z) {
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.8 });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2);
    this.scene.add(p);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.05;
      p.position.y += 0.03;
      p.scale.addScalar(0.04);
      mat.opacity -= 0.04;
      if (life >= 0.8 || mat.opacity <= 0) {
        clearInterval(interval);
        this.scene.remove(p);
        geo.dispose();
        mat.dispose();
      }
    }, 40);
  }

  spawnExplosionParticle(x, y, z) {
    const color = ['#ff6600', '#ffcc00', '#ff3300', '#444444'][Math.floor(Math.random() * 4)];
    const geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
    const p = new THREE.Mesh(geo, mat);
    
    p.position.set(x, y, z);
    const vx = (Math.random() - 0.5) * 12;
    const vy = Math.random() * 8 + 2;
    const vz = (Math.random() - 0.5) * 12;

    this.scene.add(p);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.05;
      p.position.x += vx * 0.05;
      p.position.y += vy * 0.05;
      p.position.z += vz * 0.05;
      p.scale.multiplyScalar(0.96);
      mat.opacity -= 0.04;

      if (life >= 0.7 || mat.opacity <= 0) {
        clearInterval(interval);
        this.scene.remove(p);
        geo.dispose();
        mat.dispose();
      }
    }, 30);
  }

  spawnSparkParticle(x, y, z) {
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3);
    this.scene.add(p);

    setTimeout(() => {
      this.scene.remove(p);
      geo.dispose();
      mat.dispose();
    }, 350);
  }

  getDropItemIdForBlock(blockId) {
    if (blockId === BLOCK.GRASS) return 'dirt';
    if (blockId === BLOCK.DIRT) return 'dirt';
    if (blockId === BLOCK.STONE) return 'cobblestone';
    if (blockId === BLOCK.COBBLESTONE) return 'cobblestone';
    if (blockId === BLOCK.WOOD) return 'wood_log';
    if (blockId === BLOCK.LEAVES) return 'leaves';
    if (blockId === BLOCK.SAND) return 'sand';
    if (blockId === BLOCK.GLASS) return 'glass';
    if (blockId === BLOCK.CRAFTING_TABLE) return 'crafting_table';
    if (blockId === BLOCK.CHEST) return 'chest';
    if (blockId === BLOCK.PLANKS) return 'wooden_planks';
    if (blockId === BLOCK.BED_HEAD || blockId === BLOCK.BED_FOOT) return 'bed';
    if (blockId === BLOCK.TNT) return 'tnt';
    if (blockId === BLOCK.COPPER_WIRE || blockId === BLOCK.REDSTONE_WIRE) return 'copper_wire';
    if (blockId === BLOCK.LEVER) return 'lever';
    if (blockId === BLOCK.BUTTON) return 'button';
    if (blockId === BLOCK.SNOW_GRASS) return 'snow_grass';
    if (blockId === BLOCK.SNOW) return 'snow_block';
    if (blockId === BLOCK.ICE) return 'ice';
    if (blockId === BLOCK.PINE_WOOD) return 'pine_log';
    if (blockId === BLOCK.PINE_LEAVES) return 'pine_leaves';
    if (blockId === BLOCK.JUNGLE_WOOD) return 'jungle_log';
    if (blockId === BLOCK.JUNGLE_LEAVES) return 'jungle_leaves';
    if (blockId === BLOCK.MOSSY_COBBLE) return 'mossy_cobblestone';
    if (blockId === BLOCK.LANTERN || blockId === BLOCK.LANTERN_ON) return 'lantern';
    if (blockId === BLOCK.GLOW_BLOCK || blockId === BLOCK.GLOW_BLOCK_ON) return 'glow_block';
    return null;
  }
  getSavedWorldsIndex() {
    try {
      const rawIndex = localStorage.getItem('vivefall_worlds_index');
      let index = rawIndex ? JSON.parse(rawIndex) : [];

      // Check legacy single save migration
      const legacySave = localStorage.getItem('vivefall_save');
      if (legacySave && !index.some(w => w.id === 'legacy_save')) {
        let legacyData = {};
        try { legacyData = JSON.parse(legacySave); } catch (e) {}
        const legacyWorld = {
          id: 'legacy_save',
          name: 'Legacy World',
          seed: legacyData.seed || 'default',
          gameMode: legacyData.gameMode || 'story',
          lastPlayed: 'Saved Session'
        };
        index.unshift(legacyWorld);
        localStorage.setItem('vivefall_world_legacy_save', legacySave);
        localStorage.setItem('vivefall_worlds_index', JSON.stringify(index));
      }
      return index;
    } catch (e) {
      console.error('Failed reading worlds index:', e);
      return [];
    }
  }

  renderSavedWorldsList() {
    const container = document.getElementById('saved-worlds-list');
    if (!container) return;

    container.innerHTML = '';
    const worlds = this.getSavedWorldsIndex();

    if (worlds.length === 0) {
      container.innerHTML = `
        <div class="empty-worlds-card">
          <div class="empty-icon">🗺️</div>
          <div class="empty-title">No Saved Worlds</div>
          <div class="empty-desc">Click "Create New World" above to begin your adventure!</div>
        </div>
      `;
      return;
    }

    worlds.forEach(world => {
      const card = document.createElement('div');
      card.className = 'world-item-card';

      const modeBadge = world.gameMode === 'story' ? '<span class="mode-badge story">STORY MODE</span>' : '<span class="mode-badge">CREATIVE</span>';
      
      card.innerHTML = `
        <div class="world-info">
          <div class="world-title-row">
            <span class="world-name">${world.name || 'Voxel World'}</span>
            ${modeBadge}
          </div>
          <div class="world-meta">Seed: <code>${world.seed}</code> • ${world.lastPlayed || 'Recent'}</div>
        </div>
        <div class="world-actions">
          <button class="world-action-btn play-btn" data-id="${world.id}">⚔️ PLAY</button>
          <button class="world-action-btn delete-btn" data-id="${world.id}">🗑️</button>
        </div>
      `;

      card.querySelector('.play-btn').addEventListener('click', () => {
        this.loadWorldById(world.id);
      });

      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteWorldById(world.id);
      });

      container.appendChild(card);
    });
  }

  deleteWorldById(worldId) {
    if (!confirm('Are you sure you want to delete this world?')) return;
    try {
      let index = this.getSavedWorldsIndex();
      index = index.filter(w => w.id !== worldId);
      localStorage.setItem('vivefall_worlds_index', JSON.stringify(index));
      localStorage.removeItem('vivefall_world_' + worldId);
      if (worldId === 'legacy_save') {
        localStorage.removeItem('vivefall_save');
      }
      this.renderSavedWorldsList();
    } catch (e) {
      console.error('Failed to delete world:', e);
    }
  }

  saveGame() {
    if (this.gameState === 'start' || !this.player || !this.world) return;

    try {
      if (!this.activeWorldId) {
        this.activeWorldId = 'world_' + Date.now();
      }
      if (!this.activeWorldName) {
        this.activeWorldName = 'Voxel World ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const saveData = {
        id: this.activeWorldId,
        name: this.activeWorldName,
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

      // Store world save data
      localStorage.setItem('vivefall_world_' + this.activeWorldId, JSON.stringify(saveData));
      localStorage.setItem('vivefall_save', JSON.stringify(saveData));

      // Update worlds index
      let index = this.getSavedWorldsIndex();
      const existingIdx = index.findIndex(w => w.id === this.activeWorldId);
      const worldMeta = {
        id: this.activeWorldId,
        name: this.activeWorldName,
        seed: this.seed,
        gameMode: this.gameMode,
        lastPlayed: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (existingIdx >= 0) {
        index[existingIdx] = worldMeta;
      } else {
        index.unshift(worldMeta);
      }
      localStorage.setItem('vivefall_worlds_index', JSON.stringify(index));

      // Display clean visual feedback popup
      const msg = document.createElement('div');
      msg.style.position = 'absolute';
      msg.style.top = '30%';
      msg.style.left = '50%';
      msg.style.transform = 'translate(-50%, -50%)';
      msg.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
      msg.style.color = '#00ffcc';
      msg.style.padding = '15px 30px';
      msg.style.fontFamily = "'VT323', monospace";
      msg.style.fontSize = '32px';
      msg.style.border = '3px solid #00ffcc';
      msg.style.borderRadius = '12px';
      msg.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.5)';
      msg.style.zIndex = '9999';
      msg.textContent = 'WORLD SAVED SUCCESSFULLY!';
      document.body.appendChild(msg);

      setTimeout(() => { msg.remove(); }, 2000);
    } catch (e) {
      console.error('Failed to save game:', e);
      alert('Save failed: local storage space exceeded.');
    }
  }

  loadWorldById(worldId) {
    const rawData = localStorage.getItem('vivefall_world_' + worldId) || localStorage.getItem('vivefall_save');
    if (!rawData) return;
    this.activeWorldId = worldId;
    this.loadGameData(rawData);
  }

  loadGame() {
    const rawData = localStorage.getItem('vivefall_save');
    if (!rawData) return;
    this.loadGameData(rawData);
  }

  loadGameData(rawData) {
    try {
      const savedData = JSON.parse(rawData);
      
      this.activeWorldId = savedData.id || this.activeWorldId || 'world_' + Date.now();
      this.activeWorldName = savedData.name || 'Saved Voxel World';
      this.seed = savedData.seed;
      this.timeOfDay = savedData.timeOfDay;
      this.gameMode = savedData.gameMode || 'story';

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
      if (this.celestialGroup) this.scene.add(this.celestialGroup);
      this.scene.add(this.controls.getObject());

      // Clean up existing player event listeners
      if (this.player && typeof this.player.cleanup === 'function') {
        this.player.cleanup();
      }

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

      // Initialize Weather & SmartWatch
      if (this.weather) this.weather.cleanup();
      this.weather = new WeatherManager(this);
      if (!this.smartwatch) {
        this.smartwatch = new SmartWatchController(this);
      } else {
        this.smartwatch.refreshMessengerHeader();
      }

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
      if (savedData.player && savedData.player.inventory) {
        if (savedData.player.inventory.storage) this.inventory.storage = savedData.player.inventory.storage;
        if (savedData.player.inventory.hotbar) this.inventory.hotbar = savedData.player.inventory.hotbar;
      }
      
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
        watchHud.classList.remove('hidden');
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

  switchMenuView(viewName) {
    const views = ['root', 'play', 'create', 'multiplayer', 'settings'];
    views.forEach(v => {
      const el = document.getElementById(`menu-view-${v}`);
      if (el) {
        if (v === viewName) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    if (viewName === 'play') {
      this.renderSavedWorldsList();
    } else if (viewName === 'multiplayer') {
      this.renderSavedMultiplayerWorlds();
    }
  }

  updateMultiplayerHUD() {
    const indicator = document.getElementById('mp-hud-indicator');
    const roomEl = document.getElementById('mp-hud-room');
    const roleEl = document.getElementById('mp-hud-role');

    if (!indicator) return;

    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      indicator.classList.remove('hidden');
      if (roomEl) roomEl.textContent = `ROOM: ${this.multiplayer.roomCode}`;
      if (roleEl) {
        roleEl.textContent = this.multiplayer.isModerator ? '👑 MOD' : '👤 GUEST';
        roleEl.style.background = this.multiplayer.isModerator ? '#f59e0b' : '#0284c7';
        roleEl.style.color = this.multiplayer.isModerator ? '#000' : '#fff';
      }
    } else {
      indicator.classList.add('hidden');
    }
  }

  renderSavedMultiplayerWorlds() {
    const container = document.getElementById('mp-saved-worlds-list');
    if (!container || !this.multiplayer) return;

    container.innerHTML = '';
    const worlds = this.multiplayer.getSavedWorlds();

    if (worlds.length === 0) {
      container.innerHTML = `<div class="empty-worlds-msg" style="padding: 16px; text-align: center; color: #94a3b8; font-size: 14px;">No saved multiplayer worlds yet. Host or join one!</div>`;
      return;
    }

    worlds.forEach(w => {
      const card = document.createElement('div');
      card.className = 'world-item-card';

      const roleBadge = w.isHost ? '<span class="mode-badge story">👑 HOST (MOD)</span>' : '<span class="mode-badge">👤 GUEST</span>';

      card.innerHTML = `
        <div class="world-info">
          <div class="world-title-row">
            <span class="world-name">${w.worldName || 'Multiplayer Realm'}</span>
            ${roleBadge}
          </div>
          <div class="world-meta">Room: <code>${w.roomCode}</code> • Mode: ${w.gameMode || 'story'}</div>
        </div>
        <div class="world-actions">
          <button class="world-action-btn play-btn" data-code="${w.roomCode}">🔗 RECONNECT</button>
        </div>
      `;

      card.querySelector('.play-btn').addEventListener('click', async () => {
        if (w.isHost) {
          await this.multiplayer.hostWorld(w.worldName, w.seed, w.gameMode);
          this.startGame();
          this.updateMultiplayerHUD();
        } else {
          const connOverlay = document.getElementById('mp-connecting-overlay');
          if (connOverlay) {
            connOverlay.classList.remove('hidden');
            const connText = document.getElementById('mp-connecting-text');
            if (connText) connText.textContent = `Reconnecting to Realm [${w.roomCode}] & syncing world...`;
          }
          await this.multiplayer.joinWorld(w.roomCode, this.multiplayer.playerName);
        }
      });

      container.appendChild(card);
    });
  }

  quitGame() {
    this.controls.unlock();
    if (this.player && typeof this.player.cleanup === 'function') {
      this.player.cleanup();
    }
    if (this.weather) {
      this.weather.cleanup();
      this.weather = null;
    }
    if (this.multiplayer) {
      this.multiplayer.isMultiplayer = false;
    }
    const mpIndicator = document.getElementById('mp-hud-indicator');
    if (mpIndicator) mpIndicator.classList.add('hidden');

    this.gameState = 'start';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('ui-screen').classList.add('hidden');
    document.getElementById('story-modal').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    const watchHud = document.getElementById('smartwatch-hud');
    if (watchHud) watchHud.classList.add('hidden');
    this.switchMenuView('root');
  }
}

// Bulletproof Engine instantiation (handles both pre-loaded and deferred module execution)
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new Engine();
  });
} else {
  window.gameEngine = new Engine();
}
