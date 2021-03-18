import {findByText,} from "@testing-library/dom";
import {parse} from "rdflib";
import {store} from "solid-ui";
import pane from "../";
import {context, doc, subject} from "./setup";

describe("chat with me", () => {
    describe("without a started chat", () => {
        let result;
        beforeAll(() => {
            store.removeDocument(doc);
            const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:name "Jane Doe";
      .
  `;
            parse(turtle, store, doc.uri);
            result = pane.render(subject, context);
        });

        it("renders a chat button", async () => {
            const button = await findByText(result, "CHAT WITH ME");
            expect(button).not.toBeNull();
        });
    });
});
