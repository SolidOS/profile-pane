import { html, TemplateResult } from "lit-html";
import { asyncReplace } from "lit-html/directives/async-replace.js";
import { NamedNode } from "rdflib";
import { DataBrowserContext } from "pane-registry";
import { widgets } from 'solid-ui'

import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter,
  textLeft,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";
import { StuffPresentation } from "./StuffPresenter";
import { styleMap } from "lit-html/directives/style-map.js";
import { card } from "./baseStyles";

const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  card: styleMap(card()),
  info: styleMap({ ...paddingSmall(), ...textLeft() }),
};

export const StuffCard = (profileBasics: ProfilePresentation,
  context: DataBrowserContext,
  subject: NamedNode, stuffData): TemplateResult => {

  const { stuff }  = stuffData;
  const { dom } = context;
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    color: profileBasics.highlightColor, // was "text-decoration-color"
  });
  // return renderThings(stuff)
  return html`
  <div data-testid="stuff" style="${styles.card}">
    <div style=${styles.info}>
      <h3 style=${nameStyle}>Stuff</h3>

      <div style=${styles.info}><table data-testid="stuffTable">${renderThings(stuff, dom)}</table></div>
      <hr />

    </div>
    </div>
`
}

function renderThing (thing, dom) {
  const options = {}
  const row = widgets.personTR(dom, null, thing.instance, options)
  return row
}

function renderThing0 (thing, dom) {
  return thing
    ? html`<div style="margin: 0.5em;">
        <div style="margin: 1em; padding: 1em; border: 0.1em solid grey;">
        <a class="fillInLater" href="${thing.href}"><img src="${thing.icon}" style="height: 2em; width: 2em;"><span>${thing.name}</span></a>
      </div> `
    : html``;
}

function renderThings(things, dom) {
    // console.log('Renderthings: ', things)
    if (things.length === 0) return html``;
    return html`${renderThing(things[0], dom)}${things.length > 1 ? renderThings(things.slice(1), dom) : html``}`
}

// ENDS
