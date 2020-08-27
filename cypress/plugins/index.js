/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
//axe console printing
module.exports = (on, config) => {
  const { DynamoDB } = require('aws-sdk');
  const client = new DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'foo',
    secretAccessKey: 'bar'
  });

  on('task', {
    createDropbox(dropbox) {
      return client
        .put({
          TableName: 'education-evidence-upload-tool-dev-dropboxes',
          Item: dropbox
        })
        .promise();
    },
    deleteDropboxes() {
      return new Promise((resolve, reject) => {
        client.scan(
          {
            TableName: 'education-evidence-upload-tool-dev-dropboxes'
          },
          (err, data) => {
            if (err) {
              console.log(err);
              return reject(err);
            }

            console.log(`Found ${data.Items.length} dropboxes`);

            data.Items.forEach(dropbox => {
              console.log(dropbox);
              client
                .delete({
                  TableName: 'education-evidence-upload-tool-dev-dropboxes',
                  Key: { dropboxId: dropbox.dropboxId }
                })
                .promise();
            });
            resolve(null);
          }
        );
      });
    }
  });
  config.ignoreTestFiles = '**/examples/*.spec.js';
  return config;
};
