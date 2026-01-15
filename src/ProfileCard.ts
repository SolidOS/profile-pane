import { html, nothing } from 'lit-html'
import './styles/ProfileCard.css'
import { ProfilePresentation } from './presenter'
import { addMeToYourFriendsDiv } from './addMeToYourFriends'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { QRCodeCard } from './QRCodeCard'


export const ProfileCard = ({
  name, imageSrc, introduction, location, pronouns, highlightColor, backgroundColor
}: ProfilePresentation, context: DataBrowserContext, subject: NamedNode) => {

  return html`
    <article class="profileCard" role="main" aria-labelledby="profile-name">
      <h2 id="profile-name" class="sr-only">${name}</h2>
      <header class="header" aria-label="Profile information">
        ${Image(imageSrc, name)}
      </header>
      
      <section class="intro" aria-label="About">
        ${Line(introduction, '', 'About')}
        ${Line(location, '🌐', 'Location')}
        ${Line(pronouns, '', 'Pronouns')}
      </section>
      
      <section class="buttonSection" aria-label="Actions" role="complementary">
        ${addMeToYourFriendsDiv(subject, context)}
      </section>
      
      <aside class="qrCodeSection" aria-label="Contact QR Code" role="complementary">
        ${QRCodeCard(highlightColor, backgroundColor, subject)}
      </aside>
    </article>
  `
}

const Line = (value, prefix: symbol | string = nothing, label: string = '') =>
  value ? html`
    <div class="details" role="text" ${label ? `aria-label="${label}: ${value}"` : ''}>
      ${prefix} ${value}
    </div>
  ` : nothing

const Image = (src, alt) =>
  src
    ? html`
        <img
          class="image"
          src=${src}
          alt="Profile photo of ${alt}"
          width="160"
          height="160"
          loading="eager"
        />
      `
    : html`
        <div class="image-alt" role="img" aria-label="${alt}" tabindex="0">
          ${alt}
        </div>
      `
