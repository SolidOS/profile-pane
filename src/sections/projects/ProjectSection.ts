import { html, render } from "lit-html"
import { LiveStore, NamedNode } from "rdflib"
import { ViewerMode } from "../../types"
import { ProjectDetails, ProjectRow } from "./types"
import { projectsHeadingText } from "../../texts"
import { createProjectsEditDialog } from "./ProjectEditDialog"
import { processProjectsMutations } from "./mutations"
import { MutationOps } from "../shared/types"
import { presentProjects } from "./selectors"
import "../../styles/ProjectsCard.css"

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
  refreshProjectsSection: (hostSection: HTMLElement | null) => Promise<void>
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
    const hostSection = (event.currentTarget as HTMLElement | null)?.closest('section') as HTMLElement | null
    await refreshProjectsSection(hostSection)
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
            class="actionButton projectFollowButton"
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
  refreshProjectsSection: (hostSection: HTMLElement | null) => Promise<void>
) {
  if (!projects || !projects.length || !projects[0]) return html``
  return html`${renderProject(projects[0], store, subject, viewerMode, refreshProjectsSection)}${projects.length > 1 ? renderProjects(projects.slice(1), store, subject, viewerMode, refreshProjectsSection) : html``}`
}

export function renderProjectSection(
  store: LiveStore,
  subject: NamedNode,
  projects: ProjectDetails[],
  viewerMode: ViewerMode
) {
  const refreshProjectsSection = async (hostSection: HTMLElement | null) => {
    if (!hostSection) return
    try {
      await store.fetcher.load(subject.doc(), { force: true } as any)
    } catch {
      // Best-effort refresh; render from current store if fetch reload fails.
    }

    const nextProjects = presentProjects(subject, store)
    render(renderProjectSection(store, subject, nextProjects, viewerMode), hostSection)
  }

  const hasProjects = Array.isArray(projects) && projects.length > 0

  return html`
    <section class="section-bg" aria-labelledby="projects-heading">
      <header class="sectionHeader mb-md">
        <h3 id="projects-heading">${projectsHeadingText}</h3>
        ${viewerMode === 'owner'
          ? html`
              <button
                type="button"
                class="actionButton"
                aria-label="Add or edit projects"
                @click=${(event: Event) => {
                  const hostSection = (event.currentTarget as HTMLElement | null)?.closest('section') as HTMLElement | null
                  return createProjectsEditDialog(event, store, subject, projects, viewerMode, async () => refreshProjectsSection(hostSection))
                }}
              >
                + Add More
              </button>
            `
          : html``}
      </header>
      ${hasProjects
        ? html`
            <ul class="projectRail" role="list" aria-label="Known projects">
              ${renderProjects(
                projects,
                store,
                subject,
                viewerMode,
                refreshProjectsSection
              )}
            </ul>
          `
        : html`<p>No projects added yet.</p>`}
    </section>
  `
}
