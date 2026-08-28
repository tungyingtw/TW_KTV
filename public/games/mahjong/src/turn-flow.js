(function () {
  function startDrawTurn(state, stateFlow, player) {
    if (!state.running) return { status: "stopped" };
    if (!state.wall.length) return { status: "wallEmpty" };
    state.current = player;
    state.lastDrawnId = null;
    const drawn = stateFlow.drawFromWall(state, player, { trackDrawn: player === 0 });
    state.canPlayerWin = false;
    return { status: "drawn", drawn };
  }

  function resolveDrawWin(state, rules, ruleset, openMeldCount, player, flowers) {
    if (!rules.isWinningHand(state.hands[player], openMeldCount(player), ruleset.winningTileCount)) return { status: "continue" };
    const method = flowers ? "補花後自摸" : "自摸";
    if (player !== 0) return { status: "computerWin", method };
    state.canPlayerWin = true;
    state.pendingSelfDrawMethod = method;
    return { status: "playerWinOption", method };
  }

  window.MahjongTurnFlow = { resolveDrawWin, startDrawTurn };
})();
