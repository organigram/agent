import type { Context, Message } from './types';
export declare const WORKSPACE_AGENT_OUTPUT_SCHEMA: {
    type: string;
    properties: {
        message: {
            type: string;
        };
        citations: {
            type: string;
            items: {
                type: string;
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                    };
                    id: {
                        type: string;
                    };
                    label: {
                        type: string;
                    };
                };
                required: string[];
            };
        };
        preview: {
            type: string;
            properties: {
                type: {
                    type: string;
                    enum: string[];
                };
                organigramId: {
                    type: string;
                };
                persistence: {
                    type: string;
                    enum: string[];
                };
                summary: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                organigram: {
                    type: string;
                };
            };
            required: string[];
        };
    };
    required: string[];
};
export declare const NEW_ORGANIGRAM_GENERATION_INSTRUCTIONS = "New organigram generation rules:\n- You are an expert in organizational governance.\n- Analyze bylaws, internal regulations, HR brochures, governance charters, or free-form organization descriptions and prepare a minimal organizational chart compatible with the Organigram Protocol.\n- The chart uses Assets, Organs, Entries, and Procedures.\n- When creating a new-organigram preview, fill preview.organigram with a complete OrganigramJson.\n- Answer in the language of the user's input when writing human-readable names, descriptions, summaries, and messages.\n- If a piece of information is uncertain, make a reasonable assumption.\n- typeName must be one of: \"vote\" or \"nomination\".\n- data must be a JSON string. For typeName=\"vote\", use by default: {\"quorumSize\":\"20001\",\"voteDuration\":\"3600\",\"majoritySize\":\"50001\"}.\n- Use stable textual salts, for example \"board-of-directors-salt\" or \"executive-team-salt\".\n- Do not invent blockchain addresses.\n- For procedures, deciders/proposers/moderators must reference organ salts.\n- For organs, permissions must describe which procedures can act on that organ.\n- Each organ permission entry must use \"procedureSalt\" and \"permissionKeys\".\n- Prefer explicit atomic permission keys over ADMIN or ALL. For example: to elect or appoint members of an organ -> [\"ADD_ENTRIES\",\"REMOVE_ENTRIES\"]. To amend bylaws / constitution / charter -> [\"ADD_PERMISSIONS\",\"REMOVE_PERMISSIONS\",\"ADD_ENTRIES\",\"REMOVE_ENTRIES\",\"UPDATE_METADATA\"]. To manage treasury -> [\"ADD_ENTRIES\",\"REMOVE_ENTRIES\",\"DEPOSIT_ETHER\",\"WITHDRAW_ETHER\",\"DEPOSIT_COINS\",\"WITHDRAW_COINS\",\"DEPOSIT_COLLECTIBLES\",\"WITHDRAW_COLLECTIBLES\"].\n- If the user names people or members for a team, include them as entries on the relevant organ with the personal name in entry.name and no invented address.\n\nNew organigram target shape inside preview.organigram:\n{\n  \"name\": \"string\",\n  \"description\": \"string\",\n  \"organs\": [\n    {\n      \"name\": \"string\",\n      \"description\": \"string\",\n      \"salt\": \"string\",\n      \"entries\": [\n        { \"name\": \"string\", \"index\": \"string\", \"address\": \"\", \"cid\": \"\" }\n      ],\n      \"permissions\": [\n        {\n          \"procedureSalt\": \"procedure-salt\",\n          \"permissionKeys\": [\"ADD_ENTRIES\", \"REMOVE_ENTRIES\"]\n        }\n      ]\n    }\n  ],\n  \"procedures\": [\n    {\n      \"name\": \"string\",\n      \"description\": \"string\",\n      \"typeName\": \"vote|nomination\",\n      \"deciders\": \"organ-salt\",\n      \"proposers\": \"organ-salt\",\n      \"moderators\": \"organ-salt\",\n      \"withModeration\": false,\n      \"data\": \"{...json-string...}\",\n      \"salt\": \"string\"\n    }\n  ],\n  \"assets\": [\n    {\n      \"name\": \"string\",\n      \"description\": \"string\",\n      \"symbol\": \"string\",\n      \"salt\": \"string\"\n    }\n  ]\n}";
export declare const buildPrompt: ({ messages, context }: {
    messages: Message[];
    context: Context;
}) => string;
