function getToken() { return localStorage.getItem('cc_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }

function requireLogin() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

window.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin()) return;
  const user = getUser();
  const nameField = document.getElementById('reporterName');
  if (nameField && user) { nameField.value = user.name; nameField.readOnly = true; }
  updateNavbar();
});

function updateNavbar() {
  const user = getUser();
  if (!user) return;
  const navLinks = document.querySelector('.nav-links') || document.getElementById('navLinks');
  if (!navLinks || document.getElementById('nav-user-info')) return;

  const s = document.createElement('span');
  s.id = 'nav-user-info';
  s.style.cssText = 'color:#0ea5e9;font-weight:600;font-size:13px;';
  s.textContent = `Hi, ${user.name.split(' ')[0]}`;

  const l = document.createElement('a');
  l.href = '#'; l.textContent = 'Logout';
  l.style.cssText = 'color:#ef4444;font-weight:600;';
  l.onclick = logout;

  navLinks.appendChild(s);
  navLinks.appendChild(l);
}

function logout() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_user');
  window.location.href = 'login.html';
}

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

  const btn = form.querySelector('.btn-submit');
  btn.disabled = true; btn.textContent = 'Submitting...';

  try {
    const res = await fetch('http://localhost:3000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.status === 401) { window.location.href = 'login.html'; return; }

    if (data.success) {
      messageDiv.className = 'message success';
      messageDiv.innerHTML = `<strong>Complaint submitted!</strong><br>Assigned to: ${data.complaint.assignedTo.head} (${data.complaint.assignedTo.department})`;
      form.reset();
      const user = getUser();
      const nameField = document.getElementById('reporterName');
      if (nameField && user) nameField.value = user.name;
      setTimeout(() => { messageDiv.style.display = 'none'; }, 7000);
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = data.message || 'Error submitting complaint.';
    }
  } catch {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Cannot connect to server. Please try again.';
  } finally {
    btn.disabled = false; btn.textContent = 'Submit Complaint';
  }
});
