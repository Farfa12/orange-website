/* ==========================================================================
   VELOURS — utilitaires partagés : solde, sons synthétisés, header, jetons
   Crédits 100 % virtuels, stockés localement dans le navigateur.
   ========================================================================== */
(function () {
  "use strict";

  const BAL_KEY = "velours.balance.v1";
  const MUTE_KEY = "velours.muted.v1";
  const START_BALANCE = 10000;
  const CHIP_VALUES = [1, 5, 25, 100, 500, 1000, 5000];

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* stockage indisponible */ }
  }

  /* ---------------- Solde ---------------- */
  let balance = Number(safeGet(BAL_KEY));
  if (!Number.isFinite(balance) || safeGet(BAL_KEY) === null) balance = START_BALANCE;
  const listeners = new Set();

  const Wallet = {
    get: () => balance,
    canAfford: (amount) => amount <= balance + 1e-9,
    add(delta) {
      balance = Math.round((balance + delta) * 100) / 100;
      safeSet(BAL_KEY, String(balance));
      listeners.forEach((fn) => fn(balance, delta));
      return balance;
    },
    reset() {
      const delta = START_BALANCE - balance;
      Wallet.add(delta);
    },
    onChange(fn) { listeners.add(fn); },
    START: START_BALANCE,
  };

  /* ---------------- Formatage ---------------- */
  const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
  const fmt = (n) => nf.format(n);
  const short = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace(".", ",") + "M";
    if (n >= 1e4) return Math.round(n / 1e3) + "k";
    if (n >= 1e3) return (n / 1e3).toFixed(n % 1e3 ? 1 : 0).replace(".", ",") + "k";
    return String(Math.round(n * 100) / 100).replace(".", ",");
  };
  const chipValueFor = (amount) => {
    let v = CHIP_VALUES[0];
    for (const c of CHIP_VALUES) if (amount >= c) v = c;
    return v;
  };

  /* ---------------- Hasard cryptographique ---------------- */
  function rand() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 4294967296;
  }
  const randRange = (min, max) => min + rand() * (max - min);
  const randInt = (n) => Math.floor(rand() * n);

  /* ---------------- Audio (WebAudio, aucun fichier) ---------------- */
  let actx = null, master = null, noiseBuf = null;
  let muted = safeGet(MUTE_KEY) === "1";

  function ensureAudio() {
    if (actx) { if (actx.state === "suspended") actx.resume(); return actx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(actx.destination);
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return actx;
  }
  ["pointerdown", "keydown"].forEach((ev) =>
    window.addEventListener(ev, ensureAudio, { once: false, passive: true })
  );

  function noiseBurst({ freq = 3000, q = 4, dur = 0.03, vol = 0.3, type = "bandpass", when = 0 }) {
    if (!actx || muted) return;
    const t = actx.currentTime + when;
    const src = actx.createBufferSource();
    src.buffer = noiseBuf;
    const f = actx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
  }
  function tone({ freq = 440, dur = 0.2, vol = 0.2, type = "sine", when = 0, slide = 0 }) {
    if (!actx || muted) return;
    const t = actx.currentTime + when;
    const o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // Bruit de roulement continu de la bille
  let roll = null;
  function setRoll(level, brightness = 1) {
    if (!actx) return;
    if (!roll) {
      const src = actx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.9; bp.frequency.value = 900;
      const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
      const g = actx.createGain(); g.gain.value = 0;
      src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(master);
      src.start();
      roll = { src, bp, lp, g };
    }
    const t = actx.currentTime;
    roll.g.gain.setTargetAtTime(muted ? 0 : Math.max(0, level) * 0.22, t, 0.05);
    roll.bp.frequency.setTargetAtTime(500 + 900 * brightness, t, 0.08);
  }

  const Sound = {
    ensure: ensureAudio,
    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      safeSet(MUTE_KEY, m ? "1" : "0");
      if (master) master.gain.value = m ? 0 : 0.8;
      if (roll && m) roll.g.gain.value = 0;
    },
    chip() {
      noiseBurst({ freq: 4200, q: 6, dur: 0.035, vol: 0.35 });
      noiseBurst({ freq: 2600, q: 8, dur: 0.05, vol: 0.25, when: 0.045 });
      tone({ freq: 2900, dur: 0.06, vol: 0.05, type: "triangle", when: 0.045 });
    },
    click() { tone({ freq: 1200, dur: 0.05, vol: 0.06, type: "square" }); },
    tick(vol = 0.3) {
      noiseBurst({ freq: 3600 + Math.random() * 1500, q: 10, dur: 0.025, vol: Math.min(0.6, vol) });
      tone({ freq: 1800 + Math.random() * 600, dur: 0.03, vol: Math.min(0.08, vol * 0.15), type: "triangle" });
    },
    clack(vol = 0.5) {
      noiseBurst({ freq: 1800, q: 3, dur: 0.06, vol });
      tone({ freq: 700, dur: 0.07, vol: vol * 0.2, type: "triangle" });
    },
    drop() {
      noiseBurst({ freq: 1200, q: 2, dur: 0.12, vol: 0.4 });
    },
    whoosh() {
      noiseBurst({ freq: 900, q: 0.8, dur: 0.35, vol: 0.25 });
    },
    card() {
      noiseBurst({ freq: 2400, q: 0.7, dur: 0.09, vol: 0.32 });
      noiseBurst({ freq: 5200, q: 1.5, dur: 0.05, vol: 0.12, when: 0.02 });
    },
    flip() { noiseBurst({ freq: 3200, q: 1.2, dur: 0.05, vol: 0.25 }); },
    shuffle() {
      for (let i = 0; i < 14; i++) noiseBurst({ freq: 2500 + Math.random() * 2500, q: 1, dur: 0.04, vol: 0.18, when: i * 0.045 });
    },
    win(big = false) {
      const notes = big ? [523, 659, 784, 1047, 1319] : [659, 784, 1047];
      notes.forEach((f, i) => tone({ freq: f, dur: 0.35, vol: 0.12, type: "triangle", when: i * 0.09 }));
    },
    lose() { tone({ freq: 220, dur: 0.35, vol: 0.08, type: "sine", slide: 0.6 }); },
    bell() { tone({ freq: 1568, dur: 0.9, vol: 0.08, type: "sine" }); tone({ freq: 2093, dur: 0.7, vol: 0.05, type: "sine", when: 0.02 }); },
    setRoll,
  };

  /* ---------------- Header ---------------- */
  const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const ICON_MUTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
  const ICON_RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';

  function mountHeader(active) {
    const el = document.querySelector("[data-topbar]");
    if (!el) return;
    el.classList.add("topbar");
    el.innerHTML = `
      <a class="brand" href="index.html" aria-label="Accueil Velours"><span class="brand-mark"></span>VELOURS</a>
      <nav class="nav" aria-label="Jeux">
        <a href="index.html" class="${active === "lobby" ? "active" : ""}">Lobby</a>
        <a href="roulette.html" class="${active === "roulette" ? "active" : ""}">Roulette</a>
        <a href="blackjack.html" class="${active === "blackjack" ? "active" : ""}">Blackjack</a>
      </nav>
      <div class="topbar-right">
        <div class="balance" title="Crédits virtuels — sans valeur réelle">
          <span class="coin"></span>
          <div><small>Solde</small><strong data-balance>${fmt(balance)}</strong></div>
        </div>
        <button class="icon-btn" data-reset title="Recharger 10 000 crédits" aria-label="Recharger le solde">${ICON_RESET}</button>
        <button class="icon-btn" data-mute aria-label="Couper / activer le son">${muted ? ICON_MUTE : ICON_SOUND}</button>
      </div>`;
    const balEl = el.querySelector("[data-balance]");
    let flashT;
    Wallet.onChange((b, delta) => {
      balEl.textContent = fmt(b);
      balEl.classList.remove("up", "down");
      if (delta > 0.001) balEl.classList.add("up");
      else if (delta < -0.001) balEl.classList.add("down");
      clearTimeout(flashT);
      flashT = setTimeout(() => balEl.classList.remove("up", "down"), 700);
    });
    const muteBtn = el.querySelector("[data-mute]");
    muteBtn.addEventListener("click", () => {
      Sound.setMuted(!muted);
      muteBtn.innerHTML = muted ? ICON_MUTE : ICON_SOUND;
    });
    el.querySelector("[data-reset]").addEventListener("click", () => {
      if (typeof Casino.canReset === "function" && !Casino.canReset()) {
        toast("Terminez la partie en cours avant de recharger.");
        return;
      }
      if (balance >= START_BALANCE) { toast("Votre solde est déjà au-dessus de 10 000."); return; }
      Wallet.reset();
      toast("Solde rechargé à 10 000 crédits");
    });
  }

  /* ---------------- Toast ---------------- */
  function toast(msg, ms = 2200) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; }, ms);
    setTimeout(() => t.remove(), ms + 350);
  }

  /* ---------------- Jetons ---------------- */
  function chipEl(value, label) {
    const d = document.createElement("div");
    d.className = "chip";
    d.dataset.v = String(chipValueFor(value));
    d.innerHTML = `<span>${label ?? short(value)}</span>`;
    return d;
  }

  function mountChipTray(container, values, onSelect, initial) {
    let selected = initial ?? values[1];
    const els = values.map((v) => {
      const c = chipEl(v);
      c.dataset.v = String(v);
      c.setAttribute("role", "button");
      c.setAttribute("tabindex", "0");
      c.setAttribute("aria-label", `Jeton de ${v}`);
      const pick = () => { selected = v; refresh(); Sound.chip(); onSelect(v); };
      c.addEventListener("click", pick);
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      container.appendChild(c);
      return c;
    });
    function refresh() {
      els.forEach((c, i) => {
        c.classList.toggle("selected", values[i] === selected);
        c.classList.toggle("unaffordable", values[i] > balance);
      });
    }
    Wallet.onChange(refresh);
    refresh();
    onSelect(selected);
    return { get: () => selected, refresh };
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  window.Casino = {
    Wallet, Sound, fmt, short, chipValueFor, chipEl, mountChipTray, mountHeader, toast,
    rand, randRange, randInt, sleep, CHIP_VALUES, canReset: null,
  };
})();
