/**
 * Shell Quest - Economy, Passive Abilities Engine & Gacha Manager
 */

class EconomyEngine {
  constructor() {
    this.coins = 50; // Starting bonus
    this.trophies = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalGames = 0;
    this.totalWins = 0;
    this.totalCoinsEarned = 50;
    this.lastDailyClaim = 0;
    this.towerBestFloor = 1;

    this.passiveKeys = ['xray', 'doublePick', 'timeSlow', 'oracle', 'shield', 'midas'];

    // Passive Abilities Roster (6 Unique Abilities)
    this.passives = {
      xray: {
        id: 'xray',
        name: 'X-Ray Vision',
        icon: '👁️',
        desc: 'Reveals the hidden gem through the container.',
        unlocked: false,
        level: 0,
        maxLevel: 7,
        turnsUntilReady: 10,
        activeThisRound: false
      },
      doublePick: {
        id: 'doublePick',
        name: 'Double Pick',
        icon: '✌️',
        desc: 'Allows choosing 2 containers for double win odds.',
        unlocked: false,
        level: 0,
        maxLevel: 7,
        turnsUntilReady: 10,
        activeThisRound: false
      },
      timeSlow: {
        id: 'timeSlow',
        name: 'Time Slow',
        icon: '⏳',
        desc: 'Reduces cup shuffle speed by 50% for easy tracking.',
        unlocked: false,
        level: 0,
        maxLevel: 7,
        turnsUntilReady: 10,
        activeThisRound: false
      },
      oracle: {
        id: 'oracle',
        name: 'Oracle Vision',
        icon: '🔮',
        desc: 'Eliminates 1 empty fake container after shuffling.',
        unlocked: false,
        level: 0,
        maxLevel: 7,
        turnsUntilReady: 10,
        activeThisRound: false
      },
      shield: {
        id: 'shield',
        name: 'Aegis Shield',
        icon: '🛡️',
        desc: 'Protects against streak and trophy loss on miss.',
        unlocked: false,
        level: 0,
        maxLevel: 7,
        turnsUntilReady: 10,
        activeThisRound: false
      },
      midas: {
        id: 'midas',
        name: 'Midas Surge',
        icon: '💰',
        desc: 'Triples coin rewards (3x Coins) on a winning round.',
        unlocked: false,
        level: 0,
        maxLevel: 7,
        turnsUntilReady: 10,
        activeThisRound: false
      }
    };

    this.loadState();
  }

  getCooldownForLevel(level) {
    switch (level) {
      case 1: return 10;
      case 2: return 8;
      case 3: return 6;
      case 4: return 5;
      case 5: return 4;
      case 6: return 3;
      case 7: return 2; // MAX LEVEL: procs every 2 rounds!
      default: return 10;
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('sq_save_data_v2');
      if (saved) {
        const data = JSON.parse(saved);
        this.coins = data.coins ?? 50;
        this.trophies = data.trophies ?? 0;
        this.streak = data.streak ?? 0;
        this.maxStreak = data.maxStreak ?? 0;
        this.totalGames = data.totalGames ?? 0;
        this.totalWins = data.totalWins ?? 0;
        this.totalCoinsEarned = data.totalCoinsEarned ?? 50;
        this.lastDailyClaim = data.lastDailyClaim ?? 0;
        this.towerBestFloor = data.towerBestFloor ?? 1;

        if (data.passives) {
          this.passiveKeys.forEach(key => {
            if (data.passives[key]) {
              const p = data.passives[key];
              this.passives[key].unlocked = !!p.unlocked;
              this.passives[key].level = p.level ?? 0;
              this.passives[key].turnsUntilReady = p.turnsUntilReady ?? this.getCooldownForLevel(p.level || 1);
            }
          });
        }
      } else {
        // Migration from old v1 data
        const oldSaved = localStorage.getItem('sq_save_data');
        if (oldSaved) {
          const oldData = JSON.parse(oldSaved);
          this.coins = oldData.coins ?? 50;
          this.trophies = oldData.trophies ?? 0;
          this.streak = oldData.streak ?? 0;
          this.maxStreak = oldData.maxStreak ?? 0;
          this.totalGames = oldData.totalGames ?? 0;
          this.totalWins = oldData.totalWins ?? 0;
          this.totalCoinsEarned = oldData.totalCoinsEarned ?? 50;
          this.lastDailyClaim = oldData.lastDailyClaim ?? 0;
          this.towerBestFloor = 1;
          this.saveState();
        }
      }
    } catch (e) {
      console.warn("Failed to load saved state:", e);
    }
  }

