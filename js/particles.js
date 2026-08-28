/**
 * Shell Quest - Canvas Ambient Particle Engine & Confetti System
 */

class ParticleEngine {
  constructor() {
    this.canvas = document.getElementById('particle-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.confettiCanvas = document.getElementById('confetti-canvas');
    this.confettiCtx = this.confettiCanvas ? this.confettiCanvas.getContext('2d') : null;

    this.particles = [];
    this.confettiPieces = [];
    this.currentWorld = 'ocean';
    this.isRunning = false;
    this.width = 0;
    this.height = 0;

    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.getElementById('particle-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    if (!this.confettiCanvas) {
      this.confettiCanvas = document.getElementById('confetti-canvas');
      if (this.confettiCanvas) this.confettiCtx = this.confettiCanvas.getContext('2d');
    }

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.setWorld('ocean');
    
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(this.animate);
    }
  }

  handleResize() {
    const rect = this.canvas?.parentElement?.getBoundingClientRect();
    this.width = rect ? rect.width : window.innerWidth;
    this.height = rect ? rect.height : window.innerHeight;

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    if (this.confettiCanvas) {
      this.confettiCanvas.width = this.width;
      this.confettiCanvas.height = this.height;
    }
  }

  setWorld(worldKey) {
    this.currentWorld = worldKey;
    this.particles = [];
    const count = 35;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createWorldParticle());
    }
  }

  createWorldParticle() {
    const w = this.width || 360;
    const h = this.height || 640;

    switch (this.currentWorld) {
      case 'desert':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2.5 + 1,
          vx: Math.random() * 0.8 + 0.3,
          vy: Math.sin(Math.random() * Math.PI) * 0.4 - 0.2,
          alpha: Math.random() * 0.6 + 0.2,
          color: Math.random() > 0.4 ? '#ffb703' : '#ffd166'
        };
      case 'sky':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.03 + Math.random() * 0.02,
          alpha: Math.random() * 0.7 + 0.2,
          color: Math.random() > 0.5 ? '#f72585' : '#b5179e'
        };
      case 'jungle':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          glow: Math.random() * Math.PI * 2,
          glowSpeed: 0.04 + Math.random() * 0.03,
          alpha: Math.random() * 0.8 + 0.2,
          color: Math.random() > 0.5 ? '#70e000' : '#38b000'
        };
      case 'victory':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2.5 + 0.8,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.05 + Math.random() * 0.04,
          alpha: Math.random() * 0.8 + 0.2,
          color: ['#00f5d4', '#ffd166', '#f72585', '#ffffff'][Math.floor(Math.random() * 4)]
        };
      case 'ocean':
      default:
        return {
          x: Math.random() * w,
          y: Math.random() * h + h,
          size: Math.random() * 4 + 1.5,
          vx: Math.sin(Math.random() * Math.PI * 2) * 0.4,
          vy: -(Math.random() * 0.8 + 0.4),
          wobble: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.5 + 0.2,
          color: '#00f5d4'
        };
    }
  }

  // Trigger celebration confetti explosion
  triggerConfetti(amount = 70) {
    if (!this.confettiCanvas) return;
    const colors = ['#00f5d4', '#ffd166', '#f72585', '#9d4edd', '#4cc9f0', '#70e000'];
    const originX = this.width / 2;
    const originY = this.height * 0.45;

    for (let i = 0; i < amount; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = Math.random() * 10 + 4;
      this.confettiPieces.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 7 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.25,
        friction: 0.96,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.01
      });
    }
  }

  animate() {
    if (!this.isRunning) return;

    // 1. Draw Ambient World Particles
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (this.currentWorld === 'ocean') {
          p.wobble += 0.03;
          p.x += Math.sin(p.wobble) * 0.3;
          if (p.y < -10) {
            p.y = this.height + 10;
            p.x = Math.random() * this.width;
          }
        } else if (this.currentWorld === 'desert') {
          if (p.x > this.width + 10) p.x = -10;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;
        } else {
          if (p.x < 0) p.x = this.width;
          if (p.x > this.width) p.x = 0;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;
        }

        // Draw particle
        this.ctx.save();
        this.ctx.beginPath();

        let currentAlpha = p.alpha;
        if (p.glow !== undefined) {
          p.glow += p.glowSpeed;
          currentAlpha = (Math.sin(p.glow) * 0.4 + 0.5) * p.alpha;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = p.color;
        } else if (p.twinkle !== undefined) {
          p.twinkle += p.twinkleSpeed;
          currentAlpha = (Math.sin(p.twinkle) * 0.4 + 0.5) * p.alpha;
        }

        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    // 2. Draw Confetti Pieces
    if (this.confettiCtx) {
      this.confettiCtx.clearRect(0, 0, this.width, this.height);

      for (let i = this.confettiPieces.length - 1; i >= 0; i--) {
        const c = this.confettiPieces[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity;
        c.vx *= c.friction;
        c.vy *= c.friction;
        c.rotation += c.rotationSpeed;
        c.life -= c.decay;

        if (c.life <= 0 || c.y > this.height + 20) {
          this.confettiPieces.splice(i, 1);
          continue;
        }

        this.confettiCtx.save();
        this.confettiCtx.translate(c.x, c.y);
        this.confettiCtx.rotate((c.rotation * Math.PI) / 180);
        this.confettiCtx.fillStyle = c.color;
        this.confettiCtx.globalAlpha = Math.max(0, c.life);
        this.confettiCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        this.confettiCtx.restore();
      }
    }

    requestAnimationFrame(this.animate);
  }
}

// Global instance
window.particleEngine = new ParticleEngine();
