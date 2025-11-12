(() => {
  // Read options from the script tag
  const script   = document.currentScript;
  const endpoint = script?.dataset?.endpoint || "/api/chat";
  const title    = script?.dataset?.title || "Chat";
  const welcome  = script?.dataset?.welcome || "Hi! Ask me anything.";
  const theme    = (script?.dataset?.theme || "auto").toLowerCase();
  const accent   = script?.dataset?.accent || "#4f46e5";

  // Derive /api/lead from same host as chat endpoint
  let leadEndpoint;
  try { leadEndpoint = new URL("/api/lead", endpoint).toString(); }
  catch { leadEndpoint = "/api/lead"; }

  // Root
  const root = document.createElement("div");
  root.id = "blx-root";
  document.body.appendChild(root);

  // Styles (desktop + mobile)
  const css = document.createElement("style");
  css.textContent = `
#blx-root * { box-sizing: border-box; font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial; }
#blx-btn {
  position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 2147483000; width: 56px; height: 56px; line-height: 56px; border-radius: 9999px; border: none; cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,.18); background: var(--accent); color: #ffffff; text-align:center;
  display:flex; align-items:center; justify-content:center;
}
#blx-btn svg { width: 26px; height: 26px; vertical-align: middle; }

#blx-panel {
  position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: calc(max(12px, env(safe-area-inset-bottom)) + 64px);
  z-index: 2147483000; width: 360px; max-width: calc(100vw - 24px); height: 600px; max-height: calc(100vh - 140px);
  background: var(--bg); color: var(--fg); border-radius: 16px; display: none; box-shadow: 0 20px 60px rgba(0,0,0,.2);
  overflow: hidden; border: 1px solid var(--bd);
}
#blx-root[data-open="true"] #blx-panel { display: flex; flex-direction: column; }

#blx-header { padding: 12px 14px; font-weight: 600; border-bottom: 1px solid var(--bd); display:flex; align-items:center; justify-content:space-between; }
#blx-close { background: transparent; border: none; font-size: 20px; color: var(--fg); cursor: pointer; }

#blx-chips { padding:10px 12px; display:flex; gap:8px; flex-wrap:wrap; border-bottom:1px dashed var(--bd); }
.blx-chip { padding:6px 10px; border:1px solid var(--bd); background:var(--bg3); color:var(--fg); border-radius:9999px; cursor:pointer; font-size:13px; }
.blx-chip:hover { border-color: var(--accent); color: var(--accent); }

#blx-msgs { flex:1 1 auto; padding: 12px; overflow:auto; display:flex; flex-direction:column; gap:10px; background:var(--bg); }
.blx-msg { padding:10px 12px; border-radius:12px; max-width:85%; line-height:1.35; white-space:pre-wrap; }
.blx-user { align-self:flex-end; background: var(--bubble-user); color: var(--fg-user); }
.blx-bot  { align-self:flex-start; background: var(--bubble-bot); color: var(--fg); border:1px solid var(--bd); }

#blx-bar  { display:flex; gap:8px; padding:12px; border-top:1px solid var(--bd); align-items:center; background:var(--bg); }
#blx-input { flex:1 1 auto; padding:12px 14px; border-radius:12px; border:1px solid var(--bd); background:var(--bg2); color:var(--fg); min-height:44px; }
#blx-send  { padding:12px 16px; border-radius:12px; border:1px solid var(--bd); background:var(--accent); color:#fff; cursor:pointer; min-height:44px; }

#blx-cta   { border:1px solid var(--bd); background:var(--bg3); color:var(--fg); border-radius:10px; padding:10px 12px; cursor:pointer; }
#blx-lead  { display:none; border-top:1px dashed var(--bd); padding:10px 12px; background:var(--bg); }
#blx-lead.show { display:block; }
.blx-f { display:flex; gap:8px; margin-bottom:8px; }
.blx-f input, .blx-f textarea { flex:1 1 auto; padding:10px 12px; border-radius:10px; border:1px solid var(--bd); background:var(--bg2); color:var(--fg); }
#blx-lead button { padding:10px 14px; border-radius:10px; border:1px solid var(--bd); background:var(--bg3); color:var(--fg); cursor:pointer; }

#blx-root[data-theme="dark"]  { --bg:#0b0c0f; --bg2:#111318; --bg3:#171a21; --fg:#eaeef6; --fg-user:#0b0c0f; --bd:#2a2f3a; --bubble-user:#c8d2ff; --bubble-bot:#0f1218; --accent:${accent}; }
#blx-root[data-theme="light"] { --bg:#ffffff; --bg2:#fbfbfc; --bg3:#f6f7fb; --fg:#0a0b0f; --fg-user:#0a0b0f; --bd:#e6e8ef; --bubble-user:#e8ecff; --bubble-bot:#ffffff; --accent:${accent}; }

/* --- Mobile tweaks --- */
@media (max-width: 480px) {
  #blx-panel {
    right: max(8px, env(safe-area-inset-right));
    bottom: calc(max(8px, env(safe-area-inset-bottom)) + 64px);
    width: calc(100vw - 16px);
    height: min(72vh, 560px);
    border-radius: 14px;
  }
  #blx-header { padding: 10px 12px; }
  #blx-chips { padding: 8px 10px; gap: 6px; }
  #blx-msgs { padding: 10px; gap: 8px; }
  #blx-bar { padding: 10px; gap: 8px; }
  #blx-input, #blx-send { font-size: 16px; }
  .blx-chip { padding: 6px 10px; font-size: 13px; }
}
`;
  document.head.appendChild(css);

  // Theme
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "auto" ? (prefersDark ? "dark" : "light") : theme;
  root.setAttribute("data-theme", resolved);

  // Launcher button (chat icon)
  const btn = document.createElement("button");
  btn.id = "blx-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor"
        d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v6A3.5 3.5 0 0 1 16.5 15H10l-3.6 3.2A1 1 0 0 1 5 17.4V15.5A3.5 3.5 0 0 1 4 11.5v-6Z"/>
    </svg>
  `;
  btn.onclick = () => {
    root.dataset.open = root.dataset.open === "true" ? "false" : "true";
    if (root.dataset.open === "true" && msgs.children.length === 0) addBot(welcome);
  };
  root.appendChild(btn);

  // Panel
  const panel = document.createElement("div");
  panel.id = "blx-panel";
  panel.innerHTML = `
    <div id="blx-header">
      <div>${title}</div>
      <button id="blx-close" aria-label="Close chat">×</button>
    </div>

    <div id="blx-chips">
      <button class="blx-chip" data-text="Can I get a quick quote? I’m in Horry County.">Get quote</button>
      <button class="blx-chip" data-text="What are your prices for standard cleaning and mobile detailing?">Pricing</button>
      <button class="blx-chip" data-url="https://calendly.com/benchlinehq/30min">Book a call</button>
    </div>

    <div id="blx-msgs"></div>

    <div id="blx-lead">
      <div class="blx-f"><input id="blx-name" type="text" placeholder="Your name" /></div>
      <div class="blx-f"><input id="blx-email" type="email" placeholder="Your email" /></div>
      <div class="blx-f"><textarea id="blx-note" rows="2" placeholder="Optional message"></textarea></div>
      <input id="blx-hp" type="text" style="display:none" autocomplete="off" tabindex="-1" aria-hidden="true" />
      <button id="blx-save">Share contact</button>
      <div id="blx-lead-status" style="margin-top:8px;font-size:13px;"></div>
    </div>

    <div id="blx-bar">
      <button id="blx-cta" title="Share contact so we can follow up">Share contact</button>
      <input id="blx-input" type="text" placeholder="Type a message..." />
      <button id="blx-send">Send</button>
    </div>`;
  root.appendChild(panel);

  const close = panel.querySelector("#blx-close");
  const input = panel.querySelector("#blx-input");
  const send  = panel.querySelector("#blx-send");
  const msgs  = panel.querySelector("#blx-msgs");

  // Chips
  const chips = panel.querySelectorAll(".blx-chip");
  chips.forEach(ch => ch.addEventListener("click", () => {
  const url = ch.getAttribute("data-url");
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const txt = ch.getAttribute("data-text") || ch.textContent;
  sendPreset(txt);
}));


  // Lead UI refs
  const leadBox   = panel.querySelector("#blx-lead");
  const leadBtn   = panel.querySelector("#blx-cta");
  const nameEl    = panel.querySelector("#blx-name");
  const emailEl   = panel.querySelector("#blx-email");
  const noteEl    = panel.querySelector("#blx-note");
  const saveLead  = panel.querySelector("#blx-save");
  const leadStat  = panel.querySelector("#blx-lead-status");

  close.onclick = () => (root.dataset.open = "false");

  const history = []; // {role, content}

  function addUser(text) {
    const b = document.createElement("div");
    b.className = "blx-msg blx-user";
    b.textContent = text;
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function addBot(text) {
    const b = document.createElement("div");
    b.className = "blx-msg blx-bot";
    b.textContent = text;
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Typing indicator + disable while sending + Retry
  let busy = false;
  function setBusy(v) {
    busy = v;
    input.disabled = v;
    send.disabled = v;
    send.textContent = v ? "Sending…" : "Send";
  }

  async function sendMessage() {
    if (busy) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await actuallySend(text);
  }

  async function sendPreset(text) {
    if (busy) return;
    await actuallySend(text);
  }

  async function actuallySend(text) {
    history.push({ role: "user", content: text });
    addUser(text);

    setBusy(true);
    const typing = document.createElement("div");
    typing.className = "blx-msg blx-bot";
    typing.textContent = "typing…";
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    function showRetry() {
      const wrap = document.createElement("div");
      wrap.style.textAlign = "left";
      wrap.style.marginTop = "6px";
      const rb = document.createElement("button");
      rb.textContent = "Retry";
      rb.style.cssText = "padding:6px 10px;border:1px solid var(--bd);background:var(--bg3);color:var(--fg);border-radius:10px;cursor:pointer";
      rb.onclick = () => { input.value = text; sendMessage(); };
      wrap.appendChild(rb);
      msgs.appendChild(wrap);
      msgs.scrollTop = msgs.scrollHeight;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      typing.remove();
      addBot(data.reply || "(no reply)");
      history.push({ role: "assistant", content: data.reply || "" });
    } catch (e) {
      typing.remove();
      addBot("Oops, I couldn't reach the chat server.");
      showRetry();
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  // Enter-to-send
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !busy) sendMessage();
  });
  send.onclick = sendMessage;

  // Lead capture toggle + submit
  leadBtn.onclick = () => {
    leadBox.classList.toggle("show");
    if (leadBox.classList.contains("show")) {
      nameEl.focus();
      leadStat.textContent = "";
    }
  };

  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim()); }

  saveLead.onclick = async () => {
    const name  = (nameEl.value || "").trim();
    const email = (emailEl.value || "").trim();
    const note  = (noteEl.value || "").trim();

    // Honeypot
    const hp = (document.getElementById("blx-hp").value || "").trim();
    if (hp) { leadStat.textContent = "❌ Try again."; return; }

    if (!name || !email) { leadStat.textContent = "Please enter your name and email."; leadStat.style.color = "#b42318"; return; }
    if (!validEmail(email)) { leadStat.textContent = "Please enter a valid email."; leadStat.style.color = "#b42318"; return; }

    leadStat.textContent = "Saving…"; leadStat.style.color = "inherit";

    try {
      const res = await fetch(leadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: note, source: "chat-widget" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      leadStat.textContent = "✅ Thanks! We’ll reach out shortly.";
      nameEl.value = ""; emailEl.value = ""; noteEl.value = "";
      setTimeout(() => leadBox.classList.remove("show"), 800);
    } catch (e) {
      leadStat.textContent = "❌ Couldn’t save right now. Please try again.";
      leadStat.style.color = "#b42318";
      console.error(e);
    }
  };

  // Resolve theme tokens
  const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = theme === "auto" ? (prefers ? "dark" : "light") : theme;
  root.setAttribute("data-theme", resolvedTheme);

})();
