import { html } from "lit-html";
import { NamedNode } from "rdflib";

export const ProfileView = (subject: NamedNode) =>
  html`<div>Hello, ${subject.value}!</div>`;
