/**
 * Shell Quest - Core Game Engine, Shuffling Algorithm, Passive Abilities, Hard Mode Hazards & Endless Tower Mode
 */

class ShellGame {
  constructor() {
    this.cupsContainer = document.getElementById('cups-arena');
    this.statusTitle = document.getElementById('stage-status-title');
    this.statusSubtitle = document.getElementById('stage-status-subtitle');
    this.primaryBtn = document.getElementById('btn-main-action');
    this.difficultyBadge = document.getElementById('difficulty-badge');
    this.difficultyMode = localStorage.getItem('sq_diff_mode') || 'easy'; // 'easy' (default), 'normal', 'hard'
    this.gameMode = localStorage.getItem('sq_game_mode') || 'journey'; // 'journey' or 'tower'
    this.towerFloor = 1; // Starting on Floor 1
    this.towerCurrentEffects = []; // Active multi-hazard effects for current Endless Floor
    
    this.state = 'IDLE'; // IDLE, REVEAL_START, SHUFFLING, GUESSING, REVEAL_RESULT, ROUND_OVER
    this.targetCupIndex = 0; // Current slot containing the gem
    this.cupPositions = [];  // Array of logical cup objects { id, currentPosIndex, element }
    this.selectedCups = [];
    
    // Active round passive abilities procced for the current round
    this.roundPassives = {
      xray: false,
      doublePick: false,
      timeSlow: false,
      oracle: false,
      shield: false,
      midas: false
    };

    this.worlds = {
      ocean: {
        id: 'ocean',
        name: 'Ocean Realm',
        tier: 0,
        trophiesReq: 0,
        themeClass: 'theme-ocean',
        containerType: 'ocean-shell',
        containerName: 'Shimmering Shells',
        gemName: 'Luminous Pearl',
        hazardName: 'Marine Swarm & Bubbles',
        baseCups: 3,
        icon: '🐚'
      },
      desert: {
        id: 'desert',
        name: 'Desert Dunes',
        tier: 1,
        trophiesReq: 20,
        themeClass: 'theme-desert',
        containerType: 'desert-pot',
        containerName: 'Clay Pots',
        gemName: 'Sun Scarab',
        hazardName: 'Sandstorm & Dust Devils',
        baseCups: 3,
        icon: '🏺'
      },
      sky: {
        id: 'sky',
        name: 'Sky Islands',
        tier: 2,
        trophiesReq: 40,
        themeClass: 'theme-sky',
        containerType: 'sky-jar',
        containerName: 'Cloud Jars',
        gemName: 'Star Core',
        hazardName: 'Dense Cloud Banks & Sky Birds',
        baseCups: 3,
        icon: '✨'
      },
      jungle: {
        id: 'jungle',
        name: 'Jungle Ruins',
        tier: 3,
        trophiesReq: 60,
        themeClass: 'theme-jungle',
        containerType: 'jungle-idol',
        containerName: 'Stone Idols',
        gemName: 'Jade Eye',
        hazardName: 'Canopy Leaf Storm & Jungle Bats',
        baseCups: 4,
        icon: '🗿'
      },
      victory: {
        id: 'victory',
        name: 'Grand Victory',
        tier: 4,
        trophiesReq: 80,
        themeClass: 'theme-victory',
        containerType: 'victory-relic',
        containerName: 'Cosmic Relics',
        gemName: 'Celestial Heart',
        hazardName: 'Tumbling Asteroid Belt & Meteors',
        baseCups: 4,
        icon: '👑'
      },
      tower: {
        id: 'tower',
        name: 'Endless Dark Tower',
        tier: 99,
        trophiesReq: 0,
        themeClass: 'theme-tower',
        containerType: 'rainbow-key',
        containerName: 'Rainbow Keys',
        gemName: 'Prismatic Keystone',
        hazardName: 'Dark Tower Void Storm',
        baseCups: 3,
        icon: '🗼'
      }
    };

    this.currentWorldId = 'ocean';
  }

  init() {
    if (window.hazardEngine) {
      window.hazardEngine.init();
    }
    this.syncWorld();
    this.updateDifficultySelectorUI();
    this.setupArena();
    this.bindEvents();
  }

  getCurrentWorld() {
    if (this.gameMode === 'tower') {
      return this.worlds.tower;
    }
    const trophies = window.economy.trophies;
    if (trophies >= 80) return this.worlds.victory;
    if (trophies >= 60) return this.worlds.jungle;
    if (trophies >= 40) return this.worlds.sky;
    if (trophies >= 20) return this.worlds.desert;
    return this.worlds.ocean;
  }

