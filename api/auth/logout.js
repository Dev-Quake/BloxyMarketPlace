export default function handler(req, res) {
  const logoutCookies = [
    'discord_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
    'logged_in=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  
  if (process.env.NODE_ENV === 'production') {
    logoutCookies[0] += '; Secure';
  }
  
  res.setHeader('Set-Cookie', logoutCookies);
  
  if (req.headers.accept?.includes('application/json')) {
    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  }
  
  res.redirect(302, '/');
}