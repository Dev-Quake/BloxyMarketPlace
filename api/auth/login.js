export default function handler(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  
  if (!clientId) {
    console.error('DISCORD_CLIENT_ID is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  let finalRedirectUri = redirectUri;
  
  if (!finalRedirectUri) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    finalRedirectUri = `${protocol}://${host}/api/auth/callback`;
  }
  
  const scope = 'identify email';
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', finalRedirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('state', state);
  
  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  res.redirect(authUrl.toString());
}