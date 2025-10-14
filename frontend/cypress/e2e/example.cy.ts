describe("Homepage", () => {
  it("should load homepage and show some h2 headings", () => {
    cy.visit("/");
    cy.get("h2").should("have.length.at.least", 1);
  });
});
