import { ns, widgets } from "solid-ui";
import { DataBrowserContext } from "pane-registry";
import { NamedNode } from "rdflib";
import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import { headingLight, padding } from "./baseStyles";

const styles = {
  root: styleMap(padding()),
  heading: styleMap(headingLight()),
};

const noFriendsFoundMessage = "You have no friends in your list yet";

export const FriendList = (subject: NamedNode, context: DataBrowserContext): TemplateResult => html`
  <div style=${styles.root}>
    <h3 style=${styles.heading}>Friends</h3>
    ${createList(subject, context)}
  </div>
`;

const createList = (subject: NamedNode, { dom }: DataBrowserContext) => {
  const target = dom.createElement("div");
  widgets.attachmentList(dom, subject, target, {
    doc: subject.doc(),
    modify: false,
    predicate: ns.foaf("knows"),
    noun: "friend",
  });
  if (target.textContent === "")
    return noFriendsInTheListMessage(dom, noFriendsFoundMessage);
  else return target;
};

const noFriendsInTheListMessage = (dom: HTMLDocument, message: string): TemplateResult => html`
  <div id="no-friends" style=${styles.root}>${message}</div>
`;
