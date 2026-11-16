import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import { LiveStore, NamedNode, st } from 'rdflib'
import {
  friendExistsMessage, userNotLoggedInErrorMessage
} from '../texts'
import { ensureStandardMutationPrefixes } from '../sections/shared/rdfMutationHelpers'

async function saveNewThing(
  subject: NamedNode,
  context: DataBrowserContext,
  predicate: NamedNode
): Promise<void> {
  const me = authn.currentUser()
  const store: LiveStore = context.session.store

  if (checkIfAnyUserLoggedIn(me)) {
    if (!(await checkIfThingExists(store , me, subject, predicate))) {
      //if friend does not exist, we add her/him
      await store.fetcher.load(me)
      const updater = store.updater
      const toBeInserted = [st(me, predicate, subject, me.doc())]
      try {
        ensureStandardMutationPrefixes(store)
        await updater.update([], toBeInserted)
      } catch (error) {
        let errorMessage = error
        if (errorMessage.toString().includes('Unauthenticated'))
          errorMessage = userNotLoggedInErrorMessage
        throw new Error(errorMessage)
      }
    } else throw new Error(friendExistsMessage)
  } else throw new Error(userNotLoggedInErrorMessage)
}

function checkIfAnyUserLoggedIn(me: NamedNode): boolean {
  if (me) return true
  else return false
}

async function checkIfThingExists(
  store: LiveStore,
  me: NamedNode,
  subject: NamedNode,
  predicate: NamedNode
): Promise<boolean> {
  await store.fetcher.load(me)
  if (store.whether(me, predicate, subject, me.doc()) === 0)
    return false
  else return true
}

export {
  saveNewThing,
  checkIfThingExists
}
