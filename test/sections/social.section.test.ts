import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderSocialAccounts } from '../../src/sections/social/SocialSection'
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

    render(renderSocialAccounts(context.session.store, subject, socialPresentation as any, 'owner'), container)

    expect(container.querySelector('#social-heading')).toBeTruthy()
    expect(container.querySelector('a[href="https://github.com/janedoe"]')).toBeTruthy()

    container.remove()
  })
})
