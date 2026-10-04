import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Bindings that wrangler does not copy from the top level into an environment.
const BINDING_KEYS = ['d1_databases', 'kv_namespaces', 'r2_buckets', 'ratelimits', 'services', 'queues', 'hyperdrive']

type Binding = { binding?: string; name?: string }
type Config = Record<string, unknown> & { env: { preview: Record<string, unknown> } }

// Most bindings are lists; `queues` is an object ({ producers, consumers }), compared whole.
const bindingNames = (section: Record<string, unknown>, key: string) => {
  const value = section[key] ?? []
  return Array.isArray(value) ? (value as Binding[]).map((b) => b.binding ?? b.name).sort() : JSON.stringify(value)
}

describe('wrangler.jsonc', () => {
  const text = readFileSync('wrangler.jsonc', 'utf8')

  it('is plain JSON, because deploy.mjs and the CI preview guard parse it without comments', () => {
    expect(() => JSON.parse(text), 'Move comments out of wrangler.jsonc (e.g. next to the code that uses the binding)').not.toThrow()
  })

  it('gives PR previews every binding the live Worker has', () => {
    const config = JSON.parse(text) as Config
    for (const key of BINDING_KEYS) {
      expect(bindingNames(config.env.preview, key), `env.preview.${key}`).toEqual(bindingNames(config, key))
    }
  })
})
