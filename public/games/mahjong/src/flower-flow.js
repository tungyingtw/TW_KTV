(function () {
  function resolveFlowers(state, player, isFlower) {
    let flowerCount = 0;
    let lastReplacement = null;
    const newFlowerIds = [];
    while (state.hands[player].some(isFlower)) {
      const flowers = state.hands[player].filter(isFlower);
      state.hands[player] = state.hands[player].filter(tile => !isFlower(tile));
      flowers.forEach(tile => state.melds[player].push({ type: "補花", tiles: [tile] }));
      newFlowerIds.push(...flowers.map(tile => tile.id));
      flowerCount += flowers.length;
      for (let i = 0; i < flowers.length; i += 1) {
        if (!state.wall.length) break;
        lastReplacement = state.wall.pop();
        state.hands[player].push(lastReplacement);
      }
      if (!state.wall.length) break;
    }
    if (player === 0 && lastReplacement) state.lastDrawnId = lastReplacement.id;
    return { flowerCount, lastReplacement, newFlowerIds };
  }

  function specialWinMethod(state, scoring, player) {
    if (!state.running || state.result) return "";
    const flowerCount = scoring.countFlowers(state, player);
    return flowerCount >= 8 ? "八仙過海" : flowerCount === 7 ? "七搶一" : "";
  }

  window.MahjongFlowerFlow = { resolveFlowers, specialWinMethod };
})();
