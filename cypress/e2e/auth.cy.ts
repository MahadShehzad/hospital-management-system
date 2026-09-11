describe('Authentication & role routing', () => {
  it('rejects bad credentials', () => {
    cy.visit('/auth/login');
    cy.get('#email').type('ayesha@patient.test');
    cy.get('#password').type('wrong-password');
    cy.get('button[type=submit]').click();
    cy.contains(/invalid email or password/i).should('be.visible');
    cy.location('pathname').should('include', '/auth/login');
  });

  it('logs a patient in and lands on the doctor search', () => {
    cy.login('ayesha@patient.test');
    cy.location('pathname').should('include', '/patient/doctors');
    cy.contains('Find a Doctor').should('be.visible');
  });

  it('routes each role to its own area', () => {
    const cases: [string, RegExp][] = [
      ['sara@doctor.test', /\/doctor\//],
      ['reception@hospital.test', /\/reception\//],
      ['admin@hospital.test', /\/admin\//],
    ];
    cases.forEach(([email, pattern]) => {
      cy.login(email);
      cy.location('pathname').should('match', pattern);
    });
  });

  it('blocks a patient from an admin route', () => {
    cy.login('ayesha@patient.test');
    cy.visit('/admin/dashboard');
    cy.location('pathname').should('not.include', '/admin');
  });

  it('keeps the session across a reload (silent refresh)', () => {
    cy.login('ayesha@patient.test');
    cy.reload();
    cy.location('pathname').should('include', '/patient');
  });
});
