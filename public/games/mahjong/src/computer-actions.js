(function () {
  function chooseDiscardClaim(state, rules, ai, difficulty, aiOptions, discarder, tile) {
    const claimers = [1, 2, 3].filter(player => player !== discarder);
    const kongPlayer = claimers.find(player => ai.shouldClaimKong(state.hands[player], tile, rules, difficulty, aiOptions(player)));
    if (kongPlayer) return { type: "kong", player: kongPlayer };
    const pongPlayer = claimers.find(player => ai.shouldClaimPong(state.hands[player], tile, rules, difficulty, aiOptions(player)));
    if (pongPlayer) return { type: "pong", player: pongPlayer };
    if (discarder === 3) return null;
    const chiPlayer = (discarder + 1) % 4;
    if (chiPlayer === 0) return null;
    const option = ai.chooseChiOption(state.hands[chiPlayer], tile, rules, difficulty, aiOptions(chiPlayer));
    return option ? { type: "chi", player: chiPlayer, option } : null;
  }

  function applyComputerPong(state, stateFlow, rules, player, discarder, tile) {
    const matching = stateFlow.takeMatchingTiles(state, player, tile, 2, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, discarder, tile);
    stateFlow.addMeld(state, player, "碰", [...matching, tile]);
    stateFlow.clearMeldTurnState(state, player);
  }

  function applyComputerExposedKong(state, stateFlow, rules, player, discarder, tile) {
    const matching = stateFlow.takeMatchingTiles(state, player, tile, 3, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, discarder, tile);
    stateFlow.addMeld(state, player, "明槓", [...matching, tile]);
    stateFlow.clearMeldTurnState(state, player);
  }

  function applyComputerChi(state, stateFlow, player, discarder, tile, option, compareTiles) {
    stateFlow.takeTilesById(state, player, option);
    stateFlow.removeClaimedDiscard(state, discarder, tile);
    stateFlow.addMeld(state, player, "吃", [...option, tile].sort(compareTiles));
    stateFlow.clearMeldTurnState(state, player);
  }

  function chooseConcealedKong(state, rules, ai, difficulty, aiOptions, player) {
    return ai.chooseConcealedKongOption(state.hands[player], rules.getConcealedKongOptions(state.hands[player]), rules, difficulty, aiOptions(player));
  }

  function chooseAddedKong(state, rules, ai, difficulty, aiOptions, player) {
    return ai.chooseAddedKongOption(state.hands[player], rules.getAddedKongOptions(state.hands[player], state.melds[player]), rules, difficulty, aiOptions(player));
  }

  function applyComputerConcealedKong(state, stateFlow, player, option) {
    stateFlow.takeTilesById(state, player, option);
    stateFlow.addMeld(state, player, "暗槓", option);
    stateFlow.clearMeldTurnState(state, player, { clearPending: false });
  }

  function applyComputerAddedKong(state, stateFlow, player, option) {
    stateFlow.takeTilesById(state, player, [option.tile]);
    stateFlow.replaceMeld(state, player, option.meldIndex, "補槓", option.tiles);
    stateFlow.clearMeldTurnState(state, player, { clearPending: false });
  }

  function drawComputerKongSupplement(state, player) {
    if (!state.wall.length) return null;
    const drawn = state.wall.pop();
    state.hands[player].push(drawn);
    return drawn;
  }

  function canComputerWinAfterKong(state, rules, ruleset, openMeldCount, player) {
    return rules.isWinningHand(state.hands[player], openMeldCount(player), ruleset.winningTileCount);
  }

  function prepareComputerDiscard(state, stateFlow, ai, rules, difficulty, aiOptions, player, handlers) {
    if (!state.running || state.current !== player) return { status: "skip" };
    if (!stateFlow.canDiscardNow(state, player)) return { status: "end", reason: "手牌節奏異常" };
    if (handlers.tryConcealedKong(player)) return { status: "handled" };
    if (handlers.tryAddedKong(player)) return { status: "handled" };
    const options = aiOptions(player);
    return { status: "discard", decision: ai.chooseDiscard(state.hands[player], rules, difficulty, options), options };
  }

  function chooseDiscardAfterMeld(state, stateFlow, ai, rules, difficulty, aiOptions, player) {
    if (!state.running || state.pendingClaim) return { status: "skip" };
    state.current = player;
    if (!stateFlow.canContinueComputerMeldDiscard(state, player)) return { status: "end", reason: "副露後手牌節奏異常" };
    const tile = ai.chooseDiscardAfterMeld(state.hands[player], rules, difficulty, aiOptions(player));
    return tile ? { status: "discard", tile } : { status: "end", reason: "無牌可打" };
  }

  window.MahjongComputerActions = { applyComputerAddedKong, applyComputerChi, applyComputerConcealedKong, applyComputerExposedKong, applyComputerPong, canComputerWinAfterKong, chooseAddedKong, chooseConcealedKong, chooseDiscardAfterMeld, chooseDiscardClaim, drawComputerKongSupplement, prepareComputerDiscard };
})();
