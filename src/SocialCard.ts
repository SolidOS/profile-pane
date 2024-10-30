import { html, TemplateResult } from "lit-html";
import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter,
  textLeft, textRight,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";
import { SocialPresentation } from "./SocialPresenter";
import { styleMap } from "lit-html/directives/style-map.js";
import { card } from "./baseStyles";
import { icons } from "solid-ui";


const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  card: styleMap(card()),
  info: styleMap({ ...paddingSmall(), ...textLeft() }),
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
    <div style=${styles.info}>
      <h3 style=${nameStyle}>Follow me on</h3>

      <div style=${styles.info}>${renderAccounts(accounts)}</div>
    </div>
    </div>
  `}
  return html``
}

function renderAccount(account) {
  return account.homepage && account.name && account.icon
    ? html`<div style="margin-top: 0.3em; margin-bottom: 0.3em;">

        <a href="${account.homepage}" target="social"> 
                <span>${account.name}</span>
        <img style="width: 2em; height: 2em; margin: 1em;" src="${account.icon}" alt="${account.name}"> 
        </a>
      </div> ` 
    : html``;
}

function renderAccounts(accounts) {
    if (accounts.length > 0)
      return html`${renderAccount(accounts[0])}${accounts.length > 1 ? renderAccounts(accounts.slice(1)) : html``}`
}

 function strToUpperCase(str) {
  if (str && str[0] > "") {
    const strCase = str.split(' ');
    for (let i = 0; i < strCase.length; i++) {
      strCase[i] = strCase[i].charAt(0).toUpperCase() +
        strCase[i].substring(1);
    }
    return strCase.join(' ');
  }
  return '';
}

// ends

