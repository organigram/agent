import { type Context, type AgentResponse, type SupportTicket } from './types';
/**
 * Validate a support ticket drafted by the model or edited by the user.
 * @remarks
 * Both sources are untrusted: the ticket is dropped without a subject or a description, an unknown category becomes `other`, and the texts are truncated.
 * @param input - The ticket to validate.
 * @returns The ticket, or `undefined` if it is invalid.
 */
export declare const normalizeSupportTicket: (input: unknown) => SupportTicket | undefined;
/**
 * Validate the answer of the language model and turn it into an `AgentResponse`.
 * @remarks
 * Treat the model's output as untrusted. Without a message, the answer is replaced by a fallback message. Only citations of known types are kept, at most 8. A preview is kept only if it is a new organigram, or an addition to an organigram of the workspace that has no deployed organ, procedure or asset and that changes or removes none of its organs, entries, procedures or assets. Invalid previews are dropped. A support ticket draft is validated with `normalizeSupportTicket`.
 * @param input - The answer of the model, parsed from JSON.
 * @param context - The context the prompt was built with.
 * @returns The answer, without `threadId`.
 */
export declare const normalizeResponse: (input: unknown, context: Context) => AgentResponse;
