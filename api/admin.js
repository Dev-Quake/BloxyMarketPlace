// /api/admin.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { listingId, action, reason } = req.body;
    
    // Verify admin (add your own admin check here)
    const isAdmin = true; // Replace with actual admin check
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // In-memory storage (same as listings.js)
    // In production, use a shared database
    const listingsDB = new Map(); // This should be a shared database
    
    const listing = listingsDB.get(listingId);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Update listing status
    listing.status = action; // 'approved' or 'rejected'
    listing.updatedAt = new Date().toISOString();
    listing.reviewedBy = req.headers['x-admin-id']; // Add admin info
    listing.rejectionReason = reason;
    
    listingsDB.set(listingId, listing);
    
    // TODO: Notify user via Discord DM about approval/rejection
    // You can send a DM to the user using their Discord ID
    
    res.status(200).json({
      success: true,
      message: `Listing ${action} successfully`
    });
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}