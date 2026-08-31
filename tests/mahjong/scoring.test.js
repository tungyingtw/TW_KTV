import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
["rules", "scoring", "flower-flow"].forEach(name => vm.runInNewContext(fs.readFileSync(new URL(`../../public/games/mahjong/src/${name}.js`, import.meta.url), "utf8"), sandbox));
const { MahjongRules: rules, MahjongScoring: scoring, MahjongFlowerFlow: flowers } = sandbox.window;
const ruleset = { winningTileCount: 17 };
const tile = (suit, rank, copy = 0) => ({ suit, rank, id: `${suit}-${rank}-${copy}`, label: `${suit}:${rank}` });
const hand = [
  ...[1, 2, 3, 4, 5, 6].map((rank, index) => tile("character", rank, index)),
  ...[2, 3, 4, 8, 8].map((rank, index) => tile("dot", rank, index + 10)),
  ...[4, 5, 6, 7, 8, 9].map((rank, index) => tile("bamboo", rank, index + 20))
];
const selfDrawHand = [
  ...[1, 1, 1, 4, 5, 6, 9, 9].map((rank, index) => tile("character", rank, index + 40)),
  ...[2, 2, 2].map((rank, index) => tile("dot", rank, index + 50)),
  ...[4, 5, 6, 7, 8, 9].map((rank, index) => tile("bamboo", rank, index + 60))
];

function state({ tokens = 5000, dealer = 3, bonusSticks = 2 } = {}) {
  return { tokens, stake: 100, dealer, bonusSticks, roundWind: 0, wall: [tile("character", 9)], melds: [[], [], [], []] };
}

function settle(options) {
  const game = state(options);
  const winningTiles = options.discarder === null ? selfDrawHand : hand;
  const result = scoring.settleTokens(game, rules, ruleset, 5000, options.winner, options.discarder, winningTiles, "胡牌", winningTiles.at(-1));
  return { game, result };
}

[
  [{ winner: 0, discarder: 1, dealer: 3 }, 400, "玩家胡閒家放槍"],
  [{ winner: 0, discarder: 3, dealer: 3 }, 700, "玩家胡莊家放槍"],
  [{ winner: 0, discarder: 1, dealer: 0 }, 700, "玩家莊家胡放槍"],
  [{ winner: 0, discarder: null, dealer: 3 }, 1500, "玩家閒家自摸"],
  [{ winner: 0, discarder: null, dealer: 0 }, 2100, "玩家莊家自摸"],
  [{ winner: 1, discarder: null, dealer: 0 }, -700, "閒家自摸玩家莊家付款"],
  [{ winner: 3, discarder: null, dealer: 3 }, -700, "莊家自摸玩家閒家付款"],
  [{ winner: 1, discarder: 2, dealer: 3 }, 0, "電腦互相放槍"],
].forEach(([options, expected, name]) => {
  const { game, result } = settle(options);
  assert.equal(game.tokens - 5000, expected, name);
  assert.equal(result.actualDelta, expected, `${name} 實際變化`);
});

const short = settle({ winner: 1, discarder: 0, dealer: 3, tokens: 100 });
assert.equal(short.game.tokens, 0, "代幣不足時餘額不為負");
assert.equal(short.result.actualDelta, -100, "不足時只扣實際可扣代幣");
assert.match(short.result.summary, /扣除 100 代幣/, "摘要顯示實扣金額");
assert.match(short.result.summary, /應付 400/, "摘要保留應付金額");

const ambiguous = [
  ...[1, 1, 1, 2, 2, 2, 3, 3, 3].map((rank, index) => tile("character", rank, index + 90)),
  ...[4, 5, 6].map((rank, index) => tile("dot", rank, index + 100)),
  ...[7, 8, 9].map((rank, index) => tile("bamboo", rank, index + 110)),
  tile("dot", 5, 113), tile("dot", 5, 114)
];
const ambiguousScore = scoring.evaluateTokenScoring(state(), rules, ruleset, 0, 1, ambiguous, "胡牌", ambiguous.at(-1));
assert.ok(!(ambiguousScore.items.some(item => item.label === "平胡") && ambiguousScore.items.some(item => item.label === "三暗刻")), "不同拆法的台型不可混加");
const flowerState = state();
flowerState.running = true;
flowerState.result = null;
flowerState.melds[0] = Array.from({ length: 7 }, (_, index) => ({ type: "補花", tiles: [tile("flower", index + 1)] }));
flowerState.wall = [tile("flower", 8)];
assert.equal(flowers.specialWinMethod(flowerState, scoring), "", "第八張花仍在牌山時不可七搶一");
flowerState.melds[1] = [{ type: "補花", tiles: [tile("flower", 8)] }];
assert.equal(flowers.specialWinMethod(flowerState, scoring).discarder, 1, "七搶一需指定單花持有者付款");
const flowerScore = scoring.evaluateTokenScoring(flowerState, rules, ruleset, 0, 1, hand, "七搶一", hand.at(-1), "flowerSpecial", { type: "sevenFlowers" });
assert.equal(flowerScore.items.map(item => item.label).join("、"), "基本胡、七搶一", "花胡不疊一般台型");

console.log("mahjong scoring settlement ok: 14 cases");
