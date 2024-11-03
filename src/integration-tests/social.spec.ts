import pane from "../index";
import { parse } from "rdflib";
import { store } from "solid-logic";
import { findByTestId } from "@testing-library/dom";
import { context, doc, subject } from "./setup";


// import exampleProfile from './examples/testingsolidos.ttl'


// This was at testingsolidos.solidcommunity.net

const exampleProfile = ``;

// console.log('exampleProfile', exampleProfile)
`
describe("profile-pane", () => {
  let element;

  describe("social media", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      parse(exampleProfile, store, doc.uri);
      const result = pane.render(subject, context);
      element = await findByTestId(result, "curriculum-vitae");
    });

    it("renders the social networks", () => {
      expect(element).toContainHTML("Bio");
    });
    it("renders role testeuse d’accessibilité in bio", () => {
      expect(element).toContainHTML("testeuse D’accessibilité");
    });
    it("renders organization Apple in list", () => {
      expect(element).toContainHTML("Apple");
    });
    it("renders lone start date in list", () => {
      expect(element).toContainHTML("(2021-04-01 to");
    });
    it("renders start and end dates in role", () => {
      expect(element).toContainHTML("(1960-04-01 to 1963-04-01)");
    });
    it("renders skill 1 in CV", () => {
      expect(element).toContainHTML("Tester Du Matériel D’instrumentation");
    });
    it("renders skill 2 in CV", () => {
      expect(element).toContainHTML("Travailler Dans De Mauvaises Conditions");
    });
    it("renders skill 3 vcard role in CV", () => {
      expect(element).toContainHTML("Sitting");
    });
    it("renders error flag when missing skill text CV", () => {
      expect(element).toContainHTML("¿¿¿ Skill ???");
    });
    it("renders languages", () => {
      expect(element).toContainHTML("French");
    });

    it("renders languages", () => {
      expect(element).toContainHTML("Germano");
    });
  });

});
