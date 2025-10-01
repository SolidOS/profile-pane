import { html, TemplateResult } from 'lit-html'
import { ProfilePresentation } from './presenter'
import { SocialPresentation } from './SocialPresenter'
import * as styles from './styles/SocialCard.module.css'


export const SocialCard = (
  profileBasics: ProfilePresentation,
  SocialData: SocialPresentation
): TemplateResult => {
 
  const { accounts } = SocialData

  if(accounts.length){

    return html`
      <section
        class="${styles.socialCard}"
        aria-labelledby="social-card-title"
        role="region"
        data-testid="social-media"
      >
        <header class="${styles.socialHeader}" aria-label="Social Media Header">
          <h3 id="social-card-title">Follow me on</h3>
        </header>
        <ul class="${styles.socialList}" role="list">
          ${accounts.map(account => renderAccount(account))}
        </ul>
      </section>
    `
  }

  function renderAccount(account) {
    return account.homepage && account.name && account.icon
      ? html`
          <li class="${styles.socialItem}" role="listitem">
            <a href="${account.homepage}" target="_blank" rel="noopener noreferrer" aria-label="${account.name}" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none;">
              <img class="${styles.socialIcon}" src="${account.icon}" alt="${account.name} icon" />
              <span>${account.name}</span>
            </a>
          </li>
        `
      : html``
  }

}
