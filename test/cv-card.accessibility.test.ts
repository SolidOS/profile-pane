import { render } from 'lit-html'
import { CVCard } from '../src/CVCard'
import axe from 'axe-core'

describe('CVCard accessibility', () => {
  it('has no accessibility violations', async () => {
    const cvData = {
      rolesByType: {
        FutureRole: [{ orgName: 'FutureOrg', roleText: 'future developer', dates: '2027-' }],
        CurrentRole: [{ orgName: 'CurrentOrg', roleText: 'developer', dates: '2023-2026' }],
        PastRole: [{ orgName: 'PastOrg', roleText: 'junior dev', dates: '2020-2022' }],
      },
      skills: ['JavaScript', 'Accessibility'],
      languages: ['English', 'German']
    }
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(CVCard(cvData), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })
})
