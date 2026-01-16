import { render } from 'lit-html'
import { CVCard } from '../src/CVCard'
import axe from 'axe-core'
import { Literal } from 'rdflib'

describe('CVCard accessibility', () => {
  it('has no accessibility violations', async () => {
    // Helper to create a fake Literal (rdflib Literal is a class, but for type check, a string cast is enough for tests)
    const fakeLiteral = (val: string | undefined): Literal => val ? (val as unknown as Literal) : undefined as unknown as Literal

    const cvData = {
      rolesByType: {
        FutureRole: [{
          orgName: 'FutureOrg',
          roleText: 'future developer',
          dates: '2027-',
          startDate: fakeLiteral('2027-01-01'),
          endDate: undefined as unknown as Literal
        }],
        CurrentRole: [{
          orgName: 'CurrentOrg',
          roleText: 'developer',
          dates: '2023-2026',
          startDate: fakeLiteral('2023-01-01'),
          endDate: fakeLiteral('2026-12-31')
        }],
        PastRole: [{
          orgName: 'PastOrg',
          roleText: 'junior dev',
          dates: '2020-2022',
          startDate: fakeLiteral('2020-01-01'),
          endDate: fakeLiteral('2022-12-31')
        }],
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
