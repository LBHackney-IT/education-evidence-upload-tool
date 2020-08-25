const querystring = require('querystring');
const {
  getSession,
  saveDropbox,
  sendConfirmationEmail
} = require('./lib/Dependencies');

module.exports = {
  handler: async event => {
    try {
      if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, 'base64').toString();
      }

      const { dropboxId } = event.pathParameters;
      const session = getSession(event.headers);
      if (!session || session.dropboxId !== dropboxId) {
        return { statusCode: 403 };
      }

      await saveDropbox(dropboxId, querystring.parse(event.body));

      await sendConfirmationEmail(dropboxId);

      return {
        statusCode: 302,
        headers: { Location: `/dropboxes/${dropboxId}` }
      };
    } catch (err) {
      console.log(err);
    }
  }
};
