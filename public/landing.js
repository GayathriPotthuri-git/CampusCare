function getToken() { return localStorage.getItem('cc_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('cc_user') || 'null'); }
function logout()   { localStorage.removeItem('cc_token'); localStorage.removeItem('cc_user'); window.location.href = 'login.html'; }

window.addEventListener('DOMContentLoaded', () => { updateNavbar(); });

function updateNavbar() {
  const user = getUser();
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  if (user) {
    const s = document.createElement('span');
    s.style.cssText = 'color:#0ea5e9;font-weight:600;font-size:13px;';
    s.textContent = `Hi, ${user.name.split(' ')[0]}`;

    const l = document.createElement('a');
    l.href = '#'; l.textContent = 'Logout';
    l.style.cssText = 'color:#ef4444;font-weight:600;';
    l.onclick = logout;

    navLinks.appendChild(s);
    navLinks.appendChild(l);
  } else {
    const b = document.createElement('a');
    b.href = 'login.html'; b.className = 'btn-nav'; b.textContent = 'Login';
    const r = navLinks.querySelector('.btn-nav');
    if (r) r.replaceWith(b);
  }
}
