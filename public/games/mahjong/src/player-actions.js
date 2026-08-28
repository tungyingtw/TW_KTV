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
    if (!state.running || !claim?.canPong) return null;
    const matching = stateFlow.takeMatchingTiles(state, 0, claim.tile, 2, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, claim.discarder, claim.tile);
    stateFlow.addMeld(state, 0, "碰", [...matching, claim.tile]);
    finishClaimMeld(state, stateFlow, sortHand);
    return claim;
  }

  function claimExposedKong(state, stateFlow, rules) {
    const claim = state.pendingClaim;
    if (!state.running || !claim?.canKong) return null;
    const matching = stateFlow.takeMatchingTiles(state, 0, claim.tile, 3, rules.tileKey);
    stateFlow.removeClaimedDiscard(state, claim.discarder, claim.tile);
    stateFlow.addMeld(state, 0, "明槓", [...matching, claim.tile]);
    stateFlow.clearMeldTurnState(state, 0);
    return claim;
  }

  function claimConcealedKong(state, stateFlow, option) {
    if (!state.running || state.current !== 0 || state.pendingClaim) return null;
    stateFlow.takeTilesById(state, 0, option);
    stateFlow.addMeld(state, 0, "暗槓", option);
    stateFlow.clearMeldTurnState(state, 0, { clearPending: false });
    return option;
  }

  function claimAddedKong(state, stateFlow, option) {
    if (!state.running || state.current !== 0 || state.pendingClaim) return null;
    stateFlow.takeTilesById(state, 0, [option.tile]);
    stateFlow.replaceMeld(state, 0, option.meldIndex, "補槓", option.tiles);
    stateFlow.clearMeldTurnState(state, 0, { clearPending: false });
    return option;
  }

  function claimChi(state, stateFlow, index, compareTiles, sortHand) {
    const claim = state.pendingClaim;
    const option = claim?.chiOptions[index];
    if (!state.running || !option) return null;
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
    documentRef.addEventListener("click", event => {
      const trigger = event.target.closest("[data-seat-detail]");
      if (trigger) handlers.showSeatDetail(Number(trigger.dataset.seatDetail));
    });
    byId("sortButton").addEventListener("click", handlers.sortPlayerHand);
    windowRef.addEventListener("keydown", handlers.handleKeydown);
    windowRef.addEventListener("pointerdown", handlers.unlockAudio, { once: true });
    windowRef.addEventListener("resize", handlers.setupParticleLayer);
  }

  window.MahjongPlayerActions = { bindControls, chooseAutoplayDiscard, claimAddedKong, claimChi, claimConcealedKong, claimExposedKong, claimPong, prepareDiscard, sortHandForTurn, toggleAutoplay, toggleSelectedTile };
})();
