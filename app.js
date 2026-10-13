(() => {
  const SAVE_KEY = "mochi-save-v1";
  // Points lost per minute for each stat while awake.
  const DECAY = { hunger: 1.2, fun: 1.5, energy: 0.8, clean: 0.6 };
  const TICK_MS = 1000;

  const $ = (sel) => document.querySelector(sel);
  const cat = $("#cat");
  const stage = $("#stage");
  const bubble = $("#bubble");
  const laser = $("#laser");
  const nameInput = $("#catName");
  const soundBtn = $("#soundBtn");

  const defaults = {
    name: "Mochi",
    hunger: 80, fun: 80, energy: 80, clean: 90,
    xp: 0, level: 1,
    sleeping: false,
    sound: true,
    lastSeen: Date.now(),
  };

  let state = load();
  let busy = false;        // true while an action animation is running
  let happyTimer = null;
  let bubbleTimer = null;

  // ---------- persistence ----------
  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch {}
    const s = { ...defaults, ...(saved || {}) };
    // Catch up on time spent away (capped at 12h so nobody comes back to a tragedy).
    const minutesAway = Math.min((Date.now() - s.lastSeen) / 60000, 720);
    if (minutesAway > 1) applyDecay(s, minutesAway);
    return s;
  }

  function save() {
    state.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
  }

  // ---------- core loop ----------
  const clamp = (v) => Math.max(0, Math.min(100, v));

  function applyDecay(s, minutes) {
    for (const key of Object.keys(DECAY)) {
      if (s.sleeping && key === "energy") {
        s.energy = clamp(s.energy + 6 * minutes);
      } else {
        const rate = s.sleeping ? DECAY[key] * 0.4 : DECAY[key];
        s[key] = clamp(s[key] - rate * minutes);
      }
    }
    if (s.sleeping && s.energy >= 100) s.sleeping = false;
  }

  function tick() {
    const wasSleeping = state.sleeping;
    applyDecay(state, TICK_MS / 60000);
    if (wasSleeping && !state.sleeping) {
      say("☀️ fully recharged. let's GO");
      meow(1.2);
    }
    render();
    maybeComplain();
    save();
  }

  function addXp(amount) {
    state.xp += amount;
    const needed = xpForNext();
    if (state.xp >= needed) {
      state.xp -= needed;
      state.level++;
      const lvl = $("#level");
      lvl.classList.remove("pop");
      void lvl.offsetWidth;
      lvl.classList.add("pop");
      burst(["⭐", "✨", "🎉"], 8);
      say(`LEVEL ${state.level}!! i'm literally so powerful`);
      chime();
    }
  }

  const xpForNext = () => 40 + state.level * 20;

  // ---------- rendering ----------
  function render() {
    for (const el of document.querySelectorAll(".stat")) {
      const v = state[el.dataset.stat];
      const fill = el.querySelector(".fill");
      fill.style.width = v + "%";
      fill.classList.toggle("mid", v < 50 && v >= 25);
      fill.classList.toggle("low", v < 25);
    }
    $("#level").textContent = "Lv " + state.level;
    $("#xpFill").style.width = (state.xp / xpForNext()) * 100 + "%";
    $(".dirt").style.opacity = Math.max(0, (70 - state.clean) / 50);

    const sad = Math.min(state.hunger, state.fun, state.clean) < 25;
    cat.classList.toggle("sad", sad && !state.sleeping);
    cat.classList.toggle("sleeping", state.sleeping);
    document.body.classList.toggle("sleeping", state.sleeping);

    for (const btn of document.querySelectorAll(".actions button")) {
      const isNap = btn.dataset.action === "nap";
      btn.disabled = busy || (state.sleeping && !isNap);
      if (isNap) {
        btn.classList.toggle("on", state.sleeping);
        btn.lastChild.textContent = state.sleeping ? "Wake" : "Nap";
      }
    }
    soundBtn.textContent = state.sound ? "🔊" : "🔇";
  }

  // ---------- speech ----------
  function say(text, ms = 2600) {
    bubble.textContent = text;
    bubble.classList.remove("hide");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add("hide"), ms);
  }

  let lastComplaint = 0;
  function maybeComplain() {
    if (state.sleeping || busy || Date.now() - lastComplaint < 15000) return;
    const lines = [];
    if (state.hunger < 25) lines.push("i'm so hungry i could eat a whole sock", "FOOD. now. please. 🥺");
    if (state.fun < 25) lines.push("i'm bored... entertain me peasant", "play with meeee");
    if (state.energy < 20) lines.push("eepy... so eepy...", "nap time? nap time.");
    if (state.clean < 25) lines.push("ngl i'm kinda crusty rn", "i need a bath (don't tell anyone)");
    if (!lines.length) return;
    lastComplaint = Date.now();
    say(pick(lines), 3200);
    meow(0.8);
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- effects ----------
  function particle(emoji, x, y) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = emoji;
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
    stage.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }

  function burst(emojis, n) {
    const r = cat.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      setTimeout(() => particle(
        pick(emojis),
        r.left - s.left + 30 + Math.random() * (r.width - 60),
        r.top - s.top + 20 + Math.random() * 60
      ), i * 70);
    }
  }

  function animate(cls) {
    cat.classList.remove(cls);
    void cat.offsetWidth;
    cat.classList.add(cls);
    setTimeout(() => cat.classList.remove(cls), 600);
  }

  function beHappy(ms = 1500) {
    cat.classList.add("happy");
    clearTimeout(happyTimer);
    happyTimer = setTimeout(() => cat.classList.remove("happy"), ms);
  }

  // ---------- sound (tiny Web Audio synth, no files needed) ----------
  let audio = null;
  function ctx() {
    if (!state.sound) return null;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch { return null; }
    return audio;
  }

  function tone(freqs, dur, type = "sine", vol = 0.15) {
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], t);
    freqs.slice(1).forEach((f, i) =>
      osc.frequency.exponentialRampToValueAtTime(f, t + (dur * (i + 1)) / (freqs.length - 1)));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const meow = (pitch = 1) => tone([500 * pitch, 900 * pitch, 420 * pitch], 0.45, "triangle", 0.12);
  const chime = () => [660, 880, 1320].forEach((f, i) => setTimeout(() => tone([f, f], 0.25), i * 110));
  const blip = () => tone([900, 1400], 0.08, "square", 0.05);
  const purr = () => tone([38, 42, 38], 0.6, "sawtooth", 0.05);

  // ---------- actions ----------
  const actions = {
    feed() {
      busy = true;
      const food = document.createElement("div");
      food.className = "food";
      food.textContent = pick(["🐟", "🍣", "🍤", "🥛", "🍗"]);
      food.style.marginLeft = "70px";
      stage.appendChild(food);
      cat.style.left = "62%";
      setTimeout(() => {
        cat.classList.add("eating");
        say(pick(["nom nom nom", "omg this slaps", "5 stars, would eat again", "chef's kiss 🤌"]));
      }, 500);
      setTimeout(() => {
        food.remove();
        cat.classList.remove("eating");
        cat.style.left = "";
        state.hunger = clamp(state.hunger + 30);
        state.clean = clamp(state.clean - 4);
        addXp(8);
        beHappy();
        meow(1.1);
        busy = false;
        render();
      }, 2200);
      render();
    },

    play() {
      if (state.energy < 10) {
        say("too tired to chase lasers rn 😮‍💨");
        animate("wiggle");
        return;
      }
      busy = true;
      say("RED DOT. RED DOT. catch it!!", 2000);
      laser.hidden = false;
      let caught = 0;
      const moveLaser = () => {
        const w = stage.clientWidth, h = stage.clientHeight;
        const x = 30 + Math.random() * (w - 60);
        const y = 60 + Math.random() * (h - 120);
        laser.style.left = x + "px";
        laser.style.top = y + "px";
        // cat chases horizontally
        cat.style.left = Math.max(25, Math.min(75, (x / w) * 100)) + "%";
      };
      const onCatch = (e) => {
        e.stopPropagation();
        caught++;
        blip();
        particle(pick(["💥", "✨", "⭐"]), parseFloat(laser.style.left) - 12, parseFloat(laser.style.top) - 20);
        animate("bounce");
        moveLaser();
      };
      laser.addEventListener("pointerdown", onCatch);
      moveLaser();
      const mover = setInterval(moveLaser, 700);
      setTimeout(() => {
        clearInterval(mover);
        laser.removeEventListener("pointerdown", onCatch);
        laser.hidden = true;
        cat.style.left = "";
        state.fun = clamp(state.fun + 15 + caught * 4);
        state.energy = clamp(state.energy - 12);
        state.hunger = clamp(state.hunger - 5);
        addXp(5 + caught * 3);
        say(caught >= 5 ? `caught it ${caught} times. i am the apex predator` :
            caught > 0 ? `${caught} catch${caught > 1 ? "es" : ""}! not bad bestie` :
            "it got away... again 😔 (still fun tho)");
        beHappy();
        busy = false;
        render();
      }, 7000);
      render();
    },

    nap() {
      state.sleeping = !state.sleeping;
      if (state.sleeping) {
        say("goodnight bestie 💤");
        cat.classList.remove("happy", "sad");
      } else {
        say(state.energy < 60 ? "ugh... 5 more minutes 😾" : "good morning!! ☀️");
        animate("bounce");
        meow();
      }
      render();
      save();
    },

    bath() {
      busy = true;
      say(pick(["NOOOO not the water", "betrayal. pure betrayal", "fine. FINE. 😾"]));
      animate("wiggle");
      const shake = setInterval(() => { animate("wiggle"); burst(["🫧", "💧", "🫧"], 3); }, 500);
      setTimeout(() => {
        clearInterval(shake);
        state.clean = 100;
        state.fun = clamp(state.fun - 8);
        addXp(6);
        burst(["✨", "🌸"], 6);
        say("ok i'm sparkly now. you may admire me ✨");
        busy = false;
        render();
      }, 2200);
      render();
    },
  };

  // ---------- petting ----------
  let lastPet = 0;
  function pet(e) {
    if (busy) return;
    if (state.sleeping) {
      say("zzz... *mumbles* five more fish...");
      return;
    }
    const now = Date.now();
    if (now - lastPet < 120) return;
    lastPet = now;
    const s = stage.getBoundingClientRect();
    const x = (e.clientX ?? s.left + s.width / 2) - s.left;
    const y = (e.clientY ?? s.top + s.height / 2) - s.top;
    particle(pick(["💖", "💕", "💗", "😻"]), x - 12, y - 20);
    state.fun = clamp(state.fun + 2);
    addXp(1);
    beHappy();
    purr();
    if (Math.random() < 0.25) say(pick(["purrrrr", "more pets pls", "you're my favorite human", "*happy cat noises*", "ok this is elite"]));
    render();
  }

  // ---------- eyes follow pointer ----------
  function lookAt(x, y) {
    for (const pupil of document.querySelectorAll(".pupil")) {
      const eye = pupil.parentElement.getBoundingClientRect();
      const dx = x - (eye.left + eye.width / 2);
      const dy = y - (eye.top + eye.height / 2);
      const ang = Math.atan2(dy, dx);
      const dist = Math.min(7, Math.hypot(dx, dy) / 20);
      pupil.style.transform = `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px)`;
    }
  }

  // ---------- day / night ----------
  function updateSky() {
    const h = new Date().getHours();
    const night = h < 7 || h >= 19;
    document.body.classList.toggle("night", night);
    const sky = $("#sky");
    sky.querySelectorAll(".star").forEach((s) => s.remove());
    if (night) {
      for (let i = 0; i < 40; i++) {
        const st = document.createElement("div");
        st.className = "star";
        st.style.left = Math.random() * 100 + "%";
        st.style.top = Math.random() * 60 + "%";
        st.style.animationDelay = Math.random() * 3 + "s";
        sky.appendChild(st);
      }
    }
  }

  // ---------- wire up ----------
  document.querySelector(".actions").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;
    actions[btn.dataset.action]();
  });

  cat.addEventListener("pointerdown", pet);
  cat.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pet(e); }
  });
  document.addEventListener("pointermove", (e) => lookAt(e.clientX, e.clientY));

  nameInput.value = state.name;
  nameInput.addEventListener("input", () => {
    state.name = nameInput.value.trim() || "Mochi";
    save();
  });
  nameInput.addEventListener("change", () => say(`${state.name}? ok i love that for me`));

  soundBtn.addEventListener("click", () => {
    state.sound = !state.sound;
    render();
    save();
    if (state.sound) meow();
  });

  const tips = [
    "tip: pet them. pet them a lot.",
    "tip: catch the laser for bonus xp",
    "tip: your cat keeps living while you're away 👀",
    "tip: click the name to rename your cat",
    "tip: naps refill energy fast",
  ];
  let tipIdx = 0;
  setInterval(() => { $("#tip").textContent = tips[++tipIdx % tips.length]; }, 8000);

  updateSky();
  setInterval(updateSky, 5 * 60 * 1000);
  render();
  setTimeout(() => say(state.sleeping ? "zzz..." : pick([`hi bestie, it's me ${state.name}`, "you're back!! 😸", "missed u fr"])), 300);
  setInterval(tick, TICK_MS);
  window.addEventListener("beforeunload", save);
})();
