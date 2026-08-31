(function () {
  function finishWinRound(state, stateFlow, options) {
    const { player, method, discarder = null, event, specialWin = null, players, compareTiles, settleTokens, advanceRound, roundLabel } = options;
    state.running = false;
    state.current = player;
    state.canPlayerWin = player === 0;
    state.selectedId = null;
    const claimTile = player === 0 && state.pendingClaim?.canWin ? state.pendingClaim.tile : null;
    const claimedWinTile = claimTile || (discarder !== null ? state.hands[player][state.hands[player].length - 1] : null);
    const winningTiles = claimTile ? [...state.hands[player], claimTile] : [...state.hands[player]];
    const tokenBefore = state.tokens;
    state.pendingClaim = null;
    state.pendingSelfDrawMethod = "";
    const handText = [...winningTiles].sort(compareTiles).map(tile => tile.label).join(" ");
    const tokenSettlement = settleTokens(player, discarder, winningTiles, method, claimedWinTile, event, specialWin);
    const roundResult = advanceRound(player);
    const message = `${players[player]}${method}胡牌！${handText}。${tokenSettlement.summary}。${tokenSettlement.headline}。${roundResult}，下一局${players[state.dealer]}坐莊。`;
    state.result = stateFlow.createWinResult(state, { winner: player, method, winningTiles, settlement: tokenSettlement.summary, tokenText: tokenSettlement.headline, tokenBefore, tokenAfter: state.tokens, totalTai: tokenSettlement.totalTai, tokenBreakdown: tokenSettlement.breakdown, roundResult, nextRound: roundLabel(), message });
    return { message, tokenSettlement, winEventType: winEventType(method, tokenSettlement.totalTai) };
  }

  function finishDrawRound(state, stateFlow, options) {
    const { text, compareTiles, advanceRound, roundLabel, players } = options;
    state.running = false;
    state.selectedId = null;
    state.lastDrawnId = null;
    state.canPlayerWin = false;
    state.pendingClaim = null;
    state.pendingSelfDrawMethod = "";
    const tokenBefore = state.tokens;
    const roundResult = advanceRound(null);
    const message = `${text}${roundResult}，下一局${players[state.dealer]}坐莊。`;
    state.result = stateFlow.createDrawResult(state, { method: text, handTiles: [...state.hands[0]].sort(compareTiles), tokenBefore, tokenAfter: state.tokens, roundResult, nextRound: roundLabel(), message });
    return { message };
  }

  function winEventType(method, totalTai) {
    if (method.includes("搶槓")) return "robKong";
    if (method.includes("槓") && method.includes("自摸")) return "kongDrawWin";
    return totalTai >= 6 ? "bigwin" : "win";
  }

  window.MahjongRoundResult = { finishDrawRound, finishWinRound, winEventType };
})();
