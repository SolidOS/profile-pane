import { html, TemplateResult } from "lit-html";
import { DataBrowserContext } from "pane-registry";
import { NamedNode } from "rdflib";
import { widgets } from "solid-ui";
import { asyncReplace } from "lit-html/directives/async-replace.js";
import { chatWithMeButtonText, loadingMessage } from "./texts";

export const ChatWithMe = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const logic = context.session.logic;
  const longChatPane = context.session.paneRegistry.byName("long chat");

  async function* chatContainer() {
    const chatContainer = context.dom.createElement("div");

    let exists;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      yield loadingMessage, (exists = await logic.chat.getChat(subject, false));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      exists = false;
    }
    if (exists) {
      chatContainer.appendChild(longChatPane.render(exists, context, {}));
      yield chatContainer;
    } else {
      const button = widgets.button(
        context.dom,
        undefined,
        chatWithMeButtonText,
        async () => {
          try {
            const chat: NamedNode = await logic.chat.getChat(subject, true);
            chatContainer.innerHTML = "";
            chatContainer.appendChild(longChatPane.render(chat, context, {}));
          } catch (e) {
            chatContainer.appendChild(
              widgets.errorMessageBlock(context.dom, message +" "+ e.message)
            );
          }
        },
        { needsBorder: true }
      );
      chatContainer.appendChild(button);
      yield chatContainer;
    }
  }

  return html` ${asyncReplace(chatContainer())} `;
};
