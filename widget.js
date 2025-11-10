(() => {
  alert("minimal widget running");
  const btn = document.createElement("button");
  btn.id = "blx-btn";
  btn.textContent = "OPEN";
  Object.assign(btn.style, {
    position: "fixed", right: "20px", bottom: "20px", zIndex: "2147483647",
    padding: "12px 16px", background: "#4f46e5", color: "#fff",
    border: "none", borderRadius: "9999px", fontSize: "16px", cursor: "pointer"
  });
  document.body.appendChild(btn);
})();

