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
        businessType: 'Open Source',
        category: 'project',
        description: 'A project to display profile data.'
      }
    ]

    render(renderProjectSection(context.session.store, subject, projects as any, 'owner'), container)

    expect(container.querySelector('#projects-heading')).toBeTruthy()
    expect(container.textContent).toContain('Profile Pane')

    container.remove()
  })
})
