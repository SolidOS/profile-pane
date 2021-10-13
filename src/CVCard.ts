import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter, textLeft,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";
import { CVPresentation } from "./CVPresenter";

const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  card: styleMap({}),
  info: styleMap({ ...paddingSmall(), ...textLeft()}),
};

export const CVCard = (profileBasics: ProfilePresentation, cvData: CVPresentation): TemplateResult => {
  const { rolesByType, skills, languages } = cvData
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    "color": profileBasics.highlightColor, // was "text-decoration-color"
  });

  return html`
    <div style=${styles.info}>
      <h3 style=${nameStyle}>Bio</h3>
      <div style=${styles.info}>
        ${renderRoles(rolesByType['CurrentRole'])}
      </div>
      <hr>
      <div style=${styles.info}>
        ${renderRoles(rolesByType['PastRole'])}
      </div>
      <hr>
      <div style=${styles.info}>
        ${renderRoles(rolesByType['FutureRole'])}
      </div>
      <div style=${styles.info}>
        ${renderSkills(skills)}
      </div>
      <div style=${styles.info}>
        ${renderLanguages(languages)}
      </div>
    </div>
  `;
};

function renderRole (role) {
  return role ? html`<div style="margin-top: 0.3em; margin-bottom: 0.3em;">
  <b>${role.orgName}</b>
    <span>${role.roleText}</span>
    <span>${role.dates}</span>
  </div>
  ` : html``;
}

function renderRoles (roles) {
  return html`${renderRole(roles[0])}
  ${roles.length > 1 ? renderRoles(roles.slice(1)) : html``}
  `
}

function renderSkill (skill) {
  return skill ? html`<div style="margin: 0.5em;">
  <p style="text-align: center;">${skill}</p>
  </div>
  ` : html``;
}

function renderSkills (skills) {

  return html`${renderSkill(skills[0])}
  ${skills.length > 1 ? renderSkills(skills.slice(1)) : html``}
  `
}

function renderLan (language) {
  return language ? html`<div style="margin: 0.5em;">
  <p style="text-align: center;">${language}</p>
  </div>
  ` : html``;
}

function renderLanguages (languages) {

  return html`${renderLan(languages[0])}
  ${languages.length > 1 ? renderLanguages(languages.slice(1)) : html``}
  `
}