  setGameMode(mode) {
    if (this.state === 'SHUFFLING') return;
    this.gameMode = mode;
    localStorage.setItem('sq_game_mode', mode);
    
    if (mode === 'tower') {
      this.towerFloor = 1;
    }

    this.syncWorld();
    this.updateDifficultySelectorUI();
    this.setupArena();
    window.soundEngine.playClick();
    
    const label = mode === 'tower' ? '🗼 Entered Endless Dark Tower!' : '🗺️ Entered World Journey!';
    window.ui.showToast(label);
  }

  syncWorld() {
    const world = this.getCurrentWorld();
    this.currentWorldId = world.id;

    // Set Theme Class on app container
    const appEl = document.querySelector('.app-container');
    if (appEl) {
      appEl.className = `app-container ${world.themeClass}`;
    }

    // Set ambient canvas particles
    if (window.particleEngine) {
      window.particleEngine.setWorld(world.id === 'tower' ? 'victory' : world.id);
    }

    // Set Hazard engine world
    if (window.hazardEngine) {
      window.hazardEngine.setWorld(world.id, this.difficultyMode);
    }

    // Update World map active states
    document.querySelectorAll('.world-card').forEach(card => {
      const wId = card.dataset.worldId;
      const targetWorld = this.worlds[wId];
      if (!targetWorld) return;

      const isUnlocked = window.economy.trophies >= targetWorld.trophiesReq;
      card.classList.toggle('unlocked', isUnlocked);
      card.classList.toggle('locked', !isUnlocked);
      card.classList.toggle('active-world', wId === world.id);
    });

    window.economy.updateHUD();
  }

  getRainbowKeySVG(colorIndex, totalKeys) {
    return `
      <svg class="cup-svg rainbow-key" viewBox="0 0 100 130">
        <defs>
          <linearGradient id="towerKeyGradUniform" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fff0c2" />
            <stop offset="30%" stop-color="#ffd166" />
            <stop offset="70%" stop-color="#e08504" />
            <stop offset="100%" stop-color="#4a1500" />
          </linearGradient>
        </defs>
        <!-- Key Bow Handle with Ornate Heart/Loop Design -->
        <circle cx="50" cy="30" r="22" fill="url(#towerKeyGradUniform)" stroke="#fffdf0" stroke-width="2.5" />
        <circle cx="50" cy="30" r="11" fill="#0d0217" stroke="#ffd166" stroke-width="1.5" />
        <!-- Glowing Core Jewel in Center (Uniform across all keys) -->
        <circle cx="50" cy="30" r="5.5" fill="#ffd166" class="key-gem" style="color: #ffd166;" />
        <!-- Key Shaft -->
        <path d="M 45 48 L 55 48 L 54 114 L 46 114 Z" fill="url(#towerKeyGradUniform)" stroke="#fffdf0" stroke-width="1.5" class="key-shaft" />
        <!-- Key Ward / Teeth -->
        <path d="M 54 86 L 68 86 L 68 94 L 54 94" fill="url(#towerKeyGradUniform)" stroke="#fffdf0" stroke-width="1.5" />
        <path d="M 54 100 L 64 100 L 64 108 L 54 108" fill="url(#towerKeyGradUniform)" stroke="#fffdf0" stroke-width="1.5" />
        <path d="M 46 103 L 38 103 L 38 109 L 46 109" fill="url(#towerKeyGradUniform)" stroke="#fffdf0" stroke-width="1.5" />
      </svg>
    `;
  }

