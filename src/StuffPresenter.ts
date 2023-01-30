import { NamedNode, uri } from "rdflib";
import { ns, utils, widgets, icons } from "solid-ui";
import { solidLogicSingleton } from 'solid-logic'

const { iconForClass } = widgets
const { typeIndex } = solidLogicSingleton
const {
  getScopedAppInstances
} = typeIndex


export interface Item {
  href: string,
  name: string,
  icon: string,
  instance: NamedNode
}

export interface StuffPresentation {
  stuff: Item[];
}

export const iconForClassMap = {} // @@ move to buttons in solid-ui
for (const k in iconForClass) {
  const pref = k.split(':')[0]
  const id = k.split(':')[1]
  const theClass = ns[pref](id)
  iconForClassMap[theClass.uri] = uri.join(iconForClass[k], icons.iconBase)
}

export function getIconForClass (klass:NamedNode) {
  const icon0 = iconForClassMap[klass.uri]
  return icon0 || icons.iconBase + 'noun_10636.svg' //  fall back to black disk
}

export async function presentStuff(
  subject: NamedNode
): Promise<StuffPresentation> {

 const scopedItems = await getScopedAppInstances(null, subject)
 console.log('scopedItems', scopedItems)

 const stuff = scopedItems.map(item => { // work with old or new solid-logic
   const icon = getIconForClass((item as any).type || ns.rdf('Resource'))  // eslint-disable-line
   const href = item.instance.uri
   const name = utils.label(item.instance)
   const instance = item.instance
   console.log(`   href=${href} name=${name} icon=${icon}`)
   return { href, name, icon, instance }
 })

  return { stuff }
}
