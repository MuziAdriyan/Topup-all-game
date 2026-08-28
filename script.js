/* =========================================================
   GDevShop — Frontend logic
   NOTE: This file only handles DEMO MODE order simulation and
   UI/UX. In PRODUCTION MODE, the "Bayar Sekarang" submit must
   call the backend API (POST /api/orders) instead of writing
   directly to localStorage. Prices shown here are placeholder
   catalog data — real prices MUST be re-verified server-side.
   See backend/controllers/orderController.js.
   ========================================================= */

const APP = "";  | "production" — toggled by deployment config, not by the user.

/* ---------- Mobile nav drawer ---------- */
(function initDrawer() {
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("mobileDrawer");
  const close = document.getElementById("drawerClose");
  if (!toggle || !drawer) return;
  toggle.addEventListener("click", () => drawer.classList.add("open"));
  close?.addEventListener("click", () => drawer.classList.remove("open"));
  drawer.addEventListener("click", (e) => { if (e.target === drawer) drawer.classList.remove("open"); });
})();

/* ---------- Promo code copy ---------- */
document.querySelectorAll(".promo-code button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const code = btn.previousElementSibling.textContent.replace("KODE: ", "").trim();
    navigator.clipboard?.writeText(code).catch(() => {});
    const original = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    setTimeout(() => (btn.innerHTML = original), 1500);
  });
});

/* ---------- Product catalog (placeholder — backend is source of truth) ---------- */
const CATALOG = {
  "mobile-legends": { name: "Mobile Legends", hasServer: true, items: [
    { label: "86 Diamond", sub: "Instan", price: 22000 },
    { label: "172 Diamond", sub: "Instan", price: 43000, bonus: "+10" },
    { label: "257 Diamond", sub: "Instan", price: 64000 },
    { label: "344 Diamond", sub: "Instan", price: 85000 },
    { label: "429 Diamond", sub: "Instan", price: 106000 },
    { label: "514 Diamond", sub: "Instan", price: 127000 },
  ]},
  "free-fire": { name: "Free Fire", hasServer: false, items: [
    { label: "70 Diamond", sub: "Instan", price: 11000 },
    { label: "140 Diamond", sub: "Instan", price: 19000 },
    { label: "355 Diamond", sub: "Instan", price: 49000, bonus: "+15" },
    { label: "720 Diamond", sub: "Instan", price: 100000 },
  ]},
  "pubg-mobile": { name: "PUBG Mobile", hasServer: false, items: [
    { label: "60 UC", sub: "Instan", price: 15000 },
    { label: "325 UC", sub: "Instan", price: 78000 },
    { label: "660 UC", sub: "Instan", price: 155000, bonus: "+30" },
    { label: "1800 UC", sub: "Instan", price: 415000 },
  ]},
  "valorant": { name: "Valorant", hasServer: false, items: [
    { label: "420 VP", sub: "Instan", price: 85000 },
    { label: "700 VP", sub: "Instan", price: 140000 },
    { label: "1375 VP", sub: "Instan", price: 275000, bonus: "+50" },
    { label: "2400 VP", sub: "Instan", price: 470000 },
  ]},
  "roblox": { name: "Roblox", hasServer: false, items: [
    { label: "400 Robux", sub: "Instan", price: 78000 },
    { label: "800 Robux", sub: "Instan", price: 152000 },
    { label: "1700 Robux", sub: "Instan", price: 312000, bonus: "+5%" },
  ]},
  "genshin-impact": { name: "Genshin Impact", hasServer: true, items: [
    { label: "60 Genesis Crystal", sub: "Instan", price: 16000 },
    { label: "300 Genesis Crystal", sub: "Instan", price: 79000 },
    { label: "980 Genesis Crystal", sub: "Instan", price: 249000, bonus: "+60" },
    { label: "1980 Genesis Crystal", sub: "Instan", price: 479000 },
  ]},
  "honor-of-kings": { name: "Honor of Kings", hasServer: true, items: [
    { label: "60 Tokens", sub: "Instan", price: 16000 },
    { label: "300 Tokens", sub: "Instan", price: 79000 },
    { label: "980 Tokens", sub: "Instan", price: 249000 },
  ]},
  "cod-mobile": { name: "Call of Duty Mobile", hasServer: false, items: [
    { label: "80 CP", sub: "Instan", price: 16000 },
    { label: "420 CP", sub: "Instan", price: 82000 },
    { label: "880 CP", sub: "Instan", price: 165000, bonus: "+40" },
  ]},
};

const SERVICE_FEE = 2500;
const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");

