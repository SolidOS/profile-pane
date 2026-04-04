import { Node } from "rdflib"
import { MutationOps } from "../shared/types"
import { RowStatus } from "../shared/types"
import { ns } from "solid-ui"

export const projectType = ns.schema('Project')

export interface ProjectFields {
  url: string
  title?: string
  businessType?: string
  description?: string
  imageUrl?: string
  category?: 'project' | 'community' | 'unknown'
}

export interface ProjectDetails extends ProjectFields {
  entryNode: Node
}

export interface ProjectRow extends ProjectFields {
  entryNode: string
  status: RowStatus
}

export type ProjectMutationPlan = MutationOps<ProjectRow>
