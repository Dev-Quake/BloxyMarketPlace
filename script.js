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
    
    // Discord Login Handler
    const loginButton = document.querySelector('.btn-login');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            // Generate random state for security
            const state = Math.random().toString(36).substring(7);
            localStorage.setItem('discord_auth_state', state);
            
            // Get current domain for redirect URI
            const redirectUri = encodeURIComponent(`${window.location.origin}/api/discord/callback`);
            
            // Discord OAuth URL
            const discordUrl = `https://discord.com/oauth2/authorize?client_id=1408328312815747143&redirect_uri=${redirectUri}&response_type=code&scope=identify+guilds.join&state=${state}&prompt=none`;
            
            // Redirect to Discord
            window.location.href = discordUrl;
        });
    }
    
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
    
    // Check if user is logged in (on page load)
    checkLoginStatus();
});

// Check login status function
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/verify');
        const data = await response.json();
        
        if (data.loggedIn && data.user) {
            updateUIForLoggedInUser(data.user);
        }
    } catch (error) {
        console.log('Not logged in or error:', error);
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser(user) {
    const loginButton = document.querySelector('.btn-login');
    if (loginButton) {
        loginButton.innerHTML = `<i class="fas fa-user"></i> ${user.username}`;
        loginButton.style.backgroundColor = '#8b0000';
        loginButton.style.color = 'white';
        
        // Add logout functionality
        loginButton.onclick = function() {
            fetch('/api/discord/logout')
                .then(() => window.location.reload());
        };
    }
}
