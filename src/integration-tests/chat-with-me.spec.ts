import {findByText, fireEvent,} from "@testing-library/dom";
import {parse} from "rdflib";
import {ChatLogic} from "solid-logic/lib/chat/ChatLogic";
import pane from "../";
import {context, doc, subject} from "./setup";

describe("chat with me", () => {

    beforeAll(() => {
        context.session.store.removeDocument(doc);
        const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:name "Jane Doe";
      .
  `;
        parse(turtle, context.session.store, doc.uri);
    });

    describe("without a started chat", () => {
        let result;
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue(null),
            } as unknown as ChatLogic
            result = pane.render(subject, context);
        });

        it("renders a chat button", async () => {
            const button = await findByText(result, "CHAT WITH ME");
            expect(button).not.toBeNull();
        });

        it('shows the chat when button is clicked', async () => {
            const button = await findByText(result, "CHAT WITH ME");
            fireEvent.click(button);
            const chatPane = await findByText(result,'mock long chat pane');
            expect(chatPane).not.toBeNull();
        });
    });

    describe("with a started chat", () => {
        let result;
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue('https://pod.example/chat'),
            } as unknown as ChatLogic
            result = pane.render(subject, context);
        });

        it("renders the chat pane directly", async () => {
            const chatPane = await findByText(result,'mock long chat pane');
            expect(chatPane).not.toBeNull();
        });

    });
});