  saveState() {
    try {
      const passivesData = {};
      this.passiveKeys.forEach(k => {
        passivesData[k] = {
          unlocked: this.passives[k].unlocked,
          level: this.passives[k].level,
          turnsUntilReady: this.passives[k].turnsUntilReady
        };
      });

      const data = {
        coins: this.coins,
        trophies: this.trophies,
        streak: this.streak,
        maxStreak: this.maxStreak,
        totalGames: this.totalGames,
        totalWins: this.totalWins,
        totalCoinsEarned: this.totalCoinsEarned,
        lastDailyClaim: this.lastDailyClaim,
        towerBestFloor: this.towerBestFloor,
        passives: passivesData
      };
      localStorage.setItem('sq_save_data_v2', JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
    this.updateHUD();
  }

  recordTowerFloor(floor) {
    if (floor > this.towerBestFloor) {
      this.towerBestFloor = floor;
      this.saveState();
    }
    return this.towerBestFloor;
  }

  addCoins(amount) {
    this.coins += amount;
    this.totalCoinsEarned += amount;
    this.saveState();
  }

  spendCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.saveState();
      return true;
    }
    return false;
  }

  addTrophy(trophyAmount = 1, coinAmount = 10) {
    this.trophies += trophyAmount;
    this.streak += 1;
    if (this.streak > this.maxStreak) {
      this.maxStreak = this.streak;
    }
    this.totalGames += 1;
    this.totalWins += 1;
    this.addCoins(coinAmount);
    this.saveState();
    return this.trophies;
  }

  recordLoss() {
    this.streak = 0;
    this.totalGames += 1;
    let lostTrophy = false;
    if (this.trophies > 0) {
      this.trophies -= 1;
      lostTrophy = true;
    }
    this.saveState();
    return { trophies: this.trophies, lostTrophy };
  }

  // Upgrade or unlock a passive ability
  upgradePassive(type) {
    const passive = this.passives[type];
    if (!passive) return null;

    const oldLevel = passive.level;
    const isNewUnlock = !passive.unlocked;
    const oldCooldown = isNewUnlock ? null : this.getCooldownForLevel(oldLevel);

    if (isNewUnlock) {
      passive.unlocked = true;
      passive.level = 1;
      passive.turnsUntilReady = 10;
    } else {
      if (passive.level < passive.maxLevel) {
        passive.level += 1;
        const newCd = this.getCooldownForLevel(passive.level);
        if (passive.turnsUntilReady > newCd) {
          passive.turnsUntilReady = newCd;
        }
      }
    }

    const newCooldown = this.getCooldownForLevel(passive.level);
    this.saveState();

    return {
      type,
      passive,
      isNewUnlock,
      oldLevel,
      newLevel: passive.level,
      isMaxLevel: passive.level >= passive.maxLevel,
      oldCooldown,
      newCooldown
    };
  }

  // The Lucky Roll (100 Coins) - Gacha for Passive Unlocks & Upgrades across all 6 passives
  rollLuckyGacha() {
    if (!this.spendCoins(100)) {
      return { success: false, reason: 'not_enough_coins' };
    }

    const rand = Math.random();
    let prize = null;

    if (rand < 0.08) {
      // Jackpot! (8% chance): +1 level to ALL 6 passives & +50 bonus coins
      const upgrades = [];
      this.passiveKeys.forEach(type => {
        const up = this.upgradePassive(type);
        if (up) upgrades.push(up);
      });
      this.addCoins(50);

      prize = {
        type: 'jackpot',
        name: 'MEGA VAULT JACKPOT!',
        desc: 'All 6 Passive Abilities Leveled Up + 50 Coins Refunded!',
        icon: '💎',
        isJackpot: true,
        upgrades
      };
    } else {
      // Pick one of the 6 passives evenly
      const passivesPool = ['xray', 'doublePick', 'timeSlow', 'oracle', 'shield', 'midas'];
      const chosenType = passivesPool[Math.floor(Math.random() * passivesPool.length)];
      const up = this.upgradePassive(chosenType);

      prize = {
        type: chosenType,
        name: `${up.passive.name} Passive`,
        icon: up.passive.icon,
        upgrade: up,
        desc: up.isNewUnlock 
          ? `UNLOCKED! Triggers automatically once every ${up.newCooldown} turns!`
          : `LEVEL UP! Lv. ${up.newLevel}: Cooldown decreased from ${up.oldCooldown} &rarr; ${up.newCooldown} turns!`
      };
    }

    return { success: true, prize };
  }

