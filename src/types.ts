import type { OrganigramInput, OrganigramJson } from '@organigram/js'

/** A message of a conversation with the workspace agent. */
export type Message = {
  /** Who wrote the message. */
  role: 'user' | 'assistant'
  /** Text of the message. */
  content: string
}

/** Where a conversation started: in a workspace, or on the home page hero. */
export type ThreadSource = 'workspace' | 'hero'

/** A reference to a workspace object that supports an answer of the agent. */
export type Citation = {
  /** Kind of the cited object. */
  type:
    | 'workspace'
    | 'organigram'
    | 'organ'
    | 'procedure'
    | 'asset'
    | 'notification'
    | 'file'
  /** Identifier of the cited object. */
  id: string
  /** Name shown for the citation. */
  label: string
}

/** Body of a request to the workspace agent. */
export type AgentRequest = {
  /** Conversation to continue. Without it, a new conversation starts. */
  threadId?: string | null
  /** New message of the user. */
  message?: string
  /** Messages of the conversation so far. */
  messages?: Message[]
  /** Organigram the user is looking at, if any. */
  currentOrganigramId?: string | null
  /** Where the conversation started. */
  source?: ThreadSource
}

/** Body of a request that stores a conversation held elsewhere, such as on the home page hero, in the workspace history. */
export type RecordThreadRequest = {
  /** Always `recordThread`. */
  action: 'recordThread'
  /** Where the conversation started. */
  source: ThreadSource
  /** Message of the user. */
  userMessage: string
  /** Answer of the agent. */
  assistantMessage: string
  /** Organigram the user was looking at, if any. */
  currentOrganigramId?: string | null
}

/** A proposed addition to an existing organigram that is not deployed yet. */
export type MergeOrganigramPreview = {
  /** Always `organigram`. */
  type: 'organigram'
  /** Identifier of the organigram to add to. */
  organigramId: string
  /** Always `merge-additive`: the preview only adds to the organigram, and never changes or removes what it holds. */
  persistence: 'merge-additive'
  /** Short descriptions of the changes, at most 6. */
  summary: string[]
  /** The organs, procedures, assets and entries to add. */
  organigram: OrganigramJson
}

/** A proposed new organigram. */
export type NewOrganigramPreview = {
  /** Always `new-organigram`. */
  type: 'new-organigram'
  /** Always `create`. */
  persistence: 'create'
  /** Short descriptions of the new organigram, at most 6. */
  summary: string[]
  /** The complete new organigram. */
  organigram: OrganigramJson
}

/** A change to organigrams proposed by the agent, which the user reviews before saving it. */
export type OrganigramPreview = MergeOrganigramPreview | NewOrganigramPreview

/** Categories of a support ticket. */
export const SUPPORT_TICKET_CATEGORIES = [
  'bug',
  'legal',
  'billing',
  'account',
  'other'
] as const

/** A support request drafted by the agent, which the user reviews and edits before sending it. */
export type SupportTicket = {
  /** One of `SUPPORT_TICKET_CATEGORIES`. */
  category: (typeof SUPPORT_TICKET_CATEGORIES)[number]
  /** Subject of the request, at most 150 characters. */
  subject: string
  /** Description of the request, at most 5000 characters. */
  description: string
}

/** An answer of the workspace agent, as returned by `normalizeResponse()`. */
export type AgentResponse = {
  /** Conversation the answer belongs to. */
  threadId?: string
  /** Text of the answer. */
  message: string
  /** Workspace objects that support the answer, at most 8. */
  citations: Citation[]
  /** Change to organigrams proposed with the answer, if any. */
  preview?: OrganigramPreview
  /** Support request drafted with the answer, if any. It is only sent once the user confirms it. */
  supportTicket?: SupportTicket
}

/** A message as stored in the history of a conversation. */
export type StoredMessage = Message & {
  /** Identifier of the message. */
  id: string
  /** ISO 8601 date of the message. */
  createdAt: string
  /** Full answer of the agent, for its messages. */
  response?: AgentResponse
}

/** The workspace of a conversation. */
export type ThreadWorkspace = {
  /** Identifier of the workspace. */
  id: string
  /** Name of the workspace. */
  name?: string | null
}

/** A stored conversation with the workspace agent. */
export type Thread = {
  /** Identifier of the conversation. */
  id: string
  /** Title of the conversation. */
  title: string
  /** Where the conversation started. */
  source: ThreadSource
  /** Workspace of the conversation. */
  workspace?: ThreadWorkspace | null
  /** Organigram the user was looking at, if any. */
  currentOrganigramId?: string | null
  /** ISO 8601 date of the conversation. */
  createdAt: string
  /** ISO 8601 date of the last message. */
  updatedAt: string
  /** Messages of the conversation. */
  messages: StoredMessage[]
}

/** List of the conversations of a user. */
export type ThreadsResponse = {
  /** The conversations. */
  threads: Thread[]
}

/** The workspace the agent answers about. */
export type Workspace = {
  /** Identifier of the workspace. */
  id: string
  /** Slug of the workspace in URLs. */
  slug: string
  /** Name of the workspace. */
  name?: string | null
  /** Description of the workspace. */
  description?: string | null
  /** Addresses of the administrators of the workspace. */
  admins: string[]
  /** Address of the user owning the workspace, if a user owns it. */
  ownerUserAddress?: string | null
  /** Identifier of the organization owning the workspace, if an organization owns it. */
  ownerOrganizationId?: string | null
  /** Organization owning the workspace, read when `ownerOrganizationId` is missing. */
  ownerOrganization?: { id?: string | null } | null
  /** Organigrams of the workspace. */
  organigrams: OrganigramInput[]
}

/** A file of the workspace. The agent only sees its reference and name, not its contents. */
export type File = {
  /** Reference of the file. */
  cid: string
  /** Name of the file. */
  name?: string | null
}

/** A notification of the workspace. */
export type Notification = {
  /** Identifier of the notification. */
  id: string
  /** Kind of notification. */
  type: string
  /** Title of the notification. */
  title?: string | null
  /** Text of the notification. */
  body?: string | null
  /** Link the notification points to. */
  href?: string | null
  /** Date of the notification. */
  createdAt: Date | string
}

/** What the agent knows about a workspace: the input of `buildSnapshot()`, `buildPrompt()` and `normalizeResponse()`. */
export type Context = {
  /** The workspace. */
  workspace: Workspace
  /** Files of the workspace. */
  files: File[]
  /** Notifications of the workspace. */
  notifications: Notification[]
  /** Organigram the user is looking at, if any. */
  currentOrganigram: OrganigramJson | null
}

/** Tokens used by one call to a language model. */
export type AiModelUsage = {
  /** Provider of the model. */
  provider: string
  /** Name of the model. */
  model: string
  /** Tokens of the prompt. */
  inputTokens: number
  /** Tokens of the prompt read from the provider's cache. */
  cachedInputTokens: number
  /** Tokens of the completion. */
  outputTokens: number
  /** Total tokens, as reported by the provider or the sum of input and output tokens. */
  totalTokens: number
  /** Whether input or output tokens are estimated from text length because the provider did not report them. */
  estimatedTokens: boolean
}

/**
 * Check that a value is a message with a role and non-empty content, for example in a request body.
 * @param value - The value to check.
 */
export const isMessage = (value: unknown): value is Message => {
  const item = value as Message
  return (
    (item?.role === 'user' || item?.role === 'assistant') &&
    typeof item.content === 'string' &&
    item.content.trim() !== ''
  )
}
