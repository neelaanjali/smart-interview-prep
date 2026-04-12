/* eslint-disable object-curly-spacing */

const gmailDisconnect = (req, res) => {
  try {
    const email = req.user.email;

    if (!global.gmailConnections) {
      global.gmailConnections = {};
    }

    const wasConnected = global.gmailConnections[email]?.connected || false;

    // Remove the Gmail connection for this user
    delete global.gmailConnections[email];

    return res.json({
      success: true,
      message: "Gmail disconnected successfully",
      wasConnected,
    });
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
};

module.exports = gmailDisconnect;
