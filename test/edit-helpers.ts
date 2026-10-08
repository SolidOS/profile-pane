import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authn } from 'solid-logic'
import { st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { context, subject } from './setup'
import { checkIfThingExists, saveNewThing } from '../src/editProfilePane/helpers'

describe('add-me-to-your-friends functions', () => {
    const baseStore = context.session.store as any
    const me = sym('https://example.com/profile/card#me')

    beforeEach(() => {
      vi.restoreAllMocks()
      baseStore.fetcher = {
        load: vi.fn(async () => undefined)
      }
      baseStore.updater = {
        update: vi.fn(async () => undefined)
      }
      baseStore.whether = vi.fn().mockReturnValue(0)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    describe('saveNewThing', () => {
      it('exists', () => {
        expect(saveNewThing).toBeInstanceOf(Function)
      })

      it('saves a new friend in the viewer profile document', async () => {
        vi.spyOn(authn, 'currentUser').mockReturnValue(me)
        await saveNewThing(subject, context, ns.foaf('knows'))
        expect(baseStore.updater.update).toHaveBeenCalledExactlyOnceWith(
          [], [st(me, ns.foaf('knows'), subject, me.doc())]
        )
      })
  
    })
  
    describe('checkIfThingExists', () => {
      it('exists', () => {
        expect(checkIfThingExists).toBeInstanceOf(Function)
      })
  
      it('runs', () => {
        expect(checkIfThingExists(context.session.store, subject, subject, subject)).toBeTruthy()
        expect(checkIfThingExists(context.session.store, subject, subject, subject)).toBeInstanceOf(Promise)
      })
    })
  
  })
