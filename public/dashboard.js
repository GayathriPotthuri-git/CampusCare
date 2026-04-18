function getToken() { return localStorage.getItem('cc_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }

function logout() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_user');
  window.location.href = 'login.html';
}

window.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) { window.location.href = 'login.html'; return; }

  const user = getUser();
  const navLinks = document.getElementById('navLinks');

  if (navLinks && user) {
    const userInfo = document.createElement('span');
    userInfo.style.cssText = 'color:#0ea5e9;font-weight:600;font-size:13px;';
    userInfo.textContent = `Hi, ${user.name.split(' ')[0]} (${user.role})`;

    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.cssText = 'color:#ef4444;font-weight:600;';
    logoutBtn.onclick = logout;

    navLinks.appendChild(userInfo);
    navLinks.appendChild(logoutBtn);
  }

  if (user && user.role !== 'admin') {
    const sub = document.getElementById('dashSubtitle');
    if (sub) sub.textContent = 'Your submitted complaints';
  }

  loadComplaints();
  setInterval(loadComplaints, 10000);
});

async function loadComplaints() {
  try {
    const res = await fetch('http://localhost:3000/api/complaints', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });

    if (res.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = 'login.html';
      return;
    }

    const complaints = await res.json();
    const user = getUser();

    document.getElementById('totalCount').textContent = complaints.length;
    document.getElementById('pendingCount').textContent = complaints.filter(c => c.status === 'pending').length;
    document.getElementById('inProgressCount').textContent = complaints.filter(c => c.status === 'in-progress').length;
    document.getElementById('resolvedCount').textContent = complaints.filter(c => c.status === 'resolved').length;

    const container = document.getElementById('complaintsContainer');

    if (complaints.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px;font-size:15px;">No complaints yet.</p>';
      return;
    }

    container.innerHTML = [...complaints].reverse().map(c => `
      <div class="complaint-card">
        <div class="complaint-header">
          <span class="complaint-category">${c.category}</span>
          <span class="complaint-status status-${c.status}">${c.status.replace('-',' ')}</span>
        </div>
        <div class="complaint-info"><strong>Location:</strong> ${c.location}</div>
        <div class="complaint-info"><strong>Issue:</strong> ${c.description}</div>
        <div class="complaint-info"><strong>Reporter:</strong> ${c.reporterName} · ${c.reporterEmail}</div>
        <div class="complaint-info"><strong>Assigned to:</strong> ${c.assignedTo.head} — ${c.assignedTo.department}</div>
        <div class="complaint-info"><strong>Submitted:</strong> ${new Date(c.timestamp).toLocaleString()}</div>
        ${c.updatedAt ? `<div class="complaint-info"><strong>Updated:</strong> ${new Date(c.updatedAt).toLocaleString()}</div>` : ''}
        ${user && user.role === 'admin' && c.status !== 'resolved' ? `
          <div class="complaint-actions">
            ${c.status === 'pending' ? `<button class="btn-resolve" onclick="updateStatus(${c.id},'in-progress')">Mark In Progress</button>` : ''}
            <button class="btn-resolve" onclick="updateStatus(${c.id},'resolved')">Mark Resolved</button>
          </div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading complaints:', err);
  }
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`http://localhost:3000/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ status })
    });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    if (res.ok) loadComplaints();
  } catch (err) { console.error(err); }
}
