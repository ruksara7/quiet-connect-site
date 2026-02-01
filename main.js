// Runs ONLY on chat.html
if (document.getElementById("chatForm")) {
  const socket = io("https://quiet-connect.onrender.com", {
    transports: ["websocket", "polling"]
  });

  const messages = document.getElementById("messages");
  const input = document.getElementById("input");

  socket.on("message", msg => {
    add(msg, "peer");
  });

  document.getElementById("chatForm").onsubmit = e => {
    e.preventDefault();
    if (!input.value.trim()) return;
    socket.emit("message", input.value);
    add(input.value, "me");
    input.value = "";
  };

  function add(text, cls) {
    const div = document.createElement("div");
    div.className = `msg ${cls}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
}
