(function (root) {
  const NUMBER_SUITS = new Set(["character", "dot", "bamboo"]);

  function tileKey(tile) {
    return `${tile.suit}:${tile.rank}`;
  }

  function isNumberTileKey(key) {
    return NUMBER_SUITS.has(key.split(":")[0]);
  }

  function getRankFromKey(key) {
    return Number(key.split(":")[1]);
  }

  function getSuitFromKey(key) {
    return key.split(":")[0];
  }

  function buildCounts(tiles) {
    return tiles.reduce((counts, tile) => {
      const key = tileKey(tile);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function firstRemainingKey(counts) {
    return Object.keys(counts).sort(compareKeys).find(key => counts[key] > 0) || null;
  }

  function compareKeys(a, b) {
    const suitOrder = { character: 0, dot: 1, bamboo: 2, wind: 3, "dragon-red": 4, "dragon-green": 5, "dragon-white": 6 };
    const suitDiff = suitOrder[getSuitFromKey(a)] - suitOrder[getSuitFromKey(b)];
    return suitDiff || getRankFromKey(a) - getRankFromKey(b);
  }

  function cloneCounts(counts) {
    return { ...counts };
  }

  function countsKey(counts) {
    return Object.keys(counts).sort(compareKeys).map(key => `${key}:${counts[key]}`).join("|");
  }

  function canFormMelds(counts, memo = new Map()) {
    const cacheKey = countsKey(counts);
    if (memo.has(cacheKey)) return memo.get(cacheKey);
    const key = firstRemainingKey(counts);
    if (!key) return true;

    if (counts[key] >= 3) {
      counts[key] -= 3;
      if (canFormMelds(counts, memo)) {
        counts[key] += 3;
        memo.set(cacheKey, true);
        return true;
      }
      counts[key] += 3;
    }

    if (isNumberTileKey(key)) {
      const suit = getSuitFromKey(key);
      const rank = getRankFromKey(key);
      const second = `${suit}:${rank + 1}`;
      const third = `${suit}:${rank + 2}`;
      if (rank <= 7 && counts[second] > 0 && counts[third] > 0) {
        counts[key] -= 1;
        counts[second] -= 1;
        counts[third] -= 1;
        if (canFormMelds(counts, memo)) {
          counts[key] += 1;
          counts[second] += 1;
          counts[third] += 1;
          memo.set(cacheKey, true);
          return true;
        }
        counts[key] += 1;
        counts[second] += 1;
        counts[third] += 1;
      }
    }

    memo.set(cacheKey, false);
    return false;
  }

  function collectMeldPatterns(counts, melds = [], limit = 64) {
    const key = firstRemainingKey(counts);
    if (!key) return [{ melds: [...melds] }];
    const patterns = [];

    if (counts[key] >= 3) {
      counts[key] -= 3;
      patterns.push(...collectMeldPatterns(counts, [...melds, { type: "triplet", keys: [key, key, key] }], limit - patterns.length));
      counts[key] += 3;
    }
    if (patterns.length >= limit) return patterns.slice(0, limit);

    if (isNumberTileKey(key)) {
      const suit = getSuitFromKey(key);
      const rank = getRankFromKey(key);
      const second = `${suit}:${rank + 1}`;
      const third = `${suit}:${rank + 2}`;
      if (rank <= 7 && counts[second] > 0 && counts[third] > 0) {
        counts[key] -= 1;
        counts[second] -= 1;
        counts[third] -= 1;
        patterns.push(...collectMeldPatterns(counts, [...melds, { type: "sequence", keys: [key, second, third] }], limit - patterns.length));
        counts[key] += 1;
        counts[second] += 1;
        counts[third] += 1;
      }
    }

    return patterns.slice(0, limit);
  }

  function getWinningPatterns(tiles, openMeldCount = 0, winningTileCount = 14, limit = 64) {
    if (!Array.isArray(tiles) || tiles.length % 3 !== 2) return [];
    if ((tiles.length + openMeldCount * 3) !== winningTileCount) return [];
    const counts = buildCounts(tiles);
    return Object.keys(counts).reduce((patterns, pair) => {
      if (patterns.length >= limit) return patterns;
      if (counts[pair] < 2) return patterns;
      const copy = cloneCounts(counts);
      copy[pair] -= 2;
      collectMeldPatterns(copy, [], limit - patterns.length).forEach(pattern => patterns.push({ pair, melds: pattern.melds }));
      return patterns;
    }, []).slice(0, limit);
  }

  function isWinningHand(tiles, openMeldCount = 0, winningTileCount = 14) {
    if (!Array.isArray(tiles) || tiles.length % 3 !== 2) return false;
    if ((tiles.length + openMeldCount * 3) !== winningTileCount) return false;
    const counts = buildCounts(tiles);
    return Object.keys(counts).some(key => {
      if (counts[key] < 2) return false;
      counts[key] -= 2;
      const result = canFormMelds(counts);
      counts[key] += 2;
      return result;
    });
  }

  function canWinWithTile(tiles, tile, openMeldCount = 0, winningTileCount = 14) {
    return isWinningHand([...tiles, tile], openMeldCount, winningTileCount);
  }

  function canPong(tiles, tile) {
    const key = tileKey(tile);
    return tiles.filter(item => tileKey(item) === key).length >= 2;
  }

  function canExposedKong(tiles, tile) {
    const key = tileKey(tile);
    return tiles.filter(item => tileKey(item) === key).length >= 3;
  }

  function getConcealedKongOptions(tiles) {
    const groups = tiles.reduce((result, tile) => {
      const key = tileKey(tile);
      result[key] = result[key] || [];
      result[key].push(tile);
      return result;
    }, {});
    return Object.values(groups).filter(group => group.length === 4);
  }

  function getAddedKongOptions(tiles, melds) {
    return (melds || []).reduce((options, meld, meldIndex) => {
      if (meld.type !== "碰") return options;
      const key = tileKey(meld.tiles[0]);
      const tile = tiles.find(item => tileKey(item) === key);
      if (tile) options.push({ meldIndex, tile, tiles: [...meld.tiles, tile] });
      return options;
    }, []);
  }

  function findTile(tiles, suit, rank, usedTiles) {
    return tiles.find(tile => tile.suit === suit && tile.rank === rank && !usedTiles.has(tile));
  }

  function getChiOptions(tiles, tile) {
    if (!NUMBER_SUITS.has(tile.suit)) return [];
    const patterns = [
      [tile.rank - 2, tile.rank - 1],
      [tile.rank - 1, tile.rank + 1],
      [tile.rank + 1, tile.rank + 2]
    ];
    return patterns.reduce((options, ranks) => {
      if (ranks.some(rank => rank < 1 || rank > 9)) return options;
      const usedTiles = new Set();
      const pair = ranks.map(rank => {
        const match = findTile(tiles, tile.suit, rank, usedTiles);
        if (match) usedTiles.add(match);
        return match;
      });
      if (pair.every(Boolean)) options.push(pair);
      return options;
    }, []);
  }

  const api = { isWinningHand, canWinWithTile, getWinningPatterns, canPong, canExposedKong, getConcealedKongOptions, getAddedKongOptions, getChiOptions, tileKey };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.MahjongRules = api;
})(typeof window !== "undefined" ? window : globalThis);
