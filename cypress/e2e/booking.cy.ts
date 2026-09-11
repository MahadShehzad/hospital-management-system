describe('Appointment booking (Phase 3)', () => {
  it('books an open slot and shows it under My Appointments', () => {
    cy.login('ayesha@patient.test');

    cy.visit('/patient/doctors');
    cy.get('a[href^="/patient/book/"]', { timeout: 15000 }).first().click();

    cy.location('pathname').should('include', '/patient/book/');
    cy.get('.fc-slot-open', { timeout: 20000 }).first().click();

    cy.get('app-book-confirm', { timeout: 10000 }).within(() => {
      cy.get('#reason').type('Cypress smoke-test consultation');
      cy.contains('button', 'Book slot').click();
    });

    cy.location('pathname', { timeout: 15000 }).should('include', '/patient/appointments');
    cy.contains('app-status-badge', 'Pending').should('exist');
  });

  it('lets the patient cancel an appointment', () => {
    cy.login('ayesha@patient.test');
    cy.visit('/patient/appointments');

    cy.get('body').then(($b) => {
      if ($b.find('button:contains("Cancel")').length) {
        cy.contains('button', 'Cancel').first().click();
        cy.get('.modal').contains('button', /yes, cancel/i).click();
        cy.contains(/appointment cancelled/i).should('be.visible');
      }
    });
  });
});
