import { BLOCK } from './world.js';

// SVG icons for all items/blocks
export const ITEM_SVGS = {
  grass_block: `<svg viewBox="0 0 16 16"><path fill="#5c8e32" d="M1 1h14v5H1z"/><path fill="#866043" d="M1 6h14v9H1z"/><path fill="#70ab3e" d="M3 5h2v3H3zm8 0h3v2h-3z"/></svg>`,
  dirt: `<svg viewBox="0 0 16 16"><path fill="#866043" d="M0 0h16v16H0z"/><path fill="#573d26" d="M2 2h2v2H2zm8 8h2v2h-2zm-6 4h2v2H4z"/></svg>`,
  stone: `<svg viewBox="0 0 16 16"><path fill="#7c7c7c" d="M0 0h16v16H0z"/><path fill="#525252" d="M1 1h2v2H1zm10 8h3v2h-3z"/></svg>`,
  cobblestone: `<svg viewBox="0 0 16 16"><path fill="#757575" d="M0 0h16v16H0z"/><path fill="#3a3a3a" d="M0 0h16v2H0zm0 6h16v2H0zm0 6h16v2H0z"/></svg>`,
  wood_log: `<svg viewBox="0 0 16 16"><path fill="#5c4033" d="M0 0h16v16H0z"/><path fill="#dfbe9f" d="M4 4h8v8H4z"/></svg>`,
  leaves: `<svg viewBox="0 0 16 16"><path fill="#1b4d18" d="M0 0h16v16H0z"/><path fill="#286f24" d="M2 1h3v2H2zm8 8h3v3h-3z"/></svg>`,
  sand: `<svg viewBox="0 0 16 16"><path fill="#dfd59f" d="M0 0h16v16H0z"/><path fill="#cfc38c" d="M1 4h2v2H1zm10 8h2v2h-2z"/></svg>`,
  water: `<svg viewBox="0 0 16 16"><path fill="#4070da" d="M0 0h16v16H0z"/><path fill="#70a0ff" d="M1 3h5v2H1zm8 8h6v2H9z"/></svg>`,
  glass: `<svg viewBox="0 0 16 16"><path fill="rgba(255,255,255,0.2)" d="M0 0h16v16H0z"/><rect x="0" y="0" width="16" height="16" fill="none" stroke="#fff" stroke-width="2"/><line x1="3" y1="13" x2="13" y2="3" stroke="#fff" stroke-width="2"/></svg>`,
  crafting_table: `<svg viewBox="0 0 16 16"><path fill="#ab7a4e" d="M0 0h16v16H0z"/><rect x="2" y="2" width="12" height="12" fill="none" stroke="#3d2511" stroke-width="2"/></svg>`,
  chest: `<svg viewBox="0 0 16 16"><path fill="#7a4e2b" d="M0 0h16v16H0z"/><rect x="1" y="1" width="14" height="14" fill="none" stroke="#3a210d" stroke-width="2"/><rect x="7" y="6" width="2" height="4" fill="#ccc"/></svg>`,
  wooden_planks: `<svg viewBox="0 0 16 16"><path fill="#ab7a4e" d="M0 0h16v16H0z"/><path fill="#3d2511" d="M0 4h16v2H0zm0 6h16v2H0z"/></svg>`,
  bed: `<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="12" rx="1" fill="#ab7a4e"/><rect x="1" y="2" width="14" height="8" rx="1" fill="#cc2222"/><rect x="3" y="3" width="10" height="3" fill="#fff"/></svg>`,
  
  // Custom Items
  stick: `<svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2" stroke="#8b5a2b" stroke-width="2"/></svg>`,
  emerald: `<svg viewBox="0 0 16 16"><path fill="#17ff57" d="M8 1L2 6v4l6 5l6-5V6z"/><path fill="#84ffa6" d="M6 5h4v6H6z"/></svg>`,
  wheat: `<svg viewBox="0 0 16 16"><path fill="#e1c15c" d="M8 14V3m0 0l-3 3m3-3l3 3m-3 4l-4 3m4-3l4 3" stroke="#e1c15c" stroke-width="2"/></svg>`,
  bread: `<svg viewBox="0 0 16 16"><path fill="#b8860b" d="M2 6C2 4 4 3 8 3s6 1 6 3v4c0 2-2 3-6 3S2 12 2 10z"/><path fill="#e5c19e" d="M4 6h8v2H4z"/></svg>`,
  iron_ingot: `<svg viewBox="0 0 16 16"><path fill="#eaeaea" d="M3 5l2-2h8l-2 2z"/><path fill="#b0b0b0" d="M3 5l8 8h2l-2-2z" stroke="#808080"/></svg>`,
  
  // Tools
  iron_pickaxe: `<svg viewBox="0 0 16 16"><path fill="#eaeaea" d="M2 1c4 0 7 1 9 4l-2 2c-2-2-4-3-7-3z"/><line x1="2" y1="14" x2="8" y2="8" stroke="#8b5a2b" stroke-width="2"/></svg>`,
  iron_axe: `<svg viewBox="0 0 16 16"><path fill="#eaeaea" d="M4 1h5v4H4zm3 4h2v2H7z"/><line x1="2" y1="14" x2="6" y2="8" stroke="#8b5a2b" stroke-width="2"/></svg>`,
  iron_sword: `<svg viewBox="0 0 16 16"><path fill="#eaeaea" d="M5 2l9 9l-2 2L3 4z"/><rect x="2" y="12" width="2" height="2" fill="#ffd700"/><line x1="0" y1="16" x2="2" y2="14" stroke="#8b5a2b" stroke-width="2"/></svg>`,
  
  // Cherry Blossom & Floral Items
  cherry_leaves: `<svg viewBox="0 0 16 16"><path fill="#ffb7d5" d="M0 0h16v16H0z"/><path fill="#ffccd5" d="M2 1h3v2H2zm8 8h3v3h-3z"/></svg>`,
  cherry_log: `<svg viewBox="0 0 16 16"><path fill="#4a2711" d="M0 0h16v16H0z"/><path fill="#ffd1dc" d="M4 4h8v8H4z"/></svg>`,
  red_flower: `<svg viewBox="0 0 16 16"><path fill="none" stroke="#2e7d32" stroke-width="2" d="M8 15V7"/><path fill="#d32f2f" d="M6 3h4v4H6z"/><circle cx="8" cy="5" r="1.5" fill="#ffeb3b"/></svg>`,
  yellow_flower: `<svg viewBox="0 0 16 16"><path fill="none" stroke="#2e7d32" stroke-width="2" d="M8 15V7"/><path fill="#fbc02d" d="M6 3h4v4H6z"/><circle cx="8" cy="5" r="1.5" fill="#f57c00"/></svg>`,
  blue_flower: `<svg viewBox="0 0 16 16"><path fill="none" stroke="#2e7d32" stroke-width="2" d="M8 15V7"/><path fill="#1976d2" d="M6 3h4v4H6z"/><circle cx="8" cy="5" r="1.5" fill="#ffeb3b"/></svg>`,
  pink_flower: `<svg viewBox="0 0 16 16"><path fill="none" stroke="#2e7d32" stroke-width="2" d="M8 15V7"/><path fill="#ec407a" d="M6 3h4v4H6z"/><circle cx="8" cy="5" r="1.5" fill="#ffeb3b"/></svg>`,
  torch: `<svg viewBox="0 0 16 16"><rect x="7" y="6" width="2" height="8" fill="#8b5a2b"/><rect x="6" y="2" width="4" height="4" fill="#ff7700"/><rect x="7" y="3" width="2" height="2" fill="#ffcc00"/></svg>`,
  raw_mutton: `<svg viewBox="0 0 16 16"><path fill="#f5b8a9" d="M3 4c1-2 4-2 6-1s4 3 4 5v2H5v-2l-2-4z"/><rect x="1" y="9" width="3" height="2" fill="#ffffff"/></svg>`,
  cooked_mutton: `<svg viewBox="0 0 16 16"><path fill="#8a4f3b" d="M3 4c1-2 4-2 6-1s4 3 4 5v2H5v-2l-2-4z"/><rect x="1" y="9" width="3" height="2" fill="#dddddd"/></svg>`,
  raw_beef: `<svg viewBox="0 0 16 16"><path fill="#d9544c" d="M2 3h12v7H2z"/><rect x="4" y="5" width="4" height="3" fill="#ffeedd"/></svg>`,
  cooked_beef: `<svg viewBox="0 0 16 16"><path fill="#693b32" d="M2 3h12v7H2z"/><rect x="4" y="5" width="4" height="3" fill="#ddbb99"/></svg>`,
  raw_chicken: `<svg viewBox="0 0 16 16"><path fill="#ffddcc" d="M4 6c0-2 2-4 4-4s4 2 4 4v5H4z"/><rect x="6" y="11" width="4" height="3" fill="#ffbb99"/></svg>`,
  cooked_chicken: `<svg viewBox="0 0 16 16"><path fill="#b36239" d="M4 6c0-2 2-4 4-4s4 2 4 4v5H4z"/><rect x="6" y="11" width="4" height="3" fill="#803300"/></svg>`,
  rotten_flesh: `<svg viewBox="0 0 16 16"><path fill="#6b8e23" d="M2 4h12v8H2z"/><path fill="#8b0000" d="M4 6h3v3H4z"/></svg>`,
  bone: `<svg viewBox="0 0 16 16"><rect x="3" y="6" width="10" height="4" fill="#ffffff"/><circle cx="3" cy="5" r="2" fill="#ffffff"/><circle cx="3" cy="11" r="2" fill="#ffffff"/><circle cx="13" cy="5" r="2" fill="#ffffff"/><circle cx="13" cy="11" r="2" fill="#ffffff"/></svg>`,
  arrow: `<svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="11" y2="5" stroke="#8b5a2b" stroke-width="2"/><path fill="#eaeaea" d="M11 5l3-3l-1 4z"/><path fill="#999" d="M2 14l-1 1l1-2z"/></svg>`,
  string: `<svg viewBox="0 0 16 16"><path fill="none" stroke="#eaeaea" stroke-width="1.5" d="M2 2c4 4-2 8 6 6s8-4 6 6"/></svg>`,
  tnt: `<svg viewBox="0 0 16 16"><rect x="0" y="0" width="16" height="16" fill="#d32f2f"/><rect x="0" y="5" width="16" height="6" fill="#ffffff"/><text x="8" y="10" font-size="5" font-family="sans-serif" font-weight="bold" fill="#000" text-anchor="middle">TNT</text></svg>`,
  redstone_wire: `<svg viewBox="0 0 16 16"><path fill="none" stroke="#ff2222" stroke-width="3" d="M1 8h14M8 1v14"/><circle cx="8" cy="8" r="3" fill="#ff5555"/></svg>`,
  lever: `<svg viewBox="0 0 16 16"><rect x="4" y="11" width="8" height="4" fill="#757575"/><line x1="8" y1="11" x2="12" y2="3" stroke="#8b5a2b" stroke-width="2.5"/><circle cx="12" cy="3" r="1.5" fill="#333333"/></svg>`,
  button: `<svg viewBox="0 0 16 16"><rect x="4" y="5" width="8" height="6" fill="#999999" stroke="#555555" stroke-width="1"/></svg>`,
  spawn_egg_zombie: `<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="5" ry="6" fill="#17c43d"/><circle cx="6" cy="7" r="1" fill="#003300"/><circle cx="10" cy="11" r="1" fill="#003300"/></svg>`,
  spawn_egg_skeleton: `<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="5" ry="6" fill="#dddddd"/><circle cx="6" cy="7" r="1" fill="#444444"/><circle cx="10" cy="11" r="1" fill="#444444"/></svg>`,
  spawn_egg_spider: `<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="5" ry="6" fill="#1f1f1f"/><circle cx="6" cy="7" r="1" fill="#ee2222"/><circle cx="10" cy="11" r="1" fill="#ee2222"/></svg>`,
  spawn_egg_cow: `<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="5" ry="6" fill="#5c4033"/><circle cx="6" cy="7" r="1.5" fill="#ffffff"/><circle cx="10" cy="11" r="1.5" fill="#ffffff"/></svg>`,
  spawn_egg_sheep: `<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="5" ry="6" fill="#ffffff"/><circle cx="6" cy="7" r="1" fill="#e5c19e"/><circle cx="10" cy="11" r="1" fill="#e5c19e"/></svg>`,
  spawn_egg_chicken: `<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="5" ry="6" fill="#ffffea"/><circle cx="6" cy="7" r="1" fill="#ffaa00"/><circle cx="10" cy="11" r="1" fill="#ff2222"/></svg>`,
  wool: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" fill="#fafafa" stroke="#d0d0d0" stroke-width="1.5"/><circle cx="5" cy="5" r="2" fill="#eaeaea"/><circle cx="11" cy="11" r="2" fill="#eaeaea"/></svg>`,
  mystic_book: `<svg viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" rx="2" fill="#4a154b" stroke="#ffd700" stroke-width="1.5"/><rect x="4" y="3" width="8" height="10" fill="#fff8e7"/><circle cx="8" cy="8" r="2.5" fill="#ff0055"/><path fill="#ffd700" d="M6 6h4v4H6z"/></svg>`
};

