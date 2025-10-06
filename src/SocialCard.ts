import { html, TemplateResult } from 'lit-html'
import { SocialPresentation } from './SocialPresenter'
import * as localStyles from './styles/SocialCard.module.css'


export const SocialCard = (
  SocialData: SocialPresentation
): TemplateResult => {
 
  const { accounts } = SocialData

  if(accounts.length){

    return html`
      <section
        class="${localStyles.socialCard}"
        aria-labelledby="social-card-title"
        role="region"
        data-testid="social-media"
      >
        <header class="${localStyles.socialHeader}" aria-label="Social Media Header">
          <h3 id="social-card-title">Follow me on</h3>
        </header>
        <ul class="${localStyles.socialList}" role="list">
          ${accounts.map(account => renderAccount(account))}
        </ul>
      </section>
    `
  }

  function renderAccount(account) {
    return account.homepage && account.name && account.icon
      ? html`
          <li class="${localStyles.socialItem}" role="listitem">
            <a href="${account.homepage}" target="_blank" rel="noopener noreferrer" aria-label="${account.name}" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none;">
              <img class="${localStyles.socialIcon}" src="${account.icon}" alt="${account.name} icon" />
              <span>${account.name}</span>
            </a>
          </li>
        `
      : html``
  }

}
