(function () {
  function resolveFlowers(state, player, isFlower) {
    let flowerCount = 0;
    let replacementCount = 0;
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
        replacementCount += 1;
      }
    }
    if (player === 0 && lastReplacement) state.lastDrawnId = lastReplacement.id;
    return { flowerCount, lastReplacement, newFlowerIds, needsReplacement: flowerCount > replacementCount };
  }

  function specialWinMethod(state, scoring) {
    if (!state.running || state.result) return "";
    const counts = [0, 1, 2, 3].map(player => scoring.countFlowers(state, player));
    const eightWinner = counts.findIndex(count => count >= 8);
    if (eightWinner >= 0) return { winner: eightWinner, discarder: null, method: "八仙過海", type: "eightFlowers" };
    const sevenWinner = counts.findIndex(count => count === 7);
    const discarder = sevenWinner < 0 ? -1 : counts.findIndex((count, player) => player !== sevenWinner && count > 0);
    return discarder >= 0 ? { winner: sevenWinner, discarder, method: "七搶一", type: "sevenFlowers" } : "";
  }

  window.MahjongFlowerFlow = { resolveFlowers, specialWinMethod };
})();
