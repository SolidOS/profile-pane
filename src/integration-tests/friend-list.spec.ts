import pane from "../";
import { parse } from "rdflib";
import { store } from "solid-ui";
import { getByTestId } from "@testing-library/dom";
import { context, doc, subject } from "./setup";

describe("profile-pane", () => {
  let friends;

  describe("with friends", () => {
    beforeAll(() => {
      store.removeDocument(doc);
      let turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:knows [
            foaf:name "Alice";
          ], [
            vcard:fn "Bob";
          ];
      .
  `;
      parse(turtle, store, doc.uri);
      const result = pane.render(subject, context);
      friends = getByTestId(result, "friend-list");
    });

    beforeAll(() => {});
    it("renders the friend list", () => {
      expect(friends).toContainHTML("Friends");
    });
    it("renders Alice in list", () => {
      expect(friends).toContainHTML("Alice");
    });
    it("renders Bob in list", () => {
      expect(friends).toContainHTML("Bob");
    });
  });

  describe("without friends", () => {
    beforeAll(() => {
      store.removeDocument(doc);
      const result = pane.render(subject, context);
      friends = getByTestId(result, "friend-list");
    });

    it("renders an empty friend list", () => {
      expect(friends.textContent.trim()).toBe("Friends");
    });
  });
});
