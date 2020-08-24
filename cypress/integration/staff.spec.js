/// <reference types="cypress" />

context('Staff actions', () => {
  before(() => {
    const dropbox = {
      customerPhone: '123',
      submitted: '2020-08-24T13:57:53.285Z',
      customerNationalInsurance: 'AAB111111C',
      created: '2020-08-24T13:57:53.285Z',
      customerEmail: 'me@test.com',
      customerReference: '222',
      description: 'description',
      customerDob: '1999-12-31',
      customerName: 'Jim'
    };
    cy.task('createDropbox', { ...dropbox, dropboxId: '1' });
    cy.task('createDropbox', { ...dropbox, dropboxId: '2' });
    cy.task('createDropbox', { ...dropbox, dropboxId: '3' });
  });
  after(() => {
    cy.task('deleteDropboxes');
  });
  context('when not logged in', () => {
    beforeEach(() => {
      cy.logout();
    });

    it('redirects to the login page', () => {
      cy.visit('/dropboxes');
      cy.location('pathname').should('equal', '/login');
    });
  });

  context('when logged in as a staff member', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/');
    });

    context('when visiting the service', () => {
      it('shows the staff view', () => {
        cy.get('h2').contains(/customer uploads/i);
      });

      it('shows a list of customer dropboxes', () => {
        cy.get('[data-testid=staff-dropboxes-list]')
          .children()
          .should('have.length.greaterThan', 1);
      });
    });

    context('when selecting a customer dropbox', () => {
      it('shows the customer dropbox details', () => {
        cy.get('[data-testid=staff-dropboxes-list]')
          .children()
          .eq(2)
          .find('[data-testid=dropbox-link]')
          .click();

        cy.get('[data-testid=dropbox-details]')
          .and('contain', "Parent's email")
          .and('contain', 'Date of Birth');

        cy.get('[data-testid=parents-email-value]').should(
          'contain',
          'me@test.com'
        );
        cy.get('[data-testid=dob-value]').should('contain', '1999-12-31');
      });
    });

    context('when viewing a customer dropbox', () => {
      it('can navigate back to the dropboxes list', () => {
        cy.get('[data-testid=staff-dropboxes-list]')
          .children()
          .first()
          .find('[data-testid=dropbox-link]')
          .click();

        cy.get('[data-testid=dropbox-list-return-link]').click();

        cy.get('[data-testid=staff-dropboxes-list]').should('exist');
      });
    });

    context('archive/unarchive functionality', () => {
      it('can archive a dropbox', () => {
        cy.get('[data-testid=dropboxes-to-review-test]').should(
          'contain',
          '(3)'
        );
        cy.get('[data-testid=staff-dropboxes-list]')
          .children()
          .eq(2)
          .find('[data-testid=dropbox-link]')
          .click();

        cy.get('[data-testid=archive-status-test]').should(
          'contain',
          'Status: To review'
        );

        cy.get('[data-testid=archive-button-test]').click();

        cy.get('[data-testid=archive-status-test]').should(
          'contain',
          'Status: Archived'
        );

        cy.get('[data-testid=dropbox-list-return-link]').click();

        cy.get('[data-testid=dropboxes-to-review-test]').should(
          'contain',
          '(2)'
        );
      });

      it('can unarchive a dropbox', () => {
        cy.get('[data-testid=dropboxes-to-review-test]').should(
          'contain',
          '(2)'
        );

        cy.get('[data-testid=archived-dropboxes]').click();

        cy.get('[data-testid=archived-dropbox-link]').click();

        cy.get('[data-testid=archive-status-test]').should(
          'contain',
          'Status: Archived'
        );

        cy.get('[data-testid=unarchive-button-test]').click();

        cy.get('[data-testid=archive-status-test]').should(
          'contain',
          'Status: To review'
        );

        cy.get('[data-testid=dropbox-list-return-link]').click();

        cy.get('[data-testid=dropboxes-to-review-test]').should(
          'contain',
          '(3)'
        );
      });
    });
  });
});
