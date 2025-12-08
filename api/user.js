export default function handler(req, res) {
  try {
    const sessionCookie = req.cookies?.discord_session;
    
    if (!sessionCookie) {
      return res.status(200).json({ 
        authenticated: false, 
        user: null 
      });
    }
    
    const userData = JSON.parse(decodeURIComponent(sessionCookie));
    
    const currentTime = Date.now();
    if (currentTime > userData.expires_at) {
      res.setHeader('Set-Cookie', [
        'discord_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'logged_in=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
      
      return res.status(200).json({ 
        authenticated: false, 
        user: null 
      });
    }
    
    const safeUserData = {
      id: userData.id,
      username: userData.username,
      global_name: userData.global_name,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email,
      verified: userData.verified,
      avatar_url: userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${userData.discriminator % 5}.png`,
      session_expires: userData.expires_at,
    };
    
    return res.status(200).json({ 
      authenticated: true, 
      user: safeUserData 
    });
    
  } catch (error) {
    console.error('Error parsing session data:', error);
    
    res.setHeader('Set-Cookie', [
      'discord_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'logged_in=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    
    return res.status(200).json({ 
      authenticated: false, 
      user: null 
    });
  }
}