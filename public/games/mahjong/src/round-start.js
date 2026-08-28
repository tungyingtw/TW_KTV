(function () {
  function prepareRound(state, stateFlow, gameFlow, options) {
    const { resetRound = false, wall, ruleset } = options;
    state.runId += 1;
    if (resetRound) gameFlow.resetRoundCounters(state);
    stateFlow.resetTableState(state, { wall, current: state.dealer, running: true, screen: "playing", clearLog: true, clearStrategyLog: true });
    gameFlow.dealInitialHands(state, ruleset);
  }

  function resolveOpeningFlowers(state, resolveFlowers) {
    for (let player = 0; player < 4; player += 1) {
      resolveFlowers(player, "開局補花");
      if (state.result) return { interrupted: true, player };
    }
    return { interrupted: false, player: null };
  }

  window.MahjongRoundStart = { prepareRound, resolveOpeningFlowers };
})();
