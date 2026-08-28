# Shell Quest - Project Brief & PRD

## Project Overview
**Shell Quest** is a mobile-first, memory-based "shell game" where players track hidden objects beneath themed containers across multiple mystical worlds. The game features an adaptive difficulty system, a progression-based world unlock mechanic, and a meta-game layer involving coin collection and power-up gambling.

---

## Core Gameplay Mechanics
### 1. The Shell Game
- **Primary Action:** A hidden object is placed under one of several containers (shells, pots, jars, etc.).
- **The Shuffle:** Containers are shuffled at a speed determined by the current difficulty level and adaptive scaling.
- **The Guess:** The player selects a container to reveal the object.
- **Win Condition:** Correctly identifying the container earns 1 Trophy and 10 Coins.

### 2. Adaptive Difficulty
- The game automatically increases in difficulty with every trophy earned.
- **Scaling Factors:** Shuffle speed increases and movement patterns become more complex.
- **Milestones:** Challenge scales significantly as players approach the 20-trophy world-transition threshold.

### 3. World Progression
Players progress through themed stages by reaching trophy milestones.
- **Starting Stage:** Standard Shell Game
- **Desert Stage:** 20 Trophies required
- **Sky Stage:** 40 Trophies required
- **Ocean Stage:** 60 Trophies required
- **Jungle Stage:** 80 Trophies required
- **Grand Victory:** 100 Trophies (End-game milestone)

---

## Economy & Power-Ups
### Currency: Coins
- **Earning:** players receive 10 Coins per trophy won.
- **Persistence:** A universal coin counter is visible in the header of all screens.

### Power-Up Shop (The Lucky Roll)
Players can spend **100 Coins** to "Roll" for a random power-up:
- **X-Ray Vision:** Briefly reveals the object under the cup (Original Power).
- **Double Pick:** Allows the player to choose two cups in a single stage.
- **Time Slow:** Temporarily reduces shuffle speed for the current round.

---

## World Aesthetics
| World | Container Type | Environment / Theme |
|---|---|---|
| **Ocean** | Shimmering Shells | Underwater coral reef, blue/teal palette |
| **Desert** | Clay Pots | Twilight dunes, sunset oranges/purples |
| **Sky** | Cloud Jars | Floating islands, pink/gold sunset |
| **Jungle** | Ancient Stone Idols | Mossy ancient ruins, deep greens/teals |
| **Victory** | All Types | Cosmic zero-gravity space background |

---

## Technical Specifications
- **Platform:** Mobile Web (Responsive)
- **Design System:** "Lumina Shells" (Dark mode, Quicksand font, High-vibrancy accents)
- **Key Components:**
    - Persistent Top App Bar (Lives, Trophy Progress, Coin Counter)
    - Themed Game Area (Central Stage)
    - Adaptive Control Panel (Difficulty indicators, Power-up triggers)
    - Bottom Navigation (Store, Play, Power-ups)

---

## Roadmap & Future Considerations
- **Daily Rewards:** Implementation of a daily chest to boost coin retention.
- **World Map:** A visual progression tracker showing the player's journey from the Ocean to the Stars.
- **Leaderboards:** Competitive social features for "Fastest to 100 Trophies."
- **Additional Hazards:** Introduction of "cursed" cups or multiple objects to track.