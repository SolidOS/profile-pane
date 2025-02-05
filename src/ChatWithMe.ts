import { html, TemplateResult } from "lit-html";
import { DataBrowserContext } from "pane-registry";
import { NamedNode } from "rdflib";
import { widgets } from "solid-ui";
import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter,
  textLeft,
  textGray,
} from "./baseStyles";
import { asyncReplace } from "lit-html/directives/async-replace.js";
import { styleMap } from "lit-html/directives/style-map.js";
import { ProfilePresentation } from "./presenter";
import { chatWithMeButtonText, loadingMessage } from "./texts";

const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  info: styleMap({ ...paddingSmall(), ...textLeft() }),
};

export const ChatWithMe = (
  subject: NamedNode,
  context: DataBrowserContext,
  profileBasics: ProfilePresentation
): TemplateResult => {
  const logic = context.session.logic;
  const longChatPane = context.session.paneRegistry.byName("long chat");
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
  // was "text-decoration-color"
  color: profileBasics.highlightColor

  });
  async function* chatContainer() {
    const chatContainer = context.dom.createElement("div");

    let exists;
    try {
      yield loadingMessage, (exists = await logic.chat.getChat(subject, false));
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
              widgets.errorMessageBlock(context.dom, e.message)
            );
          }
        },
        { needsBorder: true }
      );
      chatContainer.appendChild(button);
      yield chatContainer;
    }
  }

   return html`  <div style=${styles.info}>
                    <h3 style=${nameStyle}>Chat</h3></div> ${asyncReplace(chatContainer())}`
};
};
