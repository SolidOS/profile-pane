import { NamedNode, Serializer, Statement, Store, parse } from 'rdflib'

export function show (store: Store, subject: NamedNode, statements?: Statement[]) {
  const sz = new (Serializer as any)(store)
  // sz.setNamespaces(ns)
  sz.setBase(subject.uri)
  const turtle = sz.statementsToN3(statements || store.connectedStatements(subject, subject.doc()))
  const short = turtle.replace(/@prefix.*\n/g, '')
  return short
}
