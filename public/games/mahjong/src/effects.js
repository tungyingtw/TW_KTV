(function () {
  const PARTICLE_LIMIT = 140;
  const EVENT_JUICE_TIERS = {
    discard: { tier: "low", label: "出牌", burst: false, safeMargin: 0, secondBurst: false },
    meld: { tier: "low", label: "副露", burst: false, safeMargin: 0, secondBurst: false },
    chi: { tier: "medium", label: "吃", burst: true, safeMargin: 76, secondBurst: false },
    pong: { tier: "medium", label: "碰", burst: true, safeMargin: 76, secondBurst: false },
    flower: { tier: "medium", label: "花", burst: true, safeMargin: 76, secondBurst: false },
    kong: { tier: "high", label: "槓", burst: true, safeMargin: 108, secondBurst: true },
    win: { tier: "highest", label: "胡", burst: true, safeMargin: 150, secondBurst: false },
    bigwin: { tier: "highest", label: "大胡", burst: true, safeMargin: 150, secondBurst: true },
    robKong: { tier: "highest", label: "搶槓", burst: true, safeMargin: 150, secondBurst: true },
    kongDrawWin: { tier: "highest", label: "槓花", burst: true, safeMargin: 150, secondBurst: true },
    tokenGain: { tier: "settlement", label: "代幣+", burst: false, safeMargin: 0, secondBurst: false },
    tokenLoss: { tier: "settlement", label: "代幣-", burst: false, safeMargin: 0, secondBurst: false }
  };

  const PARTICLE_SPECS = {
    chi: { count: [10, 16], speed: [1.1, 2.6], size: [1.8, 3.6], life: [360, 560], colors: ["#7dffd0", "#ffe27a", "#fff7d8"] },
    pong: { count: [26, 38], speed: [1.8, 4.8], size: [2.8, 5.8], life: [520, 860], colors: ["#fff0a8", "#ffc95a", "#ffffff"] },
    kong: { count: [56, 78], speed: [2.8, 6.8], size: [3.4, 7.6], life: [700, 1100], colors: ["#fff2a9", "#ffc14d", "#f6a33c"] },
    flower: { count: [14, 22], speed: [1.2, 3], size: [2, 4.4], life: [420, 680], colors: ["#8fffd2", "#fff0a3", "#d9fff0"] },
    win: { count: [72, 104], speed: [2.8, 6.8], size: [3, 7.2], life: [760, 1160], ringChance: 0.1, colors: ["#fff6bc", "#ffd65f", "#ffffff"] },
    bigwin: { count: [112, 140], speed: [3.2, 8], size: [3.4, 8.4], life: [880, 1360], ringChance: 0.24, colors: ["#fff8c8", "#ffd35b", "#ffb247", "#ffffff"] },
    robKong: { count: [104, 136], speed: [3.1, 7.6], size: [3.2, 7.8], life: [820, 1280], ringChance: 0.22, colors: ["#ffe37c", "#ffbd4f", "#fff5cd"] },
    kongDrawWin: { count: [118, 140], speed: [3.2, 8.2], size: [3.4, 8.6], life: [880, 1400], ringChance: 0.26, colors: ["#fff5b7", "#78ffd0", "#ffd65f", "#ffffff"] },
    tokenGain: { count: [28, 46], speed: [1.8, 5], size: [2.6, 6], life: [640, 1020], colors: ["#fff6b8", "#ffd14f", "#ffffff"] },
    tokenLoss: { count: [8, 14], speed: [1, 2.4], size: [1.6, 3.6], life: [380, 680], colors: ["#b7ecff", "#d8f2ff", "#ffffff"] }
  };

  const burstTypes = new Set(["chi", "pong", "kong", "flower", "win", "bigwin", "robKong", "kongDrawWin"]);
  const highValueTypes = new Set(["win", "bigwin", "robKong", "kongDrawWin"]);

  const eventJuiceTier = type => EVENT_JUICE_TIERS[type] || EVENT_JUICE_TIERS.discard;
  const shouldShowEventBurst = type => !!eventJuiceTier(type).burst && burstTypes.has(type);

  function flashClass(type) {
    if (highValueTypes.has(type)) return `flash-${type}`;
    if (["chi", "pong", "kong", "flower"].includes(type)) return `flash-${type}`;
    return type === "meld" ? "flash-meld" : type === "discard" ? "flash-discard" : "flash-message";
  }

  function trigger(type, originId = "", context) {
    const { state, byId, scheduleAction } = context;
    const className = flashClass(type);
    state.effectOriginId = originId;
    if (type === "discard") showDiscardShockwave({ state, byId });
    if (shouldShowEventBurst(type)) showEventBurst(type, { state, byId });
    emitParticles(type, { state, byId, scheduleAction });
    state.effectOriginId = "";
    document.body.classList.remove(className);
    void document.body.offsetWidth;
    document.body.classList.add(className);
    document.body.addEventListener("animationend", () => document.body.classList.remove(className), { once: true });
  }

  function showEventBurst(type, context) {
    const { byId } = context;
    const burst = byId("eventBurst");
    const origin = clampEventBurstOrigin(type, particleOrigin(type, context));
    burst.className = `event-burst ${type}`;
    burst.style.left = `${origin.x}px`;
    burst.style.top = `${origin.y}px`;
    document.body.style.setProperty("--juice-x", `${origin.x}px`);
    document.body.style.setProperty("--juice-y", `${origin.y}px`);
    burst.innerHTML = `<i></i><span>${eventJuiceTier(type).label || ""}</span>`;
  }

  function showDiscardShockwave(context) {
    if (prefersReducedMotion()) return;
    const origin = particleOrigin("discard", context);
    const wave = document.createElement("span");
    wave.className = "discard-shockwave";
    wave.style.left = `${origin.x}px`;
    wave.style.top = `${origin.y}px`;
    document.body.appendChild(wave);
    wave.addEventListener("animationend", () => wave.remove(), { once: true });
  }

  function clampEventBurstOrigin(type, origin) {
    const margin = eventJuiceTier(type).safeMargin;
    return {
      x: Math.min(Math.max(origin.x, margin), Math.max(margin, window.innerWidth - margin)),
      y: Math.min(Math.max(origin.y, margin), Math.max(margin, window.innerHeight - margin))
    };
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setupLayer(byId) {
    const canvas = byId("particleLayer");
    if (!canvas) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function particleOrigin(type, context) {
    const { state, byId } = context;
    const ids = { discard: "sharedRiver", tokenGain: "resultToken", tokenLoss: "resultToken" };
    const el = byId(state.effectOriginId || ids[type] || (highValueTypes.has(type) ? "resultOverlay" : "eventBurst")) || byId("sharedRiver");
    const rect = el?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  const randomBetween = range => range[0] + Math.random() * (range[1] - range[0]);
  const randomInt = range => Math.floor(randomBetween([range[0], range[1] + 1]));

  function addParticlesFromSpec(type, origin, state, scale = 1) {
    const spec = PARTICLE_SPECS[type];
    if (!spec) return;
    for (let i = 0, count = Math.max(1, Math.round(randomInt(spec.count) * scale)); i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(spec.speed);
      state.particles.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randomBetween(spec.size),
        life: randomBetween(spec.life),
        age: 0,
        shape: Math.random() < (spec.ringChance || 0) ? "ring" : "spark",
        color: spec.colors[Math.floor(Math.random() * spec.colors.length)]
      });
    }
    state.particles = state.particles.slice(-PARTICLE_LIMIT);
  }

  function emitParticles(type, context, origin = particleOrigin(type, context)) {
    const { state, byId, scheduleAction } = context;
    const spec = PARTICLE_SPECS[type];
    if (!spec || prefersReducedMotion()) return;
    setupLayer(byId);
    addParticlesFromSpec(type, origin, state);
    if (eventJuiceTier(type).secondBurst) {
      scheduleAction(() => {
        if (prefersReducedMotion()) return;
        addParticlesFromSpec(type, origin, state, 0.42);
        if (!state.particleFrame) state.particleFrame = requestAnimationFrame(timestamp => drawParticles(timestamp, context));
      }, 150);
    }
    if (!state.particleFrame) state.particleFrame = requestAnimationFrame(timestamp => drawParticles(timestamp, context));
  }

  function drawParticles(timestamp, context) {
    const { state, byId } = context;
    const ctx = setupLayer(byId);
    if (!ctx) return;
    const canvas = byId("particleLayer");
    const last = drawParticles.lastTime || timestamp;
    const delta = Math.min(34, timestamp - last);
    drawParticles.lastTime = timestamp;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";
    state.particles = state.particles.filter(particle => {
      particle.age += delta;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.x += particle.vx * delta / 16.67;
      particle.y += particle.vy * delta / 16.67;
      const alpha = Math.max(0, 1 - particle.age / particle.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      const radius = particle.size * (0.55 + alpha * 0.75);
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      if (particle.shape === "ring") {
        ctx.lineWidth = Math.max(1, radius * 0.34);
        ctx.strokeStyle = particle.color;
        ctx.stroke();
      } else {
        ctx.fill();
      }
      return alpha > 0.02;
    });
    ctx.globalAlpha = 1;
    if (state.particles.length) state.particleFrame = requestAnimationFrame(next => drawParticles(next, context));
    else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      state.particleFrame = 0;
      drawParticles.lastTime = 0;
    }
  }

  window.MahjongEffects = { addParticlesFromSpec, drawParticles, emitParticles, eventJuiceTier, particleOrigin, prefersReducedMotion, setupLayer, shouldShowEventBurst, showDiscardShockwave, trigger };
})();
