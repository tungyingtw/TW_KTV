(function () {
  const RECORD_KEY = "webMahjongRecord";
  const LOG_LIMIT = 4;
  const STRATEGY_LOG_LIMIT = 3;

  function updateRecord(state, winner, storage = localStorage) {
    state.record.games += 1;
    if (winner === 0) state.record.wins += 1;
    storage.setItem(RECORD_KEY, JSON.stringify(state.record));
  }

  function loadRecord(state, storage = localStorage) {
    try {
      const saved = JSON.parse(storage.getItem(RECORD_KEY) || "null");
      if (saved && Number.isInteger(saved.games) && Number.isInteger(saved.wins)) state.record = saved;
    } catch {
      state.record = { games: 0, wins: 0 };
    }
  }

  function addLog(state, text) {
    state.log.unshift(text);
    state.log = state.log.slice(0, LOG_LIMIT);
  }

  function addStrategyLog(state, text) {
    if (!state.debugMode) return;
    state.strategyLog.unshift(text);
    state.strategyLog = state.strategyLog.slice(0, STRATEGY_LOG_LIMIT);
  }

  function combinedLog(state) {
    return [...state.log, ...(state.debugMode ? state.strategyLog.map(item => `AI：${item}`) : [])];
  }

  window.MahjongRecordLog = { RECORD_KEY, LOG_LIMIT, STRATEGY_LOG_LIMIT, addLog, addStrategyLog, combinedLog, loadRecord, updateRecord };
})();
