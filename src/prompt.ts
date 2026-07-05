import { buildSnapshot } from './snapshot'
import type { Context, Message } from './types'

export const WORKSPACE_AGENT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    citations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'workspace',
              'organigram',
              'organ',
              'procedure',
              'asset',
              'notification',
              'file'
            ]
          },
          id: { type: 'string' },
          label: { type: 'string' }
        },
        required: ['type', 'id', 'label']
      }
    },
    preview: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['organigram', 'new-organigram'] },
        organigramId: { type: 'string' },
        persistence: { type: 'string', enum: ['merge-additive', 'create'] },
        summary: {
          type: 'array',
          items: { type: 'string' }
        },
        organigram: { type: 'object' }
      },
      required: ['type', 'persistence', 'summary', 'organigram']
    }
  },
  required: ['message', 'citations']
}

const stringifyForPrompt = (value: unknown): string =>
  JSON.stringify(value, null, 2)

export const NEW_ORGANIGRAM_GENERATION_INSTRUCTIONS = `New organigram generation rules:
- You are an expert in organizational governance.
- Analyze bylaws, internal regulations, HR brochures, governance charters, or free-form organization descriptions and prepare a minimal organizational chart compatible with the Organigram Protocol.
- The chart uses Assets, Organs, Entries, and Procedures.
- When creating a new-organigram preview, fill preview.organigram with a complete OrganigramJson.
- Answer in the language of the user's input when writing human-readable names, descriptions, summaries, and messages.
- If a piece of information is uncertain, make a reasonable assumption.
- typeName must be one of: "vote" or "nomination".
- data must be a JSON string. For typeName="vote", use by default: {"quorumSize":"20001","voteDuration":"3600","majoritySize":"50001"}.
- Use stable textual salts, for example "board-of-directors-salt" or "executive-team-salt".
- Do not invent blockchain addresses.
- For procedures, deciders/proposers/moderators must reference organ salts.
- For organs, permissions must describe which procedures can act on that organ.
- Each organ permission entry must use "procedureSalt" and "permissionKeys".
- Prefer explicit atomic permission keys over ADMIN or ALL. For example: to elect or appoint members of an organ -> ["ADD_ENTRIES","REMOVE_ENTRIES"]. To amend bylaws / constitution / charter -> ["ADD_PERMISSIONS","REMOVE_PERMISSIONS","ADD_ENTRIES","REMOVE_ENTRIES","UPDATE_METADATA"]. To manage treasury -> ["ADD_ENTRIES","REMOVE_ENTRIES","DEPOSIT_ETHER","WITHDRAW_ETHER","DEPOSIT_COINS","WITHDRAW_COINS","DEPOSIT_COLLECTIBLES","WITHDRAW_COLLECTIBLES"].
- If the user names people or members for a team, include them as entries on the relevant organ with the personal name in entry.name and no invented address.

New organigram target shape inside preview.organigram:
{
  "name": "string",
  "description": "string",
  "organs": [
    {
      "name": "string",
      "description": "string",
      "salt": "string",
      "entries": [
        { "name": "string", "index": "string", "address": "", "cid": "" }
      ],
      "permissions": [
        {
          "procedureSalt": "procedure-salt",
          "permissionKeys": ["ADD_ENTRIES", "REMOVE_ENTRIES"]
        }
      ]
    }
  ],
  "procedures": [
    {
      "name": "string",
      "description": "string",
      "typeName": "vote|nomination",
      "deciders": "organ-salt",
      "proposers": "organ-salt",
      "moderators": "organ-salt",
      "withModeration": false,
      "data": "{...json-string...}",
      "salt": "string"
    }
  ],
  "assets": [
    {
      "name": "string",
      "description": "string",
      "symbol": "string",
      "salt": "string"
    }
  ]
}`

export const buildPrompt = ({
  messages,
  context
}: {
  messages: Message[]
  context: Context
}): string => `You are the Organigram workspace agent.

You help users understand and prepare changes to an organization workspace.
Use only the workspace snapshot below. Do not claim to have read private file contents.

Rules:
- Return only strict JSON.
- Always include "message" and "citations".
- Cite relevant workspace objects by type, id, and label.
- If the user asks to create a new organization/org chart/organigram from scratch, include a new-organigram preview:
  {"type":"new-organigram","persistence":"create","summary":["..."],"organigram":{...}}
- A new-organigram preview must contain a complete valid OrganigramJson.
- If the user asks to change an existing organigram, you may include an additive preview:
  {"type":"organigram","organigramId":"...","persistence":"merge-additive","summary":["..."],"organigram":{...}}
- The additive preview organigram should contain only the new organs, procedures, assets, or entries to merge into the current organigram.
- To add entries to an existing organ, include that organ unchanged except for an additive entries list containing all existing entries plus the new entries.
- Do not include a preview for deployed organigrams. Explain that deployed changes must go through governance procedures.
- Do not create proposals, transactions, signatures, or on-chain actions.

${NEW_ORGANIGRAM_GENERATION_INSTRUCTIONS}

Workspace snapshot:
${stringifyForPrompt(buildSnapshot(context))}

Conversation:
${stringifyForPrompt(messages)}

Output schema:
${stringifyForPrompt(WORKSPACE_AGENT_OUTPUT_SCHEMA)}`
