export default async function handler(req, res) {
  const { state } = req.query;
  
  if (!state) {
    return res.status(400).json({ error: 'Missing state parameter' });
  }
  
  // Your Discord OAuth2 credentials (set in Vercel environment variables)
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const REDIRECT_URI = encodeURIComponent(`${process.env.VERCEL_URL || 'http://localhost:3000'}/callback.html`);
  const SCOPE = encodeURIComponent('identify email');
  
  // Discord OAuth2 URL
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=${SCOPE}` +
    `&state=${state}`;
  
  // Redirect to Discord
  res.writeHead(302, { Location: discordAuthUrl });
  res.end();
}