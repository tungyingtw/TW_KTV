import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = new URL("../../public/games/mahjong/", import.meta.url);
const sandbox = { window: {} };
for (const name of ["rules", "scoring", "flower-flow", "state-flow", "game-flow", "round-result", "reaction-flow", "turn-flow", "wallet"]) {
  vm.runInNewContext(fs.readFileSync(new URL(`src/${name}.js`, root), "utf8"), sandbox);
}
const { MahjongRules: rules, MahjongScoring: scoring, MahjongFlowerFlow: flowers, MahjongStateFlow: flow, MahjongGameFlow: game, MahjongRoundResult: round, MahjongReactionFlow: reaction } = sandbox.window;
let serial = 0;
const tile = (suit, rank) => ({ suit, rank, id: `audit-${serial++}`, label: `${suit}:${rank}` });
const tiles = (suit, ranks) => [...ranks].map(rank => tile(suit, Number(rank)));
const hand = (c = "", d = "", b = "") => [...tiles("character", c), ...tiles("dot", d), ...tiles("bamboo", b)];
const meld = (type, suit, ranks) => ({ type, tiles: tiles(suit, ranks) });
const flower = rank => ({ type: "補花", tiles: [tile("flower", rank)] });
const base = () => ({ tokens: 5000, stake: 100, dealer: 3, bonusSticks: 2, roundWind: 0, handNumber: 1, running: true, result: null, wall: hand("9"), hands: [[], [], [], []], melds: [[], [], [], []] });
const score = (s, h, winningTile = h.at(-1), event = "discard", size = 17) => scoring.evaluateTokenScoring(s, rules, { winningTileCount: size }, 0, event === "selfDraw" || event === "kongDraw" ? null : 1, h, "", winningTile, event);
const has = (result, label) => result.items.some(item => item.label === label);

function productionFunction(name) {
  const html = fs.readFileSync(new URL("index.html", root), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  let fn;
  for (const script of scripts) {
    const source = ts.createSourceFile("inline.js", script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === name) fn = node.getText(source); else ts.forEachChild(node, visit); };
    visit(source);
  }
  assert.ok(fn, `production function exists: ${name}`);
  return fn;
}

test("A: 384 payment combinations across both modes, all seats/dealers and N=0/1/2", () => {
  let cases = 0;
  for (const size of [14, 17]) for (let winner = 0; winner < 4; winner++) for (let dealer = 0; dealer < 4; dealer++) for (const bonusSticks of [0, 1, 2]) {
    for (const discarder of [null, ...[0, 1, 2, 3].filter(p => p !== winner)]) {
      const s = { ...base(), dealer, bonusSticks };
      const h = size === 17 ? hand("123456", "23488", "456789") : hand("123456", "23488", "456");
      const expectedTai = 4;
      const payers = discarder === null ? [0, 1, 2, 3].filter(p => p !== winner) : [discarder];
      const expected = payers.reduce((sum, payer) => {
        const amount = 100 * (expectedTai + (winner === dealer || payer === dealer ? 1 + bonusSticks : 0));
        return sum + (winner === 0 ? amount : payer === 0 ? -amount : 0);
      }, 0);
      const result = scoring.settleTokens(s, rules, { winningTileCount: size }, 5000, winner, discarder, h, "", h.at(-1));
      assert.equal(result.totalTai, expectedTai);
      assert.equal(result.actualDelta, expected, JSON.stringify({ size, winner, discarder, dealer, bonusSticks }));
      assert.equal(s.tokens, 5000 + expected);
      cases++;
    }
  }
  assert.equal(cases, 384);
});

test("A: insufficient balances report actual deduction and prevent next round", () => {
  for (const tokens of [0, 1, 100, 399]) {
    const s = { ...base(), tokens };
    const h = hand("123456", "23488", "456789");
    const result = scoring.settleTokens(s, rules, { winningTileCount: 17 }, 5000, 1, 0, h, "", h.at(-1));
    assert.equal(s.tokens, 0);
    assert.equal(result.actualDelta, -tokens || 0);
    assert.equal(game.canStart(s), false);
    if (tokens) assert.ok(result.summary.includes(`扣除 ${tokens}`));
  }
});

function finish(s, winner, discarder) {
  return round.finishWinRound(s, flow, { player: winner, discarder, method: "胡牌", players: ["P", "A", "B", "C"], compareTiles: () => 0, roundLabel: () => game.roundLabel(s), advanceRound: p => game.advanceRound(s, p), settleTokens: (...args) => scoring.settleTokens(s, rules, { winningTileCount: 17 }, 5000, ...args) });
}

