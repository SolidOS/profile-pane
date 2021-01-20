import pane from "./";
import { parse, sym } from "rdflib";
import { DataBrowserContext } from "pane-registry";
import { store } from "solid-ui";
import {
  getByAltText,
  getByTestId,
  queryByAltText,
} from "@testing-library/dom";

describe("profile-pane", () => {
  const subject = sym("https://janedoe.example/profile/card#me");
  const doc = subject.doc();

  const context = {
    dom: document,
    session: {
      store,
    },
  } as DataBrowserContext;

  let result;

  describe("with full profile", () => {
    beforeAll(() => {
      store.removeDocument(doc);
      let turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:name "Jane Doe";
          foaf:img </profile/me.jgp>;
          vcard:role "Test Double";
          vcard:organization-name "Solid Community";
          vcard:hasAddress [
            vcard:locality "Hamburg";
            vcard:country-name "Germany";
          ];
          foaf:knows [
            foaf:name "John Doe";
          ], [
            vcard:fn "Alice";
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
      expect(result).toContainHTML("🌐 Hamburg, Germany");
    });

    it("renders the image", () => {
      const image = getByAltText(result, "Jane Doe");
      expect(image).toHaveAttribute(
        "src",
        "https://janedoe.example/profile/me.jgp"
      );
    });

    describe("friend list", () => {
      let friends;
      beforeAll(() => {
        friends = getByTestId(result, "friend-list");
      });
      it("renders the friend list", () => {
        expect(friends).toContainHTML("Friends");
      });
      it("renders John in list", () => {
        expect(friends).toContainHTML("John Doe");
      });
      it("renders Alice in list", () => {
        expect(friends).toContainHTML("Alice");
      });
    });
  });

  describe("with empty profile", () => {
    let card;
    beforeAll(() => {
      store.removeDocument(doc);
      result = pane.render(subject, context);
      card = getByTestId(result, "profile-card");
    });

    it("renders only a makeshift name based on URI", () => {
      expect(card.textContent.trim()).toBe("card");
    });

    it("does not render broken profile image", () => {
      const image = queryByAltText(card, /.*/);
      expect(image).toBeNull();
    });

    it("renders an empty friend list", () => {
      const friends = getByTestId(result, "friend-list");
      expect(friends.textContent.trim()).toBe("Friends");
    });
  });
});
