import type { D1Database } from '@cloudflare/workers-types'
import type { H3Event } from 'h3'

export interface Env {
  DB: D1Database
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  SENDCLOUD_PUBLIC_KEY?: string
  SENDCLOUD_SECRET_KEY?: string
  RESEND_API_KEY?: string
}

/** Logs the real cause server-side and gives callers nothing to learn from. */
export function serverError(detail: string): never {
  console.error(`[config] ${detail}`)
  throw createError({ statusCode: 500, statusMessage: 'Server error' })
}

export function useEnv(event: H3Event): Env {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  if (!env?.DB) serverError('D1 binding DB is missing')
  return env
}
