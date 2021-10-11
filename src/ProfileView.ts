/*  Profile View
*/

import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import { DataBrowserContext } from "pane-registry";
import { NamedNode, Store } from "rdflib";
import { card, padding, paddingSmall, responsiveGrid } from "./baseStyles";
import { ChatWithMe } from "./ChatWithMe";
import { FriendList } from "./FriendList";
import { presentProfile } from "./presenter";
import { presentCV } from './CVPresenter' // 20210527
import { ProfileCard } from "./ProfileCard";
import { CVCard } from "./CVCard";
import { addMeToYourFriendsDiv } from "./addMeToYourFriends";

export const ProfileView = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const profileBasics = presentProfile(subject, context.session.store as Store); // rdflib rdfs type problems
  const rolesByType = presentCV (subject, context.session.store as Store)
  const styles = {
    grid: styleMap({
      ...responsiveGrid(),
      ...paddingSmall(),
      background: `radial-gradient(circle, ${profileBasics.backgroundColor} 80%, ${profileBasics.highlightColor} 100%)`,
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
          ${ProfileCard(profileBasics)}
          ${addMeToYourFriendsDiv(subject, context)}
        </div>
      </div>
      <div data-testid="friend-list" style="${styles.card}">
        ${FriendList(subject, context)}
      </div>
      <div data-testid="curriculum-vitae" style="${styles.card}">
        ${CVCard(profileBasics, rolesByType)}
      </div>
      <div style="${styles.chat}">${ChatWithMe(subject, context)}</div>

    </div>
  `;
};
