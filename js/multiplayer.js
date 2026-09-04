import * as THREE from 'three';
import { ZuzuCharacterModel } from './zuzu_model.js?v=4';
import { BLOCK } from './world.js?v=4';

/**
 * RemotePlayer represents another player in the multiplayer session.
 * Renders an in-game 3D Zuzu character model, handles smooth interpolation,
 * held items, animations, and a floating 3D nametag with Moderator badge.
 */
export class RemotePlayer {
  constructor(peerId, name, isModerator = false, scene) {
    this.peerId = peerId;
    this.name = name || `Player_${peerId.slice(0, 4)}`;
    this.isModerator = isModerator;
    this.scene = scene;
    this.hasReceivedFirstPos = false;

    // Position & rotation targets for interpolation
    this.position = new THREE.Vector3(0, 40, 0);
    this.targetPosition = new THREE.Vector3(0, 40, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.velocityMag = 0;
    this.isMining = false;
    this.isJumping = false;
    this.heldItem = null;
    this.armor = { head: null, chest: null, legs: null, feet: null };

    // Create 3D Zuzu Model
    this.model = new ZuzuCharacterModel({ scale: 1.0 });
    this.model.mesh.position.copy(this.position);
    if (this.scene) {
      this.scene.add(this.model.mesh);
    }

    // Create Floating 3D Nametag Sprite
    this.nametag = this.createNametagSprite(this.name, this.isModerator);
    this.nametag.position.set(0, 2.3, 0);
    this.model.mesh.add(this.nametag);
  }

  createNametagSprite(name, isMod) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background rounded pill
    ctx.fillStyle = isMod ? 'rgba(30, 20, 5, 0.85)' : 'rgba(10, 15, 25, 0.8)';
    ctx.strokeStyle = isMod ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 4;
    
    // Draw rounded rectangle
    const x = 20, y = 20, w = 472, h = 88, r = 24;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px "Segoe UI", "VT323", sans-serif';

    if (isMod) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`👑 [MOD] ${name}`, 256, 64);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`👤 ${name}`, 256, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.0, 0.5, 1.0);
    return sprite;
  }

  updateData(data) {
    if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
      if (!this.hasReceivedFirstPos) {
        this.hasReceivedFirstPos = true;
        this.position.set(data.x, data.y, data.z);
        this.targetPosition.set(data.x, data.y, data.z);
        if (this.model && this.model.mesh) {
          this.model.mesh.position.copy(this.position);
        }
      } else {
        this.targetPosition.set(data.x, data.y, data.z);
      }
    }
    if (data.rotY !== undefined) {
      this.targetRotationY = data.rotY;
    }
    if (data.velocityMag !== undefined) {
      this.velocityMag = data.velocityMag;
    }
    if (data.isMining !== undefined) {
      this.isMining = data.isMining;
    }
    if (data.isJumping !== undefined) {
      this.isJumping = data.isJumping;
    }
    if (data.heldItem !== undefined && data.heldItem !== this.heldItem) {
      this.heldItem = data.heldItem;
      this.model.setHeldItem(this.heldItem);
    }
    if (data.isModerator !== undefined && data.isModerator !== this.isModerator) {
      this.isModerator = data.isModerator;
      this.model.mesh.remove(this.nametag);
      this.nametag = this.createNametagSprite(this.name, this.isModerator);
      this.nametag.position.set(0, 2.3, 0);
      this.model.mesh.add(this.nametag);
    }
  }

  update(delta) {
    if (!this.model || !this.model.mesh) return;

    // Guarantee model mesh is attached to the active scene
    if (this.scene && this.model.mesh.parent !== this.scene) {
      this.scene.add(this.model.mesh);
    }

    // Smooth interpolation (LERP) towards target coordinates
    this.position.lerp(this.targetPosition, 0.25);
    this.model.mesh.position.copy(this.position);

    // Smooth rotation interpolation
    let rotDiff = this.targetRotationY - this.rotationY;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.rotationY += rotDiff * 0.25;
    this.model.mesh.rotation.y = this.rotationY;

    // Animate character model limbs & breathing
    const isMoving = this.velocityMag > 0.1;
    this.model.update(
      delta,
      performance.now() / 1000,
      this.velocityMag,
      isMoving,
      this.isJumping,
      this.isMining
    );
  }

  dispose() {
    if (this.model && this.model.mesh) {
      this.scene.remove(this.model.mesh);
    }
  }
}