export const ITEM_DEFS = {
  grass_block: { name: 'Grass Block', maxStack: 64 },
  dirt: { name: 'Dirt', maxStack: 64 },
  stone: { name: 'Stone', maxStack: 64 },
  cobblestone: { name: 'Cobblestone', maxStack: 64 },
  wood_log: { name: 'Wood Log', maxStack: 64 },
  leaves: { name: 'Leaves', maxStack: 64 },
  sand: { name: 'Sand', maxStack: 64 },
  water: { name: 'Water', maxStack: 64 },
  glass: { name: 'Glass', maxStack: 64 },
  crafting_table: { name: 'Crafting Table', maxStack: 64 },
  chest: { name: 'Chest', maxStack: 64 },
  wooden_planks: { name: 'Wooden Planks', maxStack: 64 },
  bed: { name: 'Bed', maxStack: 64 },
  
  cherry_leaves: { name: 'Cherry Leaves', maxStack: 64 },
  cherry_log: { name: 'Cherry Log', maxStack: 64 },
  red_flower: { name: 'Red Flower', maxStack: 64 },
  yellow_flower: { name: 'Yellow Flower', maxStack: 64 },
  blue_flower: { name: 'Blue Flower', maxStack: 64 },
  pink_flower: { name: 'Pink Flower', maxStack: 64 },
  
  stick: { name: 'Stick', maxStack: 64 },
  emerald: { name: 'Emerald', maxStack: 64 },
  wheat: { name: 'Wheat', maxStack: 64 },
  bread: { name: 'Bread', maxStack: 64 },
  iron_ingot: { name: 'Iron Ingot', maxStack: 64 },
  
  iron_pickaxe: { name: 'Iron Pickaxe', maxStack: 1 },
  iron_axe: { name: 'Iron Axe', maxStack: 1 },
  iron_sword: { name: 'Iron Sword', maxStack: 1 },
  torch: { name: 'Torch', maxStack: 64 },
  raw_mutton: { name: 'Raw Mutton', maxStack: 64 },
  cooked_mutton: { name: 'Cooked Mutton', maxStack: 64 },
  raw_beef: { name: 'Raw Beef', maxStack: 64 },
  cooked_beef: { name: 'Cooked Beef/Steak', maxStack: 64 },
  raw_chicken: { name: 'Raw Chicken', maxStack: 64 },
  cooked_chicken: { name: 'Cooked Chicken', maxStack: 64 },
  rotten_flesh: { name: 'Rotten Flesh', maxStack: 64 },
  bone: { name: 'Bone', maxStack: 64 },
  arrow: { name: 'Arrow', maxStack: 64 },
  string: { name: 'String', maxStack: 64 },
  tnt: { name: 'TNT', maxStack: 64 },
  redstone_wire: { name: 'Redstone Dust', maxStack: 64 },
  lever: { name: 'Lever', maxStack: 64 },
  button: { name: 'Button', maxStack: 64 },
  spawn_egg_zombie: { name: 'Zombie Spawn Egg', maxStack: 64 },
  spawn_egg_skeleton: { name: 'Skeleton Spawn Egg', maxStack: 64 },
  spawn_egg_spider: { name: 'Spider Spawn Egg', maxStack: 64 },
  spawn_egg_cow: { name: 'Cow Spawn Egg', maxStack: 64 },
  spawn_egg_sheep: { name: 'Sheep Spawn Egg', maxStack: 64 },
  spawn_egg_chicken: { name: 'Chicken Spawn Egg', maxStack: 64 },
  wool: { name: 'White Wool', maxStack: 64 },
  mystic_book: { name: 'Mystic Book of Return', maxStack: 1 }
};

