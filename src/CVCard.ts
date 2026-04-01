import { html } from 'lit-html'
import { CVPresentation } from './CVPresenter'
import { ViewerMode } from './types'
import './styles/CVCard.css'
import { strToUpperCase } from './textUtils'


export const CVCard = (
  cvData: CVPresentation,
  viewerMode: ViewerMode
) => {
  const { rolesByType } = cvData

  const futureRolesArr = rolesByType['FutureRole'] || []
  const currentRolesArr = rolesByType['CurrentRole'] || []
  const pastRolesArr = rolesByType['PastRole'] || []

  const hasFutureRole = Array.isArray(futureRolesArr) && futureRolesArr.length > 0
  const hasCurrentRole = Array.isArray(currentRolesArr) && currentRolesArr.length > 0
  const hasPastRole = Array.isArray(pastRolesArr) && pastRolesArr.length > 0

  if (!(hasFutureRole || hasCurrentRole || hasPastRole)) return html``

  return html`
    <article class="cvCard" aria-label="Resume" data-testid="curriculum-vitae">
      ${hasFutureRole ? html`
        <section class="cvSection" aria-labelledby="cv-future-heading">
          <h3 id="cv-future-heading">Future Roles</h3>
          <ul role="list" aria-label="Upcoming work experience">
            ${renderRoles(futureRolesArr, true)}
          </ul>
        </section>
      ` : ''}
      
      ${hasCurrentRole ? html`
        <section class="cvSection" aria-labelledby="cv-current-heading">
          <h3 id="cv-current-heading">Current Roles</h3>
          <ul role="list" aria-label="Current work experience">
            ${renderRoles(currentRolesArr, true)}
          </ul>
        </section>
      ` : ''}
      
      ${hasPastRole ? html`
        <section class="cvSection" aria-labelledby="cv-past-heading">
          <h3 id="cv-past-heading">Past Roles</h3>
          <ul role="list" aria-label="Previous work experience">
            ${renderRoles(pastRolesArr, true)}
          </ul>
        </section>
      ` : ''}
       
    </article>
  `
}

function renderRole(role, asList = false) {
  if (!role) return html``
  return asList
    ? html`
      <li class="cvRole" role="listitem">
        <strong class="cvOrg" aria-label="Organization">${role.orgName}</strong>
        <span aria-label="Role title">${strToUpperCase(role.roleText)}</span>
        <time aria-label="Employment period">${role.dates}</time>
      </li>`
    : html``
}

function renderRoles(roles, asList = false) {
  if (!roles || !roles.length || !roles[0]) return html``
  return html`${renderRole(roles[0], asList)}${roles.length > 1 ? renderRoles(roles.slice(1), asList) : html``}`
}

