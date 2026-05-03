/* ── CampusCare Chatbot Widget ── */

(function() {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #cc-chat-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      border: none; cursor: pointer; box-shadow: 0 8px 24px rgba(14,165,233,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; transition: all 0.3s; color: white;
    }
    #cc-chat-btn:hover { transform: scale(1.1); box-shadow: 0 12px 32px rgba(14,165,233,0.5); }
    #cc-chat-btn::after {
      content: ''; position: absolute; width: 100%; height: 100%;
      border-radius: 50%; background: linear-gradient(135deg, #0ea5e9, #10b981);
      animation: ccPulse 2s infinite; z-index: -1;
    }
    @keyframes ccPulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.6);opacity:0} }
    #cc-chat-btn { position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      border: none; cursor: pointer; box-shadow: 0 8px 24px rgba(14,165,233,0.4);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s; color: white; }

    #cc-chat-box {
      position: fixed; bottom: 96px; right: 28px; z-index: 9999;
      width: 340px; height: 480px;
      background: white; border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      display: none; flex-direction: column;
      font-family: Inter, sans-serif;
      overflow: hidden;
      animation: chatSlideIn 0.3s ease;
    }
    @keyframes chatSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

    #cc-chat-header {
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      padding: 16px 20px; color: white;
      display: flex; align-items: center; justify-content: space-between;
    }
    #cc-chat-header .title { font-size: 15px; font-weight: 700; }
    #cc-chat-header .sub { font-size: 11px; opacity: 0.85; margin-top: 2px; }
    #cc-chat-close {
      background: rgba(255,255,255,0.2); border: none; color: white;
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      font-size: 16px; display: flex; align-items: center; justify-content: center;
    }

    #cc-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .cc-msg {
      max-width: 85%; padding: 10px 14px; border-radius: 14px;
      font-size: 13px; line-height: 1.5;
    }
    .cc-msg.bot {
      background: #f1f5f9; color: #0f172a;
      border-bottom-left-radius: 4px; align-self: flex-start;
    }
    .cc-msg.user {
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      color: white; border-bottom-right-radius: 4px; align-self: flex-end;
    }
    .cc-msg.typing { color: #94a3b8; font-style: italic; }

    #cc-chat-input-area {
      padding: 12px 16px; border-top: 1px solid #e2e8f0;
      display: flex; gap: 8px;
    }
    #cc-chat-input {
      flex: 1; padding: 10px 14px; border: 2px solid #e2e8f0;
      border-radius: 10px; font-size: 13px; font-family: Inter, sans-serif;
      outline: none; transition: border-color 0.2s;
    }
    #cc-chat-input:focus { border-color: #0ea5e9; }
    #cc-chat-send {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      border: none; cursor: pointer; color: white;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s; flex-shrink: 0;
    }
    #cc-chat-send:hover { opacity: 0.9; }

    .cc-quick-btns {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
    }
    .cc-quick-btn {
      padding: 5px 12px; background: #e0f2fe; color: #0369a1;
      border: none; border-radius: 20px; font-size: 11px; font-weight: 600;
      cursor: pointer; font-family: Inter, sans-serif; transition: all 0.2s;
    }
    .cc-quick-btn:hover { background: #0ea5e9; color: white; }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const btn = document.createElement('button');
  btn.id = 'cc-chat-btn';
  btn.innerHTML = `<svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  btn.title = 'CampusCare Assistant';

  const box = document.createElement('div');
  box.id = 'cc-chat-box';
  box.innerHTML = `
    <div id="cc-chat-header">
      <div>
        <div class="title">⚡ CampusCare Assistant</div>
        <div class="sub">Ask me anything about campus</div>
      </div>
      <button id="cc-chat-close">✕</button>
    </div>
    <div id="cc-chat-messages">
      <div class="cc-msg bot">
        Hi! I'm your CampusCare Assistant 👋<br>I can help you with complaints, announcements, and department contacts.
        <div class="cc-quick-btns">
          <button class="cc-quick-btn" onclick="ccQuick('How do I report an issue?')">Report issue</button>
          <button class="cc-quick-btn" onclick="ccQuick('Show latest announcements')">Announcements</button>
          <button class="cc-quick-btn" onclick="ccQuick('Show department contacts')">Contacts</button>
        </div>
      </div>
    </div>
    <div id="cc-chat-input-area">
      <input id="cc-chat-input" type="text" placeholder="Ask something..." />
      <button id="cc-chat-send">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(box);

  // Toggle chat
  btn.onclick = () => {
    const isOpen = box.style.display === 'flex';
    box.style.display = isOpen ? 'none' : 'flex';
    btn.innerHTML = isOpen ? `<svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` : '✕';
    if (!isOpen) document.getElementById('cc-chat-input').focus();
  };

  document.getElementById('cc-chat-close').onclick = () => {
    box.style.display = 'none';
    btn.innerHTML = `<svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  };

  // Send message
  async function sendMessage(text) {
    if (!text.trim()) return;

    const messages = document.getElementById('cc-chat-messages');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'cc-msg user';
    userMsg.textContent = text;
    messages.appendChild(userMsg);

    // Add typing indicator
    const typing = document.createElement('div');
    typing.className = 'cc-msg bot typing';
    typing.textContent = 'Typing...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      typing.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'cc-msg bot';
      botMsg.textContent = data.reply;
      messages.appendChild(botMsg);
    } catch {
      typing.textContent = 'Sorry, could not connect. Please try again.';
    }

    messages.scrollTop = messages.scrollHeight;
  }

  // Send on button click
  document.getElementById('cc-chat-send').onclick = () => {
    const input = document.getElementById('cc-chat-input');
    sendMessage(input.value);
    input.value = '';
  };

  // Send on Enter
  document.getElementById('cc-chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = document.getElementById('cc-chat-input');
      sendMessage(input.value);
      input.value = '';
    }
  });

  // Quick buttons
  window.ccQuick = (text) => sendMessage(text);
})();
