(function (root) {
  const DIFFICULTY = {
    easy: { pair: 6, triplet: 6, near1: 3, near2: 1, middle: 1, claimMargin: 8, claimTolerance: 2, randomDiscard: 0.34, claimChance: 0.45, kongChance: 0.42, kongRisk: -1, defense: 0, readyDefense: 0, closeDefense: 0, maxOpenMelds: 2, minHandAfterCall: 7 },
    normal: { pair: 10, triplet: 10, near1: 6, near2: 3, middle: 1, claimMargin: 5, claimTolerance: 0, randomDiscard: 0, claimChance: 1, kongChance: 0.76, kongRisk: 0, defense: 95, readyDefense: 0.58, closeDefense: 0.82, maxOpenMelds: 2, minHandAfterCall: 5 },
    hard: { pair: 14, triplet: 12, near1: 9, near2: 4, middle: 2, claimMargin: 1, claimTolerance: 1, randomDiscard: 0, claimChance: 1, kongChance: 1, kongRisk: 1, defense: 280, readyDefense: 0.2, closeDefense: 0.52, maxOpenMelds: 4, minHandAfterCall: 5 }
  };

  function profileFor(difficulty = "normal") {
    return DIFFICULTY[difficulty] || DIFFICULTY.normal;
  }

  function tileSortKey(key) {
    const suitOrder = { character: 0, dot: 1, bamboo: 2, wind: 3, "dragon-red": 4, "dragon-green": 5, "dragon-white": 6 };
    const [suit, rank] = key.split(":");
    return (suitOrder[suit] ?? 9) * 10 + Number(rank);
  }

  function buildCounts(tiles, rules) {
    return tiles.reduce((counts, tile) => {
      const key = rules.tileKey(tile);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function firstKey(counts) {
    return Object.keys(counts).sort((a, b) => tileSortKey(a) - tileSortKey(b)).find(key => counts[key] > 0) || null;
  }

  function isNumberKey(key) {
    return ["character", "dot", "bamboo"].includes(key.split(":")[0]);
  }

  function analyzeGroups(counts, targetMelds, usedPair = false, memo = new Map()) {
    const key = firstKey(counts);
    if (!key) return { melds: 0, pairs: 0, waits: 0 };
    const cacheKey = `${key}|${usedPair}|${Object.keys(counts).sort().map(item => `${item}:${counts[item]}`).join(",")}`;
    if (memo.has(cacheKey)) return memo.get(cacheKey);
    const candidates = [];
    const take = (keys, nextUsedPair, bonus) => {
      keys.forEach(item => counts[item] -= 1);
      const result = analyzeGroups(counts, targetMelds, nextUsedPair, memo);
      keys.forEach(item => counts[item] += 1);
      candidates.push({ melds: result.melds + (bonus.melds || 0), pairs: result.pairs + (bonus.pairs || 0), waits: result.waits + (bonus.waits || 0) });
    };

    if (counts[key] >= 3) take([key, key, key], usedPair, { melds: 1 });
    if (!usedPair && counts[key] >= 2) take([key, key], true, { pairs: 1 });
    if (counts[key] >= 2) take([key, key], usedPair, { waits: 1 });
    if (isNumberKey(key)) {
      const [suit, rankText] = key.split(":");
      const rank = Number(rankText);
      const second = `${suit}:${rank + 1}`;
      const third = `${suit}:${rank + 2}`;
      if (rank <= 7 && counts[second] > 0 && counts[third] > 0) take([key, second, third], usedPair, { melds: 1 });
      if (rank <= 8 && counts[second] > 0) take([key, second], usedPair, { waits: 1 });
      if (rank <= 7 && counts[third] > 0) take([key, third], usedPair, { waits: 1 });
    }

    counts[key] -= 1;
    const skipped = analyzeGroups(counts, targetMelds, usedPair, memo);
    counts[key] += 1;
    candidates.push(skipped);

    const best = candidates
      .map(result => ({ ...result, score: Math.min(result.melds, targetMelds) * 6 + Math.min(result.waits, Math.max(0, targetMelds - result.melds)) * 2 + Math.min(result.pairs, 1) * 3 }))
      .sort((a, b) => b.score - a.score)[0];
    memo.set(cacheKey, best);
    return best;
  }

  function handDistance(tiles, rules, options = {}) {
    const winningTileCount = options.winningTileCount || 14;
    const openMeldCount = options.openMeldCount || 0;
    const targetMelds = Math.max(0, (winningTileCount - 2) / 3 - openMeldCount);
    const groups = analyzeGroups(buildCounts(tiles, rules), targetMelds);
    const missingMelds = Math.max(0, targetMelds - groups.melds);
    const usefulWaits = Math.min(groups.waits, missingMelds);
    const hasPair = groups.pairs > 0;
    return missingMelds * 2 - usefulWaits + (hasPair ? 0 : 1);
  }

  function candidateDraws(hand, rules) {
    const keys = new Set(hand.map(tile => rules.tileKey(tile)));
    hand.forEach(tile => {
      if (!["character", "dot", "bamboo"].includes(tile.suit)) return;
      [tile.rank - 2, tile.rank - 1, tile.rank + 1, tile.rank + 2].forEach(rank => {
        if (rank >= 1 && rank <= 9) keys.add(`${tile.suit}:${rank}`);
      });
    });
    return [...keys].map(key => {
      const [suit, rank] = key.split(":");
      return { suit, rank: Number(rank), id: `draw:${key}`, order: tileSortKey(key), label: key };
    });
  }

  function allTileCandidates() {
    const suits = ["character", "dot", "bamboo"];
    const labels = { character: "萬", dot: "筒", bamboo: "條", wind: ["東", "南", "西", "北"], "dragon-red": "中", "dragon-green": "發", "dragon-white": "白" };
    const imagePrefix = { character: "Man", dot: "Pin", bamboo: "Sou" };
    const tiles = suits.flatMap(suit => Array.from({ length: 9 }, (_, index) => {
      const rank = index + 1;
      return { suit, rank, id: `wait:${suit}:${rank}`, order: tileSortKey(`${suit}:${rank}`), label: `${rank}${labels[suit]}`, image: `${imagePrefix[suit]}${rank}.svg` };
    }));
    const honorImages = { wind: ["Ton.svg", "Nan.svg", "Shaa.svg", "Pei.svg"], "dragon-red": ["Chun.svg"], "dragon-green": ["Hatsu.svg"], "dragon-white": ["Haku.svg"] };
    ["wind", "dragon-red", "dragon-green", "dragon-white"].forEach(suit => {
      const maxRank = suit === "wind" ? 4 : 1;
      for (let rank = 1; rank <= maxRank; rank += 1) tiles.push({ suit, rank, id: `wait:${suit}:${rank}`, order: tileSortKey(`${suit}:${rank}`), label: Array.isArray(labels[suit]) ? labels[suit][rank - 1] : labels[suit], image: honorImages[suit][rank - 1] });
    });
    return tiles;
  }

  function analyzeListening(hand, rules, options = {}) {
    const openMeldCount = options.openMeldCount || 0;
    const winningTileCount = options.winningTileCount || 14;
    const candidates = allTileCandidates();
    return hand
      .map(discard => {
        const afterDiscard = hand.filter(tile => tile.id !== discard.id);
        const waits = candidates.filter(tile => rules.canWinWithTile(afterDiscard, tile, openMeldCount, winningTileCount));
        const counts = buildCounts(afterDiscard, rules);
        const effective = waits.reduce((total, tile) => total + Math.max(0, 4 - (counts[rules.tileKey(tile)] || 0)), 0);
        return { discard, waits, effective };
      })
      .filter(result => result.waits.length)
      .sort((a, b) => b.effective - a.effective || b.waits.length - a.waits.length || a.discard.order - b.discard.order);
  }

  function effectiveDrawCount(hand, rules, options = {}) {
    const base = handDistance(hand, rules, options);
    return candidateDraws(hand, rules).filter(tile => handDistance([...hand, tile], rules, options) < base).length;
  }

  function canOpenMeld(hand, difficulty = "normal", options = {}, tilesUsed = 2) {
    const profile = profileFor(difficulty);
    const openMeldCount = options.openMeldCount || 0;
    const winningTileCount = options.winningTileCount || 14;
    const maxMelds = Math.max(1, (winningTileCount - 2) / 3);
    const handAfterCall = hand.length - tilesUsed;
    if (openMeldCount >= Math.min(profile.maxOpenMelds, maxMelds - 1)) return false;
    if (handAfterCall < profile.minHandAfterCall) return false;
    return !options.enforceHandRhythm || (tilesUsed === 3 ? handAfterCall % 3 === 1 : handAfterCall % 3 === 2);
  }

  function removeTileIds(hand, tiles) {
    const used = new Set(tiles.map(tile => tile.id));
    return hand.filter(tile => !used.has(tile.id));
  }

  function removeMatchingTiles(hand, target, rules, amount) {
    let taken = 0;
    return hand.filter(tile => {
      if (taken < amount && rules.tileKey(tile) === rules.tileKey(target)) {
        taken += 1;
        return false;
      }
      return true;
    });
  }

  function callShapeDelta(hand, afterHand, rules, difficulty = "normal", options = {}) {
    if (difficulty === "easy") return -profileFor(difficulty).claimTolerance;
    const before = handDistance(hand, rules, options);
    const afterOptions = { ...options, openMeldCount: (options.openMeldCount || 0) + 1 };
    const after = handDistance(afterHand, rules, afterOptions);
    return after - before;
  }

  function shouldOpenForShape(hand, afterHand, rules, difficulty = "normal", options = {}) {
    const profile = profileFor(difficulty);
    if (callShapeDelta(hand, afterHand, rules, difficulty, options) > profile.claimTolerance) return false;
    if (difficulty === "easy") return true;
    const afterOptions = { ...options, openMeldCount: (options.openMeldCount || 0) + 1 };
    const beforeEffective = effectiveDrawCount(hand, rules, options);
    const afterEffective = effectiveDrawCount(afterHand, rules, afterOptions);
    const attackMode = evaluateAttackMode(hand, rules, difficulty, options).mode;
    const toleratedLoss = attackMode === "ready" ? 6 : difficulty === "hard" ? 4 : 3;
    return afterEffective + toleratedLoss >= Math.max(1, beforeEffective);
  }

  function tileValue(tile, hand, rules, difficulty = "normal") {
    const profile = profileFor(difficulty);
    let value = 0;
    const same = hand.filter(item => rules.tileKey(item) === rules.tileKey(tile)).length;
    if (same >= 2) value += profile.pair;
    if (same >= 3) value += profile.triplet;
    if (["character", "dot", "bamboo"].includes(tile.suit)) {
      if (hand.some(item => item.suit === tile.suit && Math.abs(item.rank - tile.rank) === 1)) value += profile.near1;
      if (hand.some(item => item.suit === tile.suit && Math.abs(item.rank - tile.rank) === 2)) value += profile.near2;
      value += (5 - Math.abs(5 - tile.rank)) * profile.middle;
    }
    return value;
  }

  function chooseDiscard(hand, rules, difficulty = "normal", options = {}) {
    if (!hand.length) return null;
    const profile = profileFor(difficulty);
    if (profile.randomDiscard && Math.random() < profile.randomDiscard) return { tile: hand[Math.floor(Math.random() * hand.length)], score: -1 };
    const attackMode = evaluateAttackMode(hand, rules, difficulty, options);
    const tunedOptions = { ...options, attackMode: attackMode.mode };
    if (difficulty === "hard") {
      const listening = analyzeListening(hand, rules, tunedOptions);
      if (listening.length) {
        return listening
          .map(result => ({ tile: result.discard, score: -1000 - result.effective + defensivePenalty(result.discard, rules, difficulty, tunedOptions), distance: 0, effective: result.effective, waits: result.waits, attackMode: attackMode.mode }))
          .sort((a, b) => a.score - b.score || b.effective - a.effective || a.tile.order - b.tile.order)[0];
      }
      return hand
        .map(tile => {
          const afterDiscard = hand.filter(item => item.id !== tile.id);
          const distance = handDistance(afterDiscard, rules, tunedOptions);
          const effective = effectiveDrawCount(afterDiscard, rules, tunedOptions);
          return { tile, score: distance * 100 - effective * 4 - tileValue(tile, hand, rules, difficulty) + defensivePenalty(tile, rules, difficulty, tunedOptions), distance, effective, attackMode: attackMode.mode };
        })
        .sort((a, b) => a.score - b.score || b.tile.order - a.tile.order)[0];
    }
    return hand
      .map(tile => ({ tile, ...discardShapeScore(tile, hand, rules, difficulty, tunedOptions), attackMode: attackMode.mode }))
      .sort((a, b) => a.score - b.score || b.tile.order - a.tile.order)[0];
  }

  function discardShapeScore(tile, hand, rules, difficulty = "normal", options = {}) {
    const afterDiscard = hand.filter(item => item.id !== tile.id);
    const distance = difficulty === "easy" ? 0 : handDistance(afterDiscard, rules, options);
    const effective = difficulty === "easy" ? 0 : effectiveDrawCount(afterDiscard, rules, options);
    const shapeWeight = difficulty === "normal" ? 28 : 12;
    const effectiveWeight = difficulty === "normal" ? 2 : 1;
    return {
      score: tileValue(tile, hand, rules, difficulty) + distance * shapeWeight - effective * effectiveWeight + defensivePenalty(tile, rules, difficulty, options),
      distance,
      effective
    };
  }

  function evaluateAttackMode(hand, rules, difficulty = "normal", options = {}) {
    if (difficulty === "easy") return { mode: "loose", distance: null, effective: null };
    const distance = handDistance(hand, rules, options);
    const effective = effectiveDrawCount(hand, rules, options);
    if (distance <= 1 || analyzeListening(hand, rules, options).length) return { mode: "ready", distance, effective };
    if (difficulty === "hard" && distance <= 2 && effective >= 5) return { mode: "close", distance, effective };
    return { mode: "balanced", distance, effective };
  }

  function defensivePenalty(tile, rules, difficulty = "normal", options = {}) {
    const profile = profileFor(difficulty);
    if (!profile.defense) return 0;
    const attackScale = options.attackMode === "ready" ? profile.readyDefense : options.attackMode === "close" ? profile.closeDefense : 1;
    const key = rules.tileKey(tile);
    const dangerWeight = options.dangerWeights?.[key] ?? ((options.dangerKeys || []).includes(key) ? 0.45 : 0);
    const visiblePenalty = profile.defense * attackScale * dangerWeight;
    const safeBonus = (options.safeKeys || []).includes(key) ? profile.defense * attackScale * 0.32 : 0;
    const threatPenalty = (options.opponentThreats || []).reduce((total, threat) => {
      const canWin = rules.canWinWithTile(threat.hand || [], tile, threat.openMeldCount || 0, threat.winningTileCount || options.winningTileCount || 14);
      return total + (canWin ? profile.defense * attackScale * (threat.weight || 1) : 0);
    }, 0);
    return visiblePenalty + threatPenalty - safeBonus;
  }

  function shouldClaimPong(hand, tile, rules, difficulty = "normal", options = {}) {
    if (!rules.canPong(hand, tile)) return false;
    if (!canOpenMeld(hand, difficulty, options, 2)) return false;
    const profile = profileFor(difficulty);
    if (profile.claimChance < 1 && Math.random() > profile.claimChance) return false;
    if (!shouldOpenForShape(hand, removeMatchingTiles(hand, tile, rules, 2), rules, difficulty, options)) return false;
    const current = Math.min(...hand.map(item => tileValue(item, hand, rules, difficulty)));
    return tileValue(tile, hand, rules, difficulty) >= current + profile.claimMargin;
  }

  function shouldClaimKong(hand, tile, rules, difficulty = "normal", options = {}) {
    if (!rules.canExposedKong(hand, tile)) return false;
    if (!canOpenMeld(hand, difficulty, options, 3)) return false;
    if (!shouldOpenForShape(hand, removeMatchingTiles(hand, tile, rules, 3), rules, difficulty, options)) return false;
    return difficulty === "easy" ? Math.random() < 0.55 : true;
  }

  function chooseChiOption(hand, tile, rules, difficulty = "normal", aiOptions = {}) {
    const chiOptions = rules.getChiOptions(hand, tile);
    if (!chiOptions.length) return null;
    if (!canOpenMeld(hand, difficulty, aiOptions, 2)) return null;
    const profile = profileFor(difficulty);
    if (profile.claimChance < 1 && Math.random() > profile.claimChance) return null;
    return chiOptions
      .map(option => {
        const afterHand = removeTileIds(hand, option);
        return { option, score: claimOptionScore(hand, afterHand, [...option, tile], rules, difficulty, aiOptions), afterHand };
      })
      .filter(result => shouldOpenForShape(hand, result.afterHand, rules, difficulty, aiOptions))
      .sort((a, b) => a.score - b.score)[0]?.option || null;
  }

  function claimOptionScore(hand, afterHand, tiles, rules, difficulty = "normal", options = {}) {
    if (difficulty === "easy") return -tiles.reduce((total, item) => total + tileValue(item, hand, rules, difficulty), 0);
    const afterOptions = { ...options, openMeldCount: (options.openMeldCount || 0) + 1 };
    const before = handShapeScore(hand, rules, options);
    const after = handShapeScore(afterHand, rules, afterOptions);
    const meldValue = tiles.reduce((total, item) => total + tileValue(item, hand, rules, difficulty), 0) * (difficulty === "hard" ? 0.08 : 0.04);
    return after - before - meldValue;
  }

  function chooseDiscardAfterMeld(hand, rules, difficulty = "normal", options = {}) {
    return chooseDiscard(hand, rules, difficulty, options)?.tile || null;
  }

  function handShapeScore(hand, rules, options = {}) {
    const distance = handDistance(hand, rules, options);
    const effective = effectiveDrawCount(hand, rules, options);
    const listening = analyzeListening(hand, rules, options);
    return distance * 100 - effective * 3 - listening.length * 8;
  }

  function chooseConcealedKongOption(hand, kongOptions, rules, difficulty = "normal", options = {}) {
    const profile = profileFor(difficulty);
    if (!kongOptions.length || Math.random() > profile.kongChance) return null;
    const before = handShapeScore(hand, rules, options);
    return kongOptions
      .map(option => {
        const used = new Set(option.map(tile => tile.id));
        const afterHand = hand.filter(tile => !used.has(tile.id));
        const afterOptions = { ...options, openMeldCount: (options.openMeldCount || 0) + 1 };
        return { option, score: handShapeScore(afterHand, rules, afterOptions) - before - tileValue(option[0], hand, rules, difficulty) * 0.25 };
      })
      .filter(item => item.score <= profile.kongRisk * 100)
      .sort((a, b) => a.score - b.score || b.option[0].order - a.option[0].order)[0]?.option || null;
  }

  function chooseAddedKongOption(hand, kongOptions, rules, difficulty = "normal", options = {}) {
    const profile = profileFor(difficulty);
    if (!kongOptions.length || Math.random() > profile.kongChance) return null;
    const before = handShapeScore(hand, rules, options);
    return kongOptions
      .map(option => {
        const afterHand = hand.filter(tile => tile.id !== option.tile.id);
        return { option, score: handShapeScore(afterHand, rules, options) - before - tileValue(option.tile, hand, rules, difficulty) * 0.2 };
      })
      .filter(item => item.score <= profile.kongRisk * 100)
      .sort((a, b) => a.score - b.score || b.option.tile.order - a.option.tile.order)[0]?.option || null;
  }

  function sameOption(left, right) {
    if (!left || !right || left.length !== right.length) return false;
    const leftIds = left.map(tile => tile.id).sort().join("|");
    const rightIds = right.map(tile => tile.id).sort().join("|");
    return leftIds === rightIds;
  }

  function chooseClaimAction(hand, tile, rules, difficulty = "normal", options = {}) {
    if (options.canWin) return { type: "win" };
    if (options.canKong && shouldClaimKong(hand, tile, rules, difficulty, options)) return { type: "kong" };
    if (options.canPong && shouldClaimPong(hand, tile, rules, difficulty, options)) return { type: "pong" };
    if (options.chiOptions?.length) {
      const option = chooseChiOption(hand, tile, rules, difficulty, options);
      const index = option ? options.chiOptions.findIndex(candidate => sameOption(candidate, option)) : -1;
      if (index >= 0) return { type: "chi", index, option };
    }
    return { type: "pass" };
  }

  const api = { tileValue, handDistance, effectiveDrawCount, analyzeListening, canOpenMeld, chooseDiscard, evaluateAttackMode, shouldClaimPong, shouldClaimKong, chooseChiOption, chooseDiscardAfterMeld, chooseConcealedKongOption, chooseAddedKongOption, chooseClaimAction };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.MahjongAI = api;
})(typeof window !== "undefined" ? window : globalThis);
