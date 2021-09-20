import pane from "../";
import { parse } from "rdflib";
import { store } from "solid-ui";
import { findByTestId, findByText } from "@testing-library/dom";
import { context, doc, subject } from "./setup";
import fetchMock from "jest-fetch-mock";

describe("profile-pane", () => {
  let friends;
  let noFriendsMessage;

  describe("with friends", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      const turtle = `
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
      friends = await findByTestId(result, "friend-list");
    });

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
    beforeAll(async () => {
      store.removeDocument(doc);
      const result = pane.render(subject, context);
      friends = await findByTestId(result, "friend-list");
      noFriendsMessage = await findByText(result, "You have no friends in your list yet");
    });

    it("renders the friend list", () => {
      expect(friends).toContainHTML("Friends");
    });

    it("renders an empty friend list", () => {
      expect(noFriendsMessage).not.toBeNull();
    });
  });

  describe("with more friends in separate document", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:knows [
            foaf:name "Alice";
          ], [
            vcard:fn "Bob";
          ];
          rdfs:seeAlso <./friends.ttl>;
      .
  `;
      parse(turtle, store, doc.uri);
      fetchMock.mockOnceIf(
        "https://janedoe.example/profile/friends.ttl",
        `
          @prefix jane: </profile/card#>.
          @prefix foaf: <http://xmlns.com/foaf/0.1/> .
          @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
          jane:me foaf:knows [
            foaf:name "Claire";
          ], [
            vcard:fn "Dave";
          ];
      .
      `,
        {
          headers: {
            "Content-Type": "text/turtle",
          },
        }
      );
      const result = pane.render(subject, context);
      friends = await findByTestId(result, "friend-list");
    });

    it("renders the friend list", () => {
      expect(friends).toContainHTML("Friends");
    });

    it("renders Alice in list", () => {
      expect(friends).toContainHTML("Alice");
    });
    it("renders Bob in list", () => {
      expect(friends).toContainHTML("Bob");
    });
    it("renders Claire in list", () => {
      expect(friends).toContainHTML("Bob");
    });
    it("renders Dave in list", () => {
      expect(friends).toContainHTML("Bob");
    });
  });
});
