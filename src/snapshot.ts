import type { Context } from './types'

type SnapshotEntry = {
  id?: string | null
  index: string
  address: string
  cid: string
  organizationId?: string | null
}

const toIsoString = (value: Date | string): string =>
  typeof value === 'string' ? value : value.toISOString()

export const buildSnapshot = (context: Context): Record<string, unknown> => ({
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
      data: procedure.data
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
