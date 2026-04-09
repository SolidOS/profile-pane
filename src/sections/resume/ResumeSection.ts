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
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

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
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  scheduleDescriptionOverflowCheck()

  const resumeDetails: RoleDetails[] = roles || []
  const hasResume = resumeDetails.length > 0
  const showSection = hasResume || viewerMode === 'owner'
  const cv = hasResume ? CVCard(resumeDetails, viewerMode) : html``

  return showSection ? html`
    <section 
      aria-labelledby="cv-heading" 
      class="profileSectionCollapsible section-bg" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profileSectionCollapsible__header">
        <h3 id="cv-heading" tabindex="-1">${resumeHeadingText}</h3>
        <div class="profileSectionCollapsible__actions">
          ${viewerMode === 'owner'
            ? html`
                <button
                  type="button"
                  class="profile__action-button u-profile-action-text profileSectionCollapsible__editButton"
                  aria-label="Edit resume details"
                  @click=${(event: Event) => createResumeEditDialog(event, store, subject, resumeDetails, viewerMode, onSaved)}
                >
                  <span class="profileSectionCollapsible__editLabel">✎ Edit</span>
                  <span class="profileSectionCollapsible__editIcon" aria-hidden="true">✎</span>
                </button>
              `
            : html``}
          <button
            type="button"
            class="profileSectionCollapsible__toggle"
            aria-label="Toggle resume section"
            aria-controls="cv-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profileSectionCollapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="cv-panel" class="profileSectionCollapsible__content" aria-hidden="true">
        ${hasResume ? cv : html`<p>No resume details added yet.</p>`}
      </div>
    </section>
  ` : ''
}
