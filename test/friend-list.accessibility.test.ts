import { render } from 'lit-html';
import * as FriendListModule from '../src/FriendList';
import axe from 'axe-core';

describe('FriendList accessibility', () => {
  it('has no accessibility violations', async () => {
    // Mock extractFriends to return a static friend list
    jest.spyOn(FriendListModule, 'extractFriends').mockImplementation(() => {
      const div = document.createElement('div');
      div.innerHTML = '<li><a href="https://friend.example">Alice</a></li>';
      return div;
    });

    const subject = { uri: 'https://example.com', value: 'https://example.com', doc: () => ({}) };
    const context = { dom: document.implementation.createHTMLDocument() };
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(FriendListModule.FriendList(subject, context), container);

    const results = await axe.run(container);
    expect(results.violations.length).toBe(0);
  });
});
