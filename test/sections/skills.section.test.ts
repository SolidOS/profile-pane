import { render } from 'lit-html'
import { renderSkillsSection } from '../../src/sections/skills/SkillsSection'
import { context, subject } from '../setup'

describe('Skills section', () => {
  it('renders skill list', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(renderSkillsSection(context.session.store, subject, ['typescript', 'solid'], 'owner'), container)
    const content = (container.textContent || '').toLowerCase()

    expect(container.querySelector('#skills-heading')).toBeTruthy()
    expect(content).toContain('typescript')
    expect(content).toContain('solid')

    container.remove()
  })
})