export class InventoryManager {
  constructor(engine) {
    this.engine = engine;

    // Player inventory state
    this.storage = new Array(27).fill(null);
    this.hotbar = new Array(9).fill(null);
    
    // Active workstation states
    this.craft2In = new Array(4).fill(null);
    this.craft2Out = null;
    
    this.craft3In = new Array(9).fill(null);
    this.craft3Out = null;

    this.chests = new Map(); // Coordinates key 'x,y,z' -> Array(27)
    this.activeChestCoords = null; // Key pointer

    this.activeVillager = null; // Mob pointer
    this.selectedTradeIndex = 0;
    this.tradeIn1 = null;
    this.tradeIn2 = null;
    this.tradeOut = null;

    // Dragged item state (cursor tracker)
    this.cursorItem = null; // { id, count }

    if (this.engine.gameMode === 'creative') {
      this.initCreativeHotbar();
    }
    this.initInventoryUIEvents();
  }

  // Gives player default block items in Creative mode
  initCreativeHotbar() {
    const defaultBlocks = [
      'grass_block', 'dirt', 'stone', 'wood_log', 'leaves', 'sand', 'glass', 'crafting_table', 'chest'
    ];
    for (let i = 0; i < 9; i++) {
      this.hotbar[i] = { id: defaultBlocks[i], count: 64 };
    }
  }

