(function () {
  const NUMBER_SUITS = ["character", "dot", "bamboo"];
  const SCORING_RULES = [
    { id: "basic", label: "基本胡", tai: 1, test: () => true },
    { id: "selfDraw", label: "自摸", tai: 1, test: context => context.isSelfDraw && !context.isConcealedSelfDraw },
    { id: "dealer", label: "莊家", tai: 1, test: context => context.winner === context.dealer },
    { id: "seatWind", label: "門風刻", tai: 1, test: context => context.triplets.windRanks.has(context.winner + 1) },
    { id: "roundWind", label: "圈風刻", tai: 1, test: context => context.triplets.windRanks.has(context.roundWind + 1) },
    { id: "dragon", label: "三元刻", tai: context => context.triplets.dragonCount, test: context => context.triplets.dragonCount > 0 && !context.isLittleDragons && !context.isBigDragons, note: context => `${context.triplets.dragonCount} 組` },
    { id: "flower", label: "花牌", tai: context => context.flowerCount, test: context => context.flowerCount > 0, note: context => `${context.flowerCount} 張` },
    { id: "seatFlower", label: "正花", tai: context => context.seatFlowerCount, test: context => context.seatFlowerCount > 0, note: context => `${context.seatFlowerCount} 張` },
    { id: "flowerKong", label: "花槓", tai: context => context.flowerSetCount * 2, test: context => context.flowerSetCount > 0, note: context => `${context.flowerSetCount} 組` },
    { id: "sevenFlowers", label: "七搶一", tai: 8, test: context => context.flowerCount === 7 },
    { id: "eightFlowers", label: "八仙過海", tai: 16, test: context => context.flowerCount >= 8 },
    { id: "concealed", label: "門清", tai: 1, test: context => context.isConcealed && !context.isConcealedSelfDraw },
    { id: "concealedSelfDraw", label: "門清自摸", tai: 3, test: context => context.isConcealedSelfDraw, note: () => "含自摸與門清" },
    { id: "allSequences", label: "平胡", tai: 2, test: context => context.isAllSequences },
    { id: "fullyOpen", label: "全求人", tai: 2, test: context => context.isFullyOpen },
    { id: "threeConcealedTriplets", label: "三暗刻", tai: 2, test: context => context.concealedTripletCount >= 3 },
    { id: "allTriplets", label: "碰碰胡", tai: 2, test: context => context.isAllTriplets },
    { id: "littleDragons", label: "小三元", tai: 6, test: context => context.isLittleDragons, note: () => "含 2 組三元刻" },
    { id: "bigDragons", label: "大三元", tai: 11, test: context => context.isBigDragons, note: () => "含 3 組三元刻" },
    { id: "allHonors", label: "字一色", tai: 8, test: context => context.numberSuits.size === 0 && context.hasHonors },
    { id: "mixedOneSuit", label: "混一色", tai: 2, test: context => context.numberSuits.size === 1 && context.hasHonors },
    { id: "pureOneSuit", label: "清一色", tai: 4, test: context => context.numberSuits.size === 1 && !context.hasHonors },
    { id: "kong", label: "槓牌", tai: context => context.kongCount, test: context => context.kongCount > 0, note: context => `${context.kongCount} 組` },
    { id: "kongDraw", label: "槓上開花", tai: 2, test: context => context.method.includes("槓") && context.method.includes("自摸") },
    { id: "robKong", label: "搶槓", tai: 1, test: context => context.method.includes("搶槓") },
    { id: "lastSelfDraw", label: "海底撈月", tai: 1, test: context => context.wallEmpty && context.isSelfDraw },
    { id: "lastDiscardWin", label: "河底撈魚", tai: 1, test: context => context.wallEmpty && !context.isSelfDraw }
  ];

  function openMeldCount(state, player) {
    return state.melds[player].filter(meld => meld.type !== "補花").length;
  }

  function settleTokens(state, rules, ruleset, dailyTokens, winner, discarder, winningTiles, method, winningTile = null) {
    const scoring = evaluateTokenScoring(state, rules, ruleset, winner, discarder, winningTiles, method, winningTile);
    const baseChange = state.stake * scoring.totalTai;
    const bonusChange = state.stake * state.bonusSticks;
    const change = baseChange + bonusChange;
    const before = state.tokens;
    state.tokens = winner === 0 ? state.tokens + change : Math.max(0, state.tokens - change);
    const actualDelta = state.tokens - before;
    const signed = actualDelta > 0 ? `+${actualDelta}` : actualDelta < 0 ? `-${Math.abs(actualDelta)}` : "不變";
    const brokeText = winner !== 0 && state.tokens < state.stake ? "，不足下局底注" : "";
    return {
      headline: `代幣 ${signed}${brokeText}`,
      summary: `${winner === 0 ? "本局贏得" : "本局扣除"} ${change} 代幣｜底注 ${state.stake} × ${scoring.totalTai} 台${state.bonusSticks ? ` + ${state.bonusSticks} 本場` : ""}`,
      totalTai: scoring.totalTai,
      breakdown: [
        ...scoring.items.map(item => ({ label: item.label, value: `${item.tai} 台`, note: item.note || "" })),
        { label: "台型計算", value: `${state.stake} × ${scoring.totalTai}`, note: `台型 ${baseChange}` },
        ...(state.bonusSticks ? [{ label: "本場加成", value: `+${bonusChange}`, note: `${state.bonusSticks} 本場` }] : []),
        { label: "本局計算", value: `${baseChange} + ${bonusChange}`, note: `應${winner === 0 ? "得" : "扣"} ${change}` },
        { label: "實際變化", value: signed, note: `目前代幣 ${state.tokens}` }
      ]
    };
  }

  function evaluateTokenScoring(state, rules, ruleset, winner, discarder, winningTiles, method = "", winningTile = null) {
    const allTiles = [...winningTiles, ...state.melds[winner].flatMap(meld => meld.tiles)];
    const numberSuits = new Set(allTiles.filter(tile => NUMBER_SUITS.includes(tile.suit)).map(tile => tile.suit));
    const hasHonors = allTiles.some(tile => tile.suit.startsWith("dragon") || tile.suit === "wind");
    const triplets = countTripletTypes(rules, allTiles);
    const meldCount = openMeldCount(state, winner);
    const winningPatterns = rules.getWinningPatterns(winningTiles, meldCount, ruleset.winningTileCount);
    const context = {
      winner,
      discarder,
      winningTiles,
      winningPatterns,
      method,
      allTiles,
      numberSuits,
      hasHonors,
      dealer: state.dealer,
      roundWind: state.roundWind,
      isSelfDraw: discarder === null,
      isConcealed: meldCount === 0,
      isConcealedSelfDraw: meldCount === 0 && discarder === null,
      isAllSequences: isAllSequenceStyle(state, winner, winningPatterns),
      isFullyOpen: discarder !== null && meldCount >= Math.max(1, (ruleset.winningTileCount - 2) / 3),
      isAllTriplets: isAllTripletStyle(state, winner, winningPatterns),
      concealedTripletCount: countConcealedTriplets(rules, winningPatterns, winningTile, discarder === null),
      flowerCount: countFlowers(state, winner),
      seatFlowerCount: countSeatFlowers(state, winner),
      flowerSetCount: countFlowerSets(state, winner),
      kongCount: state.melds[winner].filter(meld => meld.type.includes("槓")).length,
      triplets,
      isLittleDragons: triplets.dragonCount === 2 && triplets.dragonPairs === 1,
      isBigDragons: triplets.dragonCount === 3,
      wallEmpty: state.wall.length === 0
    };
    const items = SCORING_RULES.reduce((result, rule) => {
      if (!rule.test(context)) return result;
      const tai = typeof rule.tai === "function" ? rule.tai(context) : rule.tai;
      if (tai <= 0) return result;
      result.push({ label: rule.label, tai, note: typeof rule.note === "function" ? rule.note(context) : "" });
      return result;
    }, []);
    return { items, totalTai: items.reduce((sum, item) => sum + item.tai, 0) };
  }

  function countTripletTypes(rules, tiles) {
    const counts = tiles.reduce((result, tile) => {
      const key = rules.tileKey(tile);
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
    return Object.keys(counts).reduce((result, key) => {
      if (counts[key] < 3) return result;
      const sample = tiles.find(tile => rules.tileKey(tile) === key);
      if (key.startsWith("dragon")) result.dragonCount += 1;
      if (key.startsWith("wind")) result.windRanks.add(sample.rank);
      return result;
    }, { dragonCount: 0, dragonPairs: Object.entries(counts).filter(([key, count]) => key.startsWith("dragon") && count === 2).length, windRanks: new Set() });
  }

  function flowerTilesFor(state, player) {
    return state.melds[player].filter(meld => meld.type === "補花").flatMap(meld => meld.tiles);
  }

  function countFlowers(state, player) {
    return flowerTilesFor(state, player).length;
  }

  function countSeatFlowers(state, player) {
    const seat = player + 1;
    return flowerTilesFor(state, player).filter(tile => tile.rank === seat || tile.rank === seat + 4).length;
  }

  function countFlowerSets(state, player) {
    const ranks = new Set(flowerTilesFor(state, player).map(tile => tile.rank));
    return Number([1, 2, 3, 4].every(rank => ranks.has(rank))) + Number([5, 6, 7, 8].every(rank => ranks.has(rank)));
  }

  function countConcealedTriplets(rules, winningPatterns, winningTile = null, isSelfDraw = true) {
    const winningKey = winningTile ? rules.tileKey(winningTile) : "";
    return Math.max(0, ...winningPatterns.map(pattern => pattern.melds.filter(meld => {
      if (meld.type !== "triplet") return false;
      const key = meld.keys[0];
      return isSelfDraw || key !== winningKey;
    }).length));
  }

  function isAllTripletStyle(state, winner, winningPatterns) {
    if (state.melds[winner].some(meld => meld.type === "吃")) return false;
    return winningPatterns.some(pattern => pattern.melds.every(meld => meld.type === "triplet"));
  }

  function isAllSequenceStyle(state, winner, winningPatterns) {
    if (state.melds[winner].some(meld => meld.type !== "吃" && meld.type !== "補花")) return false;
    return winningPatterns.some(pattern => !isValuePairKey(state, pattern.pair, winner) && pattern.melds.every(meld => meld.type === "sequence"));
  }

  function isValuePairKey(state, key, winner) {
    if (key.startsWith("dragon")) return true;
    if (!key.startsWith("wind")) return false;
    const rank = Number(key.split(":")[1]);
    return rank === winner + 1 || rank === state.roundWind + 1;
  }

  window.MahjongScoring = { SCORING_RULES, countFlowers, evaluateTokenScoring, openMeldCount, settleTokens };
})();
