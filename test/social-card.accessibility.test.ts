import { render } from 'lit-html';
import { SocialCard } from '../src/SocialCard';
import axe from 'axe-core';

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
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(SocialCard(SocialData), container);

    const results = await axe.run(container);
    expect(results.violations.length).toBe(0);
  });
});
