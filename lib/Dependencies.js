const path = require('path');
const dbConfig = require('./DynamoDbConfig')({
  stage: process.env.stage,
  dropboxesTable: process.env.DROPBOXES_TABLE
});
const dbConn = require('./DynamoDbConnection')(dbConfig);
const { loadTemplates, generateRandomString } = require('./utils');
const { getSession, createSessionToken } = require('./sessions');
const templates = loadTemplates(path.join(__dirname, '../templates'));
const authorize = require('./authorize');
const log = require('./log')();
const { NotifyClient } = require('notifications-node-client');

const s3ClientConfig = require('./s3ClientConfig')({
  bucket: process.env.UPLOADS_BUCKET,
  stage: process.env.stage
});

const container = {
  log,
  gateways: {
    dropbox: require('./gateways/dropbox/dynamodb')({ ...dbConn, log }),
    document: require('./gateways/document/s3')({
      ...s3ClientConfig,
      log,
      configuration: {
        urlPrefix: process.env.URL_PREFIX,
        maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES) || 20_971_520
      }
    }),
    notify: require('./gateways/notification/notify')({
      client: new NotifyClient(process.env.GOV_NOTIFY_API_KEY),
      log
    })
  }
};

const getDropbox = require('./use-cases/GetDropbox')(container);
const getDropboxes = require('./use-cases/GetDropboxes')(container);
const createEmptyDropbox = require('./use-cases/CreateEmptyDropbox')(container);
const deleteDocument = require('./use-cases/DeleteDocument')(container);
const getSecureUploadUrl = require('./use-cases/GetSecureUploadUrl')(container);
const saveDropbox = require('./use-cases/SaveDropbox')(container);
const sendConfirmationEmail = require('./use-cases/SendConfirmationEmail')(
  container
);
const updateArchiveStatus = require('./use-cases/UpdateArchiveStatus')(
  container
);
const rejectDropbox = require('./use-cases/RejectDropbox')(container);

module.exports = {
  authorize,
  createEmptyDropbox,
  createSessionToken,
  deleteDocument,
  generateRandomString,
  getDropbox,
  getDropboxes,
  getSecureUploadUrl,
  getSession,
  rejectDropbox,
  saveDropbox,
  sendConfirmationEmail,
  templates,
  updateArchiveStatus
};
