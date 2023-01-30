import { ns, widgets } from "solid-ui";
import { DataBrowserContext } from "pane-registry";
import { NamedNode } from "rdflib";
import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import { card, headingLight, padding } from "./baseStyles";
import { ProfilePresentation } from "./presenter";

import {
  heading
} from "./baseStyles";

const styles = {
  root: styleMap(padding()),
  heading: styleMap(headingLight()),
  card: styleMap(card()),
};

export const FriendList = ( profileBasics: ProfilePresentation,
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    color: profileBasics.highlightColor, // was "text-decoration-color"
  });

  if (createList(subject, context)) {
    return html`
    <div data-testid="friend-list" style="${styles.card}">
      <div style=${styles.root}>
        <h3 style=${nameStyle}>Friends</h3>
        ${createList(subject, context)}
      </div>
    </div>
    `
  }
  return html``
};

const createList = (subject: NamedNode, { dom }: DataBrowserContext) => {
  const target = dom.createElement("div");
  widgets.attachmentList(dom, subject, target, {
    doc: subject.doc(),
    modify: false,
    predicate: ns.foaf("knows"),
    noun: "friend",
  });
  if (target.textContent === "")
    return null
  else return target;
};
