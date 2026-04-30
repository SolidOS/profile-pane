import { describe, expect, it } from "@jest/globals"
import axe from 'axe-core'
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderSocialSection } from '../../src/sections/social/SocialSection'
import { context, subject } from '../setup'

describe('Social section', () => {
  it('renders social account links', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const socialPresentation = {
      accounts: [
        {
          entryNode: sym('https://example.com/profile#social1'),
          name: 'GitHub',
          icon: 'https://example.com/icon.svg',
          homepage: 'https://github.com/janedoe'
        }
      ]
    }

    render(renderSocialSection(context.session.store as any, subject, socialPresentation as any, 'owner'), container)

    expect(container.querySelector('#social-heading')).toBeTruthy()
    expect(container.querySelector('a[href="https://github.com/janedoe"]')).toBeTruthy()

    container.remove()
  })

  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const socialPresentation = {
      accounts: [
        {
          entryNode: sym('https://example.com/profile#social1'),
          name: 'GitHub',
          icon: 'https://example.com/icon.svg',
          homepage: 'https://github.com/janedoe'
        },
        {
          entryNode: sym('https://example.com/profile#social2'),
          name: 'Mastodon',
          icon: 'https://example.com/mastodon.svg',
          homepage: 'https://social.example/@janedoe'
        }
      ]
    }

    render(renderSocialSection(context.session.store as any, subject, socialPresentation as any, 'owner'), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