  // Turn Progression: Check ready passives for the current round
  evaluateRoundStartPassives() {
    const activePassives = [];
    this.passiveKeys.forEach(key => {
      const p = this.passives[key];
      if (p.unlocked) {
        if (p.turnsUntilReady <= 1) {
          p.activeThisRound = true;
          activePassives.push({
            id: p.id,
            name: p.name,
            icon: p.icon,
            level: p.level
          });
        } else {
          p.activeThisRound = false;
        }
      } else {
        p.activeThisRound = false;
      }
    });

    this.saveState();
    return activePassives;
  }

  // Turn Progression: Decrement counters when round completes
  onRoundCompleted() {
    this.passiveKeys.forEach(key => {
      const p = this.passives[key];
      if (p.unlocked) {
        if (p.activeThisRound) {
          // Reset cooldown to full
          p.turnsUntilReady = this.getCooldownForLevel(p.level);
          p.activeThisRound = false;
        } else {
          // Decrement counter towards 1
          if (p.turnsUntilReady > 1) {
            p.turnsUntilReady -= 1;
          }
        }
      }
    });

    this.saveState();
  }

  canClaimDaily() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now - this.lastDailyClaim >= oneDayMs;
  }

  getDailyCountdown() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const remaining = oneDayMs - (now - this.lastDailyClaim);
    if (remaining <= 0) return "Ready to Claim!";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  }

  claimDailyReward() {
    this.lastDailyClaim = Date.now();
    this.addCoins(50);
    this.saveState();
    return 50;
  }

  resetAllProgress() {
    localStorage.removeItem('sq_save_data');
    localStorage.removeItem('sq_save_data_v2');
    this.coins = 50;
    this.trophies = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalGames = 0;
    this.totalWins = 0;
    this.totalCoinsEarned = 50;
    this.lastDailyClaim = 0;

    this.passiveKeys.forEach(k => {
      this.passives[k].unlocked = false;
      this.passives[k].level = 0;
      this.passives[k].turnsUntilReady = 10;
      this.passives[k].activeThisRound = false;
    });

    this.saveState();
  }

  // Developer / Reviewer Testing Helper
  cheatUnlockOrLevelPassives() {
    this.passiveKeys.forEach(k => {
      this.upgradePassive(k);
    });
    this.saveState();
  }

  cheatReadyAllPassives() {
    this.passiveKeys.forEach(k => {
      if (!this.passives[k].unlocked) {
        this.upgradePassive(k);
      }
      this.passives[k].turnsUntilReady = 1;
    });
    this.saveState();
  }

  updateHUD() {
    // Update coin counters
    document.querySelectorAll('.stat-coins-val').forEach(el => {
      el.textContent = this.coins;
    });

    // Update streak counters
    document.querySelectorAll('.stat-streak-val').forEach(el => {
      el.textContent = this.streak;
    });

    // Update trophies & World info
    const trophies = this.trophies;
    document.querySelectorAll('.stat-trophy-val').forEach(el => {
      el.textContent = trophies;
    });

    // Calculate current world threshold
    let worldTarget = 20;
    let worldName = "Ocean Realm";
    let progress = (trophies % 20) / 20 * 100;

    if (trophies >= 80) {
      worldTarget = 100;
      worldName = "Grand Victory";
      progress = Math.min(100, (trophies - 80) / 20 * 100);
    } else if (trophies >= 60) {
      worldTarget = 80;
      worldName = "Jungle Ruins";
      progress = ((trophies - 60) / 20) * 100;
    } else if (trophies >= 40) {
      worldTarget = 60;
      worldName = "Sky Islands";
      progress = ((trophies - 40) / 20) * 100;
    } else if (trophies >= 20) {
      worldTarget = 40;
      worldName = "Desert Dunes";
      progress = ((trophies - 20) / 20) * 100;
    }

    const fillBar = document.getElementById('trophy-progress-fill');
    if (fillBar) {
      fillBar.style.width = `${progress}%`;
    }

    const worldBanner = document.getElementById('current-world-badge');
    if (worldBanner) {
      worldBanner.textContent = worldName;
    }

    const trophyTargetLabel = document.getElementById('trophy-target-val');
    if (trophyTargetLabel) {
      trophyTargetLabel.textContent = `${trophies}/${worldTarget}`;
    }

    // Update Passive Ability HUD Cards on Play Screen
    this.updatePassivesHUD();

    // Update Showcase in Shop Screen
    this.updatePassivesShopShowcase();

    // Update Stats Page
    const statGames = document.getElementById('stat-total-games');
    if (statGames) statGames.textContent = this.totalGames;

    const statWins = document.getElementById('stat-total-wins');
    if (statWins) statWins.textContent = this.totalWins;

    const statWinRate = document.getElementById('stat-win-rate');
    if (statWinRate) {
      const rate = this.totalGames > 0 ? Math.round((this.totalWins / this.totalGames) * 100) : 0;
      statWinRate.textContent = `${rate}%`;
    }

    const statMaxStreak = document.getElementById('stat-max-streak');
    if (statMaxStreak) statMaxStreak.textContent = this.maxStreak;

    const statTower = document.getElementById('stat-tower-floor');
    if (statTower) statTower.textContent = `Floor ${this.towerBestFloor || 1}`;
  }

  updatePassivesHUD() {
    this.passiveKeys.forEach(key => {
      const p = this.passives[key];
      const card = document.getElementById(`passive-card-${key}`);
      if (!card) return;

      const levelBadge = card.querySelector('.passive-level-badge');
      const statusPill = card.querySelector('.passive-status-pill');
      const progressFill = card.querySelector('.passive-mini-fill');

      if (!p.unlocked) {
        card.className = 'passive-hud-card locked';
        if (levelBadge) levelBadge.textContent = 'LOCKED';
        if (statusPill) statusPill.textContent = '🔒 Roll to Unlock';
        if (progressFill) progressFill.style.width = '0%';
      } else {
        const totalCd = this.getCooldownForLevel(p.level);
        const remaining = p.turnsUntilReady;
        const pct = Math.max(0, Math.min(100, ((totalCd - remaining + 1) / totalCd) * 100));

        if (p.activeThisRound || remaining <= 1) {
          card.className = 'passive-hud-card active-proc';
          if (levelBadge) levelBadge.textContent = `Lv. ${p.level}`;
          if (statusPill) statusPill.innerHTML = `⚡ <strong>ACTIVE!</strong>`;
          if (progressFill) progressFill.style.width = '100%';
        } else {
          card.className = 'passive-hud-card charging';
          if (levelBadge) levelBadge.textContent = `Lv. ${p.level}`;
          if (statusPill) statusPill.textContent = `⏳ In ${remaining - 1} turns`;
          if (progressFill) progressFill.style.width = `${pct}%`;
        }
      }
    });
  }

  updatePassivesShopShowcase() {
    this.passiveKeys.forEach(key => {
      const p = this.passives[key];
      const showcaseItem = document.getElementById(`shop-item-${key}`);
      if (!showcaseItem) return;

      const levelTag = showcaseItem.querySelector('.showcase-level-tag');
      const cooldownTag = showcaseItem.querySelector('.showcase-cooldown-tag');
      const descTag = showcaseItem.querySelector('.showcase-desc');
      const progressBar = showcaseItem.querySelector('.showcase-level-fill');

      if (!p.unlocked) {
        if (levelTag) levelTag.textContent = 'Locked (Lv. 0)';
        if (cooldownTag) cooldownTag.textContent = 'Unlock: 10 turns';
        if (descTag) descTag.textContent = `${p.desc} Roll to unlock (starts at 10-turn cooldown).`;
        if (progressBar) progressBar.style.width = '0%';
      } else {
        const cd = this.getCooldownForLevel(p.level);
        const nextCd = p.level < p.maxLevel ? this.getCooldownForLevel(p.level + 1) : cd;
        const progressPct = (p.level / p.maxLevel) * 100;

        if (levelTag) {
          levelTag.textContent = p.level >= p.maxLevel ? `MAX (Lv. ${p.level})` : `Lv. ${p.level} / ${p.maxLevel}`;
        }
        if (cooldownTag) {
          cooldownTag.textContent = p.level >= p.maxLevel 
            ? `Every ${cd} turns (MAX)` 
            : `Every ${cd} turns &rarr; Next: ${nextCd} turns`;
        }
        if (descTag) {
          descTag.textContent = p.level >= p.maxLevel
            ? `${p.desc} Fully mastered at maximum proc rate!`
            : `${p.desc} Next upgrade reduces cooldown to every ${nextCd} turns!`;
        }
        if (progressBar) {
          progressBar.style.width = `${progressPct}%`;
        }
      }
    });
  }
}

// Global instance
window.economy = new EconomyEngine();
