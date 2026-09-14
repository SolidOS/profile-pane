import { NamedNode } from 'rdflib'
import { authn, solidLogicSingleton } from 'solid-logic'
import { ViewerMode } from './types'
import {log } from './utils/debug'

export async function getViewerMode(subject: NamedNode): Promise<ViewerMode> {
  let editable = false
  const currentUser = authn.currentUser()
  if (!currentUser) {
    return 'anonymous'
  }

  if (!currentUser.sameTerm(subject)) {
    return 'authenticated'
  }

  try {
    editable = await solidLogicSingleton.resource.checkAndRefreshEditable(subject)
  } catch {
    log('Resource could not be refreshed and is not editable.')
    return 'anonymous'
  }

  return editable ? 'owner' : 'anonymous'
}
