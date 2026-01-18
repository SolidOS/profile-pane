import { html, TemplateResult } from 'lit-html'
import { SocialPresentation } from './SocialPresenter'
import './styles/SocialCard.css'


export const SocialCard = (
  SocialData: SocialPresentation
): TemplateResult => {
 
  const { accounts } = SocialData

  if(accounts.length){

    return html`
      <section
        class="socialCard"
        aria-labelledby="social-card-title"
        data-testid="social-media"
      >
        <nav aria-label="Social media profiles">
          <ul class="socialList list-reset" role="list">
            ${accounts.map(account => renderAccount(account))}
          </ul>
        </nav>
      </section>
    `
  }

  function renderAccount(account) {
    return account.homepage && account.name && account.icon
      ? html`
          <li class="socialItem" role="listitem">
            <a 
              href="${account.homepage}" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Visit ${account.name} profile (opens in new tab)"
              style="display: flex; align-items: center; gap: 0.5em; text-decoration: none;"
            >
              <img 
                class="socialIcon" 
                src="${account.icon}" 
                alt="${account.name} icon"
                width="40"
                height="40"
                loading="lazy"
              />
              <span class="text-wrap-anywhere">${account.name}</span>
            </a>
          </li>
        `
      : html``
  }

}
