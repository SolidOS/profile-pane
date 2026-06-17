const rdf = require('rdflib')
const store = rdf.graph()
store.fetcher = { _fetch: () => Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob()) }) }

const noop = () => {}
const createAutoMock = () => new Proxy({}, {
  get: (_, prop) => {
    if (typeof prop === 'symbol' || prop === 'then') return undefined
    return createAutoMock()
  },
  apply: () => {},
})

const instance = createAutoMock()
instance.store = store

module.exports = {
  authSession: { webId: null, isActive: false, info: { isLoggedIn: false, webId: null }, login: noop, logout: noop, events: { on: noop, off: noop } },
  authn: { checkUser: () => Promise.resolve(null), currentUser: () => null, login: noop },
  store,
  solidLogicSingleton: instance,
  SolidLogic: class { constructor() { this.store = store } },
  AppDetails: {},
}
