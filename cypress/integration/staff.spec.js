/// <reference types="cypress" />

context('Staff actions', () => {
  before(() => {
    const dropbox = {
      firstName: 'Homer',
      lastName: 'Simpson',
      submitted: '2020-08-24T15:06:49.087Z',
      created: '2020-08-24T15:06:46.975Z',
      dob: '1999-12-31',
      parentsEmail: 'me@test.com',
      description: 'These are for my application'
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
          .and('contain', 'Date of birth');

        cy.get('[data-testid=parents-email-value]').should(
          'contain',
          'me@test.com'
        );
        cy.get('[data-testid=dob-value]').should('contain', '31/12/1999');
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
          'Status: to review'
        );

        cy.get('[data-testid=archive-button-test]').click();

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
          'Status: archived'
        );

        cy.get('[data-testid=unarchive-button-test]').click();

        cy.get('[data-testid=archive-status-test]').should(
          'contain',
          'Status: to review'
        );

        cy.get('[data-testid=dropbox-list-return-link]').click();

        cy.get('[data-testid=dropboxes-to-review-test]').should(
          'contain',
          '(3)'
        );
      });
    });
    context('Data table', () => {
      const tableDropbox = {
        firstName: 'Tim',
        lastName: 'Jones',
        submitted: '2020-08-24T15:06:49.087Z',
        created: '2020-08-24T15:06:46.975Z',
        dob: '1995-01-13',
        parentsEmail: 'you@test.com',
        description: 'These are for my other application'
      };
      before(() => {
        cy.task('createDropbox', {
          ...tableDropbox,
          firstName: 'Ted',
          dropboxId: '5'
        });
        cy.task('createDropbox', {
          ...tableDropbox,
          lastName: 'Flanders',
          dropboxId: '6'
        });
        cy.task('createDropbox', {
          ...tableDropbox,
          dob: '1994-01-13',
          dropboxId: '7',
          parentsEmail: 'you@sample.com'
        });
        cy.task('createDropbox', {
          ...tableDropbox,
          dob: '1994-01-13',
          dropboxId: '8'
        });
        cy.task('createDropbox', {
          ...tableDropbox,
          description: 'These are not for my other application',
          dropboxId: '9'
        });
        cy.task('createDropbox', { ...tableDropbox, dropboxId: '10' });
        cy.task('createDropbox', { ...tableDropbox, dropboxId: '11' });
        cy.task('createDropbox', { ...tableDropbox, dropboxId: '12' });
        cy.visit('/');
      });
      it('paginates the table', () => {
        cy.get('[data-testid=dropbox-link]').should('have.length', 10);
        cy.get('#unarchived-table_next > a').click();

        cy.get('[data-testid=dropbox-link]').should('have.length', 1);
      });

      it('can search by name', () => {
        cy.get('#unarchived-table_filter > label > input').type('Tim');
        cy.get('[data-testid=dropbox-link]').should('have.length', 7);

        cy.get('#unarchived-table_filter > label > input')
          .clear()
          .type('Simpson');
        cy.get('[data-testid=dropbox-link]').should('have.length', 3);
      });

      it('can search by date of birth', () => {
        cy.get('#unarchived-table_filter > label > input').type('13/01/1994');
        cy.get('[data-testid=dropbox-link]').should('have.length', 2);

        cy.get('#unarchived-table_filter > label > input')
          .clear()
          .type('1995');
        cy.get('[data-testid=dropbox-link]').should('have.length', 6);
      });

      it('can search by email', () => {
        cy.get('#unarchived-table_filter > label > input').type('you@test.com');
        cy.get('[data-testid=dropbox-link]').should('have.length', 7);

        cy.get('#unarchived-table_filter > label > input')
          .clear()
          .type('@sam');
        cy.get('[data-testid=dropbox-link]').should('have.length', 1);
      });

      it('can sort by name', () => {
        cy.get('#unarchived-table > thead > tr > th:nth-child(1)').click();
        cy.get('[data-testid=dropbox-link]')
          .first()
          .should('contain', 'Homer Simpson');

        cy.get('#unarchived-table > thead > tr > th:nth-child(1)').click();
        cy.get('[data-testid=dropbox-link]')
          .first()
          .should('contain', 'Tim Jones');
      });

      it('can sort by date of birth', () => {
        cy.get('#unarchived-table > thead > tr > th:nth-child(2)').click();
        cy.get('[data-testid=dob]')
          .first()
          .should('contain', '1994');

        cy.get('#unarchived-table > thead > tr > th:nth-child(2)').click();
        cy.get('[data-testid=dob]')
          .first()
          .should('contain', '1999');
      });
    });

    describe('Reject dropbox', () => {
      it('can reject a dropbox', () => {
        cy.get('[data-testid=dropbox-link]')
          .first()
          .click();

        cy.get('[data-testid=reject-reason-text-test]').should(
          'not.be.visible'
        );
        cy.get('[data-testid=confirm-reject-button-test]').should(
          'not.be.visible'
        );

        cy.get('[data-testid=reject-button-test]').click();
        cy.get('[data-testid=reject-reason-text-test]').should('be.visible');
        cy.get('[data-testid=confirm-reject-button-test]').should('be.visible');

        cy.get('[data-testid=reject-reason-text-test]').type('blurry photos');
        cy.get('[data-testid=confirm-reject-button-test]').click();

        cy.get('[data-testid=reject-reason-label-test]').should(
          'contain',
          'Reason for rejection'
        );
        cy.get('[data-testid=reject-reason-details-test]').should(
          'contain',
          'blurry photos'
        );

        cy.get('[data-testid=archive-status-test]').should(
          'contain',
          'Status: archived'
        );
        cy.get('[data-testid=reject-button-test]').should('not.exist');
      });

      it('cannot reject a dropbox with empty reason', () => {
        cy.get('[data-testid=dropbox-link]')
          .first()
          .click();
        cy.get('[data-testid=reject-button-test]').click();
        cy.get('[data-testid=confirm-reject-button-test]').click();

        cy.get('[data-testid=reject-reason-text-test]').then($input => {
          expect($input[0].validationMessage).not.to.be.empty;
        });
      });
    });
  });
});
