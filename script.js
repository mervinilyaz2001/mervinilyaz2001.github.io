/* ============================================================
   YOUR DETAILS
   Edit these and the whole page updates. Anything still in
   [SQUARE BRACKETS] shows as a yellow highlighted placeholder
   until it's filled in. Also replace [YOUR NAME] in the <title>
   and og:title in index.html, so Google and link previews see it.
   ============================================================ */
const CONFIG = {
  name: "[YOUR NAME]",
  town: "[YOUR TOWN]",                         // e.g. "Dublin"
  email: "[YOUR EMAIL]",
  whatsappDisplay: "[YOUR WHATSAPP NUMBER]",   // how it's shown, e.g. "087 123 4567"
  whatsapp: "",                                // digits only with country code, no + or spaces, e.g. "353871234567"
  replyTime: "[REPLY TIME, e.g. within one working day]",

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
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
toggle.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
document.querySelectorAll(".main-nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

/* ---------- scroll reveals ---------- */
const revealEls = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-in"));
}

/* ---------- hide the floating WhatsApp button over the contact section ---------- */
const waFloat = document.querySelector(".wa-float");
const contact = document.getElementById("contact");
if (waFloat && contact && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => waFloat.classList.toggle("hide", entry.isIntersecting), { threshold: 0.15 })
    .observe(contact);
}

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
        subject: `New portfolio enquiry: ${data.business}`,
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
