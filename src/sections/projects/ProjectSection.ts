import { html } from 'lit-html'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { ProjectDetails, ProjectRow } from './types'
import { projectsHeadingText } from '../../texts'
import { createProjectsEditDialog } from './ProjectEditDialog'
import { processProjectsMutations } from './mutations'
import { addIcon, checkMarkIcon, plusDarkIcon, twoDownArrowsIcon } from '../../icons-svg/profileIcons'
import { MutationOps } from '../shared/types'
import '../../styles/ProjectsCard.css'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

const MAX_VISIBLE_PROJECTS_MOBILE = 2

function expandProjectsMobileList(event: Event): void {
  const button = event.currentTarget as HTMLButtonElement | null
  const section = button?.closest('.profile-section-collapsible') as HTMLElement | null
  if (!button || !section) return

  section.setAttribute('data-mobile-expanded', 'true')
  button.setAttribute('aria-expanded', 'true')
  button.hidden = true
}

function renderProjectImage(src: string | undefined, altText: string) {
  return src
    ? html`
        <img
          class="project-card__thumb-image"
          src=${src}
          alt=${altText}
          loading="lazy"
        />
      `
    : html`
        <div class="project-card__thumb-fallback flex-center" role="img" aria-label=${altText} tabindex="0">
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

  const normalizedCategory = (project.category || '').trim().toLowerCase()
  const categoryModifier = normalizedCategory === 'project'
    ? 'project'
    : normalizedCategory === 'community'
      ? 'community'
      : 'unknown'
  const categoryLabel = normalizedCategory && normalizedCategory !== 'unknown'
    ? normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)
    : 'Uncategorized'

  return html`
    <li class="project-card flex-column" role="listitem">
      <a
        class="project-card__link"
        href=${project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label=${project.title ? `Open ${project.title}` : 'Open project link'}
      >
        <div class="project-card__wrapper">
          <div class="project-card__thumb flex-center">
            ${renderProjectImage(project.imageUrl, project.title || 'Project preview')}
          </div>
          <div class="project-card__content">
            <p class="project-card__title"><strong>${project.title || project.url}</strong></p>
            <p class="project-card__organization">${project.orgName || 'Organization unknown'}</p>
            <p class="project-card__category project-card__category--${categoryModifier}">${categoryLabel}</p>
          </div>
        </div>
      </a>
      ${viewerMode === 'owner' ? html`
        <div class="project-card__footer">
          <button
            type="button"
            class="project-card__follow-button flex-center gap-xxs"
            aria-label="Unfollow project"
            @click=${handleUnfollow}
          >
            <span>${checkMarkIcon} Following</span>
          </button>
        </div>
      ` : html``}
    </li>
  `
}

function renderOwnerEmptyProjectsContent(
  store: LiveStore,
  subject: NamedNode,
  projectData: ProjectDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const projectDetails: ProjectDetails[] = projectData

  return html`
    <div class="profile__empty-state-content flex-column-center" role="group" aria-label="Empty projects section">
      <h2 id="projects-heading" tabindex="-1">${projectsHeadingText}</h2>
      <p class="profile__empty-state-message">
        You haven't added any projects yet. Consider adding a project to boost your profile.
      </p>
    </div>
    <button
      type="button"
      class="profile__action-button--empty"
      aria-label="Add project details"
      @click=${(event: Event) => {
        return createProjectsEditDialog(
          event,
          store,
          subject,
          projectDetails,
          viewerMode,
          onSaved
        )
      }}
    >
      <span class="profile__action-icon" aria-hidden="true">${plusDarkIcon} Add Project</span>
    </button>

  `
}

function renderOwnerEmptyProjectSection(
  store: LiveStore,
  subject: NamedNode,
  projectData: ProjectDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="projects-heading" 
      data-profile-section="projects"
      class="profile__section--empty border-lighter flex-column-center rounded-md gap-lg" 
      role="region"
      tabindex="-1"
    >
      ${renderOwnerEmptyProjectsContent(store, subject, projectData, viewerMode, onSaved)}
    </section>
  `
}

function renderProjectSectionContent(
  projects: ProjectDetails[],
  store: LiveStore,
  subject: NamedNode,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  if (!projects || !projects.length || !projects[0]) return html``

  return html`${renderProject(projects[0], store, subject, viewerMode, onSaved)}${projects.length > 1 ? renderProjectSectionContent(projects.slice(1), store, subject, viewerMode, onSaved) : html``}`
}

function renderProjectSectionDefault(
  store: LiveStore, 
  subject: NamedNode, 
  projects: ProjectDetails[], 
  viewerMode: ViewerMode, 
  onSaved?: () => Promise<void> | void) {
  const hasProjects = Array.isArray(projects) && projects.length > 0
  const hiddenProjectsCount = Math.max(0, projects.length - MAX_VISIBLE_PROJECTS_MOBILE)
  const isOwner = viewerMode === 'owner'

  return html`
      <section
        class="profile__section border-lighter profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
        aria-labelledby="projects-heading"
        role="region"
        tabindex="-1"
        data-expanded="false"
        data-mobile-expanded="${hiddenProjectsCount > 0 ? 'false' : 'true'}"
      >
        <header class="profile__section-header profile-section-collapsible__header">
          <h2 id="projects-heading">${projectsHeadingText}</h2>
          <div class="profile-section-collapsible__actions flex-column">
            ${isOwner ? html`
              <button
                type="button"
                class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
                aria-label="Add or edit projects"
                @click=${(event: Event) => {
                  return createProjectsEditDialog(event, store, subject, projects, viewerMode, onSaved)
                }}
              >
                <span class="profile-section-collapsible__edit-label profile__add-more-content inline-flex-row">
                  <span class="profile__add-more-icon inline-flex-row" aria-hidden="true">${addIcon}</span>
                  Add More
                </span>
                <span class="profile-section-collapsible__edit-icon profile-section-collapsible__edit-icon--add profile-section-collapsible__edit-icon--projects" aria-hidden="true">${plusDarkIcon}</span>
              </button>
            ` : html``}
            <button
              type="button"
              class="inline-flex-row"
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
                <ul id="projects-rail" class="project-card__rail" role="list" aria-label="Known projects">
                  ${renderProjectSectionContent(
                    projects,
                    store,
                    subject,
                    viewerMode,
                    onSaved
                  )}
                </ul>
                ${hiddenProjectsCount > 0
                  ? html`
                      <button
                        type="button"
                        class="project-card__more-button"
                        aria-controls="projects-rail"
                        aria-expanded="false"
                        @click=${expandProjectsMobileList}
                      >
                        <span class="project-card__more-icon" aria-hidden="true">${twoDownArrowsIcon}</span>
                        <span>View More</span>
                      </button>
                    `
                  : html``}
              `
            : html`<p>No projects added yet.</p>`}
        </div>
      </section>
    `
}

export function renderProjectSection(
  store: LiveStore,
  subject: NamedNode,
  projects: ProjectDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const hasProjects = Array.isArray(projects) && projects.length > 0
  const showOwnerEmptyProject = !hasProjects && viewerMode === 'owner'
  
  const showSection = true
  
  return showSection ? html`
    ${showOwnerEmptyProject
      ? renderOwnerEmptyProjectSection(store, subject, projects, viewerMode, onSaved)
      : renderProjectSectionDefault(store, subject, projects, viewerMode, onSaved)}
  ` : ''
}
