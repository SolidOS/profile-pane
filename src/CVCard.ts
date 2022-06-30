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
  if(renderLanguages(languages) || renderSkills(skills)){
  return html`
  <div data-testid="curriculum-vitae" style="${styles.card}">
    <div style=${styles.info}>
      <h3 style=${nameStyle}>Bio</h3>
      <div style=${styles.info}>${renderRoles(rolesByType["CurrentRole"])}</div>
      <hr />
      <div style=${styles.info}>${renderRoles(rolesByType["PastRole"])}</div>
      <hr />
      <div style=${styles.info}>${renderRoles(rolesByType["FutureRole"])}</div>
      <div style=${styles.info}>${renderSkills(skills)}</div>
      <div style=${styles.info}>${renderLanguages(languages)}</div>
    
    </div>
    </div>
  `};
  return html``
};



function renderRole(role) {
  return role
    ? html`<div style="margin-top: 0.3em; margin-bottom: 0.3em;">
        <b>${role.orgName}</b>
        <span>${role.roleText}</span>
        <span>${role.dates}</span>
      </div> `
    : html``;
}


function renderRoles(roles) {
  if(roles[0] > "")
  return html`${renderRole(roles[0])}${ renderRoles(roles.slice(1))}`;
  else if(roles[0] < "")
  return null
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
  return html`${renderSkill(skills[0])}${renderSkills(skills.slice(1))} `;
  else if(skills[0] < "")
  return null

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
  return html`${renderLan(languages[0])}${renderLan(languages.slice(1))}`
  else if(languages[0] < "") 
  return null
  
}
