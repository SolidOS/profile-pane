declare global {
  interface Window {
    __DEBUG_FRIENDS?: boolean;
  }
}

import { NamedNode } from 'rdflib'
import { ns, widgets } from 'solid-ui'
import { DataBrowserContext } from 'pane-registry'

export interface Friend {
  name: string;
  uri: string;
  profileImg: string;
  icon: string;
  iconHref: string;
  instance?: NamedNode;
}

export interface FriendsPresentation {
  friends: Friend[];
}

export function presentFriends(subject: NamedNode, context: DataBrowserContext): FriendsPresentation {
  const friends: Friend[] = []
  const dom = context.dom
  const target = dom.createElement('div')
  widgets.attachmentList(dom, subject, target, {
    doc: subject.doc(),
    modify: false,
    predicate: ns.foaf('knows'),
    noun: 'friend',
  })
  // Parse target.innerHTML for friend rows
  const html = target.innerHTML
  // Create a temporary DOM to parse the HTML
  const temp = dom.createElement('div')
  temp.innerHTML = html
  // Find all <tr> elements that represent friends
  const rows = temp.querySelectorAll('tr')
  rows.forEach(row => {
    // First cell: profile image
    const tds = row.querySelectorAll('td')
    if (tds.length < 3) return
    const profileImgTag = tds[0].querySelector('img')
    const nameTd = tds[1]
    const linkTd = tds[2]
    const link = linkTd ? linkTd.querySelector('a') : null
    // Last cell: icon and iconHref
    let icon = ''
    let iconHref = ''
    if (linkTd) {
      const iconImg = linkTd.querySelector('img')
      if (iconImg) {
        icon = iconImg.getAttribute('src') || ''
      }
      if (link) {
        iconHref = link.getAttribute('href') || ''
      }
    }
    if (profileImgTag && nameTd && link) {
      friends.push({
        name: nameTd.textContent?.trim() || '',
        uri: link.getAttribute('href') || '',
        profileImg: profileImgTag.getAttribute('src') || '',
        icon,
        iconHref,
        instance: link.getAttribute('href') ? new NamedNode(link.getAttribute('href')) : undefined
      })
    }
  })
  return { friends }
}