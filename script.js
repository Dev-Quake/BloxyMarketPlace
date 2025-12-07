// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = 'none';
        }
    });
    
    // Animate stat numbers
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateNumber(element, target) {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString() + '+';
        }, 20);
    }
    
    // Start animation when stats come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.textContent);
                    animateNumber(stat, target);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(document.querySelector('.hero-stats'));
    
    // Check authentication status
    checkAuthStatus();
    
    // Handle login/logout clicks
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-login') || e.target.closest('#login-btn')) {
            e.preventDefault();
            window.location.href = '/api/auth/login';
        }
        
        if (e.target.closest('#logout-btn') || e.target.closest('.logout-link')) {
            e.preventDefault();
            logoutUser();
        }
    });
});

// Check if user is logged in
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        const authButtons = document.querySelector('.auth-buttons');
        
        if (data.authenticated && data.user) {
            updateUIForLoggedInUser(data.user, authButtons);
        } else {
            updateUIForGuest(authButtons);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        const authButtons = document.querySelector('.auth-buttons');
        updateUIForGuest(authButtons);
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser(user, authButtons) {
    const avatarUrl = user.avatar_url || 
        `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
    
    authButtons.innerHTML = `
        <div class="user-menu" style="position: relative;">
            <button class="btn user-btn" id="user-menu-btn" style="background: rgba(139, 0, 0, 0.1); border: 1px solid #8b0000; color: #f0f0f0; display: flex; align-items: center; gap: 10px; padding: 8px 16px;">
                <img src="${avatarUrl}" 
                     alt="${user.username}" 
                     style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #8b0000;">
                <span>${user.global_name || user.username}</span>
                <i class="fas fa-chevron-down" style="font-size: 12px;"></i>
            </button>
            <div class="user-dropdown" id="user-dropdown" style="position: absolute; top: 100%; right: 0; background: rgba(20, 20, 20, 0.98); border: 1px solid #8b0000; border-radius: 8px; padding: 15px; min-width: 200px; display: none; backdrop-filter: blur(10px); z-index: 1000; margin-top: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                <div style="padding: 10px 0; border-bottom: 1px solid #333; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #f0f0f0;">${user.global_name || user.username}</div>
                    <div style="font-size: 12px; color: #8b0000;">${user.username}#${user.discriminator}</div>
                </div>
                <a href="#" style="display: block; padding: 10px 0; color: #b0b0b0; text-decoration: none; transition: color 0.3s; border-bottom: 1px solid #222;">
                    <i class="fas fa-user" style="width: 20px; margin-right: 10px;"></i> Profile
                </a>
                <a href="#" style="display: block; padding: 10px 0; color: #b0b0b0; text-decoration: none; transition: color 0.3s; border-bottom: 1px solid #222;">
                    <i class="fas fa-shopping-cart" style="width: 20px; margin-right: 10px;"></i> Purchases
                </a>
                <a href="#" style="display: block; padding: 10px 0; color: #b0b0b0; text-decoration: none; transition: color 0.3s; border-bottom: 1px solid #222;">
                    <i class="fas fa-cog" style="width: 20px; margin-right: 10px;"></i> Settings
                </a>
                <a href="#" id="logout-btn" class="logout-link" style="display: block; padding: 10px 0; color: #ff4444; text-decoration: none; transition: color 0.3s; margin-top: 10px;">
                    <i class="fas fa-sign-out-alt" style="width: 20px; margin-right: 10px;"></i> Logout
                </a>
            </div>
        </div>
    `;
    
    // Add dropdown toggle functionality
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = userDropdown.style.display === 'block';
        userDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    document.addEventListener('click', function(e) {
        if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
            userDropdown.style.display = 'none';
        }
    });
    
    // Update welcome message if it exists
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome back, ${user.global_name || user.username}!`;
    }
}

// Update UI for guest (not logged in)
function updateUIForGuest(authButtons) {
    authButtons.innerHTML = `
        <button class="btn btn-login" id="login-btn">
            <i class="fab fa-discord"></i> Login with Discord
        </button>
    `;
}

// Logout function
async function logoutUser() {
    try {
        const response = await fetch('/api/auth/logout');
        
        if (response.ok) {
            window.location.reload();
        } else {
            console.error('Logout failed');
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.reload();
    }
}