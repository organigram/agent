import type { AiModelUsage } from './types'

const estimateTokensFromText = (value: string): number =>
  Math.max(0, Math.ceil(value.length / 4))

const readFiniteTokenCount = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : undefined

const readCachedTokensFromDetails = (value: unknown): number | undefined =>
  value != null && typeof value === 'object'
    ? readFiniteTokenCount((value as { cached_tokens?: unknown }).cached_tokens)
    : undefined

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
export const extractModelUsage = ({
  payload,
  prompt,
  completion,
  provider,
  model
}: {
  payload: unknown
  prompt: string
  completion: string
  provider: string
  model: string
}): AiModelUsage => {
  const raw = (payload ?? {}) as Record<string, unknown>
  const usage =
    raw.usage != null && typeof raw.usage === 'object'
      ? (raw.usage as Record<string, unknown>)
      : raw
  const inputTokens =
    readFiniteTokenCount(usage.input_tokens) ??
    readFiniteTokenCount(usage.prompt_tokens) ??
    readFiniteTokenCount(raw.prompt_eval_count)
  const outputTokens =
    readFiniteTokenCount(usage.output_tokens) ??
    readFiniteTokenCount(usage.completion_tokens) ??
    readFiniteTokenCount(raw.eval_count)
  const cachedInputTokens =
    readFiniteTokenCount(usage.cached_input_tokens) ??
    readCachedTokensFromDetails(usage.input_tokens_details) ??
    readCachedTokensFromDetails(usage.prompt_tokens_details) ??
    0
  const estimatedTokens = inputTokens == null || outputTokens == null
  const resolvedInputTokens = inputTokens ?? estimateTokensFromText(prompt)
  const resolvedOutputTokens = outputTokens ?? estimateTokensFromText(completion)

  return {
    provider,
    model,
    inputTokens: resolvedInputTokens,
    cachedInputTokens,
    outputTokens: resolvedOutputTokens,
    totalTokens:
      readFiniteTokenCount(usage.total_tokens) ??
      resolvedInputTokens + resolvedOutputTokens,
    estimatedTokens
  }
}
