import { html, nothing } from 'lit-html'
import * as localStyles from './styles/ProfileCard.module.css'
import { ProfilePresentation } from './presenter'
import { addMeToYourFriendsDiv } from './addMeToYourFriends'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { QRCodeCard } from './QRCodeCard'


export const ProfileCard = ({
  name, imageSrc, introduction, location, pronouns, highlightColor, backgroundColor
}: ProfilePresentation, context: DataBrowserContext, subject: NamedNode) => {

  return html`
    <article class=${localStyles.profileCard} role="region" aria-labelledby="profile-card-title">
      <section class=${localStyles.header} aria-label="Profile picture">
        ${Image(imageSrc, name)}
      </section>
      <section class=${localStyles.intro} aria-label="Profile Details">
        ${Line(introduction)}
        ${Line(location, '🌐')}
        ${Line(pronouns)}
      </section>
      <section class=${localStyles.buttonSection} aria-label="Profile Actions">
        ${addMeToYourFriendsDiv(subject, context)}
      </section>
      <section class=${localStyles.qrCodeSection} aria-label="Friends">
        ${QRCodeCard(highlightColor, backgroundColor, subject)}
      </section>
    </article>
  `
}

const Line = (value, prefix: symbol | string = nothing) =>
  value ? html`<p class=${localStyles.details}>${prefix} ${value}</p>` : nothing

const Image = (src, alt) =>
  src ? html`<img class=${localStyles.image} src=${src} alt=${alt} />` : nothing
