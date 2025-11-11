// Minimal widget v300 — make it obvious
console.log("WIDGET v300 running");
document.body.style.outline = "6px solid #4f46e5"; // big purple frame
const btn = document.createElement("button");
btn.textContent = "OPEN";
Object.assign(btn.style, {
  position: "fixed", right: "20px", bottom: "20px", zIndex: "2147483647",
  padding: "12px 16px", background: "#4f46e5", color: "#fff",
  border: "none", borderRadius: "9999px", fontSize: "16px", cursor: "pointer"
});
document.body.appendChild(btn);
