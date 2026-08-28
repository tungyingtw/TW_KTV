(function () {
  function findComputerWinners(state, rules, ruleset, openMeldCount, discarder, tile) {
    return [1, 2, 3].filter(player => player !== discarder && rules.canWinWithTile(state.hands[player], tile, openMeldCount(player), ruleset.winningTileCount));
  }

  function findRobKongWinner(state, rules, ruleset, openMeldCount, players, kongPlayer, tile) {
    for (let player = 0; player < players.length; player += 1) {
      if (player !== kongPlayer && rules.canWinWithTile(state.hands[player], tile, openMeldCount(player), ruleset.winningTileCount)) return player;
    }
    return null;
  }

  function createPlayerDiscardClaim(state, rules, ruleset, openMeldCount, discarder, tile, nextPlayer, winOnly = false) {
    if (discarder === 0) return null;
    const canWin = rules.canWinWithTile(state.hands[0], tile, openMeldCount(0), ruleset.winningTileCount);
    if (winOnly && !canWin) return null;
    const canPong = rules.canPong(state.hands[0], tile);
    const canKong = rules.canExposedKong(state.hands[0], tile);
    const chiOptions = !winOnly && discarder === 3 ? rules.getChiOptions(state.hands[0], tile) : [];
    if (!canWin && (winOnly || (!canPong && !canKong && !chiOptions.length))) return null;
    return { discarder, tile, nextPlayer, canWin, canPong: !winOnly && canPong, canKong: !winOnly && canKong, chiOptions };
  }

  function applyPlayerDiscardClaim(state, claim) {
    state.pendingClaim = claim;
    state.current = 0;
    state.canPlayerWin = claim.canWin;
    return claim;
  }

  function claimActionText(claim) {
    return [claim.canWin ? "胡" : "", claim.canKong ? "槓" : "", claim.canPong ? "碰" : "", claim.chiOptions.length ? "吃" : ""].filter(Boolean).join("、");
  }

  window.MahjongReactionFlow = { applyPlayerDiscardClaim, claimActionText, createPlayerDiscardClaim, findComputerWinners, findRobKongWinner };
})();
