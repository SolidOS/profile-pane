import { render } from 'lit-html'
import * as FriendListModule from '../src/FriendList'
import * as AddMeToYourFriendsModule from '../src/addMeToYourFriends'
import axe from 'axe-core'

describe('FriendList accessibility', () => {
  it('has no accessibility violations', async () => {
    // Mock extractFriends to return a static friend list
    jest.spyOn(AddMeToYourFriendsModule, 'extractFriends').mockImplementation(() => {
      const fragment = document.createDocumentFragment()
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = 'https://friend.example'
      a.textContent = 'Alice'
      li.appendChild(a)
      fragment.appendChild(li)
      return fragment as unknown as HTMLDivElement
    })

    const { sym } = require('rdflib')
    const subject = sym('https://example.com')
    const { context } = require('./setup')
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(FriendListModule.FriendList(subject, context), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })
})
