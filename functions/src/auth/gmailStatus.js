/* eslint-disable object-curly-spacing */

const gmailStatus = (req, res) => {
  try {
    const email = req.user.email;

    if (!global.gmailConnections) {
      global.gmailConnections = {};
    }

    const connection = global.gmailConnections[email];
    const isConnected = (connection && connection.connected) || false;

    return res.json({
      isConnected,
      connectedAt: (connection && connection.connectedAt) || null,
      connectedEmail: (connection && connection.googleEmail) || null,
    });
  } catch (error) {
    console.error("Error getting Gmail status:", error);
    return res.status(500).json({ error: "Failed to get Gmail status" });
  }
};

module.exports = gmailStatus;
