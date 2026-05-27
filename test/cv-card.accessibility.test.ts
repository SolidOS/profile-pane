import { describe, expect, it } from '@jest/globals'
import { render } from 'lit-html'
import { CVCard } from '../src/sections/resume/ResumeSection'
import { literal, sym } from 'rdflib'
import { runAxe } from './helpers/runAxe'

describe('CVCard accessibility', () => {
  it('has no accessibility violations', async () => {
    const cvData = [
      {
        entryNode: sym('https://example.com/profile#role-future'),
        title: 'Future Developer',
        orgName: 'FutureOrg',
        startDate: literal('2027-01-01')
      },
      {
        entryNode: sym('https://example.com/profile#role-current'),
        title: 'Developer',
        orgName: 'CurrentOrg',
        startDate: literal('2023-01-01'),
        endDate: literal('2026-12-31'),
        description: 'Building accessible profile tooling.'
      },
      {
        entryNode: sym('https://example.com/profile#role-past'),
        title: 'Junior Dev',
        orgName: 'PastOrg',
        startDate: literal('2020-01-01'),
        endDate: literal('2022-12-31')
      }
    ]
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(CVCard(cvData as any, 'anonymous'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)
  })
})
