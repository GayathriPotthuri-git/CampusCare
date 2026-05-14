function getToken() { return localStorage.getItem('cc_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }

let allComplaints = [];
let catChart = null;
let statusChart = null;

window.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) { window.location.href = 'login.html'; return; }

  const user = getUser();
  if (!user) { window.location.href = 'login.html'; return; }

  // Role badge
  const badge = document.getElementById('roleBadge');
  if (badge) { badge.textContent = user.role.toUpperCase(); badge.style.display = 'inline-block'; }

  // Subtitle
  const sub = document.getElementById('dashSubtitle');
  if (user.role === 'admin') {
    if (sub) sub.textContent = 'All campus complaints — Admin View';
    const charts = document.getElementById('chartsSection');
    if (charts) charts.style.display = 'grid';
  } else {
    if (sub) sub.textContent = 'Your submitted complaints';
  }

  // Hide Report Issue from admin navbar
  if (user.role === 'admin') {
    const navReport = document.getElementById('navReportIssue');
    if (navReport) navReport.style.display = 'none';
  }

  loadComplaints();
  setInterval(loadComplaints, 15000);
});

async function loadComplaints() {
  try {
    const res = await fetch('/api/complaints', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    allComplaints = await res.json();

    document.getElementById('totalCount').textContent = allComplaints.length;
    document.getElementById('pendingCount').textContent = allComplaints.filter(c => c.status === 'pending').length;
    document.getElementById('inProgressCount').textContent = allComplaints.filter(c => c.status === 'in-progress').length;
    document.getElementById('resolvedCount').textContent = allComplaints.filter(c => c.status === 'resolved').length;

    const user = getUser();
    if (user && user.role === 'admin') renderCharts(allComplaints);
    renderComplaints(allComplaints);
  } catch (err) { console.error(err); }
}

function renderCharts(complaints) {
  const cats    = ['plumbing','electrical','water','network','maintenance','other'];
  const labels  = ['Plumbing','Electrical','Water','Network','Maintenance','Other'];
  const colors  = ['#0ea5e9','#f59e0b','#10b981','#8b5cf6','#ef4444','#64748b'];
  const counts  = cats.map(c => complaints.filter(x => x.category === c).length);

  const catCtx = document.getElementById('categoryChart').getContext('2d');
  if (catChart) catChart.destroy();
  catChart = new Chart(catCtx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Complaints', data: counts, backgroundColor: colors, borderRadius: 8, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
  });

  const stCtx = document.getElementById('statusChart').getContext('2d');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(stCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending','In Progress','Resolved'],
      datasets: [{ data: [complaints.filter(c=>c.status==='pending').length, complaints.filter(c=>c.status==='in-progress').length, complaints.filter(c=>c.status==='resolved').length], backgroundColor: ['#f59e0b','#3b82f6','#10b981'], borderWidth: 0, hoverOffset: 8 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12, weight: '600' } } } } }
  });
}

function filterComplaints(status, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'all' ? allComplaints : allComplaints.filter(c => c.status === status);
  renderComplaints(filtered);
}

function getTimeline(status) {
  const steps = [{ label: 'Submitted' }, { label: 'In Progress' }, { label: 'Resolved' }];
  const order = { 'pending': 0, 'in-progress': 1, 'resolved': 2 };
  const cur = order[status] ?? 0;
  return `<div class="timeline">${steps.map((s, i) => {
    const cls = i < cur ? 'done' : i === cur ? 'current' : '';
    const icon = i < cur ? '✓' : i === cur ? '●' : '';
    return `<div class="tl-step ${cls}"><div class="tl-dot">${icon}</div><div class="tl-label">${s.label}</div></div>`;
  }).join('')}</div>`;
}

function renderComplaints(complaints) {
  const user = getUser();
  const container = document.getElementById('complaintsContainer');
  if (complaints.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>No complaints found.</p></div>`;
    return;
  }
  container.innerHTML = [...complaints].reverse().map(c => `
    <div class="complaint-card">
      <div class="cc-header">
        <span class="cc-category">${c.category}</span>
        <span class="cc-status status-${c.status}">${c.status.replace('-',' ')}</span>
      </div>
      <div class="cc-info"><strong>📍 Location:</strong> ${c.location}</div>
      <div class="cc-info"><strong>📝 Issue:</strong> ${c.description}</div>
      <div class="cc-info"><strong>👤 Reporter:</strong> ${c.reporterName} · ${c.reporterEmail}</div>
      <div class="cc-info"><strong>🏢 Assigned to:</strong> ${c.assignedTo.head} — ${c.assignedTo.department}</div>
      <div class="cc-info"><strong>🕐 Submitted:</strong> ${new Date(c.timestamp).toLocaleString()}</div>
      ${c.updatedAt ? `<div class="cc-info"><strong>🔄 Updated:</strong> ${new Date(c.updatedAt).toLocaleString()}</div>` : ''}
      ${getTimeline(c.status)}
      ${user && user.role === 'admin' && c.status !== 'resolved' ? `
        <div class="cc-actions">
          ${c.status === 'pending' ? `<button class="btn-action btn-inprogress" onclick="updateStatus(${c.id},'in-progress')">🔧 Mark In Progress</button>` : ''}
          <button class="btn-action btn-resolved" onclick="updateStatus(${c.id},'resolved')">✅ Mark Resolved</button>
        </div>` : ''}
    </div>`).join('');
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