import { html, TemplateResult } from "lit-html";
import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter,
  textRight,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";
import { SocialPresentation } from "./SocialPresenter";
import { styleMap } from "lit-html/directives/style-map.js";
import { card } from "./baseStyles";


const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  card: styleMap(card()),
  info: styleMap({ ...paddingSmall(), ...textCenter() }),
  tools: styleMap({ ...paddingSmall(), ...textRight() }),
};

export const SocialCard = (
  profileBasics: ProfilePresentation,
  SocialData: SocialPresentation
): TemplateResult => {
 
  const { accounts } = SocialData;
  
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    color: profileBasics.highlightColor, // was "text-decoration-color"
  });

  if(accounts.length){

  return html`
  <div data-testid="social-media" style="${styles.card}">
    <div style=${styles.info + "margin: auto;"}>
      <h3 style=${nameStyle}>Follow me on</h3>

      <div style=${styles.info}>${renderAccounts(accounts)}</div>
    </div>
    </div>
  `}
  return html``
}

function renderAccount(account) {
  return account.homepage && account.name && account.icon
    ? html`<div class="textButton-0-1-3" style="margin-top: 0.3em; margin-bottom: 0.3em;">

        <a href="${account.homepage}" style="text-decoration: none;" target="social"> 
                <img style="width: 2em; height: 2em; margin: 1em; vertical-align:middle;" src="${account.icon}" alt="${account.name}"> 

                <span style="font-size: 1.2rem;">${account.name}</span> 
        </a>
      </div> ` 
    : html``;
}

function renderAccounts(accounts) {
    if (accounts.length > 0)
      return html`${renderAccount(accounts[0])}${accounts.length > 1 ? renderAccounts(accounts.slice(1)) : html``}`
}

// ends

