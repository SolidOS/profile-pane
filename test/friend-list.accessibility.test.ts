import { render } from 'lit-html'
import { FriendList } from '../src/friendsPane/FriendList'
import axe from 'axe-core'

describe('FriendList accessibility', () => {
  it('has no accessibility violations', async () => {
    const { context } = require('./setup')
    const container = document.createElement('div')
    document.body.appendChild(container)
    const friends = [{
      url: 'https://friend.example/profile/card#me',
      name: 'Alice',
      pronouns: 'she/her',
      jobTitle: 'Engineer',
      location: 'Hamburg, Germany',
      subjectNode: { value: 'https://friend.example/profile/card#me' }
    }]

    render(FriendList(context, friends, 'anonymous'), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })
})
