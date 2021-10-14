import pane from "../";
import { parse } from "rdflib";
import { store } from "solid-ui";
import {
  findByAltText,
  findByTestId,
  getByAltText,
  queryByAltText,
  waitFor,
} from "@testing-library/dom";
import { context, doc, subject } from "./setup";
import fetchMock from "jest-fetch-mock";

describe("profile-pane", () => {
  let result;

  describe("with full profile", () => {
    beforeAll(() => {
      store.removeDocument(doc);
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      :me foaf:name "Jane Doe";
          foaf:img </profile/me.jgp>;
          vcard:role "Test Double";
          vcard:organization-name "Solid Community";
          solid:preferredObjectPronoun "they";
          solid:preferredRelativePronoun "them";
          solid:preferredSubjectPronoun "their";
          vcard:hasAddress [
            vcard:locality "Hamburg";
            vcard:country-name "Germany";
          ];
      .
  `;
      parse(turtle, store, doc.uri);
      result = pane.render(subject, context);
    });

    it("renders the name", () => {
      expect(result).toContainHTML("Jane Doe");
    });

    it("renders the introduction", () => {
      expect(result).toContainHTML("Test Double at Solid Community");
    });

    it("renders the location", () => {
      expect(result).toContainHTML("🌐");
      expect(result).toContainHTML("Hamburg, Germany");
    });

    it("renders the preferred Pronouns", () => {
      expect(result).toContainHTML("their/they/them");
    });

    it("renders the image", () => {
      const image = getByAltText(result, "Jane Doe");
      expect(image).toHaveAttribute(
        "src",
        "https://janedoe.example/profile/me.jgp"
      );
    });
  });

  describe("with empty profile", () => {
    let card;
    beforeAll(async () => {
      store.removeDocument(doc);
      result = pane.render(subject, context);
      card = await findByTestId(result, "profile-card");
    });

    it("renders only a makeshift name based on URI", () => {
      expect(card.textContent.trim()).toContain("janedoe.example");
    });

    it("does not render broken profile image", () => {
      const image = queryByAltText(card, /.*/);
      expect(image).toBeNull();
    });
  });

  describe("with extended profile", () => {
    beforeAll(() => {
      store.removeDocument(doc);
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      :me foaf:name "Jane Doe";
          rdfs:seeAlso <./more.ttl>, <./address.ttl>;
      .`;
      parse(turtle, store, doc.uri);
      fetchMock.mockOnceIf(
        "https://janedoe.example/profile/more.ttl",
        `
              @prefix jane: </profile/card#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      jane:me foaf:img </profile/me.jgp>;
          vcard:role "Test Double";
          vcard:organization-name "Solid Community";
      .
      `,
        {
          headers: {
            "Content-Type": "text/turtle",
          },
        }
      );
      fetchMock.mockOnceIf(
        "https://janedoe.example/profile/address.ttl",
        `
              @prefix jane: </profile/card#>.
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      jane:me vcard:hasAddress [
            vcard:locality "Hamburg";
            vcard:country-name "Germany";
          ];
      .
      `,
        {
          headers: {
            "Content-Type": "text/turtle",
          },
        }
      );
      result = pane.render(subject, context);
    });

    it("renders the name", () =>
      waitFor(() => expect(result).toContainHTML("Jane Doe")));

    it("renders the introduction", () =>
      waitFor(() =>
        expect(result).toContainHTML("Test Double at Solid Community")
      ));

    it("renders the location", () =>
      waitFor(() => {
        expect(result).toContainHTML("🌐");
        expect(result).toContainHTML("Hamburg, Germany");
      }
    ));

    it("renders the image", async () => {
      const image = await findByAltText(result, "Jane Doe");
      expect(image).toHaveAttribute(
        "src",
        "https://janedoe.example/profile/me.jgp"
      );
    });
  });
});
