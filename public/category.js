// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem('cc_token'); }

// ─── Category data ────────────────────────────────────────────────────────────

const categoryData = {
    plumbing: {
        title: 'Plumbing Services', icon: '🚰', color: '#3498db',
        description: 'Expert plumbing solutions for all your water and drainage needs',
        issues: ['🚽 Clogged Toilets','🚿 Leaking Faucets','💧 Water Pressure Issues','🔧 Pipe Repairs','🚰 Sink Problems','⚠️ Emergency Leaks']
    },
    electrical: {
        title: 'Electrical Services', icon: '⚡', color: '#f39c12',
        description: 'Professional electrical maintenance and emergency repairs',
        issues: ['💡 Light Fixtures','🔌 Power Outlets','⚡ Circuit Breakers','🔦 Emergency Lighting','🎛️ Switch Repairs','⚠️ Electrical Hazards']
    },
    water: {
        title: 'Water Supply', icon: '💧', color: '#1abc9c',
        description: 'Ensuring clean and consistent water supply across campus',
        issues: ['💧 No Water Supply','🚰 Low Water Pressure','⚠️ Water Quality Issues','🔧 Valve Problems','💦 Water Leakage','🚱 Contamination Reports']
    },
    network: {
        title: 'IT & Network Support', icon: '💻', color: '#9b59b6',
        description: 'Technical support for all your connectivity and IT needs',
        issues: ['📡 WiFi Connectivity','🔌 Ethernet Issues','💻 Computer Problems','🖨️ Printer Setup','🔐 Password Reset','⚠️ Network Outages']
    },
    maintenance: {
        title: 'General Maintenance', icon: '🔧', color: '#e74c3c',
        description: 'Comprehensive maintenance services for campus facilities',
        issues: ['🚪 Door Repairs','🪟 Window Issues','🎨 Paint & Walls','🪑 Furniture Repair','🧹 Cleaning Services','🔨 General Repairs']
    },
    other: {
        title: 'Other Services', icon: '📋', color: '#34495e',
        description: 'Administrative support and miscellaneous campus services',
        issues: ['📝 General Inquiries','🏢 Facility Booking','📞 Information Desk','🎓 Student Services','📦 Lost & Found','❓ Other Concerns']
    }
};

// ─── Load page ────────────────────────────────────────────────────────────────

async function loadCategoryPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryType = urlParams.get('type') || 'maintenance';
    const category = categoryData[categoryType];

    if (!category) { window.location.href = 'landing.html'; return; }

    // Hero section
    const heroSection = document.getElementById('categoryHero');
    heroSection.style.background = `linear-gradient(135deg, ${category.color} 0%, ${adjustColor(category.color, -30)} 100%)`;
    heroSection.innerHTML = `
        <div class="category-hero-content">
            <div class="category-icon">${category.icon}</div>
            <h1>${category.title}</h1>
            <p>${category.description}</p>
        </div>
    `;

    // Issues grid
    document.getElementById('issuesGrid').innerHTML = category.issues.map(issue => `
        <div class="issue-card"><span class="issue-text">${issue}</span></div>
    `).join('');

    // Authority info — no auth needed
    try {
        const res = await fetch('http://localhost:3000/api/authorities');
        const authorities = await res.json();
        const authority = authorities[categoryType];
        if (authority) {
            document.getElementById('authorityCard').innerHTML = `
                <div class="authority-card-inline">
                    <img src="${authority.image}" alt="${authority.head}" class="authority-image-small">
                    <div class="authority-details">
                        <h3>${authority.head}</h3>
                        <p class="authority-dept">${authority.department}</p>
                        <div class="authority-contact-info">
                            <span>📞 ${authority.contact}</span>
                            <span>📧 ${authority.email}</span>
                        </div>
                        <p class="authority-exp">Experience: ${authority.experience} | ${authority.availability}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading authority:', error);
    }

    // Recent reports — needs auth token
    const token = getToken();
    if (!token) {
        document.getElementById('recentReports').innerHTML =
            '<p class="no-reports"><a href="login.html">Log in</a> to see recent reports.</p>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/complaints', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const complaints = await res.json();
        const categoryComplaints = complaints
            .filter(c => c.category === categoryType)
            .slice(-3).reverse();

        const reportsContainer = document.getElementById('recentReports');
        if (categoryComplaints.length === 0) {
            reportsContainer.innerHTML = '<p class="no-reports">No recent reports in this category.</p>';
        } else {
            reportsContainer.innerHTML = categoryComplaints.map(complaint => `
                <div class="report-card">
                    <div class="report-header">
                        <span class="report-location">📍 ${complaint.location}</span>
                        <span class="report-status status-${complaint.status}">${complaint.status}</span>
                    </div>
                    <p class="report-desc">${complaint.description}</p>
                    <p class="report-time">${new Date(complaint.timestamp).toLocaleString()}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

function adjustColor(color, amount) {
    const clamp = (num) => Math.min(Math.max(num, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

loadCategoryPage();
