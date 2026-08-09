// Advisor page — chat client
// Keeps conversation history in memory and re-sends it each turn
// (Gemini's API is stateless per-request, so the full history travels with every message)

(function () {
  const messagesEl = document.getElementById('advisor-messages');
  const inputEl    = document.getElementById('advisor-input');
  const sendBtn    = document.getElementById('advisor-send');

  if (!messagesEl || !inputEl || !sendBtn) return; // not on the advisor page

  let history = []; // [{ role: 'user'|'model', text }]
  let sending = false;

  function appendMessage(role, text, isTyping) {
    const wrap = document.createElement('div');
    wrap.className = `advisor-msg advisor-msg-${role === 'user' ? 'user' : 'bot'}`;
    if (isTyping) wrap.id = 'advisor-typing';

    const bubble = document.createElement('div');
    bubble.className = 'advisor-msg-bubble';
    bubble.innerHTML = isTyping
      ? '<span class="advisor-typing-dots"><span></span><span></span><span></span></span>'
      : escapeHtml(text).replace(/\n/g, '<br>');

    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function sendMessage() {
    const message = inputEl.value.trim();
    if (!message || sending) return;

    sending = true;
    inputEl.value = '';
    sendBtn.disabled = true;

    appendMessage('user', message);
    const typingEl = appendMessage('bot', '', true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      const data = await res.json();

      typingEl.remove();

      if (data.success) {
        appendMessage('bot', data.reply);
        history.push({ role: 'user', text: message });
        history.push({ role: 'model', text: data.reply });
      } else {
        appendMessage('bot', data.error || 'Something went wrong. 發生錯誤。');
      }
    } catch (err) {
      typingEl.remove();
      appendMessage('bot', 'Connection error — please try again. 連線錯誤，請再試一次。');
    } finally {
      sending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();