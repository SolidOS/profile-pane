import { ProfileCard } from '../src/ProfileCard'
import { render } from 'lit-html'
import axe from 'axe-core'

describe('ProfileCard accessibility', () => {
  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const profile = {
      name: 'Jane Doe',
      imageSrc: 'https://janedoe.example/profile/me.jpg',
      introduction: 'Test Double at Solid Community',
      location: 'Hamburg, Germany',
      pronouns: 'their/they/them',
      highlightColor: '#7C4DFF',
      backgroundColor: '#FFFFFF',
    }
    // Use shared context and subject mocks
    const { context, subject } = require('./setup')
    render(ProfileCard(profile, context, subject), container)
    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })
})
