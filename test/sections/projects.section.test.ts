import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderProjectSection } from '../../src/sections/projects/ProjectSection'
import { runAxe } from '../helpers/runAxe'
import { context, subject } from '../setup'

describe('Projects section', () => {
  it('renders project cards', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const projects = [
      {
        entryNode: sym('https://example.com/profile#project1'),
        url: 'https://example.com/project',
        title: 'Profile Pane',
        orgName: 'Open Source',
        category: 'project',
        description: 'A project to display profile data.'
      }
    ]

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner', 'desktop'), container)

    expect(container.querySelector('#projects-heading')).toBeTruthy()
    expect(container.textContent).toContain('Profile Pane')

    container.remove()
  })

  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const projects = [
      {
        entryNode: sym('https://example.com/profile#project1'),
        url: 'https://example.com/project',
        title: 'Profile Pane',
        orgName: 'Open Source',
        category: 'project',
        description: 'A project to display profile data.'
      }
    ]

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner', 'desktop'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })

  it('shows a mobile view more button when there are more than two projects', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const projects = [
      {
        entryNode: sym('https://example.com/profile#project1'),
        url: 'https://example.com/project-1',
        title: 'Project One',
        orgName: 'Open Source',
        category: 'project'
      },
      {
        entryNode: sym('https://example.com/profile#project2'),
        url: 'https://example.com/project-2',
        title: 'Project Two',
        orgName: 'Open Source',
        category: 'project'
      },
      {
        entryNode: sym('https://example.com/profile#project3'),
        url: 'https://example.com/project-3',
        title: 'Project Three',
        orgName: 'Open Source',
        category: 'community'
      }
    ]

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner', 'desktop'), container)

    const moreButton = container.querySelector('.project-card__more-button') as HTMLButtonElement | null
    const section = container.querySelector('.profile-section-collapsible') as HTMLElement | null

    expect(moreButton?.textContent).toContain('View More')
    expect(section?.getAttribute('data-mobile-expanded')).toBe('false')

    moreButton?.click()

    expect(section?.getAttribute('data-mobile-expanded')).toBe('true')

    container.remove()
  })

  it('renders the empty owner projects section as collapsible', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(renderProjectSection(context.session.store, subject, [], 'owner', 'desktop'), container)

    const section = container.querySelector('[data-profile-section="projects"]') as HTMLElement | null
    const panel = container.querySelector('#projects-panel') as HTMLElement | null

    expect(section?.classList.contains('profile-section-collapsible')).toBe(true)
    expect(panel).toBeTruthy()
    expect(panel?.hidden).toBe(false)
    expect(panel?.hasAttribute('hidden')).toBe(false)
    expect(panel?.getAttribute('aria-hidden')).toBeNull()

    container.remove()
  })
})
