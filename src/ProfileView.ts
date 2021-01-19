import { html } from "lit-html";
import { NamedNode } from "rdflib";
import { styleMap } from "lit-html/directives/style-map.js";
import { card, responsiveGrid } from "./baseStyles";

const styles = {
  grid: styleMap(responsiveGrid()),
  card: styleMap(card()),
};

export const ProfileView = (subject: NamedNode) =>
  html`<div style="${styles.grid}">
    <div style="${styles.card}">Hello, ${subject.value}!</div>
    <div style="${styles.card}">Friend list</div>
  </div>`;
