import type { OrganigramInput, OrganigramJson } from '@organigram/js'

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type ThreadSource = 'workspace' | 'hero'

export type Citation = {
  type:
    | 'workspace'
    | 'organigram'
    | 'organ'
    | 'procedure'
    | 'asset'
    | 'notification'
    | 'file'
  id: string
  label: string
}

export type AgentRequest = {
  threadId?: string | null
  message?: string
  messages?: Message[]
  currentOrganigramId?: string | null
  source?: ThreadSource
}

export type RecordThreadRequest = {
  action: 'recordThread'
  source: ThreadSource
  userMessage: string
  assistantMessage: string
  currentOrganigramId?: string | null
}

export type MergeOrganigramPreview = {
  type: 'organigram'
  organigramId: string
  persistence: 'merge-additive'
  summary: string[]
  organigram: OrganigramJson
}

export type NewOrganigramPreview = {
  type: 'new-organigram'
  persistence: 'create'
  summary: string[]
  organigram: OrganigramJson
}

export type OrganigramPreview = MergeOrganigramPreview | NewOrganigramPreview

export type AgentResponse = {
  threadId?: string
  message: string
  citations: Citation[]
  preview?: OrganigramPreview
}

export type StoredMessage = Message & {
  id: string
  createdAt: string
  response?: AgentResponse
}

export type ThreadWorkspace = {
  id: string
  name?: string | null
}

export type Thread = {
  id: string
  title: string
  source: ThreadSource
  workspace?: ThreadWorkspace | null
  currentOrganigramId?: string | null
  createdAt: string
  updatedAt: string
  messages: StoredMessage[]
}

export type ThreadsResponse = {
  threads: Thread[]
}

export type Workspace = {
  id: string
  slug: string
  name?: string | null
  description?: string | null
  admins: string[]
  ownerUserAddress?: string | null
  ownerOrganizationId?: string | null
  ownerOrganization?: { id?: string | null } | null
  organigrams: OrganigramInput[]
}

export type File = {
  cid: string
  name?: string | null
}

export type Notification = {
  id: string
  type: string
  title?: string | null
  body?: string | null
  href?: string | null
  createdAt: Date | string
}

export type Context = {
  workspace: Workspace
  files: File[]
  notifications: Notification[]
  currentOrganigram: OrganigramJson | null
}

export type AiModelUsage = {
  provider: string
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedTokens: boolean
}

export const isMessage = (value: unknown): value is Message => {
  const item = value as Message
  return (
    (item?.role === 'user' || item?.role === 'assistant') &&
    typeof item.content === 'string' &&
    item.content.trim() !== ''
  )
}
