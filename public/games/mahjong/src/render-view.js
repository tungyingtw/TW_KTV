(function () {
  function renderHelpPanel(context) {
    const { state, byId } = context;
    const panel = byId("rulesHelpPanel");
    const button = byId("rulesHelpButton");
    panel.classList.toggle("active", state.helpOpen);
    panel.setAttribute("aria-hidden", state.helpOpen ? "false" : "true");
    button.setAttribute("aria-expanded", state.helpOpen ? "true" : "false");
    button.classList.toggle("active", state.helpOpen);
  }

  function renderHudAndSetup(context) {
    const { state, byId, players, rulesetLabel, roundText, canDiscard } = context;
    byId("phaseText").textContent = state.result ? "本局結算" : state.screen === "shuffling" ? "洗牌中" : state.running ? "對局中" : "準備開局";
    byId("tokenText").textContent = `玩家代幣 ${state.tokens}`;
    byId("turnText").textContent = state.result ? state.result.title : state.screen === "shuffling" ? "準備發牌" : state.running ? `輪 ${players[state.current]}` : "等待開始";
    byId("roundText").textContent = `${rulesetLabel.replace(" 張", "")}｜${roundText}`;
    byId("setupPanel").classList.toggle("hidden", state.running || !!state.result);
    byId("setupSummary").textContent = `目前代幣 ${state.tokens}`;
    const canStart = state.tokens >= state.stake;
    const startButton = byId("startButton");
    const scorePreview = byId("scorePreview");
    scorePreview.classList.toggle("is-warning", !canStart);
    scorePreview.innerHTML = `<span class="setup-status-line ${canStart ? "setup-status-main" : "setup-status-warning"}">${canStart ? `本局預估：胡牌 +${state.stake} / 他家胡牌 -${state.stake}` : `代幣不足：需要 ${state.stake}，目前 ${state.tokens}`}</span><span class="setup-status-line">戰績 ${state.record.wins} 勝 / ${state.record.games} 局</span>`;
    startButton.disabled = !canStart;
    startButton.textContent = canStart ? "開始遊戲" : "代幣不足";
    startButton.setAttribute("aria-label", canStart ? "開始遊戲" : `代幣不足，至少需要 ${state.stake}`);
    startButton.title = canStart ? "開始遊戲" : `代幣不足，至少需要 ${state.stake}`;
    [1, 2, 3].forEach(player => byId(`opponentName-${player}`).textContent = players[player]);
    document.querySelectorAll(".ruleset-button").forEach(button => button.classList.toggle("active", button.dataset.ruleset === state.ruleset));
    document.querySelectorAll(".stake-button").forEach(button => button.classList.toggle("active", Number(button.dataset.stake) === state.stake));
    document.querySelectorAll(".difficulty-button").forEach(button => button.classList.toggle("active", button.dataset.difficulty === state.difficulty));
    byId("autoplayButton").textContent = "代打";
    byId("autoplayButton").classList.toggle("active", state.autoplay);
    byId("autoplayButton").setAttribute("aria-label", `電腦代打${state.autoplay ? "開啟" : "關閉"}`);
    byId("autoplayButton").title = `電腦代打${state.autoplay ? "開啟" : "關閉"}`;
    document.body.classList.toggle("lobby-mode", state.screen !== "playing");
    document.body.classList.toggle("title-mode", state.screen === "title");
    document.body.classList.toggle("shuffling-mode", state.screen === "shuffling");
    document.body.classList.toggle("result-mode", !!state.result && state.result.visible !== false);
    document.body.classList.toggle("awaiting-discard", state.running && state.current === 0 && !state.pendingClaim && !state.result && canDiscard);
  }

  function renderLog(items, context) {
    const { byId, escapeHtml } = context;
    byId("log").innerHTML = items.map(item => `<div class="status" title="${escapeHtml(item)}">${escapeHtml(item)}</div>`).join("");
  }

  function renderListeningHint(options, context) {
    const { state, byId, escapeHtml, makeSmallTile } = context;
    const panel = byId("listenHint");
    const details = byId("listenDetails");
    const locked = !!state.listenLock;
    panel.classList.toggle("active", locked || options.length > 0);
    panel.classList.toggle("locked", locked);
    panel.classList.toggle("open", state.showListenHint && (locked || options.length > 0));
    byId("listenButton").textContent = locked ? "已聽牌" : state.showListenHint ? "收起" : `可聽牌 ${options.length}`;
    details.innerHTML = "";
    if (locked) {
      const line = document.createElement("div");
      line.className = "listen-line listen-locked";
      line.innerHTML = `<strong>等牌中</strong><span>${escapeHtml(state.listenLock.waitLabels.join("、"))}</span><button class="secondary listen-cancel" type="button" data-listen-cancel="1">取消聽牌</button>`;
      details.appendChild(line);
      return;
    }
    if (!options.length) {
      state.showListenHint = false;
      return;
    }
    options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = "listen-line listen-choice";
      button.type = "button";
      button.dataset.listenIndex = String(index);
      button.innerHTML = `<strong>打 ${escapeHtml(option.discard.label)}</strong><span>${option.effective} 張</span>`;
      option.waits.slice(0, 8).forEach(tile => button.appendChild(makeSmallTile(tile)));
      details.appendChild(button);
    });
  }

  function renderMelds(context) {
    const { state, byId, makeSmallTile, flowerFlashIds } = context;
    const meldsEl = byId("playerMelds");
    meldsEl.innerHTML = "";
    state.melds[0].forEach(meld => meldsEl.appendChild(makeMeldElement(meld, { flowerFlashIds, makeSmallTile })));
  }

  function renderResult(context) {
    const { state, byId, escapeHtml, makeSmallTile, players, animateResultToken } = context;
    const overlay = byId("resultOverlay");
    const visible = !!state.result && state.result.visible !== false;
    overlay.classList.toggle("active", visible);
    if (!visible) return;
    const cardEl = overlay.querySelector(".result-card");
    const outcomeClass = state.result.type === "draw" ? "draw" : state.result.winner === 0 ? "win" : "loss";
    cardEl.className = `result-card ${state.result.type === "draw" ? "draw-result" : state.result.winner === 0 ? "player-win" : "computer-win"}`;
    byId("resultTitle").textContent = state.result.title;
    byId("resultMeta").innerHTML = [state.result.method, `底注 ${state.result.stake}`, state.result.roundResult, `下局 ${players[state.result.nextDealer]}`].filter(Boolean)
      .map(text => `<span class="result-chip">${escapeHtml(text)}</span>`)
      .join("");
    byId("resultOutcome").className = `result-outcome ${outcomeClass}`;
    byId("resultOutcome").textContent = outcomeClass === "draw" ? "流局" : outcomeClass === "win" ? "勝利" : "惜敗";
    const tokenEl = byId("resultToken");
    tokenEl.className = state.result.tokenDelta > 0 ? "token-gain" : state.result.tokenDelta < 0 ? "token-loss" : "token-even";
    if (state.result.animationDone) tokenEl.textContent = state.result.tokenText;
    else animateResultToken(state.result.tokenDelta, state.result.tokenText);
    byId("resultTokenPath").textContent = `本局前 ${state.result.tokenBefore} → 目前 ${state.result.tokenAfter}`;
    const canContinue = state.tokens >= state.stake;
    byId("resultSummary").textContent = canContinue ? state.result.settlement : `${state.result.settlement}；代幣不足，請回大廳調整底注或等明天每日配給。`;
    const nextRoundButton = byId("nextRoundButton");
    nextRoundButton.disabled = !canContinue;
    nextRoundButton.textContent = canContinue ? "續玩下一局" : "代幣不足";
    nextRoundButton.setAttribute("aria-label", canContinue ? "續玩下一局" : `代幣不足，至少需要 ${state.stake}`);
    nextRoundButton.title = canContinue ? "續玩下一局" : `代幣不足，至少需要 ${state.stake}，請回大廳調整底注或等明天每日配給`;
    const handEl = byId("resultHand");
    handEl.innerHTML = "";
    state.result.handTiles.forEach(tile => handEl.appendChild(makeSmallTile(tile)));
    state.result.melds.forEach(meld => handEl.appendChild(makeMeldElement(meld, context)));
    const scoresEl = byId("resultScores");
    scoresEl.innerHTML = "";
    state.result.tokenBreakdown.forEach((item, index) => {
      const card = document.createElement("div");
      const numericTai = Number.parseInt(item.value, 10) || 0;
      card.className = `result-score${numericTai >= 2 ? " bonus-score" : ""}${item.label === "本局計算" ? " calc-score" : ""}${item.label === "實際變化" ? " player" : ""}`;
      card.style.setProperty("--settle-index", index);
      card.innerHTML = `<span class="result-seat">${escapeHtml(item.label)}</span><strong class="result-score-value">${escapeHtml(item.value)}</strong><span class="score-delta ${String(item.value).startsWith("-") ? "negative" : "positive"}">${escapeHtml(item.note || "代幣倍率")}</span>`;
      scoresEl.appendChild(card);
    });
  }

  function renderPlayerHand(context) {
    const { state, byId, makeTileImage, onSelect } = context;
    const handEl = byId("playerHand");
    handEl.innerHTML = "";
    state.hands[0].forEach(tile => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tile ${tile.suit}${tile.id === state.selectedId ? " selected" : ""}${tile.id === state.lastDrawnId ? " drawn" : ""}`;
      button.setAttribute("aria-label", tile.label);
      button.title = tile.label;
      button.appendChild(makeTileImage(tile));
      button.disabled = !state.running || state.current !== 0 || !!state.pendingClaim;
      button.addEventListener("click", () => onSelect(tile));
      handEl.appendChild(button);
    });
  }

  function renderChiOptions(context) {
    const { state, byId, compareTiles, makeSmallTile, onClaimChi } = context;
    const optionsEl = byId("chiOptions");
    optionsEl.innerHTML = "";
    const options = state.pendingClaim?.chiOptions || [];
    options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "claim-choice chi-choice";
      const label = document.createElement("span");
      label.className = "meld-label";
      label.textContent = "吃";
      button.appendChild(label);
      [...option, state.pendingClaim.tile].sort(compareTiles).forEach(tile => button.appendChild(makeSmallTile(tile)));
      button.addEventListener("click", () => onClaimChi(index));
      optionsEl.appendChild(button);
    });
  }

  function renderKongOptions(context) {
    const { state, byId, rules, makeKongButton, onClaimExposedKong, onClaimConcealedKong, onClaimAddedKong } = context;
    const optionsEl = byId("kongOptions");
    optionsEl.innerHTML = "";
    if (state.pendingClaim?.canKong) {
      optionsEl.appendChild(makeKongButton("明槓", [state.pendingClaim.tile], onClaimExposedKong));
      return;
    }
    if (!state.running || state.current !== 0 || state.pendingClaim) return;
    rules.getConcealedKongOptions(state.hands[0]).forEach(option => {
      optionsEl.appendChild(makeKongButton("暗槓", option, () => onClaimConcealedKong(option)));
    });
    rules.getAddedKongOptions(state.hands[0], state.melds[0]).forEach(option => {
      optionsEl.appendChild(makeKongButton("補槓", option.tiles, () => onClaimAddedKong(option)));
    });
  }

  function renderComputers(context) {
    const { state, byId, makeSmallTile, flowerFlashIds } = context;
    for (let player = 1; player < 4; player += 1) {
      const handEl = byId(`hand-${player}`);
      const meldsEl = byId(`melds-${player}`);
      handEl.innerHTML = "";
      meldsEl.innerHTML = "";
      byId(`count-${player}`).textContent = `${state.hands[player].length} 張`;
      byId(`seat-${player}`).classList.toggle("active", state.running && state.current === player);
      meldsEl.classList.toggle("meld-crowded", state.melds[player].length >= 3);
      meldsEl.classList.toggle("meld-overflow", state.melds[player].length >= 5);
      const summary = document.createElement("button");
      summary.type = "button";
      summary.className = "hand-summary";
      summary.dataset.seatDetail = String(player);
      summary.setAttribute("aria-label", `查看電腦${player}資訊`);
      summary.innerHTML = `<span class="back-tile summary-back"></span><span class="hand-count">${state.hands[player].length}</span><span class="summary-action">查看</span>`;
      handEl.appendChild(summary);
      state.hands[player].forEach(() => {
        const tile = document.createElement("div");
        tile.className = "back-tile";
        handEl.appendChild(tile);
      });
      state.melds[player].forEach(meld => meldsEl.appendChild(makeMeldElement(meld, { flowerFlashIds, makeSmallTile })));
      if (state.melds[player].length) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "meld-summary";
        more.dataset.seatDetail = String(player);
        more.textContent = `查看副露 ${state.melds[player].length}`;
        meldsEl.appendChild(more);
      }
    }
  }

  function renderSeatDetail(context) {
    const { state, byId, makeSmallTile, players } = context;
    const panel = byId("seatDetailPanel");
    const body = byId("seatDetailBody");
    const player = state.seatDetailPlayer;
    const visible = Number.isInteger(player) && player > 0;
    panel.classList.toggle("active", visible);
    panel.setAttribute("aria-hidden", String(!visible));
    if (!visible) {
      body.innerHTML = "";
      return;
    }
    byId("seatDetailTitle").textContent = `${players[player]}資訊`;
    body.innerHTML = `<div class="seat-detail-count"><span class="back-tile summary-back"></span><strong>${state.hands[player].length}</strong><span>張暗牌</span></div>`;
    const melds = document.createElement("div");
    melds.className = "seat-detail-melds";
    if (state.melds[player].length) {
      state.melds[player].forEach(meld => melds.appendChild(makeMeldElement(meld, { flowerFlashIds: state.flowerFlashIds, makeSmallTile })));
    }
    body.appendChild(melds);
  }

  function renderRivers(context) {
    const { state, byId, makeSmallTile } = context;
    for (let player = 0; player < 4; player += 1) {
      const riverEl = byId(`river-${player}`);
      if (!riverEl) continue;
      riverEl.innerHTML = "";
      state.rivers[player].forEach(tile => riverEl.appendChild(makeSmallTile(tile)));
    }
    const sharedRiverEl = byId("sharedRiver");
    sharedRiverEl.innerHTML = "";
    sharedRiverEl.classList.toggle("river-compact", state.discardHistory.length > 36);
    sharedRiverEl.classList.toggle("river-dense", state.discardHistory.length > 64);
    sharedRiverEl.classList.toggle("river-ultra", state.discardHistory.length > 88);
    state.discardHistory.forEach((entry, index) => {
      const wrapper = document.createElement("span");
      wrapper.id = `river-entry-${index}`;
      wrapper.className = `river-entry${index >= state.discardHistory.length - 18 ? " river-recent" : ""}${index === state.latestDiscardIndex ? " latest" : ""}${index === state.discardAnimationIndex ? " entering" : ""}`;
      wrapper.appendChild(makeSmallTile(entry.tile));
      sharedRiverEl.appendChild(wrapper);
    });
    byId("riverDetailButton").textContent = `牌河 ${state.discardHistory.length}`;
    byId("riverDetailButton").setAttribute("aria-label", `查看完整牌河，共 ${state.discardHistory.length} 張`);
  }

  function renderRiverDetail(context) {
    const { state, byId, makeSmallTile } = context;
    const panel = byId("riverDetailPanel");
    const body = byId("riverDetailBody");
    panel.classList.toggle("active", !!state.riverDetailOpen);
    panel.setAttribute("aria-hidden", String(!state.riverDetailOpen));
    body.innerHTML = "";
    if (!state.riverDetailOpen) return;
    state.discardHistory.forEach((entry, index) => {
      const tileEl = makeSmallTile(entry.tile);
      if (index === state.discardHistory.length - 1) tileEl.classList.add("latest");
      body.appendChild(tileEl);
    });
  }

  function makeMeldElement(meld, context) {
    const { flowerFlashIds = [], makeSmallTile } = context;
    const meldEl = document.createElement("div");
    meldEl.className = `meld${meld.type === "補花" ? " flower-meld" : ""}`;
    const label = document.createElement("span");
    label.className = "meld-label";
    label.textContent = meld.type;
    meldEl.appendChild(label);
    meld.tiles.forEach(tile => meldEl.appendChild(makeSmallTile(tile, flowerFlashIds.includes(tile.id))));
    return meldEl;
  }

  function makeKongButton(labelText, tiles, onClick, context) {
    const { compareTiles, makeSmallTile } = context;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `claim-choice ${labelText.includes("槓") ? "kong-choice" : "chi-choice"}`;
    const label = document.createElement("span");
    label.className = "meld-label";
    label.textContent = labelText;
    button.appendChild(label);
    [...tiles].sort(compareTiles).forEach(tile => button.appendChild(makeSmallTile(tile)));
    button.addEventListener("click", onClick);
    return button;
  }

  window.MahjongRenderView = { makeKongButton, makeMeldElement, renderChiOptions, renderComputers, renderHelpPanel, renderHudAndSetup, renderKongOptions, renderListeningHint, renderLog, renderMelds, renderPlayerHand, renderResult, renderRiverDetail, renderRivers, renderSeatDetail };
})();
