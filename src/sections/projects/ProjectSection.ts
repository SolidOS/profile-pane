import { html } from 'lit-html'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { ProjectDetails, ProjectRow } from './types'
import { projectsHeadingText } from '../../texts'
import { createProjectsEditDialog } from './ProjectEditDialog'
import { processProjectsMutations } from './mutations'
import { addIcon } from '../../icons-svg/profileIcons'
import { MutationOps } from '../shared/types'
import '../../styles/ProjectsCard.css'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

function renderProjectImage(src: string | undefined, altText: string) {
  return src
    ? html`
        <img
          class="projectThumbImage"
          src=${src}
          alt=${altText}
          loading="lazy"
        />
      `
    : html`
        <div class="projectThumbFallback" role="img" aria-label=${altText} tabindex="0">
          ${altText}
        </div>
      `
}

function toProjectRow(project: ProjectDetails, status: 'existing' | 'deleted'): ProjectRow {
  return {
    url: project.url,
    title: project.title,
    imageUrl: project.imageUrl,
    category: project.category,
    name: project.name,
    orgName: project.orgName,
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
            ${renderProjectImage(project.imageUrl, project.title || 'Project preview')}
          </div>
          <div class="projectBody">
            <p class="projectTitle"><strong>${project.title || project.url}</strong></p>
            <p class="projectBusinessType">${project.orgName || 'Organization unknown'}</p>
            <p class="projectKind">${project.category && project.category !== 'unknown' ? project.category : 'Uncategorized'}</p>
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
      class="profile-section-collapsible section-bg"
      aria-labelledby="projects-heading"
      role="region"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="projects-heading">${projectsHeadingText}</h2>
        <div class="profile-section-collapsible__actions">
          <button
            type="button"
            class="profile__action-button u-profile-action-text profile-section-collapsible__edit-button"
            aria-label="Add or edit projects"
            @click=${(event: Event) => {
              return createProjectsEditDialog(event, store, subject, projects, viewerMode, onSaved)
            }}
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
            aria-label="Toggle projects section"
            aria-controls="projects-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="projects-panel" class="profile-section-collapsible__content" aria-hidden="true">
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
