import { render } from 'lit-html'
import { SocialCard } from '../src/SocialCard'
import axe from 'axe-core'

describe('SocialCard accessibility', () => {
  it('has no accessibility violations', async () => {
    const SocialData = {
      accounts: [
        {
          homepage: 'https://twitter.com/example',
          name: 'Twitter',
          icon: 'https://example.com/twitter-icon.svg'
        },
        {
          homepage: 'https://github.com/example',
          name: 'GitHub',
          icon: 'https://example.com/github-icon.svg'
        }
      ]
    }
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(SocialCard(SocialData), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })

  it('shows a hidden social accounts count button when more than two mobile rows exist', () => {
    const SocialData = {
      accounts: Array.from({ length: 11 }, (_, index) => ({
        homepage: `https://example.com/${index}`,
        name: `Account ${index}`,
        icon: `https://example.com/icon-${index}.svg`
      }))
    }

    const container = document.createElement('div')
    document.body.appendChild(container)
    render(SocialCard(SocialData, 'viewer'), container)

    const moreButton = container.querySelector('.socialCard__more-button') as HTMLButtonElement | null
    expect(moreButton?.textContent).toContain('1 more')

    moreButton?.click()

    const socialCard = container.querySelector('.socialCard') as HTMLElement | null
    expect(socialCard?.getAttribute('data-mobile-expanded')).toBe('true')

    container.remove()
  })
})
