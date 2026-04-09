import { html } from 'lit-html'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { ProjectDetails, ProjectRow } from './types'
import { projectsHeadingText } from '../../texts'
import { createProjectsEditDialog } from './ProjectEditDialog'
import { processProjectsMutations } from './mutations'
import { addMoreIconAsset } from '../../icons-svg/pngIcons'
import { MutationOps } from '../shared/types'
import '../../styles/ProjectsCard.css'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

function toProjectRow(project: ProjectDetails, status: 'existing' | 'deleted'): ProjectRow {
  return {
    url: project.url,
    title: project.title,
    description: project.description,
    imageUrl: project.imageUrl,
    category: project.category,
    businessType: project.businessType,
    entryNode: (project.entryNode as any)?.value || '',
    status
  }
}

function renderProject(
  project: ProjectDetails,
  store: LiveStore,
  subject: NamedNode,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  if (!project) return html``

  const handleUnfollow = async (event: Event) => {
    event.preventDefault()
    if (viewerMode !== 'owner') return

    const removePlan: MutationOps<ProjectRow> = {
      create: [],
      update: [],
      remove: [toProjectRow(project, 'deleted')]
    }

    await processProjectsMutations(store, subject, removePlan)
    if (onSaved) {
      await onSaved()
    }
  }

  return html`
    <li class="projectCard" role="listitem">
      <a
        class="projectCardLink"
        href=${project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label=${project.title ? `Open ${project.title}` : 'Open project link'}
      >
        <div class="projectCardTop">
          <div class="projectThumb">
            ${project.imageUrl
              ? html`<img class="projectThumbImage" src=${project.imageUrl} alt=${project.title || 'Project preview'} />`
              : html`<div class="projectThumbFallback" aria-hidden="true">No image</div>`}
          </div>
          <div class="projectBody">
            <p class="projectTitle"><strong>${project.title || project.url}</strong></p>
            <p class="projectBusinessType">${project.businessType || 'Type of business unknown'}</p>
            <p class="projectKind">${project.category && project.category !== 'unknown' ? project.category : 'Uncategorized'}</p>
            ${project.description ? html`<p class="projectDescription">${project.description}</p>` : html``}
          </div>
        </div>
      </a>
      ${viewerMode === 'owner' ? html`
        <div class="projectCardFooter">
          <button
            type="button"
            class="profile__action-button projectFollowButton"
            aria-label="Unfollow project"
            @click=${handleUnfollow}
          >
            Following
          </button>
        </div>
      ` : html``}
    </li>
  `
}

function renderProjects(
  projects: ProjectDetails[],
  store: LiveStore,
  subject: NamedNode,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  if (!projects || !projects.length || !projects[0]) return html``
  return html`${renderProject(projects[0], store, subject, viewerMode, onSaved)}${projects.length > 1 ? renderProjects(projects.slice(1), store, subject, viewerMode, onSaved) : html``}`
}

export function renderProjectSection(
  store: LiveStore,
  subject: NamedNode,
  projects: ProjectDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const hasProjects = Array.isArray(projects) && projects.length > 0

  return html`
    <section
      class="profileSectionCollapsible section-bg"
      aria-labelledby="projects-heading"
      role="region"
      data-expanded="false"
    >
      <header class="profile__section-header profileSectionCollapsible__header">
        <h2 id="projects-heading">${projectsHeadingText}</h2>
        <div class="profileSectionCollapsible__actions">
          ${viewerMode === 'owner'
            ? html`
                <button
                  type="button"
                  class="profile__action-button u-profile-action-text profileSectionCollapsible__editButton"
                  aria-label="Add or edit projects"
                  @click=${(event: Event) => {
                    return createProjectsEditDialog(event, store, subject, projects, viewerMode, onSaved)
                  }}
                >
                  <span class="profileSectionCollapsible__editLabel profile__add-more-content">
                    <img class="profile__add-more-icon" src=${addMoreIconAsset} alt="" aria-hidden="true" />
                    Add More
                  </span>
                  <span class="profileSectionCollapsible__editIcon" aria-hidden="true">✎</span>
                </button>
              `
            : html``}
          <button
            type="button"
            class="profileSectionCollapsible__toggle"
            aria-label="Toggle projects section"
            aria-controls="projects-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profileSectionCollapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="projects-panel" class="profileSectionCollapsible__content" aria-hidden="true">
        ${hasProjects
          ? html`
              <ul class="projectRail" role="list" aria-label="Known projects">
                ${renderProjects(
                  projects,
                  store,
                  subject,
                  viewerMode,
                  onSaved
                )}
              </ul>
            `
          : html`<p>No projects added yet.</p>`}
      </div>
    </section>
  `
}
