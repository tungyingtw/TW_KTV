(function () {
  const NUMBER_SUITS = ["character", "dot", "bamboo"];
  const SCORING_RULES = [
    { id: "basic", label: "基本胡", tai: 1, test: () => true },
    { id: "selfDraw", label: "自摸", tai: 1, test: context => context.isSelfDraw && !context.isConcealedSelfDraw },
    { id: "seatWind", label: "門風刻", tai: 1, test: context => context.triplets.windRanks.has(context.winner + 1) },
    { id: "roundWind", label: "圈風刻", tai: 1, test: context => context.triplets.windRanks.has(context.roundWind + 1) },
    { id: "dragon", label: "三元刻", tai: context => context.triplets.dragonCount, test: context => context.triplets.dragonCount > 0 && !context.isLittleDragons && !context.isBigDragons, note: context => `${context.triplets.dragonCount} 組` },
    { id: "flower", label: "花牌", tai: context => context.flowerCount, test: context => context.flowerCount > 0, note: context => `${context.flowerCount} 張` },
    { id: "seatFlower", label: "正花", tai: context => context.seatFlowerCount, test: context => context.seatFlowerCount > 0, note: context => `${context.seatFlowerCount} 張` },
    { id: "flowerKong", label: "花槓", tai: context => context.flowerSetCount * 2, test: context => context.flowerSetCount > 0, note: context => `${context.flowerSetCount} 組` },
    { id: "concealed", label: "門清", tai: 1, test: context => context.isConcealed && !context.isConcealedSelfDraw },
    { id: "concealedSelfDraw", label: "門清自摸", tai: 3, test: context => context.isConcealedSelfDraw, note: () => "含自摸與門清" },
    { id: "allSequences", label: "平胡", tai: 2, test: context => context.isAllSequences },
    { id: "fullyOpen", label: "全求人", tai: 2, test: context => context.isFullyOpen },
    { id: "threeConcealedTriplets", label: "三暗刻", tai: 2, test: context => context.concealedTripletCount >= 3 },
    { id: "allTriplets", label: "碰碰胡", tai: 4, test: context => context.isAllTriplets },
    { id: "littleDragons", label: "小三元", tai: 4, test: context => context.isLittleDragons, note: () => "不重複列三元刻" },
    { id: "bigDragons", label: "大三元", tai: 8, test: context => context.isBigDragons, note: () => "不重複列三元刻" },
    { id: "allHonors", label: "字一色", tai: 16, test: context => context.numberSuits.size === 0 && context.hasHonors },
    { id: "mixedOneSuit", label: "混一色", tai: 4, test: context => context.numberSuits.size === 1 && context.hasHonors },
    { id: "pureOneSuit", label: "清一色", tai: 8, test: context => context.numberSuits.size === 1 && !context.hasHonors },
    { id: "kong", label: "槓牌", tai: context => context.kongCount, test: context => context.kongCount > 0, note: context => `${context.kongCount} 組` },
    { id: "kongDraw", label: "槓上開花", tai: 2, test: context => context.event === "kongDraw" },
    { id: "robKong", label: "搶槓", tai: 1, test: context => context.event === "robKong" },
    { id: "lastSelfDraw", label: "海底撈月", tai: 1, test: context => context.wallEmpty && context.isSelfDraw },
    { id: "lastDiscardWin", label: "河底撈魚", tai: 1, test: context => context.wallEmpty && context.event === "discard" }
  ];

  function openMeldCount(state, player) {
    return state.melds[player].filter(meld => meld.type !== "補花").length;
  }

  function settleTokens(state, rules, ruleset, dailyTokens, winner, discarder, winningTiles, method, winningTile = null, event = discarder === null ? "selfDraw" : "discard", specialWin = null) {
    const scoring = evaluateTokenScoring(state, rules, ruleset, winner, discarder, winningTiles, method, winningTile, event, specialWin);
    const payments = buildPayments(state, scoring.totalTai, winner, discarder);
    const playerPayments = payments.filter(payment => payment.payer === 0 || winner === 0);
    const expectedDelta = playerPayments.reduce((total, payment) => total + (winner === 0 ? payment.amount : -payment.amount), 0);
    const before = state.tokens;
    state.tokens = Math.max(0, state.tokens + expectedDelta);
    const actualDelta = state.tokens - before;
    const expectedAmount = Math.abs(expectedDelta);
    const actualAmount = Math.abs(actualDelta);
    const signed = actualDelta > 0 ? `+${actualDelta}` : actualDelta < 0 ? `-${actualAmount}` : "不變";
    const brokeText = winner !== 0 && state.tokens < state.stake ? "，不足下局底注" : "";
    const action = actualDelta > 0 ? "贏得" : actualDelta < 0 ? "扣除" : "無直接收付";
    const paymentBreakdown = playerPayments.map(payment => ({
      label: winner === 0 ? "本局收款" : "本局付款",
      value: `${winner === 0 ? "+" : "-"}${payment.amount}`,
      note: paymentNote(payment)
    }));
    return {
      headline: actualDelta ? `代幣 ${signed}${brokeText}` : "代幣不變",
      summary: expectedAmount ? `本局${action} ${actualAmount} 代幣${actualAmount !== expectedAmount ? `（應付 ${expectedAmount}）` : ""}｜台型 ${scoring.totalTai} 台` : `本局與玩家無直接收付｜台型 ${scoring.totalTai} 台`,
      totalTai: scoring.totalTai,
      actualDelta,
      breakdown: [
        ...scoring.items.map(item => ({ label: item.label, value: `${item.tai} 台`, note: item.note || "" })),
        { label: "台型基準", value: `${state.stake} × ${scoring.totalTai}`, note: `每筆基準 ${state.stake * scoring.totalTai}` },
        ...paymentBreakdown,
        { label: "本局計算", value: `${expectedDelta > 0 ? "+" : expectedDelta < 0 ? "-" : ""}${expectedAmount}`, note: expectedAmount ? `應${winner === 0 ? "得" : "付"} ${expectedAmount}` : "玩家不參與本局收付" },
        { label: "實際變化", value: signed, note: `目前代幣 ${state.tokens}` }
      ]
    };
  }

  function buildPayments(state, totalTai, winner, discarder) {
    const payers = discarder === null ? [0, 1, 2, 3].filter(player => player !== winner) : [discarder];
    return payers.map(payer => {
      const dealerSettlement = winner === state.dealer || payer === state.dealer;
      const dealerTai = dealerSettlement ? 1 : 0;
      const bonusTai = dealerSettlement ? state.bonusSticks : 0;
      return { payer, amount: state.stake * (totalTai + dealerTai + bonusTai), dealerTai, bonusTai };
    });
  }

  function paymentNote(payment) {
    return [payment.dealerTai ? "莊家收付 +1 台" : "閒家收付", payment.bonusTai ? `${payment.bonusTai} 本場` : ""].filter(Boolean).join("、");
  }

  function evaluateTokenScoring(state, rules, ruleset, winner, discarder, winningTiles, method = "", winningTile = null, event = discarder === null ? "selfDraw" : "discard", specialWin = null) {
    if (specialWin) return flowerScoring(specialWin);
    const openMelds = state.melds[winner].filter(meld => meld.type !== "補花");
    const allTiles = [...winningTiles, ...openMelds.flatMap(meld => meld.tiles)];
    const numberSuits = new Set(allTiles.filter(tile => NUMBER_SUITS.includes(tile.suit)).map(tile => tile.suit));
    const hasHonors = allTiles.some(tile => tile.suit.startsWith("dragon") || tile.suit === "wind");
    const winningKey = winningTile ? rules.tileKey(winningTile) : "";
    return rules.getWinningPatterns(winningTiles, openMelds.length, ruleset.winningTileCount)
      .flatMap((pattern, order) => winningMeldIndexes(pattern, winningKey).map((winningMeldIndex, assignment) => scorePattern(makeContext(state, rules, ruleset, winner, discarder, winningKey, winningMeldIndex, event, openMelds, allTiles, numberSuits, hasHonors, pattern), order, assignment)))
      .sort((a, b) => b.totalTai - a.totalTai || a.order - b.order)[0] || { items: [], totalTai: 0 };
  }

  function flowerScoring(specialWin) {
    const tai = specialWin.type === "eightFlowers" ? 16 : 8;
    return { items: [{ label: "基本胡", tai: 1, note: "花胡基礎" }, { label: tai === 16 ? "八仙過海" : "七搶一", tai, note: "特殊花胡不疊一般台型" }], totalTai: tai + 1 };
  }

  function makeContext(state, rules, ruleset, winner, discarder, winningKey, winningMeldIndex, event, openMelds, allTiles, numberSuits, hasHonors, pattern) {
    const isSelfDraw = event === "selfDraw" || event === "kongDraw";
    const isConcealed = openMelds.every(meld => meld.type === "暗槓");
    const triplets = countPatternTriplets(rules, pattern, openMelds);
    return {
      winner, discarder, event, allTiles, numberSuits, hasHonors, roundWind: state.roundWind, isSelfDraw, isConcealed, isConcealedSelfDraw: isConcealed && isSelfDraw,
      isAllSequences: !isSelfDraw && !hasHonors && countFlowers(state, winner) === 0 && openMelds.every(meld => meld.type === "吃") && pattern.melds.every(meld => meld.type === "sequence") && isNumberKey(pattern.pair) && hasTwoSidedWait(pattern, winningMeldIndex, winningKey),
      isFullyOpen: !isSelfDraw && openMelds.length === (ruleset.winningTileCount - 2) / 3 && openMelds.every(meld => ["吃", "碰", "明槓", "補槓"].includes(meld.type)),
      isAllTriplets: !(numberSuits.size === 0 && hasHonors) && openMelds.every(meld => meld.type !== "吃") && pattern.melds.every(meld => meld.type === "triplet"),
      concealedTripletCount: countConcealedTriplets(pattern, openMelds, winningMeldIndex, isSelfDraw), flowerCount: countFlowers(state, winner), seatFlowerCount: countSeatFlowers(state, winner), flowerSetCount: countFlowerSets(state, winner), kongCount: openMelds.filter(meld => meld.type.includes("槓")).length,
      triplets, isLittleDragons: triplets.dragonCount === 2 && pattern.pair.startsWith("dragon"), isBigDragons: triplets.dragonCount === 3, wallEmpty: state.wall.length === 0
    };
  }

  function scorePattern(context, order, assignment) {
    const items = SCORING_RULES.reduce((result, rule) => {
      if (!rule.test(context)) return result;
      const tai = typeof rule.tai === "function" ? rule.tai(context) : rule.tai;
      if (tai > 0) result.push({ label: rule.label, tai, note: typeof rule.note === "function" ? rule.note(context) : "" });
      return result;
    }, []);
    return { items, totalTai: items.reduce((sum, item) => sum + item.tai, 0), order: order * 10 + assignment };
  }

  function countPatternTriplets(rules, pattern, openMelds) {
    const keys = [...pattern.melds.filter(meld => meld.type === "triplet").map(meld => meld.keys[0]), ...openMelds.filter(meld => meld.type !== "吃").map(meld => rules.tileKey(meld.tiles[0]))];
    return keys.reduce((result, key) => {
      if (key.startsWith("dragon")) result.dragonCount += 1;
      if (key.startsWith("wind")) result.windRanks.add(Number(key.split(":")[1]));
      return result;
    }, { dragonCount: 0, windRanks: new Set() });
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

  function winningMeldIndexes(pattern, winningKey) {
    const indexes = pattern.melds.flatMap((meld, index) => meld.keys.includes(winningKey) ? [index] : []);
    return indexes.length ? indexes : [-1];
  }

  function countConcealedTriplets(pattern, openMelds, winningMeldIndex, isSelfDraw) {
    const concealed = pattern.melds.filter((meld, index) => meld.type === "triplet" && (isSelfDraw || index !== winningMeldIndex)).length;
    return concealed + openMelds.filter(meld => meld.type === "暗槓").length;
  }

  function isNumberKey(key) {
    return NUMBER_SUITS.includes(key.split(":")[0]);
  }

  function hasTwoSidedWait(pattern, winningMeldIndex, winningKey) {
    if (!winningKey || !isNumberKey(winningKey)) return false;
    const rank = Number(winningKey.split(":")[1]);
    const meld = pattern.melds[winningMeldIndex];
    if (!meld || meld.type !== "sequence") return false;
    const start = Number(meld.keys[0].split(":")[1]);
    if (rank === start + 1) return false;
    return rank === start ? start >= 1 && start <= 6 : start >= 2 && start <= 7;
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
