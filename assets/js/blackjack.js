/* ==========================================================================
   VELOURS — Blackjack (sabot de 6 jeux, S17, BJ 3:2)
   Side bets : Perfect Pairs, 21+3, Lucky Ladies, Bust It
   ========================================================================== */
(function () {
  "use strict";
  const { Wallet, Sound, fmt, short, chipEl, randInt, randRange, sleep, toast } = Casino;

  /* ------------------------------------------------------------------ */
  /*  Cartes & sabot                                                     */
  /* ------------------------------------------------------------------ */
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const RED_SUITS = new Set(["♥", "♦"]);
  const DECKS = 6;
  const TOTAL_CARDS = DECKS * 52;
  const LIMITS = { main: [1, 10000], side: [1, 1000] };
  const DEAL_MS = 430;

  const cardVal = (r) => (r === "A" ? 11 : r === "J" || r === "Q" || r === "K" ? 10 : +r);
  const RANK_ORDER = { A: 14, K: 13, Q: 12, J: 11, 10: 10, 9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2 };

  function handValue(cards) {
    let t = 0, aces = 0;
    for (const c of cards) { if (c.r === "A") { t += 1; aces++; } else t += cardVal(c.r); }
    let soft = false;
    if (aces && t + 10 <= 21) { t += 10; soft = true; }
    return { total: t, soft };
  }

  let shoe = [], cutAt = 0, dealt = 0, discarded = 0;
  function newShoe() {
    shoe = [];
    for (let d = 0; d < DECKS; d++) for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s });
    for (let i = shoe.length - 1; i > 0; i--) { const j = randInt(i + 1); [shoe[i], shoe[j]] = [shoe[j], shoe[i]]; }
    cutAt = Math.floor(TOTAL_CARDS * randRange(0.72, 0.78));
    dealt = 0; discarded = 0;
    updateShoe();
  }
  function draw() {
    if (!shoe.length) newShoe();
    dealt++;
    updateShoe();
    return { ...shoe.pop() };
  }
  const needsShuffle = () => dealt >= cutAt;

  /* ------------------------------------------------------------------ */
  /*  DOM                                                                */
  /* ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const table = $("table");
  const layer = $("cardLayer");
  const msgEl = $("msg");
  const shoeMeter = $("shoeMeter");
  const shoeLabel = $("shoeLabel");
  const discardStack = $("discardStack");
  const groups = { bet: $("betGroup"), play: $("playGroup"), over: $("overGroup") };
  const btn = {
    clear: $("btnClear"), rebet: $("btnRebet"), double: $("btnDouble"), deal: $("btnDeal"),
    hit: $("btnHit"), stand: $("btnStand"), dd: $("btnDoubleDown"), split: $("btnSplit"), surr: $("btnSurrender"),
    newb: $("btnNew"), redeal: $("btnRedeal"),
  };
  const hintToggle = $("hintToggle");

  function updateShoe() {
    const left = Math.max(0, shoe.length);
    shoeMeter.style.height = (left / TOTAL_CARDS) * 100 + "%";
    shoeLabel.textContent = `${left} cartes`;
    discardStack.style.height = Math.min(70, (discarded / TOTAL_CARDS) * 90) + "px";
  }

  /* ---------- Fabrication des cartes ---------- */
  const PIPS = {
    2: [[50, 21], [50, 79]],
    3: [[50, 21], [50, 50], [50, 79]],
    4: [[33, 21], [67, 21], [33, 79], [67, 79]],
    5: [[33, 21], [67, 21], [50, 50], [33, 79], [67, 79]],
    6: [[33, 21], [67, 21], [33, 50], [67, 50], [33, 79], [67, 79]],
    7: [[33, 21], [67, 21], [50, 35.5], [33, 50], [67, 50], [33, 79], [67, 79]],
    8: [[33, 21], [67, 21], [50, 35.5], [33, 50], [67, 50], [50, 64.5], [33, 79], [67, 79]],
    9: [[33, 21], [67, 21], [33, 40.3], [67, 40.3], [50, 50], [33, 59.7], [67, 59.7], [33, 79], [67, 79]],
    10: [[33, 21], [67, 21], [50, 30.5], [33, 40.3], [67, 40.3], [33, 59.7], [67, 59.7], [50, 69.5], [33, 79], [67, 79]],
  };
  const FACE_GLYPH = { K: "♚", Q: "♛", J: "♞" };

  function buildCard(card) {
    const el = document.createElement("div");
    el.className = "card facedown";
    const red = RED_SUITS.has(card.s);
    const corner = (pos) => `<div class="corner ${pos}${card.r === "10" ? " ten" : ""}"><span>${card.r}</span><span class="s">${card.s}</span></div>`;
    let center = "";
    if (card.r === "A") {
      center = `<div class="pips"><span class="pip ace${card.s === "♠" ? " spade" : ""}" style="left:50%;top:50%">${card.s}</span></div>`;
    } else if (FACE_GLYPH[card.r]) {
      const half = (cls) => `<div class="half ${cls}"><span class="glyph">${FACE_GLYPH[card.r]}</span><span class="letter">${card.s}</span></div>`;
      center = `<div class="face-art">${half("top")}${half("bot")}</div>`;
    } else {
      center = `<div class="pips">${PIPS[card.r].map(([x, y]) => `<span class="pip${y > 50 ? " flip" : ""}" style="left:${x}%;top:${y}%">${card.s}</span>`).join("")}</div>`;
    }
    el.innerHTML = `<div class="card-inner"><div class="card-face card-front${red ? " red" : ""}">${corner("tl")}${center}${corner("br")}</div><div class="card-face card-back"></div></div>`;
    el.setAttribute("aria-label", `${card.r}${card.s}`);
    return el;
  }

  /* ------------------------------------------------------------------ */
  /*  État de la partie                                                  */
  /* ------------------------------------------------------------------ */
  let phase = "betting"; // betting | dealing | insurance | player | dealer | over
  let busy = false;
  let dealer = { cards: [], badge: null };
  let hands = [];
  let active = 0;
  let insurance = 0;
  let balanceBefore = 0;
  const bets = { pp: 0, t213: 0, main: 0, ll: 0, bust: 0 };
  let lastBets = null;
  let chip = 25;
  const stats = { hands: 0, wins: 0, bj: 0, net: 0 };

  function newHand(bet) {
    return { cards: [], bet, doubled: false, bust: false, surrendered: false, fromSplit: false, splitAces: false, badge: null, resultEl: null, chip: null };
  }
  const isBJ = (h) => h.cards.length === 2 && !h.fromSplit && handValue(h.cards).total === 21;

  /* ------------------------------------------------------------------ */
  /*  Mise en page des cartes                                            */
  /* ------------------------------------------------------------------ */
  function metrics() {
    const W = table.clientWidth, H = table.clientHeight;
    const cw = Math.round(Math.max(52, Math.min(94, W * 0.082)));
    const ch = Math.round(cw * 1.4);
    return {
      W, H, cw, ch,
      dealerY: Math.max(46, H * 0.085),
      playerY: H * 0.5,
      shoe: [W - W * 0.04 - 100, 30],
      discard: [W * 0.04, 26],
    };
  }

  function setCardPos(c, x, y, rot) {
    c.x = x; c.y = y;
    c.el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
  }

  function layout() {
    const m = metrics();
    table.style.setProperty("--cw", m.cw + "px");
    table.classList.toggle("has-cards", dealer.cards.length > 0);
    const sizeAll = (c) => { c.el.style.setProperty("--cw", m.cw + "px"); c.el.style.setProperty("--ch", m.ch + "px"); };

    // Croupier
    const dn = dealer.cards.length;
    const ddx = m.cw * 0.62;
    const dStart = m.W / 2 - (m.cw + (dn - 1) * ddx) / 2;
    dealer.cards.forEach((c, j) => {
      sizeAll(c);
      c.el.style.zIndex = 10 + j;
      setCardPos(c, dStart + j * ddx, m.dealerY, c.rot);
    });
    if (dn) {
      const b = badgeFor(dealer);
      b.style.left = m.W / 2 + "px";
      b.style.top = m.dealerY - 8 + "px";
      const visible = dealer.cards.filter((c) => c.faceUp);
      const v = handValue(visible);
      const total = v.total;
      b.className = "hand-badge" + (total > 21 ? " bust" : "") + (dealer.cards.length === 2 && visible.length === 2 && total === 21 ? " bj" : "");
      b.innerHTML = visible.length < dealer.cards.length ? `${visible.length ? (v.soft && total < 21 ? `${total - 10}/${total}` : total) : "?"}` : badgeText(dealer.cards, false);
    }

    // Joueur
    const n = hands.length;
    const slotW = Math.min(m.cw * 2.7, (m.W - 30) / Math.max(1, n));
    hands.forEach((h, i) => {
      const k = h.cards.length;
      const cx = m.W / 2 + (i - (n - 1) / 2) * slotW;
      const dx = Math.min(m.cw * 0.32, k > 1 ? (slotW - m.cw - 10) / (k - 1) : 0);
      const dy = m.cw * 0.13;
      const width = m.cw + (k - 1) * dx;
      const x0 = cx - width / 2;
      h.cards.forEach((c, j) => {
        sizeAll(c);
        c.el.style.zIndex = 10 + j;
        const side = c.sideways ? m.cw * 0.2 : 0;
        setCardPos(c, x0 + j * dx + side, m.playerY - j * dy + (c.sideways ? m.ch * 0.1 : 0), c.rot);
        c.el.classList.toggle("dim", phase === "player" && n > 1 && i !== active);
      });
      const topY = m.playerY - Math.max(0, k - 1) * dy;
      const b = badgeFor(h);
      b.style.left = cx + "px";
      b.style.top = topY - 8 + "px";
      const v = handValue(h.cards).total;
      b.className = "hand-badge" +
        (phase === "player" && i === active ? " active" : "") +
        (v > 21 ? " bust" : "") + (isBJ(h) ? " bj" : "");
      b.innerHTML = `${badgeText(h.cards, h.fromSplit)}${n > 1 || h.doubled ? `<span class="bet">· ${fmt(h.bet)}</span>` : ""}`;
      if (h.resultEl) {
        h.resultEl.style.left = cx + "px";
        h.resultEl.style.top = m.playerY + m.ch * 0.5 + "px";
      }
    });
  }

  function badgeText(cards, fromSplit) {
    if (!cards.length) return "";
    const { total, soft } = handValue(cards);
    if (cards.length === 2 && total === 21 && !fromSplit) return "Blackjack";
    if (total > 21) return `${total} · Sauté`;
    if (soft && total < 21) return `${total - 10}/${total}`;
    return String(total);
  }

  function badgeFor(h) {
    if (!h.badge) {
      h.badge = document.createElement("div");
      h.badge.className = "hand-badge";
      layer.appendChild(h.badge);
    }
    return h.badge;
  }

  async function dealTo(target, faceUp = true, sideways = false) {
    const card = draw();
    card.faceUp = faceUp;
    card.sideways = sideways;
    card.rot = (Math.random() - 0.5) * 3;
    card.el = buildCard(card);
    if (sideways) card.el.classList.add("sideways");
    const m = metrics();
    card.el.style.setProperty("--cw", m.cw + "px");
    card.el.style.setProperty("--ch", m.ch + "px");
    card.el.style.transition = "none";
    card.el.style.transform = `translate(${m.shoe[0]}px, ${m.shoe[1]}px) rotate(-25deg)`;
    layer.appendChild(card.el);
    void card.el.offsetWidth; // force le reflow avant l'animation
    card.el.style.transition = "";
    target.cards.push(card);
    layout();
    Sound.card();
    if (faceUp) setTimeout(() => { card.el.classList.remove("facedown"); }, 200);
    await sleep(DEAL_MS);
    return card;
  }

  async function revealHole() {
    const hole = dealer.cards[1];
    if (!hole || hole.faceUp) return;
    hole.faceUp = true;
    hole.el.classList.remove("facedown");
    Sound.flip();
    await sleep(80);
    layout();
    await sleep(420);
  }

  /* ------------------------------------------------------------------ */
  /*  Messages & effets                                                  */
  /* ------------------------------------------------------------------ */
  let msgT;
  function showMsg(text, cls = "", ms = 1600) {
    clearTimeout(msgT);
    msgEl.textContent = text;
    msgEl.className = "bj-msg show " + cls;
    if (ms) msgT = setTimeout(() => msgEl.classList.remove("show"), ms);
  }

  function spotEl(key) { return document.querySelector(`.spot[data-spot="${key}"]`); }

  function renderSpot(key) {
    const circle = spotEl(key).querySelector(".spot-circle");
    circle.querySelectorAll(".chip").forEach((c) => c.remove());
    if (bets[key] > 0) {
      const c = chipEl(bets[key]);
      const v = Casino.chipValueFor(bets[key]);
      c.dataset.stack = String(Math.min(2, Math.ceil(bets[key] / v) - 1));
      circle.appendChild(c);
    }
  }
  function renderSpots() { Object.keys(bets).forEach(renderSpot); }

  function spotPop(key, text, win) {
    const s = spotEl(key);
    const p = document.createElement("div");
    p.className = "pop" + (win ? "" : " lose");
    p.textContent = text;
    s.appendChild(p);
    setTimeout(() => p.remove(), 3300);
    const c = s.querySelector(".chip");
    if (c) c.classList.add(win ? "won" : "gone");
    s.classList.toggle("win", !!win);
  }

  function showResult(h, cls, text) {
    const r = document.createElement("div");
    r.className = "hand-result " + cls;
    r.textContent = text;
    layer.appendChild(r);
    h.resultEl = r;
    layout();
    requestAnimationFrame(() => r.classList.add("show"));
  }

  /* ------------------------------------------------------------------ */
  /*  Mises                                                              */
  /* ------------------------------------------------------------------ */
  const totalBets = () => Object.values(bets).reduce((a, b) => a + b, 0);

  function addToSpot(key, amount) {
    if (phase === "over") newRound(false);
    if (phase !== "betting") return false;
    const max = key === "main" ? LIMITS.main[1] : LIMITS.side[1];
    if (bets[key] + amount > max) { toast(`Mise maximale sur cette case : ${fmt(max)}`); return false; }
    if (!Wallet.canAfford(amount)) { toast("Solde insuffisant"); return false; }
    bets[key] += amount;
    Wallet.add(-amount);
    renderSpot(key);
    updateControls();
    return true;
  }
  function removeFromSpot(key) {
    if (phase !== "betting" || !bets[key]) return;
    const d = Math.min(bets[key], chip);
    bets[key] -= d;
    Wallet.add(d);
    renderSpot(key);
    updateControls();
    Sound.click();
  }

  document.querySelectorAll(".spot").forEach((s) => {
    const key = s.dataset.spot;
    s.addEventListener("click", () => { if (addToSpot(key, chip)) Sound.chip(); });
    s.addEventListener("contextmenu", (e) => { e.preventDefault(); removeFromSpot(key); });
    s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); if (addToSpot(key, chip)) Sound.chip(); } });
  });

  function clearBets() {
    if (phase !== "betting") return;
    const t = totalBets();
    if (!t) return;
    Object.keys(bets).forEach((k) => (bets[k] = 0));
    Wallet.add(t);
    renderSpots();
    updateControls();
    Sound.click();
  }
  function placeBets(src) {
    const t = Object.values(src).reduce((a, b) => a + b, 0);
    if (!Wallet.canAfford(t)) { toast("Solde insuffisant pour rejouer cette mise"); return false; }
    Object.keys(bets).forEach((k) => (bets[k] = src[k]));
    Wallet.add(-t);
    renderSpots();
    updateControls();
    Sound.chip();
    return true;
  }
  function rebet() {
    if (phase !== "betting" || !lastBets || totalBets() > 0) return;
    placeBets(lastBets);
  }
  function doubleBets() {
    if (phase !== "betting" || !totalBets()) return;
    const doubled = {};
    for (const k in bets) {
      const max = k === "main" ? LIMITS.main[1] : LIMITS.side[1];
      doubled[k] = Math.min(max, bets[k] * 2);
    }
    const extra = Object.keys(bets).reduce((s, k) => s + doubled[k] - bets[k], 0);
    if (!Wallet.canAfford(extra)) { toast("Solde insuffisant pour doubler"); return; }
    Object.assign(bets, doubled);
    Wallet.add(-extra);
    renderSpots();
    updateControls();
    Sound.chip();
  }

  /* ------------------------------------------------------------------ */
  /*  Side bets                                                          */
  /* ------------------------------------------------------------------ */
  function evalPerfectPairs(a, b) {
    if (a.r !== b.r) return null;
    if (a.s === b.s) return [25, "Paire parfaite"];
    if (RED_SUITS.has(a.s) === RED_SUITS.has(b.s)) return [12, "Paire de couleur"];
    return [6, "Paire mixte"];
  }
  function eval213(cards) {
    const flush = cards.every((c) => c.s === cards[0].s);
    const trips = cards.every((c) => c.r === cards[0].r);
    const v = cards.map((c) => RANK_ORDER[c.r]).sort((x, y) => x - y);
    const consecutive = (arr) => arr[1] === arr[0] + 1 && arr[2] === arr[1] + 1;
    const straight = consecutive(v) || (v[2] === 14 && consecutive([1, v[0], v[1]]));
    if (trips && flush) return [100, "Brelan assorti"];
    if (straight && flush) return [40, "Quinte flush"];
    if (trips) return [30, "Brelan"];
    if (straight) return [10, "Suite"];
    if (flush) return [5, "Couleur"];
    return null;
  }
  function evalLuckyLadies(a, b, dealerBJ) {
    if (handValue([a, b]).total !== 20) return null;
    const qh = (c) => c.r === "Q" && c.s === "♥";
    if (qh(a) && qh(b)) return dealerBJ ? [1000, "Dames de cœur + BJ"] : [200, "Paire de dames de cœur"];
    if (a.r === b.r && a.s === b.s) return [25, "20 identique"];
    if (a.s === b.s) return [10, "20 assorti"];
    return [4, "Total de 20"];
  }
  function bustItMultiplier(n) {
    if (n <= 3) return 1;
    return { 4: 2, 5: 9, 6: 50, 7: 100 }[n] ?? 250;
  }
  function settleSide(key, result, labelLose = "Perdu") {
    const bet = bets[key];
    if (!bet) return;
    if (result) {
      const [mult, name] = result;
      const ret = bet * (mult + 1);
      Wallet.add(ret);
      spotPop(key, `${name} ${mult}:1 · +${fmt(ret)}`, true);
      Sound.win(mult >= 25);
    } else {
      spotPop(key, labelLose, false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Déroulement                                                        */
  /* ------------------------------------------------------------------ */
  async function deal() {
    if (phase === "over") { newRound(true); return; }
    if (phase !== "betting" || busy) return;
    if (bets.main < LIMITS.main[0]) {
      toast(totalBets() ? "Les side bets nécessitent une mise principale" : "Placez une mise principale");
      return;
    }
    busy = true;
    phase = "dealing";
    table.classList.add("locked");
    lastBets = { ...bets };
    balanceBefore = Wallet.get() + totalBets();
    updateControls();

    if (needsShuffle() || !shoe.length) {
      showMsg("Mélange du sabot…", "", 1300);
      Sound.shuffle();
      newShoe();
      await sleep(1300);
    }

    dealer = { cards: [], badge: null };
    hands = [newHand(bets.main)];
    active = 0;
    insurance = 0;

    await dealTo(hands[0]);
    await dealTo(dealer);
    await dealTo(hands[0]);
    await dealTo(dealer, false);

    const [p1, p2] = hands[0].cards;
    const up = dealer.cards[0];
    settleSide("pp", evalPerfectPairs(p1, p2));
    settleSide("t213", eval213([p1, p2, up]));
    if (bets.pp || bets.t213) await sleep(500);

    // Assurance
    if (up.r === "A") {
      const cost = Math.floor(bets.main / 2);
      if (cost > 0 && Wallet.canAfford(cost)) {
        phase = "insurance";
        updateControls();
        const take = await askInsurance(cost);
        if (take) { insurance = cost; Wallet.add(-cost); Sound.chip(); }
        phase = "dealing";
      }
    }

    const dealerBJ = handValue(dealer.cards).total === 21;
    const peek = up.r === "A" || cardVal(up.r) === 10;
    if (peek) {
      showMsg("Le croupier vérifie…", "", 900);
      await sleep(950);
    }
    settleSide("ll", evalLuckyLadies(p1, p2, dealerBJ));

    if (dealerBJ) {
      await revealHole();
      showMsg("Blackjack du croupier", "bad", 1800);
      if (insurance) { Wallet.add(insurance * 3); toast(`Assurance payée : +${fmt(insurance * 3)}`); }
      if (bets.bust) settleSide("bust", null);
      settleHands(true);
      busy = false;
      return endRound();
    }
    if (insurance) { toast("Pas de blackjack — assurance perdue"); }

    if (isBJ(hands[0])) {
      showMsg("Blackjack !", "good", 1600);
      Sound.win(true);
      await sleep(700);
      await dealerTurn();
      busy = false;
      return endRound();
    }

    phase = "player";
    busy = false;
    layout();
    updateControls();
  }

  function askInsurance(cost) {
    const p = $("insPrompt");
    $("insCost").textContent = `Coût ${fmt(cost)} · paye 2 : 1`;
    p.classList.add("show");
    return new Promise((resolve) => {
      const done = (v) => { p.classList.remove("show"); $("insYes").onclick = $("insNo").onclick = null; resolve(v); };
      $("insYes").onclick = () => done(true);
      $("insNo").onclick = () => done(false);
    });
  }

  const cur = () => hands[active];
  function canDouble(h = cur()) { return !!h && h.cards.length === 2 && !h.splitAces && Wallet.canAfford(h.bet); }
  function canSplit(h = cur()) {
    return !!h && h.cards.length === 2 && cardVal(h.cards[0].r) === cardVal(h.cards[1].r) &&
      hands.length < 4 && !h.splitAces && Wallet.canAfford(h.bet);
  }
  function canSurrender(h = cur()) { return !!h && hands.length === 1 && h.cards.length === 2 && !h.fromSplit; }

  async function act(fn) {
    if (phase !== "player" || busy) return;
    busy = true;
    updateControls();
    try { await fn(cur()); } finally { busy = false; updateControls(); }
  }

  const hit = () => act(async (h) => {
    await dealTo(h);
    const v = handValue(h.cards).total;
    if (v > 21) { h.bust = true; Sound.lose(); showMsg("Sauté", "bad", 900); await sleep(500); }
    if (v >= 21) await nextHand();
  });
  const stand = () => act(async () => { Sound.click(); await nextHand(); });
  const doubleDown = () => act(async (h) => {
    if (!canDouble(h)) return;
    Wallet.add(-h.bet);
    h.bet *= 2;
    h.doubled = true;
    Sound.chip();
    await dealTo(h, true, true);
    if (handValue(h.cards).total > 21) { h.bust = true; Sound.lose(); showMsg("Sauté", "bad", 900); await sleep(500); }
    await nextHand();
  });
  const split = () => act(async (h) => {
    if (!canSplit(h)) return;
    Wallet.add(-h.bet);
    Sound.chip();
    const second = h.cards.pop();
    const nh = newHand(h.bet);
    nh.cards.push(second);
    h.fromSplit = nh.fromSplit = true;
    if (h.cards[0].r === "A") h.splitAces = nh.splitAces = true;
    hands.splice(active + 1, 0, nh);
    layout();
    await sleep(380);
    await dealTo(h);
    if (h.splitAces || handValue(h.cards).total === 21) await nextHand();
    else layout();
  });
  const surrender = () => act(async (h) => {
    if (!canSurrender(h)) return;
    h.surrendered = true;
    Wallet.add(h.bet / 2);
    Sound.click();
    await nextHand();
  });

  async function nextHand() {
    active++;
    while (active < hands.length) {
      const h = hands[active];
      layout();
      if (h.cards.length < 2) { await sleep(250); await dealTo(h); }
      if (h.splitAces || handValue(h.cards).total === 21) { active++; continue; }
      layout();
      return; // à vous de jouer
    }
    await dealerTurn();
    endRound();
  }

  async function dealerTurn() {
    phase = "dealer";
    updateControls();
    layout();
    await revealHole();
    const live = hands.some((h) => !h.bust && !h.surrendered && !isBJ(h));
    if (live || bets.bust > 0) {
      // Le croupier tire jusqu'à 17 et reste sur tous les 17 (y compris soft)
      while (handValue(dealer.cards).total < 17) {
        await sleep(250);
        await dealTo(dealer);
      }
    }
    const dv = handValue(dealer.cards).total;
    if (dv > 21) { showMsg(`Le croupier saute (${dv})`, "good", 1500); Sound.win(); }
    if (bets.bust) {
      settleSide("bust", dv > 21 ? [bustItMultiplier(dealer.cards.length), `Saute en ${dealer.cards.length} cartes`] : null);
    }
    settleHands(false);
  }

  function settleHands(dealerBJ) {
    const dv = handValue(dealer.cards).total;
    const dealerBust = dv > 21;
    let wonAny = false, lostAll = true;
    hands.forEach((h) => {
      const hv = handValue(h.cards).total;
      let ret = 0, cls = "lose", text = "Perdu";
      if (h.surrendered) { text = "Abandon"; }
      else if (h.bust) { text = "Sauté"; }
      else if (dealerBJ) { if (isBJ(h)) { ret = h.bet; cls = "push"; text = "Égalité"; } }
      else if (isBJ(h)) { ret = h.bet * 2.5; cls = "bj"; text = `Blackjack +${fmt(ret)}`; stats.bj++; }
      else if (dealerBust || hv > dv) { ret = h.bet * 2; cls = "win"; text = `Gagné +${fmt(ret)}`; }
      else if (hv === dv) { ret = h.bet; cls = "push"; text = "Égalité"; }
      if (ret) Wallet.add(ret);
      if (cls === "win" || cls === "bj") { wonAny = true; stats.wins++; }
      if (cls !== "lose") lostAll = false;
      stats.hands++;
      showResult(h, cls, text);
    });
    const mainChip = spotEl("main").querySelector(".chip");
    if (mainChip) mainChip.classList.add(wonAny ? "won" : lostAll ? "gone" : "won");
    if (!dealerBJ && !wonAny && lostAll) Sound.lose();
    else if (wonAny) Sound.win();
  }

  function endRound() {
    phase = "over";
    table.classList.remove("locked");
    const net = Wallet.get() - balanceBefore;
    stats.net += net;
    renderStats();
    layout();
    updateControls();
    setTimeout(() => {
      if (phase !== "over") return;
      if (net > 0) showMsg(`+${fmt(net)}`, "good", 1800);
      else if (net < 0) showMsg(`−${fmt(-net)}`, "bad", 1500);
      else showMsg("Égalité", "", 1400);
    }, 600);
  }

  function newRound(rebetAndDeal) {
    if (phase !== "over") return;
    // Les cartes partent à la défausse
    const m = metrics();
    const all = [...dealer.cards, ...hands.flatMap((h) => h.cards)];
    all.forEach((c, i) => {
      c.el.classList.add("facedown");
      c.el.style.transitionDelay = i * 25 + "ms";
      c.el.style.transform = `translate(${m.discard[0]}px, ${m.discard[1] + 10}px) rotate(${-8 + Math.random() * 4}deg)`;
      setTimeout(() => c.el.classList.add("discarding"), 380 + i * 25);
      setTimeout(() => c.el.remove(), 900 + i * 25);
    });
    discarded += all.length;
    updateShoe();
    if (all.length) Sound.whoosh();
    [dealer, ...hands].forEach((h) => { if (h.badge) h.badge.remove(); if (h.resultEl) h.resultEl.remove(); });
    dealer = { cards: [], badge: null };
    hands = [];
    document.querySelectorAll(".spot").forEach((s) => s.classList.remove("win"));
    Object.keys(bets).forEach((k) => (bets[k] = 0));
    renderSpots();
    phase = "betting";
    updateControls();
    if (rebetAndDeal && lastBets) {
      if (placeBets(lastBets)) setTimeout(deal, 450);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Stratégie de base (6 jeux, S17, DAS, abandon tardif)               */
  /* ------------------------------------------------------------------ */
  function strategy(h) {
    const upCard = dealer.cards[0];
    const up = upCard.r === "A" ? 11 : cardVal(upCard.r);
    const { total, soft } = handValue(h.cards);
    const cd = canDouble(h), cr = canSurrender(h);
    const inR = (a, b) => up >= a && up <= b;
    if (canSplit(h)) {
      const p = cardVal(h.cards[0].r);
      const split =
        p === 11 || p === 8 ? true :
        p === 9 ? (inR(2, 6) || up === 8 || up === 9) :
        p === 7 ? inR(2, 7) :
        p === 6 ? inR(2, 6) :
        p === 4 ? inR(5, 6) :
        p === 3 || p === 2 ? inR(2, 7) : false;
      if (split) return "P";
    }
    if (cr && !soft) {
      if (total === 16 && up >= 9) return "R";
      if (total === 15 && up === 10) return "R";
    }
    if (soft) {
      if (total >= 19) return "S";
      if (total === 18) return inR(3, 6) ? (cd ? "D" : "S") : up <= 8 ? "S" : "H";
      if (total === 17) return inR(3, 6) && cd ? "D" : "H";
      if (total >= 15) return inR(4, 6) && cd ? "D" : "H";
      if (total >= 13) return inR(5, 6) && cd ? "D" : "H";
      return "H";
    }
    if (total >= 17) return "S";
    if (total >= 13) return up <= 6 ? "S" : "H";
    if (total === 12) return inR(4, 6) ? "S" : "H";
    if (total === 11) return up <= 10 && cd ? "D" : "H";
    if (total === 10) return up <= 9 && cd ? "D" : "H";
    if (total === 9) return inR(3, 6) && cd ? "D" : "H";
    return "H";
  }

  /* ------------------------------------------------------------------ */
  /*  Contrôles                                                          */
  /* ------------------------------------------------------------------ */
  function updateControls() {
    groups.bet.hidden = phase !== "betting";
    groups.play.hidden = !(phase === "player" || phase === "dealing" || phase === "dealer" || phase === "insurance");
    groups.over.hidden = phase !== "over";
    const t = totalBets();
    btn.clear.disabled = !t;
    btn.rebet.disabled = !lastBets || t > 0;
    btn.double.disabled = !t;
    btn.deal.disabled = bets.main <= 0;
    const playing = phase === "player" && !busy;
    btn.hit.disabled = !playing;
    btn.stand.disabled = !playing;
    btn.dd.disabled = !playing || !canDouble();
    btn.split.disabled = !playing || !canSplit();
    btn.surr.disabled = !playing || !canSurrender();
    btn.redeal.disabled = !lastBets;
    [btn.hit, btn.stand, btn.dd, btn.split, btn.surr].forEach((b) => b.classList.remove("hint"));
    if (playing && hintToggle.checked) {
      const s = strategy(cur());
      ({ H: btn.hit, S: btn.stand, D: btn.dd, P: btn.split, R: btn.surr })[s].classList.add("hint");
    }
    if (phase === "player" || phase === "dealer") layout();
  }

  function renderStats() {
    $("stHands").textContent = stats.hands;
    $("stWins").textContent = stats.wins;
    $("stBj").textContent = stats.bj;
    const n = $("stNet");
    n.textContent = (stats.net > 0 ? "+" : stats.net < 0 ? "−" : "") + fmt(Math.abs(stats.net));
    n.style.color = stats.net > 0 ? "var(--win)" : stats.net < 0 ? "var(--lose)" : "";
  }

  btn.clear.addEventListener("click", clearBets);
  btn.rebet.addEventListener("click", rebet);
  btn.double.addEventListener("click", doubleBets);
  btn.deal.addEventListener("click", deal);
  btn.hit.addEventListener("click", hit);
  btn.stand.addEventListener("click", stand);
  btn.dd.addEventListener("click", doubleDown);
  btn.split.addEventListener("click", split);
  btn.surr.addEventListener("click", surrender);
  btn.newb.addEventListener("click", () => newRound(false));
  btn.redeal.addEventListener("click", () => newRound(true));
  hintToggle.addEventListener("change", updateControls);

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ($("insPrompt").classList.contains("show")) {
      if (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "o") $("insYes").click();
      if (e.key.toLowerCase() === "n") $("insNo").click();
      return;
    }
    const k = e.key.toLowerCase();
    if (e.key === "Enter") {
      if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".spot")) return;
      e.preventDefault();
      if (phase === "betting") deal(); else if (phase === "over") newRound(true);
    } else if (phase === "player") {
      if (k === "h") hit(); else if (k === "s") stand(); else if (k === "d") doubleDown();
      else if (k === "p") split(); else if (k === "r") surrender();
    }
  });
  window.addEventListener("resize", () => layout());

  Casino.mountHeader("blackjack");
  Casino.canReset = () => phase === "betting" || phase === "over";
  Casino.mountChipTray($("chipTray"), [1, 5, 25, 100, 500, 1000], (v) => (chip = v), 25);
  newShoe();
  renderStats();
  updateControls();

  // Point d'accès pour les tests automatisés
  window.__bj = {
    get phase() { return phase; }, get hands() { return hands; }, get dealer() { return dealer; }, bets,
    stack(cards) { cards.slice().reverse().forEach((c) => shoe.push(c)); },
    eval213, evalPerfectPairs, evalLuckyLadies, strategy, handValue,
  };
})();
