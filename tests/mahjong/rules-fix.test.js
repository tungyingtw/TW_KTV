import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = new URL("../../public/games/mahjong/", import.meta.url);
const sandbox = { window: {} };
for (const name of ["tile-wall", "rules", "scoring", "state-flow", "game-flow", "reaction-flow", "player-actions", "computer-actions", "render-view"]) vm.runInNewContext(fs.readFileSync(new URL(`src/${name}.js`, root), "utf8"), sandbox);
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

function fixture(ruleset = "tw16") {
  const pool = Array.from(api.MahjongTileWall.makeWall()).sort(api.MahjongTileWall.compareTiles);
  const take = (suit, ranks) => [...ranks].map(rank => {
    const index = pool.findIndex(tile => tile.suit === suit && tile.rank === Number(rank));
    assert.ok(index >= 0, `fixture exceeds available tiles: ${suit}:${rank}`);
    return pool.splice(index, 1)[0];
  });
  const state = { runId: 1, running: true, current: 0, tokens: 5000, stake: 100, dealer: 3, bonusSticks: 0, roundWind: 0, handNumber: 1, ruleset, hands: [[], [], [], []], melds: [[], [], [], []], rivers: [[], [], [], []], discardHistory: [], wall: [], result: null, pendingClaim: null, listenLock: null };
  return { state, take, pool };
}

function kongCandidate(state, tiles) {
  return { runId: state.runId, tiles };
}

function addedKongCandidate(state, option) {
  return { ...option, runId: state.runId };
}

function productionContext(state, names, extra = {}) {
  const nodes = new Map();
  const context = {
    state,
    players: ["P", "A", "B", "C"],
    MahjongRules: api.MahjongRules,
    MahjongAI: {},
    MahjongReactionFlow: api.MahjongReactionFlow,
    MahjongStateFlow: api.MahjongStateFlow,
    MahjongGameFlow: api.MahjongGameFlow,
    MahjongPlayerActions: api.MahjongPlayerActions,
    byId: id => nodes.get(id) || nodes.set(id, { textContent: "" }).get(id),
    currentRuleset: () => api.MahjongGameFlow.currentRuleset(state),
    aiOptions: {},
    openMeldCount: player => api.MahjongScoring.openMeldCount(state, player),
    isListenLockedWait: () => false,
    addStrategyLog() {},
    addLog() {},
    triggerJuice() {},
    render() {},
    playSound() {},
    meldOriginId: player => `seat-${player}`,
    scheduleAction() {},
    beginTurn() {},
    removeLastDiscardFromHistory(player, tile) {
      const index = state.discardHistory.findLastIndex(entry => entry.player === player && entry.tile.id === tile.id);
      if (index >= 0) state.discardHistory.splice(index, 1);
    },
    finishWin() { throw new Error("unexpected win"); },
    endRound(text) { state.running = false; state.result = { type: "draw", text }; },
    ...extra
  };
  for (const name of names) vm.runInNewContext(functions.get(name), context);
  return context;
}

function playerClaimHand(take, ruleset) {
  const bamboo = ruleset === "tw16" ? "258" : "25";
  const winds = ruleset === "tw16" ? "1123" : "12";
  return [...take("character", "12"), ...take("dot", "1479"), ...take("bamboo", bamboo), ...take("wind", winds), ...take("dragon-red", "1"), ...take("dragon-green", "2"), ...take("dragon-white", "3")];
}

test("F1: a decided computer pong prevents the player from taking the discard by chi", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    const tile = take("character", "3")[0];
    state.hands[0] = playerClaimHand(take, ruleset);
    state.hands[1] = take("character", "33");
    state.wall = [pool[0]];
    state.rivers[3].push(tile);
    state.discardHistory.push({ player: 3, tile });
    let choices = 0;
    let pong = null;
    const context = productionContext(state, ["handleDiscardClaims", "offerPlayerClaim", "chooseComputerClaim", "applyComputerClaim"], {
      MahjongComputerActions: { chooseDiscardClaim: () => { choices += 1; return { type: "pong", player: 1 }; } },
      claimComputerPong: (player, discarder, claimed) => { pong = { player, discarder, claimed }; },
      claimComputerExposedKong() { throw new Error("wrong claim"); },
      claimComputerChi() { throw new Error("wrong claim"); }
    });
    assert.equal(context.handleDiscardClaims(3, tile, 0), true);
    assert.equal(choices, 1);
    assert.deepEqual(pong, { player: 1, discarder: 3, claimed: tile });
    assert.equal(state.pendingClaim, null);
  }
});

