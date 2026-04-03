export type RowStatus = 'existing' | 'new' | 'modified' | 'deleted'

export type MutationOps<T> = {
  create: T[]
  update: T[]
  remove: T[]
}