test("A: result uses pre-advance dealer/bonus; draw preserves balance", () => {
  const s = base();
  s.hands[0] = hand("123456", "23488", "456789");
  finish(s, 0, 3);
  assert.equal(s.result.tokenDelta, 700);
  assert.equal(s.dealer, 0);
  assert.equal(s.bonusSticks, 0);
  const before = s.tokens;
  round.finishDrawRound(s, flow, { text: "流局", compareTiles: () => 0, advanceRound: p => game.advanceRound(s, p), roundLabel: () => game.roundLabel(s), players: ["P", "A", "B", "C"] });
  assert.equal(s.tokens, before);
  assert.equal(s.result.tokenDelta, 0);
  assert.equal(s.dealer, 0);
  assert.equal(s.bonusSticks, 1);
});

test("A: CPU-to-CPU result must not claim a player deduction", () => {
  const s = base();
  s.hands[1] = hand("123456", "23488", "456789");
  finish(s, 1, 2);
  assert.equal(s.result.tokenDelta, 0);
  assert.ok(!s.result.title.includes("扣"), `neutral result title: ${s.result.title}`);
});

test("B: dark kong preserves concealed status and contributes a concealed triplet", () => {
  const s = base();
  s.melds[0] = [meld("暗槓", "character", "1111")];
  const h = hand("234", "22288", "333456");
  const result = score(s, h, h.at(-1));
  assert.ok(has(result, "門清"));
  assert.ok(has(result, "三暗刻"));
  assert.ok(!has(result, "全求人"));
  assert.ok(has(score(s, h, h.at(-1), "selfDraw"), "門清自摸"));
});

test("B: fully open excludes dark kongs and self draw in both modes", () => {
  for (const size of [14, 17]) {
    const s = base();
    s.melds[0] = [meld("吃", "character", "123"), meld("碰", "dot", "222"), meld("明槓", "bamboo", "3333"), meld("補槓", "bamboo", "6666")];
    if (size === 17) s.melds[0].push(meld("吃", "character", "789"));
    const h = hand("55");
    assert.ok(has(score(s, h, h[1], "discard", size), "全求人"));
    assert.ok(!has(score(s, h, h[1], "selfDraw", size), "全求人"));
    s.melds[0][2].type = "暗槓";
    assert.ok(!has(score(s, h, h[1], "discard", size), "全求人"));
  }
});

test("B: pinghu allows two-sided waits, excludes edge/closed/pair/flowers/honors/selfdraw", () => {
  const h = hand("123456", "23488", "456789");
  assert.ok(has(score(base(), h), "平胡"));
  for (const winning of [h[2], h[1], h[9]]) assert.ok(!has(score(base(), h, winning), "平胡"));
  assert.ok(!has(score(base(), h, h.at(-1), "selfDraw"), "平胡"));
  const s = base();
  s.melds[0] = [flower(1)];
  assert.ok(!has(score(s, h), "平胡"));
  const honors = [...hand("123456", "234", "456789"), ...tiles("wind", "22")];
  assert.ok(!has(score(base(), honors, honors[14]), "平胡"));
});

test("B: choose a coherent decomposition rather than adding incompatible yaku", () => {
  const h = hand("111222333", "45655", "789");
  const result = score(base(), h);
  assert.equal(result.totalTai, 4);
  assert.ok(!(has(result, "平胡") && has(result, "三暗刻")));
  assert.deepEqual(JSON.parse(JSON.stringify(score(base(), [...h].reverse(), h.at(-1)).items)), JSON.parse(JSON.stringify(result.items)));
});

test("B: ron tile assigned to sequence must not remove an existing concealed triplet", () => {
  const h = hand("111123", "22288", "333456");
  const result = score(base(), h, h[3]);
  assert.ok(has(result, "三暗刻"), JSON.stringify(result));
});

test("B: dragon and all-honor exclusions", () => {
  const little = [...hand("111", "222", "333"), ...tiles("dragonRed", "111"), ...tiles("dragonGreen", "111"), ...tiles("dragonWhite", "11")];
  const big = [...hand("111", "22", "333"), ...tiles("dragonRed", "111"), ...tiles("dragonGreen", "111"), ...tiles("dragonWhite", "111")];
  for (const [h, label] of [[little, "小三元"], [big, "大三元"]]) {
    const result = score(base(), h, h.at(-1), "selfDraw");
    assert.ok(has(result, label));
    assert.ok(!has(result, "三元刻"));
  }
  const honors = [...tiles("wind", "11122233"), ...tiles("dragonRed", "111"), ...tiles("dragonGreen", "111"), ...tiles("dragonWhite", "111")];
  const result = score(base(), honors, honors.at(-1), "selfDraw");
  assert.ok(has(result, "字一色"));
  assert.ok(has(result, "大三元"));
  assert.ok(!has(result, "碰碰胡"));
});