test("F1: the cached computer response is used after the player passes", () => {
  const { state, take, pool } = fixture();
  const tile = take("character", "3")[0];
  state.hands[0] = [...playerClaimHand(take, "tw16").slice(0, 14), ...take("character", "33")];
  state.wall = [pool[0]];
  state.rivers[1].push(tile);
  state.discardHistory.push({ player: 1, tile });
  let choices = 0;
  let pong = 0;
  const context = productionContext(state, ["handleDiscardClaims", "offerPlayerClaim", "chooseComputerClaim", "applyComputerClaim", "continueComputerClaimAfterPlayerPass", "passClaim"], {
    MahjongComputerActions: { chooseDiscardClaim: () => { choices += 1; return { type: "pong", player: 2 }; } },
    claimComputerPong: () => { pong += 1; },
    claimComputerExposedKong() {},
    claimComputerChi() {}
  });
  context.handleDiscardClaims(1, tile, 2);
  assert.equal(state.pendingClaim?.canPong, true);
  context.passClaim();
  assert.equal(choices, 1);
  assert.equal(pong, 1);
});

test("F2: empty wall rejects all player kong entrances and hides kong options", () => {
  const { state, take } = fixture();
  const option = take("character", "1111");
  state.hands[0] = [...option];
  const before = state.hands[0].map(tile => tile.id);
  assert.equal(api.MahjongPlayerActions.claimConcealedKong(state, api.MahjongStateFlow, kongCandidate(state, option)), null);
  assert.deepEqual(state.hands[0].map(tile => tile.id), before);
  const buttons = [];
  api.MahjongRenderView.renderKongOptions({ state, byId: () => ({ innerHTML: "", appendChild: button => buttons.push(button) }), rules: api.MahjongRules, makeKongButton: () => ({}) });
  assert.equal(buttons.length, 0);
});

test("V1: a player cannot kong after discarding while the next-player timer is pending", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    const option = take("character", "1111");
    state.hands[0] = [...option, ...take("dot", ruleset === "tw16" ? "123456789" : "123456"), ...take("bamboo", "1234")];
    state.hands[0].pop();
    state.wall = pool;
    const before = { hand: state.hands[0].map(tile => tile.id), wall: state.wall.length, melds: state.melds[0].length };
    assert.equal(api.MahjongPlayerActions.canPlayerKongNow(state, api.MahjongStateFlow), false);
    assert.equal(api.MahjongPlayerActions.claimConcealedKong(state, api.MahjongStateFlow, kongCandidate(state, option)), null);
    const buttons = [];
    api.MahjongRenderView.renderKongOptions({ state, byId: () => ({ innerHTML: "", appendChild: button => buttons.push(button) }), rules: api.MahjongRules, canPlayerKongNow: candidate => api.MahjongPlayerActions.canPlayerKongNow(candidate, api.MahjongStateFlow), makeKongButton: () => ({}) });
    assert.equal(buttons.length, 0);
    assert.deepEqual({ hand: state.hands[0].map(tile => tile.id), wall: state.wall.length, melds: state.melds[0].length }, before);
  }
});

test("V2: a used concealed-kong option cannot create a second meld after a legal supplement", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    const option = take("character", "1111");
    state.hands[0] = [...option, ...take("dot", ruleset === "tw16" ? "123456789" : "123456"), ...take("bamboo", "1234")];
    state.wall = pool;
    const candidate = kongCandidate(state, option);
    assert.ok(api.MahjongPlayerActions.claimConcealedKong(state, api.MahjongStateFlow, candidate));
    state.hands[0].push(state.wall.pop());
    const before = { hand: state.hands[0].map(tile => tile.id), wall: state.wall.length, melds: state.melds[0].map(meld => meld.tiles.map(tile => tile.id)) };
    assert.equal(api.MahjongPlayerActions.claimConcealedKong(state, api.MahjongStateFlow, candidate), null);
    assert.deepEqual({ hand: state.hands[0].map(tile => tile.id), wall: state.wall.length, melds: state.melds[0].map(meld => meld.tiles.map(tile => tile.id)) }, before);
  }
});

test("V2: a used added-kong option cannot be replayed after a legal supplement", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    const meld = { type: "碰", tiles: take("character", "111") };
    const tile = take("character", "1")[0];
    state.melds[0] = [meld];
    state.hands[0] = [tile, ...take("dot", ruleset === "tw16" ? "123456789" : "123456"), ...take("bamboo", "123"), ...take("wind", "1")];
    state.wall = pool;
    const option = { meldIndex: 0, tile, tiles: [...meld.tiles, tile] };
    const candidate = addedKongCandidate(state, option);
    assert.ok(api.MahjongPlayerActions.claimAddedKong(state, api.MahjongStateFlow, candidate));
    state.hands[0].push(state.wall.pop());
    const before = { hand: state.hands[0].map(item => item.id), wall: state.wall.length, meld: state.melds[0][0].tiles.map(item => item.id) };
    assert.equal(api.MahjongPlayerActions.claimAddedKong(state, api.MahjongStateFlow, candidate), null);
    assert.deepEqual({ hand: state.hands[0].map(item => item.id), wall: state.wall.length, meld: state.melds[0][0].tiles.map(item => item.id) }, before);
  }
});

