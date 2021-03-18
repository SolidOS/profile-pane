import {TemplateResult} from "lit-html";
import {DataBrowserContext} from "pane-registry";
import {NamedNode} from "rdflib";
import {widgets} from "solid-ui";

export const ChatWithMe = (subject: NamedNode, context: DataBrowserContext): TemplateResult => {
    const chatButton = widgets.button(
        context.dom,
        undefined,
        "Chat with me",
        async () => {
            console.log("clicked")
        },
        {needsBorder: true}
    );
    return chatButton;
};