  // Bind mouse clicks to UI grid slots
  initInventoryUIEvents() {
    // Single delegated click handler for UI grid interactions
    document.getElementById('ui-screen').addEventListener('mousedown', (e) => {
      const slotElement = e.target.closest('.slot');
      if (!slotElement) return;

      const slotType = slotElement.dataset.slot;
      const rightClick = e.button === 2;

      this.handleSlotInteraction(slotType, slotElement, rightClick);
      this.renderAll();
    });

    // Disable default browser context menus on right clicking slots
    document.getElementById('ui-screen').addEventListener('contextmenu', (e) => e.preventDefault());

    // Dragged cursor movement updates
    window.addEventListener('mousemove', (e) => {
      const dragDiv = document.getElementById('dragged-item');
      if (this.cursorItem) {
        dragDiv.classList.remove('hidden');
        dragDiv.style.left = `${e.clientX}px`;
        dragDiv.style.top = `${e.clientY}px`;
      } else {
        dragDiv.classList.add('hidden');
      }
    });

    // Hover tooltip handlers
    document.getElementById('ui-screen').addEventListener('mouseover', (e) => {
      const slotElement = e.target.closest('.slot');
      if (slotElement) {
        const item = this.getSlotItem(slotElement.dataset.slot);
        if (item) {
          const tooltip = document.getElementById('tooltip');
          tooltip.textContent = ITEM_DEFS[item.id]?.name || item.id;
          tooltip.classList.remove('hidden');
          
          // Position tooltip above slot
          const rect = slotElement.getBoundingClientRect();
          tooltip.style.left = `${rect.left + 10}px`;
          tooltip.style.top = `${rect.top - 35}px`;
        }
      }
    });

    document.getElementById('ui-screen').addEventListener('mouseout', (e) => {
      if (e.target.closest('.slot')) {
        document.getElementById('tooltip').classList.add('hidden');
      }
    });

    // Bind trading execute button
    document.getElementById('btn-trade-execute').addEventListener('click', () => {
      this.executeActiveTrade();
    });
  }

  // Add item to inventory (returns remaining count)
  addItem(itemId, count) {
    const maxStack = ITEM_DEFS[itemId]?.maxStack || 64;

    // 1. Try to stack in hotbar
    for (let i = 0; i < 9; i++) {
      if (this.hotbar[i] && this.hotbar[i].id === itemId && this.hotbar[i].count < maxStack) {
        const space = maxStack - this.hotbar[i].count;
        const add = Math.min(space, count);
        this.hotbar[i].count += add;
        count -= add;
        if (count <= 0) { this.renderAll(); return 0; }
      }
    }

    // 2. Try to stack in main storage
    for (let i = 0; i < 27; i++) {
      if (this.storage[i] && this.storage[i].id === itemId && this.storage[i].count < maxStack) {
        const space = maxStack - this.storage[i].count;
        const add = Math.min(space, count);
        this.storage[i].count += add;
        count -= add;
        if (count <= 0) { this.renderAll(); return 0; }
      }
    }

    // 3. Try to place in empty hotbar slot
    for (let i = 0; i < 9; i++) {
      if (!this.hotbar[i]) {
        const add = Math.min(maxStack, count);
        this.hotbar[i] = { id: itemId, count: add };
        count -= add;
        if (count <= 0) { this.renderAll(); return 0; }
      }
    }

    // 4. Try to place in empty storage slot
    for (let i = 0; i < 27; i++) {
      if (!this.storage[i]) {
        const add = Math.min(maxStack, count);
        this.storage[i] = { id: itemId, count: add };
        count -= add;
        if (count <= 0) { this.renderAll(); return 0; }
      }
    }

    this.renderAll();
    return count;
  }

  removeHotbarItem(index, count) {
    if (this.hotbar[index]) {
      this.hotbar[index].count -= count;
      if (this.hotbar[index].count <= 0) {
        this.hotbar[index] = null;
      }
      this.renderAll();
    }
  }

