/// <reference types="cypress" />

Cypress.Commands.add('login', (email: string, password = 'Passw0rd!') => {
  cy.visit('/auth/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('button[type=submit]').click();
  cy.location('pathname', { timeout: 15000 }).should('not.include', '/auth/login');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password?: string): Chainable<void>;
    }
  }
}

export {};
