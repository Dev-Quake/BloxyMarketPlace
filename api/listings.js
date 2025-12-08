// /api/listings.js
import fetch from 'node-fetch';

// In-memory storage (replace with database in production)
const listingsDB = new Map();
const pendingListings = new Map();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // CREATE NEW LISTING
    try {
      const sessionCookie = req.cookies?.discord_session;
      
      if (!sessionCookie) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const userData = JSON.parse(decodeURIComponent(sessionCookie));
      const listingData = req.body;
      
      // Generate unique ID
      const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create listing object
      const listing = {
        id: listingId,
        ...listingData,
        userId: userData.id,
        username: userData.username,
        userAvatar: userData.avatar,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store in memory
      listingsDB.set(listingId, listing);
      pendingListings.set(listingId, listing);
      
      // Send Discord webhook notification
      await sendDiscordWebhook(listing);
      
      res.status(200).json({
        success: true,
        message: 'Listing submitted for approval',
        listingId: listingId,
        status: 'pending'
      });
      
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
    
  } else if (req.method === 'GET') {
    // GET APPROVED LISTINGS FOR STORE
    const approvedListings = Array.from(listingsDB.values())
      .filter(listing => listing.status === 'approved');
    
    res.status(200).json({ listings: approvedListings });
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Discord Webhook Function
async function sendDiscordWebhook(listing) {
  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  
  if (!WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL not set');
    return;
  }
  
  const embed = {
    title: "📦 New Listing Pending Approval",
    color: 0xffaa00, // Orange color
    fields: [
      {
        name: "Listing Title",
        value: listing.title || "No title",
        inline: true
      },
      {
        name: "Category",
        value: listing.category || "Not specified",
        inline: true
      },
      {
        name: "Price",
        value: `$${listing.price || '0.00'} ${listing.negotiable ? '(Negotiable)' : ''}`,
        inline: true
      },
      {
        name: "Seller",
        value: `${listing.username} (ID: ${listing.userId})`,
        inline: false
      },
      {
        name: "Description",
        value: listing.description ? (listing.description.substring(0, 100) + "...") : "No description",
        inline: false
      },
      {
        name: "Listing ID",
        value: `\`${listing.id}\``,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Roblox Marketplace"
    }
  };
  
  const message = {
    embeds: [embed],
    components: [
      {
        type: 1, // ACTION_ROW
        components: [
          {
            type: 2, // BUTTON
            style: 3, // SUCCESS (green)
            label: "✅ Approve",
            custom_id: `approve_${listing.id}`
          },
          {
            type: 2, // BUTTON
            style: 4, // DANGER (red)
            label: "❌ Reject",
            custom_id: `reject_${listing.id}`
          },
          {
            type: 2, // BUTTON
            style: 2, // SECONDARY (gray)
            label: "👁️ View",
            url: `${process.env.SITE_URL || 'http://localhost:3000'}/profile.html?user=${listing.userId}`
          }
        ]
      }
    ]
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Discord webhook failed:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
  }
}