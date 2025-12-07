// /api/verify.js
export default async function handler(req, res) {
    // Check if user cookie exists
    const userCookie = req.cookies.discord_user;
    
    if (userCookie) {
        try {
            const userData = JSON.parse(userCookie);
            res.status(200).json({
                loggedIn: true,
                user: userData
            });
        } catch (error) {
            res.status(200).json({ loggedIn: false });
        }
    } else {
        res.status(200).json({ loggedIn: false });
    }
}