  getContainerSVG(type) {
    switch (type) {
      case 'desert-pot':
        return `
          <svg class="cup-svg desert-pot" viewBox="0 0 100 120">
            <defs>
              <linearGradient id="desertPotGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffb703" />
                <stop offset="50%" stop-color="#d00000" />
                <stop offset="100%" stop-color="#370617" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="20" rx="28" ry="10" class="pot-base" />
            <path d="M 22 20 Q 10 60 25 100 Q 50 115 75 100 Q 90 60 78 20 Z" class="pot-base" />
            <path d="M 30 50 Q 50 65 70 50" class="pot-ornament" />
            <path d="M 32 75 Q 50 90 68 75" class="pot-ornament" />
            <circle cx="50" cy="62" r="5" fill="#ffd166" />
          </svg>
        `;
      case 'sky-jar':
        return `
          <svg class="cup-svg sky-jar" viewBox="0 0 100 120">
            <defs>
              <linearGradient id="skyJarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7209b7" />
                <stop offset="50%" stop-color="#4a154b" />
                <stop offset="100%" stop-color="#240046" />
              </linearGradient>
            </defs>
            <rect x="35" y="10" width="30" height="15" rx="3" class="jar-cork" />
            <path d="M 35 25 L 65 25 L 85 55 Q 90 105 50 105 Q 10 105 15 55 Z" class="jar-glass" />
            <circle cx="50" cy="65" r="14" fill="#5c1d8f" />
            <path d="M 40 70 Q 50 55 60 70" stroke="#f72585" stroke-width="2" fill="none" opacity="0.9" />
          </svg>
        `;
      case 'jungle-idol':
        return `
          <svg class="cup-svg jungle-idol" viewBox="0 0 100 120">
            <defs>
              <linearGradient id="jungleIdolGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#588157" />
                <stop offset="50%" stop-color="#3a5a40" />
                <stop offset="100%" stop-color="#132a13" />
              </linearGradient>
            </defs>
            <rect x="20" y="15" width="60" height="90" rx="12" class="idol-stone" />
            <rect x="30" y="35" width="12" height="8" rx="2" fill="#70e000" />
            <rect x="58" y="35" width="12" height="8" rx="2" fill="#70e000" />
            <path d="M 40 60 L 60 60 L 50 75 Z" class="idol-runes" />
            <path d="M 32 88 L 68 88" class="idol-runes" />
            <circle cx="50" cy="24" r="4" fill="#38b000" />
          </svg>
        `;
      case 'victory-relic':
        return `
          <svg class="cup-svg victory-relic" viewBox="0 0 100 120">
            <defs>
              <linearGradient id="victoryRelicGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffe6a7" />
                <stop offset="40%" stop-color="#ffd166" />
                <stop offset="100%" stop-color="#bb9457" />
              </linearGradient>
            </defs>
            <path d="M 25 20 Q 50 10 75 20 L 70 65 Q 50 85 30 65 Z" class="relic-gold" />
            <polygon points="50,15 60,35 40,35" class="relic-gem" />
            <rect x="45" y="80" width="10" height="20" class="relic-gold" />
            <ellipse cx="50" cy="102" rx="25" ry="8" class="relic-gold" />
          </svg>
        `;
      case 'rainbow-key':
        return this.getRainbowKeySVG(0, 3);
      case 'ocean-shell':
      default:
        return `
          <svg class="cup-svg ocean-shell" viewBox="0 0 100 120">
            <defs>
              <linearGradient id="oceanShellGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#48cae4" />
                <stop offset="50%" stop-color="#0077b6" />
                <stop offset="100%" stop-color="#023e8a" />
              </linearGradient>
            </defs>
            <path d="M 50 15 C 20 20, 10 60, 20 95 C 40 105, 60 105, 80 95 C 90 60, 80 20, 50 15 Z" class="shell-base" />
            <path d="M 50 15 L 50 100" class="shell-lines" />
            <path d="M 50 15 Q 35 55 30 96" class="shell-lines" />
            <path d="M 50 15 Q 65 55 70 96" class="shell-lines" />
            <path d="M 50 15 Q 22 55 20 85" class="shell-lines" opacity="0.6" />
            <path d="M 50 15 Q 78 55 80 85" class="shell-lines" opacity="0.6" />
          </svg>
        `;
    }
  }

  setDifficultyMode(mode) {
    if (this.state === 'SHUFFLING') return;
    this.difficultyMode = mode;
    localStorage.setItem('sq_diff_mode', mode);

    if (window.hazardEngine) {
      window.hazardEngine.setWorld(this.currentWorldId, mode);
    }

    this.updateDifficultySelectorUI();
    this.setupArena();
    window.soundEngine.playClick();
    window.ui.showToast(`🎯 Difficulty set to ${mode.toUpperCase()}!`);
  }

