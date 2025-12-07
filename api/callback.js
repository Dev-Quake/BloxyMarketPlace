import fetch from 'node-fetch';

// In-memory store for sessions (use database in production)
const sessions = new Map();
const userCache = new Map();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }
    
    // Your Discord credentials
    const CLIENT_ID = '1408328312815747143';
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET; // Set in Vercel
    const REDIRECT_URI = 'https://bloxymarketplace.vercel.app/callback.html';
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify guilds.join',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return res.status(400).json({ 
        error: 'Failed to get access token',
        details: tokenData.error_description || 'Unknown error'
      });
    }
    
    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await userResponse.json();
    
    // Generate secure session token
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Store session
    sessions.set(sessionToken, {
      user: userData,
      discordToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expires: Date.now() + (tokenData.expires_in * 1000), // Use Discord's expiry
    });
    
    // Cache user data for quick access
    userCache.set(userData.id, {
      ...userData,
      lastUpdated: Date.now(),
    });
    
    // Optional: Add user to your Discord server (if you have guilds.join scope)
    if (process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
      try {
        await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: tokenData.access_token,
          }),
        });
      } catch (guildError) {
        console.log('Note: Could not add user to guild (might not be needed for your app)');
      }
    }
    
    // Return success
    res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        global_name: userData.global_name,
        email: userData.email || null,
        verified: userData.verified || false,
        mfa_enabled: userData.mfa_enabled || false,
        locale: userData.locale || 'en-US',
      }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper function to clean expired sessions
function cleanSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) {
      sessions.delete(token);
    }
  }
  // Run cleanup every hour
  setInterval(cleanSessions, 60 * 60 * 1000);
}

// Initial cleanup
cleanSessions();
