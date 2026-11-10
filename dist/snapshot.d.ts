import type { Context } from './types';
/** Number of the latest proposals of each procedure included in a snapshot. */
export declare const MAX_PROPOSALS_PER_PROCEDURE = 10;
/**
 * Build the description of a workspace given to the agent in its prompt.
 * @remarks
 * The snapshot keeps only the fields the agent needs: the workspace, its organigrams with their organs, entries, procedures, latest proposals and elections, and assets, plus the names and references of files and the notifications. It never contains the contents of files. It includes `generatedAt`, the date it was built.
 * @param context - What is known about the workspace.
 */
export declare const buildSnapshot: (context: Context) => Record<string, unknown>;
