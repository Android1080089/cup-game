/**
 * Shell Quest - Main Application Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Particles & Hazard Engines
  if (window.particleEngine) {
    window.particleEngine.init();
  }
  if (window.hazardEngine) {
    window.hazardEngine.init();
  }

  // 2. Initialize UI Engine
  if (window.ui) {
    window.ui.init();
  }

  // 3. Initialize Economy & State
  if (window.economy) {
    window.economy.updateHUD();
  }

  // 4. Initialize Game Stage
  if (window.game) {
    window.game.init();
  }

  // First User Gesture Audio Unlock
  const unlockAudio = () => {
    if (window.soundEngine) {
      window.soundEngine.init();
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  console.log("🌟 Shell Quest initialized successfully!");
});
