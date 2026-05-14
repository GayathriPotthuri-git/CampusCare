(function () {
  function getToken() { return localStorage.getItem('cc_token'); }
  function getUser() { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }
  function saveUser(u) { localStorage.setItem('cc_user', JSON.stringify(u)); }

  function logout() {
    fetch('/api/auth/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + getToken() } });
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    window.location.href = 'login.html';
  }

  function getInitials(name) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  }

  function getRoleColor(role) {
    return { admin: '#8b5cf6', faculty: '#0ea5e9', student: '#10b981' }[role] || '#64748b';
  }

  function injectStyles() {
    if (document.getElementById('pd-styles')) return;
    const s = document.createElement('style');
    s.id = 'pd-styles';
    s.textContent = `
      .pd-trigger { display:flex;align-items:center;gap:8px;cursor:pointer;position:relative; }
      .pd-avatar { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;border:2px solid rgba(255,255,255,0.3);flex-shrink:0; }
      .pd-name-sm { font-size:13px;font-weight:600;color:#0f172a;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
      .pd-chevron { font-size:10px;color:#64748b;transition:transform 0.2s; }
      .pd-trigger.open .pd-chevron { transform:rotate(180deg); }
      .pd-drop { position:absolute;top:calc(100% + 12px);right:0;width:300px;background:white;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 20px 60px rgba(0,0,0,0.15);z-index:9999;overflow:hidden;display:none; }
      .pd-drop.open { display:block;animation:pdIn 0.2s ease; }
      @keyframes pdIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      .pd-head { padding:20px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;gap:12px; }
      .pd-av-big { width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:white;background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.4);flex-shrink:0; }
      .pd-hinfo { flex:1;min-width:0; }
      .pd-hname { font-size:15px;font-weight:700;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
      .pd-hemail { font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
      .pd-role { display:inline-block;margin-top:6px;background:rgba(255,255,255,0.25);color:white;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px; }
      .pd-stats { display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #f1f5f9; }
      .pd-stat { padding:12px 8px;text-align:center;border-right:1px solid #f1f5f9; }
      .pd-stat:last-child { border-right:none; }
      .pd-stat-n { font-size:20px;font-weight:800;color:#0ea5e9; }
      .pd-stat-l { font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-top:2px; }
      .pd-details { padding:12px 16px;border-bottom:1px solid #f1f5f9; }
      .pd-drow { display:flex;align-items:center;gap:8px;padding:3px 0; }
      .pd-dtext { font-size:12px;color:#475569;font-weight:500; }
      .pd-edit { width:calc(100% - 32px);margin:12px 16px 0;padding:9px;border:2px solid #e2e8f0;border-radius:10px;background:white;font-size:13px;font-weight:600;color:#0ea5e9;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;display:block;text-align:center; }
      .pd-edit:hover { background:#f0f9ff;border-color:#0ea5e9; }
      .pd-logout { width:calc(100% - 32px);margin:10px 16px 16px;padding:9px;border:none;border-radius:10px;background:#fef2f2;font-size:13px;font-weight:600;color:#ef4444;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;display:block; }
      .pd-logout:hover { background:#fee2e2; }
      .pd-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center; }
      .pd-modal { background:white;border-radius:20px;padding:28px;width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:pdUp 0.2s ease; }
      @keyframes pdUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
      .pd-modal h3 { font-size:18px;font-weight:800;color:#0f172a;margin-bottom:20px; }
      .pd-field { margin-bottom:14px; }
      .pd-field label { display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px; }
      .pd-field input,.pd-field textarea { width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;color:#0f172a;outline:none;transition:border-color 0.2s;box-sizing:border-box; }
      .pd-field input:focus,.pd-field textarea:focus { border-color:#0ea5e9; }
      .pd-field input[readonly] { background:#f8fafc;color:#94a3b8;cursor:not-allowed; }
      .pd-actions { display:flex;gap:10px;margin-top:20px; }
      .pd-save { flex:1;padding:11px;background:linear-gradient(135deg,#0ea5e9,#10b981);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif; }
      .pd-cancel { flex:1;padding:11px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif; }
      .pd-msg { font-size:12px;margin-top:10px;padding:8px 12px;border-radius:8px;display:none; }
      .pd-msg.ok { background:#f0fdf4;color:#16a34a;display:block; }
      .pd-msg.err { background:#fef2f2;color:#ef4444;display:block; }
    `;
    document.head.appendChild(s);
  }

  async function fetchStats(token) {
    try {
      const res = await fetch('/api/complaints', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) return { total: 0, pending: 0, resolved: 0 };
      const data = await res.json();
      return { total: data.length, pending: data.filter(c => c.status === 'pending').length, resolved: data.filter(c => c.status === 'resolved').length };
    } catch { return { total: 0, pending: 0, resolved: 0 }; }
  }

  function openEditModal(user) {
    const ov = document.createElement('div');
    ov.className = 'pd-overlay';
    ov.innerHTML = `
      <div class="pd-modal">
        <h3>✏️ Edit Profile</h3>
        <div class="pd-field"><label>Full Name</label><input id="pd-name" value="${user.name||''}" placeholder="Your full name"></div>
        <div class="pd-field"><label>Email</label><input value="${user.email||''}" readonly></div>
        <div class="pd-field"><label>Phone Number</label><input id="pd-phone" value="${user.phone||''}" placeholder="e.g. 9876543210"></div>
        ${user.role==='student'?`<div class="pd-field"><label>Roll Number</label><input id="pd-roll" value="${user.rollNumber||''}" placeholder="e.g. 24R21A05KZ"></div>`:''}
        <div class="pd-field"><label>${user.role==='student'?'Department / Class':'Department'}</label><input id="pd-dept" value="${user.department||''}" placeholder="${user.role==='student'?'e.g. CSE - B':'e.g. Electrical Dept'}"></div>
        <div class="pd-field"><label>Bio (optional)</label><textarea id="pd-bio" rows="2">${user.bio||''}</textarea></div>
        <div class="pd-msg" id="pd-msg"></div>
        <div class="pd-actions">
          <button class="pd-cancel" id="pd-cancel">Cancel</button>
          <button class="pd-save" id="pd-save">Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById('pd-cancel').onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    document.getElementById('pd-save').onclick = async () => {
      const btn = document.getElementById('pd-save');
      const msg = document.getElementById('pd-msg');
      btn.textContent = 'Saving...'; btn.disabled = true; msg.className = 'pd-msg';
      const body = { name: document.getElementById('pd-name').value.trim(), phone: document.getElementById('pd-phone').value.trim(), department: document.getElementById('pd-dept').value.trim(), bio: document.getElementById('pd-bio').value.trim() };
      const rollEl = document.getElementById('pd-roll');
      if (rollEl) body.rollNumber = rollEl.value.trim();
      try {
        const res = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.success) {
          saveUser({ ...user, ...data.user });
          msg.textContent = '✅ Profile updated!'; msg.className = 'pd-msg ok';
          setTimeout(() => { ov.remove(); location.reload(); }, 1000);
        } else {
          msg.textContent = data.message || 'Failed.'; msg.className = 'pd-msg err';
          btn.textContent = 'Save Changes'; btn.disabled = false;
        }
      } catch { msg.textContent = 'Something went wrong.'; msg.className = 'pd-msg err'; btn.textContent = 'Save Changes'; btn.disabled = false; }
    };
  }

  async function init() {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;

    injectStyles();

    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    // Hide Report Issue for admin on all pages
    if (user.role === 'admin') {
      navLinks.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim();
        if (href.includes('index.html') && (text.includes('Report') || a.id === 'navReportIssue')) {
          a.style.display = 'none';
        }
      });
    }

    const initials = getInitials(user.name);
    const color = getRoleColor(user.role);

    const trigger = document.createElement('div');
    trigger.className = 'pd-trigger';
    trigger.innerHTML = `
      <div class="pd-avatar" style="background:${color}">${initials}</div>
      <span class="pd-name-sm">${user.name.split(' ')[0]}</span>
      <span class="pd-chevron">▼</span>
      <div class="pd-drop" id="pdDrop">
        <div class="pd-head">
          <div class="pd-av-big">${initials}</div>
          <div class="pd-hinfo">
            <div class="pd-hname">${user.name}</div>
            <div class="pd-hemail">${user.email}</div>
            <span class="pd-role">${user.role}</span>
          </div>
        </div>
        <div class="pd-stats">
          <div class="pd-stat"><div class="pd-stat-n" id="pdTotal">—</div><div class="pd-stat-l">Total</div></div>
          <div class="pd-stat"><div class="pd-stat-n" id="pdPending">—</div><div class="pd-stat-l">Pending</div></div>
          <div class="pd-stat"><div class="pd-stat-n" id="pdResolved">—</div><div class="pd-stat-l">Resolved</div></div>
        </div>
        <div class="pd-details" id="pdDetails"><div class="pd-drow"><span class="pd-dtext" style="color:#94a3b8">Click Edit to add your details</span></div></div>
        <button class="pd-edit" id="pdEdit">✏️ Edit Profile</button>
        <button class="pd-logout" id="pdLogout">🚪 Logout</button>
      </div>`;
    navLinks.appendChild(trigger);

    const drop = document.getElementById('pdDrop');
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      drop.classList.toggle('open');
      trigger.classList.toggle('open');
    });
    document.addEventListener('click', () => { drop.classList.remove('open'); trigger.classList.remove('open'); });
    drop.addEventListener('click', e => e.stopPropagation());

    document.getElementById('pdLogout').onclick = logout;
    document.getElementById('pdEdit').onclick = async () => {
      drop.classList.remove('open');
      try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (data.success) openEditModal(data.user); else openEditModal(user);
      } catch { openEditModal(user); }
    };

    fetchStats(token).then(s => {
      document.getElementById('pdTotal').textContent = s.total;
      document.getElementById('pdPending').textContent = s.pending;
      document.getElementById('pdResolved').textContent = s.resolved;
    });

    try {
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        const u = data.user;
        const rows = [];
        if (u.rollNumber) rows.push(`<div class="pd-drow"><span>🎓</span><span class="pd-dtext">${u.rollNumber}</span></div>`);
        if (u.department) rows.push(`<div class="pd-drow"><span>🏢</span><span class="pd-dtext">${u.department}</span></div>`);
        if (u.phone) rows.push(`<div class="pd-drow"><span>📱</span><span class="pd-dtext">${u.phone}</span></div>`);
        if (u.bio) rows.push(`<div class="pd-drow"><span>💬</span><span class="pd-dtext">${u.bio}</span></div>`);
        if (u.createdAt) rows.push(`<div class="pd-drow"><span>📅</span><span class="pd-dtext">Member since ${new Date(u.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span></div>`);
        if (rows.length) document.getElementById('pdDetails').innerHTML = rows.join('');
      }
    } catch {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();