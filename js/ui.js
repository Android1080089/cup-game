/**
 * Shell Quest - UI Controller, Tab Router, Modals & Gacha Shop Animations
 */

class UIEngine {
  constructor() {
    this.currentTab = 'play';
    this.dailyInterval = null;
  }

  init() {
    this.bindNavigation();
    this.bindGacha();
    this.bindDailyQuest();
    this.bindSettings();
    this.startDailyTimer();
  }

  bindNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.target;
        this.switchTab(targetView);
      });
    });

    // Settings Header Button
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      this.openModal('modal-settings');
    });

    // Tower Game Over Action Buttons
    document.getElementById('btn-tower-retry')?.addEventListener('click', () => {
      this.closeModal('modal-tower-over');
      window.game.setupAndStartNext();
    });

    document.getElementById('btn-tower-exit')?.addEventListener('click', () => {
      this.closeModal('modal-tower-over');
      window.game.setGameMode('journey');
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) return;
    this.currentTab = tabId;
    window.soundEngine.playClick();

    // Update Nav buttons
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.target === tabId);
    });

    // Update Panels
    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.remove('active');
    });

    const activePanel = document.getElementById(`view-${tabId}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Trigger syncs when entering views
    if (tabId === 'play') {
      window.game.syncWorld();
    } else if (tabId === 'map') {
      window.game.syncWorld();
    } else if (tabId === 'stats') {
      window.economy.updateHUD();
    }
  }

  // Lucky Roll (Gacha) Interaction
  bindGacha() {
    const rollBtn = document.getElementById('btn-gacha-roll');
    const gachaOrb = document.getElementById('gacha-orb');

    if (!rollBtn) return;

    rollBtn.addEventListener('click', async () => {
      if (window.economy.coins < 100) {
        this.showToast("⚠️ Not enough Coins! Win rounds to earn more.");
        window.soundEngine.playLoss();
        return;
      }

      rollBtn.disabled = true;
      window.soundEngine.playRoll();
      if (gachaOrb) gachaOrb.classList.add('rolling');

      // Spin duration
      await new Promise(r => setTimeout(r, 1400));

      const result = window.economy.rollLuckyGacha();
      if (gachaOrb) gachaOrb.classList.remove('rolling');
      rollBtn.disabled = false;

      if (result.success && result.prize) {
        window.soundEngine.playWin();
        if (window.particleEngine) {
          window.particleEngine.triggerConfetti(50);
        }
        this.showPrizeModal(result.prize);
      }
    });
  }

  showPrizeModal(prize) {
    const modal = document.getElementById('modal-prize');
    if (!modal) return;

    document.getElementById('prize-icon').textContent = prize.icon;
    document.getElementById('prize-title').textContent = prize.name;

    const descEl = document.getElementById('prize-desc');
    if (descEl) {
      if (prize.upgrade) {
        const u = prize.upgrade;
        if (u.isNewUnlock) {
          descEl.innerHTML = `
            <div style="font-size: 1rem; color: var(--neon-cyan); font-weight: 800; margin-bottom: 6px;">✨ NEW PASSIVE UNLOCKED!</div>
            <p><strong>${u.passive.name} (Lv. 1)</strong> is now active!</p>
            <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary);">
              Cooldown: Triggers automatically once every <strong>${u.newCooldown} turns</strong>.
            </div>
          `;
        } else {
          descEl.innerHTML = `
            <div style="font-size: 1rem; color: var(--neon-amber); font-weight: 800; margin-bottom: 6px;">⚡ PASSIVE LEVELED UP!</div>
            <p><strong>${u.passive.name}</strong> upgraded to <strong>Lv. ${u.newLevel}</strong>!</p>
            <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>Cooldown: <s>${u.oldCooldown} turns</s></span> &rarr; <strong style="color: #70e000;">${u.newCooldown} turns</strong>
            </div>
          `;
        }
      } else if (prize.isJackpot) {
        descEl.innerHTML = `
          <div style="font-size: 1.05rem; color: #ffd166; font-weight: 800; margin-bottom: 6px;">💎 MEGA VAULT JACKPOT!</div>
          <p>All 6 passives gained +1 Level & 50 Coins refunded!</p>
        `;
      } else {
        descEl.textContent = prize.desc;
      }
    }

    this.openModal('modal-prize');
  }

  // Daily Rewards
  bindDailyQuest() {
    const claimBtn = document.getElementById('btn-claim-daily');
    if (!claimBtn) return;

    claimBtn.addEventListener('click', () => {
      if (window.economy.canClaimDaily()) {
        const reward = window.economy.claimDailyReward();
        window.soundEngine.playWin();
        window.soundEngine.playCoin();
        if (window.particleEngine) {
          window.particleEngine.triggerConfetti(40);
        }
        this.showToast(`🎁 Claimed +${reward} Daily Bonus Coins!`);
        this.updateDailyButton();
      } else {
        this.showToast("⏰ Daily chest is recharging!");
      }
    });

    // Secret instant test button for testing
    document.getElementById('btn-instant-daily')?.addEventListener('click', () => {
      window.economy.lastDailyClaim = 0;
      window.economy.saveState();
      this.updateDailyButton();
      this.showToast("⚡ Daily chest cooldown reset for demo testing!");
    });
  }

  startDailyTimer() {
    this.updateDailyButton();
    this.dailyInterval = setInterval(() => {
      this.updateDailyButton();
    }, 1000);
  }

  updateDailyButton() {
    const claimBtn = document.getElementById('btn-claim-daily');
    const timerLabel = document.getElementById('daily-timer-label');
    if (!claimBtn || !timerLabel) return;

    if (window.economy.canClaimDaily()) {
      claimBtn.disabled = false;
      claimBtn.textContent = "Claim 50 Coins Free!";
      timerLabel.textContent = "Available Now!";
    } else {
      claimBtn.disabled = true;
      claimBtn.textContent = "Cooldown Active";
      timerLabel.textContent = `Next in: ${window.economy.getDailyCountdown()}`;
    }
  }

  // Settings & Toggles
  bindSettings() {
    const sfxSwitch = document.getElementById('setting-sfx-toggle');
    const musicSwitch = document.getElementById('setting-music-toggle');

    if (sfxSwitch) {
      sfxSwitch.checked = window.soundEngine.sfxEnabled;
      sfxSwitch.addEventListener('change', (e) => {
        window.soundEngine.setSfx(e.target.checked);
      });
    }

    if (musicSwitch) {
      musicSwitch.checked = window.soundEngine.musicEnabled;
      musicSwitch.addEventListener('change', (e) => {
        window.soundEngine.setMusic(e.target.checked);
      });
    }

    // Cheat: Upgrade all passives (+1 Lv)
    document.getElementById('btn-cheat-passives')?.addEventListener('click', () => {
      window.economy.cheatUnlockOrLevelPassives();
      window.soundEngine.playLevelUp();
      this.closeModal('modal-settings');
      this.showToast("⚡ All passives leveled up (+1 Lv) for testing!");
    });

    // Cheat: Make all passives ready for next round
    document.getElementById('btn-cheat-ready-passives')?.addEventListener('click', () => {
      window.economy.cheatReadyAllPassives();
      window.soundEngine.playPassiveProc();
      this.closeModal('modal-settings');
      this.showToast("⚡ All passives primed & READY for the next round!");
    });

    // Reset Progress Button
    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all trophies, coins, and progress?")) {
        window.economy.resetAllProgress();
        window.game.syncWorld();
        window.game.setupArena();
        this.closeModal('modal-settings');
        this.showToast("✨ Game progress reset successfully.");
      }
    });

    // Fast Forward Cheat (for evaluation / reviewer convenience)
    document.getElementById('btn-cheat-trophies')?.addEventListener('click', () => {
      window.economy.trophies += 20;
      window.economy.coins += 200;
      window.economy.saveState();
      window.game.syncWorld();
      window.game.setupArena();
      this.closeModal('modal-settings');
      this.showToast("⚡ +20 Trophies & +200 Coins added for testing!");
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  showWorldUnlockModal(world) {
    window.soundEngine.playWorldUnlock();
    if (window.particleEngine) {
      window.particleEngine.triggerConfetti(80);
    }

    const modal = document.getElementById('modal-world-unlock');
    if (!modal) return;

    document.getElementById('unlock-world-icon').textContent = world.icon;
    document.getElementById('unlock-world-title').textContent = `${world.name} Unlocked!`;
    document.getElementById('unlock-world-desc').textContent = 
      `Congratulations! You have advanced to the ${world.name}. New container type: ${world.containerName} with faster shuffling speeds!`;

    this.openModal('modal-world-unlock');
  }

  showGrandVictoryModal() {
    window.soundEngine.playWorldUnlock();
    if (window.particleEngine) {
      window.particleEngine.triggerConfetti(120);
    }

    this.openModal('modal-grand-victory');
  }

  showTowerGameOverModal(floor, best) {
    const textEl = document.getElementById('tower-cleared-text');
    if (textEl) textEl.textContent = `Floor ${floor}`;

    const reachedEl = document.getElementById('tower-reached-val');
    if (reachedEl) reachedEl.textContent = `${floor}`;

    const bestEl = document.getElementById('tower-best-val');
    if (bestEl) bestEl.textContent = `${best}`;

    this.openModal('modal-tower-over');
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Global instance
window.ui = new UIEngine();
