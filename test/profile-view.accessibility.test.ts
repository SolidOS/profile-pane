import { ProfileView } from '../src/ProfileView'
import { render } from 'lit-html'
import { runAxe } from './helpers/runAxe'

describe('ProfileView accessibility', () => {
  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    // Use shared context and subject mocks
    const { context, subject } = require('./setup')
    // Render ProfileView (returns a Promise<TemplateResult>)
    const result = await ProfileView(subject, context)
    render(result, container)
    const results = await runAxe(container)
    if (results.violations.length > 0) {
      // Print details for debugging
      console.log('Axe violations:', JSON.stringify(results.violations, null, 2))
    }
    expect(results.violations.length).toBe(0)
  })
})
