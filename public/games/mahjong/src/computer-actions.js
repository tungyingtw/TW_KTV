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
    if (!canUseDiscardClaim(state, player, discarder, tile) || !hasMatchingTiles(state.hands[player], tile, 2, rules.tileKey)) return null;
    const matching = stateFlow.takeMatchingTiles(state, player, tile, 2, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, discarder, tile);
    stateFlow.addMeld(state, player, "碰", [...matching, tile]);
    stateFlow.clearMeldTurnState(state, player);
    return { player, discarder, tile };
  }

  function applyComputerExposedKong(state, stateFlow, rules, player, discarder, tile) {
    if (!state.wall.length || !canUseDiscardClaim(state, player, discarder, tile) || !hasMatchingTiles(state.hands[player], tile, 3, rules.tileKey)) return null;
    const matching = stateFlow.takeMatchingTiles(state, player, tile, 3, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, discarder, tile);
    stateFlow.addMeld(state, player, "明槓", [...matching, tile]);
    stateFlow.clearMeldTurnState(state, player);
    return { player, discarder, tile };
  }

  function applyComputerChi(state, stateFlow, player, discarder, tile, option, compareTiles) {
    if (!canUseDiscardClaim(state, player, discarder, tile) || !hasLiveTiles(state.hands[player], option)) return null;
    stateFlow.takeTilesById(state, player, option);
    stateFlow.removeClaimedDiscard(state, discarder, tile);
    stateFlow.addMeld(state, player, "吃", [...option, tile].sort(compareTiles));
    stateFlow.clearMeldTurnState(state, player);
    return { player, discarder, tile, option };
  }

  function chooseConcealedKong(state, rules, ai, difficulty, aiOptions, player) {
    return ai.chooseConcealedKongOption(state.hands[player], rules.getConcealedKongOptions(state.hands[player]), rules, difficulty, aiOptions(player));
  }

  function chooseAddedKong(state, rules, ai, difficulty, aiOptions, player) {
    return ai.chooseAddedKongOption(state.hands[player], rules.getAddedKongOptions(state.hands[player], state.melds[player]), rules, difficulty, aiOptions(player));
  }

  function applyComputerConcealedKong(state, stateFlow, player, option) {
    if (!canComputerKongNow(state, stateFlow, player) || !isConcealedKongOption(state.hands[player], option)) return null;
    stateFlow.takeTilesById(state, player, option);
    stateFlow.addMeld(state, player, "暗槓", option);
    stateFlow.clearMeldTurnState(state, player, { clearPending: false });
    return option;
  }

  function applyComputerAddedKong(state, stateFlow, player, option) {
    const valid = validateComputerAddedKong(state, stateFlow, player, option);
    if (!valid) return null;
    stateFlow.takeTilesById(state, player, [valid.tile]);
    stateFlow.replaceMeld(state, player, valid.meldIndex, "補槓", valid.tiles);
    stateFlow.clearMeldTurnState(state, player, { clearPending: false });
    return valid;
  }

  function canComputerKongNow(state, stateFlow, player) {
    return !!(state.running && state.current === player && !state.pendingClaim && state.wall.length && stateFlow.hasExpectedDiscardHand(state, player, winningTileCount(state)));
  }

  function validateComputerAddedKong(state, stateFlow, player, option) {
    if (!canComputerKongNow(state, stateFlow, player) || !Number.isInteger(option?.meldIndex)) return null;
    const meld = state.melds[player][option.meldIndex];
    const tile = state.hands[player].find(item => item.id === option.tile?.id);
    if (meld?.type !== "碰" || meld.tiles.length !== 3 || !tile) return null;
    const key = `${tile.suit}:${tile.rank}`;
    if (!meld.tiles.every(item => `${item.suit}:${item.rank}` === key)) return null;
    return { meldIndex: option.meldIndex, tile, tiles: [...meld.tiles, tile] };
  }

  function canUseDiscardClaim(state, player, discarder, tile) {
    const active = state.activeDiscard;
    return !!(state.running && state.wall.length && player !== discarder && state.current === discarder && active?.runId === state.runId && active.player === discarder && active.tileId === tile.id && state.rivers[discarder]?.at(-1)?.id === tile.id);
  }

  function winningTileCount(state) {
    return state.ruleset === "simple13" ? 14 : 17;
  }

  function hasMatchingTiles(hand, target, amount, tileKey) {
    return hand.filter(tile => tileKey(tile) === tileKey(target)).length >= amount;
  }

  function hasLiveTiles(hand, tiles) {
    const ids = tiles?.map(tile => tile.id) || [];
    return ids.length === new Set(ids).size && ids.length > 0 && ids.every(id => hand.some(tile => tile.id === id));
  }

  function isConcealedKongOption(hand, option) {
    if (!hasLiveTiles(hand, option) || option.length !== 4) return false;
    const key = `${option[0].suit}:${option[0].rank}`;
    return option.every(tile => `${tile.suit}:${tile.rank}` === key);
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

  window.MahjongComputerActions = { applyComputerAddedKong, applyComputerChi, applyComputerConcealedKong, applyComputerExposedKong, applyComputerPong, canComputerWinAfterKong, canComputerKongNow, chooseAddedKong, chooseConcealedKong, chooseDiscardAfterMeld, chooseDiscardClaim, drawComputerKongSupplement, prepareComputerDiscard, validateComputerAddedKong };
})();
