import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProfileView } from '../src/ProfileView'
import { render } from 'lit-html'
import { runAxe } from './helpers/runAxe'
import { createTestContext, resetTestSetup, subject } from './setup'

describe('ProfileView accessibility', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    resetTestSetup()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
    document.body.innerHTML = ''
    resetTestSetup()
  })

  it('has no accessibility violations', async () => {
    const context = createTestContext()
    // Render ProfileView (returns a Promise<TemplateResult>)
    const result = await ProfileView(subject, context, 'desktop')
    render(result, container)
    const results = await runAxe(container)
    if (results.violations.length > 0) {
      // Print details for debugging
      console.log('Axe violations:', JSON.stringify(results.violations, null, 2))
    }
    expect(results.violations.length).toBe(0)
  }, 15000)
})