/* ---------- Top-up form (topup.html) ---------- */
(function initTopupForm() {
  const form = document.getElementById("topupForm");
  if (!form) return;

  const gameSelect = document.getElementById("gameSelect");
  const serverField = document.getElementById("serverIdField");
  const nominalGrid = document.getElementById("nominalGrid");
  const stepEls = document.querySelectorAll(".step-nav .step");
  document.getElementById("modeLabel").textContent =
    APP === 

  let selectedNominal = null;

  // Preselect game from ?game= query param
  const params = new URLSearchParams(location.search);
  const preGame = params.get("game");
  if (preGame && CATALOG[preGame]) gameSelect.value = preGame;

  function renderNominals() {
    const game = CATALOG[gameSelect.value];
    nominalGrid.innerHTML = "";
    selectedNominal = null;
    updateSummary();
    if (!game) return;

    serverField.style.display = game.hasServer ? "block" : "none";
    document.getElementById("serverId").required = game.hasServer;

    game.items.forEach((item, i) => {
      const label = document.createElement("label");
      label.className = "option-card";
      label.innerHTML = `
        <input type="radio" name="nominal" value="${i}">
        <span class="label">${item.label}</span>
        <span class="sub">${rupiah(item.price)}</span>
        ${item.bonus ? `<span class="bonus">${item.bonus}</span>` : ""}
      `;
      label.addEventListener("click", () => {
        nominalGrid.querySelectorAll(".option-card").forEach((el) => el.classList.remove("selected"));
        label.classList.add("selected");
        selectedNominal = item;
        setStep(3);
        updateSummary();
      });
      nominalGrid.appendChild(label);
    });
  }

  gameSelect.addEventListener("change", () => { renderNominals(); setStep(2); updateSummary(); });
  renderNominals();

  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      document.querySelectorAll('input[name="payment"]').forEach((r) => r.closest(".option-card").classList.remove("selected"));
      radio.closest(".option-card").classList.add("selected");
      setStep(4);
      updateSummary();
    });
  });

  ["playerId", "contact"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateSummary);
  });

  function setStep(n) {
    stepEls.forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle("active", s === n);
      el.classList.toggle("done", s < n);
    });
  }

  function updateSummary() {
    const game = CATALOG[gameSelect.value];
    document.getElementById("sumGame").textContent = game ? game.name : "—";
    document.getElementById("sumPlayer").textContent = document.getElementById("playerId").value || "—";
    document.getElementById("sumNominal").textContent = selectedNominal ? `${selectedNominal.label} (${rupiah(selectedNominal.price)})` : "—";
    const paymentEl = document.querySelector('input[name="payment"]:checked');
    document.getElementById("sumPayment").textContent = paymentEl ? paymentEl.closest(".option-card").querySelector(".label").textContent : "—";
    document.getElementById("sumFee").textContent = rupiah(SERVICE_FEE);
    const total = selectedNominal ? selectedNominal.price + SERVICE_FEE : 0;
    document.getElementById("sumTotal").textContent = rupiah(total);
  }

  function setError(fieldEl, hasError) {
    fieldEl.classList.toggle("has-error", hasError);
  }

  function validateContact(value) {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phone = /^(\+62|62|0)8[0-9]{8,12}$/;
    return email.test(value) || phone.test(value.replace(/[\s-]/g, ""));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    const gameField = gameSelect.closest(".field");
    if (!gameSelect.value) { setError(gameField, true); valid = false; } else setError(gameField, false);

    const playerIdEl = document.getElementById("playerId");
    const playerField = document.getElementById("playerIdField");
    if (!/^[0-9]{4,15}$/.test(playerIdEl.value.trim())) { setError(playerField, true); valid = false; } else setError(playerField, false);

    const game = CATALOG[gameSelect.value];
    if (game && game.hasServer) {
      const serverEl = document.getElementById("serverId");
      if (!/^[0-9]{1,6}$/.test(serverEl.value.trim())) { setError(serverField, true); valid = false; } else setError(serverField, false);
    }

    const nominalError = document.getElementById("nominalError");
    if (!selectedNominal) { nominalError.style.display = "block"; valid = false; } else nominalError.style.display = "none";

    const paymentError = document.getElementById("paymentError");
    const paymentEl = document.querySelector('input[name="payment"]:checked');
    if (!paymentEl) { paymentError.style.display = "block"; valid = false; } else paymentError.style.display = "none";

    const contactEl = document.getElementById("contact");
    const contactField = contactEl.closest(".field");
    if (!validateContact(contactEl.value.trim())) { setError(contactField, true); valid = false; } else setError(contactField, false);

    if (!valid) return;

    // ---- MODE ONLY ----
    // Production build must POST this payload to /api/orders and let the
    // backend create the order + payment intent. The price used for the
    // real charge must always come from the backend catalog lookup, never
    // from this client-side `selectedNominal.price` value.
    const orderId = "GDS-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + Math.floor(1000 + Math.random()*9000);
    const order = {
      orderId,
      mode: APP_MODE,
      game: game.name,
      gameSlug: gameSelect.value,
      playerId: playerIdEl.value.trim(),
      serverId: game.hasServer ? document.getElementById("serverId").value.trim() : null,
      nominal: selectedNominal.label,
      price: selectedNominal.price,
      fee: SERVICE_FEE,
      total: selectedNominal.price + SERVICE_FEE,
      payment: paymentEl.value,
      contact: contactEl.value.trim(),
      status: "menunggu_pembayaran",
      createdAt: new Date().toISOString(),
    };
    saveOrder(order);
    location.href = "checkout.html?order=" + encodeURIComponent(orderId);
  });
})();

