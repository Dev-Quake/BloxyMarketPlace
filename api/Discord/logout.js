// /api/discord/logout.js
export default async function handler(req, res) {
    // Clear Discord cookies
    res.setHeader('Set-Cookie', [
        'discord_user=; HttpOnly; Path=/; Max-Age=0',
        'discord_token=; HttpOnly; Path=/; Max-Age=0'
    ]);
    
    res.status(200).json({ success: true });
}