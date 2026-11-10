import type { AiModelUsage } from './types';
/**
 * Read the tokens used by a call to a language model from the provider's response.
 * @remarks
 * Reads the usage fields of OpenAI-compatible responses (`input_tokens`, `prompt_tokens`, cached token details) and Ollama responses (`prompt_eval_count`, `eval_count`). When the provider reports no input or output tokens, they are estimated as a quarter of the length of the prompt or completion, and `estimatedTokens` is `true`.
 * @param payload - The provider's response, or its `usage` object.
 * @param prompt - The prompt sent, to estimate input tokens.
 * @param completion - The completion received, to estimate output tokens.
 * @param provider - Name of the provider, copied to the result.
 * @param model - Name of the model, copied to the result.
 */
export declare const extractModelUsage: ({ payload, prompt, completion, provider, model }: {
    payload: unknown;
    prompt: string;
    completion: string;
    provider: string;
    model: string;
}) => AiModelUsage;
