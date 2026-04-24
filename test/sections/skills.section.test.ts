import { describe, expect, it } from "@jest/globals"
import axe from 'axe-core'
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderSkillsSection } from '../../src/sections/skills/SkillsSection'
import { context, subject } from '../setup'

describe('Skills section', () => {
  it('renders skill list', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const skills = [
      {
        name: 'typescript',
        publicId: 'https://www.wikidata.org/wiki/Q978185',
        entryNode: sym('https://example.com/profile/card#skill-typescript')
      },
      {
        name: 'solid',
        publicId: 'https://www.wikidata.org/wiki/Q858775',
        entryNode: sym('https://example.com/profile/card#skill-solid')
      }
    ]

    render(renderSkillsSection(context.session.store, subject, skills, 'owner'), container)
    const content = (container.textContent || '').toLowerCase()

    expect(container.querySelector('#skills-heading')).toBeTruthy()
    expect(content).toContain('typescript')
    expect(content).toContain('solid')

    container.remove()
  })

  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const skills = [
      {
        name: 'typescript',
        publicId: 'https://www.wikidata.org/wiki/Q978185',
        entryNode: sym('https://example.com/profile/card#skill-typescript')
      },
      {
        name: 'solid',
        publicId: 'https://www.wikidata.org/wiki/Q858775',
        entryNode: sym('https://example.com/profile/card#skill-solid')
      }
    ]

    render(renderSkillsSection(context.session.store, subject, skills, 'owner'), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