  // Click handler to swap items or split stacks
  handleSlotInteraction(slotType, slotElement, rightClick) {
    // 1. Creative Palette Slots (infinite items picker)
    if (slotType.startsWith('creative-tile-')) {
      const itemId = slotType.replace('creative-tile-', '');
      if (rightClick) {
        this.cursorItem = null;
      } else {
        this.cursorItem = { id: itemId, count: ITEM_DEFS[itemId]?.maxStack || 64 };
      }
      return;
    }

    // Determine target item reference based on slotType
    let slotRef = this.getSlotRef(slotType);
    if (!slotRef) return;

    const currentItem = slotRef.container[slotRef.index];

    // 2. Special Out Slots (Crafting output, Trading output)
    if (slotType === 'craft2-out' || slotType === 'craft3-out') {
      if (currentItem && !rightClick) {
        // Collect crafted item to cursor if empty, or matching stack
        if (!this.cursorItem) {
          this.cursorItem = { ...currentItem };
          slotRef.container[slotRef.index] = null;
          this.consumeCraftingIngredients(slotType === 'craft2-out' ? 2 : 3);
        } else if (this.cursorItem.id === currentItem.id && this.cursorItem.count + currentItem.count <= (ITEM_DEFS[currentItem.id]?.maxStack || 64)) {
          this.cursorItem.count += currentItem.count;
          slotRef.container[slotRef.index] = null;
          this.consumeCraftingIngredients(slotType === 'craft2-out' ? 2 : 3);
        }
      }
      return;
    }

    if (slotType === 'trade-out') {
      if (currentItem && !rightClick && !this.cursorItem) {
        // Collect trade
        this.cursorItem = { ...currentItem };
        slotRef.container[slotRef.index] = null;
        
        // Consume visual inputs
        if (this.tradeIn1) this.tradeIn1 = null;
        if (this.tradeIn2) this.tradeIn2 = null;
      }
      return;
    }

    // 3. Normal slots (swap/place/split)
    if (!this.cursorItem) {
      // Pick up item from slot
      if (currentItem) {
        if (rightClick && currentItem.count > 1) {
          // Right click split half
          const half = Math.floor(currentItem.count / 2);
          this.cursorItem = { id: currentItem.id, count: currentItem.count - half };
          currentItem.count = half;
        } else {
          // Left click pick up all
          this.cursorItem = currentItem;
          slotRef.container[slotRef.index] = null;
        }
      }
    } else {
      // Place item down
      if (!currentItem) {
        if (rightClick) {
          // Drop 1
          slotRef.container[slotRef.index] = { id: this.cursorItem.id, count: 1 };
          this.cursorItem.count--;
          if (this.cursorItem.count <= 0) this.cursorItem = null;
        } else {
          // Place all
          slotRef.container[slotRef.index] = this.cursorItem;
          this.cursorItem = null;
        }
      } else if (currentItem.id === this.cursorItem.id) {
        const maxStack = ITEM_DEFS[currentItem.id]?.maxStack || 64;
        if (rightClick) {
          // Place 1 if fits
          if (currentItem.count < maxStack) {
            currentItem.count++;
            this.cursorItem.count--;
            if (this.cursorItem.count <= 0) this.cursorItem = null;
          }
        } else {
          // Stack them
          const space = maxStack - currentItem.count;
          const add = Math.min(space, this.cursorItem.count);
          currentItem.count += add;
          this.cursorItem.count -= add;
          if (this.cursorItem.count <= 0) this.cursorItem = null;
        }
      } else {
        // Swap slots (only if left click)
        if (!rightClick) {
          const temp = currentItem;
          slotRef.container[slotRef.index] = this.cursorItem;
          this.cursorItem = temp;
        }
      }
    }

    // Trigger crafting recalculations
    if (slotType.startsWith('craft2-in-')) this.checkCrafting2();
    if (slotType.startsWith('craft3-in-')) this.checkCrafting3();
  }

  // Resolves slot coordinates maps
  getSlotRef(slotType) {
    if (slotType.startsWith('storage-')) {
      const idx = parseInt(slotType.replace('storage-', ''));
      return { container: this.storage, index: idx };
    }
    if (slotType.startsWith('hotbar-')) {
      const idx = parseInt(slotType.replace('hotbar-', ''));
      return { container: this.hotbar, index: idx };
    }
    if (slotType.startsWith('craft2-in-')) {
      const idx = parseInt(slotType.replace('craft2-in-', ''));
      return { container: this.craft2In, index: idx };
    }
    if (slotType === 'craft2-out') {
      return { container: this, index: 'craft2Out' };
    }
    if (slotType.startsWith('craft3-in-')) {
      const idx = parseInt(slotType.replace('craft3-in-', ''));
      return { container: this.craft3In, index: idx };
    }
    if (slotType === 'craft3-out') {
      return { container: this, index: 'craft3Out' };
    }
    if (slotType.startsWith('chest-tile-')) {
      const idx = parseInt(slotType.replace('chest-tile-', ''));
      const chestItems = this.chests.get(this.activeChestCoords);
      if (chestItems) return { container: chestItems, index: idx };
    }
    if (slotType === 'trade-in-1') {
      return { container: this, index: 'tradeIn1' };
    }
    if (slotType === 'trade-in-2') {
      return { container: this, index: 'tradeIn2' };
    }
    if (slotType === 'trade-out') {
      return { container: this, index: 'tradeOut' };
    }
    return null;
  }

  getSlotItem(slotType) {
    const ref = this.getSlotRef(slotType);
    if (!ref) {
      if (slotType.startsWith('creative-tile-')) {
        return { id: slotType.replace('creative-tile-', ''), count: 1 };
      }
      return null;
    }
    return ref.container[ref.index];
  }

