// /api/discord/callback.js
export default async function handler(req, res) {
    const { code, state } = req.query;
    
    // Verify state
    const storedState = req.cookies.discord_state;
    if (!storedState || storedState !== state) {
        return res.status(400).send('Invalid state parameter');
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID || '1408328312815747143',
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/discord/callback`,
            }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            throw new Error('No access token received');
        }
        
        // Get user info from Discord
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        
        const userData = await userResponse.json();
        
        // Store user data in a secure cookie or session
        res.setHeader('Set-Cookie', [
            `discord_user=${JSON.stringify(userData)}; HttpOnly; Path=/; Max-Age=86400`,
            `discord_token=${tokenData.access_token}; HttpOnly; Path=/; Max-Age=86400`,
            'discord_state=; HttpOnly; Path=/; Max-Age=0' // Clear state cookie
        ]);
        
        // Redirect back to home page
        res.redirect(302, '/');
        
    } catch (error) {
        console.error('Discord OAuth error:', error);
        res.status(500).send('Authentication failed');
    }
}