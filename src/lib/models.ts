export const MODELS = [
  { id: 'claude-opus-4-7',            label: 'Opus 4.7'   },
  { id: 'claude-sonnet-4-6',          label: 'Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001',  label: 'Haiku 4.5'  },
] as const

export type ModelId = typeof MODELS[number]['id']

export const DEFAULT_MODEL: ModelId = 'claude-sonnet-4-6'