  // 2x2 Crafting Grid Checks
  checkCrafting2() {
    const grid = this.craft2In;
    let result = null;
    const items = grid.map(i => i?.id || null);
    const nonNullItems = items.filter(i => i !== null);
    const nonNullCount = nonNullItems.length;

    // 1. Wood log -> Planks
    const woodIdx = items.findIndex(id => id === 'wood_log' || id === 'cherry_log');
    if (woodIdx !== -1 && nonNullCount === 1) {
      result = { id: 'wooden_planks', count: 4 };
    }
    
    // 2. Vertical planks -> Sticks
    if (!result) {
      if ((items[0] === 'wooden_planks' && items[2] === 'wooden_planks' && items[1] === null && items[3] === null) ||
          (items[1] === 'wooden_planks' && items[3] === 'wooden_planks' && items[0] === null && items[2] === null)) {
        result = { id: 'stick', count: 4 };
      }
    }

    // 3. 2x2 planks -> Crafting table
    if (!result) {
      if (items.every(i => i === 'wooden_planks')) {
        result = { id: 'crafting_table', count: 1 };
      }
    }

    // 4. Torch: stick bottom, wood log/planks top
    if (!result) {
      if ((items[0] === 'wood_log' && items[2] === 'stick' && items[1] === null && items[3] === null) ||
          (items[1] === 'wood_log' && items[3] === 'stick' && items[0] === null && items[2] === null) ||
          (items[0] === 'wooden_planks' && items[2] === 'stick' && items[1] === null && items[3] === null) ||
          (items[1] === 'wooden_planks' && items[3] === 'stick' && items[0] === null && items[2] === null)) {
        result = { id: 'torch', count: 4 };
      }
    }

    // 5. Cooking raw meat with torch
    if (!result && nonNullCount === 2) {
      const hasTorch = nonNullItems.includes('torch');
      if (hasTorch) {
        if (nonNullItems.includes('raw_beef')) result = { id: 'cooked_beef', count: 1 };
        else if (nonNullItems.includes('raw_mutton')) result = { id: 'cooked_mutton', count: 1 };
        else if (nonNullItems.includes('raw_chicken')) result = { id: 'cooked_chicken', count: 1 };
      }
    }

    this.craft2Out = result;
  }

  // 3x3 Crafting Table Check
  checkCrafting3() {
    const grid = this.craft3In;
    let result = null;
    const items = grid.map(i => i?.id || null);
    const nonNullItems = items.filter(i => i !== null);
    const nonNullCount = nonNullItems.length;

    // 1. Wood log -> Planks
    const woodCount = items.filter(i => i === 'wood_log' || i === 'cherry_log').length;
    if (woodCount === 1 && nonNullCount === 1) {
      result = { id: 'wooden_planks', count: 4 };
    }

    // 2. 8 planks ring -> Chest
    if (!result && items[4] === null && items.every((i, idx) => idx === 4 || i === 'wooden_planks')) {
      result = { id: 'chest', count: 1 };
    }

    // 3. Sticks: planks vertical
    if (!result && nonNullCount === 2) {
      if ((items[0] === 'wooden_planks' && items[3] === 'wooden_planks') ||
          (items[1] === 'wooden_planks' && items[4] === 'wooden_planks') ||
          (items[2] === 'wooden_planks' && items[5] === 'wooden_planks') ||
          (items[3] === 'wooden_planks' && items[6] === 'wooden_planks') ||
          (items[4] === 'wooden_planks' && items[7] === 'wooden_planks') ||
          (items[5] === 'wooden_planks' && items[8] === 'wooden_planks')) {
        result = { id: 'stick', count: 4 };
      }
    }

    // 4. Bread: 3 wheat horizontal
    if (!result) {
      if ((items[0] === 'wheat' && items[1] === 'wheat' && items[2] === 'wheat' && nonNullCount === 3) ||
          (items[3] === 'wheat' && items[4] === 'wheat' && items[5] === 'wheat' && nonNullCount === 3) ||
          (items[6] === 'wheat' && items[7] === 'wheat' && items[8] === 'wheat' && nonNullCount === 3)) {
        result = { id: 'bread', count: 1 };
      }
    }

    // 4b. Bed: 3 wool horizontal + 3 wooden_planks directly below
    if (!result && nonNullCount === 6) {
      if ((items[0] === 'wool' && items[1] === 'wool' && items[2] === 'wool' &&
           items[3] === 'wooden_planks' && items[4] === 'wooden_planks' && items[5] === 'wooden_planks') ||
          (items[3] === 'wool' && items[4] === 'wool' && items[5] === 'wool' &&
           items[6] === 'wooden_planks' && items[7] === 'wooden_planks' && items[8] === 'wooden_planks')) {
        result = { id: 'bed', count: 1 };
      }
    }

    // 5. Iron Pickaxe: 3 iron horizontal + 2 sticks vertical
    if (!result) {
      if (items[0] === 'iron_ingot' && items[1] === 'iron_ingot' && items[2] === 'iron_ingot' &&
          items[4] === 'stick' && items[7] === 'stick' && nonNullCount === 5) {
        result = { id: 'iron_pickaxe', count: 1 };
      }
    }

    // 6. Iron Axe: 3 iron + 2 sticks vertical
    if (!result) {
      if (items[0] === 'iron_ingot' && items[1] === 'iron_ingot' &&
          items[3] === 'iron_ingot' && items[4] === 'stick' && items[7] === 'stick' && nonNullCount === 5) {
        result = { id: 'iron_axe', count: 1 };
      }
    }

    // 7. Iron Sword: 2 iron vertically + 1 stick bottom
    if (!result) {
      if (items[1] === 'iron_ingot' && items[4] === 'iron_ingot' && items[7] === 'stick' && nonNullCount === 3) {
        result = { id: 'iron_sword', count: 1 };
      }
    }

    // 8. Torch: stick bottom, log/planks center
    if (!result && nonNullCount === 2) {
      if ((items[1] === 'wood_log' && items[4] === 'stick') ||
          (items[4] === 'wood_log' && items[7] === 'stick') ||
          (items[1] === 'wooden_planks' && items[4] === 'stick') ||
          (items[4] === 'wooden_planks' && items[7] === 'stick')) {
        result = { id: 'torch', count: 4 };
      }
    }

    // 9. Cooking recipes
    if (!result && nonNullCount === 2) {
      const hasTorch = nonNullItems.includes('torch');
      if (hasTorch) {
        if (nonNullItems.includes('raw_beef')) result = { id: 'cooked_beef', count: 1 };
        else if (nonNullItems.includes('raw_mutton')) result = { id: 'cooked_mutton', count: 1 };
        else if (nonNullItems.includes('raw_chicken')) result = { id: 'cooked_chicken', count: 1 };
      }
    }

    this.craft3Out = result;
  }

