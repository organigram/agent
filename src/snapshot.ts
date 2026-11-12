import type { Election } from '@organigram/js'
import type { Context } from './types'

// Keeps the prompt and the on-chain lookup bounded for procedures with a long
// proposal history.
/** Number of the latest proposals of each procedure included in a snapshot. */
export const MAX_PROPOSALS_PER_PROCEDURE = 10

type SnapshotProcedure = {
  elections?: Array<Election & { closed?: boolean }>
}

type SnapshotEntry = {
  id?: string | null
  index: string
  address: string
  cid: string
  organizationId?: string | null
}

const toIsoString = (value: Date | string): string =>
  typeof value === 'string' ? value : value.toISOString()

/**
 * Build the description of a workspace given to the agent in its prompt.
 * @remarks
 * The snapshot keeps only the fields the agent needs: the workspace, its organigrams with their organs, entries, procedures, latest proposals and elections, and assets, plus the names and references of files and the notifications. It never contains the contents of files. It includes `generatedAt`, the date it was built.
 * @param context - What is known about the workspace.
 */
export const buildSnapshot = (context: Context): Record<string, unknown> => ({
  generatedAt: new Date().toISOString(),
  workspace: {
    id: context.workspace.id,
    slug: context.workspace.slug,
    name: context.workspace.name,
    description: context.workspace.description,
    admins: context.workspace.admins,
    ownerUserAddress: context.workspace.ownerUserAddress,
    ownerOrganizationId:
      context.workspace.ownerOrganizationId ??
      context.workspace.ownerOrganization?.id ??
      null
  },
  currentOrganigramId: context.currentOrganigram?.id ?? null,
  organigrams: context.workspace.organigrams.map(organigram => ({
    id: organigram.id,
    slug: organigram.slug,
    name: organigram.name,
    description: organigram.description,
    chainId: organigram.chainId,
    deployed: [
      ...organigram.organs,
      ...organigram.procedures,
      ...organigram.assets
    ].some(item => item.isDeployed === true),
    organs: organigram.organs.map(organ => ({
      address: organ.address,
      name: organ.name,
      description: organ.description,
      chainId: organ.chainId,
      isDeployed: organ.isDeployed,
      permissions: organ.permissions,
      entries: (organ.entries ?? []).map(entry => {
        const normalizedEntry = entry as SnapshotEntry
        return {
          id: normalizedEntry.id,
          index: entry.index,
          address: entry.address,
          cid: entry.cid,
          userAddress: entry.address,
          organizationId: normalizedEntry.organizationId
        }
      })
    })),
    procedures: organigram.procedures.map(procedure => ({
      address: procedure.address,
      name: procedure.name,
      description: procedure.description,
      chainId: procedure.chainId,
      typeName: procedure.typeName,
      deciders: procedure.deciders,
      proposers: procedure.proposers,
      moderators: procedure.moderators,
      withModeration: procedure.withModeration,
      isDeployed: procedure.isDeployed,
      data: procedure.data,
      proposals: (procedure.proposals ?? [])
        .slice(-MAX_PROPOSALS_PER_PROCEDURE)
        .map(proposal => {
          const election = (procedure as SnapshotProcedure).elections?.find(
            item => item.proposalKey === proposal.key
          )
          return {
            key: proposal.key,
            creator: proposal.creator,
            presented: proposal.presented,
            blocked: proposal.blocked,
            blockReason: proposal.blockReason,
            adopted: proposal.adopted,
            applied: proposal.applied,
            operations: proposal.operations.map(operation => ({
              function: operation.function?.key ?? operation.functionSelector,
              target: operation.target,
              processed: operation.processed
            })),
            election:
              election == null
                ? null
                : {
                    start: new Date(Number(election.start) * 1000).toISOString(),
                    closed: election.closed,
                    votesCount: election.votesCount,
                    approvals: election.approvals,
                    objections: election.objections,
                    eligibleVotes: election.eligibleVotes,
                    approved: election.approved
                  }
          }
        })
    })),
    assets: organigram.assets.map(asset => ({
      address: asset.address,
      name: asset.name,
      description: asset.description,
      symbol: asset.symbol,
      chainId: asset.chainId,
      isDeployed: asset.isDeployed
    }))
  })),
  files: context.files.map(file => ({
    cid: file.cid,
    name: file.name
  })),
  notifications: context.notifications.map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    createdAt: toIsoString(notification.createdAt)
  }))
})
