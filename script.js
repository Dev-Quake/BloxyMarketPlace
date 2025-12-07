// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    const discordLoginBtn = document.getElementById('discordLoginBtn');
    
    // Discord OAuth2 URL - Replace with your actual Discord OAuth2 URL
    const DISCORD_OAUTH_URL = 'https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=identify%20email';
    
    // Add click event to redirect to Discord OAuth
    discordLoginBtn.addEventListener('click', function() {
        // Show loading state
        discordLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
        discordLoginBtn.disabled = true;
        
        // Redirect to Discord OAuth page
        setTimeout(() => {
            window.location.href = DISCORD_OAUTH_URL;
        }, 500);
    });
    
    // Optional: Add a fake login for demonstration
    // Remove this in production
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
        discordLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            discordLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            
            setTimeout(() => {
                alert('Demo login successful! In a real implementation, this would redirect to Discord OAuth.');
                window.location.href = 'index.html';
            }, 1500);
        });
    }
});