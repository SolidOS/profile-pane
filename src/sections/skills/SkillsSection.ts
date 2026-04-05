import { html } from "lit-html"
import { strToUpperCase } from '../../textUtils'
import { literal, LiveStore, NamedNode } from "rdflib"
import { ViewerMode } from "../../types"
import { createSkillsEditDialog } from "./SkillsEditDialog"
import { SkillDetails } from "./types"
import { skillsHeadingText } from "../../texts"

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
  viewerMode: ViewerMode
) {
  const skillsArr = skills || []
  const hasSkills = Array.isArray(skillsArr) && skillsArr.length > 0
  const skillDetails = toSkillDetails(skillsArr)

  return html`
    <section class="section-bg" aria-labelledby="skills-heading" role="region">
      <header class="sectionHeader mb-md">
        <h3 id="skills-heading">${skillsHeadingText}</h3>
        ${viewerMode === 'owner'
          ? html`
              <button
                type="button"
                class="actionButton"
                aria-label="Add or edit skills"
                @click=${(event: Event) => createSkillsEditDialog(event, store, subject, skillDetails, viewerMode)}
              >
                + Add More
              </button>
            `
          : html``}
      </header>
      ${hasSkills
        ? html`
            <ul role="list" aria-label="Professional skills and competencies">
              ${renderSkills(skillsArr, true)}
            </ul>
          `
        : html`<p>No skills added yet.</p>`}
    </section>
  `
}
