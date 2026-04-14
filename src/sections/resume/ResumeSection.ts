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
import { editIcon, plusDarkIcon } from '../../icons-svg/profileIcons'

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

function renderResumeSectionDefault(
  store: LiveStore, 
  subject: NamedNode, 
  resumeDetails: RoleDetails[], 
  viewerMode: ViewerMode, 
  onSaved?: () => Promise<void> | void) {
    scheduleDescriptionOverflowCheck()

  const hasResume = resumeDetails.length > 0
  const showSection = true
  const cv = hasResume ? CVCard(resumeDetails, viewerMode) : html``

  return showSection ? html`
    <section 
      aria-labelledby="cv-heading" 
      class="profile__section border-lighter profile-section-collapsible" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="cv-heading" tabindex="-1">${resumeHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column">
          <button
            type="button"
            class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
            aria-label="Edit resume details"
            @click=${(event: Event) => createResumeEditDialog(event, store, subject, resumeDetails, viewerMode, onSaved)}
          >
            <span class="profile-section-collapsible__edit-label">${editIcon} Edit</span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
          </button>
          <button
            type="button"
            class="inline-flex-row"
            aria-label="Toggle resume section"
            aria-controls="cv-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="cv-panel" class="profile-section-collapsible__content" aria-hidden="true">
        ${hasResume ? cv : html`<p>No resume details added yet.</p>`}
      </div>
    </section>
  ` : ''
}

function renderOwnerEmptyResumeContent(
  store: LiveStore,
  subject: NamedNode,
  resumeDetails: RoleDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void) {

  return html`
    <div class="profile__empty-state-content flex-column-center" role="group" aria-label="Empty resume section">
      <h2 id="resume-heading" tabindex="-1">${resumeHeadingText}</h2>
      <p class="profile__empty-state-message">
        You haven't included any professional experience yet. Consider adding your work history to enhance your resume.
      </p>
    </div>
    <button
      type="button"
      class="profile__action-button--empty"
      aria-label="Add resume details"
      @click=${(event: Event) => {
        return createResumeEditDialog(
          event,
          store,
          subject,
          resumeDetails,
          viewerMode,
          onSaved
        )
      }}
    >
      <span class="profile__action-icon" aria-hidden="true">${plusDarkIcon} Add Resume</span>
    </button>

  `
}

function renderOwnerEmptyResumeSection(
  store: LiveStore,
  subject: NamedNode,
  resumeDetails: RoleDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="resume-heading" 
      data-profile-section="resume"
      class="profile__section--empty border-lighter flex-column-center rounded-md gap-lg" 
      role="region"
      tabindex="-1"
    >
      ${renderOwnerEmptyResumeContent(store, subject, resumeDetails, viewerMode, onSaved)}
    </section>
  `
}

export function renderCVSection(
  store: LiveStore,
  subject: NamedNode,
  roles: RoleDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {

  const resumeDetails: RoleDetails[] = roles || []
  const hasResume = resumeDetails.length > 0
  const showOwnerEmptyResume = !hasResume && viewerMode === 'owner'
  const showSection = true

  return showSection ? html`
    ${showOwnerEmptyResume
      ? renderOwnerEmptyResumeSection(store, subject, resumeDetails, viewerMode, onSaved)
      : renderResumeSectionDefault(store, subject, resumeDetails, viewerMode, onSaved)}
  ` : ''
}
