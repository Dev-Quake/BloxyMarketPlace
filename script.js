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
            loginWithDiscord();
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

// Discord Login Function
function loginWithDiscord() {
    // Your Discord Bot/Application ID
    const clientId = '1408328312815747143';
    
    // Your redirect URI (must match Discord Developer Portal)
    const redirectUri = encodeURIComponent('https://bloxymarketplace.vercel.app/api/discord/callback');
    
    // Generate random state for security
    const state = Math.random().toString(36).substring(7);
    
    // Store state in localStorage for verification
    localStorage.setItem('discord_auth_state', state);
    
    // Scopes you want to request (identify = get user info, guilds.join = add to server if you want)
    const scope = encodeURIComponent('identify guilds.join');
    
    // Build Discord OAuth URL
    // REMOVED prompt=none - it was causing "invalid OAuth2 URL" error
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    
    // Alternative with consent prompt (always shows authorization screen):
    // const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
    
    console.log('Redirecting to Discord OAuth:', discordAuthUrl);
    
    // Redirect user to Discord
    window.location.href = discordAuthUrl;
}

// Check login status function
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/verify');
        if (response.ok) {
            const data = await response.json();
            
            if (data.loggedIn && data.user) {
                updateUIForLoggedInUser(data.user);
            }
        }
    } catch (error) {
        console.log('Not logged in or API not available:', error);
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser(user) {
    const loginButton = document.querySelector('.btn-login');
    if (loginButton) {
        // Change button to show username
        loginButton.innerHTML = `<i class="fab fa-discord"></i> ${user.username}`;
        loginButton.style.backgroundColor = '#5865F2'; // Discord blurple
        loginButton.style.color = 'white';
        loginButton.style.borderColor = '#5865F2';
        
        // Change tooltip or add title
        loginButton.title = `Logged in as ${user.username}#${user.discriminator}`;
        
        // Update click handler for logout
        loginButton.onclick = async function() {
            try {
                const response = await fetch('/api/discord/logout');
                if (response.ok) {
                    // Reset button to login state
                    loginButton.innerHTML = `<i class="fab fa-discord"></i> Login with Discord`;
                    loginButton.style.backgroundColor = 'transparent';
                    loginButton.style.color = '#b0b0b0';
                    loginButton.style.borderColor = '#333';
                    loginButton.title = '';
                    
                    // Restore original click handler
                    loginButton.onclick = function() {
                        loginWithDiscord();
                    };
                    
                    // Show logout message
                    showNotification('Successfully logged out!', 'success');
                }
            } catch (error) {
                console.error('Logout failed:', error);
                showNotification('Logout failed. Please try again.', 'error');
            }
        };
        
        // Show welcome message
        showNotification(`Welcome back, ${user.username}!`, 'success');
    }
}

// Utility function to show notifications
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.background = type === 'success' ? '#8b0000' : type === 'error' ? '#ff3333' : '#333';
    notification.style.color = 'white';
    notification.style.borderRadius = '6px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    notification.style.fontWeight = '600';
    notification.style.animation = 'fadeIn 0.3s ease';
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add CSS for fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Optional: Check URL for OAuth callback parameters (if you want to handle in frontend)
function checkUrlForAuthResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
        showNotification(`Discord login failed: ${error}`, 'error');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (code && state) {
        // You're coming back from Discord OAuth
        // The backend should handle this, but you could show a loading message
        showNotification('Completing login...', 'info');
        
        // Clean URL after a moment
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000);
    }
}

// Run URL check on page load
checkUrlForAuthResponse();
