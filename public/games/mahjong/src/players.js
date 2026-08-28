(function () {
  const OPPONENT_NAMES = ["阿宏", "小美", "阿金", "老張", "小青", "志豪", "小玟", "阿凱", "雅婷", "冠宇", "小琪", "阿哲"];
  const DEFAULT_PLAYERS = ["玩家", "電腦 A", "電腦 B", "電腦 C"];

  function shuffle(items) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function createRoster() {
    return {
      players: [...DEFAULT_PLAYERS],
      assignOpponentNames() {
        const picked = shuffle(OPPONENT_NAMES).slice(0, 3);
        this.players = ["玩家", picked[0], picked[1], picked[2]];
        return this.players;
      }
    };
  }

  function meldOriginId(player) {
    return player === 0 ? "playerMelds" : `melds-${player}`;
  }

  window.MahjongPlayers = { createRoster, defaultPlayers: DEFAULT_PLAYERS, meldOriginId, opponentNames: OPPONENT_NAMES };
})();
