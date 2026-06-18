const rdf = require('rdflib')
const store = rdf.graph()
store.fetcher = {
  _fetch: () => Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob()) }),
  load: () => Promise.resolve(undefined),
}
store.updater = {
  update: () => Promise.resolve(undefined),
}

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

function currentUser() {
  const username = globalThis.$SolidTestEnvironment && globalThis.$SolidTestEnvironment.username
  return username ? rdf.sym(username) : null
}

module.exports = {
  authSession: { webId: null, isActive: false, info: { isLoggedIn: false, webId: null }, login: noop, logout: noop, events: { on: noop, off: noop } },
  authn: { checkUser: () => Promise.resolve(currentUser()), currentUser, login: noop },
  store,
  solidLogicSingleton: instance,
  SolidLogic: class { constructor() { this.store = store } },
  AppDetails: {},
}
