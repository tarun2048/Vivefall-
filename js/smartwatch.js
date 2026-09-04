export class SmartWatchController {
  constructor(engine) {
    this.engine = engine;
    this.isOpen = false;
    this.currentApp = 'home'; // 'home', 'terminal', 'calculator', 'weather', 'time', 'battery'

    this.commandHistory = [];
    this.historyIndex = -1;

    // Calculator state
    this.calcExpr = '';
    this.calcDisplay = '0';
    this.calcSub = '';

    this.initUI();
    this.initKeyboardEvents();
  }

  initUI() {
    this.container = document.getElementById('smartwatch-hud');
    if (!this.container) return;

    this.container.innerHTML = `
      <!-- Top-Right Mini Floating Pill (When watch is closed) -->
      <div id="watch-closed-pill" class="watch-closed-pill" title="Click or press 'M' to open Smart Watch">
        <span class="pill-icon">⌚</span>
        <span class="pill-prompt">[M] Zuzu Watch</span>
        <span id="pill-msg-badge" class="pill-msg-badge hidden">💬 0</span>
        <span id="pill-live-biome" class="pill-tag">📍 PLAINS</span>
        <span id="pill-live-weather" class="pill-tag">☀️ CLEAR</span>
        <span id="pill-live-time" class="pill-tag">10:35</span>
      </div>

      <!-- Top-Right Floating HUD Chat Toast Notification (When watch is closed) -->
      <div id="hud-chat-toast" class="hud-chat-toast hidden">
        <span class="toast-icon">💬</span>
        <div class="toast-content">
          <span id="toast-author" class="toast-author">Player</span>
          <span id="toast-text" class="toast-text">Message content</span>
        </div>
      </div>

      <!-- Centered 3D Physical SmartWatch Device (Opened via 'M') -->
      <div id="watch-device-modal" class="watch-device-modal hidden">
        <!-- Top Strap -->
        <div class="watch-strap strap-top">
          <div class="strap-grooves"></div>
        </div>

        <!-- SmartWatch Outer Titanium Frame -->
        <div class="watch-frame">
          <!-- Hardware Digital Crown & Side Button -->
          <div id="hw-digital-crown" class="hw-crown" title="Digital Crown (Home / Close)"></div>
          <div id="hw-side-btn" class="hw-button" title="Side Button (Close)"></div>

          <!-- Glass Screen Bezel -->
          <div class="watch-screen-bezel">
            <div class="watch-screen-glare"></div>

            <!-- OLED Screen Content -->
            <div class="watch-screen-display">

              <!-- Unified Top Status Bar -->
              <div class="watch-top-status-bar">
                <div class="status-left">
                  <button id="watch-back-btn" class="watch-back-arrow hidden" title="Back to Home">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <div id="status-signal-wave" class="status-signal-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round">
                      <path d="M4 18c2-3 4-5 8-5s6 2 8 5M7 14c2-2 3-3 5-3s3 1 5 3M10 10a2 2 0 0 1 4 0"/>
                    </svg>
                  </div>
                </div>
                <div class="status-center">
                  <span id="status-clock-header">10:35</span>
                </div>
                <div class="status-right">
                  <span id="status-battery-header">87%</span>
                  <div class="status-battery-chip">
                    <div class="battery-chip-fill"></div>
                  </div>
                  <button id="watch-close-cross" class="watch-close-cross" title="Close Watch [M]">✕</button>
                </div>
              </div>

              <!-- SCREEN 1: HOME SCREEN -->
              <div id="app-view-home" class="watch-screen-view">
                <div class="home-apps-grid">
                  <!-- Messenger App (Multiplayer Chat) -->
                  <div class="app-card" data-open="messenger">
                    <div class="app-icon-squircle icon-messenger">
                      <span class="glyph-messenger">💬</span>
                      <span id="app-card-badge-messenger" class="app-card-badge hidden">0</span>
                    </div>
                    <span class="app-label">Messenger</span>
                  </div>

                  <!-- Terminal App -->
                  <div class="app-card" data-open="terminal">
                    <div class="app-icon-squircle icon-term">
                      <span class="glyph-term">&gt;_</span>
                    </div>
                    <span class="app-label">Terminal</span>
                  </div>

                  <!-- Calculator App -->
                  <div class="app-card" data-open="calculator">
                    <div class="app-icon-squircle icon-calc">
                      <div class="calc-icon-glyph">
                        <div class="c-grid-row"><span></span><span></span></div>
                        <div class="c-grid-row"><span></span><span class="c-dot-orange"></span></div>
                      </div>
                    </div>
                    <span class="app-label">Calculator</span>
                  </div>

                  <!-- Weather App -->
                  <div class="app-card" data-open="weather">
                    <div class="app-icon-squircle icon-weather">
                      <div class="weather-icon-art">
                        <div class="w-sun-core"></div>
                        <div class="w-cloud-puff"></div>
                      </div>
                    </div>
                    <span class="app-label">Weather</span>
                  </div>

                  <!-- Time App -->
                  <div class="app-card" data-open="time">
                    <div class="app-icon-squircle icon-time">
                      <div class="time-mini-dial">
                        <div class="dial-hand-h"></div>
                        <div class="dial-hand-m"></div>
                        <div class="dial-hand-s"></div>
                      </div>
                    </div>
                    <span class="app-label">Time</span>
                  </div>
                </div>

                <!-- Bottom Centered Battery Widget -->
                <div class="home-bottom-battery-widget" data-open="battery">
                  <div class="battery-pill-body">
                    <div class="battery-pill-segments">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <span class="app-label">Battery</span>
                </div>
              </div>

              <!-- SCREEN: MESSENGER (Multiplayer Chat App) -->
              <div id="app-view-messenger" class="watch-screen-view hidden">
                <div class="messenger-header">
                  <div class="messenger-title-wrap">
                    <span class="app-header-title cyan">Messenger</span>
                    <span id="messenger-room-badge" class="room-pill-badge">OFFLINE</span>
                  </div>
                  <div id="messenger-mod-tag" class="mod-pill-badge hidden">👑 MOD</div>
                </div>

                <!-- Active Online Players Strip -->
                <div id="messenger-players-bar" class="messenger-players-bar">
                  <div class="players-bar-label">Players:</div>
                  <div id="messenger-online-list" class="messenger-online-list">
                    <span class="player-chip self">👤 You</span>
                  </div>
                </div>

                <!-- Chat Feed Scroll Area -->
                <div id="messenger-screen-log" class="messenger-log-container">
                  <div class="msg-bubble system">Welcome to Zuzu Messenger! Chat with peers across realms.</div>
                </div>

                <!-- Quick Phrases Bar -->
                <div class="messenger-quick-bar">
                  <button class="msg-quick-chip" data-quick="👋 Hey everyone!">👋 Hey</button>
                  <button class="msg-quick-chip" data-quick="⚔️ Need help!">⚔️ Help</button>
                  <button class="msg-quick-chip" data-quick="⛏️ Mining here!">⛏️ Mining</button>
                  <button class="msg-quick-chip" data-quick="🏠 Follow me to base!">🏠 Base</button>
                </div>

                <!-- Chat Input Bar -->
                <div class="messenger-input-bar">
                  <input id="messenger-chat-input" type="text" placeholder="Message or /cmd..." autocomplete="off" spellcheck="false" maxlength="120" />
                  <button id="messenger-chat-send" class="messenger-btn-send" title="Send Message">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- SCREEN 2: 2. TERMINAL -->
              <div id="app-view-terminal" class="watch-screen-view hidden">
                <div class="app-header-title green">Terminal</div>
                <div id="terminal-screen-log" class="terminal-log-container">
                  <div class="term-row green">ZuzuOS Terminal v1.0</div>
                  <div class="term-row green">Type 'help' to see commands</div>
                  <div class="term-row cmd">/&gt; time set day</div>
                  <div class="term-row info">Time changed to Day.</div>
                  <div class="term-row cmd">/&gt; weather rain</div>
                  <div class="term-row info">Weather changed to Rain.</div>
                  <div class="term-row cmd">/&gt; time set night</div>
                  <div class="term-row info">Time changed to Night.</div>
                </div>
                <div class="terminal-input-bar">
                  <span class="term-prefix">/&gt;</span>
                  <input id="term-cmd-input" type="text" placeholder="Type command..." autocomplete="off" spellcheck="false" />
                  <button id="term-cmd-send" class="term-btn-send">⏎</button>
                </div>
              </div>

              <!-- SCREEN 3: 3. CALCULATOR -->
              <div id="app-view-calculator" class="watch-screen-view hidden">
                <div class="calc-top-display">
                  <div id="calc-sub-text" class="calc-sub-expr">1,250 ÷ 5</div>
                  <div id="calc-main-text" class="calc-main-val">= 250</div>
                </div>
                <div class="calc-pad-grid">
                  <button class="c-key c-op-gray" data-calc="C">C</button>
                  <button class="c-key c-op-gray" data-calc="()">(&nbsp;)</button>
                  <button class="c-key c-op-gray" data-calc="%">%</button>
                  <button class="c-key c-op-symbol" data-calc="/">÷</button>

                  <button class="c-key c-num" data-calc="7">7</button>
                  <button class="c-key c-num" data-calc="8">8</button>
                  <button class="c-key c-num" data-calc="9">9</button>
                  <button class="c-key c-op-symbol" data-calc="*">×</button>

                  <button class="c-key c-num" data-calc="4">4</button>
                  <button class="c-key c-num" data-calc="5">5</button>
                  <button class="c-key c-num" data-calc="6">6</button>
                  <button class="c-key c-op-symbol" data-calc="-">−</button>

                  <button class="c-key c-num" data-calc="1">1</button>
                  <button class="c-key c-num" data-calc="2">2</button>
                  <button class="c-key c-num" data-calc="3">3</button>
                  <button class="c-key c-op-symbol" data-calc="+">+</button>

                  <button class="c-key c-num c-zero" data-calc="0">0</button>
                  <button class="c-key c-num" data-calc=".">.</button>
                  <button class="c-key c-op-equals" data-calc="=">=</button>
                </div>
              </div>

              <!-- SCREEN 4: 4. WEATHER DETAIL -->
              <div id="app-view-weather" class="watch-screen-view hidden">
                <div class="weather-detail-container">
                  <div id="weather-detail-status" class="weather-status-name">Clear Sky</div>
                  
                  <!-- Big Hero Weather Display -->
                  <div class="weather-hero-block">
                    <div id="weather-hero-icon" class="weather-sun-graphic">
                      <div class="sun-core"></div>
                      <div class="sun-ray r-1"></div>
                      <div class="sun-ray r-2"></div>
                      <div class="sun-ray r-3"></div>
                      <div class="sun-ray r-4"></div>
                      <div class="sun-ray r-5"></div>
                      <div class="sun-ray r-6"></div>
                      <div class="sun-ray r-7"></div>
                      <div class="sun-ray r-8"></div>
                    </div>
                    <div class="weather-hero-text">
                      <div id="weather-hero-deg" class="hero-temp">25°C</div>
                      <div class="hero-feels">Feels like 26°C</div>
                    </div>
                  </div>

                  <!-- 3 Column Stats -->
                  <div class="weather-metrics-panel">
                    <div class="metric-col">
                      <span class="m-lbl">Humidity</span>
                      <span class="m-val">40%</span>
                    </div>
                    <div class="metric-col">
                      <span class="m-lbl">Wind</span>
                      <span class="m-val">12 km/h</span>
                    </div>
                    <div class="metric-col">
                      <span class="m-lbl">Pressure</span>
                      <span class="m-val">1013 hPa</span>
                    </div>
                  </div>

                  <!-- 4-Day Forecast -->
                  <div class="weather-forecast-strip">
                    <div class="forecast-day-card">
                      <span class="f-name">Tue</span>
                      <span class="f-art">☀️</span>
                      <span class="f-hi-lo">26°/18°</span>
                    </div>
                    <div class="forecast-day-card">
                      <span class="f-name">Wed</span>
                      <span class="f-art">⛅</span>
                      <span class="f-hi-lo">25°/17°</span>
                    </div>
                    <div class="forecast-day-card">
                      <span class="f-name">Thu</span>
                      <span class="f-art">⛅</span>
                      <span class="f-hi-lo">24°/16°</span>
                    </div>
                    <div class="forecast-day-card">
                      <span class="f-name">Fri</span>
                      <span class="f-art">⛅</span>
                      <span class="f-hi-lo">23°/15°</span>
                    </div>
                  </div>

                  <!-- Quick Weather Controls -->
                  <div class="weather-quick-grid">
                    <button class="w-cmd-btn" data-cmd="/weather clear">☀️ Clear</button>
                    <button class="w-cmd-btn" data-cmd="/weather rain">🌧️ Rain</button>
                    <button class="w-cmd-btn" data-cmd="/weather snow">❄️ Snow</button>
                    <button class="w-cmd-btn" data-cmd="/weather storm">⚡ Storm</button>
                  </div>
                </div>
              </div>

              <!-- SCREEN 5: 5. TIME -->
              <div id="app-view-time" class="watch-screen-view hidden">
                <div class="analog-time-container">
                  <div class="analog-face">
                    <!-- Dial numbers 1-12 -->
                    <span class="dial-digit d12">12</span>
                    <span class="dial-digit d1">1</span>
                    <span class="dial-digit d2">2</span>
                    <span class="dial-digit d3">3</span>
                    <span class="dial-digit d4">4</span>
                    <span class="dial-digit d5">5</span>
                    <span class="dial-digit d6">6</span>
                    <span class="dial-digit d7">7</span>
                    <span class="dial-digit d8">8</span>
                    <span class="dial-digit d9">9</span>
                    <span class="dial-digit d10">10</span>
                    <span class="dial-digit d11">11</span>

                    <!-- Orange accent markers at 12, 3, 6, 9 -->
                    <div class="dial-marker m-top"></div>
                    <div class="dial-marker m-right"></div>
                    <div class="dial-marker m-bottom"></div>
                    <div class="dial-marker m-left"></div>

                    <!-- Hands -->
                    <div id="analog-hand-hour" class="analog-hand h-hour"></div>
                    <div id="analog-hand-minute" class="analog-hand h-min"></div>
                    <div id="analog-hand-second" class="analog-hand h-sec"></div>
                    <div class="analog-center-dot"></div>
                  </div>

                  <!-- Date -->
                  <div class="analog-date-block">
                    <div class="date-day">Tuesday</div>
                    <div class="date-full">21 May 2024</div>
                  </div>

                  <!-- Quick Time Presets -->
                  <div class="time-quick-grid">
                    <button class="t-cmd-btn" data-cmd="/time set day">🌅 Day</button>
                    <button class="t-cmd-btn" data-cmd="/time set noon">☀️ Noon</button>
                    <button class="t-cmd-btn" data-cmd="/time set sunset">🌇 Sunset</button>
                    <button class="t-cmd-btn" data-cmd="/time set night">🌙 Night</button>
                  </div>
                </div>
              </div>

              <!-- SCREEN 6: BATTERY APP -->
              <div id="app-view-battery" class="watch-screen-view hidden">
                <div class="battery-app-container">
                  <div class="battery-pct-large">87%</div>
                  
                  <div class="battery-gauge-box">
                    <div class="battery-gauge-bar">
                      <div class="gauge-fill"></div>
                    </div>
                  </div>

                  <div class="battery-status-tag">Charging ⚡</div>
                  <div class="battery-estimate-tag">Full in ~ 45 min</div>

                  <div class="battery-powers-grid">
                    <button class="b-cmd-btn" data-cmd="/fly">🦅 Toggle Flight</button>
                    <button class="b-cmd-btn" data-cmd="/heal">💖 Full Heal (20 HP)</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Bottom Strap -->
        <div class="watch-strap strap-bottom">
          <div class="strap-grooves"></div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Click Mini Pill to open SmartWatch
    const pill = document.getElementById('watch-closed-pill');
    if (pill) {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });
    }

    // 2. Hardware buttons & Close
    const crown = document.getElementById('hw-digital-crown');
    if (crown) {
      crown.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentApp === 'home') this.close();
        else this.openApp('home');
      });
    }

    const sideBtn = document.getElementById('hw-side-btn');
    if (sideBtn) {
      sideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    const closeBtn = document.getElementById('watch-close-cross');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    const backBtn = document.getElementById('watch-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openApp('home');
      });
    }

    // 3. Home Screen App Cards
    this.container.querySelectorAll('[data-open]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const app = card.getAttribute('data-open');
        if (app) this.openApp(app);
      });
    });

    // 4. Quick Action Command buttons in Weather / Time / Battery
    this.container.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cmd = btn.getAttribute('data-cmd');
        if (cmd) {
          this.executeCommand(cmd);
          this.playClickSound();
        }
      });
    });

    // 5. Terminal Input
    const termInput = document.getElementById('term-cmd-input');
    const termSend = document.getElementById('term-cmd-send');

    const handleTermSubmit = () => {
      if (!termInput) return;
      const val = termInput.value.trim();
      if (val) {
        this.executeCommand(val);
        this.commandHistory.push(val);
        this.historyIndex = this.commandHistory.length;
        termInput.value = '';
      }
    };

    if (termSend) {
      termSend.addEventListener('click', (e) => {
        e.stopPropagation();
        handleTermSubmit();
      });
    }

    if (termInput) {
      termInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          handleTermSubmit();
        } else if (e.key === 'ArrowUp') {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            termInput.value = this.commandHistory[this.historyIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            termInput.value = this.commandHistory[this.historyIndex] || '';
          } else {
            this.historyIndex = this.commandHistory.length;
            termInput.value = '';
          }
        }
      });
    }

    // 5.5 Messenger Input & Send
    const msgInput = document.getElementById('messenger-chat-input');
    const msgSend = document.getElementById('messenger-chat-send');

    const handleMsgSubmit = () => {
      if (!msgInput) return;
      const val = msgInput.value.trim();
      if (val) {
        if (this.engine.multiplayer) {
          this.engine.multiplayer.sendChatMessage(val);
        } else {
          this.appendChatMessage({
            author: 'You',
            isMod: true,
            text: val,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
        msgInput.value = '';
      }
    };

    if (msgSend) {
      msgSend.addEventListener('click', (e) => {
        e.stopPropagation();
        handleMsgSubmit();
      });
    }

    if (msgInput) {
      msgInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          handleMsgSubmit();
        }
      });
    }

    // Quick reaction chips
    this.container.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-quick');
        if (text) {
          if (this.engine.multiplayer) {
            this.engine.multiplayer.sendChatMessage(text);
          } else {
            this.appendChatMessage({
              author: 'You',
              isMod: true,
              text: text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          this.playClickSound();
        }
      });
    });

    // 6. Calculator Keypad
    this.container.querySelectorAll('[data-calc]').forEach(key => {
      key.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = key.getAttribute('data-calc');
        this.handleCalculatorInput(val);
        this.playClickSound();
      });
    });
  }

  handleCalculatorInput(key) {
    const subEl = document.getElementById('calc-sub-text');
    const mainEl = document.getElementById('calc-main-text');

    if (key === 'C') {
      this.calcExpr = '';
      this.calcDisplay = '0';
      this.calcSub = '';
      if (subEl) subEl.textContent = '';
      if (mainEl) mainEl.textContent = '0';
      return;
    }

    if (key === '=') {
      try {
        if (!this.calcExpr) return;
        const sanitized = this.calcExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        const evalRes = Function('"use strict";return (' + sanitized + ')')();
        this.calcSub = this.calcExpr;
        this.calcDisplay = '= ' + String(evalRes);
        if (subEl) subEl.textContent = this.calcSub;
        if (mainEl) mainEl.textContent = this.calcDisplay;
        this.calcExpr = String(evalRes);
      } catch (err) {
        if (mainEl) mainEl.textContent = 'Error';
      }
      return;
    }

    if (key === '()') {
      const openCount = (this.calcExpr.match(/\(/g) || []).length;
      const closeCount = (this.calcExpr.match(/\)/g) || []).length;
      if (openCount > closeCount && !isNaN(this.calcExpr.slice(-1))) {
        this.calcExpr += ')';
      } else {
        this.calcExpr += '(';
      }
    } else {
      this.calcExpr += key;
    }

    if (subEl) subEl.textContent = this.calcExpr;
    if (mainEl) mainEl.textContent = this.calcExpr;
  }

  initKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // If user is typing in terminal or messenger, do not intercept
      if (document.activeElement && (document.activeElement.id === 'term-cmd-input' || document.activeElement.id === 'messenger-chat-input')) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.close();
        }
        return;
      }

      // Close watch with Escape
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.engine.gameState = 'smartwatch';

    // Release pointer lock so user gets their normal mouse cursor
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (this.engine.controls && typeof this.engine.controls.unlock === 'function') {
      this.engine.controls.unlock();
    }

    const modal = document.getElementById('watch-device-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }

    const watchHud = document.getElementById('smartwatch-hud');
    if (watchHud) {
      watchHud.classList.remove('hidden');
      watchHud.style.display = 'block';
    }

    this.playClickSound();
  }

  close() {
    this.isOpen = false;
    this.engine.gameState = 'playing';

    const modal = document.getElementById('watch-device-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }

    // Re-lock mouse cursor for first-person gameplay
    if (this.engine.controls && typeof this.engine.controls.lock === 'function') {
      this.engine.controls.lock();
    }
  }

  openApp(appName) {
    this.currentApp = appName;
    const apps = ['home', 'messenger', 'terminal', 'calculator', 'weather', 'time', 'battery'];

    apps.forEach(a => {
      const el = document.getElementById(`app-view-${a}`);
      if (el) {
        if (a === appName) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    const backBtn = document.getElementById('watch-back-btn');
    const signalWave = document.getElementById('status-signal-wave');
    if (backBtn && signalWave) {
      if (appName === 'home') {
        backBtn.classList.add('hidden');
        signalWave.classList.remove('hidden');
      } else {
        backBtn.classList.remove('hidden');
        signalWave.classList.add('hidden');
      }
    }

    if (appName === 'messenger') {
      const input = document.getElementById('messenger-chat-input');
      if (input) setTimeout(() => input.focus(), 60);
      this.clearUnreadMessages();
      this.refreshMessengerHeader();
    } else if (appName === 'terminal') {
      const input = document.getElementById('term-cmd-input');
      if (input) setTimeout(() => input.focus(), 60);
    }

    this.playClickSound();
  }

  logTerminal(msg, type = 'info') {
    const log = document.getElementById('terminal-screen-log');
    if (!log) return;

    const row = document.createElement('div');
    row.className = `term-row ${type}`;
    row.innerHTML = msg;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  playClickSound() {
    if (this.engine.sounds && this.engine.sounds.playClick) {
      this.engine.sounds.playClick();
    }
  }

  executeCommand(cmdStr) {
    const raw = cmdStr.trim();
    if (!raw) return;

    this.logTerminal(`/&gt; ${raw}`, 'cmd');

    const parts = raw.startsWith('/') ? raw.substring(1).split(' ') : raw.split(' ');
    const main = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (main) {
      case 'weather': {
        const sub = args[0]?.toLowerCase() || 'toggle';
        if (sub === 'clear') {
          if (this.engine.weather) this.engine.weather.setWeather('clear', true);
          this.logTerminal('Weather changed to Clear.', 'info');
        } else if (sub === 'rain') {
          if (this.engine.weather) this.engine.weather.setWeather('rain', true);
          this.logTerminal('Weather changed to Rain.', 'info');
        } else if (sub === 'snow') {
          if (this.engine.weather) this.engine.weather.setWeather('snow', true);
          this.logTerminal('Weather changed to Snow.', 'info');
        } else if (sub === 'storm' || sub === 'thunder') {
          if (this.engine.weather) this.engine.weather.setWeather('rain', true);
          this.logTerminal('Weather changed to Thunderstorm.', 'info');
        } else if (sub === 'toggle') {
          const current = this.engine.weather ? this.engine.weather.weatherType : 'clear';
          const next = current === 'clear' ? 'rain' : current === 'rain' ? 'snow' : 'clear';
          if (this.engine.weather) this.engine.weather.setWeather(next, true);
          this.logTerminal(`Weather changed to ${next}.`, 'info');
        } else {
          this.logTerminal("Usage: /weather &lt;clear|rain|snow|storm&gt;", 'error');
        }
        break;
      }

      case 'time': {
        const action = args[0]?.toLowerCase();
        const value = args[1]?.toLowerCase();

        if (action === 'set') {
          if (value === 'day') {
            this.engine.timeOfDay = 8000;
            this.logTerminal('Time changed to Day.', 'info');
          } else if (value === 'noon') {
            this.engine.timeOfDay = 12000;
            this.logTerminal('Time changed to Noon.', 'info');
          } else if (value === 'sunset') {
            this.engine.timeOfDay = 18000;
            this.logTerminal('Time changed to Sunset.', 'info');
          } else if (value === 'night') {
            this.engine.timeOfDay = 21000;
            if (this.engine.mobs) this.engine.mobs.spawnNightHordeAroundPlayer();
            this.logTerminal('Time changed to Night.', 'info');
          } else if (!isNaN(parseInt(value))) {
            this.engine.timeOfDay = parseInt(value) % 24000;
            this.logTerminal(`Time changed to ${this.engine.timeOfDay} ticks.`, 'info');
          } else {
            this.logTerminal("Usage: /time set &lt;day|night|noon|sunset|ticks&gt;", 'error');
          }
        } else if (action === 'pause') {
          this.engine.isTimePaused = true;
          this.logTerminal('Daylight cycle paused.', 'info');
        } else if (action === 'resume') {
          this.engine.isTimePaused = false;
          this.logTerminal('Daylight cycle resumed.', 'info');
        } else {
          this.logTerminal("Usage: /time &lt;set day|night|pause|resume&gt;", 'error');
        }
        break;
      }

      case 'fly': {
        if (this.engine.player) {
          const val = args[0]?.toLowerCase();
          if (val === 'on') this.engine.player.isFlying = true;
          else if (val === 'off') this.engine.player.isFlying = false;
          else this.engine.player.isFlying = !this.engine.player.isFlying;

          this.logTerminal(`Flight mode: ${this.engine.player.isFlying ? 'Enabled' : 'Disabled'}.`, 'info');
        }
        break;
      }

      case 'speed': {
        if (this.engine.player) {
          const mode = args[0]?.toLowerCase() || 'fast';
          if (mode === 'fast' || mode === '2') {
            this.engine.player.speedMultiplier = 2.0;
            this.logTerminal('Speed mode: Fast (2x).', 'info');
          } else if (mode === 'super' || mode === '3') {
            this.engine.player.speedMultiplier = 3.5;
            this.logTerminal('Speed mode: Super (3.5x).', 'info');
          } else {
            this.engine.player.speedMultiplier = 1.0;
            this.logTerminal('Speed mode: Normal (1x).', 'info');
          }
        }
        break;
      }

      case 'heal': {
        if (this.engine.player) {
          this.engine.player.health = 20;
          this.engine.player.hunger = 20;
          this.engine.player.updateHUD();
          this.logTerminal('Player fully restored (20 HP & 20 Hunger).', 'info');
        }
        break;
      }

      case 'tp':
      case 'teleport': {
        const dest = args[0]?.toLowerCase();
        if (dest === 'spawn') {
          if (this.engine.player) {
            this.engine.player.position.set(0, this.engine.world.getTerrainHeight(0, 0) + 2, 0);
            this.logTerminal('Teleported to Spawn (0, 0).', 'info');
          }
        } else if (dest === 'village') {
          if (this.engine.player) {
            this.engine.player.position.set(24, this.engine.world.getTerrainHeight(24, 8) + 2, 8);
            this.logTerminal('Teleported to Starter Village (24, 8).', 'info');
          }
        } else if (dest === 'castle') {
          if (this.engine.player) {
            this.engine.player.position.set(0, this.engine.world.getTerrainHeight(0, -60) + 2, -60);
            this.logTerminal('Teleported to Dark Castle Realm (0, -60).', 'info');
          }
        } else if (args.length >= 3) {
          const x = parseFloat(args[0]);
          const y = parseFloat(args[1]);
          const z = parseFloat(args[2]);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z) && this.engine.player) {
            this.engine.player.position.set(x, y, z);
            this.logTerminal(`Teleported to (${x}, ${y}, ${z}).`, 'info');
          }
        } else {
          this.logTerminal('Usage: /tp &lt;x&gt; &lt;y&gt; &lt;z&gt; or /tp &lt;spawn|village|castle&gt;', 'error');
        }
        break;
      }

      case 'give': {
        const item = args[0]?.toLowerCase();
        const amount = parseInt(args[1]) || 1;
        if (!item) {
          this.logTerminal('Usage: /give &lt;item&gt; &lt;amount&gt;', 'error');
        } else if (this.engine.inventory) {
          this.engine.inventory.addItem(item, amount);
          this.logTerminal(`Granted ${amount}x ${item}.`, 'info');
        }
        break;
      }

      case 'gamemode': {
        const mode = args[0]?.toLowerCase();
        if (mode === 'creative' || mode === 'c' || mode === '1') {
          this.engine.gameMode = 'creative';
          this.logTerminal('Game mode set to Creative.', 'info');
        } else if (mode === 'survival' || mode === 'story' || mode === 's' || mode === '0') {
          this.engine.gameMode = 'story';
          this.logTerminal('Game mode set to Story / Survival.', 'info');
        } else {
          this.logTerminal('Usage: /gamemode &lt;creative|survival&gt;', 'error');
        }
        break;
      }

      case 'kill': {
        if (this.engine.player) {
          this.engine.player.takeDamage(100, "Killed via SmartWatch terminal command");
          this.logTerminal('Player was slain.', 'error');
        }
        break;
      }

      case 'setspawn': {
        this.logTerminal('Spawn point set to current player location.', 'info');
        break;
      }

      case 'clear': {
        const log = document.getElementById('terminal-screen-log');
        if (log) log.innerHTML = '';
        break;
      }

      case 'help': {
        this.logTerminal(`
          <div style="color:#22c55e; font-weight:bold; margin-bottom:2px;">Available commands:</div>
          <div>/time set &lt;day|night&gt;</div>
          <div>/weather &lt;clear|rain|storm&gt;</div>
          <div>/tp &lt;x&gt; &lt;y&gt; &lt;z&gt;</div>
          <div>/give &lt;item&gt; &lt;amount&gt;</div>
          <div>/gamemode &lt;creative|survival&gt;</div>
          <div>/fly &lt;on|off&gt;</div>
          <div>/heal</div>
          <div>/setspawn</div>
          <div>/kill</div>
        `, 'info');
        break;
      }

      default: {
        this.logTerminal(`Unknown command '${main}'. Type 'help' for commands.`, 'error');
        break;
      }
    }
  }

  update(delta) {
    if (!this.container || !this.engine.player || !this.engine.world) return;

    const px = this.engine.player.position.x;
    const pz = this.engine.player.position.z;
    const biome = this.engine.world.getBiome(px, pz);
    const biomeName = biome.toUpperCase().replace('_', ' ');

    const weatherType = this.engine.weather ? this.engine.weather.weatherType : 'clear';
    const weatherIcons = { clear: '☀️ CLEAR', rain: '🌧️ RAIN', snow: '❄️ SNOW' };

    // Format current time HH:MM
    const hours = Math.floor((this.engine.timeOfDay / 1000 + 6) % 24);
    const mins = Math.floor(((this.engine.timeOfDay % 1000) / 1000) * 60);
    const strH = String(hours).padStart(2, '0');
    const strM = String(mins).padStart(2, '0');
    const timeStr = `${strH}:${strM}`;

    // 1. Update Mini Pill
    const pillBiome = document.getElementById('pill-live-biome');
    const pillWeather = document.getElementById('pill-live-weather');
    const pillTime = document.getElementById('pill-live-time');
    if (pillBiome) pillBiome.textContent = `📍 ${biomeName}`;
    if (pillWeather) pillWeather.textContent = weatherIcons[weatherType] || '☀️ CLEAR';
    if (pillTime) pillTime.textContent = timeStr;

    // 2. Update Header Status Bar
    const headerClock = document.getElementById('status-clock-header');
    if (headerClock) headerClock.textContent = timeStr;

    // 3. Update Weather Detail View
    const wStatus = document.getElementById('weather-detail-status');
    if (wStatus) wStatus.textContent = weatherType === 'rain' ? 'Rain' : weatherType === 'snow' ? 'Snowfall' : 'Clear Sky';

    // 4. Update Analog Clock Hands
    const hourHand = document.getElementById('analog-hand-hour');
    const minHand = document.getElementById('analog-hand-minute');
    const secHand = document.getElementById('analog-hand-second');

    if (hourHand && minHand && secHand) {
      const hourDeg = (hours % 12) * 30 + mins * 0.5;
      const minDeg = mins * 6;
      const secDeg = (performance.now() * 0.001 * 60) % 360;

      hourHand.style.transform = `rotate(${hourDeg}deg)`;
      minHand.style.transform = `rotate(${minDeg}deg)`;
      secHand.style.transform = `rotate(${secDeg}deg)`;
    }
  }

  appendChatMessage(msg) {
    const log = document.getElementById('messenger-screen-log');
    if (!log) return;

    const row = document.createElement('div');
    const isSelf = msg.author === this.engine.multiplayer?.playerName || msg.author === 'You';
    const isSystem = msg.author === 'SYSTEM';

    if (isSystem) {
      row.className = 'msg-bubble system';
      row.textContent = msg.text;
    } else {
      row.className = `msg-bubble ${isSelf ? 'self' : 'other'} ${msg.isMod ? 'mod' : ''}`;
      
      const headerDiv = document.createElement('div');
      headerDiv.className = 'msg-meta';
      
      const authorSpan = document.createElement('span');
      authorSpan.className = 'msg-author';
      authorSpan.textContent = msg.isMod ? `👑 ${msg.author}` : msg.author;
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'msg-time';
      timeSpan.textContent = msg.time || '';
      
      headerDiv.appendChild(authorSpan);
      headerDiv.appendChild(timeSpan);

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'msg-text';
      bodyDiv.textContent = msg.text;

      row.appendChild(headerDiv);
      row.appendChild(bodyDiv);
    }

    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  onReceiveChatMessage(msg) {
    this.appendChatMessage(msg);

    // If watch is closed or user is viewing another app, notify!
    if (!this.isOpen || this.currentApp !== 'messenger') {
      if (!this.unreadCount) this.unreadCount = 0;
      this.unreadCount++;

      // Update badges
      const cardBadge = document.getElementById('app-card-badge-messenger');
      if (cardBadge) {
        cardBadge.textContent = this.unreadCount;
        cardBadge.classList.remove('hidden');
      }

      const pillBadge = document.getElementById('pill-msg-badge');
      if (pillBadge) {
        pillBadge.textContent = `💬 ${this.unreadCount}`;
        pillBadge.classList.remove('hidden');
      }

      // Audio notification chime
      this.playChimeSound();

      // Floating HUD Toast if watch is closed
      if (!this.isOpen && msg.author !== 'SYSTEM') {
        this.showHUDChatToast(msg.author, msg.text, msg.isMod);
      }
    }
  }

  clearUnreadMessages() {
    this.unreadCount = 0;
    const cardBadge = document.getElementById('app-card-badge-messenger');
    if (cardBadge) cardBadge.classList.add('hidden');

    const pillBadge = document.getElementById('pill-msg-badge');
    if (pillBadge) pillBadge.classList.add('hidden');
  }

  showHUDChatToast(author, text, isMod) {
    const toast = document.getElementById('hud-chat-toast');
    const authorEl = document.getElementById('toast-author');
    const textEl = document.getElementById('toast-text');

    if (toast && authorEl && textEl) {
      authorEl.textContent = isMod ? `👑 [MOD] ${author}:` : `${author}:`;
      authorEl.style.color = isMod ? '#f59e0b' : '#38bdf8';
      textEl.textContent = text;

      toast.classList.remove('hidden');
      toast.classList.add('show');

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
      }, 4000);
    }
  }

  playChimeSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // High-register polite digital chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      // Audio context might fail on un-interacted policy
    }
  }

  refreshMessengerHeader() {
    const roomBadge = document.getElementById('messenger-room-badge');
    const modTag = document.getElementById('messenger-mod-tag');
    const onlineList = document.getElementById('messenger-online-list');

    if (this.engine.multiplayer && this.engine.multiplayer.isMultiplayer) {
      if (roomBadge) {
        roomBadge.textContent = this.engine.multiplayer.roomCode;
        roomBadge.className = 'room-pill-badge active';
      }
      if (modTag) {
        if (this.engine.multiplayer.isModerator) {
          modTag.classList.remove('hidden');
        } else {
          modTag.classList.add('hidden');
        }
      }
      if (onlineList) {
        onlineList.innerHTML = `<span class="player-chip self">${this.engine.multiplayer.isModerator ? '👑' : '👤'} ${this.engine.multiplayer.playerName} (You)</span>`;
        for (const rp of this.engine.multiplayer.remotePlayers.values()) {
          const chip = document.createElement('span');
          chip.className = `player-chip ${rp.isModerator ? 'mod' : ''}`;
          chip.textContent = `${rp.isModerator ? '👑' : '👤'} ${rp.name}`;
          onlineList.appendChild(chip);
        }
      }
    } else {
      if (roomBadge) {
        roomBadge.textContent = 'SINGLEPLAYER';
        roomBadge.className = 'room-pill-badge';
      }
      if (modTag) modTag.classList.remove('hidden');
      if (onlineList) {
        onlineList.innerHTML = `<span class="player-chip self">👑 You</span>`;
      }
    }
  }
}
