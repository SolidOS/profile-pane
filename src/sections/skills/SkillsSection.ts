import { html } from 'lit-html'
import { strToUpperCase } from '../../textUtils'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createSkillsEditDialog } from './SkillsEditDialog'
import { SkillDetails } from './types'
import { addIcon } from '../../icons-svg/profileIcons'
import { skillsHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { presentSkillDetails } from './selectors'

function renderSkill(skill, asList = false) {
  if (!skill) return html``
  return asList
    ? html`<li class="skill" role="listitem">${strToUpperCase(skill)}</li>`
    : html``
}

function renderSkills(skills, asList = false) {
  if (!skills || !skills.length || !skills[0]) return html``
  return html`${renderSkill(skills[0], asList)}${skills.length > 1 ? renderSkills(skills.slice(1), asList) : html``}`
}

export function renderSkillsSection(
  store: LiveStore,
  subject: NamedNode,
  skills: string[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const skillsArr = skills || []
  const hasSkills = Array.isArray(skillsArr) && skillsArr.length > 0
  const skillDetails: SkillDetails[] = presentSkillDetails(subject, store)

  return html`
    <section
      class="profile__section border-lighter profile-section-collapsible"
      aria-labelledby="skills-heading"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="skills-heading">${skillsHeadingText}</h2>
        <div class="profile-section-collapsible__actions">
          <button
            type="button"
            class="profile__action-button u-profile-action-text profile-section-collapsible__edit-button"
            aria-label="Add or edit skills"
            @click=${(event: Event) => createSkillsEditDialog(event, store, subject, skillDetails, viewerMode, onSaved)}
          >
            <span class="profile-section-collapsible__edit-label profile__add-more-content">
              <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
              Add More
            </span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">✎</span>
          </button>
          <button
            type="button"
            class="profile-section-collapsible__toggle"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div
        id="skills-panel"
        class="profile-section-collapsible__content"
        aria-hidden="true"
      >
        ${hasSkills
          ? html`
              <ul role="list" aria-label="Professional skills and competencies">
                ${renderSkills(skillsArr, true)}
              </ul>
            `
          : html`<p>No skills added yet.</p>`}
      </div>
    </section>
  `
}
