const querystring = require('querystring');
const { getSession, saveDropbox } = require('./lib/Dependencies');

module.exports = {
  handler: async event => {
    try {
      if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, 'base64').toString();
      }

      const session = getSession(event.headers);
      const { dropboxId: pathDropboxId } = event.pathParameters;

      if (!session || session.dropboxId !== pathDropboxId) {
        return { statusCode: 404 };
      }

      const { dropboxId } = session;
      await saveDropbox(dropboxId, querystring.parse(event.body));

      return {
        statusCode: 302,
        headers: { Location: `/dropboxes/${dropboxId}` }
      };
    } catch (err) {
      console.log(err);
    }
  }
};
