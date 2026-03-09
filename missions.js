const Missions = (() => {
  const GOAL_ZONE_X = WorldMap.WORLD_W - 420;
  const SAFE_ZONE_X_MAX = 420;
  const ENEMIES_TO_DEFEAT = 3;
  const SURVIVE_SECONDS = 30;

  const MISSION_DATA = [
    {
      id: 1,
      title: 'Cross the Shadow Lands',
      description: 'Reach the blue zone at the far right.',
      hint: '→ Move right to the blue zone',
      checkComplete: () => Player.state.x >= GOAL_ZONE_X,
      progressText: () => {
        const dist = Math.max(0, GOAL_ZONE_X - Player.state.x);
        return dist < 100 ? '⚡ Almost there!' : `Distance: ${Math.round(dist)}px`;
      },
    },
    {
      id: 2,
      title: 'Eliminate the Warriors',
      description: `Defeat ${ENEMIES_TO_DEFEAT} Shadow Clan enemies.`,
      hint: '⚔  Press F near enemies to attack',
      checkComplete: () => Enemies.getDefeated() >= ENEMIES_TO_DEFEAT,
      progressText: () => `Defeated: ${Math.min(Enemies.getDefeated(), ENEMIES_TO_DEFEAT)} / ${ENEMIES_TO_DEFEAT}`,
    },
    {
      id: 3,
      title: 'Return to Safety',
      description: 'Reach the green safe zone on the left.',
      hint: '← Move left back to the green zone',
      checkComplete: () => Player.state.x + Player.state.w <= SAFE_ZONE_X_MAX,
      progressText: () => {
        const dist = Math.max(0, Player.state.x + Player.state.w - SAFE_ZONE_X_MAX);
        return dist < 100 ? '⚡ Nearly safe!' : `Distance: ${Math.round(dist)}px`;
      },
    },
    {
      id: 4,
      title: 'Survive the Panic',
      description: 'Stay alive for 30 seconds while enemies close in.',
      hint: '⏱ Survive until the timer reaches zero',
      checkComplete: () => false,
      progressText: () => `Time left: ${Math.ceil(panicTimeLeft)}s`,
    },
  ];

  let currentIndex = 0;
  let complete = false;
  let failed = false;
  let panicTimeLeft = SURVIVE_SECONDS;
  let panicActive = false;
  let missionJustCompleted = false;
  let completionTimer = 0;

  const reset = () => {
    currentIndex = 0;
    complete = false;
    failed = false;
    panicTimeLeft = SURVIVE_SECONDS;
    panicActive = false;
    missionJustCompleted = false;
    completionTimer = 0;
  };

  const current = () => MISSION_DATA[currentIndex] || null;

  const advance = () => {
    currentIndex++;
    missionJustCompleted = true;
    completionTimer = 90;
    if (currentIndex >= MISSION_DATA.length) {
      complete = true;
    } else if (MISSION_DATA[currentIndex].id === 4) {
      panicActive = true;
    }
  };

  const update = (dt) => {
    if (complete || failed) return;

    if (missionJustCompleted) {
      completionTimer--;
      if (completionTimer <= 0) missionJustCompleted = false;
    }

    const m = current();
    if (!m) return;

    if (m.id !== 4 && m.checkComplete()) {
      advance();
      return;
    }

    if (m.id === 4 && panicActive) {
      panicTimeLeft -= dt;
      if (panicTimeLeft <= 0) {
        panicTimeLeft = 0;
        complete = true;
        panicActive = false;
      }
    }
  };

  const isComplete = () => complete;
  const isFailed  = () => failed;
  const isPanic   = () => panicActive;
  const getPanicTime = () => panicTimeLeft;
  const isJustCompleted = () => missionJustCompleted;

  return {
    reset, update, current, advance,
    isComplete, isFailed, isPanic, getPanicTime, isJustCompleted,
    GOAL_ZONE_X, SAFE_ZONE_X_MAX, ENEMIES_TO_DEFEAT, SURVIVE_SECONDS,
  };
})();
