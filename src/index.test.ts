import { getTemplate } from '@organigram/js'

import {
  buildWorkspaceAgentPrompt,
  extractWorkspaceAgentModelUsage,
  normalizeWorkspaceAgentResponse,
  type WorkspaceAgentContext
} from './index'

const makeContext = (): WorkspaceAgentContext => ({
  workspace: {
    id: 'workspace-1',
    slug: 'workspace-1',
    name: 'Workspace',
    description: '',
    admins: [],
    organigrams: [],
    ownerUserAddress: '0x0000000000000000000000000000000000000001',
    ownerOrganizationId: null
  },
  files: [],
  notifications: [],
  currentOrganigram: null
})

test('normalizes a workspace agent new-organigram preview', () => {
  const organigram = getTemplate('nonProfit', '11155111')
  const response = normalizeWorkspaceAgentResponse(
    {
      message: 'I prepared a new organigram.',
      citations: [],
      preview: {
        type: 'new-organigram',
        persistence: 'create',
        summary: ['Create a new association organigram.'],
        organigram
      }
    },
    makeContext()
  )

  expect(response.message).toBe('I prepared a new organigram.')
  expect(response.preview?.type).toBe('new-organigram')
  expect(response.preview?.persistence).toBe('create')
})

test('includes legacy organigram generation constraints for new previews', () => {
  const prompt = buildWorkspaceAgentPrompt({
    context: makeContext(),
    messages: [
      {
        role: 'user',
        content: 'Create an organigram from this governance charter.'
      }
    ]
  })

  expect(prompt).toContain('You are an expert in organizational governance.')
  expect(prompt).toContain('Do not invent blockchain addresses.')
  expect(prompt).toContain('Use stable textual salts')
  expect(prompt).toContain('deciders/proposers/moderators must reference organ salts')
  expect(prompt).toContain('Prefer explicit atomic permission keys over ADMIN or ALL.')
  expect(prompt).toContain('"quorumSize":"20001"')
  expect(prompt).toContain('manage treasury ->')
  expect(prompt).toContain('"type":"new-organigram"')
})

test('extracts provider token usage from chat payload counters', () => {
  const usage = extractWorkspaceAgentModelUsage({
    payload: {
      prompt_eval_count: 120,
      eval_count: 30
    },
    prompt: 'prompt text',
    completion: 'completion text',
    provider: 'test-provider',
    model: 'test-model'
  })

  expect(usage.provider).toBe('test-provider')
  expect(usage.model).toBe('test-model')
  expect(usage.inputTokens).toBe(120)
  expect(usage.outputTokens).toBe(30)
  expect(usage.totalTokens).toBe(150)
  expect(usage.estimatedTokens).toBe(false)
})

test('falls back to deterministic character-based token estimates', () => {
  const usage = extractWorkspaceAgentModelUsage({
    payload: {},
    prompt: 'x'.repeat(17),
    completion: 'y'.repeat(5),
    provider: 'test-provider',
    model: 'test-model'
  })

  expect(usage.inputTokens).toBe(5)
  expect(usage.outputTokens).toBe(2)
  expect(usage.totalTokens).toBe(7)
  expect(usage.estimatedTokens).toBe(true)
})
