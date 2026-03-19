import { NamedNode, sym } from "rdflib"
import { store } from "solid-logic"
import { ns, utils, widgets } from "solid-ui"

export function refresh(dom: Document, attachmentTable: HTMLTableElement, me: NamedNode, editableProfile: NamedNode | null, predicate: NamedNode) {
    // Keep the RDF terms so downstream Solid-UI helpers (e.g. findImage) can call term.sameTerm().
    // We still sort by string value so the list order is stable.
    const friendsList = store.each(me, predicate)
    // Ensure profiles are loaded before we render rows, otherwise widgets.findImage / utils.label may return empty.
    void (async () => {
        if (store.fetcher) {
            await Promise.all(
                friendsList.map((friend) => {
                    if (!store.holds(friend, null, null, null)) {
                        return store.fetcher?.load(friend.value).catch(() => undefined)
                    }
                    return Promise.resolve()
                })
            )
        }
        friendsList.sort((a, b) => (a.value > b.value ? 1 : a.value < b.value ? -1 : 0))
        utils.syncTableToArray(attachmentTable, friendsList, (target) => createNewRow(dom, attachmentTable, target, me, editableProfile, predicate))
    })()
}

function createNewRow (dom: Document, attachmentTable: HTMLTableElement, target: any, me: NamedNode, editableProfile: NamedNode | null, predicate: NamedNode): HTMLTableRowElement {
    const theTarget = target
    const profileImg = dom.createElement('img')
    profileImg.classList.add('profile-image')
    profileImg.src = widgets.findImage(sym(target))
    profileImg.alt = `Image of ${utils.label(sym(target))}`

    const opt: any = { 
        image: profileImg,
        title: utils.label(sym(target)),
        link: true
    }
    if (!!editableProfile) {
        opt.deleteFunction = function () {
        deleteAttachment(dom, attachmentTable, me, editableProfile, theTarget, predicate)
        }
    }
    return widgets.renderAsRow(dom, predicate, target, opt)
}

async function deleteAttachment(dom: Document, attachmentTable: HTMLTableElement, me: NamedNode, editableProfile: NamedNode | null, target: NamedNode, predicate: NamedNode) {
    if (!store.updater) {
        throw new Error('Store has no updater.')
    }

    // Delete the exact statements in the store so we don't rely on doc() matching
    const statementsToDelete = store.statementsMatching(me, predicate, target, null)

    if (!statementsToDelete.length) {
        console.warn('No matching statement found to delete for', target.value)
        refresh(dom, attachmentTable, me, editableProfile, predicate)
        return
    }

    try {
        await store.updater.update(statementsToDelete as any, [])

        // UpdateManager may mutate store asynchronously, so only remove locally if it still exists
        if (typeof store.removeStatements === 'function') {
            const stillThere = store.holds(me, predicate, target, null)
            if (stillThere) {
                try {
                store.removeStatements(statementsToDelete)
                } catch (e) {
                // Ignore if already gone
                }
            }
        }

        // Ensure store is up-to-date before re-rendering
        if (store.fetcher) await store.fetcher.load(me.doc())
        refresh(dom, attachmentTable, me, editableProfile, predicate)
    } catch (error) {
        console.error('Error deleting:', error)

        // If update failed, try to keep UI in sync anyway
        if (typeof store.removeStatements === 'function') {
            try {
                store.removeStatements(statementsToDelete)
            } catch (e) {
                /* ignore */
            }
        }

        if (store.fetcher) await store.fetcher.load(me.doc())
        refresh(dom, attachmentTable, me, editableProfile, predicate)
    }
}

export function isAWebID(subject) {
    if (subject && subject.doc) {
        const t = store.findTypeURIs(subject.doc())
        return !!t[ns.foaf('PersonalProfileDocument').uri]
    }
    return false
}