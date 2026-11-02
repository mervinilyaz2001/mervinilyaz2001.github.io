/* ============================================================
   YOUR DETAILS
   Edit these and the whole page updates. Anything still in
   [SQUARE BRACKETS] shows as a yellow highlighted placeholder
   until it's filled in. If your name or town change, also update
   the <title>, description and og: tags in index.html, which
   Google and link previews read before this script runs.
   ============================================================ */
const CONFIG = {
  name: "Mervin Ilyaz",
  firstName: "Mervin",
  town: "Dublin",
  email: "[YOUR EMAIL]",
  whatsappDisplay: "[YOUR WHATSAPP NUMBER]",   // how it's shown, e.g. "087 123 4567"
  whatsapp: "",                                // digits only with country code, no + or spaces, e.g. "353871234567"
  replyTime: "[REPLY TIME, e.g. within one working day]",
  photo: "",                                   // e.g. "images/mervin.jpg": a portrait (4:5) photo of you

  // FORM BACKEND: paste a Web3Forms access key here (free at web3forms.com, the same
  // service Settle in Ireland uses). While it's empty the form tells visitors to use
  // WhatsApp or email instead, so no enquiry is silently lost.
  web3formsKey: ""
};

const isPlaceholder = (v) => !v || /^\[.*\]$/.test(String(v).trim());
document.documentElement.classList.add("js");

/* ---------- fill in details ---------- */
document.querySelectorAll("[data-config]").forEach((el) => {
  const val = CONFIG[el.dataset.config];
  if (val === undefined) return;
  el.textContent = val;
  el.classList.toggle("todo", isPlaceholder(val));
});

