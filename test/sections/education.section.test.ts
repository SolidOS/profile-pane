import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderEducationSection } from '../../src/sections/education/EducationSection'
import { runAxe } from '../helpers/runAxe'
import { context, subject } from '../setup'

describe('Education section', () => {
  it('renders education entry', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const educationData = [
      {
        entryNode: sym('https://example.com/profile#edu1'),
        school: 'University of Amsterdam',
        degree: 'BSc Computer Science',
        location: 'Amsterdam',
        endDate: '2022-06-01',
        description: 'Focused on software engineering.'
      }
    ]

    render(renderEducationSection(context.session.store, subject, educationData as any, 'owner'), container)

    expect(container.querySelector('#education-heading')).toBeTruthy()
    expect(container.textContent).toContain('University of Amsterdam')

    container.remove()
  })

  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const educationData = [
      {
        entryNode: sym('https://example.com/profile#edu1'),
        school: 'University of Amsterdam',
        degree: 'BSc Computer Science',
        location: 'Amsterdam',
        endDate: '2022-06-01',
        description: 'Focused on software engineering.'
      }
    ]

    render(renderEducationSection(context.session.store, subject, educationData as any, 'owner'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
