import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = new URL("../../public/games/mahjong/", import.meta.url);
const sandbox = { window: {} };
for (const name of ["rules", "scoring", "state-flow", "game-flow", "flower-flow", "turn-flow", "reaction-flow", "computer-actions", "tile-wall"]) vm.runInNewContext(fs.readFileSync(new URL(`src/${name}.js`, root), "utf8"), sandbox);
const api = sandbox.window;
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const functions = new Map();
for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
  const source = ts.createSourceFile("inline.js", script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node.getText(source));
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function fixture() {
  const pool = Array.from(api.MahjongTileWall.makeWall()).sort(api.MahjongTileWall.compareTiles);
  const take = (suit, ranks) => [...ranks].map(rank => {
    const index = pool.findIndex(t => t.suit === suit && t.rank === Number(rank));
    assert.ok(index >= 0, `fixture exceeds available tiles: ${suit}:${rank}`);
    return pool.splice(index, 1)[0];
  });
  const state = { running: true, current: 0, tokens: 5000, stake: 100, dealer: 3, bonusSticks: 0, roundWind: 0, hands: [[], [], [], []], melds: [[], [], [], []], wall: [], result: null, ruleset: "tw16", pendingClaim: null };
  return { state, take, pool };
}

function bridge(state, names, extra = {}) {
  const nodes = new Map();
  const queue = [];
  const context = { ...api, state, players: ["P", "A", "B", "C"], byId: id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: "" });
    return nodes.get(id);
  }, render() {}, addLog() {}, addStrategyLog() {}, playSound() {}, triggerJuice() {}, meldOriginId: p => `seat-${p}`, sortPlayerHandForTurn() {}, sortHand() {}, scheduleAction: callback => queue.push(callback), currentRuleset: () => api.MahjongGameFlow.currentRuleset(state), openMeldCount: p => api.MahjongScoring.openMeldCount(state, p), isFlower: api.MahjongTileWall.isFlower, endRound: text => { state.running = false; state.result = { type: "draw", text }; }, finishWin: (winner, method, discarder, event) => { state.running = false; state.result = { type: "win", winner, method, discarder, event }; }, ...extra };
  for (const name of names) {
    assert.ok(functions.has(name), `missing production function: ${name}`);
    vm.runInNewContext(functions.get(name), context);
  }
  return { context, queue, nodes };
}

test("R1: player's last-wall flower without replacement must end the round", () => {
  const { state, take } = fixture();
  state.hands[0] = [...take("character", "123456"), ...take("dot", "23488"), ...take("bamboo", "45678")];
  state.wall = take("flower", "1");
  const { context, nodes } = bridge(state, ["resolveFlowers", "tryFlowerSpecialWin", "beginTurn"]);
  context.beginTurn(0);
  assert.equal(state.wall.length, 0);
  assert.equal(api.MahjongScoring.countFlowers(state, 0), 1);
  assert.equal(api.MahjongStateFlow.canDiscardNow(state, 0), false);
  assert.equal(state.result?.type, "draw", `running=${state.running}, hand=${state.hands[0].length}, message=${nodes.get("message")?.textContent}`);
});

test("R1: player's kong followed by the last flower must not wait for an impossible discard", () => {
  const { state, take } = fixture();
  state.melds[0] = [{ type: "暗槓", tiles: take("character", "1111") }];
  state.hands[0] = [...take("character", "234"), ...take("dot", "23488"), ...take("bamboo", "45678")];
  state.wall = take("flower", "1");
  const { context } = bridge(state, ["resolveFlowers", "tryFlowerSpecialWin", "supplementAfterKong"]);
  context.supplementAfterKong("暗槓");
  assert.equal(api.MahjongStateFlow.canDiscardNow(state, 0), false);
  assert.equal(state.result?.type, "draw", `running=${state.running}, hand=${state.hands[0].length}`);
});

test("R1 control: eight flowers must still win before exhausted-wall draw handling", () => {
  const { state, take } = fixture();
  state.melds[0] = take("flower", "123456").map(tile => ({ type: "補花", tiles: [tile] }));
  state.hands[0] = take("flower", "7");
  state.wall = take("flower", "8");
  const { context } = bridge(state, ["resolveFlowers", "tryFlowerSpecialWin"]);
  context.resolveFlowers(0);
  assert.equal(state.result?.type, "win");
  assert.equal(state.result?.method, "八仙過海");
});

test("R2: another CPU may rob a CPU added kong when the player cannot win", () => {
  const { state, take, pool } = fixture();
  state.current = 1;
  state.melds[1] = [{ type: "碰", tiles: take("character", "111") }];
  const tile = take("character", "1")[0];
  state.hands[2] = [...take("character", "23456"), ...take("dot", "23488"), ...take("bamboo", "456789")];
  state.hands[0] = [...take("wind", "1234"), ...take("dragon-red", "1"), ...take("dragon-green", "2"), ...take("dragon-white", "3"), ...take("character", "789"), ...take("dot", "1567"), ...take("bamboo", "12")];
  const rest = pool.filter(t => t.suit !== "flower");
  state.hands[1] = [tile, ...rest.slice(0, 13)];
  state.hands[3] = rest.slice(13, 29);
  state.wall = rest.slice(29);
  const option = { tile, meldIndex: 0, tiles: [...state.melds[1][0].tiles, tile] };
  const rs = api.MahjongGameFlow.currentRuleset(state);
  assert.equal(api.MahjongRules.canWinWithTile(state.hands[0], tile, 0, rs.winningTileCount), false);
  assert.equal(api.MahjongReactionFlow.findRobKongWinner(state, api.MahjongRules, rs, p => api.MahjongScoring.openMeldCount(state, p), ["P", "A", "B", "C"], 1, tile), 2);
  const { context } = bridge(state, ["offerPlayerRobKong", "completeComputerAddedKong", "findComputerRobKongWinner", "robAddedKong"]);
  assert.equal(context.offerPlayerRobKong(1, option), false);
  context.completeComputerAddedKong(1, option);
  assert.equal(state.result?.winner, 2, `CPU1 meld became ${state.melds[1][0].type}; no rob-kong settlement`);
});

test("R2: after the player passes rob-kong, another CPU still gets the claim", () => {
  const { state, take, pool } = fixture();
  state.current = 0;
  state.melds[1] = [{ type: "碰", tiles: take("character", "111") }];
  const tile = take("character", "1")[0];
  state.hands[2] = [...take("character", "23456"), ...take("dot", "23488"), ...take("bamboo", "456789")];
  state.hands[0] = [...take("character", "23456"), ...take("dot", "23488"), ...take("bamboo", "456789")];
  const rest = pool.filter(t => t.suit !== "flower");
  state.hands[1] = [tile, ...rest.slice(0, 13)];
  state.hands[3] = rest.slice(13, 29);
  state.wall = rest.slice(29);
  const option = { tile, meldIndex: 0, tiles: [...state.melds[1][0].tiles, tile] };
  state.pendingClaim = { kind: "robKong", discarder: 1, tile, nextPlayer: 1, canWin: true, kongPlayer: 1, kongOption: option };
  const { context, queue } = bridge(state, ["completeComputerAddedKong", "findComputerRobKongWinner", "robAddedKong", "passClaim"]);
  context.passClaim();
  assert.equal(queue.length, 1);
  queue[0]();
  assert.equal(state.result?.winner, 2);
  assert.equal(state.result?.event, "robKong");
});
