function getToken() { return localStorage.getItem('cc_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }

function logout() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_user');
  window.location.href = 'login.html';
}

let allComplaints = [];
let categoryChartInstance = null;
let statusChartInstance = null;

window.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) { window.location.href = 'login.html'; return; }

  const user = getUser();
  const navLinks = document.getElementById('navLinks');

  if (navLinks && user) {
    const userInfo = document.createElement('span');
    userInfo.style.cssText = 'color:#0ea5e9;font-weight:600;font-size:13px;';
    userInfo.textContent = `Hi, ${user.name.split(' ')[0]}`;

    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.cssText = 'color:#ef4444;font-weight:600;';
    logoutBtn.onclick = logout;

    navLinks.appendChild(userInfo);
    navLinks.appendChild(logoutBtn);
  }

  if (user) {
    const badge = document.getElementById('roleBadge');
    if (badge) {
      badge.textContent = user.role.toUpperCase();
      badge.style.display = 'inline-block';
    }

    const sub = document.getElementById('dashSubtitle');
    if (user.role === 'admin') {
      if (sub) sub.textContent = 'All campus complaints — Admin View';
      const chartsSection = document.getElementById('chartsSection');
      if (chartsSection) chartsSection.style.display = 'grid';
    } else {
      if (sub) sub.textContent = 'Your submitted complaints';
    }
  }

  loadComplaints();
  setInterval(loadComplaints, 15000);
});

async function loadComplaints() {
  try {
    const res = await fetch('/api/complaints', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });

    if (res.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = 'login.html';
      return;
    }

    allComplaints = await res.json();
    const user = getUser();

    // Update stat cards
    document.getElementById('totalCount').textContent = allComplaints.length;
    document.getElementById('pendingCount').textContent = allComplaints.filter(c => c.status === 'pending').length;
    document.getElementById('inProgressCount').textContent = allComplaints.filter(c => c.status === 'in-progress').length;
    document.getElementById('resolvedCount').textContent = allComplaints.filter(c => c.status === 'resolved').length;

    // Render charts for admin
    if (user && user.role === 'admin') {
      renderCharts(allComplaints);
    }

    // Render complaints list
    renderComplaints(allComplaints);

  } catch (err) {
    console.error('Error loading complaints:', err);
  }
}

function renderCharts(complaints) {
  const categories = ['plumbing', 'electrical', 'water', 'network', 'maintenance', 'other'];
  const categoryLabels = ['Plumbing', 'Electrical', 'Water', 'Network', 'Maintenance', 'Other'];
  const categoryColors = ['#0ea5e9','#f59e0b','#10b981','#8b5cf6','#ef4444','#64748b'];

  const categoryCounts = categories.map(cat => complaints.filter(c => c.category === cat).length);

  // Category bar chart
  const catCtx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(catCtx, {
    type: 'bar',
    data: {
      labels: categoryLabels,
      datasets: [{
        label: 'Complaints',
        data: categoryCounts,
        backgroundColor: categoryColors,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Status doughnut chart
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  if (statusChartInstance) statusChartInstance.destroy();
  statusChartInstance = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'Resolved'],
      datasets: [{
        data: [
          complaints.filter(c => c.status === 'pending').length,
          complaints.filter(c => c.status === 'in-progress').length,
          complaints.filter(c => c.status === 'resolved').length,
        ],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, font: { size: 12, weight: '600' } }
        }
      }
    }
  });
}

function filterComplaints(status, btn) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtered = status === 'all' ? allComplaints : allComplaints.filter(c => c.status === status);
  renderComplaints(filtered);
}

function getTimeline(status) {
  const steps = [
    { label: 'Submitted', key: 'pending' },
    { label: 'In Progress', key: 'in-progress' },
    { label: 'Resolved', key: 'resolved' }
  ];
  const order = { 'pending': 0, 'in-progress': 1, 'resolved': 2 };
  const current = order[status] ?? 0;

  return `<div class="timeline">
    ${steps.map((step, i) => {
      let cls = '';
      if (i < current) cls = 'done';
      else if (i === current) cls = 'current';
      const icon = i < current ? '✓' : (i === current ? '●' : '');
      return `<div class="timeline-step ${cls}">
        <div class="timeline-dot">${icon}</div>
        <div class="timeline-label">${step.label}</div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderComplaints(complaints) {
  const user = getUser();
  const container = document.getElementById('complaintsContainer');

  if (complaints.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="emoji">📭</div>
      <p>No complaints found.</p>
    </div>`;
    return;
  }

  container.innerHTML = [...complaints].reverse().map(c => `
    <div class="complaint-card">
      <div class="complaint-header">
        <span class="complaint-category">${c.category}</span>
        <span class="complaint-status status-${c.status}">${c.status.replace('-',' ')}</span>
      </div>
      <div class="complaint-info"><strong>📍 Location:</strong> ${c.location}</div>
      <div class="complaint-info"><strong>📝 Issue:</strong> ${c.description}</div>
      <div class="complaint-info"><strong>👤 Reporter:</strong> ${c.reporterName} · ${c.reporterEmail} · <span style="text-transform:capitalize;color:#8b5cf6;">${c.reporterRole}</span></div>
      <div class="complaint-info"><strong>🏢 Assigned to:</strong> ${c.assignedTo.head} — ${c.assignedTo.department}</div>
      <div class="complaint-info"><strong>🕐 Submitted:</strong> ${new Date(c.timestamp).toLocaleString()}</div>
      ${c.updatedAt ? `<div class="complaint-info"><strong>🔄 Updated:</strong> ${new Date(c.updatedAt).toLocaleString()} ${c.resolvedBy ? `by ${c.resolvedBy}` : ''}</div>` : ''}
      ${getTimeline(c.status)}
      ${user && user.role === 'admin' && c.status !== 'resolved' ? `
        <div class="complaint-actions">
          ${c.status === 'pending' ? `<button class="btn-action btn-inprogress" onclick="updateStatus(${c.id},'in-progress')">🔧 Mark In Progress</button>` : ''}
          <button class="btn-action btn-resolved" onclick="updateStatus(${c.id},'resolved')">✅ Mark Resolved</button>
        </div>` : ''}
    </div>
  `).join('');
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify({ status })
    });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    if (res.ok) loadComplaints();
  } catch (err) { console.error(err); }
}