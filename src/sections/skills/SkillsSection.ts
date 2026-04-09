import { html } from 'lit-html'
import { strToUpperCase } from '../../textUtils'
import { literal, LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createSkillsEditDialog } from './SkillsEditDialog'
import { SkillDetails } from './types'
import { skillsHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

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

function toSkillDetails(skills: string[]): SkillDetails[] {
  return (skills || []).map((name) => ({
    name,
    entryNode: literal(name)
  }))
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
  const skillDetails = toSkillDetails(skillsArr)

  return html`
    <section
      class="profileSectionCollapsible section-bg"
      aria-labelledby="skills-heading"
      role="region"
      data-expanded="false"
    >
      <header class="profile__section-header profileSectionCollapsible__header">
        <h3 id="skills-heading">${skillsHeadingText}</h3>
        <div class="profileSectionCollapsible__actions">
          ${viewerMode === 'owner'
            ? html`
                <button
                  type="button"
                  class="profile__action-button u-profile-action-text profileSectionCollapsible__editButton"
                  aria-label="Add or edit skills"
                  @click=${(event: Event) => createSkillsEditDialog(event, store, subject, skillDetails, viewerMode, onSaved)}
                >
                  <span class="profileSectionCollapsible__editLabel">+ Add More</span>
                  <span class="profileSectionCollapsible__editIcon" aria-hidden="true">✎</span>
                </button>
              `
            : html``}
          <button
            type="button"
            class="profileSectionCollapsible__toggle"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profileSectionCollapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div
        id="skills-panel"
        class="profileSectionCollapsible__content"
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
