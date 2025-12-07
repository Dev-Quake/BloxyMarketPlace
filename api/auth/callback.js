export default async function handler(req, res) {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;
  
  if (!code) {
    return res.status(400).send(`
      <html>
        <body style="background: #0a0a0a; color: #f0f0f0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 40px; border: 1px solid #8b0000; border-radius: 10px;">
            <h1 style="color: #8b0000;">❌ Authentication Failed</h1>
            <p>No authorization code received from Discord.</p>
            <a href="/" style="color: #8b0000; text-decoration: none; border: 1px solid #8b0000; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">Return Home</a>
          </div>
        </body>
      </html>
    `);
  }
  
  if (state !== storedState) {
    return res.status(400).send(`
      <html>
        <body style="background: #0a0a0a; color: #f0f0f0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 40px; border: 1px solid #8b0000; border-radius: 10px;">
            <h1 style="color: #8b0000;">⚠️ Security Warning</h1>
            <p>State verification failed. Possible CSRF attack.</p>
            <a href="/" style="color: #8b0000; text-decoration: none; border: 1px solid #8b0000; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">Return Home</a>
          </div>
        </body>
      </html>
    `);
  }
  
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  
  if (!clientId || !clientSecret) {
    console.error('Missing Discord OAuth credentials');
    return res.status(500).send(`
      <html>
        <body style="background: #0a0a0a; color: #f0f0f0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 40px; border: 1px solid #8b0000; border-radius: 10px;">
            <h1 style="color: #8b0000;">⚙️ Server Error</h1>
            <p>Server configuration incomplete.</p>
            <a href="/" style="color: #8b0000; text-decoration: none; border: 1px solid #8b0000; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">Return Home</a>
          </div>
        </body>
      </html>
    `);
  }
  
  let finalRedirectUri = redirectUri;
  
  if (!finalRedirectUri) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    finalRedirectUri = `${protocol}://${host}/api/auth/callback`;
  }
  
  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: finalRedirectUri,
        scope: 'identify email',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token received from Discord');
    }
    
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    
    const sessionData = {
      id: userData.id,
      username: userData.username,
      global_name: userData.global_name || userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email || null,
      verified: userData.verified || false,
      mfa_enabled: userData.mfa_enabled || false,
      locale: userData.locale || 'en-US',
      premium_type: userData.premium_type || 0,
      public_flags: userData.public_flags || 0,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };
    
    const cookieOptions = [
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${7 * 24 * 60 * 60}`,
    ];
    
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push('Secure');
    }
    
    res.setHeader('Set-Cookie', [
      `discord_session=${encodeURIComponent(JSON.stringify(sessionData))}; ${cookieOptions.join('; ')}`,
      `logged_in=true; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
      `oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    ]);
    
    res.redirect(302, '/');
    
  } catch (error) {
    console.error('Discord OAuth error:', error);
    
    res.setHeader('Set-Cookie', `oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    
    return res.status(500).send(`
      <html>
        <body style="background: #0a0a0a; color: #f0f0f0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 40px; border: 1px solid #8b0000; border-radius: 10px;">
            <h1 style="color: #8b0000;">🔐 Authentication Error</h1>
            <p>Failed to authenticate with Discord. Please try again.</p>
            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">Error: ${error.message}</p>
            <a href="/" style="color: #8b0000; text-decoration: none; border: 1px solid #8b0000; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">Return Home</a>
          </div>
        </body>
      </html>
    `);
  }
}