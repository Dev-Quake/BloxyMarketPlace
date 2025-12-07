export default async function handler(req, res) {
  const { state } = req.query;
  
  if (!state) {
    return res.status(400).json({ error: 'Missing state parameter' });
  }
  
  // Use your Discord client ID
  const CLIENT_ID = '1408328312815747143';
  const REDIRECT_URI = encodeURIComponent('https://bloxymarketplace.vercel.app/callback.html');
  const SCOPE = encodeURIComponent('identify guilds.join');
  
  // Build Discord OAuth2 URL with your parameters
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=${SCOPE}` +
    `&state=${state}` +
    `&prompt=consent`; // Optional: always ask for consent
  
  // Redirect to Discord
  res.writeHead(302, { Location: discordAuthUrl });
  res.end();
}
