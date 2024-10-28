/*  Profile View
*/

import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import { DataBrowserContext } from "pane-registry";
import { NamedNode, LiveStore } from "rdflib";
import { card, padding, paddingSmall, responsiveGrid } from "./baseStyles";
import { ChatWithMe } from "./ChatWithMe";
import { FriendList } from "./FriendList";
import { presentProfile } from "./presenter";
import { presentCV } from './CVPresenter' // 20210527
import { presentSocial } from './SocialPresenter' // 20210527
import { presentStuff } from './StuffPresenter' // 20210527
import { ProfileCard } from "./ProfileCard";
import { CVCard } from "./CVCard";
import { SocialCard } from "./SocialCard";
import { StuffCard } from "./StuffCard";
import { QRCodeCard } from "./QRCodeCard";
import { addMeToYourFriendsDiv } from "./addMeToYourFriends";

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext
): Promise <TemplateResult> {
  const profileBasics = presentProfile(subject, context.session.store as LiveStore); // rdflib rdfs type problems
  const rolesByType = presentCV (subject, context.session.store as LiveStore)
  const Accounts = presentSocial(subject, context.session.store as LiveStore)
  const stuffData = await presentStuff(subject)
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
        ${CVCard(profileBasics, rolesByType)}
        ${SocialCard(profileBasics, accounts)}
        ${StuffCard(profileBasics, context, subject, stuffData)}
        ${FriendList(profileBasics, subject, context)}
      <div style="${styles.chat}">${ChatWithMe(subject, context)}</div>
      <div data-testid="qrcode-display" style="${styles.card}">
        ${QRCodeCard(profileBasics, subject)}
      </div>
    </div>
  `;
}
