import { render } from 'lit-html'
import { literal, sym } from 'rdflib'
import { renderCVSection } from '../../src/sections/resume/ResumeSection'
import { context, subject } from '../setup'

describe('Resume section', () => {
  it('renders at least one role entry', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const roles = [
      {
        entryNode: sym('https://example.com/profile#role1'),
        title: 'Software Engineer',
        orgName: 'SolidOS',
        orgLocation: 'Remote',
        startDate: literal('2021-01-01'),
        endDate: literal('2024-01-01'),
        description: 'Built profile pane features.'
      }
    ]

    render(renderCVSection(context.session.store, subject, roles as any, 'owner'), container)

    expect(container.querySelector('#cv-heading')).toBeTruthy()
    expect(container.textContent).toContain('Software Engineer')

    container.remove()
  })
})