test("C1: a final discard that only offers win cannot be claimed by pong", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take } = fixture(ruleset);
    state.hands[0] = [...take("character", "1123"), ...take("dot", ruleset === "tw16" ? "123456" : "123"), ...take("bamboo", "123"), ...take("wind", "111")];
    const tile = take("character", "1")[0];
    state.rivers[3].push(tile);
    state.discardHistory.push({ player: 3, tile });
    const claim = api.MahjongReactionFlow.createPlayerDiscardClaim(state, api.MahjongRules, api.MahjongGameFlow.currentRuleset(state), () => 0, 3, tile, 0, true);
    claim.kind = "discard";
    api.MahjongReactionFlow.applyPlayerDiscardClaim(state, claim);
    const before = { hand: state.hands[0].map(item => item.id), river: state.rivers[3].map(item => item.id), melds: state.melds[0].length };
    assert.equal(claim.canPong, false);
    assert.equal(api.MahjongPlayerActions.claimPong(state, api.MahjongStateFlow, api.MahjongRules, () => {}), null);
    assert.deepEqual({ hand: state.hands[0].map(item => item.id), river: state.rivers[3].map(item => item.id), melds: state.melds[0].length }, before);
  }
});

test("C2: a prior-round kong button and an earlier computer response are rejected", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    const tiles = [...take("character", "1111"), ...take("dot", ruleset === "tw16" ? "123456789" : "123456"), ...take("bamboo", "1234")];
    state.hands[0] = tiles;
    state.wall = pool;
    const buttons = [];
    api.MahjongRenderView.renderKongOptions({ state, byId: () => ({ innerHTML: "", appendChild: button => buttons.push(button) }), rules: api.MahjongRules, canPlayerKongNow: candidate => api.MahjongPlayerActions.canPlayerKongNow(candidate, api.MahjongStateFlow), makeKongButton: (label, visibleTiles, onClick) => ({ label, visibleTiles, onClick }), onClaimConcealedKong: option => api.MahjongPlayerActions.claimConcealedKong(state, api.MahjongStateFlow, option), onClaimAddedKong() {} });
    const staleButton = buttons.find(button => button.label === "暗槓");
    state.runId += 1;
    const before = { hand: state.hands[0].map(item => item.id), melds: state.melds[0].length };
    assert.equal(staleButton.onClick(), null);
    assert.deepEqual({ hand: state.hands[0].map(item => item.id), melds: state.melds[0].length }, before);

    const oldTile = take("character", "2")[0];
    const latestTile = take("character", "9")[0];
    state.hands[1] = take("character", "22");
    state.rivers[2] = [oldTile];
    state.rivers[3] = [latestTile];
    state.discardHistory = [{ player: 2, tile: oldTile }, { player: 3, tile: latestTile }];
    state.current = 3;
    state.activeDiscard = { runId: state.runId, token: 2, player: 3, tileId: latestTile.id, historyIndex: 1 };
    const cpuBefore = { hand: state.hands[1].map(item => item.id), river: state.rivers[2].map(item => item.id), melds: state.melds[1].length };
    assert.equal(api.MahjongComputerActions.applyComputerPong(state, api.MahjongStateFlow, api.MahjongRules, 1, 2, oldTile), null);
    assert.deepEqual({ hand: state.hands[1].map(item => item.id), river: state.rivers[2].map(item => item.id), melds: state.melds[1].length }, cpuBefore);
  }
});

test("C3: kong eligibility uses the exact concealed hand size after open melds", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    state.melds[0] = [{ type: "碰", tiles: take("character", "111") }];
    state.hands[0] = [...take("character", "2222"), ...take("dot", ruleset === "tw16" ? "123456789" : "123456"), ...take("bamboo", "1234")];
    state.wall = pool;
    assert.equal(api.MahjongStateFlow.hasExpectedDiscardHand(state, 0, ruleset === "tw16" ? 17 : 14), false);
    assert.equal(api.MahjongPlayerActions.canPlayerKongNow(state, api.MahjongStateFlow), false);
  }
});

