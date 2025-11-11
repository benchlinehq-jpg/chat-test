(() => {
  // Read options from the script tag (works with a normal <script defer ...> include)
  const script = document.currentScript;
  const endpoint = script?.dataset?.endpoint || "/api/chat";
  const title = script?.dataset?.title || "Chat";
  const welcome = script?.dataset?.welcome || "Hi! Ask me anything.";
  const theme = (script?.dataset?.theme || "auto").toLowerCase();

  // Root container
  const root = document.createElement("div");
  root.id = "blx-root";
  document.body.appendChild(root);

  // Styles
  const css = document.createElement("style");
  css.textContent = `
#blx-root * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
#blx-btn {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483000;
  width: 72px; height: 44px; border-radius: 9999px; border: none; cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,.18);
  background: #4f46e5; color: #ffffff; font-size: 16px; line-height: 44px; text-align:center;
}
#blx-panel {
  position: fixed; right: 20px; bottom: 74px; z-index: 2147483000;
  width: 360px; max-width: calc(100vw - 40px); height: 520px; max-height: calc(100vh - 120px);
  background: var(--bg); color: var(--fg); border-radius: 16px; display: none;
  box-shadow: 0 20px 60px rgba(0,0,0,.2); overflow: hidden; border: 1px solid var(--bd);
}
#blx-root[data-open="true"] #blx-panel { display: flex; flex-direction: column; }

#blx-header { padding: 12px 14px; font-weight: 600; border-bottom: 1px solid var(--bd); display:flex; align-items:center; justify-content:space-between; }
#blx-close { background: transparent; border: none; font-size: 20px; color: var(--fg); cursor: pointer; }
#blx-msgs { flex:1 1 auto; padding: 12px; overflow:auto; display:flex; flex-direction:column; gap:10px; }
.blx-msg { padding:10px 12px; border-radius:12px; max-width:85%; line-height:1.35; white-space:pre-wrap; }
.blx-user { align-self:flex-end; background: var(--bubble-user); color: var(--fg-user); }
.blx-bot { align-self:flex-start; background: var(--bubble-bot); color: var(--fg); border:1px solid var(--bd); }
#blx-bar { display:flex; gap:8px; padding:12px; border-top:1px solid var(--bd); }
#blx-input { flex:1 1 auto; padding:10px 12px; border-radius:12px; border:1px solid var(--bd); background:var(--bg2); color:var(--fg); }
#blx-send { padding:10px 14px; border-radius:12px; border:1px solid var(--bd); background:var(--bg3); color: var(--fg); cursor:pointer; }

#blx-root[data-theme="dark"]  { --bg:#0b0c0f; --bg2:#111318; --bg3:#171a21; --fg:#eaeef6; --fg-user:#0b0c0f; --bd:#2a2f3a; --bubble-user:#c8d2ff; --bubble-bot:#0f1218; }
#blx-root[data-theme="light"] { --bg:#ffffff; --bg2:#fbfbfc; --bg3:#f6f7fb; --fg:#0a0b0f; --fg-user:#0a0b0f; --bd:#e6e8ef; --bubble-user:#e8ecff; --bubble-bot:#ffffff; }
`;
  document.head.appendChild(css);

  // Theme
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "auto" ? (prefersDark ? "dark" : "light") : theme;
  root.setAttribute("data-theme", resolved);

  // Button
  const btn = document.createElement("button");
  btn.id = "blx-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.textContent = "OPEN";
  btn.onclick = () => {
    root.dataset.open = root.dataset.open === "true" ? "false" : "true";
    if (root.dataset.open === "true" && msgs.children.length === 0) {
      addBot(welcome);
    }
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
    <div id="blx-msgs"></div>
    <div id="blx-bar">
      <input id="blx-input" type="text" placeholder="Type a message..." />
      <button id="blx-send">Send</button>
    </div>`;
  root.appendChild(panel);

  const close = panel.querySelector("#blx-close");
  const input = panel.querySelector("#blx-input");
  const send  = panel.querySelector("#blx-send");
  const msgs  = panel.querySelector("#blx-msgs");

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

  // --- Step 3A: UX polish (typing indicator, disable while sending, Retry) ---
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

    // user bubble
    history.push({ role: "user", content: text });
    addUser(text);

    // typing indicator
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
      rb.onclick = () => {
        input.value = text;  // put the same message back
        sendMessage();
      };
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

  // Enter-to-send (but only when not busy)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !busy) sendMessage();
  });
  send.onclick = sendMessage;
})();