  consumeCraftingIngredients(gridSize) {
    const grid = gridSize === 2 ? this.craft2In : this.craft3In;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        grid[i].count--;
        if (grid[i].count <= 0) grid[i] = null;
      }
    }
    if (gridSize === 2) this.checkCrafting2();
    else this.checkCrafting3();
  }

  // Village Trading Logics
  renderTrades() {
    const tradeListDiv = document.getElementById('trade-list');
    tradeListDiv.innerHTML = '';
    
    if (!this.activeVillager) return;

    this.activeVillager.trades.forEach((trade, idx) => {
      const row = document.createElement('div');
      row.className = `trade-offer-row ${idx === this.selectedTradeIndex ? 'selected' : ''}`;
      row.dataset.tradeIdx = idx;

      // Inputs
      const iconIn1 = ITEM_SVGS[trade.input1.id];
      const iconOut = ITEM_SVGS[trade.output.id];

      row.innerHTML = `
        <div class="trade-visual">
          <div class="item-icon" style="width:24px;height:24px">${iconIn1}</div>
          <span style="font-size:16px;margin-right:8px">${trade.input1.count}</span>
          <span style="font-size:18px">&rarr;</span>
          <div class="item-icon" style="width:24px;height:24px">${iconOut}</div>
          <span style="font-size:16px">${trade.output.count}</span>
        </div>
      `;
      
      row.addEventListener('click', () => {
        this.selectedTradeIndex = idx;
        this.renderTrades();
        this.setupActiveTradeVisuals();
      });

      tradeListDiv.appendChild(row);
    });

    this.setupActiveTradeVisuals();
  }

  setupActiveTradeVisuals() {
    if (!this.activeVillager) return;
    const trade = this.activeVillager.trades[this.selectedTradeIndex];

    // Try auto-populate inputs from player inventory
    this.tradeIn1 = null;
    this.tradeOut = null;

    // Check if player has the items in their inventory (counts)
    let totalIn1 = 0;
    this.storage.forEach(i => { if (i && i.id === trade.input1.id) totalIn1 += i.count; });
    this.hotbar.forEach(i => { if (i && i.id === trade.input1.id) totalIn1 += i.count; });

    const executeBtn = document.getElementById('btn-trade-execute');
    
    if (totalIn1 >= trade.input1.count) {
      this.tradeIn1 = { id: trade.input1.id, count: trade.input1.count };
      this.tradeOut = { id: trade.output.id, count: trade.output.count };
      executeBtn.classList.remove('disabled');
    } else {
      executeBtn.classList.add('disabled');
    }
  }

  executeActiveTrade() {
    if (!this.activeVillager) return;
    const trade = this.activeVillager.trades[this.selectedTradeIndex];

    // Subtract materials from player inventory
    let remainingToSubtract = trade.input1.count;
    
    // Subtract from storage first
    for (let i = 0; i < 27; i++) {
      if (this.storage[i] && this.storage[i].id === trade.input1.id) {
        const take = Math.min(this.storage[i].count, remainingToSubtract);
        this.storage[i].count -= take;
        remainingToSubtract -= take;
        if (this.storage[i].count <= 0) this.storage[i] = null;
        if (remainingToSubtract <= 0) break;
      }
    }

    // Subtract from hotbar
    if (remainingToSubtract > 0) {
      for (let i = 0; i < 9; i++) {
        if (this.hotbar[i] && this.hotbar[i].id === trade.input1.id) {
          const take = Math.min(this.hotbar[i].count, remainingToSubtract);
          this.hotbar[i].count -= take;
          remainingToSubtract -= take;
          if (this.hotbar[i].count <= 0) this.hotbar[i] = null;
          if (remainingToSubtract <= 0) break;
        }
      }
    }

    // Give output to player! (Add directly to inventory)
    this.addItem(trade.output.id, trade.output.count);
    this.engine.unlockAchievement('trade');

    // Refresh visuals
    this.renderAll();
    this.renderTrades();
  }

  // Chest drawing updates
  renderChest() {
    const grid = document.getElementById('chest-grid');
    grid.innerHTML = '';

    const chestItems = this.chests.get(this.activeChestCoords);
    if (!chestItems) return;

    for (let i = 0; i < 27; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.slot = `chest-tile-${i}`;
      
      const item = chestItems[i];
      if (item) {
        slot.innerHTML = `
          <div class="item-icon">${ITEM_SVGS[item.id]}</div>
          <span class="item-count">${item.count > 1 ? item.count : ''}</span>
        `;
      }
      grid.appendChild(slot);
    }
  }

  // Refresh all DOM grid sections
  renderAll() {
    // 1. Cursor Item tracker
    const dragDiv = document.getElementById('dragged-item');
    if (this.cursorItem) {
      dragDiv.innerHTML = ITEM_SVGS[this.cursorItem.id];
      dragDiv.classList.remove('hidden');
    } else {
      dragDiv.innerHTML = '';
      dragDiv.classList.add('hidden');
    }

    // Helper to paint slots list
    const paintSlots = (container, prefix, list) => {
      container.innerHTML = '';
      for (let i = 0; i < list.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.slot = `${prefix}-${i}`;
        
        const item = list[i];
        if (item) {
          slot.innerHTML = `
            <div class="item-icon">${ITEM_SVGS[item.id]}</div>
            <span class="item-count">${item.count > 1 ? item.count : ''}</span>
          `;
        }
        container.appendChild(slot);
      }
    };

    // 2. HUD Hotbar slots
    const hudHotbar = document.getElementById('hotbar');
    hudHotbar.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = `slot hotbar-slot ${i === this.engine.player?.selectedHotbarIndex ? 'active' : ''}`;
      slot.dataset.slot = `hotbar-${i}`;
      
      const item = this.hotbar[i];
      if (item) {
        slot.innerHTML = `
          <div class="item-icon">${ITEM_SVGS[item.id]}</div>
          <span class="item-count">${item.count > 1 ? item.count : ''}</span>
        `;
      }
      hudHotbar.appendChild(slot);
    }

    // 3. Screen 1: Inventory Panel grids
    paintSlots(document.getElementById('inventory-storage-grid'), 'storage', this.storage);
    paintSlots(document.getElementById('inventory-hotbar-grid'), 'hotbar', this.hotbar);

    // 2x2 Crafting inputs
    const craft2Inputs = document.querySelectorAll('.craft-in-2');
    craft2Inputs.forEach((slot, i) => {
      const item = this.craft2In[i];
      slot.innerHTML = item ? `<div class="item-icon">${ITEM_SVGS[item.id]}</div><span class="item-count">${item.count > 1 ? item.count : ''}</span>` : '';
    });
    
    // 2x2 Output
    const craft2OutSlot = document.querySelector('.craft-out-2');
    craft2OutSlot.innerHTML = this.craft2Out ? `<div class="item-icon">${ITEM_SVGS[this.craft2Out.id]}</div><span class="item-count">${this.craft2Out.count > 1 ? this.craft2Out.count : ''}</span>` : '';

    // 4. Creative palette scroll list (infinite picking)
    const creativePalette = document.getElementById('creative-item-grid');
    if (creativePalette) {
      creativePalette.innerHTML = '';
      Object.keys(ITEM_DEFS).forEach(itemId => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.slot = `creative-tile-${itemId}`;
        slot.innerHTML = `<div class="item-icon">${ITEM_SVGS[itemId]}</div>`;
        creativePalette.appendChild(slot);
      });
      paintSlots(document.getElementById('creative-hotbar-grid'), 'hotbar', this.hotbar);
    }

    // 5. Crafting Table 3x3 grids
    const craft3InGrid = document.getElementById('craft3-inventory-grid');
    if (craft3InGrid) {
      paintSlots(craft3InGrid, 'storage', this.storage);
      paintSlots(document.getElementById('craft3-hotbar-grid'), 'hotbar', this.hotbar);

      // 3x3 inputs
      const craft3Inputs = document.querySelectorAll('.craft-in-3');
      craft3Inputs.forEach((slot, i) => {
        const item = this.craft3In[i];
        slot.innerHTML = item ? `<div class="item-icon">${ITEM_SVGS[item.id]}</div><span class="item-count">${item.count > 1 ? item.count : ''}</span>` : '';
      });
      
      // 3x3 output
      const craft3OutSlot = document.querySelector('.craft-out-3');
      craft3OutSlot.innerHTML = this.craft3Out ? `<div class="item-icon">${ITEM_SVGS[this.craft3Out.id]}</div><span class="item-count">${this.craft3Out.count > 1 ? this.craft3Out.count : ''}</span>` : '';
    }

    // 6. Chest Storage Panel grids
    const chestPlayerGrid = document.getElementById('chest-player-inventory-grid');
    if (chestPlayerGrid) {
      paintSlots(chestPlayerGrid, 'storage', this.storage);
      paintSlots(document.getElementById('chest-player-hotbar-grid'), 'hotbar', this.hotbar);
      this.renderChest();
    }

    // 7. Trading Panel grids
    const tradePlayerGrid = document.getElementById('trade-player-inventory-grid');
    if (tradePlayerGrid) {
      paintSlots(tradePlayerGrid, 'storage', this.storage);
      paintSlots(document.getElementById('trade-player-hotbar-grid'), 'hotbar', this.hotbar);

      // Setup inputs visuals
      const in1 = document.querySelector('.slot[data-slot="trade-in-1"]');
      in1.innerHTML = this.tradeIn1 ? `<div class="item-icon">${ITEM_SVGS[this.tradeIn1.id]}</div><span class="item-count">${this.tradeIn1.count > 1 ? this.tradeIn1.count : ''}</span>` : '';
      
      const out = document.querySelector('.slot[data-slot="trade-out"]');
      out.innerHTML = this.tradeOut ? `<div class="item-icon">${ITEM_SVGS[this.tradeOut.id]}</div><span class="item-count">${this.tradeOut.count > 1 ? this.tradeOut.count : ''}</span>` : '';
    }
  }
}
