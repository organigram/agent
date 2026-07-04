import { Organigram, type OrganigramJson } from '@organigram/js'

import type {
  WorkspaceAgentCitation,
  WorkspaceAgentContext,
  WorkspaceAgentOrganigramPreview,
  WorkspaceAgentResponse
} from './types'

const citationTypes = new Set([
  'workspace',
  'organigram',
  'organ',
  'procedure',
  'asset',
  'notification',
  'file'
])

const safeString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback

const normalizeCitations = (input: unknown): WorkspaceAgentCitation[] =>
  (Array.isArray(input) ? input : [])
    .map(item => item as Record<string, unknown>)
    .filter(item => citationTypes.has(safeString(item.type)))
    .map(item => ({
      type: safeString(item.type) as WorkspaceAgentCitation['type'],
      id: safeString(item.id, 'unknown'),
      label: safeString(item.label, 'Reference')
    }))
    .slice(0, 8)

const byAddress = <T extends { address?: string | null }>(
  items: T[]
): Map<string, T> =>
  new Map(
    items
      .filter(item => item.address != null && item.address !== '')
      .map(item => [item.address as string, item])
  )

const hasDeployedParts = (organigram: OrganigramJson): boolean =>
  [...organigram.organs, ...organigram.procedures, ...organigram.assets].some(
    item => item.isDeployed === true
  )

const assertNoExistingObjectChanged = <T extends { address?: string | null }>(
  candidateItems: T[],
  existingItems: T[],
  label: string
): void => {
  const existingByAddress = byAddress(existingItems)
  for (const candidate of candidateItems) {
    const address = candidate.address
    if (address == null || address === '') continue
    const existing = existingByAddress.get(address)
    if (existing == null) continue
    if (JSON.stringify(candidate) !== JSON.stringify(existing)) {
      throw new Error(`Preview cannot modify existing ${label} ${address}.`)
    }
  }
}

type OrganJson = OrganigramJson['organs'][number]

const withoutEntries = (organ: OrganJson): Omit<OrganJson, 'entries'> => {
  const { entries: _entries, ...rest } = organ
  return rest
}

const assertExistingEntriesRemain = (
  candidateEntries: OrganJson['entries'],
  existingEntries: OrganJson['entries'],
  organAddress: string
): void => {
  const candidateEntryKeys = new Set(
    (candidateEntries ?? []).map(entry => JSON.stringify(entry))
  )

  for (const existingEntry of existingEntries ?? []) {
    if (!candidateEntryKeys.has(JSON.stringify(existingEntry))) {
      throw new Error(
        `Preview cannot remove or modify entries from existing organ ${organAddress}.`
      )
    }
  }
}

const assertNoExistingOrganChanged = (
  candidateOrgans: OrganJson[],
  existingOrgans: OrganJson[]
): void => {
  const existingByAddress = byAddress(existingOrgans)
  for (const candidate of candidateOrgans) {
    const address = candidate.address
    if (address == null || address === '') continue
    const existing = existingByAddress.get(address)
    if (existing == null) continue
    if (
      JSON.stringify(withoutEntries(candidate)) !==
      JSON.stringify(withoutEntries(existing))
    ) {
      throw new Error(`Preview cannot modify existing organ ${address}.`)
    }
    assertExistingEntriesRemain(candidate.entries, existing.entries, address)
  }
}

const normalizePreview = (
  input: unknown,
  context: WorkspaceAgentContext
): WorkspaceAgentOrganigramPreview | undefined => {
  const preview = input as Record<string, unknown> | undefined
  if (preview == null) return undefined

  if (preview.type === 'new-organigram') {
    const normalizedPreview = new Organigram(
      preview.organigram as OrganigramJson
    ).toJson()

    return {
      type: 'new-organigram',
      persistence: 'create',
      summary: (Array.isArray(preview.summary) ? preview.summary : [])
        .map(item => safeString(item))
        .filter(Boolean)
        .slice(0, 6),
      organigram: normalizedPreview
    }
  }

  if (preview.type !== 'organigram') return undefined

  const organigramId = safeString(preview.organigramId)
  const target =
    context.workspace.organigrams.find(
      organigram =>
        organigram.id === organigramId || organigram.slug === organigramId
    ) ?? null
  if (target == null) return undefined

  const targetJson = new Organigram(target).toJson()
  if (hasDeployedParts(targetJson)) {
    return undefined
  }

  const normalizedPreview = new Organigram(
    preview.organigram as OrganigramJson
  ).toJson()

  assertNoExistingOrganChanged(normalizedPreview.organs, targetJson.organs)
  assertNoExistingObjectChanged(
    normalizedPreview.procedures,
    targetJson.procedures,
    'procedure'
  )
  assertNoExistingObjectChanged(
    normalizedPreview.assets,
    targetJson.assets,
    'asset'
  )

  return {
    type: 'organigram',
    organigramId: target.id ?? organigramId,
    persistence: 'merge-additive',
    summary: (Array.isArray(preview.summary) ? preview.summary : [])
      .map(item => safeString(item))
      .filter(Boolean)
      .slice(0, 6),
    organigram: normalizedPreview
  }
}

export const normalizeWorkspaceAgentResponse = (
  input: unknown,
  context: WorkspaceAgentContext
): WorkspaceAgentResponse => {
  const raw = (input ?? {}) as Record<string, unknown>
  const message = safeString(
    raw.message,
    'I could not produce a reliable answer for this workspace yet.'
  )
  let preview: WorkspaceAgentOrganigramPreview | undefined

  try {
    preview = normalizePreview(raw.preview, context)
  } catch (error) {
    console.warn('[agent] Dropping invalid preview', error)
  }

  return {
    message,
    citations: normalizeCitations(raw.citations),
    ...(preview == null ? {} : { preview })
  }
}
