import { html, nothing } from 'lit-html'
import * as localStyles from './styles/ProfileCard.module.css'
import { ProfilePresentation } from './presenter'


export const ProfileCard = ({
  name,
  imageSrc,
  introduction,
  location,
  pronouns,
  highlightColor,
}: ProfilePresentation) => {
  return html`
    <article class=${localStyles.profileCard} role="region" aria-labelledby="profile-card-title">
      <header class=${localStyles.header}>
        ${Image(imageSrc, name)}
        <h3
          id="profile-card-title"
          class=${localStyles.name}
          style="text-decoration-color: ${highlightColor};"
        >${name}</h3>
      </header>
      <section class=${localStyles.intro} aria-label="Profile Details">
        ${Line(introduction)}
        ${Line(location, '🌐')}
        ${Line(pronouns)}
      </section>
    </article>
  `
}

const Line = (value, prefix: symbol | string = nothing) =>
  value ? html`<p class=${localStyles.details}>${prefix} ${value}</p>` : nothing

const Image = (src, alt) =>
  src ? html`<img class=${localStyles.image} src=${src} alt=${alt} />` : nothing
