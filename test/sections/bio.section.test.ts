import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderBioSection } from '../../src/sections/bio/BioSection'
import { runAxe } from '../helpers/runAxe'
import { context, subject } from '../setup'

describe('Bio section', () => {
  it('renders bio content', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const bio = {
      entryNode: sym('https://example.com/profile#bio'),
      description: 'I enjoy building Solid applications and web components.'
    }

    render(renderBioSection(context.session.store, subject, bio as any, 'owner'), container)

    expect(container.querySelector('#bio-heading')).toBeTruthy()
    expect(container.textContent).toContain('I enjoy building Solid applications')

    container.remove()
  })

  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const bio = {
      entryNode: sym('https://example.com/profile#bio'),
      description: 'I enjoy building Solid applications and web components.'
    }

    render(renderBioSection(context.session.store, subject, bio as any, 'owner'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
