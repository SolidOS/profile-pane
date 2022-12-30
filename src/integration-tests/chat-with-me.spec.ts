import {findByText, fireEvent,} from "@testing-library/dom";
import {parse} from "rdflib";
// import {ChatLogic} from "solid-logic";
import pane from "../";
import {context, doc, subject} from "./setup";


// @@ SHULD BE EXPORTED FROM solid-logic
/*
interface ChatLogic {
    setAcl: (chatContainer: NamedNode, me: NamedNode, invitee: NamedNode) => Promise<void>,
    addToPrivateTypeIndex: (chatThing, me) => void | Promise<void>,
    findChat: (invitee: NamedNode) => Promise<Chat>,
    createChatThing: (chatContainer: NamedNode, me: NamedNode) => Promise<NamedNode>,
    mintNew: (newPaneOptions: NewPaneOptions) => Promise<CreatedPaneOptions>,
    getChat: (invitee: NamedNode, boolean) => Promise<NamedNode | null>,
    sendInvite: (invitee: NamedNode, chatThing: NamedNode) => void
}
*/
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
            } as any // as ChatLogic
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

    describe("while chat loading", () => {
        let result;
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue(new Promise(() => null)),
            } as any // as ChatLogic
            result = pane.render(subject, context);
        });

        it("renders a loading text", async () => {
            const button = await findByText(result, "Loading...");
            expect(button).not.toBeNull();
        });

    });

    describe("with a started chat", () => {
        let result;
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue('https://pod.example/chat'),
            } as any // as ChatLogic
            result = pane.render(subject, context);
        });

        it("renders the chat pane directly", async () => {
            const chatPane = await findByText(result,'mock long chat pane');
            expect(chatPane).not.toBeNull();
        });

    });
});
