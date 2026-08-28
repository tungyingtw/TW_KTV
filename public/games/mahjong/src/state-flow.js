(function () {
  function scheduleAction(state, callback, delay, scheduler = window.setTimeout) {
    const runId = state.runId;
    scheduler(() => {
      if (state.runId === runId) callback();
    }, delay);
  }

  function canDiscardNow(state, player) {
    const hand = state.hands[player] || [];
    return hand.length >= 2 && hand.length % 3 === 2;
  }

  function nextPlayer(player) {
    return (player + 1) % 4;
  }

  function canContinueComputerMeldDiscard(state, player) {
    return state.running && !state.pendingClaim && canDiscardNow(state, player);
  }

  function drawFromWall(state, player, options = {}) {
    if (!state.wall.length) return null;
    const tile = state.wall.pop();
    state.hands[player].push(tile);
    if (options.trackDrawn) state.lastDrawnId = tile.id;
    return tile;
  }

  function discardFromHand(state, player, tileId) {
    const hand = state.hands[player];
    const index = hand.findIndex(tile => tile.id === tileId);
    if (index < 0) return null;
    const [tile] = hand.splice(index, 1);
    state.rivers[player].push(tile);
    state.discardHistory.push({ player, tile });
    state.latestDiscardIndex = state.discardHistory.length - 1;
    state.discardAnimationIndex = state.latestDiscardIndex;
    return tile;
  }

  function clearPlayerDiscardState(state) {
    state.selectedId = null;
    state.lastDrawnId = null;
    state.canPlayerWin = false;
    state.pendingClaim = null;
    state.pendingSelfDrawMethod = "";
    state.showListenHint = false;
  }

  function clearClaimReaction(state) {
    state.pendingClaim = null;
    state.canPlayerWin = false;
    state.pendingSelfDrawMethod = "";
  }

  function clearMeldTurnState(state, player, options = {}) {
    if (options.clearPending !== false) state.pendingClaim = null;
    state.current = player;
    state.selectedId = null;
    state.lastDrawnId = null;
  }

  function addMeld(state, player, type, tiles) {
    state.melds[player].push({ type, tiles });
  }

  function replaceMeld(state, player, meldIndex, type, tiles) {
    state.melds[player][meldIndex] = { type, tiles };
  }

  function takeTilesById(state, player, tiles) {
    const used = new Set(tiles.map(tile => tile.id));
    state.hands[player] = state.hands[player].filter(tile => !used.has(tile.id));
  }

  function takeMatchingTiles(state, player, targetTile, amount, tileKey) {
    const taken = [];
    state.hands[player] = state.hands[player].filter(tile => {
      if (tileKey(tile) === tileKey(targetTile) && taken.length < amount) {
        taken.push(tile);
        return false;
      }
      return true;
    });
    return taken;
  }

  function removeClaimedDiscard(state, discarder, tile) {
    state.rivers[discarder].pop();
    const index = state.discardHistory.findLastIndex(entry => entry.player === discarder && entry.tile.id === tile.id);
    if (index >= 0) state.discardHistory.splice(index, 1);
  }

  function cloneTile(tile) {
    return { ...tile };
  }

  function cloneMeld(meld) {
    return { type: meld.type, tiles: meld.tiles.map(cloneTile) };
  }

  function createWinResult(state, options) {
    return {
      type: "win",
      title: options.winner === 0 ? options.totalTai >= 6 ? "大胡進帳" : "本局勝利" : "本局扣代幣",
      winner: options.winner,
      method: options.method,
      handTiles: options.winningTiles.map(cloneTile),
      melds: state.melds[options.winner].map(cloneMeld),
      stake: state.stake,
      settlement: options.settlement,
      tokenText: options.tokenText,
      tokenDelta: options.tokenAfter - options.tokenBefore,
      tokenBefore: options.tokenBefore,
      tokenAfter: options.tokenAfter,
      totalTai: options.totalTai,
      tokenBreakdown: options.tokenBreakdown,
      roundResult: options.roundResult,
      nextDealer: state.dealer,
      nextRound: options.nextRound,
      animationDone: false,
      message: options.message
    };
  }

  function createDrawResult(state, options) {
    return {
      type: "draw",
      title: "本局流局",
      winner: null,
      method: options.method,
      handTiles: options.handTiles.map(cloneTile),
      melds: state.melds[0].map(cloneMeld),
      stake: state.stake,
      settlement: "本局不計分",
      tokenText: "代幣不變",
      tokenDelta: options.tokenAfter - options.tokenBefore,
      tokenBefore: options.tokenBefore,
      tokenAfter: options.tokenAfter,
      tokenBreakdown: [{ label: "流局", value: "0", note: "本局不加扣代幣" }],
      roundResult: options.roundResult,
      nextDealer: state.dealer,
      nextRound: options.nextRound,
      animationDone: false,
      message: options.message
    };
  }

  function resetTableState(state, options = {}) {
    state.wall = options.wall || [];
    state.hands = [[], [], [], []];
    state.rivers = [[], [], [], []];
    state.discardHistory = [];
    state.melds = [[], [], [], []];
    state.latestDiscardIndex = -1;
    state.discardAnimationIndex = -1;
    state.flowerFlashIds = [];
    state.current = options.current ?? 0;
    state.selectedId = null;
    state.lastDrawnId = null;
    state.canPlayerWin = false;
    state.pendingClaim = null;
    state.pendingSelfDrawMethod = "";
    state.result = null;
    state.showListenHint = false;
    state.listenLock = null;
    state.running = !!options.running;
    state.screen = options.screen || "title";
    if (options.clearLog) state.log = [];
    if (options.clearStrategyLog) state.strategyLog = [];
  }

  window.MahjongStateFlow = { addMeld, canContinueComputerMeldDiscard, canDiscardNow, clearClaimReaction, clearMeldTurnState, clearPlayerDiscardState, createDrawResult, createWinResult, discardFromHand, drawFromWall, nextPlayer, removeClaimedDiscard, replaceMeld, resetTableState, scheduleAction, takeMatchingTiles, takeTilesById };
})();
