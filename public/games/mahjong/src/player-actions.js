(function () {
  function sortHandForTurn(state, compareTiles) {
    const drawnId = state.lastDrawnId;
    const drawnTile = drawnId ? state.hands[0].find(tile => tile.id === drawnId) : null;
    const sortedTiles = state.hands[0].filter(tile => tile.id !== drawnId).sort(compareTiles);
    state.hands[0] = drawnTile ? [...sortedTiles, drawnTile] : sortedTiles;
  }

  function toggleSelectedTile(state, tile) {
    state.selectedId = state.selectedId === tile.id ? null : tile.id;
    return state.selectedId;
  }

  function prepareDiscard(state, stateFlow) {
    if (!state.running || state.current !== 0 || !state.selectedId || !stateFlow.canDiscardNow(state, 0)) return null;
    const tileId = state.selectedId;
    stateFlow.clearPlayerDiscardState(state);
    return tileId;
  }

  function chooseAutoplayDiscard(state, ai, rules, difficulty, aiOptions) {
    if (!state.running || state.current !== 0 || state.pendingClaim || state.canPlayerWin) return null;
    if (state.selectedId) {
      const selected = state.hands[0].find(tile => tile.id === state.selectedId);
      return { tile: selected || null, message: selected ? `代打接手打出 ${selected.label}。` : "代打接手出牌。" };
    }
    const decision = ai.chooseDiscard(state.hands[0], rules, difficulty, aiOptions(0));
    if (!decision?.tile) return null;
    state.selectedId = decision.tile.id;
    return { tile: decision.tile, message: `代打選擇打出 ${decision.tile.label}。` };
  }

  function toggleAutoplay(state) {
    state.autoplay = !state.autoplay;
    return state.autoplay;
  }

  function claimPong(state, stateFlow, rules, sortHand) {
    const claim = state.pendingClaim;
    if (!claim?.canPong || !canUseDiscardClaim(state, stateFlow, claim) || !hasMatchingTiles(state.hands[0], claim.tile, 2, rules.tileKey)) return null;
    const matching = stateFlow.takeMatchingTiles(state, 0, claim.tile, 2, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, claim.discarder, claim.tile);
    stateFlow.addMeld(state, 0, "碰", [...matching, claim.tile]);
    finishClaimMeld(state, stateFlow, sortHand);
    return claim;
  }

  function claimExposedKong(state, stateFlow, rules, candidate) {
    const claim = state.pendingClaim;
    if (!claim?.canKong || !isCurrentClaimCandidate(state, claim, candidate) || !canUseDiscardClaim(state, stateFlow, claim) || !hasMatchingTiles(state.hands[0], claim.tile, 3, rules.tileKey)) return null;
    const matching = stateFlow.takeMatchingTiles(state, 0, claim.tile, 3, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, claim.discarder, claim.tile);
    stateFlow.addMeld(state, 0, "明槓", [...matching, claim.tile]);
    stateFlow.clearMeldTurnState(state, 0);
    return claim;
  }

  function claimConcealedKong(state, stateFlow, option) {
    const tiles = candidateTiles(state, option);
    if (!canPlayerKongNow(state, stateFlow) || !tiles || !isConcealedKongOption(state.hands[0], tiles)) return null;
    stateFlow.takeTilesById(state, 0, tiles);
    stateFlow.addMeld(state, 0, "暗槓", tiles);
    stateFlow.clearMeldTurnState(state, 0, { clearPending: false });
    return tiles;
  }

  function claimAddedKong(state, stateFlow, option) {
    const valid = validateAddedKong(state, stateFlow, option);
    if (!valid) return null;
    stateFlow.takeTilesById(state, 0, [valid.tile]);
    stateFlow.replaceMeld(state, 0, valid.meldIndex, "補槓", valid.tiles);
    stateFlow.clearMeldTurnState(state, 0, { clearPending: false });
    return valid;
  }

  function claimChi(state, stateFlow, candidate, compareTiles, sortHand) {
    const claim = state.pendingClaim;
    const option = claim?.chiOptions[candidate?.index];
    if (!isCurrentClaimCandidate(state, claim, candidate) || !canUseDiscardClaim(state, stateFlow, claim) || !option || !hasLiveTiles(state.hands[0], option)) return null;
    stateFlow.takeTilesById(state, 0, option);
    stateFlow.removeClaimedDiscard(state, claim.discarder, claim.tile);
    stateFlow.addMeld(state, 0, "吃", [...option, claim.tile].sort(compareTiles));
    finishClaimMeld(state, stateFlow, sortHand);
    return claim;
  }

  function finishClaimMeld(state, stateFlow, sortHand) {
    if (window.MahjongGameFlow?.finishPlayerClaimMeld) {
      window.MahjongGameFlow.finishPlayerClaimMeld(state, stateFlow, sortHand);
      return;
    }
    stateFlow.clearMeldTurnState(state, 0);
    sortHand();
  }

  function canPlayerKongNow(state, stateFlow) {
    return !!(state.running && state.current === 0 && !state.pendingClaim && state.wall.length && stateFlow.hasExpectedDiscardHand(state, 0, winningTileCount(state)));
  }

  function validateAddedKong(state, stateFlow, option) {
    if (!canPlayerKongNow(state, stateFlow) || !isCurrentCandidate(state, option) || !Number.isInteger(option?.meldIndex)) return null;
    const meld = state.melds[0][option.meldIndex];
    const tile = state.hands[0].find(item => item.id === option.tile?.id);
    if (meld?.type !== "碰" || meld.tiles.length !== 3 || !tile) return null;
    const key = `${tile.suit}:${tile.rank}`;
    if (!meld.tiles.every(item => `${item.suit}:${item.rank}` === key)) return null;
    return { meldIndex: option.meldIndex, tile, tiles: [...meld.tiles, tile] };
  }

  function canUseDiscardClaim(state, stateFlow, claim) {
    const active = state.activeDiscard;
    return !!(state.running && state.wall.length && claim?.kind === "discard" && state.pendingClaim === claim && state.current === 0 && claim.runId === state.runId && claim.discardToken === active?.token && active?.runId === state.runId && active.player === claim.discarder && active.tileId === claim.tile.id && state.rivers[claim.discarder]?.at(-1)?.id === claim.tile.id && !stateFlow.hasExpectedDiscardHand(state, 0, winningTileCount(state)));
  }

  function isCurrentClaimCandidate(state, claim, candidate) {
    return !!(candidate && claim && candidate.runId === state.runId && candidate.discardToken === claim.discardToken && candidate.tileId === claim.tile.id);
  }

  function candidateTiles(state, candidate) {
    return isCurrentCandidate(state, candidate) ? candidate.tiles : null;
  }

  function isCurrentCandidate(state, candidate) {
    return !!(candidate && candidate.runId === state.runId);
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

  function bindControls({ byId, documentRef, windowRef, handlers }) {
    byId("startButton").addEventListener("click", () => handlers.beginShuffleSequence(true));
    byId("nextRoundButton").addEventListener("click", () => handlers.beginShuffleSequence(false));
    byId("backToSetupButton").addEventListener("click", () => handlers.showLobby());
    byId("prevPageButton").addEventListener("click", handlers.goBackPage);
    byId("restartButton").addEventListener("click", () => handlers.showLobby());
    byId("discardButton").addEventListener("click", handlers.discardSelected);
    byId("winButton").addEventListener("click", handlers.claimWin);
    byId("pongButton").addEventListener("click", handlers.claimPong);
    byId("passButton").addEventListener("click", handlers.passClaim);
    byId("soundButton").addEventListener("click", handlers.toggleSound);
    byId("effectsButton").addEventListener("click", handlers.toggleLowPowerEffects);
    byId("fullscreenButton").addEventListener("click", handlers.toggleFullscreen);
    byId("autoplayButton").addEventListener("click", handlers.toggleAutoplay);
    byId("listenButton").addEventListener("click", handlers.toggleListenHint);
    byId("listenDetails").addEventListener("click", event => {
      const choice = event.target.closest("[data-listen-index]");
      if (choice) handlers.chooseListenLock(Number(choice.dataset.listenIndex));
      if (event.target.closest("[data-listen-cancel]")) handlers.cancelListenLock();
    });
    documentRef.querySelectorAll(".ruleset-button").forEach(button => button.addEventListener("click", () => handlers.setRuleset(button.dataset.ruleset)));
    documentRef.querySelectorAll(".stake-button").forEach(button => button.addEventListener("click", () => handlers.setStake(Number(button.dataset.stake))));
    documentRef.querySelectorAll(".difficulty-button").forEach(button => button.addEventListener("click", () => handlers.setDifficulty(button.dataset.difficulty)));
    byId("rulesHelpButton").addEventListener("click", handlers.toggleRulesHelp);
    byId("rulesHelpClose").addEventListener("click", handlers.closeRulesHelp);
    byId("rulesHelpPanel").addEventListener("click", event => {
      if (event.target === byId("rulesHelpPanel")) handlers.closeRulesHelp();
    });
    byId("seatDetailClose").addEventListener("click", handlers.closeSeatDetail);
    byId("seatDetailPanel").addEventListener("click", event => {
      if (event.target === byId("seatDetailPanel")) handlers.closeSeatDetail();
    });
    byId("riverDetailButton").addEventListener("click", handlers.showRiverDetail);
    byId("riverDetailClose").addEventListener("click", handlers.closeRiverDetail);
    byId("riverDetailPanel").addEventListener("click", event => {
      if (event.target === byId("riverDetailPanel")) handlers.closeRiverDetail();
    });
    documentRef.addEventListener("click", event => {
      const trigger = event.target.closest("[data-seat-detail]");
      if (trigger) handlers.showSeatDetail(Number(trigger.dataset.seatDetail));
    });
    byId("sortButton").addEventListener("click", handlers.sortPlayerHand);
    windowRef.addEventListener("keydown", handlers.handleKeydown);
    windowRef.addEventListener("pointerdown", handlers.unlockAudio, { once: true });
    windowRef.addEventListener("resize", handlers.setupParticleLayer);
  }

  window.MahjongPlayerActions = { bindControls, canPlayerKongNow, chooseAutoplayDiscard, claimAddedKong, claimChi, claimConcealedKong, claimExposedKong, claimPong, prepareDiscard, sortHandForTurn, toggleAutoplay, toggleSelectedTile, validateAddedKong };
})();
