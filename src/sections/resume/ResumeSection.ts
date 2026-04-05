import { html } from 'lit-html'
import { RoleDetails } from './types'
import { ViewerMode } from '../../types'
import '../../styles/CVCard.css'
import { resumeHeadingText } from '../../texts'
import { LiveStore, NamedNode } from 'rdflib'
import { createResumeEditDialog } from './ResumeEditDialog'
import {
  formatMonthYear,
  scheduleDescriptionOverflowCheck,
  toMonthDateTime,
  toggleDescription
} from '../shared/sectionCardHelpers'

function renderRole(role: RoleDetails, index: number) {
  if (!role) return html``
  const roleTitleId = `cv-role-title-${index}`
  const rolePeriodId = `cv-role-period-${index}`
  const roleOrgId = `cv-role-org-${index}`
  const roleDescriptionId = `cv-role-description-${index}`

  const ariaDescribedBy = role.description
    ? `${rolePeriodId} ${roleOrgId} ${roleDescriptionId}`
    : `${rolePeriodId} ${roleOrgId}`

  return html`
    <li class="cvRole" role="listitem" aria-labelledby=${roleTitleId} aria-describedby=${ariaDescribedBy}>
    <div class="cvRoleHeader">
      <h4 id=${roleTitleId}>${role.title}</h4>
      <p id=${rolePeriodId} class="cvRolePeriod">
        <time datetime=${toMonthDateTime(role.startDate)}>${formatMonthYear(role.startDate)}</time>
        <span aria-hidden="true"> to </span>
        ${role.endDate
          ? html`<time datetime=${toMonthDateTime(role.endDate)}>${formatMonthYear(role.endDate)}</time>`
          : html`<span>Present</span>`}
      </p>
    </div>
      <p class="cvOrg" id=${roleOrgId}>
        <strong>${role.orgName}</strong>${role.orgLocation ? html` | ${role.orgLocation}` : ''}
      </p>
      ${role.description ? html`
        <div class="cvDescriptionWrap">
          <p class="cvDescriptionText" id=${roleDescriptionId}>${role.description}</p>
          <button
            type="button"
            class="cvDescriptionToggle"
            aria-controls=${roleDescriptionId}
            aria-expanded="false"
            hidden
            @click=${toggleDescription}
          >
            ...more
          </button>
        </div>
      ` : ''}
    </li>
  `
}

function renderRoles(roles: RoleDetails[]) {
  if (!roles || !roles.length) return html``
  return html`${roles.map((role, index) => renderRole(role, index))}`
}

export const CVCard = (
  cvData: RoleDetails[],
  viewerMode: ViewerMode
) => {
  void viewerMode
  const hasRoles = Array.isArray(cvData) && cvData.length > 0
  if (!hasRoles) return html``

  return html`
    <article class="cvCard" aria-label="Resume" data-testid="curriculum-vitae">
      <section class="cvSection">
        <ul role="list" aria-label="Work experience in chronological order">
          ${renderRoles(cvData)}
        </ul>
      </section>
    </article>
  `
}

export function renderCVSection(
  store: LiveStore,
  subject: NamedNode,
  roles: RoleDetails[],
  viewerMode: ViewerMode
) {
  scheduleDescriptionOverflowCheck()

  const resumeDetails: RoleDetails[] = roles || []
  const hasResume = resumeDetails.length > 0
  const showSection = hasResume || viewerMode === 'owner'
  const cv = hasResume ? CVCard(resumeDetails, viewerMode) : html``

  return showSection ? html`
    <section 
      aria-labelledby="cv-heading" 
      class="section-bg" 
      role="region"
      tabindex="-1"
    >
      <header class="sectionHeader mb-md">
        <h3 id="cv-heading" tabindex="-1">${resumeHeadingText}</h3>
        ${viewerMode === 'owner'
          ? html`
              <button
                type="button"
                class="actionButton"
                aria-label="Edit resume details"
                @click=${(event: Event) => createResumeEditDialog(event, store, subject, resumeDetails, viewerMode)}
              >
                <span class="actionIcon" aria-hidden="true">✎ Edit</span>
              </button>
            `
          : html``}
      </header>
      <div>
        ${hasResume ? cv : html`<p>No resume details added yet.</p>`}
      </div>
    </section>
  ` : ''
}