test("D1: empty wall rejects computer pong and chi entrances", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const pong = fixture(ruleset);
    const pongTile = pong.take("character", "1")[0];
    pong.state.current = 0;
    pong.state.hands[1] = pong.take("character", "11");
    pong.state.rivers[0] = [pongTile];
    pong.state.activeDiscard = { runId: pong.state.runId, token: 1, player: 0, tileId: pongTile.id, historyIndex: 0 };
    const pongBefore = JSON.stringify({ hand: pong.state.hands[1], river: pong.state.rivers[0], melds: pong.state.melds[1] });
    assert.equal(api.MahjongComputerActions.applyComputerPong(pong.state, api.MahjongStateFlow, api.MahjongRules, 1, 0, pongTile), null);
    assert.equal(JSON.stringify({ hand: pong.state.hands[1], river: pong.state.rivers[0], melds: pong.state.melds[1] }), pongBefore);

    const chi = fixture(ruleset);
    const chiTile = chi.take("character", "3")[0];
    const chiOption = chi.take("character", "12");
    chi.state.current = 0;
    chi.state.hands[1] = chiOption;
    chi.state.rivers[0] = [chiTile];
    chi.state.activeDiscard = { runId: chi.state.runId, token: 1, player: 0, tileId: chiTile.id, historyIndex: 0 };
    const chiBefore = JSON.stringify({ hand: chi.state.hands[1], river: chi.state.rivers[0], melds: chi.state.melds[1] });
    assert.equal(api.MahjongComputerActions.applyComputerChi(chi.state, api.MahjongStateFlow, 1, 0, chiTile, chiOption, api.MahjongTileWall.compareTiles), null);
    assert.equal(JSON.stringify({ hand: chi.state.hands[1], river: chi.state.rivers[0], melds: chi.state.melds[1] }), chiBefore);
  }
});

test("D2: a prior-round chi button cannot claim the current round's discard", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take, pool } = fixture(ruleset);
    const oldTile = take("character", "3")[0];
    const oldOption = take("character", "12");
    state.hands[0] = oldOption;
    state.wall = pool;
    state.rivers[3] = [oldTile];
    state.activeDiscard = { runId: 1, token: 1, player: 3, tileId: oldTile.id, historyIndex: 0 };
    state.pendingClaim = { kind: "discard", runId: 1, discardToken: 1, discarder: 3, tile: oldTile, chiOptions: [oldOption] };
    const buttons = [];
    sandbox.document = { createElement: () => ({ appendChild() {}, addEventListener(type, listener) { this[type] = listener; } }) };
    api.MahjongRenderView.renderChiOptions({ state, byId: () => ({ innerHTML: "", appendChild: button => buttons.push(button) }), compareTiles: api.MahjongTileWall.compareTiles, makeSmallTile: () => ({}), onClaimChi: candidate => api.MahjongPlayerActions.claimChi(state, api.MahjongStateFlow, candidate, api.MahjongTileWall.compareTiles, () => {}) });
    const staleButton = buttons[0];
    const newTile = take("character", "6")[0];
    const newOption = take("character", "45");
    state.runId = 2;
    state.hands[0] = newOption;
    state.rivers[3] = [newTile];
    state.activeDiscard = { runId: 2, token: 2, player: 3, tileId: newTile.id, historyIndex: 0 };
    state.pendingClaim = { kind: "discard", runId: 2, discardToken: 2, discarder: 3, tile: newTile, chiOptions: [newOption] };
    const before = JSON.stringify({ hand: state.hands[0], river: state.rivers[3], melds: state.melds[0] });
    staleButton.click();
    assert.equal(JSON.stringify({ hand: state.hands[0], river: state.rivers[3], melds: state.melds[0] }), before);
  }
});

test("F2: final discard allows wins only, otherwise ends a single draw without asking the AI", () => {
  for (const ruleset of ["tw16", "simple13"]) {
    const { state, take } = fixture(ruleset);
    const tile = take("character", "3")[0];
    state.rivers[3].push(tile);
    state.discardHistory.push({ player: 3, tile });
    let choices = 0;
    const context = productionContext(state, ["handleDiscardClaims"], {
      MahjongComputerActions: { chooseDiscardClaim: () => { choices += 1; return { type: "pong", player: 1 }; } }
    });
    assert.equal(context.handleDiscardClaims(3, tile, 0), true);
    assert.equal(state.result?.type, "draw");
    assert.equal(choices, 0);
  }
});

test("F2: rob-kong never receives river-bottom scoring merely because the wall is empty", () => {
  for (const ruleset of [{ name: "tw16", size: 17, bamboo: "456789" }, { name: "simple13", size: 14, bamboo: "456" }]) {
    const { state, take } = fixture(ruleset.name);
    const hand = [...take("character", "123456"), ...take("dot", "23488"), ...take("bamboo", ruleset.bamboo)];
    const rob = api.MahjongScoring.evaluateTokenScoring(state, api.MahjongRules, { winningTileCount: ruleset.size }, 0, 1, hand, "", hand.at(-1), "robKong");
    const discard = api.MahjongScoring.evaluateTokenScoring(state, api.MahjongRules, { winningTileCount: ruleset.size }, 0, 1, hand, "", hand.at(-1), "discard");
    assert.ok(rob.items.some(item => item.label === "搶槓"));
    assert.ok(!rob.items.some(item => item.label === "河底撈魚"));
    assert.ok(discard.items.some(item => item.label === "河底撈魚"));
  }
});
