import { context, doc, subject } from "./setup";
import pane from "../";
import { findByText, fireEvent } from "@testing-library/dom";
import { parse } from "rdflib";
import { ns } from "solid-ui";

describe("add-me-to-your-friends", () => {
  describe("saveNewFriend with NO logged in user", () => {
    let result;
    beforeAll(() => {
      result = pane.render(subject, context);
    });

    it("renders the Add me to friends button", async () => {
      const button = await findByText(result, "ADD ME TO YOUR FRIENDS");
      expect(button).not.toBeNull();
    });

    it("saveNewFriend with user NOT logged in", async () => {
      const button = await findByText(result, "ADD ME TO YOUR FRIENDS");
      fireEvent.click(button);
      const errorMessage = await findByText(result, "Current user not found! Not logged in?");
      expect(errorMessage).not.toBeNull();
      expect(button).toThrowError;
    });
  });

  /* describe("saveNewFriend with user logged in", () => {
    let result;
    beforeEach(() => {
      context.session.store.removeDocument(doc);
      const turtle = `
        @prefix : <#>.
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
        @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
        :me foaf:name "Testing Solidos";
        .
        `;
      parse(turtle, context.session.store, doc.uri);
      result = pane.render(subject, context);
    });

    it("renders the Add me to friends button", async () => {
      const button = await findByText(result, "ADD ME TO YOUR FRIENDS");
      expect(button).not.toBeNull();
    });

    it("verify added triple", async () => {
      const button = await findByText(result, "ADD ME TO YOUR FRIENDS");
      fireEvent.click(button);
      console.dir(context.session.store.statements)
      const triple = context.session.store.any(subject, ns.foaf("knows"), null, doc);
      expect(triple).not.toBeNull();
    });
  }); */
});
