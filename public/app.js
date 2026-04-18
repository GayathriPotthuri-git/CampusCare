// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem('cc_token');
}

function getUser() {
    return JSON.parse(localStorage.getItem('cc_user') || 'null');
}

function requireLogin() {
    if (!getToken()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ─── On page load ─────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
    if (!requireLogin()) return;

    const user = getUser();

    // Pre-fill reporter name from logged-in user
    const nameField = document.getElementById('reporterName');
    if (nameField && user) {
        nameField.value = user.name;
        nameField.readOnly = true;
    }

    // Update navbar
    updateNavbar();
});

function updateNavbar() {
    const user = getUser();
    if (!user) return;

    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Add user name + logout to navbar
    const existing = document.getElementById('nav-user-info');
    if (!existing) {
        const userInfo = document.createElement('span');
        userInfo.id = 'nav-user-info';
        userInfo.style.cssText = 'color:#667eea; font-weight:600; font-size:14px;';
        userInfo.textContent = `Hi, ${user.name.split(' ')[0]}`;

        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'color:#e74c3c; font-weight:600;';
        logoutBtn.onclick = logout;

        navLinks.appendChild(userInfo);
        navLinks.appendChild(logoutBtn);
    }
}

function logout() {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    window.location.href = 'login.html';
}

// ─── Complaint form submission ────────────────────────────────────────────────

const form = document.getElementById('complaintForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!requireLogin()) return;

    const formData = {
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        reporterContact: document.getElementById('reporterContact').value
    };

    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch('http://localhost:3000/api/complaints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.status === 401) {
            // Token expired, redirect to login
            window.location.href = 'login.html';
            return;
        }

        if (data.success) {
            messageDiv.className = 'message success';
            messageDiv.innerHTML = `
                <strong>Complaint Submitted Successfully!</strong><br>
                Assigned to: ${data.complaint.assignedTo.head} (${data.complaint.assignedTo.department})<br>
                Contact: ${data.complaint.assignedTo.contact}
            `;
            form.reset();

            // Re-fill name since we reset the form
            const user = getUser();
            const nameField = document.getElementById('reporterName');
            if (nameField && user) nameField.value = user.name;

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 7000);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.message || 'Error submitting complaint.';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Cannot connect to server. Please try again.';
        console.error('Error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Complaint';
    }
});