const waLink = (text) =>
  CONFIG.whatsapp
    ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text || "")}`
    : "#contact";

document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = waLink(a.dataset.wa);
  if (CONFIG.whatsapp) { a.target = "_blank"; a.rel = "noopener"; }
});

document.querySelectorAll("[data-email]").forEach((a) => {
  if (isPlaceholder(CONFIG.email)) a.removeAttribute("href");
  else a.href = `mailto:${CONFIG.email}`;
});

/* ---------- photo: set CONFIG.photo and it replaces the placeholder ---------- */
const photoFig = document.querySelector(".about-photo");
if (photoFig && CONFIG.photo) {
  const img = new Image();
  img.onload = () => {
    img.alt = CONFIG.name;
    img.width = img.naturalWidth;
    img.height = img.naturalHeight;
    photoFig.replaceChildren(img);
    photoFig.classList.add("has-img");
  };
  img.src = CONFIG.photo;
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

/* ---------- header: border on scroll, mobile menu ---------- */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = document.getElementById("navToggle");
const setNav = (open) => {
  document.body.classList.toggle("nav-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Close" : "Menu";
};
toggle.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
document.querySelectorAll(".main-nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

/* ---------- floating WhatsApp tab: hidden at the very top and over the contact section ---------- */
const waFloat = document.querySelector(".wa-float");
const contact = document.getElementById("contact");
let overContact = false;
let nearTop = true;
const syncWa = () => { if (waFloat) waFloat.classList.toggle("hide", overContact || nearTop); };
if (waFloat && contact && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => { overContact = entry.isIntersecting; syncWa(); }, { threshold: 0.15 })
    .observe(contact);
}
const checkTop = () => { nearTop = window.scrollY < 360; syncWa(); };
checkTop();
window.addEventListener("scroll", checkTop, { passive: true });

/* ---------- contact form ---------- */
const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");
const setStatus = (msg, kind) => { status.textContent = msg; status.className = `form-status ${kind || ""}`; };

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const required = [...form.querySelectorAll("[required]")];
  required.forEach((f) => f.classList.toggle("invalid", !f.value.trim()));
  const firstEmpty = required.find((f) => !f.value.trim());
  if (firstEmpty) {
    setStatus("Please fill in the highlighted fields.", "err");
    firstEmpty.focus();
    return;
  }
  if (form.botcheck.checked) return;

  if (!CONFIG.web3formsKey) {
    setStatus("Sorry, this form isn't connected yet. Please message me on WhatsApp or by email instead.", "err");
    return;
  }

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  setStatus("Sending…");
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject: `New enquiry from your website: ${data.business}`,
        from_name: "Portfolio website",
        ...data
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    form.reset();
    setStatus("Thanks, your message is on its way. I'll be in touch soon.", "ok");
  } catch (err) {
    setStatus("Something went wrong sending that. Please try WhatsApp or email instead.", "err");
  } finally {
    btn.disabled = false;
  }
});
form.addEventListener("input", (e) => {
  if (e.target.classList.contains("invalid") && e.target.value.trim()) e.target.classList.remove("invalid");
});

/* ============================================================
   MOTION & INTERACTION
   Each feature runs on its own, so one failing never breaks the
   rest. With reduced motion switched on, the moving parts are skipped.
   ============================================================ */
(function () {
  const root = document.documentElement;
  const matches = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  const reduced = matches("(prefers-reduced-motion: reduce)");
  const fine = matches("(hover: hover) and (pointer: fine)");
  const hasIO = "IntersectionObserver" in window;
  if (reduced || !hasIO) root.classList.remove("motion");
  const motion = root.classList.contains("motion");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const feature = (name, fn) => {
    try { fn(); } catch (err) {
      console.warn("[" + name + "]", err);
      if (name === "reveal") root.classList.remove("motion");
    }
  };

  // lets :active styles show on tap in iOS Safari
  document.addEventListener("touchstart", () => {}, { passive: true });

  // wrap each word of an element; punctuation stays with the word before it
  function splitWords(el, make) {
    let prev = null;
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part, idx) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); prev = null; return; }
          if (idx === 0 && prev) { prev.inner.append(part); return; }
          const w = make(); w.inner.append(part); frag.append(w.outer); prev = w;
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const w = make(); node.before(w.outer); w.inner.append(node); prev = w;
      }
    });
  }

  /* 1. things rise into place as you reach them */
  feature("reveal", () => {
    if (!motion) return;
    const groups = [
      [".kicker, .section-intro, .sub-head, .familiar-group, .spec-list li, .try, .ad-wrap, .rewrite, .notes li, .core-item, .extras li, .job, .steps li, .promises li, .faq details, .skill-list li, .story div", "up"],
      [".hooklab, .breakdown-shot, .about-photo", "scale"],
      [".contact-form", "right"]
    ];
    const targets = [];
    groups.forEach(([sel, kind]) => $$(sel).forEach((el) => { el.dataset.reveal = kind; targets.push(el); }));
    const counts = new Map();
    targets.forEach((el) => {
      const i = counts.get(el.parentElement) || 0;
      counts.set(el.parentElement, i + 1);
      el.style.setProperty("--d", (Math.min(i, 6) * 0.08).toFixed(2) + "s");
    });
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    targets.forEach((el) => io.observe(el));

    $$("main h2").forEach((h) => {
      let i = 0;
      splitWords(h, () => {
        const outer = document.createElement("span"); outer.className = "w";
        const inner = document.createElement("span"); inner.className = "wi";
        inner.style.setProperty("--i", i++);
        outer.append(inner);
        return { outer, inner };
      });
      h.classList.add("split");
      io.observe(h);
    });

    $$(".hl").forEach((el) => { el.dataset.sweep = ""; io.observe(el); });
    const steps = $(".steps");
    if (steps) steps.dataset.live = "";
  });

  /* 2. hero: point at (or drag a finger over) the headline to highlight it */
  feature("hero", () => {
    const h1 = $(".hero h1");
    if (!h1) return;
    const words = [];
    $$(".h1-line", h1).forEach((line) => splitWords(line, () => {
      const s = document.createElement("span"); s.className = "hw"; words.push(s);
      return { outer: s, inner: s };
    }));
    const lite = (w) => {
      if (!w) return;
      w.classList.add("lit");
      clearTimeout(w._t);
      w._t = setTimeout(() => w.classList.remove("lit"), 1400);
    };
    words.forEach((w) => w.addEventListener("pointerenter", () => lite(w)));
    h1.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      const el = t && document.elementFromPoint(t.clientX, t.clientY);
      lite(el && el.closest(".hw"));
    }, { passive: true });
    // one sweep across the headline after it lands, as a hint that it reacts
    if (motion) setTimeout(() => words.forEach((w, i) => setTimeout(() => lite(w), i * 70)), 2300);

    if (!fine || reduced) return;
    const hero = $(".hero"), lines = $$(".h1-line", h1), note = $(".hero-note");
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      lines.forEach((l, i) => { l.style.translate = (-nx * (8 + i * 7)).toFixed(1) + "px " + (-ny * (4 + i * 3)).toFixed(1) + "px"; });
      if (note) note.style.translate = (-nx * 30).toFixed(1) + "px " + (-ny * 14).toFixed(1) + "px";
    });
    hero.addEventListener("pointerleave", () => {
      lines.forEach((l) => { l.style.translate = ""; });
      if (note) note.style.translate = "";
    });
  });

  /* 3. scroll-linked: progress line, header, marquee, drifting headings, process line */
  feature("scroll", () => {
    const progress = $(".progress");
    const headerEl = $(".site-header");
    const drifts = motion ? $$(".section-head h2") : [];
    const steps = motion ? $(".steps") : null;
    const stepItems = steps ? $$("li", steps) : [];
    const track = $(".marquee-track");
    const group = track && $(".mq-group", track);
    let mqW = 0, mqX = 0, mqDir = -1, boost = 0;
    const measure = () => {
      if (!track || !group) return;
      $$(".mq-group", track).slice(1).forEach((g) => g.remove());
      mqW = group.getBoundingClientRect().width;
      const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / Math.max(mqW, 1)));
      for (let i = 1; i < copies; i++) track.append(group.cloneNode(true));
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    let lastY = window.scrollY, lastT = performance.now(), dirty = true, hidden = false;
    window.addEventListener("scroll", () => { dirty = true; }, { passive: true });
    window.addEventListener("resize", () => { dirty = true; measure(); });
    const navOpen = () => document.body.classList.contains("nav-open");

    const frame = (now) => {
      const dt = clamp((now - lastT) / 1000, 0.001, 0.064);
      lastT = now;
      const y = window.scrollY, dy = y - lastY;
      lastY = y;

      // the strip drifts on its own and speeds up with your scrolling, in the same direction
      if (track && mqW && !reduced) {
        if (dy) mqDir = dy > 0 ? -1 : 1;
        boost += (Math.min(Math.abs(dy) / dt, 4000) - boost) * 0.08;
        mqX += (55 + boost * 0.3) * dt * mqDir;
        if (mqX <= -mqW) mqX += mqW; else if (mqX > 0) mqX -= mqW;
        track.style.transform = "translate3d(" + mqX.toFixed(2) + "px,0,0)";
      }

      if (dirty) {
        dirty = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ")";
        if (headerEl && !reduced) {
          if (dy > 2 && y > 320 && !navOpen() && !headerEl.contains(document.activeElement)) hidden = true;
          else if (dy < -2 || y < 160) hidden = false;
          headerEl.classList.toggle("is-hidden", hidden);
        }
        drifts.forEach((h) => {
          const r = h.getBoundingClientRect();
          if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
          const p = (r.top + r.height / 2) / window.innerHeight - 0.5;
          h.style.translate = (-p * 56).toFixed(1) + "px 0";
        });
        if (steps) {
          const r = steps.getBoundingClientRect();
          const p = clamp((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.25), 0, 1);
          steps.style.setProperty("--p", p.toFixed(3));
          stepItems.forEach((li, i) => li.classList.toggle("reached", p >= (i + 0.6) / stepItems.length));
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });

  /* 4. custom cursor (mouse only) */
  feature("cursor", () => {
    if (!fine || reduced) return;
    const cur = $(".cursor");
    if (!cur) return;
    const dot = $(".cursor-dot", cur), ring = $(".cursor-ring", cur), label = $(".cursor-label", cur);
    $$(".job-shot").forEach((el) => { el.dataset.cursor = "Open ↗"; });
    $$(".ad").forEach((el) => { el.dataset.cursor = el.closest(".hook-preview") ? "Live" : "Concept"; });
    $$(".hook").forEach((el) => { el.dataset.cursor = "Run it"; });
    $$(".breakdown-shot").forEach((el) => { el.dataset.cursor = "Roofit"; });
    root.classList.add("has-cursor");
    let mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (!shown) { rx = mx; ry = my; shown = true; cur.classList.add("on"); }
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
    }, { passive: true });
    root.addEventListener("mouseleave", () => { shown = false; cur.classList.remove("on"); });
    const loop = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      const lab = t.closest("[data-cursor]");
      cur.classList.toggle("is-text", !!t.closest("input, textarea"));
      cur.classList.toggle("has-label", !!lab);
      cur.classList.toggle("is-hot", !lab && !!t.closest("a, button, summary, .pills label"));
      label.textContent = lab ? lab.dataset.cursor : "";
    });
    document.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    document.addEventListener("pointerup", () => cur.classList.remove("is-down"));
  });

  /* 5. ads and cards tilt under the mouse or a finger */
  feature("tilt", () => {
    if (reduced) return;
    $$(".ad, .breakdown-shot, .rewrite").forEach((el) => {
      el.setAttribute("data-tilt", "");
      const set = (x, y) => {
        const r = el.getBoundingClientRect();
        const px = clamp((x - r.left) / r.width, 0, 1) - 0.5;
        const py = clamp((y - r.top) / r.height, 0, 1) - 0.5;
        el.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 8).toFixed(2) + "deg");
        el.classList.add("tilting");
      };
      const reset = () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.classList.remove("tilting");
      };
      el.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") set(e.clientX, e.clientY); });
      el.addEventListener("pointerleave", reset);
      el.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) set(t.clientX, t.clientY); }, { passive: true });
      el.addEventListener("touchend", reset);
      el.addEventListener("touchcancel", reset);
    });
  });

  /* 6. buttons lean towards the mouse */
  feature("magnet", () => {
    if (!fine || reduced) return;
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - (r.left + r.width / 2)) * 0.18).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", () => {
        b.style.setProperty("--mx", "0px");
        b.style.setProperty("--my", "0px");
      });
    });
  });

  /* 7. a red-pen circle wherever you press */
  feature("tap", () => {
    if (reduced) return;
    let last = 0;
    document.addEventListener("pointerdown", (e) => {
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      if (e.target && e.target.closest && e.target.closest("input, textarea, select")) return;
      const m = document.createElement("span");
      m.className = "tap";
      m.setAttribute("aria-hidden", "true");
      m.style.left = e.clientX + "px";
      m.style.top = e.clientY + "px";
      m.style.rotate = Math.round(Math.random() * 60 - 30) + "deg";
      document.body.append(m);
      setTimeout(() => m.remove(), 700);
    }, { passive: true });
  });

  /* 8. hook test: tap or hover a hook and it types itself into the ad */
  feature("hooks", () => {
    const btns = $$(".hook"), live = $("#hookLive"), name = $("#hookName"), lab = $(".hooklab");
    if (!btns.length || !live || !name || !lab) return;
    let idx = 0, typing = 0, timer = 0, took = false, visible = false;
    const type = (text) => {
      clearInterval(typing);
      if (reduced) { live.textContent = text; return; }
      let i = 0;
      live.textContent = "";
      typing = setInterval(() => {
        i = Math.min(text.length, i + 2);
        live.textContent = text.slice(0, i);
        if (i >= text.length) clearInterval(typing);
      }, 24);
    };
    const schedule = () => {
      clearTimeout(timer);
      btns.forEach((b) => b.classList.remove("cycling"));
      if (took || !visible || reduced) return;
      const b = btns[idx];
      void b.offsetWidth;
      b.classList.add("cycling");
      timer = setTimeout(() => set((idx + 1) % btns.length, false), 5500);
    };
    const set = (i, byUser) => {
      if (byUser) took = true;
      if (i !== idx || !byUser) {
        idx = i;
        btns.forEach((b, j) => { b.classList.toggle("is-on", j === i); b.setAttribute("aria-pressed", String(j === i)); });
        name.textContent = btns[i].dataset.name;
        type(btns[i].dataset.text);
      }
      schedule();
    };
    btns.forEach((b, i) => {
      b.addEventListener("click", () => set(i, true));
      b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && i !== idx) set(i, true); });
    });
    if (hasIO) new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.35 }).observe(lab);
  });

  /* 9. the character limits count up */
  feature("count", () => {
    if (!motion) return;
    const nums = $$(".spec-list strong");
    nums.forEach((n) => {
      const value = n.textContent.trim();
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = value + " ";
      n.before(sr);
      n.setAttribute("aria-hidden", "true");
      n.dataset.n = value;
      n.textContent = "0";
    });
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target, target = Number(el.dataset.n), start = performance.now(), dur = 1200;
      const step = (t) => {
        const p = clamp((t - start) / dur, 0, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  });

  /* 10. Google headline tester */
  feature("try", () => {
    const input = $("#tryHeadline"), count = $("#tryCount"), prev = $("#tryPreview"), note = $("#tryNote");
    if (!input || !count || !prev || !note) return;
    const LIMIT = 30;
    let lastMsg = null;
    const render = () => {
      const chars = Array.from(input.value);
      const n = chars.length;
      count.textContent = n + "/" + LIMIT;
      count.classList.toggle("over", n > LIMIT);
      const shown = n ? chars : Array.from(input.placeholder);
      prev.replaceChildren(document.createTextNode(shown.slice(0, LIMIT).join("")));
      if (shown.length > LIMIT) {
        const s = document.createElement("s");
        s.textContent = shown.slice(LIMIT).join("");
        prev.append(s);
      }
      prev.classList.toggle("is-sample", !n);
      const over = n - LIMIT;
      const msg = !n ? ""
        : over > 0 ? over + (over === 1 ? " character" : " characters") + " too long. Google won't accept it."
        : n >= 26 ? "Fits. Only just."
        : "Fits. Now make every word earn its place.";
      if (msg !== lastMsg) {
        lastMsg = msg;
        note.textContent = msg;
        note.classList.remove("pop");
        void note.offsetWidth;
        if (msg && !reduced) note.classList.add("pop");
      }
    };
    input.addEventListener("input", render);
    render();
  });

  /* 11. work rows light up as they pass the middle of the screen */
  feature("jobs", () => {
    if (!hasIO) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle("is-active", e.isIntersecting)),
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    $$(".job").forEach((j) => io.observe(j));
  });

  /* 12. the menu shows which section you're reading */
  feature("spy", () => {
    if (!hasIO) return;
    const links = new Map($$(".main-nav a[href^='#']:not(.btn)").map((a) => [a.getAttribute("href").slice(1), a]));
    const clear = () => links.forEach((l) => l.classList.remove("is-active"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const a = links.get(e.target.id);
      if (a && e.isIntersecting) { clear(); a.classList.add("is-active"); }
    }), { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    links.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    window.addEventListener("scroll", () => { if (window.scrollY < 300) clear(); }, { passive: true });
  });

  /* 13. FAQ answers slide open and closed */
  feature("faq", () => {
    if (reduced || !Element.prototype.animate) return;
    $$(".faq details").forEach((d) => {
      const s = $("summary", d);
      let anim = null;
      let wantOpen = d.open;
      s.addEventListener("click", (e) => {
        e.preventDefault();
        const start = d.offsetHeight;
        if (anim) anim.cancel();
        wantOpen = !wantOpen;
        const opening = wantOpen;
        d.open = true;
        const border = d.offsetHeight - d.clientHeight;
        const end = opening ? d.offsetHeight : s.offsetHeight + border;
        d.style.overflow = "hidden";
        anim = d.animate({ height: [start + "px", end + "px"] }, { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" });
        anim.onfinish = () => { anim = null; d.style.overflow = ""; if (!wantOpen) d.open = false; };
        anim.oncancel = () => { d.style.overflow = ""; };
      });
    });
  });
})();
