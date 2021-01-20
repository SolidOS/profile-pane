import { html } from "lit-html";
import { NamedNode } from "rdflib";
import { styleMap } from "lit-html/directives/style-map.js";
import { card, responsiveGrid } from "./baseStyles";
import { ProfileCard } from "./ProfileCard";
import { DataBrowserContext } from "pane-registry";
import { FriendList } from "./FriendList";
import { presentProfile } from "./presenter";

const styles = {
  grid: styleMap(responsiveGrid()),
  card: styleMap(card()),
};

export const ProfileView = (
  subject: NamedNode,
  context: DataBrowserContext
) => {
  const profile = presentProfile(subject, context.session.store);

  return html`
    <div style="${styles.grid}">
      <div>
        <div data-testid="profile-card" style="${styles.card}">
          ${ProfileCard(profile)}
        </div>
      </div>
      <div data-testid="friend-list" style="${styles.card}">
        ${FriendList(subject, context)}
      </div>
    </div>
  `;
};
