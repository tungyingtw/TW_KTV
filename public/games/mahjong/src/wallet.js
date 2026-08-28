(function () {
  const DAILY_TOKENS = 5000;
  const WALLET_KEY = "webMahjongWallet";

  function todayKey() {
    return new Date().toLocaleDateString("en-CA");
  }

  function load(state, storage = localStorage) {
    const today = todayKey();
    try {
      const saved = JSON.parse(storage.getItem(WALLET_KEY) || "null");
      if (saved?.date === today && Number.isInteger(saved.tokens)) {
        state.tokens = Math.max(0, saved.tokens);
        return;
      }
    } catch {
      state.tokens = DAILY_TOKENS;
    }
    state.tokens = DAILY_TOKENS;
    save(state, storage);
  }

  function save(state, storage = localStorage) {
    storage.setItem(WALLET_KEY, JSON.stringify({ date: todayKey(), tokens: state.tokens, dailyTokens: DAILY_TOKENS }));
  }

  window.MahjongWallet = { DAILY_TOKENS, WALLET_KEY, load, save, todayKey };
})();
