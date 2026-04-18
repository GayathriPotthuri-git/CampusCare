async function loadAuthorities() {
    try {
        const response = await fetch('http://localhost:3000/api/authorities');
        const authorities = await response.json();
        
        const container = document.getElementById('authoritiesContainer');
        container.innerHTML = '';
        
        Object.entries(authorities).forEach(([key, auth]) => {
            const card = document.createElement('div');
            card.className = 'authority-card';
            card.innerHTML = `
                <div class="authority-header">
                    <img src="${auth.image}" alt="${auth.head}" class="authority-image">
                    <h3>${auth.head}</h3>
                    <p>${auth.department}</p>
                </div>
                <div class="authority-body">
                    <div class="authority-info">
                        <span class="icon">📞</span>
                        <strong>Phone:</strong>
                        <span>${auth.contact}</span>
                    </div>
                    <div class="authority-info">
                        <span class="icon">📧</span>
                        <strong>Email:</strong>
                        <span>${auth.email}</span>
                    </div>
                    <div class="authority-info">
                        <span class="icon">💼</span>
                        <strong>Experience:</strong>
                        <span>${auth.experience}</span>
                    </div>
                    <div class="authority-info">
                        <span class="icon">🕐</span>
                        <strong>Available:</strong>
                        <span>${auth.availability}</span>
                    </div>
                    <button class="contact-button" onclick="contactAuthority('${auth.email}')">
                        Contact ${auth.head.split(' ')[1]}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading authorities:', error);
    }
}

function contactAuthority(email) {
    window.location.href = `mailto:${email}`;
}

loadAuthorities();