  updateDifficultySelectorUI() {
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      const mode = btn.dataset.mode;
      btn.classList.toggle('active', mode === this.gameMode);
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
      const mode = btn.dataset.diff;
      btn.classList.toggle('active', mode === this.difficultyMode);
    });

    const diffSelectorBar = document.querySelector('.difficulty-selector-bar');

    if (this.gameMode === 'tower') {
      if (diffSelectorBar) diffSelectorBar.style.display = 'none';
      if (this.difficultyBadge) {
        const best = window.economy.towerBestFloor || 1;
        this.difficultyBadge.textContent = `🗼 FLOOR ${this.towerFloor} • 👑 BEST: ${best}`;
      }
    } else {
      if (diffSelectorBar) diffSelectorBar.style.display = 'flex';
      if (this.difficultyBadge) {
        const trophies = window.economy.trophies;
        const modeLabels = {
          easy: '🌱 EASY (Light Obstacles)',
          normal: '⚡ NORMAL (Moderate Obstacles)',
          hard: '🔥 HARD (Intense Obstacles)'
        };
        const label = modeLabels[this.difficultyMode] || 'EASY';
        this.difficultyBadge.textContent = `${label} • Lv. ${Math.min(20, Math.floor(trophies / 4) + 1)}`;
      }
    }
  }

  // Calculate difficulty params
  getDifficulty() {
    if (this.gameMode === 'tower') {
      const floor = this.towerFloor;
      // Key count expands with floors: Floor 1-4: 3 keys, 5-9: 4 keys, 10-17: 5 keys, 18-27: 6 keys, 28+: 7-8 keys
      let numCups = 3;
      if (floor >= 35) numCups = 8;
      else if (floor >= 25) numCups = 7;
      else if (floor >= 16) numCups = 6;
      else if (floor >= 9) numCups = 5;
      else if (floor >= 4) numCups = 4;

      // Swaps scale with floors
      const numSwaps = 4 + Math.floor(floor * 0.75);

      // Speed scaling: Floor 1 starts at normal 400ms speed. Subsequent floors get faster with NO LIMIT!
      let swapDuration = floor === 1 ? 400 : Math.max(25, 400 - Math.floor((floor - 1) * 12));

      // Apply Time Slow passive if active
      if (this.roundPassives.timeSlow) {
        swapDuration = Math.round(swapDuration * 1.85);
      }

      return {
        mode: 'tower',
        floor,
        numCups,
        numSwaps,
        swapDuration,
        coinReward: 10 + (floor * 3),
        trophyReward: 0,
        isMilestone: floor % 5 === 0
      };
    }

    // Standard Journey Mode
    const trophies = window.economy.trophies;
    const world = this.getCurrentWorld();
    const mode = this.difficultyMode;
    
    const numCups = (mode === 'hard') ? (3 + (world.tier || 0)) : world.baseCups;

    let baseSwaps = 4;
    let baseDuration = 480;
    let coinReward = 10;
    let trophyReward = 1;

    if (mode === 'easy') {
      baseSwaps = 4 + Math.floor(trophies * 0.1);
      baseDuration = Math.max(300, 520 - Math.min(200, trophies * 2.2));
      coinReward = 10;
      trophyReward = 1;
    } else if (mode === 'normal') {
      baseSwaps = 7 + Math.floor(trophies * 0.15);
      baseDuration = Math.max(190, 380 - Math.min(180, trophies * 2.8));
      coinReward = 15;
      trophyReward = 1;
    } else if (mode === 'hard') {
      baseSwaps = 10 + Math.floor(trophies * 0.2);
      baseDuration = Math.max(115, 260 - Math.min(140, trophies * 3.2));
      coinReward = 25;
      trophyReward = 2;
    }

    const numSwaps = Math.min(20, baseSwaps);
    let swapDuration = baseDuration;

    if (this.roundPassives.timeSlow) {
      swapDuration = Math.round(swapDuration * 1.85);
    }

    return {
      mode,
      trophies,
      numCups,
      numSwaps,
      swapDuration,
      coinReward,
      trophyReward,
      isMilestone: (trophies + 1) % 20 === 0 || (trophies + 2) % 20 === 0
    };
  }

  getTowerEffectsForFloor(floor) {
    const catalog = window.TOWER_EFFECT_CATALOG || [
      { id: 'meteors', name: 'Meteors', fullName: 'Blazing Meteors', icon: '☄️' },
      { id: 'sandstorm', name: 'Sandstorm', fullName: 'Desert Sandstorm', icon: '🌪️' },
      { id: 'leaves', name: 'Canopy Leaves', fullName: 'Swirling Leaves', icon: '🍃' },
      { id: 'fish', name: 'Swimming Fish', fullName: 'Marine Fish', icon: '🐟' },
      { id: 'clouds', name: 'Cloud Banks', fullName: 'Drifting Clouds', icon: '☁️' },
      { id: 'asteroids', name: 'Asteroids', fullName: 'Cosmic Asteroids', icon: '🪨' },
      { id: 'jellyfish', name: 'Jellyfish', fullName: 'Glowing Jellyfish', icon: '🪼' },
      { id: 'bubbles', name: 'Bubbles', fullName: 'Rising Bubbles', icon: '🫧' },
      { id: 'dustDevils', name: 'Dust Devils', fullName: 'Dust Devils', icon: '🌀' },
      { id: 'tumbleweeds', name: 'Tumbleweeds', fullName: 'Tumbleweeds', icon: '🌾' },
      { id: 'bats', name: 'Jungle Bats', fullName: 'Jungle Bats', icon: '🦇' },
      { id: 'birds', name: 'Sky Birds', fullName: 'Sky Birds', icon: '🦅' }
    ];

    // Scaling effect combinations across floors:
    // Floor 1: 1 clear introductory effect
    // Floors 2-4: 1 to 2 random effects
    // Floors 5-8: 2 distinct simultaneous effects (e.g. Level 5: Meteors & Sandstorm, Level 6: Leaves & Fish)
    // Floors 9-14: 2 to 3 distinct effects
    // Floors 15-24: 3 to 4 distinct effects
    // Floors 25+: 4 to 5 simultaneous multi-world storm effects!
    let count = 1;
    if (floor >= 25) count = Math.min(5, 3 + Math.floor((floor - 25) / 8));
    else if (floor >= 15) count = 3 + (Math.random() > 0.5 ? 1 : 0);
    else if (floor >= 9) count = 2 + (Math.random() > 0.4 ? 1 : 0);
    else if (floor >= 5) count = 2;
    else if (floor >= 2) count = Math.random() > 0.4 ? 2 : 1;
    else count = 1;

    const shuffled = [...catalog].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  formatEffectsLabel(effects) {
    if (!effects || effects.length === 0) return 'Clear View';
    if (effects.length === 1) return `${effects[0].icon} ${effects[0].fullName}`;
    if (effects.length === 2) return `${effects[0].icon} ${effects[0].name} & ${effects[1].icon} ${effects[1].name}`;
    const allExceptLast = effects.slice(0, -1).map(e => `${e.icon} ${e.name}`).join(', ');
    const last = effects[effects.length - 1];
    return `${allExceptLast} & ${last.icon} ${last.name}`;
  }

  formatEffectsShort(effects) {
    if (!effects || effects.length === 0) return 'Ascending...';
    return effects.map(e => `${e.icon} ${e.name}`).join(' + ');
  }

  setupArena() {
    if (!this.cupsContainer) return;
    this.cupsContainer.innerHTML = '';
    this.cupPositions = [];
    this.selectedCups = [];

    const diff = this.getDifficulty();
    const world = this.getCurrentWorld();

    this.updateDifficultySelectorUI();
    document.querySelectorAll('.diff-btn').forEach(b => b.disabled = false);

    const arenaWidth = this.cupsContainer.clientWidth || 360;
    const spacing = Math.min(105, arenaWidth / (diff.numCups + 0.3));
    const startX = -((diff.numCups - 1) * spacing) / 2;
    const cupScale = diff.numCups > 4 ? Math.max(0.60, 4.2 / diff.numCups) : 1;

    for (let i = 0; i < diff.numCups; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'cup-slot';
      slotEl.dataset.cupId = i;
      
      const xPos = startX + i * spacing;
      slotEl.style.transform = `translateX(${xPos}px) scale(${cupScale})`;

      const svgMarkup = world.id === 'tower' 
        ? this.getRainbowKeySVG(i, diff.numCups)
        : this.getContainerSVG(world.containerType);

      slotEl.innerHTML = `
        <div class="cup-shadow"></div>
        <div class="cup-body">
          ${svgMarkup}
        </div>
      `;

      slotEl.addEventListener('click', () => this.handleCupClick(i));

      this.cupsContainer.appendChild(slotEl);

      this.cupPositions.push({
        id: i,
        logicalIndex: i,
        xOffset: xPos,
        element: slotEl,
        hasGem: false
      });
    }

    // Set status bar
    if (this.gameMode === 'tower') {
      this.towerCurrentEffects = this.getTowerEffectsForFloor(this.towerFloor);
      const effectsLabel = this.formatEffectsLabel(this.towerCurrentEffects);
      this.setStatus(`Floor ${this.towerFloor}`, `Track the Prismatic Keystone! (${effectsLabel})`);
      this.updateMainButton(`Ascend Floor ${this.towerFloor}`, () => this.startRound());
    } else {
      const hazardHint = diff.mode === 'hard' ? `⚠️ Hazard: ${world.hazardName}` : `Track the hidden ${world.gemName}!`;
      this.setStatus("Ready for Challenge", hazardHint);
      this.updateMainButton("Start Round", () => this.startRound());
    }
  }

  setStatus(title, subtitle) {
    if (this.statusTitle) this.statusTitle.textContent = title;
    if (this.statusSubtitle) this.statusSubtitle.textContent = subtitle;
  }

  updateMainButton(text, onClick, disabled = false) {
    if (!this.primaryBtn) return;
    this.primaryBtn.textContent = text;
    this.primaryBtn.disabled = disabled;
    this.primaryBtn.onclick = onClick;
  }

  applyXRayEffect() {
    if (this.roundPassives.xray) {
      this.cupPositions.forEach(cup => {
        if (cup.hasGem) {
          cup.element.classList.add('xray');
        }
      });
    }
  }

  // Start round animation sequence
  async startRound() {
    if (this.state !== 'IDLE' && this.state !== 'ROUND_OVER') return;

    // 1. Evaluate and activate ready passives for this round
    const activePassives = window.economy.evaluateRoundStartPassives();
    this.roundPassives = {
      xray: activePassives.some(p => p.id === 'xray'),
      doublePick: activePassives.some(p => p.id === 'doublePick'),
      timeSlow: activePassives.some(p => p.id === 'timeSlow'),
      oracle: activePassives.some(p => p.id === 'oracle'),
      shield: activePassives.some(p => p.id === 'shield'),
      midas: activePassives.some(p => p.id === 'midas')
    };

    // Play fanfare if passives procced
    if (activePassives.length > 0) {
      window.soundEngine.playPassiveProc();
      const names = activePassives.map(p => `${p.icon} ${p.name}`).join(' & ');
      window.ui.showToast(`✨ PASSIVE TRIGGERED: ${names}!`);
    }

    window.economy.updateHUD();

    this.state = 'REVEAL_START';
    this.selectedCups = [];
    this.updateMainButton("Observing...", null, true);
    document.querySelectorAll('.diff-btn').forEach(b => b.disabled = true);

    const diff = this.getDifficulty();
    const world = this.getCurrentWorld();

    // Trigger Visual Hazard Engine
    if (this.gameMode === 'tower') {
      if (!this.towerCurrentEffects || this.towerCurrentEffects.length === 0) {
        this.towerCurrentEffects = this.getTowerEffectsForFloor(this.towerFloor);
      }
      const effectIds = this.towerCurrentEffects.map(e => e.id);
      if (window.hazardEngine) {
        window.hazardEngine.startTower(effectIds, this.towerFloor);
      }
    } else {
      if (window.hazardEngine) {
        window.hazardEngine.start(world.id, diff.mode);
      }
    }

    if (diff.mode === 'hard' || this.gameMode === 'tower') {
      window.soundEngine.playHazardWhoosh();
    }

    // 1. Pick target gem cup
    this.cupPositions.forEach(c => {
      c.hasGem = false;
      c.element.classList.remove('lifted', 'xray', 'picked', 'eliminated');
      const oldGem = c.element.querySelector('.target-item');
      if (oldGem) oldGem.remove();
    });

    const targetPos = Math.floor(Math.random() * this.cupPositions.length);
    const targetCup = this.cupPositions[targetPos];
    targetCup.hasGem = true;

    // Attach gem element
    const gemEl = document.createElement('div');
    gemEl.className = 'target-item';
    gemEl.innerHTML = `<div class="target-item-inner"></div>`;
    targetCup.element.appendChild(gemEl);

    // 2. Lift target cup to reveal gem
    let revealSubtitle = `The ${world.gemName} is here!`;
    if (this.gameMode === 'tower') {
      const effectsLabel = this.formatEffectsLabel(this.towerCurrentEffects);
      revealSubtitle = `Floor ${this.towerFloor}: Watch the key! (${effectsLabel})`;
    } else if (diff.mode === 'hard') {
      revealSubtitle += ` (⚠️ ${world.hazardName} Intense!)`;
    } else if (diff.mode === 'normal') {
      revealSubtitle += ` (${world.hazardName})`;
    }
    this.setStatus("Watch Carefully!", revealSubtitle);
    window.soundEngine.playCupLift();
    window.soundEngine.playGemReveal();
    targetCup.element.classList.add('lifted');

    await this.sleep(1200);

    // 3. Lower cup down
    window.soundEngine.playCupPlace();
    targetCup.element.classList.remove('lifted');

    await this.sleep(400);

    // 4. Begin Shuffling
    this.state = 'SHUFFLING';
    let shuffleSubtitle = `Mode: ${diff.mode.toUpperCase()}`;
    if (this.gameMode === 'tower') {
      const effectsShort = this.formatEffectsShort(this.towerCurrentEffects);
      shuffleSubtitle = `🗼 Floor ${this.towerFloor} • ${effectsShort}`;
    }
    if (this.roundPassives.timeSlow) {
      shuffleSubtitle += ` ⏳ Time Slow Active!`;
    } else if (this.gameMode !== 'tower') {
      if (diff.mode === 'hard') {
        shuffleSubtitle += ` ⚠️ ${world.hazardName}`;
      } else if (diff.mode === 'normal') {
        shuffleSubtitle += ` (${world.hazardName})`;
      }
    }
    this.setStatus("Shuffling...", diff.isMilestone ? "⚡ HIGH STAKES ROUND! ⚡" : shuffleSubtitle);

    await this.executeShuffles(diff.numSwaps, diff.swapDuration);

    // 5. Oracle Vision Passive Proc: Eliminate 1 empty container
    if (this.roundPassives.oracle) {
      const nonGemCups = this.cupPositions.filter(c => !c.hasGem && !c.element.classList.contains('eliminated'));
      if (nonGemCups.length > 0) {
        const eliminatedCup = nonGemCups[Math.floor(Math.random() * nonGemCups.length)];
        eliminatedCup.element.classList.add('eliminated', 'lifted');
        window.soundEngine.playOracleEliminate();
        window.ui.showToast("🔮 ORACLE VISION: 1 fake container eliminated!");
        await this.sleep(600);
      }
    }

    // 6. Guessing Phase
    this.state = 'GUESSING';
    if (this.roundPassives.xray) {
      this.applyXRayEffect();
    }
    
    let guessSubtitle = this.gameMode === 'tower' ? "Choose the key unlocking the Keystone!" : "Tap the container with the hidden gem!";
    if (this.roundPassives.xray) {
      guessSubtitle = "👁️ X-Ray Passive: Glowing through the container!";
    } else if (this.roundPassives.oracle) {
      guessSubtitle = "🔮 Oracle Vision: 1 fake eliminated!";
    } else if (this.roundPassives.doublePick) {
      guessSubtitle = "✌️ Double Pick Passive: You get 2 guesses!";
    } else if (this.roundPassives.shield) {
      guessSubtitle = "🛡️ Aegis Shield Active: Penalty protected!";
    } else if (this.roundPassives.midas) {
      guessSubtitle = "💰 Midas Surge Active: 3x Coin Rewards on win!";
    }
    this.setStatus("Where is it?", guessSubtitle);
    this.updateMainButton("Make Your Choice", null, true);
  }

  async executeShuffles(totalSwaps, duration) {
    const arenaWidth = this.cupsContainer.clientWidth || 360;
    const count = this.cupPositions.length;
    const spacing = Math.min(105, arenaWidth / (count + 0.3));
    const startX = -((count - 1) * spacing) / 2;
    const cupScale = count > 4 ? Math.max(0.60, 4.2 / count) : 1;

    for (let s = 0; s < totalSwaps; s++) {
      const i = Math.floor(Math.random() * count);
      let j = Math.floor(Math.random() * count);
      while (j === i) {
        j = Math.floor(Math.random() * count);
      }

      const cupA = this.cupPositions[i];
      const cupB = this.cupPositions[j];

      const newPosA = startX + j * spacing;
      const newPosB = startX + i * spacing;

      cupA.element.style.transition = `transform ${duration}ms cubic-bezier(0.45, 0.05, 0.55, 0.95)`;
      cupB.element.style.transition = `transform ${duration}ms cubic-bezier(0.45, 0.05, 0.55, 0.95)`;

      const yOffsetA = (i % 2 === 0) ? -18 : 18;
      const yOffsetB = -yOffsetA;

      cupA.element.style.transform = `translate(${newPosA}px, ${yOffsetA}px) scale(${cupScale})`;
      cupB.element.style.transform = `translate(${newPosB}px, ${yOffsetB}px) scale(${cupScale})`;

      window.soundEngine.playShuffleWhoosh();

      await this.sleep(Math.round(duration * 0.6));

      cupA.element.style.transform = `translateX(${newPosA}px) scale(${cupScale})`;
      cupB.element.style.transform = `translateX(${newPosB}px) scale(${cupScale})`;

      this.cupPositions[i] = cupB;
      this.cupPositions[j] = cupA;

      await this.sleep(Math.round(duration * 0.4));
    }
  }

  // Handle player tapping a cup
  async handleCupClick(slotId) {
    if (this.state !== 'GUESSING') return;

    const cup = this.cupPositions.find(c => c.id === slotId);
    if (!cup || this.selectedCups.includes(cup) || cup.element.classList.contains('eliminated')) return;

    this.selectedCups.push(cup);
    cup.element.classList.add('picked', 'lifted');
    window.soundEngine.playCupLift();

    if (cup.hasGem) {
      // WIN!
      this.state = 'ROUND_OVER';
      if (window.hazardEngine) window.hazardEngine.stop();

      window.soundEngine.playWin();
      window.soundEngine.playCoin();
      if (window.particleEngine) {
        window.particleEngine.triggerConfetti(65);
      }

      const diff = this.getDifficulty();
      const isMidas = this.roundPassives.midas;
      const totalCoins = isMidas ? diff.coinReward * 3 : diff.coinReward;

      if (isMidas) {
        window.soundEngine.playMidasSurge();
        this.triggerFloatingCoins(cup.element, `+${totalCoins} Coins (3x MIDAS! 💰)`);
        window.ui.showToast(`💰 MIDAS SURGE: Tripled Coins to +${totalCoins}!`);
      } else {
        this.triggerFloatingCoins(cup.element, `+${totalCoins} Coins`);
      }

      if (this.gameMode === 'tower') {
        const clearedFloor = this.towerFloor;
        this.towerFloor += 1;
        const best = window.economy.recordTowerFloor(this.towerFloor);
        window.economy.addCoins(totalCoins);

        this.setStatus(`🎉 Floor ${clearedFloor} Conquered!`, `+${totalCoins} Coins won! Best: Floor ${best}`);
        this.updateDifficultySelectorUI();
        this.resetRoundPassives();
        window.economy.onRoundCompleted();
        this.updateMainButton(`Ascend to Floor ${this.towerFloor}`, () => this.setupAndStartNext());
      } else {
        const oldWorld = this.currentWorldId;
        const newTrophies = window.economy.addTrophy(diff.trophyReward, totalCoins);

        this.setStatus("🎉 Brilliant Guess!", `+${diff.trophyReward} Trophy & +${totalCoins} Coins won!`);
        
        // Check for World Milestone Unlock!
        const newWorld = this.getCurrentWorld();
        if (newWorld.id !== oldWorld) {
          window.ui.showWorldUnlockModal(newWorld);
        }

        // Check Grand Victory at 100 trophies!
        if (newTrophies >= 100) {
          window.ui.showGrandVictoryModal();
        }

        window.economy.onRoundCompleted();
        this.resetRoundPassives();
        this.updateMainButton("Next Round", () => this.setupAndStartNext());
      }
    } else {
      // If double pick is active and this was pick 1
      if (this.roundPassives.doublePick && this.selectedCups.length === 1) {
        this.setStatus("Almost!", "✌️ Double Pick: Try 1 more container!");
        return;
      }

      // Check Aegis Shield Loss Protection
      if (this.roundPassives.shield) {
        this.state = 'ROUND_OVER';
        if (window.hazardEngine) window.hazardEngine.stop();

        window.soundEngine.playShieldBlock();
        window.ui.showToast("🛡️ AEGIS SHIELD ACTIVATED: Streak & Trophies Protected!");

        // Reveal winning cup
        const winnerCup = this.cupPositions.find(c => c.hasGem);
        if (winnerCup) {
          winnerCup.element.classList.add('lifted');
        }

        if (this.gameMode === 'tower') {
          this.setStatus(`🛡️ Shield Protected!`, `Floor ${this.towerFloor} mistake absorbed! Try again without losing your streak.`);
          this.updateDifficultySelectorUI();
          window.economy.onRoundCompleted();
          this.resetRoundPassives();
          this.updateMainButton(`Retry Floor ${this.towerFloor}`, () => this.setupAndStartNext());
        } else {
          this.setStatus("🛡️ Shield Protected!", "Aegis Shield absorbed the failure! Win streak & Trophies preserved.");
          window.economy.onRoundCompleted();
          this.resetRoundPassives();
          this.updateMainButton("Next Round", () => this.setupAndStartNext());
        }
        return;
      }

      // Normal LOSS without shield
      this.state = 'ROUND_OVER';
      if (window.hazardEngine) window.hazardEngine.stop();

      window.soundEngine.playLoss();

      if (this.gameMode === 'tower') {
        const best = window.economy.recordTowerFloor(this.towerFloor);
        this.setStatus(`💀 Defeated on Floor ${this.towerFloor}!`, `Best Floor Record: ${best}`);

        // Reveal actual winning key
        const winnerCup = this.cupPositions.find(c => c.hasGem);
        if (winnerCup) {
          winnerCup.element.classList.add('lifted');
        }

        window.ui.showTowerGameOverModal(this.towerFloor, best);
        this.towerFloor = 1;
        window.economy.onRoundCompleted();
        this.resetRoundPassives();
        this.updateMainButton("Ascend Again (Floor 1)", () => this.setupAndStartNext());
      } else {
        const lossResult = window.economy.recordLoss();

        if (lossResult.lostTrophy) {
          this.triggerFloatingPenalty(cup.element, "-1 Trophy 🏆");
          this.setStatus("Missed it!", "Incorrect guess — Lost 1 Trophy!");
        } else {
          this.setStatus("Missed it!", "The gem was in another cup!");
        }

        this.syncWorld();

        // Reveal actual target cup
        const winnerCup = this.cupPositions.find(c => c.hasGem);
        if (winnerCup) {
          winnerCup.element.classList.add('lifted');
        }

        window.economy.onRoundCompleted();
        this.resetRoundPassives();
        this.updateMainButton("Try Again", () => this.setupAndStartNext());
      }
    }
  }

  resetRoundPassives() {
    this.roundPassives = {
      xray: false,
      doublePick: false,
      timeSlow: false,
      oracle: false,
      shield: false,
      midas: false
    };
    document.querySelectorAll('.diff-btn').forEach(b => b.disabled = false);
  }

  setupAndStartNext() {
    this.syncWorld();
    this.setupArena();
    this.startRound();
  }

  triggerFloatingCoins(parentEl, text) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-coin-popup';
    floatEl.textContent = text;
    parentEl.appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 1200);
  }

  triggerFloatingPenalty(parentEl, text) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-penalty-popup';
    floatEl.textContent = text;
    parentEl.appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 1200);
  }

  bindEvents() {
    // Difficulty Mode Buttons (Easy, Normal, Hard)
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.diff;
        if (mode) this.setDifficultyMode(mode);
      });
    });

    // Game Mode Switcher Tab/Buttons
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMode = btn.dataset.mode;
        if (targetMode) this.setGameMode(targetMode);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global instance
window.game = new ShellGame();
