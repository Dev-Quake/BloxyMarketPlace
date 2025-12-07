// In-memory store (same as in callback.js)
const sessions = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const session = sessions.get(token);
    
    if (!session || session.expires < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Return user data
    res.status(200).json({
      user: session.user
    });
    
  } catch (error) {
    console.error('User session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}