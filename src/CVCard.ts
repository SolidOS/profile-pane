import { html, TemplateResult } from "lit-html";
import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter,
  textLeft,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";
import { CVPresentation } from "./CVPresenter";
import { styleMap } from "lit-html/directives/style-map.js";
import { card } from "./baseStyles";

const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  card: styleMap(card()),
  info: styleMap({ ...paddingSmall(), ...textLeft() }),
};

export const CVCard = (
  profileBasics: ProfilePresentation,
  cvData: CVPresentation
): TemplateResult => {
 
  const { rolesByType, skills, languages } = cvData;
  
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    color: profileBasics.highlightColor, // was "text-decoration-color"
  });

  if(renderRoles(rolesByType["FutureRole"]) || renderRoles(rolesByType["CurrentRole"]) || renderRoles(rolesByType["PastRole"]) || renderSkills(skills) || renderLanguages(languages)){
  return html`
  <div data-testid="curriculum-vitae" style="${styles.card}">
    <div style=${styles.info}>
      <h3 style=${nameStyle}>Bio</h3>
      <div style=${styles.info}>${renderRoles(rolesByType["FutureRole"])}</div>
      <hr />
      <div style=${styles.info}>${renderRoles(rolesByType["CurrentRole"])}</div>
      <hr />
      <div style=${styles.info}>${renderRoles(rolesByType["PastRole"])}</div>
      <hr />
      <h3 style=${nameStyle}>Skills</h3>
      <div style=${styles.info}>${renderSkills(skills)}</div>
      <h3 style=${nameStyle}>Languages</h3>
      <div style=${styles.info}>${renderLanguages(languages)}</div>
    </div>
    </div>
  `}
  return html``
}

function renderRole(role) {
  return role
    ? html`<div style="margin-top: 0.3em; margin-bottom: 0.3em;">
        <b>${role.orgName}</b>
        <span>${strToUpperCase(role.roleText)}</span>
        <span>${role.dates}</span>   
      </div> `
    : html``;
}

function renderRoles(roles) {
    if (roles[0] > "")
      return html`${renderRole(roles[0])}${roles.length > 1 ? renderRoles(roles.slice(1)) : html``}`
}

function renderSkill(skill) {
  return skill
    ? html`<div style="margin: 0.5em;">
        <p style="text-align: center;">${skill}</p>
      </div> `
    : html``;
}

function renderSkills(skills) {
  if(skills[0] > "")
    return html`${renderSkill(strToUpperCase(skills[0]))} ${skills.length > 1 ? renderSkills(skills.slice(1)) : html``}`
}

function renderLan(language) {
  return language
    ? html`<div style="margin: 0.5em;">
        <p style="text-align: center;">${language}</p>
      </div> `
    : html``;
}

function renderLanguages(languages) {
  if(languages[0] > "")
    return html`${renderLan(languages[0])}${languages.length > 1 ? renderLanguages(languages.slice(1)) : html``}`
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
