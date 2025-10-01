import { html, nothing } from 'lit-html'
import * as styles from './styles/ProfileCard.module.css'
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
    <article class=${styles.profileCard} role="region" aria-labelledby="profile-card-title">
      <header class=${styles.header}>
        ${Image(imageSrc, name)}
        <h3
          id="profile-card-title"
          class=${styles.name}
          style="text-decoration-color: ${highlightColor};"
        >${name}</h3>
      </header>
      <section class=${styles.intro} aria-label="Profile Details">
        ${Line(introduction)}
        ${Line(location, '🌐')}
        ${Line(pronouns)}
      </section>
    </article>
  `
}

const Line = (value, prefix: symbol | string = nothing) =>
  value ? html`<p class=${styles.details}>${prefix} ${value}</p>` : nothing

const Image = (src, alt) =>
  src ? html`<img class=${styles.image} src=${src} alt=${alt} />` : nothing
