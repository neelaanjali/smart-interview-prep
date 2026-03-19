const { google } = require("googleapis");

// this function creates the client that allows us to connect to google oauth using our cloud console credentials
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

module.exports = { createOAuthClient };