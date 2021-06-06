import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import { DataBrowserContext } from "pane-registry";
import { NamedNode } from "rdflib";
import { card, padding, paddingSmall, responsiveGrid } from "./baseStyles";
import { ChatWithMe } from "./ChatWithMe";
import { FriendList } from "./FriendList";
import { presentProfile } from "./presenter";
import { ProfileCard } from "./ProfileCard";

export const ProfileView = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const profile = presentProfile(subject, context.session.store);
  const styles = {
    grid: styleMap({
      ...responsiveGrid(),
      ...paddingSmall(),
      background: `radial-gradient(circle, ${profile.backgroundColor} 80%, ${profile.highlightColor} 100%)`,
    }),
    card: styleMap(card()),
    chat: styleMap({
      ...card(),
      ...padding(),
    }),
  };

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
      <div style="${styles.chat}">${ChatWithMe(subject, context)}</div>
    </div>
  `;
};
