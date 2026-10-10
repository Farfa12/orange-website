/* ==========================================================================
   VELOURS — Roulette européenne
   - Roue dessinée sur canvas (bois, laiton, cases, frettes, tourelle chromée)
   - Bille simulée physiquement : piste, décélération, chute en spirale,
     rebonds sur les losanges, sauts par-dessus les frettes, stabilisation.
   - Le numéro gagnant est celui de la case où la bille s'arrête réellement.
   ========================================================================== */
(function () {
  "use strict";
  const { Wallet, Sound, fmt, short, chipEl, rand, randRange, sleep } = Casino;

  /* ------------------------------------------------------------------ */
  /*  Données de la roue                                                 */
  /* ------------------------------------------------------------------ */
  const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colorOf = (n) => (n === 0 ? "green" : RED.has(n) ? "red" : "black");
  const colorName = (n) => (n === 0 ? "Vert" : RED.has(n) ? "Rouge" : "Noir");
  const N = 37;
  const STEP = (Math.PI * 2) / N;
  const BASE = -Math.PI / 2; // case 0 en haut quand la roue est à l'angle 0
  const TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ */
  /*  Géométrie (canvas interne 1000×1000)                               */
  /* ------------------------------------------------------------------ */
  const SIZE = 1000, CX = 500, CY = 500;
  const R = {
    rimOuter: 494, rimInner: 456,
    trackOuter: 452, trackInner: 386,
    slopeInner: 320,
    wheelOuter: 318, numOuter: 306, numInner: 256,
    pocketOuter: 252, pocketInner: 198,
    coneOuter: 192, turret: 64,
  };
  const BALL_R = 13;
  const TRACK_R = R.trackOuter - BALL_R - 3;
  const REST_R = 223;
  const DEFLECT_R = 353;
  const DEFLECTORS = Array.from({ length: 8 }, (_, k) => Math.PI / 8 + (k * Math.PI) / 4);
  const FRET_H = 9;
  const SEG_FILL = { red: ["#d01f2a", "#8f0f17"], black: ["#2a2c30", "#0b0c0d"], green: ["#13a058", "#06592c"] };

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");

  function makeLayer() {
    const c = document.createElement("canvas");
    c.width = SIZE; c.height = SIZE;
    return [c, c.getContext("2d")];
  }

  function ring(g, r1, r2, fill) {
    g.beginPath();
    g.arc(CX, CY, r1, 0, TAU);
    g.arc(CX, CY, r2, 0, TAU, true);
    g.fillStyle = fill;
    g.fill("evenodd");
  }

  function goldGradient(g, r1, r2) {
    const gr = g.createLinearGradient(CX - r1, CY - r1, CX + r1, CY + r1);
    gr.addColorStop(0, "#fff1b8");
    gr.addColorStop(0.25, "#d4af37");
    gr.addColorStop(0.5, "#8a6d1d");
    gr.addColorStop(0.7, "#e9c96a");
    gr.addColorStop(1, "#6e5414");
    return gr;
  }

  function seeded(seed) {
    let s = seed;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  }

  /* ---------- Cuvette fixe ---------- */
  const [bowl, bg] = makeLayer();
  (function drawBowl() {
    const rnd = seeded(42);
    // Ombre portée
    bg.save();
    bg.shadowColor = "rgba(0,0,0,0.7)";
    bg.shadowBlur = 30;
    bg.beginPath(); bg.arc(CX, CY, R.rimOuter - 4, 0, TAU); bg.fillStyle = "#1a0c05"; bg.fill();
    bg.restore();

    // Jante en bois (acajou)
    const wood = bg.createRadialGradient(CX, CY, R.rimInner, CX, CY, R.rimOuter);
    wood.addColorStop(0, "#3a1a0a");
    wood.addColorStop(0.35, "#6b3416");
    wood.addColorStop(0.7, "#4a220d");
    wood.addColorStop(1, "#241005");
    ring(bg, R.rimOuter, R.rimInner, wood);
    // Veinage
    bg.save();
    bg.beginPath(); bg.arc(CX, CY, R.rimOuter, 0, TAU); bg.arc(CX, CY, R.rimInner, 0, TAU, true); bg.clip("evenodd");
    for (let i = 0; i < 260; i++) {
      const r = R.rimInner + rnd() * (R.rimOuter - R.rimInner);
      const a0 = rnd() * TAU, len = 0.2 + rnd() * 1.4;
      bg.beginPath(); bg.arc(CX, CY, r, a0, a0 + len);
      bg.strokeStyle = rnd() < 0.7 ? `rgba(0,0,0,${0.08 + rnd() * 0.2})` : `rgba(255,190,140,${0.04 + rnd() * 0.08})`;
      bg.lineWidth = 0.6 + rnd() * 1.6; bg.stroke();
    }
    bg.restore();
    // Vernis (reflet)
    const varnish = bg.createLinearGradient(0, 0, SIZE, SIZE);
    varnish.addColorStop(0, "rgba(255,230,200,0.22)");
    varnish.addColorStop(0.45, "rgba(255,230,200,0.0)");
    varnish.addColorStop(1, "rgba(0,0,0,0.25)");
    ring(bg, R.rimOuter, R.rimInner, varnish);
    // Filets dorés
    bg.lineWidth = 3; bg.strokeStyle = goldGradient(bg, R.rimOuter, 0);
    bg.beginPath(); bg.arc(CX, CY, R.rimOuter - 2, 0, TAU); bg.stroke();
    bg.lineWidth = 6;
    bg.beginPath(); bg.arc(CX, CY, R.rimInner, 0, TAU); bg.stroke();

    // Piste de la bille (bois sombre poli)
    const track = bg.createRadialGradient(CX, CY, R.trackInner, CX, CY, R.trackOuter);
    track.addColorStop(0, "#120904");
    track.addColorStop(0.55, "#2d170a");
    track.addColorStop(0.9, "#4a2914");
    track.addColorStop(1, "#140a04");
    ring(bg, R.trackOuter, R.trackInner, track);
    // Reflet conique sur la piste
    if (bg.createConicGradient) {
      const sheen = bg.createConicGradient(-Math.PI * 0.75, CX, CY);
      sheen.addColorStop(0, "rgba(255,220,180,0.20)");
      sheen.addColorStop(0.12, "rgba(255,220,180,0)");
      sheen.addColorStop(0.5, "rgba(255,220,180,0.10)");
      sheen.addColorStop(0.62, "rgba(255,220,180,0)");
      sheen.addColorStop(1, "rgba(255,220,180,0.20)");
      ring(bg, R.trackOuter, R.trackInner, sheen);
    }
    // Pente inférieure
    const slope = bg.createRadialGradient(CX, CY, R.slopeInner, CX, CY, R.trackInner);
    slope.addColorStop(0, "#07090a");
    slope.addColorStop(0.6, "#1b1d20");
    slope.addColorStop(1, "#2c2f33");
    ring(bg, R.trackInner, R.slopeInner, slope);
    if (bg.createConicGradient) {
      const s2 = bg.createConicGradient(-Math.PI * 0.75, CX, CY);
      s2.addColorStop(0, "rgba(255,255,255,0.10)");
      s2.addColorStop(0.15, "rgba(255,255,255,0)");
      s2.addColorStop(0.85, "rgba(255,255,255,0)");
      s2.addColorStop(1, "rgba(255,255,255,0.10)");
      ring(bg, R.trackInner, R.slopeInner, s2);
    }
    bg.lineWidth = 2.5; bg.strokeStyle = goldGradient(bg, R.trackInner, 0);
    bg.beginPath(); bg.arc(CX, CY, R.trackInner, 0, TAU); bg.stroke();
    // Gorge sous la roue
    ring(bg, R.slopeInner, R.wheelOuter - 2, "#030303");

    // Losanges (déflecteurs)
    DEFLECTORS.forEach((a, k) => {
      bg.save();
      bg.translate(CX + Math.cos(a) * DEFLECT_R, CY + Math.sin(a) * DEFLECT_R);
      bg.rotate(a + (k % 2 ? 0 : Math.PI / 2));
      const L = k % 2 ? 24 : 15, W = k % 2 ? 8 : 9;
      bg.shadowColor = "rgba(0,0,0,0.7)"; bg.shadowBlur = 8; bg.shadowOffsetX = 3; bg.shadowOffsetY = 4;
      bg.beginPath(); bg.moveTo(-L, 0); bg.lineTo(0, -W); bg.lineTo(L, 0); bg.lineTo(0, W); bg.closePath();
      const dg = bg.createLinearGradient(-L, -W, L, W);
      dg.addColorStop(0, "#fff4c8"); dg.addColorStop(0.45, "#d4af37"); dg.addColorStop(0.55, "#7d6218"); dg.addColorStop(1, "#c9a43c");
      bg.fillStyle = dg; bg.fill();
      bg.shadowColor = "transparent";
      bg.beginPath(); bg.moveTo(-L, 0); bg.lineTo(0, -W); bg.lineTo(L, 0);
      bg.strokeStyle = "rgba(255,255,255,0.6)"; bg.lineWidth = 1; bg.stroke();
      bg.restore();
    });
  })();

  /* ---------- Cylindre tournant ---------- */
  const [wheelLayer, wg] = makeLayer();
  (function drawWheel() {
    // Ombre sous le cylindre
    wg.save();
    wg.shadowColor = "rgba(0,0,0,0.85)"; wg.shadowBlur = 18;
    wg.beginPath(); wg.arc(CX, CY, R.wheelOuter, 0, TAU); wg.fillStyle = "#111"; wg.fill();
    wg.restore();
    // Bague extérieure laiton
    ring(wg, R.wheelOuter, R.numOuter, goldGradient(wg, R.wheelOuter, 0));

    for (let i = 0; i < N; i++) {
      const n = ORDER[i];
      const a = BASE + i * STEP;
      const c = colorOf(n);
      // Bande des numéros
      const g1 = wg.createRadialGradient(CX, CY, R.numInner, CX, CY, R.numOuter);
      g1.addColorStop(0, SEG_FILL[c][1]); g1.addColorStop(1, SEG_FILL[c][0]);
      wg.beginPath();
      wg.arc(CX, CY, R.numOuter, a - STEP / 2, a + STEP / 2);
      wg.arc(CX, CY, R.numInner, a + STEP / 2, a - STEP / 2, true);
      wg.closePath(); wg.fillStyle = g1; wg.fill();
      // Case (plus profonde, plus sombre)
      const g2 = wg.createRadialGradient(CX, CY, R.pocketInner, CX, CY, R.pocketOuter);
      g2.addColorStop(0, "#000");
      g2.addColorStop(0.25, SEG_FILL[c][1]);
      g2.addColorStop(0.7, SEG_FILL[c][0]);
      g2.addColorStop(1, SEG_FILL[c][1]);
      wg.beginPath();
      wg.arc(CX, CY, R.pocketOuter, a - STEP / 2, a + STEP / 2);
      wg.arc(CX, CY, R.pocketInner, a + STEP / 2, a - STEP / 2, true);
      wg.closePath(); wg.fillStyle = g2; wg.fill();
      // Numéro
      wg.save();
      wg.translate(CX + Math.cos(a) * 281, CY + Math.sin(a) * 281);
      wg.rotate(a + Math.PI / 2);
      wg.fillStyle = "#fff";
      wg.font = "700 31px 'Cinzel', Georgia, serif";
      wg.textAlign = "center"; wg.textBaseline = "middle";
      wg.shadowColor = "rgba(0,0,0,0.6)"; wg.shadowBlur = 3;
      wg.fillText(String(n), 0, 1);
      wg.restore();
    }
    // Séparateurs dorés de la bande des numéros
    for (let i = 0; i < N; i++) {
      const a = BASE + i * STEP + STEP / 2;
      wg.beginPath();
      wg.moveTo(CX + Math.cos(a) * R.numInner, CY + Math.sin(a) * R.numInner);
      wg.lineTo(CX + Math.cos(a) * R.numOuter, CY + Math.sin(a) * R.numOuter);
      wg.strokeStyle = "rgba(230,196,96,0.9)"; wg.lineWidth = 2; wg.stroke();
    }
    // Bagues
    ring(wg, R.numInner, R.pocketOuter, goldGradient(wg, R.numInner, 0));
    // Ombre intérieure des cases
    const inner = wg.createRadialGradient(CX, CY, R.pocketInner, CX, CY, R.pocketOuter);
    inner.addColorStop(0, "rgba(0,0,0,0.55)"); inner.addColorStop(0.3, "rgba(0,0,0,0)"); inner.addColorStop(0.9, "rgba(0,0,0,0)"); inner.addColorStop(1, "rgba(0,0,0,0.45)");
    ring(wg, R.pocketOuter, R.pocketInner, inner);
    // Frettes chromées
    for (let i = 0; i < N; i++) {
      const a = BASE + i * STEP + STEP / 2;
      const x1 = CX + Math.cos(a) * R.pocketInner, y1 = CY + Math.sin(a) * R.pocketInner;
      const x2 = CX + Math.cos(a) * (R.pocketOuter + 2), y2 = CY + Math.sin(a) * (R.pocketOuter + 2);
      wg.save();
      wg.shadowColor = "rgba(0,0,0,0.8)"; wg.shadowBlur = 4; wg.shadowOffsetX = 2; wg.shadowOffsetY = 2;
      wg.beginPath(); wg.moveTo(x1, y1); wg.lineTo(x2, y2);
      wg.strokeStyle = "#cfd3d8"; wg.lineWidth = 5; wg.lineCap = "round"; wg.stroke();
      wg.restore();
      wg.beginPath(); wg.moveTo(x1, y1); wg.lineTo(x2, y2);
      wg.strokeStyle = "rgba(255,255,255,0.9)"; wg.lineWidth = 1.6; wg.stroke();
    }
    ring(wg, R.pocketInner, R.coneOuter, goldGradient(wg, R.pocketInner, 0));

    // Cône central en bois
    const cone = wg.createRadialGradient(CX - 40, CY - 50, 10, CX, CY, R.coneOuter);
    cone.addColorStop(0, "#a0592a");
    cone.addColorStop(0.5, "#6b3416");
    cone.addColorStop(1, "#2f1407");
    wg.beginPath(); wg.arc(CX, CY, R.coneOuter, 0, TAU); wg.fillStyle = cone; wg.fill();
    const rnd = seeded(7);
    wg.save();
    wg.beginPath(); wg.arc(CX, CY, R.coneOuter, 0, TAU); wg.clip();
    for (let i = 0; i < 90; i++) {
      const a = rnd() * TAU;
      wg.beginPath();
      wg.moveTo(CX + Math.cos(a) * R.turret, CY + Math.sin(a) * R.turret);
      wg.lineTo(CX + Math.cos(a + 0.02) * R.coneOuter, CY + Math.sin(a + 0.02) * R.coneOuter);
      wg.strokeStyle = `rgba(0,0,0,${0.06 + rnd() * 0.12})`; wg.lineWidth = 1 + rnd() * 2; wg.stroke();
    }
    wg.restore();
    // Rayons décoratifs dorés
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8 + STEP / 2;
      wg.beginPath();
      wg.moveTo(CX + Math.cos(a) * (R.turret + 6), CY + Math.sin(a) * (R.turret + 6));
      wg.lineTo(CX + Math.cos(a) * (R.coneOuter - 6), CY + Math.sin(a) * (R.coneOuter - 6));
      wg.strokeStyle = "rgba(212,175,55,0.55)"; wg.lineWidth = 2; wg.stroke();
    }

    // Tourelle : 4 bras chromés
    for (let i = 0; i < 4; i++) {
      const a = (i * TAU) / 4 + Math.PI / 4;
      wg.save();
      wg.translate(CX, CY); wg.rotate(a);
      wg.shadowColor = "rgba(0,0,0,0.7)"; wg.shadowBlur = 10; wg.shadowOffsetX = 4; wg.shadowOffsetY = 5;
      const arm = wg.createLinearGradient(0, -12, 0, 12);
      arm.addColorStop(0, "#fafafa"); arm.addColorStop(0.45, "#a9adb3"); arm.addColorStop(0.55, "#6a6e74"); arm.addColorStop(1, "#d9dce0");
      wg.beginPath();
      wg.moveTo(30, -13); wg.quadraticCurveTo(100, -6, 150, -5); wg.lineTo(150, 5); wg.quadraticCurveTo(100, 6, 30, 13);
      wg.closePath(); wg.fillStyle = arm; wg.fill();
      wg.shadowColor = "transparent";
      const knob = wg.createRadialGradient(152, -5, 2, 156, 0, 15);
      knob.addColorStop(0, "#fff"); knob.addColorStop(0.5, "#b7bbc1"); knob.addColorStop(1, "#4b4f55");
      wg.beginPath(); wg.arc(156, 0, 14, 0, TAU); wg.fillStyle = knob; wg.fill();
      wg.restore();
    }
    const hub = wg.createRadialGradient(CX - 18, CY - 22, 4, CX, CY, R.turret);
    hub.addColorStop(0, "#ffffff"); hub.addColorStop(0.35, "#c9ccd1"); hub.addColorStop(0.75, "#6d7177"); hub.addColorStop(1, "#2b2e32");
    wg.save();
    wg.shadowColor = "rgba(0,0,0,0.6)"; wg.shadowBlur = 14;
    wg.beginPath(); wg.arc(CX, CY, R.turret - 10, 0, TAU); wg.fillStyle = hub; wg.fill();
    wg.restore();
    const top = wg.createRadialGradient(CX - 8, CY - 10, 2, CX, CY, 26);
    top.addColorStop(0, "#fff"); top.addColorStop(0.6, "#d4af37"); top.addColorStop(1, "#6e5414");
    wg.beginPath(); wg.arc(CX, CY, 24, 0, TAU); wg.fillStyle = top; wg.fill();
  })();

  /* ---------- Éclairage fixe (ne tourne pas avec la roue) ---------- */
  const [light, lg] = makeLayer();
  (function drawLight() {
    const l1 = lg.createRadialGradient(CX - 200, CY - 240, 20, CX - 120, CY - 140, 520);
    l1.addColorStop(0, "rgba(255,248,230,0.20)");
    l1.addColorStop(0.5, "rgba(255,248,230,0.04)");
    l1.addColorStop(1, "rgba(255,248,230,0)");
    lg.beginPath(); lg.arc(CX, CY, R.wheelOuter, 0, TAU); lg.fillStyle = l1; lg.fill();
    const l2 = lg.createRadialGradient(CX + 160, CY + 200, 40, CX, CY, R.wheelOuter);
    l2.addColorStop(0, "rgba(0,0,0,0.25)"); l2.addColorStop(1, "rgba(0,0,0,0)");
    lg.beginPath(); lg.arc(CX, CY, R.wheelOuter, 0, TAU); lg.fillStyle = l2; lg.fill();
    // Reflet sur le dôme de la tourelle
    lg.beginPath(); lg.ellipse(CX - 16, CY - 20, 14, 8, -0.7, 0, TAU);
    lg.fillStyle = "rgba(255,255,255,0.55)"; lg.fill();
  })();

  /* ------------------------------------------------------------------ */
  /*  Simulation physique                                                */
  /* ------------------------------------------------------------------ */
  const sim = {
    wheelA: rand() * TAU,
    wheelW: 0.4,
    wheelTarget: 0.4,
    boostT: 0,
    timeScale: 1,
    t: 0,
    ball: {
      phase: "settled",
      a: 0, w: 0, r: REST_R, vr: 0, z: 0, vz: 0,
      phi: Math.floor(rand() * N) * STEP, relW: 0,
      fallW: 4, fallT: 0, lastDefl: -1, pocketT: 0, launchT: 0, launchR: REST_R,
    },
    winIndex: -1,
    glow: 0,
    onSettle: null,
  };
  sim.winIndex = mod(Math.round(sim.ball.phi / STEP), N);

  function mod(a, n) { return ((a % n) + n) % n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function normAngle(a) { a = mod(a + Math.PI, TAU); return a - Math.PI; }

  function launchBall() {
    const b = sim.ball;
    b.a = sim.wheelA + BASE + b.phi; // position absolue actuelle
    b.phase = "launch";
    b.launchT = 0;
    b.launchR = b.r;
    b.w = sim.wheelW;
    b.targetW = -randRange(12.8, 15.6);
    b.fallW = randRange(3.7, 4.5);
    b.vr = 0; b.z = 0; b.vz = 0;
    b.lastDefl = -1;
    sim.wheelTarget = randRange(2.1, 2.9);
    sim.boostT = 1.0;
    sim.winIndex = -1;
    sim.glow = 0;
    Sound.whoosh();
  }

  function step(h) {
    sim.t += h;
    // Cylindre : relancé par le croupier puis ralentit doucement
    if (sim.boostT > 0) {
      sim.boostT -= h;
      sim.wheelW += (sim.wheelTarget - sim.wheelW) * Math.min(1, 3.2 * h);
    } else if (sim.wheelW > 0.38) {
      sim.wheelW -= 0.045 * h;
    }
    sim.wheelA = mod(sim.wheelA + sim.wheelW * h, TAU);

    const b = sim.ball;
    switch (b.phase) {
      case "launch": {
        b.launchT += h;
        const k = clamp(b.launchT / 0.45, 0, 1);
        const e = 1 - Math.pow(1 - k, 3);
        b.r = b.launchR + (TRACK_R - b.launchR) * e;
        b.z = Math.sin(Math.PI * k) * 45;
        b.w += (b.targetW - b.w) * Math.min(1, 6 * h);
        b.a += b.w * h;
        if (k >= 1) { b.phase = "track"; b.z = 0; b.w = b.targetW; }
        break;
      }
      case "track": {
        const W = Math.abs(b.w);
        b.w += (0.55 + 0.012 * W * W) * h; // b.w < 0 : décélération
        b.a += b.w * h;
        b.r = TRACK_R + Math.sin(sim.t * 23) * 0.4;
        if (Math.abs(b.w) < b.fallW) { b.phase = "fall"; b.vr = 0; b.fallT = 0; }
        break;
      }
      case "fall": {
        let W = Math.abs(b.w);
        b.w += Math.sign(-b.w) * (0.4 + 0.01 * W * W) * h;
        if (b.r < R.wheelOuter) b.w += (sim.wheelW - b.w) * 1.5 * h; // friction sur la bande des numéros
        W = Math.abs(b.w);
        let ar = -440 + 13 * W * W;
        b.vr += ar * h;
        b.r += b.vr * h;
        if (b.r > TRACK_R) { b.r = TRACK_R; b.vr = Math.min(0, b.vr); }
        verticalStep(b, h, 1400);
        b.a += b.w * h;
        // Collision avec un losange
        b.fallT += h;
        if (Math.abs(b.r - DEFLECT_R) < 13 && b.vr < 0 && sim.t - b.lastDefl > 0.25 && b.z < 6 && b.fallT < 5) {
          const k = Math.round((b.a - Math.PI / 8) / (Math.PI / 4));
          const d = normAngle(b.a - (Math.PI / 8 + (k * Math.PI) / 4));
          if (Math.abs(d) < 0.075) {
            const impact = Math.min(1, Math.abs(b.vr) / 250);
            b.vr = Math.abs(b.vr) * randRange(0.25, 0.5) + randRange(40, 110);
            // le losange dévie la bille latéralement (jamais immobile dessus)
            const away = Math.sign(d) || (rand() < 0.5 ? -1 : 1);
            b.w = b.w * randRange(0.55, 0.85) + away * randRange(0.6, 1.4);
            b.vz = randRange(140, 250);
            b.lastDefl = sim.t;
            Sound.clack(0.25 + impact * 0.5);
          }
        }
        if (b.r <= R.numInner) {
          b.phase = "pocket";
          b.phi = b.a - sim.wheelA - BASE;
          b.relW = b.w - sim.wheelW;
          b.z = Math.max(b.z, 7);
          b.vz = Math.max(b.vz, 70);
          b.pocketT = 0;
          Sound.drop();
        }
        break;
      }
      case "pocket":
        pocketStep(b, h);
        break;
      case "settled": {
        const center = Math.round(b.phi / STEP) * STEP;
        b.phi += (center - b.phi) * Math.min(1, 6 * h);
        b.r += (REST_R - b.r) * Math.min(1, 6 * h);
        b.z = 0;
        b.relW = 0;
        break;
      }
    }
    if (b.phase === "pocket" || b.phase === "settled") {
      b.a = sim.wheelA + BASE + b.phi;
      b.w = sim.wheelW + b.relW;
    }
    if (sim.winIndex >= 0) sim.glow = Math.min(1, sim.glow + h * 1.5);
  }

  function verticalStep(b, h, g) {
    if (b.z > 0 || b.vz > 0) {
      b.vz -= g * h;
      b.z += b.vz * h;
      if (b.z <= 0) {
        b.z = 0;
        if (b.vz < -90) { Sound.tick(Math.min(0.35, -b.vz / 900)); b.vz = -b.vz * 0.32; }
        else b.vz = 0;
      }
    }
  }

  function pocketStep(b, h) {
    b.pocketT += h;
    // Ressort radial : la bille glisse vers le fond de la case
    b.vr += (-(b.r - REST_R) * 140 - b.vr * 9) * h;
    b.r = clamp(b.r + b.vr * h, R.pocketInner + BALL_R, R.numInner + 4);
    verticalStep(b, h, 1500);

    const airborne = b.z > 0.01;
    const idx0 = Math.round(b.phi / STEP);
    const d = b.phi - idx0 * STEP;
    if (airborne) {
      b.relW *= 1 - 0.25 * h;
    } else {
      b.relW *= 1 - 2.4 * h; // frottement de roulement
      b.relW -= 60 * d * h;  // le fond de la case est légèrement concave
    }
    b.phi += b.relW * h;
    const idx1 = Math.round(b.phi / STEP);

    if (idx1 !== idx0 && b.z < FRET_H) {
      const dir = Math.sign(idx1 - idx0);
      const speed = Math.abs(b.relW);
      const pOver = clamp((speed - 1.2) / 5, 0, 0.72);
      if (rand() < pOver) {
        // La bille saute par-dessus la frette
        b.relW *= randRange(0.45, 0.72);
        b.vz = Math.max(b.vz, randRange(110, 110 + speed * 45));
        b.z = Math.max(b.z, FRET_H + 0.5);
      } else {
        // Rebond contre la frette
        b.phi = (idx0 + dir * 0.5) * STEP - dir * 0.0008;
        b.relW = -b.relW * randRange(0.22, 0.48);
        b.vz = Math.max(b.vz, Math.min(270, speed * randRange(16, 50)));
      }
      b.vr += randRange(-90, 90) * Math.min(1, speed / 3);
      Sound.tick(0.08 + Math.min(0.5, speed * 0.09));
    }

    const dd = b.phi - Math.round(b.phi / STEP) * STEP;
    const calm = !airborne && Math.abs(b.relW) < 0.07 && Math.abs(dd) < 0.015 && Math.abs(b.vr) < 15;
    if (calm || b.pocketT > 9) {
      b.phase = "settled";
      b.z = 0; b.vz = 0;
      sim.winIndex = mod(Math.round(b.phi / STEP), N);
      sim.glow = 0;
      if (sim.onSettle) { const fn = sim.onSettle; sim.onSettle = null; fn(ORDER[sim.winIndex]); }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */
  function render() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(bowl, 0, 0);

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(sim.wheelA);
    ctx.drawImage(wheelLayer, -CX, -CY);
    // Lueur de la case gagnante
    if (sim.winIndex >= 0 && sim.glow > 0) {
      const a = BASE + sim.winIndex * STEP;
      const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 260);
      ctx.globalAlpha = sim.glow * (0.45 + 0.35 * pulse);
      ctx.beginPath();
      ctx.arc(0, 0, R.numOuter, a - STEP / 2, a + STEP / 2);
      ctx.arc(0, 0, R.pocketInner, a + STEP / 2, a - STEP / 2, true);
      ctx.closePath();
      ctx.fillStyle = "#fff3c4";
      ctx.shadowColor = "#f6dc8a"; ctx.shadowBlur = 30;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.drawImage(light, 0, 0);
    drawBall();
  }

  function drawBall() {
    const b = sim.ball;
    const x = CX + Math.cos(b.a) * b.r;
    const y = CY + Math.sin(b.a) * b.r;
    const s = 1 + b.z / 70;
    const r = BALL_R * s;

    // Traînée de mouvement quand la bille va vite
    const speed = Math.abs(b.w) * b.r; // px/s
    if (speed > 900) {
      const n = 7;
      for (let i = n; i >= 1; i--) {
        const aa = b.a - b.w * i * 0.0045;
        const tx = CX + Math.cos(aa) * b.r, ty = CY + Math.sin(aa) * b.r;
        ctx.beginPath(); ctx.arc(tx, ty, r * (1 - i * 0.06), 0, TAU);
        ctx.fillStyle = `rgba(255,255,255,${0.11 * (1 - i / (n + 1)) * Math.min(1, (speed - 900) / 2500)})`;
        ctx.fill();
      }
    }
    // Ombre portée (s'éloigne quand la bille saute)
    const sx = x + 3 + b.z * 0.55, sy = y + 5 + b.z * 0.75;
    const sh = ctx.createRadialGradient(sx, sy, 0, sx, sy, BALL_R * (1.5 + b.z / 50));
    sh.addColorStop(0, `rgba(0,0,0,${0.55 - Math.min(0.3, b.z / 120)})`);
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.arc(sx, sy, BALL_R * (1.5 + b.z / 50), 0, TAU); ctx.fill();
    // Bille en résine ivoire
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#f4f3ef");
    g.addColorStop(0.78, "#c4c3bd");
    g.addColorStop(1, "#7d7c77");
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.4, r * 0.22, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
  }

  /* ---------- Boucle principale ---------- */
  let last = performance.now();
  function frame(now) {
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    dt *= sim.timeScale;
    const sub = Math.ceil(dt / (1 / 480));
    const h = dt / sub;
    for (let i = 0; i < sub; i++) step(h);
    updateRollSound();
    render();
    requestAnimationFrame(frame);
  }

  function updateRollSound() {
    const b = sim.ball;
    if (b.phase === "track" || b.phase === "launch") {
      const W = Math.abs(b.w);
      Sound.setRoll(0.25 + Math.min(1, W / 15) * 0.75, Math.min(1, W / 15));
    } else if (b.phase === "fall") {
      Sound.setRoll(b.z > 1 ? 0.1 : 0.45, 0.25);
    } else if (b.phase === "pocket") {
      Sound.setRoll(b.z < 0.5 && Math.abs(b.relW) > 0.3 ? 0.25 : 0.05, 0.6);
    } else {
      Sound.setRoll(0, 0);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Tapis de jeu                                                       */
  /* ------------------------------------------------------------------ */
  const TW = 14, TH = 4.6; // unités de la table
  const tableEl = document.getElementById("rtable");
  const cellLayer = document.createElement("div");
  const hotLayer = document.createElement("div"); hotLayer.className = "hot-layer";
  const chipLayer = document.createElement("div"); chipLayer.className = "chip-layer";
  tableEl.append(cellLayer, hotLayer, chipLayer);

  const pct = (x, total) => (x / total) * 100 + "%";
  function place(el, x, y, w, h) {
    el.style.left = pct(x, TW); el.style.top = pct(y, TH);
    el.style.width = pct(w, TW); el.style.height = pct(h, TH);
  }
  const numCol = (n) => Math.floor((n - 1) / 3);
  const numRow = (n) => 2 - ((n - 1) % 3);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  const numCells = new Map();
  function addCell(cls, x, y, w, h, html, nums) {
    const d = document.createElement("div");
    d.className = "rcell " + cls;
    place(d, x, y, w, h);
    d.innerHTML = html;
    cellLayer.appendChild(d);
    if (nums) d.dataset.nums = nums.join(",");
    return d;
  }
  numCells.set(0, addCell("zero", 0, 0, 1, 3, "<span>0</span>"));
  for (let n = 1; n <= 36; n++) {
    numCells.set(n, addCell("num " + colorOf(n), 1 + numCol(n), numRow(n), 1, 1, `<span>${n}</span>`));
  }
  const colNums = (r) => range(1, 36).filter((n) => n % 3 === r);
  const outside = [
    { label: "2 à 1", nums: colNums(0), x: 13, y: 0, w: 1, h: 1, name: "Colonne 3" },
    { label: "2 à 1", nums: colNums(2), x: 13, y: 1, w: 1, h: 1, name: "Colonne 2" },
    { label: "2 à 1", nums: colNums(1), x: 13, y: 2, w: 1, h: 1, name: "Colonne 1" },
    { label: "1<sup>re</sup> 12", nums: range(1, 12), x: 1, y: 3, w: 4, h: 0.8, name: "1re douzaine" },
    { label: "2<sup>e</sup> 12", nums: range(13, 24), x: 5, y: 3, w: 4, h: 0.8, name: "2e douzaine" },
    { label: "3<sup>e</sup> 12", nums: range(25, 36), x: 9, y: 3, w: 4, h: 0.8, name: "3e douzaine" },
    { label: "1 – 18", nums: range(1, 18), x: 1, y: 3.8, w: 2, h: 0.8, name: "Manque (1–18)" },
    { label: "Pair", nums: range(1, 36).filter((n) => n % 2 === 0), x: 3, y: 3.8, w: 2, h: 0.8, name: "Pair" },
    { label: '<i class="diamond red"></i>', nums: range(1, 36).filter((n) => RED.has(n)), x: 5, y: 3.8, w: 2, h: 0.8, name: "Rouge" },
    { label: '<i class="diamond black"></i>', nums: range(1, 36).filter((n) => !RED.has(n)), x: 7, y: 3.8, w: 2, h: 0.8, name: "Noir" },
    { label: "Impair", nums: range(1, 36).filter((n) => n % 2 === 1), x: 9, y: 3.8, w: 2, h: 0.8, name: "Impair" },
    { label: "19 – 36", nums: range(19, 36), x: 11, y: 3.8, w: 2, h: 0.8, name: "Passe (19–36)" },
  ];
  const outsideCells = new Map();
  outside.forEach((o) => outsideCells.set(keyOf(o.nums), addCell("out", o.x, o.y, o.w, o.h, `<span>${o.label}</span>`)));

  function keyOf(nums) { return nums.slice().sort((a, b) => a - b).join("-"); }

  /* ---------- Zones de mise ---------- */
  const spots = new Map(); // key -> {key, nums, cx, cy, name}
  function addSpot(nums, x, y, w, h, z, name) {
    const key = keyOf(nums);
    const spot = { key, nums: nums.slice().sort((a, b) => a - b), cx: x + w / 2, cy: y + h / 2, name };
    spots.set(key, spot);
    const el = document.createElement("div");
    el.className = "hs" + (z > 1 ? " z" + z : "");
    place(el, x, y, w, h);
    el.dataset.key = key;
    hotLayer.appendChild(el);
    return spot;
  }
  const T = 0.16; // demi-épaisseur des zones de ligne
  // Pleins
  addSpot([0], 0, 0, 1, 3, 1, "Plein 0");
  for (let n = 1; n <= 36; n++) addSpot([n], 1 + numCol(n), numRow(n), 1, 1, 1, "Plein " + n);
  // Chevaux horizontaux (n / n+3)
  for (let n = 1; n <= 33; n++) addSpot([n, n + 3], 1 + numCol(n) + 1 - T, numRow(n) + 0.2, 2 * T, 0.6, 2, `Cheval ${n}/${n + 3}`);
  // Chevaux verticaux (n / n+1)
  for (let n = 1; n <= 36; n++) if (n % 3 !== 0) addSpot([n, n + 1], 1 + numCol(n) + 0.2, numRow(n) - T, 0.6, 2 * T, 2, `Cheval ${n}/${n + 1}`);
  // Carrés
  for (let n = 1; n <= 33; n++) if (n % 3 !== 0) addSpot([n, n + 1, n + 3, n + 4], 1 + numCol(n) + 1 - T, numRow(n) - T, 2 * T, 2 * T, 3, `Carré ${n}/${n + 1}/${n + 3}/${n + 4}`);
  // Transversales
  for (let c = 0; c < 12; c++) addSpot([3 * c + 1, 3 * c + 2, 3 * c + 3], 1 + c + 0.2, 3 - T, 0.6, 2 * T, 2, `Transversale ${3 * c + 1}–${3 * c + 3}`);
  // Sixains
  for (let c = 0; c < 11; c++) addSpot(range(3 * c + 1, 3 * c + 6), 1 + c + 1 - T, 3 - T, 2 * T, 2 * T, 3, `Sixain ${3 * c + 1}–${3 * c + 6}`);
  // Chevaux avec le zéro, transversales 0-1-2 / 0-2-3, carré 0-1-2-3
  [1, 2, 3].forEach((n) => addSpot([0, n], 1 - T, numRow(n) + 0.2, 2 * T, 0.6, 2, `Cheval 0/${n}`));
  addSpot([0, 1, 2], 1 - T, 2 - T, 2 * T, 2 * T, 3, "Transversale 0/1/2");
  addSpot([0, 2, 3], 1 - T, 1 - T, 2 * T, 2 * T, 3, "Transversale 0/2/3");
  addSpot([0, 1, 2, 3], 1 - T, 3 - T, 2 * T, 2 * T, 3, "Carré 0/1/2/3");
  // Chances simples, douzaines, colonnes
  outside.forEach((o) => addSpot(o.nums, o.x, o.y, o.w, o.h, 1, o.name));

  /* ------------------------------------------------------------------ */
  /*  Mises                                                              */
  /* ------------------------------------------------------------------ */
  const bets = new Map(); // key -> montant
  const history = [];     // pile d'annulation : [[key, delta], ...]
  let lastRoundBets = null;
  let state = "betting";  // betting | spinning | result
  let chip = 25;
  const chipEls = new Map();

  const totalBet = () => { let s = 0; bets.forEach((v) => (s += v)); return s; };

  function applyAction(changes, record = true) {
    // changes: [[key, delta]]
    const cost = changes.reduce((s, [, d]) => s + d, 0);
    if (cost > 0 && !Wallet.canAfford(cost)) {
      Casino.toast("Solde insuffisant pour cette mise");
      return false;
    }
    changes.forEach(([key, d]) => {
      const v = (bets.get(key) || 0) + d;
      if (v <= 0.0001) bets.delete(key); else bets.set(key, v);
    });
    Wallet.add(-cost);
    if (record) history.push(changes);
    renderChips();
    updateKpis();
    return true;
  }

  function canBet() {
    if (state === "result") finishRound(); // on peut miser dès l'affichage du résultat
    return state === "betting";
  }

  function addBet(key, amount = chip) {
    if (!canBet()) return;
    if (applyAction([[key, amount]])) Sound.chip();
  }
  function removeBet(key) {
    if (!canBet()) return;
    const cur = bets.get(key);
    if (!cur) return;
    const d = Math.min(cur, chip);
    applyAction([[key, -d]]);
    Sound.click();
  }

  function renderChips() {
    // retire les jetons disparus
    chipEls.forEach((el, key) => { if (!bets.has(key)) { el.remove(); chipEls.delete(key); } });
    bets.forEach((amount, key) => {
      const spot = spots.get(key);
      let el = chipEls.get(key);
      if (!el) {
        el = chipEl(amount);
        el.classList.add("bet-chip");
        el.style.left = pct(spot.cx, TW);
        el.style.top = pct(spot.cy, TH);
        chipLayer.appendChild(el);
        chipEls.set(key, el);
      }
      const v = Casino.chipValueFor(amount);
      el.dataset.v = String(v);
      el.dataset.stack = String(Math.min(2, Math.ceil(amount / v) - 1));
      el.querySelector("span").textContent = short(amount);
    });
  }

  /* ---------- Interaction table ---------- */
  const tip = document.getElementById("tip");
  let hlKeys = [];
  function highlight(nums) {
    clearHighlight();
    nums.forEach((n) => { const c = numCells.get(n); if (c) { c.classList.add("hl"); hlKeys.push(c); } });
  }
  function clearHighlight() { hlKeys.forEach((c) => c.classList.remove("hl")); hlKeys = []; }

  function spotPayout(nums) { return 36 / nums.length - 1; }

  hotLayer.addEventListener("pointerover", (e) => {
    const k = e.target.dataset.key;
    if (!k) return;
    const s = spots.get(k);
    highlight(s.nums);
    const oc = outsideCells.get(k);
    if (oc) { oc.classList.add("hl"); hlKeys.push(oc); }
    tip.innerHTML = `${s.name} · <b>${spotPayout(s.nums)} : 1</b>${bets.get(k) ? ` · mise ${fmt(bets.get(k))}` : ""}`;
    tip.classList.add("show");
  });
  hotLayer.addEventListener("pointermove", (e) => {
    tip.style.left = e.clientX + "px";
    tip.style.top = e.clientY + "px";
  });
  hotLayer.addEventListener("pointerleave", () => { clearHighlight(); tip.classList.remove("show"); });
  hotLayer.addEventListener("pointerout", (e) => { if (!e.relatedTarget || !e.relatedTarget.dataset || !e.relatedTarget.dataset.key) { clearHighlight(); tip.classList.remove("show"); } });

  let longPressT = null, longPressed = false;
  hotLayer.addEventListener("pointerdown", (e) => {
    const k = e.target.dataset.key;
    if (!k || e.pointerType !== "touch") return;
    longPressed = false;
    longPressT = setTimeout(() => { longPressed = true; removeBet(k); }, 500);
  });
  ["pointerup", "pointercancel"].forEach((ev) => hotLayer.addEventListener(ev, () => clearTimeout(longPressT)));
  hotLayer.addEventListener("click", (e) => {
    const k = e.target.dataset.key;
    if (!k) return;
    if (longPressed) { longPressed = false; return; }
    addBet(k);
    tip.innerHTML = `${spots.get(k).name} · <b>${spotPayout(spots.get(k).nums)} : 1</b> · mise ${fmt(bets.get(k) || 0)}`;
  });
  hotLayer.addEventListener("contextmenu", (e) => {
    const k = e.target.dataset.key;
    if (!k) return;
    e.preventDefault();
    removeBet(k);
  });

  /* ------------------------------------------------------------------ */
  /*  Racetrack (cylindre ovale) & annonces                              */
  /* ------------------------------------------------------------------ */
  const svg = document.getElementById("racetrack");
  const SVGNS = "http://www.w3.org/2000/svg";
  const RT = { cxL: 140, cxR: 860, cy: 125, Ro: 112, Ri: 50 };
  const L = RT.cxR - RT.cxL;
  const P = 2 * L + 2 * Math.PI * RT.Ro;
  const uZero = (L + (Math.PI * RT.Ro) / 2) / P;
  let neighbours = 2;

  function rtPoint(u, rad) {
    u = mod(u, 1);
    let s = u * P;
    const arc = Math.PI * RT.Ro;
    if (s < L) return [RT.cxL + s, RT.cy - rad];
    s -= L;
    if (s < arc) { const a = -Math.PI / 2 + s / RT.Ro; return [RT.cxR + Math.cos(a) * rad, RT.cy + Math.sin(a) * rad]; }
    s -= arc;
    if (s < L) return [RT.cxR - s, RT.cy + rad];
    s -= L;
    const a = Math.PI / 2 + s / RT.Ro;
    return [RT.cxL + Math.cos(a) * rad, RT.cy + Math.sin(a) * rad];
  }
  const uOf = (k) => uZero + k / N;

  const rtCells = [];
  const rtGroup = document.createElementNS(SVGNS, "g");
  for (let k = 0; k < N; k++) {
    const n = ORDER[k];
    const pts = [];
    const u0 = uOf(k - 0.5), u1 = uOf(k + 0.5);
    for (let j = 0; j <= 6; j++) pts.push(rtPoint(u0 + ((u1 - u0) * j) / 6, RT.Ro));
    for (let j = 6; j >= 0; j--) pts.push(rtPoint(u0 + ((u1 - u0) * j) / 6, RT.Ri + 0));
    const poly = document.createElementNS(SVGNS, "polygon");
    poly.setAttribute("points", pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "));
    poly.setAttribute("class", "rt-cell " + colorOf(n));
    poly.dataset.k = String(k);
    rtGroup.appendChild(poly);
    const [tx, ty] = rtPoint(uOf(k), (RT.Ro + RT.Ri) / 2 + 0);
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", tx.toFixed(1)); t.setAttribute("y", ty.toFixed(1));
    t.textContent = String(n);
    rtGroup.appendChild(t);
    rtCells.push(poly);
  }
  // On remplace l'anneau intérieur par des sections cliquables
  const xAt = (k) => rtPoint(uOf(k), (RT.Ro + RT.Ri) / 2)[0];
  const xTO = (xAt(10.5) + xAt(22.5)) / 2;
  const xOV = (xAt(7.5) + xAt(27.5)) / 2;
  const xVZ = (xAt(2.5) + xAt(32.5)) / 2;
  const defs = document.createElementNS(SVGNS, "defs");
  const clip = document.createElementNS(SVGNS, "clipPath");
  clip.id = "rtInner";
  const innerPath = document.createElementNS(SVGNS, "path");
  const ri = RT.Ri;
  innerPath.setAttribute("d", `M${RT.cxL},${RT.cy - ri} H${RT.cxR} A${ri},${ri} 0 0 1 ${RT.cxR},${RT.cy + ri} H${RT.cxL} A${ri},${ri} 0 0 1 ${RT.cxL},${RT.cy - ri} Z`);
  clip.appendChild(innerPath); defs.appendChild(clip); svg.appendChild(defs);

  const ANNOUNCES = {
    tiers: { name: "Tiers du cylindre", bets: [[5, 8], [10, 11], [13, 16], [23, 24], [27, 30], [33, 36]].map((b) => [b, 1]) },
    orphelins: { name: "Orphelins", bets: [[1], [6, 9], [14, 17], [17, 20], [31, 34]].map((b) => [b, 1]) },
    voisins: { name: "Voisins du zéro", bets: [[[0, 2, 3], 2], [[4, 7], 1], [[12, 15], 1], [[18, 21], 1], [[19, 22], 1], [[32, 35], 1], [[25, 26, 28, 29], 2]] },
    zero: { name: "Jeu zéro", bets: [[[0, 3], 1], [[12, 15], 1], [[26], 1], [[32, 35], 1]] },
  };
  const secs = [
    { id: "tiers", x0: RT.cxL - ri - 2, x1: xTO, label: "TIERS" },
    { id: "orphelins", x0: xTO, x1: xOV, label: "ORPHELINS" },
    { id: "voisins", x0: xOV, x1: xVZ, label: "VOISINS" },
    { id: "zero", x0: xVZ, x1: RT.cxR + ri + 2, label: "ZÉRO" },
  ];
  const secG = document.createElementNS(SVGNS, "g");
  secG.setAttribute("clip-path", "url(#rtInner)");
  secs.forEach((s) => {
    const r = document.createElementNS(SVGNS, "rect");
    r.setAttribute("x", s.x0); r.setAttribute("y", RT.cy - ri);
    r.setAttribute("width", s.x1 - s.x0); r.setAttribute("height", ri * 2);
    r.setAttribute("class", "rt-sec");
    r.dataset.sec = s.id;
    secG.appendChild(r);
  });
  svg.appendChild(secG);
  secs.forEach((s) => {
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", ((s.x0 + s.x1) / 2).toFixed(1)); t.setAttribute("y", RT.cy);
    t.setAttribute("class", "rt-label");
    t.textContent = s.label;
    svg.appendChild(t);
  });
  svg.appendChild(rtGroup);

  const announceNums = (id) => [...new Set(ANNOUNCES[id].bets.flatMap(([nums]) => nums))];
  function neighbourNums(k) {
    const out = [];
    for (let i = -neighbours; i <= neighbours; i++) out.push(ORDER[mod(k + i, N)]);
    return out;
  }
  function rtHighlight(nums) {
    rtCells.forEach((c) => c.classList.toggle("hl", nums.includes(ORDER[+c.dataset.k])));
    highlight(nums);
  }
  svg.addEventListener("pointerover", (e) => {
    const t = e.target;
    let nums = null, label = "";
    if (t.dataset.k) { const k = +t.dataset.k; nums = neighbourNums(k); label = `${ORDER[k]} et ses voisins (${nums.length} pleins)`; }
    else if (t.dataset.sec) {
      nums = announceNums(t.dataset.sec);
      const units = ANNOUNCES[t.dataset.sec].bets.reduce((s, [, u]) => s + u, 0);
      label = `${ANNOUNCES[t.dataset.sec].name} · ${units} jetons`;
    }
    if (nums) { rtHighlight(nums); tip.innerHTML = label + ` · <b>${fmt(chip)}</b> / jeton`; tip.classList.add("show"); }
  });
  svg.addEventListener("pointermove", (e) => { tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px"; });
  svg.addEventListener("pointerleave", () => { rtHighlight([]); clearHighlight(); tip.classList.remove("show"); });
  svg.addEventListener("click", (e) => {
    const t = e.target;
    let changes = null;
    if (t.dataset.k) changes = neighbourNums(+t.dataset.k).map((n) => [keyOf([n]), chip]);
    else if (t.dataset.sec) changes = ANNOUNCES[t.dataset.sec].bets.map(([nums, u]) => [keyOf(nums), chip * u]);
    if (!changes || !canBet()) return;
    // regroupe les doublons (ex. 17 dans les orphelins)
    const merged = new Map();
    changes.forEach(([k, d]) => merged.set(k, (merged.get(k) || 0) + d));
    if (applyAction([...merged.entries()])) Sound.chip();
  });
  document.querySelectorAll("[data-nb]").forEach((b) => b.addEventListener("click", () => {
    neighbours = +b.dataset.nb;
    document.querySelectorAll("[data-nb]").forEach((o) => o.classList.toggle("on", o === b));
  }));

  /* ------------------------------------------------------------------ */
  /*  Statistiques & historique                                          */
  /* ------------------------------------------------------------------ */
  const HIST_KEY = "velours.roulette.history.v1";
  let results = [];
  try { results = JSON.parse(localStorage.getItem(HIST_KEY) || "[]").filter((n) => Number.isInteger(n) && n >= 0 && n <= 36); } catch (e) { results = []; }

  function pill(n) { return `<div class="hpill c-${colorOf(n)}">${n}</div>`; }
  function renderStats() {
    document.getElementById("history").innerHTML = results.slice(0, 16).map(pill).join("") || '<span class="muted" style="font-size:.85rem">Aucun tirage pour le moment</span>';
    document.getElementById("spinCount").textContent = results.length ? `${results.length} tirage${results.length > 1 ? "s" : ""}` : "";
    const tot = results.length || 1;
    const cnt = (f) => results.filter(f).length;
    const red = cnt((n) => RED.has(n)), zero = cnt((n) => n === 0), black = results.length - red - zero;
    const even = cnt((n) => n && n % 2 === 0), odd = cnt((n) => n % 2 === 1);
    const low = cnt((n) => n >= 1 && n <= 18), high = cnt((n) => n >= 19);
    const seg = (cls, v, label) => `<div class="${cls}" style="flex-grow:${results.length ? v : 1}">${results.length && v ? `${label} ${Math.round((v / tot) * 100)}%` : ""}</div>`;
    if (!results.length) {
      ["barColor", "barParity", "barHalf"].forEach((id) => (document.getElementById(id).innerHTML = '<div class="b-b" style="flex-grow:1"></div>'));
    } else {
    document.getElementById("barColor").innerHTML = seg("b-red", red, "Rouge") + seg("b-green", zero, "0") + seg("b-black", black, "Noir");
    document.getElementById("barParity").innerHTML = seg("b-a", even, "Pair") + seg("b-green", zero, "") + seg("b-b", odd, "Impair");
    document.getElementById("barHalf").innerHTML = seg("b-a", low, "1–18") + seg("b-green", zero, "") + seg("b-b", high, "19–36");
    }
    const freq = new Map(range(0, 36).map((n) => [n, 0]));
    results.slice(0, 200).forEach((n) => freq.set(n, freq.get(n) + 1));
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const hc = (list) => list.map(([n, c]) => `<div class="hpill c-${colorOf(n)}">${n}<sup>${c}</sup></div>`).join("");
    document.getElementById("hot").innerHTML = results.length ? hc(sorted.slice(0, 5)) : '<span class="muted" style="font-size:.8rem">—</span>';
    document.getElementById("cold").innerHTML = results.length ? hc(sorted.slice(-5).reverse()) : '<span class="muted" style="font-size:.8rem">—</span>';
  }
  renderStats();

  /* ------------------------------------------------------------------ */
  /*  Déroulement d'une partie                                           */
  /* ------------------------------------------------------------------ */
  const statusMsg = document.getElementById("statusMsg");
  const totalBetEl = document.getElementById("totalBet");
  const lastWinEl = document.getElementById("lastWin");
  const banner = document.getElementById("banner");
  const btnSpin = document.getElementById("btnSpin");
  const btnUndo = document.getElementById("btnUndo");
  const btnClear = document.getElementById("btnClear");
  const btnRebet = document.getElementById("btnRebet");
  const btnDouble = document.getElementById("btnDouble");
  let dolly = null;
  let winnerCell = null;

  function setStatus(msg, cls = "") { statusMsg.textContent = msg; statusMsg.className = "status-msg " + cls; }
  function updateKpis() {
    totalBetEl.textContent = fmt(totalBet());
    const betting = state !== "spinning";
    btnSpin.disabled = !betting || totalBet() <= 0;
    btnUndo.disabled = !betting || history.length === 0;
    btnClear.disabled = !betting || bets.size === 0;
    btnRebet.disabled = !betting || !lastRoundBets || bets.size > 0;
    btnDouble.disabled = !betting || bets.size === 0;
  }

  function showBanner(html, ms) {
    banner.innerHTML = html;
    banner.classList.add("show");
    if (ms) setTimeout(() => banner.classList.remove("show"), ms);
  }

  function spin() {
    if (state === "result") finishRound();
    if (state !== "betting" || totalBet() <= 0) return;
    state = "spinning";
    tableEl.classList.add("locked");
    lastRoundBets = new Map(bets);
    history.length = 0;
    btnSpin.classList.add("spinning");
    btnSpin.firstChild.textContent = "EN COURS ";
    setStatus("Rien ne va plus");
    showBanner("Rien ne va plus", 1600);
    Sound.bell();
    updateKpis();
    sim.onSettle = onResult;
    launchBall();
  }

  async function onResult(n) {
    // Gains : mise × (36 / nombre de numéros couverts), mise comprise
    let payout = 0;
    const winners = [];
    bets.forEach((amount, key) => {
      const s = spots.get(key);
      if (s.nums.includes(n)) {
        const win = amount * (36 / s.nums.length);
        payout += win;
        winners.push([key, win]);
      }
    });
    const staked = totalBet();
    results.unshift(n);
    results = results.slice(0, 500);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(results)); } catch (e) { /* ignore */ }
    renderStats();

    const parity = n === 0 ? "" : n % 2 ? " · Impair" : " · Pair";
    showBanner(`<span class="num c-${colorOf(n)}">${n}</span>${colorName(n)}${parity}`);
    setTimeout(() => banner.classList.remove("show"), 3200);

    winnerCell = numCells.get(n);
    winnerCell.classList.add("winner");
    dolly = document.createElement("div");
    dolly.className = "dolly";
    const ws = spots.get(String(n));
    dolly.style.left = pct(ws.cx, TW); dolly.style.top = pct(ws.cy, TH);
    chipLayer.appendChild(dolly);

    // Animation des jetons gagnants / perdants
    chipEls.forEach((el, key) => {
      if (winners.some(([k]) => k === key)) el.classList.add("win");
      else el.classList.add("lost");
    });
    winners.forEach(([key, win]) => {
      const s = spots.get(key);
      const pop = document.createElement("div");
      pop.className = "payout-pop";
      pop.textContent = "+" + fmt(win);
      pop.style.left = pct(s.cx, TW); pop.style.top = pct(s.cy, TH);
      chipLayer.appendChild(pop);
      setTimeout(() => pop.remove(), 2500);
    });

    if (payout > 0) {
      Wallet.add(payout);
      const net = payout - staked;
      setStatus(`${n} ${colorName(n)} — vous gagnez ${fmt(payout)}`, "win");
      lastWinEl.textContent = fmt(payout);
      lastWinEl.style.color = net >= 0 ? "var(--win)" : "var(--gold-2)";
      Sound.win(payout >= staked * 5);
    } else {
      setStatus(`${n} ${colorName(n)} — pas de gain cette fois`);
      lastWinEl.textContent = "0";
      lastWinEl.style.color = "var(--lose)";
      Sound.lose();
    }

    state = "result";
    btnSpin.classList.remove("spinning");
    btnSpin.firstChild.textContent = "LANCER ";
    tableEl.classList.remove("locked");
    updateKpis();
    await sleep(2600);
    if (state === "result") finishRound();
  }

  function finishRound() {
    if (state !== "result") return;
    state = "betting";
    bets.clear();
    history.length = 0;
    chipLayer.querySelectorAll(".bet-chip").forEach((el) => el.remove());
    chipEls.clear();
    if (winnerCell) { winnerCell.classList.remove("winner"); winnerCell = null; }
    if (dolly) { dolly.remove(); dolly = null; }
    renderChips();
    updateKpis();
    if (!statusMsg.classList.contains("win")) setStatus("Faites vos jeux");
    else setTimeout(() => { if (state === "betting" && bets.size === 0) setStatus("Faites vos jeux"); }, 1500);
  }

  function undo() {
    if (!canBet() || !history.length) return;
    const last = history.pop();
    applyAction(last.map(([k, d]) => [k, -d]), false);
    Sound.click();
  }
  function clearBets() {
    if (!canBet() || !bets.size) return;
    applyAction([...bets.entries()].map(([k, v]) => [k, -v]));
    Sound.click();
  }
  function rebet() {
    if (!canBet() || !lastRoundBets || bets.size) return;
    if (applyAction([...lastRoundBets.entries()])) Sound.chip();
  }
  function doubleBets() {
    if (!canBet() || !bets.size) return;
    if (applyAction([...bets.entries()])) Sound.chip();
  }

  btnSpin.addEventListener("click", spin);
  btnUndo.addEventListener("click", undo);
  btnClear.addEventListener("click", clearBets);
  btnRebet.addEventListener("click", rebet);
  btnDouble.addEventListener("click", doubleBets);
  window.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (e.code === "Space") { e.preventDefault(); spin(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  });

  Casino.mountHeader("roulette");
  Casino.canReset = () => state !== "spinning";
  Casino.mountChipTray(document.getElementById("chipTray"), [1, 5, 25, 100, 500, 1000], (v) => (chip = v), 25);

  // Vue 3D / dessus, vitesse
  const stage = document.getElementById("wheelStage");
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    stage.classList.toggle("tilted", b.dataset.view === "3d");
    document.querySelectorAll("[data-view]").forEach((o) => o.classList.toggle("on", o === b));
  }));
  document.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => {
    sim.timeScale = +b.dataset.speed;
    document.querySelectorAll("[data-speed]").forEach((o) => o.classList.toggle("on", o === b));
  }));

  // Les polices du canvas peuvent arriver après le premier rendu : on redessine les numéros
  if (document.fonts && document.fonts.load) {
    document.fonts.load("700 31px Cinzel").then(redrawNumbers).catch(() => {});
  }
  function redrawNumbers() {
    for (let i = 0; i < N; i++) {
      const n = ORDER[i];
      const a = BASE + i * STEP;
      const c = colorOf(n);
      const g1 = wg.createRadialGradient(CX, CY, R.numInner, CX, CY, R.numOuter);
      g1.addColorStop(0, SEG_FILL[c][1]); g1.addColorStop(1, SEG_FILL[c][0]);
      wg.beginPath();
      wg.arc(CX, CY, R.numOuter, a - STEP / 2 + 0.004, a + STEP / 2 - 0.004);
      wg.arc(CX, CY, R.numInner, a + STEP / 2 - 0.004, a - STEP / 2 + 0.004, true);
      wg.closePath(); wg.fillStyle = g1; wg.fill();
      wg.save();
      wg.translate(CX + Math.cos(a) * 281, CY + Math.sin(a) * 281);
      wg.rotate(a + Math.PI / 2);
      wg.fillStyle = "#fff";
      wg.font = "700 31px 'Cinzel', Georgia, serif";
      wg.textAlign = "center"; wg.textBaseline = "middle";
      wg.shadowColor = "rgba(0,0,0,0.6)"; wg.shadowBlur = 3;
      wg.fillText(String(n), 0, 1);
      wg.restore();
    }
  }

  updateKpis();
  requestAnimationFrame(frame);

  // Point d'accès de débogage / tests
  window.__roulette = { sim, spots, bets, ORDER, step, launchBall };
})();
