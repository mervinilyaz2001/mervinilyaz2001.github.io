/* ============================================================
   YOUR DETAILS
   Edit these and the whole page updates. Anything still in
   [SQUARE BRACKETS] shows as a yellow highlighted placeholder
   until it's filled in. If the business name, your name or town
   change, also update the <title>, description and og: tags in
   index.html, which Google and link previews read before this
   script runs.
   ============================================================ */
const CONFIG = {
  brand: "Mervin Ilyaz Digital Marketing",     // the full business name, used in the footer
  name: "Mervin Ilyaz",
  firstName: "Mervin",
  town: "Dublin",
  email: "mervinilyaz@outlook.com",
  whatsappDisplay: "+353 85 130 7006",         // how it's shown on the page
  whatsapp: "353851307006",                    // digits only with country code, no + or spaces
  replyTime: "as soon as possible",
  photo: "images/mervin.webp",                 // a portrait (4:5) photo of you

  // FORM BACKEND: Web3Forms access key (web3forms.com). Enquiries go to mervinilyaz@outlook.com.
  // The key is meant to be public: it only lets people send messages to that inbox.
  // If it's ever emptied, the form tells visitors to use WhatsApp or email instead.
  web3formsKey: "a2af6af5-c2ba-4b7e-a972-606921bb0125"
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

// extra WhatsApp buttons only appear once a real number is set above
if (!CONFIG.whatsapp) document.querySelectorAll(".wa-only").forEach((el) => { el.hidden = true; });

// buttons around the page tick the matching option in the form
document.querySelectorAll("[data-need]").forEach((a) => a.addEventListener("click", () => {
  const option = document.getElementById(a.dataset.need);
  if (option) option.checked = true;
  const formEl = document.getElementById("contactForm");
  if (formEl) { formEl.classList.remove("flash"); void formEl.offsetWidth; formEl.classList.add("flash"); }
}));

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

/* ---------- back to the top: clicking the name, and every reload ---------- */
const prefersReduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const clearHash = () => { if (location.hash) history.replaceState(null, "", location.pathname + location.search); };
const brandLink = document.querySelector(".brand");
if (brandLink) brandLink.addEventListener("click", (e) => {
  e.preventDefault();
  setNav(false);
  window.scrollTo({ top: 0, behavior: prefersReduced ? "instant" : "smooth" });
  clearHash();
});
try {
  const navEntry = performance.getEntriesByType("navigation")[0];
  if (navEntry && navEntry.type === "reload") {
    window.scrollTo({ top: 0, behavior: "instant" });
    window.addEventListener("load", () => window.scrollTo({ top: 0, behavior: "instant" }));
  }
} catch (err) { /* older browsers: the normal reload behaviour applies */ }

/* ---------- sticky call to action: shows once you're past the hero buttons; hides at the form
   and while one of the page's own call-to-action blocks is on screen ---------- */
const dock = document.getElementById("dock");
const heroCtas = document.querySelector(".hero-ctas");
const endZone = [document.getElementById("contact"), document.querySelector(".site-footer"),
  ...document.querySelectorAll(".cta-strip, .discovery-foot, .about-ctas")];
let beforeHeroCtas = true;
const atEnd = new Set();
const syncDock = () => { if (dock) dock.classList.toggle("hide", beforeHeroCtas || atEnd.size > 0); };
if (dock && "IntersectionObserver" in window) {
  if (heroCtas) {
    new IntersectionObserver(([entry]) => {
      beforeHeroCtas = entry.isIntersecting || entry.boundingClientRect.top > 0;
      syncDock();
    }).observe(heroCtas);
  } else beforeHeroCtas = false;
  const endIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) atEnd.add(entry.target); else atEnd.delete(entry.target); });
    syncDock();
  }, { threshold: 0.05 });
  endZone.forEach((el) => { if (el) endIO.observe(el); });
} else if (dock) dock.classList.remove("hide");

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
        from_name: "Mervin Ilyaz Digital Marketing website",
        ...data,
        // if they left an email address, "Reply" in your inbox goes straight to them
        ...(/^\S+@\S+\.\S+$/.test((data.contact || "").trim()) ? { replyto: data.contact.trim() } : {})
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
   Scroll-driven only: nothing follows the mouse or a finger.
   Each feature runs on its own, so one failing never breaks the
   rest. With reduced motion switched on, the moving parts are skipped.
   ============================================================ */
(function () {
  const root = document.documentElement;
  const matches = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  const reduced = matches("(prefers-reduced-motion: reduce)");
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
      [".kicker, .section-intro, .sub-head, .picks li, .discovery-foot, .familiar-group, .familiar-cta, .cta-strip, .faq-cta, .about-ctas, .ad-wrap, .rewrite, .notes li, .core-item, .extras li, .job, .steps li, .promises li, .faq details, .skill-list li, .story div", "up"],
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

  /* 3. scroll-linked: progress line, header, marquee, process line */
  feature("scroll", () => {
    const progress = $(".progress");
    const headerEl = $(".site-header");
    const steps = motion ? $(".steps") : null;
    const stepItems = steps ? $$("li", steps) : [];
    const track = $(".marquee-track");
    const group = track && $(".mq-group", track);
    let mqW = 0, mqX = 0, mqDir = -1, boost = 0, mqOnScreen = true;
    if (track && hasIO) new IntersectionObserver(([e]) => { mqOnScreen = e.isIntersecting; }).observe(track);
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
      if (track && mqW && mqOnScreen && !reduced) {
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

  /* 8. hook test: tap a hook and it types itself into the ad */
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
    btns.forEach((b, i) => b.addEventListener("click", () => set(i, true)));
    if (hasIO) new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.35 }).observe(lab);
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
      if (!a) return;
      if (e.isIntersecting) { clear(); a.classList.add("is-active"); }
      else a.classList.remove("is-active");   // left the middle of the screen: stop highlighting it
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
