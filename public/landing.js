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
    updateNavbar();
    loadStats();
    setInterval(loadStats, 30000);
});

function updateNavbar() {
    const user = getUser();
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    if (user) {
        // Logged in — show name and logout
        const userInfo = document.createElement('span');
        userInfo.style.cssText = 'color:#667eea; font-weight:600; font-size:14px;';
        userInfo.textContent = `Hi, ${user.name.split(' ')[0]}`;

        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'color:#e74c3c; font-weight:600;';
        logoutBtn.onclick = logout;

        navLinks.appendChild(userInfo);
        navLinks.appendChild(logoutBtn);
    } else {
        // Not logged in — show Login button
        const loginBtn = document.createElement('a');
        loginBtn.href = 'login.html';
        loginBtn.className = 'btn-nav';
        loginBtn.textContent = 'Login';
        // Replace the Report Issue button with Login if not logged in
        const reportBtn = navLinks.querySelector('.btn-nav');
        if (reportBtn) reportBtn.replaceWith(loginBtn);
    }
}

// ─── Load stats ───────────────────────────────────────────────────────────────

async function loadStats() {
    try {
        const token = getToken();
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

        const response = await fetch('http://localhost:3000/api/stats', { headers });

        if (!response.ok) return; // Not logged in, just skip stats

        const stats = await response.json();

        animateValue('totalIssues', 0, stats.total, 2000);
        animateValue('resolvedIssues', 0, stats.resolved, 2000);
        animateValue('activeIssues', 0, stats.pending, 2000);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}
