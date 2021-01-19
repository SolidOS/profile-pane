import { html } from "lit-html";
import { NamedNode } from "rdflib";
import { styleMap } from "lit-html/directives/style-map.js";
import { card, responsiveGrid } from "./baseStyles";
import { ProfileCard } from "./ProfileCard";

const styles = {
  grid: styleMap(responsiveGrid()),
  card: styleMap(card()),
};

export const ProfileView = (subject: NamedNode) => {
  const profile = {
    webId: subject.value,
    name: "Jane Doe",
    imageSrc: "https://i.pravatar.cc/300?img=30",
    country: "Germany",
    organization: "Solid Community",
    role: "Test Double",
    location: "Hamburg, Germany",
  };
  return html`
    <div style="${styles.grid}">
      <div style="${styles.card}">${ProfileCard(profile)}</div>
      <div style="${styles.card}">Friend list</div>
    </div>
  `;
};
