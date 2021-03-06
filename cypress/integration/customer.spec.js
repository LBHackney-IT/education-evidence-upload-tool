/// <reference types="cypress" />

const dbConfig = require('../../lib/DynamoDbConfig')({
  stage: 'test',
  dropboxesTable: 'education-evidence-upload-tool-test-dropboxes'
});
const dbConn = require('../../lib/DynamoDbConnection')(dbConfig);
const log = require('../../lib/log')();
const dropboxes = require('../../lib/gateways/dropbox/dynamodb')({
  ...dbConn,
  log
});
const s3ClientConfig = require('../../lib/s3ClientConfig')({
  bucket: 'education-evidence-upload-tool-test-uploads',
  stage: 'test'
});
const documents = require('../../lib/gateways/document/s3')({
  ...s3ClientConfig,
  log,
  configuration: { urlPrefix: 'http://localhost:3000' }
});
require('cypress-file-upload');

context('Customer Actions', () => {
  after(() => {
    cy.task('deleteDropboxes');
  });
  const dropboxUrlRegex = /\/dropboxes\/([0-9a-zA-Z-_]{20})/;

  const getDropboxFromUrl = async url => {
    const dropboxId = url.match(dropboxUrlRegex)[1];
    return await dropboxes.get(dropboxId);
  };

  const getDropboxFiles = async dropbox => {
    return documents.getByDropboxId(dropbox.id);
  };

  const uploadAFile = (fileName, description, dropboxId) => {
    cy.get('#file').attachFile(fileName);
    cy.get('[data-testid=doc-description]').select(description);
    cy.get('#uploadFile').click();

    // s3-local doesn't support redirects, so manually refresh instead...
    cy.visit(`/dropboxes/${dropboxId}`);

    cy.get('#uploads')
      //.should('contain', fileName) s3-local does not correctly set filename
      .should('contain', description);
  };

  describe('coming to the service', () => {
    context("when the user doesn't have a session", () => {
      it('should redirect a new user to the new dropbox url', () => {
        cy.request({
          url: 'http://localhost:3000/',
          followRedirect: false
        }).then(response => {
          expect(response.status).to.eq(302);
          expect(response.redirectedToUrl).to.eq(
            'http://localhost:3000/dropboxes/new'
          );
        });
      });

      it('should create a new dropbox and redirect the user to it from the new dropbox page', () => {
        cy.request({
          url: 'http://localhost:3000/dropboxes/new',
          followRedirect: false
        }).then(async response => {
          expect(response.status).to.eq(302);
          expect(response.redirectedToUrl).to.match(dropboxUrlRegex);

          const dropbox = await getDropboxFromUrl(response.redirectedToUrl);
          expect(dropbox).to.not.be.undefined;
        });
      });
    });

    context('when the user has a session', () => {
      it('should redirect to their existing dropbox url', () => {
        cy.visit('/');
        cy.location()
          .then(loc => {
            return loc.pathname;
          })
          .then(path => {
            cy.visit('/');
            cy.location('pathname').should('eq', path);
          });
      });
    });
  });

  describe('submitting documents', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should allow a user to upload multiple documents', () => {
      const files = [
        {
          filename: 'foo.txt',
          description: 'Council tax letter',
          contents: 'hello'
        },
        {
          filename: 'foo2.txt',
          description: 'Proof of address',
          contents: 'hello again'
        }
      ];

      // upload the files and check they are showing in the ui
      files.forEach(file => {
        uploadAFile(file.filename, file.description);
      });

      // check the files have been saved correctly
      cy.location().then(async loc => {
        const dropbox = await getDropboxFromUrl(loc.pathname);
        const dropboxFiles = await getDropboxFiles(dropbox);

        const filesFromBucket = [];

        for (const dropboxFile of dropboxFiles) {
          filesFromBucket.push({
            filename: dropboxFile.filename,
            description: dropboxFile.description
          });
        }

        // s3-local does not correctly map filenames during upload,
        // this is safe though as our description is stored in S3 metadata
        // and so if it is available the file was uploaded successfully.
        expect(
          filesFromBucket.map(file => file.description)
        ).to.have.deep.members(files.map(file => file.description));
      });
    });

    it('should not allow a user to submit the upload form if they have not selected a file', () => {
      cy.get('#uploadFile').click();

      cy.get('#file').then($input => {
        expect($input[0].validationMessage).not.to.be.empty;
      });
    });

    it('should not show the details form if no files have been uploaded', () => {
      cy.get('#firstName').should('not.exist');
    });

    context('when a file has been uploaded', () => {
      beforeEach(() => {
        uploadAFile('foo.txt', 'Other');
      });

      it('should allow a user to add their details and a description and then submit the form', () => {
        const firstName = 'Homer';
        const lastName = 'Simpson';
        const description = 'These are for my application';

        cy.get('#firstName').type(firstName);
        cy.get('#lastName').type(lastName);
        cy.get('#dob').type('1999-12-31');
        cy.get('#parentsEmail').type('me@test.com');
        cy.get('#description').type(description);
        cy.get('#submitDropbox').click();

        cy.get('#dropboxContents')
          .should('contain', firstName)
          .should('contain', lastName)
          .should('contain', description);
      });

      it('should not allow a user to submit the form if they have not entered required fields', () => {
        const firstName = 'Homer';
        const lastName = 'Simpson';
        cy.get('#submitDropbox').click();

        cy.get('#firstName').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });
        cy.get('#firstName').type(firstName);

        cy.get('#submitDropbox').click();

        cy.get('#lastName').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });

        cy.get('#lastName').type(lastName);
        cy.get('#submitDropbox').click();

        cy.get('#dob').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });

        cy.get('#dob').type('1999-12-31');
        cy.get('#submitDropbox').click();

        cy.get('#parentsEmail').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });
        cy.get('#parentsEmail').type('me@test.com');
      });

      it('validates the email', () => {
        const firstName = 'Homer';
        const lastName = 'Simpson';
        cy.get('#firstName').type(firstName);
        cy.get('#lastName').type(lastName);
        cy.get('#dob').type('1999-12-31');
        cy.get('#parentsEmail').type('me');
        cy.get('#submitDropbox').click();

        cy.get('#parentsEmail').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });

        cy.get('#parentsEmail').type('@');
        cy.get('#submitDropbox').click();

        cy.get('#parentsEmail').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });
        cy.get('#parentsEmail').type('email.com');
        cy.get('#submitDropbox').click();
        cy.get('#dropboxContents').should('contain', firstName);
      });

      it('validates the name', () => {
        cy.get('#firstName').type(' ');
        cy.get('#submitDropbox').click();

        cy.get('#firstName').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });

        cy.get('#firstName').type('Tim');
        cy.get('#lastName').type(' ');
        cy.get('#submitDropbox').click();

        cy.get('#lastName').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });
      });
    });

    context('when a dropbox has been submitted', () => {
      beforeEach(() => {
        uploadAFile('foo.txt', 'Other');
        cy.get('#firstName').type('Jonah');
        cy.get('#lastName').type('Lomu');
        cy.get('#dob').type('1999-12-31');
        cy.get('#parentsEmail').type('me@test.com');
        cy.get('#description').type('These are for my wedding');
        cy.get('#submitDropbox').click();
      });

      it('should always navigate to the submitted dropbox', () => {
        cy.visit('/');
        cy.location('pathname').should('match', dropboxUrlRegex);
      });

      it('should allow the user to start again', () => {
        cy.get('#startAgain').click();
        cy.location('pathname').should('match', dropboxUrlRegex);
      });
    });
  });
});
