import { html } from 'lit-html'
import { ProfilePresentation } from './presenter'
import { CVPresentation } from './CVPresenter'
import * as styles from './styles/CVCard.module.css'

export const CVCard = (
  cvData: CVPresentation
) => {
  const { rolesByType, skills, languages } = cvData

  const futureRolesArr = rolesByType['FutureRole'] || []
  const currentRolesArr = rolesByType['CurrentRole'] || []
  const pastRolesArr = rolesByType['PastRole'] || []
  const skillsArr = skills || []
  const languagesArr = languages || []

  const hasFutureRole = Array.isArray(futureRolesArr) && futureRolesArr.length > 0
  const hasCurrentRole = Array.isArray(currentRolesArr) && currentRolesArr.length > 0
  const hasPastRole = Array.isArray(pastRolesArr) && pastRolesArr.length > 0
  const hasSkills = Array.isArray(skillsArr) && skillsArr.length > 0
  const hasLanguages = Array.isArray(languagesArr) && languagesArr.length > 0

  if (!(hasFutureRole || hasCurrentRole || hasPastRole || hasSkills || hasLanguages)) return html``

  return html`
    <section class="${styles.cvCard}" aria-label="Curriculum Vitae" data-testid="curriculum-vitae">
      ${hasFutureRole ? html`
        <section class="${styles.cvSection}" aria-labelledby="cv-future-heading">
          <h3 id="cv-future-heading">Future Roles</h3>
          <ul>
            ${renderRoles(futureRolesArr, true)}
          </ul>
        </section>
      ` : ''}
      ${hasCurrentRole ? html`
        <section class="${styles.cvSection}" aria-labelledby="cv-current-heading">
          <h3 id="cv-current-heading">Current Roles</h3>
          <ul>
            ${renderRoles(currentRolesArr, true)}
          </ul>
        </section>
      ` : ''}
      ${hasPastRole ? html`
        <section class="${styles.cvSection}" aria-labelledby="cv-past-heading">
          <h3 id="cv-past-heading">Past Roles</h3>
          <ul>
            ${renderRoles(pastRolesArr, true)}
          </ul>
        </section>
      ` : ''}
      ${hasSkills ? html`
        <section class="${styles.cvSection}" aria-labelledby="cv-skills-heading">
          <h3 id="cv-skills-heading">Skills</h3>
          <ul>
            ${renderSkills(skillsArr, true)}
          </ul>
        </section>
      ` : ''}
      ${hasLanguages ? html`
        <section aria-labelledby="cv-languages-heading">
          <h3 id="cv-languages-heading">Languages</h3>
          <ul>
            ${renderLanguages(languagesArr, true)}
          </ul>
        </section>
      ` : ''}
    </section>
  `
}


function renderRole(role, asList = false) {
  if (!role) return html``
  return asList
    ? html`<li class="${styles.cvRole}">
        <span class="${styles.cvOrg}">${role.orgName}</span>
        <span>${strToUpperCase(role.roleText)}</span>
        <span>${role.dates}</span>
      </li>`
    : html``
}

function renderRoles(roles, asList = false) {
  if (!roles || !roles.length || !roles[0]) return html``
  return html`${renderRole(roles[0], asList)}${roles.length > 1 ? renderRoles(roles.slice(1), asList) : html``}`
}

function renderSkill(skill, asList = false) {
  if (!skill) return html``
  return asList
    ? html`<li class="${styles.cvSkill}">${strToUpperCase(skill)}</li>`
    : html``
}

function renderSkills(skills, asList = false) {
  if (!skills || !skills.length || !skills[0]) return html``
  return html`${renderSkill(skills[0], asList)}${skills.length > 1 ? renderSkills(skills.slice(1), asList) : html``}`
}

function renderLan(language, asList = false) {
  if (!language) return html``
  return asList
    ? html`<li class="${styles.cvLanguage}">${language}</li>`
    : html``
}

function renderLanguages(languages, asList = false) {
  if (!languages || !languages.length || !languages[0]) return html``
  return html`${renderLan(languages[0], asList)}${languages.length > 1 ? renderLanguages(languages.slice(1), asList) : html``}`
}

function strToUpperCase(str) {
  if (str && str[0] > '') {
    const strCase = str.split(' ')
    for (let i = 0; i < strCase.length; i++) {
      strCase[i] = strCase[i].charAt(0).toUpperCase() +
        strCase[i].substring(1)
    }
    return strCase.join(' ')
  }
  return ''
}
