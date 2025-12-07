// Sessions from callback.js (in production, use shared Redis/database)
const sessions = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const session = sessions.get(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session token' });
    }
    
    // Check if session expired
    if (session.expires < Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Return user data (without sensitive info)
    res.status(200).json({
      user: {
        id: session.user.id,
        username: session.user.username,
        discriminator: session.user.discriminator,
        avatar: session.user.avatar,
        global_name: session.user.global_name,
        verified: session.user.verified || false,
      },
      expires: session.expires,
    });
    
  } catch (error) {
    console.error('User session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
