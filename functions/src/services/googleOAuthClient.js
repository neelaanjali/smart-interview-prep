const {google} = require("googleapis");

/**
 * Create a Google OAuth2 client using configured env vars.
 * @return {google.auth.OAuth2}
 */
function createOAuthClient() {
  return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
  );
}

module.exports = {createOAuthClient};