/* ---------- order storage helpers (client-side only) ---------- */
function saveOrder(order) {
  const all = JSON.parse(localStorage.getItem("gdevshop_demo_orders") || "{}");
  all[order.orderId] = order;
  localStorage.setItem("gdevshop_demo_orders", JSON.stringify(all));
}
function getOrder(orderId) {
  const all = JSON.parse(localStorage.getItem("Muzishop_orders") || "{}");
  return all[orderId] || null;
}
function updateOrderStatus(orderId, status) {
  const all = JSON.parse(localStorage.getItem("Muzishop_orders") || "{}");
  if (all[orderId]) { all[orderId].status = status; localStorage.setItem("Muzishop_orders", JSON.stringify(all)); }
}

/* ---------- Checkout page ---------- */
(function initCheckout() {
  const panel = document.getElementById("checkoutPanel");
  if (!panel) return;

  const params = new URLSearchParams(location.search);
  const orderId = params.get("order");
  const order = orderId ? getOrder(orderId) : null;

  if (!order) {
    panel.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">Pesanan tidak ditemukan. Silakan mulai top up dari awal.</p><a href="topup.html" class="btn btn-primary btn-block" style="margin-top:14px;">Mulai Top Up</a>';
    return;
  }

  document.getElementById("coOrderId").textContent = order.orderId;
  document.getElementById("coGame").textContent = order.game;
  document.getElementById("coPlayer").textContent = order.playerId + (order.serverId ? " / " + order.serverId : "");
  document.getElementById("coNominal").textContent = order.nominal;
  document.getElementById("coPayment").textContent = order.payment.toUpperCase();
  document.getElementById("coTotal").textContent = rupiah(order.total);


  document.getElementById("simulatePay").addEventListener("click", () => {
    // DEMO ONLY: simulates the webhook confirmation a real payment
    // gateway would send. Production MUST NOT mark an order paid from
    // the frontend — only a verified backend webhook may do this.
    updateOrderStatus(order.orderId, "berhasil");
    location.href = "status.html?order=" + encodeURIComponent(order.orderId);
  });
})();

/* ---------- Status tracking page ---------- */
(function initStatusPage() {
  const trackForm = document.getElementById("trackForm");
  if (!trackForm) return;

  const STATUS_FLOW = [
    { key: "menunggu_pembayaran", title: "Pembayaran Dibuat", desc: "Order dibuat, menunggu pembayaran dari pelanggan." },
    { key: "menunggu_verifikasi", title: "Menunggu Verifikasi", desc: "Sistem menunggu konfirmasi dari payment gateway." },
    { key: "terverifikasi", title: "Pembayaran Terverifikasi", desc: "Pembayaran telah dikonfirmasi oleh payment gateway." },
    { key: "diproses", title: "Order Top-Up Diproses", desc: "Order diteruskan ke API distributor resmi." },
    { key: "berhasil", title: "Berhasil", desc: "Item telah masuk ke akun game Anda." },
  ];

  function renderResult(order) {
    document.getElementById("emptyPanel").style.display = "none";
    const resultPanel = document.getElementById("resultPanel");
    resultPanel.style.display = "block";
    document.getElementById("resultOrderId").textContent = order.orderId;
    document.getElementById("resultDetail").textContent = `${order.game} · ${order.nominal} · ${rupiah(order.total)}`;

    const badge = document.getElementById("resultBadge");
    const statusMap = {
      menunggu_pembayaran: ["badge-pending", "Menunggu Pembayaran"],
      menunggu_verifikasi: ["badge-pending", "Menunggu Verifikasi"],
      terverifikasi: ["badge-pending", "Terverifikasi"],
      diproses: ["badge-pending", "Diproses"],
      berhasil: ["badge-success", "Berhasil"],
      gagal: ["badge-failed", "Gagal"],
    };
    const [cls, text] = statusMap[order.status] || statusMap.menunggu_pembayaran;
    badge.className = "badge " + cls;
    badge.textContent = text;

    const currentIndex = order.status === "berhasil" ? STATUS_FLOW.length - 1 : STATUS_FLOW.findIndex(s => s.key === order.status);
    const timeline = document.getElementById("statusTimeline");
    timeline.innerHTML = "";
    STATUS_FLOW.forEach((step, i) => {
      const item = document.createElement("div");
      const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "";
      item.className = "timeline-item " + state;
      item.innerHTML = `
        <span class="timeline-dot">
          ${i <= currentIndex ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : ""}
        </span>
        <div><h4>${step.title}</h4><p>${step.desc}</p></div>
      `;
      timeline.appendChild(item);
    });
  }

  function lookup(orderId) {
    const order = getOrder(orderId.trim());
    if (order) renderResult(order);
    else {
      document.getElementById("resultPanel").style.display = "none";
      document.getElementById("emptyPanel").style.display = "block";
    }
  }

  trackForm.addEventListener("submit", (e) => {
    e.preventDefault();
    lookup(document.getElementById("orderIdInput").value);
  });

  const params = new URLSearchParams(location.search);
  const preOrder = params.get("order");
  if (preOrder) {
    document.getElementById("orderIdInput").value = preOrder;
    lookup(preOrder);
  }
})();
     