/**
 * MultiplayerManager
 * Handles zero-cost PeerJS WebRTC connections, robust IndexedDB & LocalStorage delta sync,
 * moderator permissions, remote player syncing, terrain seed matching, and SmartWatch messenger.
 */
export class MultiplayerManager {
  constructor(engine) {
    this.engine = engine;
    this.isMultiplayer = false;
    this.isHost = false;
    this.isModerator = false;
    this.roomCode = null;
    this.worldId = null;
    this.playerName = localStorage.getItem('vivecraft_player_name') || `Zuzu_${Math.floor(1000 + Math.random() * 9000)}`;
    this.peer = null;
    this.peerId = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.remotePlayers = new Map(); // peerId -> RemotePlayer
    this.chatHistory = [];
    this.unreadCount = 0;

    // Delta tracking
    this.deltas = [];
    this.appliedDeltaIds = new Set();
    this.lastSyncTime = 0;
    this.db = null;

    // Broadcast interval timer
    this.syncTimer = 0;
    this.broadcastRate = 1 / 20; // 20 updates per second

    this.initDatabase();
  }

  /**
   * Initialize IndexedDB for resilient offline delta persistence
   */
  async initDatabase() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('vivecraft_multiplayer_db', 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('deltas')) {
            const deltaStore = db.createObjectStore('deltas', { keyPath: 'id' });
            deltaStore.createIndex('roomCode', 'roomCode', { unique: false });
            deltaStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains('rooms')) {
            db.createObjectStore('rooms', { keyPath: 'roomCode' });
          }
        };
        request.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        request.onerror = () => {
          console.warn('IndexedDB unavailable, falling back to LocalStorage.');
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });
  }

  /**
   * Generate clean 6-character room code (e.g. VIVE-7A)
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VIVE-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Save world to stored worlds list
   */
  saveToSavedWorlds(worldInfo) {
    try {
      const stored = JSON.parse(localStorage.getItem('vivecraft_mp_worlds') || '[]');
      const filtered = stored.filter(w => w.roomCode !== worldInfo.roomCode);
      filtered.unshift({
        roomCode: worldInfo.roomCode,
        worldName: worldInfo.worldName || 'Multiplayer World',
        seed: worldInfo.seed || '',
        gameMode: worldInfo.gameMode || 'story',
        isHost: worldInfo.isHost || false,
        hostName: worldInfo.hostName || this.playerName,
        lastPlayed: Date.now()
      });
      localStorage.setItem('vivecraft_mp_worlds', JSON.stringify(filtered.slice(0, 10)));
    } catch (e) {
      console.error('Error saving world to storage:', e);
    }
  }

  getSavedWorlds() {
    try {
      return JSON.parse(localStorage.getItem('vivecraft_mp_worlds') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Host a new multiplayer world (Player becomes Moderator)
   */
  async hostWorld(worldName, seed, gameMode) {
    this.isMultiplayer = true;
    this.isHost = true;
    this.isModerator = true;
    this.roomCode = this.generateRoomCode();
    this.worldId = `world_${this.roomCode}_${seed || 'def'}`;

    console.log(`[Multiplayer] Hosting world "${worldName}" with Room Code: ${this.roomCode}, Seed: "${seed}"`);

    this.saveToSavedWorlds({
      roomCode: this.roomCode,
      worldName: worldName || "Zuzu's Realm",
      seed: seed,
      gameMode: gameMode,
      isHost: true,
      hostName: this.playerName
    });

    await this.initPeer(this.roomCode);
    this.loadStoredRoomDeltas(this.roomCode);

    // Initial system chat message
    this.receiveChatMessage({
      author: 'SYSTEM',
      isMod: true,
      text: `👑 Realm created! Room Code: [${this.roomCode}]. Share this code with friends to join!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    return this.roomCode;
  }

  /**
   * Join an existing multiplayer world by room code
   */
  async joinWorld(roomCode, nickname) {
    if (nickname) {
      this.playerName = nickname.trim();
      localStorage.setItem('vivecraft_player_name', this.playerName);
    }

    this.isMultiplayer = true;
    this.isHost = false;
    this.isModerator = false;
    this.roomCode = roomCode.toUpperCase().trim();
    this.worldId = `world_${this.roomCode}`;

    console.log(`[Multiplayer] Joining world with Code: ${this.roomCode} as ${this.playerName}`);

    // Check if we have previously saved metadata (e.g. seed) for this room
    const saved = this.getSavedWorlds().find(w => w.roomCode === this.roomCode);
    if (saved && saved.seed) {
      this.engine.seed = saved.seed;
      this.engine.gameMode = saved.gameMode || 'story';
    }

    await this.initPeer();
    this.connectToHost(this.roomCode);
    this.loadStoredRoomDeltas(this.roomCode);

    // Timeout handler: if host doesn't reply within 8 seconds, inform user on overlay
    this.joinTimeout = setTimeout(() => {
      if (this.engine.gameState === 'start') {
        console.warn('[Multiplayer] Connection timeout waiting for host world_sync');
        const connText = document.getElementById('mp-connecting-text');
        if (connText) {
          connText.innerHTML = `<span style="color:#ef4444;">⚠️ Connection timed out.</span><br><span style="font-size:12px;color:#94a3b8;">Host [${this.roomCode}] was not reached. Ensure host is online with this code.</span>`;
        }
      }
    }, 8000);

    return true;
  }

  /**
   * Setup PeerJS connection
   */
  initPeer(customId = null) {
    return new Promise((resolve) => {
      const PeerConstructor = window.Peer || (window.peerjs && window.peerjs.Peer);
      if (!PeerConstructor) {
        console.error('PeerJS library not loaded!');
        resolve(null);
        return;
      }

      const options = {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      };

      try {
        if (customId) {
          this.peer = new PeerConstructor(customId, options);
        } else {
          this.peer = new PeerConstructor(options);
        }

        this.peer.on('open', (id) => {
          this.peerId = id;
          console.log('[Multiplayer] Peer connected with ID:', id);
          resolve(this.peer);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('[Multiplayer] PeerJS error:', err);
          resolve(this.peer);
        });
      } catch (e) {
        console.error('Error initializing peer:', e);
        resolve(null);
      }
    });
  }

  /**
   * Connect to Host Peer
   */
  connectToHost(hostPeerId) {
    if (!this.peer) return;
    const conn = this.peer.connect(hostPeerId, {
      metadata: {
        playerName: this.playerName,
        version: '1.0'
      },
      reliable: true
    });
    this.setupConnection(conn);
  }

  /**
   * Configure DataConnection event listeners
   */
  setupConnection(conn) {
    conn.on('open', () => {
      console.log('[Multiplayer] Connected to peer:', conn.peer);
      this.connections.set(conn.peer, conn);

      // Send initial handshake
      conn.send({
        type: 'handshake',
        peerId: this.peerId,
        playerName: this.playerName,
        isModerator: this.isModerator
      });

      // IF HOST: Send complete world state, seed, gameMode, and existing modifications!
      if (this.isHost) {
        const hostSeed = this.engine.seed || (this.engine.world && this.engine.world.seed) || 'vive_realm_seed';
        conn.send({
          type: 'world_sync',
          seed: hostSeed,
          gameMode: this.engine.gameMode || 'story',
          timeOfDay: this.engine.timeOfDay,
          weather: this.engine.weather?.currentWeather || 'clear',
          modifications: this.engine.world?.modifications || {},
          deltas: this.deltas || []
        });

        // Send immediate host player position so guest renders host model immediately
        if (this.engine.player) {
          const pos = this.engine.player.position;
          const lookDir = new THREE.Vector3();
          this.engine.camera.getWorldDirection(lookDir);
          conn.send({
            type: 'player_state',
            peerId: this.peerId,
            playerName: this.playerName,
            isModerator: this.isModerator,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            rotY: Math.atan2(lookDir.x, lookDir.z),
            velocityMag: 0,
            isMining: false,
            isJumping: false,
            heldItem: null
          });
        }
      }

      // Replay all local deltas to peer
      this.syncAllDeltasToPeer(conn);
    });

    conn.on('data', (data) => {
      this.handleNetworkMessage(conn, data);
    });

    conn.on('close', () => {
      console.log('[Multiplayer] Peer disconnected:', conn.peer);
      this.removeRemotePlayer(conn.peer);
      this.connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn('[Multiplayer] Connection error with peer:', conn.peer, err);
      this.removeRemotePlayer(conn.peer);
      this.connections.delete(conn.peer);
    });
  }

  /**
   * Handle incoming network message
   */
  handleNetworkMessage(conn, msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'handshake': {
        const peerKey = msg.peerId || conn.peer;
        const name = msg.playerName || `Player_${peerKey.slice(0, 4)}`;
        const isMod = !!msg.isModerator;
        this.getOrCreateRemotePlayer(peerKey, name, isMod);
        this.receiveChatMessage({
          author: 'SYSTEM',
          isMod: false,
          text: `👋 ${name} joined the realm!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        // If host, reply with host player state immediately
        if (this.isHost && this.engine.player) {
          this.broadcastPlayerState();
          this.relayToOthers(conn.peer, msg);
        }
        break;
      }

      case 'world_sync': {
        if (!this.isHost) {
          console.log('[Multiplayer] Received world_sync from host:', msg);
          if (this.joinTimeout) clearTimeout(this.joinTimeout);

          // 1. Sync seed and gameMode
          this.engine.seed = msg.seed || 'vivecraft';
          this.engine.gameMode = msg.gameMode || 'story';
          if (msg.timeOfDay !== undefined) this.engine.timeOfDay = msg.timeOfDay;

          // Save to saved worlds list
          this.saveToSavedWorlds({
            roomCode: this.roomCode,
            worldName: `Realm ${this.roomCode}`,
            seed: msg.seed,
            gameMode: msg.gameMode,
            isHost: false,
            hostName: 'Host'
          });

          // 2. Start game with HOST'S EXACT SEED
          this.engine.startGame();
          this.engine.updateMultiplayerHUD();

          // 3. Rebind remote players into the new active scene
          this.rebindRemotePlayersToScene();

          // 4. Send immediate player state so host sees guest spawn
          this.broadcastPlayerState();

          if (msg.weather && this.engine.weather) {
            this.engine.weather.setWeather(msg.weather, false);
          }

          // 5. Apply existing block modifications
          if (msg.modifications && this.engine.world) {
            for (const [key, blockId] of Object.entries(msg.modifications)) {
              const [x, y, z] = key.split(',').map(Number);
              this.engine.world._isApplyingRemoteDelta = true;
              this.engine.world.setBlock(x, y, z, blockId, false);
              this.engine.world._isApplyingRemoteDelta = false;
            }
            this.engine.world.generateAroundPlayer();
          }

          // 6. Apply all deltas
          if (Array.isArray(msg.deltas)) {
            msg.deltas.forEach(d => this.applyBlockDelta(d, false));
          }

          // Hide connecting overlay
          const connOverlay = document.getElementById('mp-connecting-overlay');
          if (connOverlay) connOverlay.classList.add('hidden');
        }
        break;
      }

      case 'player_state': {
        const peerKey = msg.peerId || conn.peer;
        const rp = this.getOrCreateRemotePlayer(peerKey, msg.playerName, msg.isModerator);
        if (rp) rp.updateData(msg);

        // If host, relay to other guests so everyone sees everyone in real-time!
        if (this.isHost) {
          this.relayToOthers(conn.peer, msg);
        }
        break;
      }

      case 'block_delta': {
        this.applyBlockDelta(msg.delta, false);
        if (this.isHost) {
          this.relayToOthers(conn.peer, msg);
        }
        break;
      }

      case 'batch_deltas': {
        if (Array.isArray(msg.deltas)) {
          msg.deltas.forEach(d => this.applyBlockDelta(d, false));
        }
        if (this.isHost) {
          this.relayToOthers(conn.peer, msg);
        }
        break;
      }

      case 'chat': {
        this.receiveChatMessage(msg);
        if (this.isHost) {
          this.relayToOthers(conn.peer, msg);
        }
        break;
      }

      case 'admin_command': {
        if (msg.fromModerator) {
          this.executeRemoteAdminCommand(msg.command, msg.args);
        }
        break;
      }

      case 'kick': {
        if (msg.targetPeerId === this.peerId) {
          alert('You have been kicked by the Room Moderator.');
          window.location.reload();
        }
        break;
      }
    }
  }

  /**
   * Get or create RemotePlayer entity with guaranteed active scene attachment
   */
  getOrCreateRemotePlayer(peerId, name, isMod) {
    if (!this.remotePlayers.has(peerId)) {
      const rp = new RemotePlayer(peerId, name, isMod, this.engine.scene);
      this.remotePlayers.set(peerId, rp);
    }
    const rp = this.remotePlayers.get(peerId);
    if (this.engine && this.engine.scene && rp) {
      rp.scene = this.engine.scene;
      if (rp.model && rp.model.mesh && rp.model.mesh.parent !== this.engine.scene) {
        this.engine.scene.add(rp.model.mesh);
      }
    }
    return rp;
  }

  /**
   * Rebind all remote player meshes to the engine scene (called after startGame clears scene)
   */
  rebindRemotePlayersToScene() {
    if (!this.engine || !this.engine.scene) return;
    for (const rp of this.remotePlayers.values()) {
      rp.scene = this.engine.scene;
      if (rp.model && rp.model.mesh) {
        if (rp.model.mesh.parent !== this.engine.scene) {
          this.engine.scene.add(rp.model.mesh);
        }
      }
    }
  }

  /**
   * Relay packet from host to all other connected peers (star-mesh topology)
   */
  relayToOthers(senderPeerId, data) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== senderPeerId && conn && conn.open) {
        try {
          conn.send(data);
        } catch (e) {
          console.warn('Error relaying packet to peer:', peerId, e);
        }
      }
    }
  }

  removeRemotePlayer(peerId) {
    const rp = this.remotePlayers.get(peerId);
    if (rp) {
      rp.dispose();
      this.remotePlayers.delete(peerId);
      this.receiveChatMessage({
        author: 'SYSTEM',
        isMod: false,
        text: `🚪 ${rp.name} left the realm.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }

  /**
   * Broadcast local player position, camera orientation, and held item
   */
  broadcastPlayerState() {
    if (!this.isMultiplayer || this.connections.size === 0) return;
    if (!this.engine.player) return;

    const pos = this.engine.player.position;
    const lookDir = new THREE.Vector3();
    this.engine.camera.getWorldDirection(lookDir);
    const rotY = Math.atan2(lookDir.x, lookDir.z);

    const vel = this.engine.player.velocity;
    const velMag = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const activeItem = this.engine.inventory?.hotbar[this.engine.player.selectedHotbarIndex];

    const state = {
      type: 'player_state',
      peerId: this.peerId,
      playerName: this.playerName,
      isModerator: this.isModerator,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rotY: rotY,
      velocityMag: velMag,
      isMining: this.engine.player.isMining,
      isJumping: !this.engine.player.onGround && !this.engine.player.isFlying,
      heldItem: activeItem ? activeItem.id : null
    };

    this.broadcast(state);
  }

  /**
   * Called when a block is placed or broken locally
   */
  onLocalBlockChange(x, y, z, blockId, oldBlock) {
    if (!this.isMultiplayer && !this.roomCode) return;

    const delta = {
      id: `${this.roomCode}_${x}_${y}_${z}_${Date.now()}`,
      roomCode: this.roomCode,
      worldId: this.worldId,
      timestamp: Date.now(),
      author: this.playerName,
      x: x,
      y: y,
      z: z,
      block: blockId,
      oldBlock: oldBlock
    };

    // Store delta locally in memory and IndexedDB/localStorage
    this.saveDeltaLocally(delta);

    // Broadcast to connected peers in real-time
    this.broadcast({
      type: 'block_delta',
      delta: delta
    });
  }

  /**
   * Apply an incoming block delta
   */
  applyBlockDelta(delta, isFromSelf = false) {
    if (!delta || !delta.id) return;
    if (this.appliedDeltaIds.has(delta.id)) return;

    this.appliedDeltaIds.add(delta.id);
    this.deltas.push(delta);

    if (!isFromSelf && this.engine.world) {
      this.engine.world._isApplyingRemoteDelta = true;
      this.engine.world.setBlock(delta.x, delta.y, delta.z, delta.block, true);
      this.engine.world._isApplyingRemoteDelta = false;
    }

    this.saveDeltaLocally(delta);
  }

  /**
   * Persist delta in IndexedDB and LocalStorage mirror
   */
  saveDeltaLocally(delta) {
    // 1. IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction('deltas', 'readwrite');
        const store = tx.objectStore('deltas');
        store.put(delta);
      } catch (e) {
        // Fallback
      }
    }

    // 2. LocalStorage mirror for instant synchronous persistence
    try {
      const key = `vivecraft_deltas_${this.roomCode}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list.some(d => d.id === delta.id)) {
        list.push(delta);
        localStorage.setItem(key, JSON.stringify(list.slice(-500))); // Keep latest 500 deltas
      }
    } catch (e) {
      // Ignore storage quota
    }
  }

  /**
   * Load local stored deltas for offline sync
   */
  loadStoredRoomDeltas(roomCode) {
    // 1. First from LocalStorage mirror (synchronous)
    try {
      const key = `vivecraft_deltas_${roomCode}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.forEach(d => this.applyBlockDelta(d, false));
    } catch (e) {}

    // 2. Then from IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction('deltas', 'readonly');
        const store = tx.objectStore('deltas');
        const index = store.index('roomCode');
        const req = index.getAll(roomCode);
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => a.timestamp - b.timestamp);
          list.forEach(d => this.applyBlockDelta(d, false));
          console.log(`[Multiplayer] Loaded ${list.length} stored deltas for room ${roomCode}`);
        };
      } catch (e) {
        console.warn('Error loading room deltas from IndexedDB:', e);
      }
    }
  }

  /**
   * Sync all stored deltas to a newly connected peer
   */
  syncAllDeltasToPeer(conn) {
    if (this.deltas.length > 0) {
      conn.send({
        type: 'batch_deltas',
        deltas: this.deltas
      });
    }
  }

  /**
   * Send a chat message
   */
  sendChatMessage(text) {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Check if message is an admin command
    if (cleanText.startsWith('/')) {
      this.handleChatAdminCommand(cleanText);
      return;
    }

    const msg = {
      type: 'chat',
      author: this.playerName,
      isMod: this.isModerator,
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.receiveChatMessage(msg);
    this.broadcast(msg);
  }

  /**
   * Handle admin command from chat
   */
  handleChatAdminCommand(cmdStr) {
    const parts = cmdStr.substring(1).split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (!this.isModerator) {
      this.receiveChatMessage({
        author: 'SYSTEM',
        isMod: true,
        text: '❌ Only Room Moderators have permission to use admin commands!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      return;
    }

    // Execute locally
    this.executeRemoteAdminCommand(cmd, args);

    // Broadcast to peers
    this.broadcast({
      type: 'admin_command',
      fromModerator: true,
      command: cmd,
      args: args
    });

    this.receiveChatMessage({
      author: 'SYSTEM',
      isMod: true,
      text: `👑 MOD executed: /${cmd} ${args.join(' ')}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  executeRemoteAdminCommand(cmd, args) {
    switch (cmd) {
      case 'time': {
        const sub = args[0]?.toLowerCase() || 'day';
        if (sub === 'day') this.engine.timeOfDay = 6000;
        else if (sub === 'noon') this.engine.timeOfDay = 6000;
        else if (sub === 'sunset') this.engine.timeOfDay = 12000;
        else if (sub === 'night') this.engine.timeOfDay = 18000;
        else if (!isNaN(Number(sub))) this.engine.timeOfDay = Number(sub);
        break;
      }
      case 'weather': {
        const sub = args[0]?.toLowerCase() || 'clear';
        if (this.engine.weather) {
          this.engine.weather.setWeather(sub, true);
        }
        break;
      }
      case 'tp': {
        if (args.length >= 3) {
          const x = parseFloat(args[0]);
          const y = parseFloat(args[1]);
          const z = parseFloat(args[2]);
          if (this.engine.player) this.engine.player.position.set(x, y, z);
        }
        break;
      }
      case 'gamemode': {
        const mode = args[0]?.toLowerCase();
        if (mode === 'creative' || mode === 'c' || mode === '1') {
          this.engine.gameMode = 'creative';
          if (this.engine.player) this.engine.player.isFlying = true;
        } else {
          this.engine.gameMode = 'story';
          if (this.engine.player) this.engine.player.isFlying = false;
        }
        break;
      }
      case 'kick': {
        if (this.isHost && args[0]) {
          const targetName = args[0].toLowerCase();
          for (const [peerId, rp] of this.remotePlayers.entries()) {
            if (rp.name.toLowerCase() === targetName) {
              this.broadcast({
                type: 'kick',
                targetPeerId: peerId
              });
              this.removeRemotePlayer(peerId);
              break;
            }
          }
        }
        break;
      }
    }
  }

  /**
   * Receive chat message and trigger SmartWatch notifications
   */
  receiveChatMessage(msg) {
    this.chatHistory.push(msg);

    // Safe invocation: checks that onReceiveChatMessage is a function
    if (this.engine.smartwatch && typeof this.engine.smartwatch.onReceiveChatMessage === 'function') {
      this.engine.smartwatch.onReceiveChatMessage(msg);
    }
  }

  /**
   * Send network packet to all active peers
   */
  broadcast(data) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (conn.open) {
        try {
          conn.send(data);
        } catch (e) {
          console.warn('Error broadcasting to peer:', peerId, e);
        }
      }
    }
  }

  /**
   * Update loop called by Engine.animate()
   */
  update(delta) {
    if (!this.isMultiplayer) return;

    // Update all remote players
    for (const rp of this.remotePlayers.values()) {
      rp.update(delta);
    }

    // Rate-limited position broadcasting
    this.syncTimer += delta;
    if (this.syncTimer >= this.broadcastRate) {
      this.syncTimer = 0;
      this.broadcastPlayerState();
    }
  }
}
