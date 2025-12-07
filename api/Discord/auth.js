// /api/discord/auth.js
export default async function handler(req, res) {
    // This endpoint redirects to Discord OAuth
    const clientId = process.env.DISCORD_CLIENT_ID || '1408328312815747143';
    const redirectUri = encodeURIComponent(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/discord/callback`);
    const state = Math.random().toString(36).substring(7);
    
    // Store state in a cookie for verification
    res.setHeader('Set-Cookie', `discord_state=${state}; HttpOnly; Path=/; Max-Age=300`);
    
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify+guilds.join&state=${state}&prompt=none`;
    
    res.redirect(302, discordAuthUrl);
}