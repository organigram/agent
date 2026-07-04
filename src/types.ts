import type { OrganigramInput, OrganigramJson } from '@organigram/js'

export type WorkspaceAgentMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type WorkspaceAgentThreadSource = 'workspace' | 'hero'

export type WorkspaceAgentCitation = {
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

export type WorkspaceAgentRequest = {
  threadId?: string | null
  message?: string
  messages?: WorkspaceAgentMessage[]
  currentOrganigramId?: string | null
  source?: WorkspaceAgentThreadSource
}

export type WorkspaceAgentRecordThreadRequest = {
  action: 'recordThread'
  source: WorkspaceAgentThreadSource
  userMessage: string
  assistantMessage: string
  currentOrganigramId?: string | null
}

export type WorkspaceAgentMergeOrganigramPreview = {
  type: 'organigram'
  organigramId: string
  persistence: 'merge-additive'
  summary: string[]
  organigram: OrganigramJson
}

export type WorkspaceAgentNewOrganigramPreview = {
  type: 'new-organigram'
  persistence: 'create'
  summary: string[]
  organigram: OrganigramJson
}

export type WorkspaceAgentOrganigramPreview =
  | WorkspaceAgentMergeOrganigramPreview
  | WorkspaceAgentNewOrganigramPreview

export type WorkspaceAgentResponse = {
  threadId?: string
  message: string
  citations: WorkspaceAgentCitation[]
  preview?: WorkspaceAgentOrganigramPreview
}

export type WorkspaceAgentStoredMessage = WorkspaceAgentMessage & {
  id: string
  createdAt: string
  response?: WorkspaceAgentResponse
}

export type WorkspaceAgentThread = {
  id: string
  title: string
  source: WorkspaceAgentThreadSource
  currentOrganigramId?: string | null
  createdAt: string
  updatedAt: string
  messages: WorkspaceAgentStoredMessage[]
}

export type WorkspaceAgentThreadsResponse = {
  threads: WorkspaceAgentThread[]
}

export type WorkspaceAgentWorkspace = {
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

export type WorkspaceAgentFile = {
  cid: string
  name?: string | null
}

export type WorkspaceAgentNotification = {
  id: string
  type: string
  title?: string | null
  body?: string | null
  href?: string | null
  createdAt: Date | string
}

export type WorkspaceAgentContext = {
  workspace: WorkspaceAgentWorkspace
  files: WorkspaceAgentFile[]
  notifications: WorkspaceAgentNotification[]
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

export const isWorkspaceAgentMessage = (
  value: unknown
): value is WorkspaceAgentMessage => {
  const item = value as WorkspaceAgentMessage
  return (
    (item?.role === 'user' || item?.role === 'assistant') &&
    typeof item.content === 'string' &&
    item.content.trim() !== ''
  )
}
