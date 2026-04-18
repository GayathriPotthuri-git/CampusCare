// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem('cc_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }

function logout() {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    window.location.href = 'login.html';
}

// ─── On page load ─────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getUser();

    // Show welcome + logout in navbar
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && user) {
        const userInfo = document.createElement('span');
        userInfo.style.cssText = 'color:#667eea; font-weight:600; font-size:14px;';
        userInfo.textContent = `Hi, ${user.name.split(' ')[0]} (${user.role})`;

        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'color:#e74c3c; font-weight:600;';
        logoutBtn.onclick = logout;

        navLinks.appendChild(userInfo);
        navLinks.appendChild(logoutBtn);
    }

    // Show admin-only note if student lands here
    if (user && user.role !== 'admin') {
        const header = document.querySelector('header p');
        if (header) header.textContent = 'Showing your submitted complaints';
    }

    loadComplaints();
    setInterval(loadComplaints, 10000);
});

// ─── Load complaints ──────────────────────────────────────────────────────────

async function loadComplaints() {
    try {
        const response = await fetch('http://localhost:3000/api/complaints', {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        const complaints = await response.json();
        const user = getUser();

        // Update stats
        document.getElementById('totalCount').textContent = complaints.length;
        document.getElementById('pendingCount').textContent =
            complaints.filter(c => c.status === 'pending').length;
        document.getElementById('resolvedCount').textContent =
            complaints.filter(c => c.status === 'resolved').length;

        // Display complaints
        const container = document.getElementById('complaintsContainer');
        container.innerHTML = '';

        if (complaints.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">No complaints yet.</p>';
            return;
        }

        [...complaints].reverse().forEach(complaint => {
            const card = document.createElement('div');
            card.className = 'complaint-card';
            card.innerHTML = `
                <div class="complaint-header">
                    <span class="complaint-category">${complaint.category.toUpperCase()}</span>
                    <span class="complaint-status status-${complaint.status}">${complaint.status.toUpperCase()}</span>
                </div>
                <div class="complaint-info"><strong>Location:</strong> ${complaint.location}</div>
                <div class="complaint-info"><strong>Description:</strong> ${complaint.description}</div>
                <div class="complaint-info"><strong>Reporter:</strong> ${complaint.reporterName} (${complaint.reporterEmail})</div>
                <div class="complaint-info"><strong>Assigned to:</strong> ${complaint.assignedTo.head} — ${complaint.assignedTo.department}</div>
                <div class="complaint-info"><strong>Contact:</strong> ${complaint.assignedTo.contact} | ${complaint.assignedTo.email}</div>
                <div class="complaint-info"><strong>Submitted:</strong> ${new Date(complaint.timestamp).toLocaleString()}</div>
                ${complaint.updatedAt ? `<div class="complaint-info"><strong>Last updated:</strong> ${new Date(complaint.updatedAt).toLocaleString()}</div>` : ''}
                ${user && user.role === 'admin' && complaint.status !== 'resolved' ? `
                    <div class="complaint-actions">
                        ${complaint.status === 'pending' ? `<button class="btn-resolve" style="margin-right:8px" onclick="updateStatus(${complaint.id}, 'in-progress')">Mark In Progress</button>` : ''}
                        <button class="btn-resolve" onclick="updateStatus(${complaint.id}, 'resolved')">Mark Resolved</button>
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

// ─── Update status ────────────────────────────────────────────────────────────

async function updateStatus(id, status) {
    try {
        const response = await fetch(`http://localhost:3000/api/complaints/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({ status })
        });

        if (response.status === 401) { window.location.href = 'login.html'; return; }
        if (response.ok) loadComplaints();
    } catch (error) {
        console.error('Error updating complaint:', error);
    }
}
