(function () {
  const NUMBER_SUITS = ["character", "dot", "bamboo"];
  const HONOR_KEYS = ["wind:1", "wind:2", "wind:3", "wind:4", "dragon-red:1", "dragon-green:1", "dragon-white:1"];

  function isFlower(tile) {
    return tile?.suit === "flower";
  }

  function visibleDangerKeysFor(state, rules, ai, context) {
    return Object.keys(visibleDangerWeightsFor(state, rules, ai, context));
  }

  function visibleDangerWeightsFor(state, rules, ai, context) {
    const { player, observer = null, openMeldCount, winningTileCount } = context;
    const safe = new Set(state.rivers[player].map(tile => rules.tileKey(tile)));
    visibleDeadKeysFor(state, rules, observer).forEach(key => safe.add(key));
    const danger = {};
    const addDanger = (key, weight) => {
      if (!safe.has(key)) danger[key] = Math.max(danger[key] || 0, weight);
    };
    const markAround = (tile, range = 1, weight = 0.45) => {
      if (isFlower(tile)) return;
      const key = rules.tileKey(tile);
      if (!NUMBER_SUITS.includes(tile.suit)) {
        addDanger(key, weight + 0.12);
        return;
      }
      Array.from({ length: range * 2 + 1 }, (_, index) => tile.rank - range + index).forEach(rank => {
        if (rank >= 1 && rank <= 9) addDanger(`${tile.suit}:${rank}`, rank === tile.rank ? weight : weight * 0.74);
      });
    };
    const visibleMeldTiles = state.melds[player].filter(meld => !["補花", "暗槓"].includes(meld.type)).flatMap(meld => meld.tiles);
    visibleMeldTiles.forEach(tile => markAround(tile, 1, 0.5));
    state.discardHistory.filter(entry => entry.player === player).slice(-5).forEach((entry, index, list) => markAround(entry.tile, index >= list.length - 2 ? 2 : 1));
    applySuitPressure(danger, visibleMeldTiles, safe);
    applyFreshHonorPressure(state, rules, ai, danger, { player, observer, openMeldCount, winningTileCount, safe });
    return danger;
  }

  function applySuitPressure(danger, tiles, safe) {
    const counts = tiles.filter(tile => NUMBER_SUITS.includes(tile.suit)).reduce((result, tile) => {
      result[tile.suit] = (result[tile.suit] || 0) + 1;
      return result;
    }, {});
    Object.entries(counts).filter(([, count]) => count >= 4).forEach(([suit, count]) => {
      const weight = Math.min(0.68, 0.28 + count * 0.06);
      for (let rank = 1; rank <= 9; rank += 1) {
        const key = `${suit}:${rank}`;
        if (!safe.has(key)) danger[key] = Math.max(danger[key] || 0, weight);
      }
    });
  }

  function applyFreshHonorPressure(state, rules, ai, danger, context) {
    const { player, observer, openMeldCount, winningTileCount, safe } = context;
    if (openMeldCount(player) < 2 && !isPlayerThreatening(state, ai, rules, openMeldCount, winningTileCount)) return;
    const seen = visibleCountsFor(state, rules, observer);
    HONOR_KEYS.forEach(key => {
      if (!safe.has(key) && !seen[key]) danger[key] = Math.max(danger[key] || 0, 0.34);
    });
  }

  function visibleSafeKeysFor(state, rules, player, observer = null) {
    return [...new Set([...state.rivers[player].map(tile => rules.tileKey(tile)), ...visibleDeadKeysFor(state, rules, observer)])];
  }

  function visibleDeadKeysFor(state, rules, observer = null) {
    const counts = visibleCountsFor(state, rules, observer);
    return Object.keys(counts).filter(key => counts[key] >= 4);
  }

  function visibleCountsFor(state, rules, observer = null) {
    const counts = {};
    const addTile = tile => {
      if (isFlower(tile)) return;
      const key = rules.tileKey(tile);
      counts[key] = (counts[key] || 0) + 1;
    };
    state.rivers.flat().forEach(addTile);
    state.melds.forEach((melds, player) => melds.filter(meld => player === observer || !["補花", "暗槓"].includes(meld.type)).flatMap(meld => meld.tiles).forEach(addTile));
    if (observer !== null) state.hands[observer].forEach(addTile);
    return counts;
  }

  function isPlayerThreatening(state, ai, rules, openMeldCount, winningTileCount) {
    return ai.handDistance(state.hands[0], rules, { openMeldCount: openMeldCount(0), winningTileCount }) <= 1;
  }

  function formatDefenseSummary(tile, options, rules) {
    const key = rules.tileKey(tile);
    const visibleRisk = (options.dangerKeys || []).includes(key);
    const directRisk = (options.opponentThreats || []).some(threat => rules.canWinWithTile(threat.hand || [], tile, threat.openMeldCount || 0, threat.winningTileCount || options.winningTileCount));
    if (!visibleRisk && !directRisk) return "";
    return `，防守${visibleRisk ? " 可視危險" : ""}${directRisk ? " 可能放槍" : ""}`;
  }

  function formatAttackSummary(decision) {
    if (!decision?.attackMode || decision.attackMode === "balanced") return "";
    return `，${decision.attackMode === "ready" ? "攻勢聽牌" : "攻勢接近"}`;
  }

  window.MahjongVisibilityAnalysis = { formatAttackSummary, formatDefenseSummary, isPlayerThreatening, visibleCountsFor, visibleDangerKeysFor, visibleDangerWeightsFor, visibleDeadKeysFor, visibleSafeKeysFor };
})();
