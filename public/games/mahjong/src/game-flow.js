(function () {
  const WINDS = ["東", "南", "西", "北"];
  const RULESETS = {
    tw16: { label: "台灣 16 張", baseHandSize: 16, winningTileCount: 17 },
    simple13: { label: "13 張練習", baseHandSize: 13, winningTileCount: 14 }
  };

  function currentRuleset(state) {
    return RULESETS[state.ruleset];
  }

  function canStart(state) {
    return state.tokens >= state.stake;
  }

  function prepareShuffle(state) {
    state.runId += 1;
    state.running = false;
    state.result = null;
    state.showListenHint = false;
    state.screen = "shuffling";
  }

  function resetRoundCounters(state) {
    state.dealer = 0;
    state.roundWind = 0;
    state.handNumber = 1;
    state.bonusSticks = 0;
  }

  function dealInitialHands(state, ruleset) {
    for (let round = 0; round < ruleset.baseHandSize; round += 1) {
      for (let player = 0; player < 4; player += 1) state.hands[player].push(state.wall.pop());
    }
  }

  function claimWinMethod(claim, players) {
    return claim.kind === "robKong" ? `搶槓胡 ${players[claim.kongPlayer]} 的 ${claim.tile.label}` : `胡 ${players[claim.discarder]} 的 ${claim.tile.label}`;
  }

  function finishPlayerClaimMeld(state, stateFlow, sortHand) {
    stateFlow.clearMeldTurnState(state, 0);
    sortHand();
  }

  function passPlayerClaim(state, stateFlow) {
    const claim = state.pendingClaim;
    if (!state.running || !claim) return null;
    stateFlow.clearClaimReaction(state);
    return claim;
  }

  function robAddedKongState(state, winner, kongPlayer, tile) {
    state.hands[kongPlayer] = state.hands[kongPlayer].filter(item => item.id !== tile.id);
    state.hands[winner].push(tile);
    state.current = winner;
    state.selectedId = null;
    state.lastDrawnId = null;
    state.pendingClaim = null;
  }

  function drawPlayerKongSupplement(state, sortHand) {
    if (!state.wall.length) return null;
    const drawn = state.wall.pop();
    state.hands[0].push(drawn);
    state.lastDrawnId = drawn.id;
    sortHand();
    return drawn;
  }

  function markPlayerKongWin(state, rules, ruleset, openMeldCount, type) {
    if (!rules.isWinningHand(state.hands[0], openMeldCount(0), ruleset.winningTileCount)) return false;
    state.canPlayerWin = true;
    state.pendingSelfDrawMethod = `${type}後自摸`;
    return true;
  }

  function roundLabel(state) {
    return `${WINDS[state.roundWind]}${toChineseNumber(state.handNumber)}局`;
  }

  function toChineseNumber(value) {
    return ["零", "一", "二", "三", "四"][value] || String(value);
  }

  function advanceRound(state, winner) {
    const dealerWonOrDrew = winner === state.dealer || winner === null;
    if (dealerWonOrDrew) {
      state.bonusSticks += 1;
      return `${winner === null ? "荒牌流局，" : ""}連莊（${state.bonusSticks} 本場）`;
    }
    state.dealer = (state.dealer + 1) % 4;
    state.handNumber += 1;
    state.bonusSticks = 0;
    if (state.handNumber > 4) {
      state.handNumber = 1;
      state.roundWind = (state.roundWind + 1) % WINDS.length;
    }
    return "輪莊（0 本場）";
  }

  window.MahjongGameFlow = { RULESETS, WINDS, advanceRound, canStart, claimWinMethod, currentRuleset, dealInitialHands, drawPlayerKongSupplement, finishPlayerClaimMeld, markPlayerKongWin, passPlayerClaim, prepareShuffle, resetRoundCounters, robAddedKongState, roundLabel, toChineseNumber };
})();
