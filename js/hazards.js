/**
 * Shell Quest - Hard Mode & Endless Dark Tower Visual Hazard & Vision Obstruction Engine
 * Renders themed atmospheric obstacles (sandstorms, swimming fish, asteroids, clouds, leaf storms, meteors)
 * that dynamically pass in front of cups to test the player's tracking skills.
 */

const TOWER_EFFECT_CATALOG = [
  { id: 'meteors', name: 'Meteors', fullName: 'Blazing Meteors', icon: '☄️', category: 'victory' },
  { id: 'sandstorm', name: 'Sandstorm', fullName: 'Desert Sandstorm', icon: '🌪️', category: 'desert' },
  { id: 'leaves', name: 'Canopy Leaves', fullName: 'Swirling Leaves', icon: '🍃', category: 'jungle' },
  { id: 'fish', name: 'Swimming Fish', fullName: 'Marine Fish', icon: '🐟', category: 'ocean' },
  { id: 'clouds', name: 'Cloud Banks', fullName: 'Drifting Clouds', icon: '☁️', category: 'sky' },
  { id: 'asteroids', name: 'Asteroids', fullName: 'Cosmic Asteroids', icon: '🪨', category: 'victory' },
  { id: 'jellyfish', name: 'Jellyfish', fullName: 'Glowing Jellyfish', icon: '🪼', category: 'ocean' },
  { id: 'bubbles', name: 'Bubbles', fullName: 'Rising Bubbles', icon: '🫧', category: 'ocean' },
  { id: 'dustDevils', name: 'Dust Devils', fullName: 'Dust Devils', icon: '🌀', category: 'desert' },
  { id: 'tumbleweeds', name: 'Tumbleweeds', fullName: 'Tumbleweeds', icon: '🌾', category: 'desert' },
  { id: 'bats', name: 'Jungle Bats', fullName: 'Jungle Bats', icon: '🦇', category: 'jungle' },
  { id: 'birds', name: 'Sky Birds', fullName: 'Sky Birds', icon: '🦅', category: 'sky' }
];

class HazardEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.active = false;
    this.currentWorld = 'ocean';
    this.difficultyMode = 'normal';
    this.width = 0;
    this.height = 0;
    this.animationFrame = null;
    this.opacity = 0;
    this.targetOpacity = 0;

    // Active Endless Tower Effects
    this.towerActiveEffects = [];
    this.towerFloor = 1;

    // Obstacle pools
    this.fishList = [];
    this.jellyfishList = [];
    this.bubblesList = [];
    this.sandParticles = [];
    this.dustDevils = [];
    this.tumbleweeds = [];
    this.cloudBanks = [];
    this.skyBirds = [];
    this.jungleLeaves = [];
    this.jungleBats = [];
    this.asteroids = [];
    this.meteors = [];

    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);
  }

  init() {
    this.canvas = document.getElementById('hazard-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  handleResize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  setWorld(worldId, mode = 'normal') {
    this.currentWorld = worldId;
    this.difficultyMode = mode;
    this.resetObstaclePools();
  }

  start(worldId = 'ocean', mode = 'normal') {
    this.setWorld(worldId, mode);
    this.active = true;
    
    // Set target opacity based on difficulty
    if (mode === 'easy') {
      this.targetOpacity = 0.55;
    } else if (mode === 'normal') {
      this.targetOpacity = 0.8;
    } else {
      this.targetOpacity = 1.0;
    }

    this.handleResize();

    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(this.loop);
    }
  }

  startTower(effectIds = [], floor = 1) {
    this.currentWorld = 'tower';
    this.towerActiveEffects = effectIds;
    this.towerFloor = floor;
    this.active = true;
    this.targetOpacity = 0.95;

    this.resetObstaclePools();
    this.handleResize();

    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(this.loop);
    }
  }

  stop() {
    this.targetOpacity = 0.0;
  }

  clearPools() {
    this.fishList = [];
    this.jellyfishList = [];
    this.bubblesList = [];
    this.sandParticles = [];
    this.dustDevils = [];
    this.tumbleweeds = [];
    this.cloudBanks = [];
    this.skyBirds = [];
    this.jungleLeaves = [];
    this.jungleBats = [];
    this.asteroids = [];
    this.meteors = [];
  }

  resetObstaclePools() {
    this.clearPools();
    const mode = this.difficultyMode || 'normal';

    // Speed multiplier by mode (calm, steady, enjoyable pacing)
    const speedMult = mode === 'easy' ? 0.45 : (mode === 'normal' ? 0.75 : 1.05);

    switch (this.currentWorld) {
      case 'ocean': {
        const fishCount = mode === 'easy' ? 1 : (mode === 'normal' ? 3 : 7);
        this.spawnFish(fishCount, speedMult);

        const jellyCount = mode === 'easy' ? 0 : (mode === 'normal' ? 1 : 3);
        this.spawnJellyfish(jellyCount, speedMult);

        const bubbleCount = mode === 'easy' ? 5 : (mode === 'normal' ? 10 : 18);
        this.spawnBubbles(bubbleCount, speedMult);
        break;
      }

      case 'desert': {
        const sandCount = mode === 'easy' ? 14 : (mode === 'normal' ? 40 : 95);
        this.spawnSandParticles(sandCount, speedMult);

        const devilCount = mode === 'easy' ? 0 : (mode === 'normal' ? 1 : 2);
        this.spawnDustDevils(devilCount, speedMult);

        const weedCount = mode === 'easy' ? 0 : (mode === 'normal' ? 1 : 2);
        this.spawnTumbleweeds(weedCount, speedMult);
        break;
      }

      case 'sky': {
        const cloudCount = mode === 'easy' ? 1 : (mode === 'normal' ? 2 : 4);
        this.spawnCloudBanks(cloudCount, speedMult);

        const birdCount = mode === 'easy' ? 1 : (mode === 'normal' ? 2 : 3);
        this.spawnSkyBirds(birdCount, speedMult);
        break;
      }

      case 'jungle': {
        const leafCount = mode === 'easy' ? 4 : (mode === 'normal' ? 10 : 22);
        this.spawnJungleLeaves(leafCount, speedMult);

        const batCount = mode === 'easy' ? 0 : (mode === 'normal' ? 1 : 2);
        this.spawnJungleBats(batCount, speedMult);
        break;
      }

      case 'victory': {
        const astCount = mode === 'easy' ? 1 : (mode === 'normal' ? 2 : 4);
        this.spawnAsteroids(astCount, speedMult);

        const meteorCount = mode === 'easy' ? 0 : (mode === 'normal' ? 1 : 2);
        this.spawnMeteors(meteorCount, speedMult);
        break;
      }

      case 'tower': {
        // Endless Dark Tower dynamic multi-effect combinations
        const activeEffects = this.towerActiveEffects || [];
        if (activeEffects.length === 0) break;

        const floor = this.towerFloor || 1;
        const hazardScale = Math.max(0, floor - 1);
        const towerSpeed = 0.55 + Math.min(0.65, hazardScale * 0.016);
        const intensityFactor = 1 / Math.sqrt(activeEffects.length);

        activeEffects.forEach(effectId => {
          switch (effectId) {
            case 'meteors':
              this.spawnMeteors(Math.max(1, Math.round(2 * intensityFactor)), towerSpeed);
              break;
            case 'sandstorm':
              this.spawnSandParticles(Math.max(12, Math.round(45 * intensityFactor)), towerSpeed);
              break;
            case 'leaves':
              this.spawnJungleLeaves(Math.max(4, Math.round(14 * intensityFactor)), towerSpeed);
              break;
            case 'fish':
              this.spawnFish(Math.max(2, Math.round(6 * intensityFactor)), towerSpeed);
              break;
            case 'clouds':
              this.spawnCloudBanks(Math.max(1, Math.round(3 * intensityFactor)), towerSpeed);
              break;
            case 'asteroids':
              this.spawnAsteroids(Math.max(1, Math.round(3 * intensityFactor)), towerSpeed);
              break;
            case 'jellyfish':
              this.spawnJellyfish(Math.max(1, Math.round(2 * intensityFactor)), towerSpeed);
              break;
            case 'bubbles':
              this.spawnBubbles(Math.max(5, Math.round(14 * intensityFactor)), towerSpeed);
              break;
            case 'dustDevils':
              this.spawnDustDevils(1, towerSpeed);
              break;
            case 'tumbleweeds':
              this.spawnTumbleweeds(Math.max(1, Math.round(2 * intensityFactor)), towerSpeed);
              break;
            case 'bats':
              this.spawnJungleBats(Math.max(1, Math.round(2 * intensityFactor)), towerSpeed);
              break;
            case 'birds':
              this.spawnSkyBirds(Math.max(1, Math.round(2 * intensityFactor)), towerSpeed);
              break;
          }
        });
        break;
      }
    }
  }

  // =========================================================================
  // SPAWN HELPERS FOR ATOMIC HAZARD EFFECTS
  // =========================================================================
  spawnFish(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      const dir = Math.random() > 0.4 ? 1 : -1;
      this.fishList.push({
        x: dir === 1 ? -60 - Math.random() * 200 : w + 60 + Math.random() * 200,
        y: 35 + Math.random() * (h - 80),
        vx: (0.7 + Math.random() * 0.9) * dir * speedMult,
        vy: 0,
        dir: dir,
        length: 24 + Math.random() * 22,
        height: 11 + Math.random() * 11,
        species: Math.floor(Math.random() * 3),
        color: ['#00f5d4', '#ffd166', '#f72585', '#4cc9f0', '#a855f7'][Math.floor(Math.random() * 5)],
        finPhase: Math.random() * Math.PI * 2,
        finSpeed: (0.10 + Math.random() * 0.08) * speedMult,
        yWobble: Math.random() * Math.PI * 2,
        wobbleSpeed: (0.03 + Math.random() * 0.02) * speedMult
      });
    }
  }

  spawnJellyfish(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.jellyfishList.push({
        x: Math.random() * w,
        y: h + Math.random() * 100,
        vy: -(0.3 + Math.random() * 0.35) * speedMult,
        vx: (Math.random() - 0.5) * 0.2 * speedMult,
        size: 20 + Math.random() * 16,
        pulse: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? 'rgba(0, 245, 212, 0.45)' : 'rgba(247, 37, 133, 0.45)'
      });
    }
  }

  spawnBubbles(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.bubblesList.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: -(0.6 + Math.random() * 0.9) * speedMult,
        radius: 2 + Math.random() * 5,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  spawnSandParticles(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.sandParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (1.8 + Math.random() * 2.2) * speedMult,
        vy: (Math.random() - 0.5) * 0.6 * speedMult,
        length: 7 + Math.random() * 16,
        thickness: 0.9 + Math.random() * 1.4,
        color: Math.random() > 0.4 ? '#ffb703' : (Math.random() > 0.5 ? '#ffd166' : '#fb8500'),
        alpha: 0.2 + Math.random() * 0.3
      });
    }
  }

  spawnDustDevils(count, speedMult) {
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.dustDevils.push({
        x: -60 - i * 220,
        y: h * 0.5,
        vx: (0.7 + Math.random() * 0.5) * speedMult,
        width: 35 + Math.random() * 20,
        height: h * 0.85,
        spin: 0,
        spinSpeed: 0.12 * speedMult
      });
    }
  }

  spawnTumbleweeds(count, speedMult) {
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.tumbleweeds.push({
        x: -80 - i * 250,
        y: h - 55,
        vx: (1.2 + Math.random() * 0.7) * speedMult,
        vy: 0,
        bouncePhase: 0,
        radius: 14 + Math.random() * 6,
        rotation: 0,
        rotSpeed: 0.05 * speedMult
      });
    }
  }

  spawnCloudBanks(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.cloudBanks.push({
        x: -120 + i * (w / Math.max(1, count)) + Math.random() * 40,
        y: 40 + Math.random() * (h - 100),
        vx: (0.25 + Math.random() * 0.3) * speedMult,
        width: 100 + Math.random() * 50,
        height: 45 + Math.random() * 20,
        alpha: 0.35 + Math.random() * 0.2,
        color: i % 2 === 0 ? 'rgba(247, 37, 133, 0.32)' : 'rgba(168, 85, 247, 0.35)'
      });
    }
  }

  spawnSkyBirds(count, speedMult) {
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.skyBirds.push({
        x: -50 - Math.random() * 150,
        y: 30 + Math.random() * (h - 90),
        vx: (1.3 + Math.random() * 0.7) * speedMult,
        vy: (Math.random() - 0.5) * 0.4 * speedMult,
        wingPhase: Math.random() * Math.PI * 2,
        size: 11 + Math.random() * 6
      });
    }
  }

  spawnJungleLeaves(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.jungleLeaves.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (0.8 + Math.random() * 1.0) * speedMult,
        vy: (0.4 + Math.random() * 0.7) * speedMult,
        size: 11 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05 * speedMult,
        leafType: Math.floor(Math.random() * 3),
        color: ['#70e000', '#38b000', '#007200', '#a7c957'][Math.floor(Math.random() * 4)],
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  spawnJungleBats(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.jungleBats.push({
        x: w + 50 + Math.random() * 150,
        y: 30 + Math.random() * (h - 80),
        vx: -(1.3 + Math.random() * 0.7) * speedMult,
        vy: (Math.random() - 0.5) * 0.6 * speedMult,
        wingPhase: Math.random() * Math.PI * 2,
        size: 13 + Math.random() * 6
      });
    }
  }

  spawnAsteroids(count, speedMult) {
    const w = this.width || 360;
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      const dir = Math.random() > 0.3 ? 1 : -1;
      this.asteroids.push({
        x: dir === 1 ? -70 - Math.random() * 150 : w + 70 + Math.random() * 150,
        y: 25 + Math.random() * (h - 70),
        vx: (0.6 + Math.random() * 0.8) * dir * speedMult,
        vy: (Math.random() - 0.5) * 0.35 * speedMult,
        radius: 16 + Math.random() * 16,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025 * speedMult,
        points: this.generateAsteroidPoints(7 + Math.floor(Math.random() * 4)),
        craters: [
          { ox: -0.3, oy: -0.2, r: 0.2 },
          { ox: 0.2, oy: 0.3, r: 0.25 },
          { ox: -0.1, oy: 0.4, r: 0.15 }
        ]
      });
    }
  }

  spawnMeteors(count, speedMult) {
    const h = this.height || 280;
    for (let i = 0; i < count; i++) {
      this.meteors.push({
        x: -80 - Math.random() * 200,
        y: 20 + Math.random() * (h - 90),
        vx: (2.6 + Math.random() * 1.4) * speedMult,
        vy: (0.5 + Math.random() * 0.7) * speedMult,
        size: 4 + Math.random() * 3,
        trailLength: 35 + Math.random() * 25,
        color: '#00f5d4'
      });
    }
  }

  generateAsteroidPoints(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const variation = 0.75 + Math.random() * 0.45;
      pts.push({ angle, rMult: variation });
    }
    return pts;
  }

  loop() {
    if (!this.canvas || !this.ctx) return;

    // Smooth fade in / out transition
    if (this.opacity < this.targetOpacity) {
      this.opacity = Math.min(1.0, this.opacity + 0.05);
    } else if (this.opacity > this.targetOpacity) {
      this.opacity = Math.max(0.0, this.opacity - 0.05);
    }

    if (this.opacity <= 0.001 && this.targetOpacity === 0) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.active = false;
      this.animationFrame = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;

    // Render world hazard
    switch (this.currentWorld) {
      case 'ocean':
        this.renderOceanHazard();
        break;
      case 'desert':
        this.renderDesertHazard();
        break;
      case 'sky':
        this.renderSkyHazard();
        break;
      case 'jungle':
        this.renderJungleHazard();
        break;
      case 'victory':
        this.renderVictoryHazard();
        break;
      case 'tower':
        this.renderTowerHazard();
        break;
    }

    this.ctx.restore();
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  // ==========================================
  // ENDLESS DARK TOWER: MULTI-EFFECT HAZARDS
  // ==========================================
  renderTowerHazard() {
    // Render in depth layers (backgrounds to foregrounds)
    if (this.cloudBanks.length > 0) this.renderCloudBanks();
    if (this.sandParticles.length > 0) this.renderSandParticles();
    if (this.bubblesList.length > 0) this.renderBubbles();
    if (this.jellyfishList.length > 0) this.renderJellyfish();
    if (this.fishList.length > 0) this.renderFish();
    if (this.dustDevils.length > 0) this.renderDustDevils();
    if (this.tumbleweeds.length > 0) this.renderTumbleweeds();
    if (this.jungleLeaves.length > 0) this.renderJungleLeaves();
    if (this.skyBirds.length > 0) this.renderSkyBirds();
    if (this.jungleBats.length > 0) this.renderJungleBats();
    if (this.asteroids.length > 0) this.renderAsteroids();
    if (this.meteors.length > 0) this.renderMeteors();
  }

  // ==========================================
  // WORLD RENDERERS
  // ==========================================
  renderOceanHazard() {
    this.renderBubbles();
    this.renderJellyfish();
    this.renderFish();
  }

  renderDesertHazard() {
    this.renderSandParticles();
    this.renderDustDevils();
    this.renderTumbleweeds();
  }

  renderSkyHazard() {
    this.renderCloudBanks();
    this.renderSkyBirds();
  }

  renderJungleHazard() {
    this.renderJungleLeaves();
    this.renderJungleBats();
  }

  renderVictoryHazard() {
    this.renderMeteors();
    this.renderAsteroids();
  }

  // ==========================================
  // ATOMIC EFFECT RENDER IMPLEMENTATIONS
  // ==========================================
  renderBubbles() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.bubblesList.forEach(b => {
      b.y += b.vy;
      b.wobble += 0.05;
      b.x += Math.sin(b.wobble) * 0.4;

      if (b.y < -20) {
        b.y = h + 20;
        b.x = Math.random() * w;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(0, 245, 212, 0.15)';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.restore();
    });
  }

  renderJellyfish() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.jellyfishList.forEach(j => {
      j.y += j.vy;
      j.x += j.vx;
      j.pulse += 0.06;
      const pulseScale = 1 + Math.sin(j.pulse) * 0.15;

      if (j.y < -60) {
        j.y = h + 60;
        j.x = Math.random() * w;
      }

      ctx.save();
      ctx.translate(j.x, j.y);
      ctx.scale(pulseScale, 1 / pulseScale);

      // Bell
      ctx.beginPath();
      ctx.arc(0, 0, j.size, Math.PI, 0, false);
      ctx.fillStyle = j.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Tentacles
      for (let t = -2; t <= 2; t++) {
        ctx.beginPath();
        ctx.moveTo(t * (j.size / 3), 0);
        const wave = Math.sin(j.pulse + t) * 6;
        ctx.quadraticCurveTo(t * (j.size / 3) + wave, j.size * 0.8, t * (j.size / 3) - wave, j.size * 1.5);
        ctx.strokeStyle = j.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  renderFish() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.fishList.forEach(f => {
      f.x += f.vx;
      f.yWobble += f.wobbleSpeed;
      f.y += Math.sin(f.yWobble) * 0.6;
      f.finPhase += f.finSpeed;

      if (f.dir === 1 && f.x > w + 80) {
        f.x = -80;
        f.y = 35 + Math.random() * (h - 80);
      } else if (f.dir === -1 && f.x < -80) {
        f.x = w + 80;
        f.y = 35 + Math.random() * (h - 80);
      }

      ctx.save();
      ctx.translate(f.x, f.y);
      if (f.dir === -1) {
        ctx.scale(-1, 1);
      }

      // Fish Body
      ctx.beginPath();
      ctx.moveTo(-f.length * 0.5, 0);
      ctx.quadraticCurveTo(0, -f.height * 0.6, f.length * 0.5, 0);
      ctx.quadraticCurveTo(0, f.height * 0.6, -f.length * 0.5, 0);
      ctx.fillStyle = f.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = f.color;
      ctx.fill();

      // Animated Tail Fin
      const tailAngle = Math.sin(f.finPhase) * 0.35;
      ctx.save();
      ctx.translate(-f.length * 0.5, 0);
      ctx.rotate(tailAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-f.length * 0.35, -f.height * 0.6);
      ctx.lineTo(-f.length * 0.25, 0);
      ctx.lineTo(-f.length * 0.35, f.height * 0.6);
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.restore();

      // Eye
      ctx.beginPath();
      ctx.arc(f.length * 0.28, -f.height * 0.15, Math.max(2, f.height * 0.15), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(f.length * 0.3, -f.height * 0.15, Math.max(1, f.height * 0.08), 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      ctx.restore();
    });
  }

  renderSandParticles() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.sandParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x > w + 40) {
        p.x = -40;
        p.y = Math.random() * h;
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.length, p.y + p.vy * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.thickness;
      ctx.globalAlpha = p.alpha * this.opacity;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    });
  }

  renderDustDevils() {
    const ctx = this.ctx;
    const w = this.width;

    this.dustDevils.forEach(d => {
      d.x += d.vx;
      d.spin += d.spinSpeed;

      if (d.x > w + 100) {
        d.x = -100;
      }

      ctx.save();
      ctx.translate(d.x, d.y);
      for (let s = 0; s < 5; s++) {
        const rad = (d.width * 0.5) * (1 + s * 0.2);
        const yOffset = (s - 2) * (d.height / 5);
        const spinAngle = d.spin + s * 0.8;

        ctx.beginPath();
        ctx.ellipse(Math.sin(spinAngle) * 15, yOffset, rad, rad * 0.35, spinAngle * 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 183, 3, 0.28)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  renderTumbleweeds() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.tumbleweeds.forEach(t => {
      t.x += t.vx;
      t.bouncePhase += 0.08;
      t.y = (h - 45) + Math.sin(t.bouncePhase) * 8;
      t.rotation += t.rotSpeed;

      if (t.x > w + 60) {
        t.x = -60;
      }

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);

      ctx.beginPath();
      ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#c48b48';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * t.radius, Math.sin(ang) * t.radius);
        ctx.strokeStyle = '#8d5b2c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  renderCloudBanks() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.cloudBanks.forEach(c => {
      c.x += c.vx;
      if (c.x > w + c.width) {
        c.x = -c.width;
        c.y = 40 + Math.random() * (h - 100);
      }

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = c.color;
      ctx.filter = 'blur(8px)';

      ctx.beginPath();
      ctx.arc(0, 0, c.height * 0.6, 0, Math.PI * 2);
      ctx.arc(c.width * 0.3, -c.height * 0.2, c.height * 0.5, 0, Math.PI * 2);
      ctx.arc(c.width * 0.6, 0, c.height * 0.55, 0, Math.PI * 2);
      ctx.arc(c.width * 0.3, c.height * 0.2, c.height * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderSkyBirds() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.skyBirds.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.wingPhase += 0.2;

      if (b.x > w + 60) {
        b.x = -60;
        b.y = 30 + Math.random() * (h - 90);
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      const wingY = Math.sin(b.wingPhase) * (b.size * 0.7);

      ctx.beginPath();
      ctx.moveTo(-b.size, wingY);
      ctx.quadraticCurveTo(-b.size * 0.5, -b.size * 0.2, 0, 0);
      ctx.quadraticCurveTo(b.size * 0.5, -b.size * 0.2, b.size, wingY);
      ctx.strokeStyle = '#f72585';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    });
  }

  renderJungleLeaves() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.jungleLeaves.forEach(l => {
      l.x += l.vx;
      l.y += l.vy;
      l.rotation += l.rotSpeed;
      l.wobble += 0.05;
      l.x += Math.sin(l.wobble) * 0.8;

      if (l.x > w + 40 || l.y > h + 40) {
        l.x = Math.random() * (w * 0.6) - 40;
        l.y = -30;
      }

      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);

      ctx.beginPath();
      ctx.moveTo(0, -l.size);
      ctx.quadraticCurveTo(l.size * 0.6, 0, 0, l.size);
      ctx.quadraticCurveTo(-l.size * 0.6, 0, 0, -l.size);
      ctx.fillStyle = l.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = l.color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -l.size);
      ctx.lineTo(0, l.size);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    });
  }

  renderJungleBats() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.jungleBats.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.wingPhase += 0.25;

      if (b.x < -60) {
        b.x = w + 60;
        b.y = 30 + Math.random() * (h - 80);
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      const wingFlap = Math.sin(b.wingPhase) * (b.size * 0.6);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-b.size, wingFlap);
      ctx.lineTo(-b.size * 0.5, 0);
      ctx.lineTo(0, b.size * 0.3);
      ctx.lineTo(b.size * 0.5, 0);
      ctx.lineTo(b.size, wingFlap);
      ctx.closePath();
      ctx.fillStyle = '#1b4332';
      ctx.strokeStyle = '#70e000';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  renderMeteors() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.meteors.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;

      if (m.x > w + 100) {
        m.x = -100;
        m.y = 20 + Math.random() * (h - 90);
      }

      ctx.save();
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.trailLength, m.y - m.vy * 6);
      grad.addColorStop(0, '#ffd166');
      grad.addColorStop(0.3, '#f72585');
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.trailLength, m.y - m.vy * 6);
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.size * 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f5d4';
      ctx.fill();
      ctx.restore();
    });
  }

  renderAsteroids() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.rotSpeed;

      if (a.vx > 0 && a.x > w + 80) {
        a.x = -80;
        a.y = 25 + Math.random() * (h - 70);
      } else if (a.vx < 0 && a.x < -80) {
        a.x = w + 80;
        a.y = 25 + Math.random() * (h - 70);
      }

      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);

      ctx.beginPath();
      a.points.forEach((p, idx) => {
        const rad = a.radius * p.rMult;
        const px = Math.cos(p.angle) * rad;
        const py = Math.sin(p.angle) * rad;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();

      const astGrad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, a.radius * 0.1, 0, 0, a.radius);
      astGrad.addColorStop(0, '#5a4d70');
      astGrad.addColorStop(0.7, '#2f2244');
      astGrad.addColorStop(1, '#150d22');
      ctx.fillStyle = astGrad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      a.craters.forEach(cr => {
        ctx.beginPath();
        ctx.arc(cr.ox * a.radius, cr.oy * a.radius, cr.r * a.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 8, 25, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.restore();
    });
  }
}

// Global Hazard Engine & Catalog Export
window.TOWER_EFFECT_CATALOG = TOWER_EFFECT_CATALOG;
window.hazardEngine = new HazardEngine();
