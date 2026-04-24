import { describe, expect, it } from "@jest/globals"
import axe from 'axe-core'
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderProjectSection } from '../../src/sections/projects/ProjectSection'
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

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner'), container)

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

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner'), container)

    const results = await axe.run(container)
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

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner'), container)

    const moreButton = container.querySelector('.project-card__more-button') as HTMLButtonElement | null
    const section = container.querySelector('.profile-section-collapsible') as HTMLElement | null

    expect(moreButton?.textContent).toContain('View More')
    expect(section?.getAttribute('data-mobile-expanded')).toBe('false')

    moreButton?.click()

    expect(section?.getAttribute('data-mobile-expanded')).toBe('true')

    container.remove()
  })
})
