import type { AiModelUsage } from './types';
export declare const extractWorkspaceAgentModelUsage: ({ payload, prompt, completion, provider, model }: {
    payload: unknown;
    prompt: string;
    completion: string;
    provider: string;
    model: string;
}) => AiModelUsage;