test("B: flower wins wait for ownership; special yaku and payments are isolated", () => {
  const s = base();
  s.melds[0] = Array.from({ length: 7 }, (_, i) => flower(i + 1));
  s.wall = [tile("flower", 8)];
  assert.equal(flowers.specialWinMethod(s, scoring), "");
  s.melds[1] = [{ type: "補花", tiles: [s.wall.pop()] }];
  const seven = flowers.specialWinMethod(s, scoring);
  assert.equal(seven.discarder, 1);
  let result = scoring.settleTokens(s, rules, { winningTileCount: 17 }, 5000, 0, 1, [], "", null, "flowerSpecial", seven);
  assert.equal(result.totalTai, 9);
  assert.equal(result.actualDelta, 900);
  s.melds[0].push(s.melds[1].pop());
  const eight = flowers.specialWinMethod(s, scoring);
  assert.equal(eight.type, "eightFlowers");
  result = scoring.settleTokens(s, rules, { winningTileCount: 17 }, 5000, 0, null, [], "", null, "flowerSpecial", eight);
  assert.equal(result.totalTai, 17);
  assert.equal(result.actualDelta, 5400);
});

test("B: last replacement flower must be registered even when the wall becomes empty", () => {
  const s = base();
  s.melds[0] = Array.from({ length: 6 }, (_, i) => flower(i + 1));
  s.hands[0] = [tile("flower", 7)];
  s.wall = [tile("flower", 8)];
  flowers.resolveFlowers(s, 0, t => t.suit === "flower");
  assert.equal(s.hands[0].filter(t => t.suit === "flower").length, 0);
  assert.equal(flowers.specialWinMethod(s, scoring).type, "eightFlowers");
});

test("B: explicit kong events and ordinary flower replacement do not share bonuses", () => {
  const h = hand("123456", "23488", "456789");
  assert.ok(has(score(base(), h, h.at(-1), "kongDraw"), "槓上開花"));
  assert.ok(has(score(base(), h, h.at(-1), "robKong"), "搶槓"));
  assert.ok(!has(score(base(), h, h.at(-1), "selfDraw"), "槓上開花"));
});

test("B: the production manual claim handler forwards the robKong event", () => {
  const fn = productionFunction("claimWin");
  let eventReceived;
  const context = { state: { running: true, pendingClaim: { canWin: true, kind: "robKong", discarder: 2, kongPlayer: 2, tile: tile("dot", 5) } }, players: ["P", "A", "B", "C"], MahjongGameFlow: game, finishWin: (_p, _m, d, event = d === null ? "selfDraw" : "discard") => { eventReceived = event; } };
  vm.runInNewContext(`${fn}; claimWin();`, context);
  assert.equal(eventReceived, "robKong");
});

test("B: current simultaneous-winner order remains player first then CPU index", () => {
  const s = base();
  const h = hand("123456", "23488", "456789");
  s.hands = [0, 1, 2, 3].map(() => h.slice(0, -1));
  const rs = { winningTileCount: 17 };
  assert.equal(Array.from(reaction.findComputerWinners(s, rules, rs, () => 0, 3, h.at(-1))).join(","), "1,2");
  assert.equal(reaction.findRobKongWinner(s, rules, rs, () => 0, ["P", "A", "B", "C"], 3, h.at(-1)), 0);
});

test("B: incomplete normal hands receive no ordinary scoring", () => {
  for (const size of [14, 17]) assert.equal(score(base(), hand("123", "55"), null, "discard", size).totalTai, 0);
});

test("A: production settlement bridge saves actual balance; same-day reload preserves it", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const walletContext = { window: {}, localStorage: storage };
  vm.runInNewContext(fs.readFileSync(new URL("src/wallet.js", root), "utf8"), walletContext);
  const wallet = walletContext.window.MahjongWallet;
  const s = { ...base(), tokens: 100 };
  const h = hand("123456", "23488", "456789");
  const context = { state: s, MahjongScoring: scoring, MahjongRules: rules, MahjongWallet: wallet, currentRuleset: () => ({ winningTileCount: 17 }) };
  vm.runInNewContext(`${productionFunction("saveWallet")}\n${productionFunction("settleTokens")}`, context);
  context.settleTokens(1, 0, h, "", h.at(-1));
  assert.equal(JSON.parse(values.get(wallet.WALLET_KEY)).tokens, 0);
  const reloaded = { tokens: 5000 };
  wallet.load(reloaded, storage);
  assert.equal(reloaded.tokens, 0);
});

test("Release: minified modules preserve payment and neutral-result amounts", () => {
  const release = { window: {} };
  for (const name of ["rules", "scoring"]) vm.runInNewContext(fs.readFileSync(new URL(`../../dist/games/mahjong/src/${name}.js`, import.meta.url), "utf8"), release);
  for (const [winner, discarder, expected] of [[0, null, 1500], [1, 2, 0], [1, 0, -400]]) {
    const s = base();
    const h = hand("123456", "23488", "456789");
    const result = release.window.MahjongScoring.settleTokens(s, release.window.MahjongRules, { winningTileCount: 17 }, 5000, winner, discarder, h, "", h.at(-1));
    assert.equal(result.actualDelta, expected);
  }
});
