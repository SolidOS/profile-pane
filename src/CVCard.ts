import { html, nothing, TemplateResult } from "lit-html";
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
  const { rolesByType, skills } = cvData
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    "color": profileBasics.highlightColor, // was "text-decoration-color"
  });
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

    </div>
  `;
};
/*
const Line = (value, prefix = nothing) =>
  value ? html`<p>${prefix} ${value}</p>` : nothing;

const Image = (src, alt) =>
  src ? html`<img style=${styles.image} src=${src} alt=${alt} />` : nothing;
*/
