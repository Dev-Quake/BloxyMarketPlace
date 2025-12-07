import fetch from 'node-fetch';

// In-memory store for demo (use database in production)
const sessions = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.VERCEL_URL || 'http://localhost:3000'}/callback.html`,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Invalid authorization code' });
    }
    
    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json();
    
    // Generate session token
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Store session (in production, use Redis or database)
    sessions.set(sessionToken, {
      user: userData,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // Clean old sessions
    for (const [token, session] of sessions.entries()) {
      if (session.expires < Date.now()) {
        sessions.delete(token);
      }
    }
    
    // Return success with user data
    res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        global_name: userData.global_name,
        email: userData.email
      }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}