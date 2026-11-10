import { Organigram } from '@organigram/js';
import { SUPPORT_TICKET_CATEGORIES } from './types';
const citationTypes = new Set([
    'workspace',
    'organigram',
    'organ',
    'procedure',
    'asset',
    'notification',
    'file'
]);
const safeString = (value, fallback = '') => typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
const normalizeCitations = (input) => (Array.isArray(input) ? input : [])
    .map(item => item)
    .filter(item => citationTypes.has(safeString(item.type)))
    .map(item => ({
    type: safeString(item.type),
    id: safeString(item.id, 'unknown'),
    label: safeString(item.label, 'Reference')
}))
    .slice(0, 8);
const byAddress = (items) => new Map(items
    .filter(item => item.address != null && item.address !== '')
    .map(item => [item.address, item]));
const hasDeployedParts = (organigram) => [...organigram.organs, ...organigram.procedures, ...organigram.assets].some(item => item.isDeployed === true);
const assertNoExistingObjectChanged = (candidateItems, existingItems, label) => {
    const existingByAddress = byAddress(existingItems);
    for (const candidate of candidateItems) {
        const address = candidate.address;
        if (address == null || address === '')
            continue;
        const existing = existingByAddress.get(address);
        if (existing == null)
            continue;
        if (JSON.stringify(candidate) !== JSON.stringify(existing)) {
            throw new Error(`Preview cannot modify existing ${label} ${address}.`);
        }
    }
};
const withoutEntries = (organ) => {
    const { entries: _entries, ...rest } = organ;
    return rest;
};
const assertExistingEntriesRemain = (candidateEntries, existingEntries, organAddress) => {
    const candidateEntryKeys = new Set((candidateEntries ?? []).map(entry => JSON.stringify(entry)));
    for (const existingEntry of existingEntries ?? []) {
        if (!candidateEntryKeys.has(JSON.stringify(existingEntry))) {
            throw new Error(`Preview cannot remove or modify entries from existing organ ${organAddress}.`);
        }
    }
};
const assertNoExistingOrganChanged = (candidateOrgans, existingOrgans) => {
    const existingByAddress = byAddress(existingOrgans);
    for (const candidate of candidateOrgans) {
        const address = candidate.address;
        if (address == null || address === '')
            continue;
        const existing = existingByAddress.get(address);
        if (existing == null)
            continue;
        if (JSON.stringify(withoutEntries(candidate)) !==
            JSON.stringify(withoutEntries(existing))) {
            throw new Error(`Preview cannot modify existing organ ${address}.`);
        }
        assertExistingEntriesRemain(candidate.entries, existing.entries, address);
    }
};
const normalizePreview = (input, context) => {
    const preview = input;
    if (preview == null)
        return undefined;
    if (preview.type === 'new-organigram') {
        const normalizedPreview = new Organigram(preview.organigram).toJson();
        return {
            type: 'new-organigram',
            persistence: 'create',
            summary: (Array.isArray(preview.summary) ? preview.summary : [])
                .map(item => safeString(item))
                .filter(Boolean)
                .slice(0, 6),
            organigram: normalizedPreview
        };
    }
    if (preview.type !== 'organigram')
        return undefined;
    const organigramId = safeString(preview.organigramId);
    const target = context.workspace.organigrams.find(organigram => organigram.id === organigramId || organigram.slug === organigramId) ?? null;
    if (target == null)
        return undefined;
    const targetJson = new Organigram(target).toJson();
    if (hasDeployedParts(targetJson)) {
        return undefined;
    }
    const normalizedPreview = new Organigram(preview.organigram).toJson();
    assertNoExistingOrganChanged(normalizedPreview.organs, targetJson.organs);
    assertNoExistingObjectChanged(normalizedPreview.procedures, targetJson.procedures, 'procedure');
    assertNoExistingObjectChanged(normalizedPreview.assets, targetJson.assets, 'asset');
    return {
        type: 'organigram',
        organigramId: target.id ?? organigramId,
        persistence: 'merge-additive',
        summary: (Array.isArray(preview.summary) ? preview.summary : [])
            .map(item => safeString(item))
            .filter(Boolean)
            .slice(0, 6),
        organigram: normalizedPreview
    };
};
/**
 * Validate a support ticket drafted by the model or edited by the user.
 * @remarks
 * Both sources are untrusted: the ticket is dropped without a subject or a description, an unknown category becomes `other`, and the texts are truncated.
 * @param input - The ticket to validate.
 * @returns The ticket, or `undefined` if it is invalid.
 */
export const normalizeSupportTicket = (input) => {
    const ticket = (input ?? {});
    // The subject becomes an email header: keep it on one line.
    const subject = safeString(ticket.subject).replace(/\s+/g, ' ').slice(0, 150);
    const description = safeString(ticket.description).slice(0, 5000);
    if (subject === '' || description === '')
        return undefined;
    const category = SUPPORT_TICKET_CATEGORIES.find(item => item === ticket.category);
    return { category: category ?? 'other', subject, description };
};
/**
 * Validate the answer of the language model and turn it into an `AgentResponse`.
 * @remarks
 * Treat the model's output as untrusted. Without a message, the answer is replaced by a fallback message. Only citations of known types are kept, at most 8. A preview is kept only if it is a new organigram, or an addition to an organigram of the workspace that has no deployed organ, procedure or asset and that changes or removes none of its organs, entries, procedures or assets. Invalid previews are dropped. A support ticket draft is validated with `normalizeSupportTicket`.
 * @param input - The answer of the model, parsed from JSON.
 * @param context - The context the prompt was built with.
 * @returns The answer, without `threadId`.
 */
export const normalizeResponse = (input, context) => {
    const raw = (input ?? {});
    const message = safeString(raw.message, 'I could not produce a reliable answer for this workspace yet.');
    let preview;
    try {
        preview = normalizePreview(raw.preview, context);
    }
    catch (error) {
        console.warn('[agent] Dropping invalid preview', error);
    }
    const supportTicket = normalizeSupportTicket(raw.supportTicket);
    return {
        message,
        citations: normalizeCitations(raw.citations),
        ...(preview == null ? {} : { preview }),
        ...(supportTicket == null ? {} : { supportTicket })
    };
};
