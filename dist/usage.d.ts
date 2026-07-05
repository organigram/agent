import type { AiModelUsage } from './types';
export declare const extractModelUsage: ({ payload, prompt, completion, provider, model }: {
    payload: unknown;
    prompt: string;
    completion: string;
    provider: string;
    model: string;
}) => AiModelUsage;
