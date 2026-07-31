import { NextResponse } from 'next/server'

import type { AppConfigType } from '@/types/app-config'
import { getRuntimeAppConfig } from '@/utils/backend/app-config'

export const dynamic = 'force-dynamic'

type HealthStatus = 'ok' | 'error' | 'skipped'

type HealthCheck = {
  name: string
  status: HealthStatus
  message?: string
}

type BackendResponse = {
  success?: boolean
  message?: string
}

const BACKEND_HEALTH_PATH = '/api/models/default'
const BACKEND_HEALTH_TIMEOUT_MS = 3000

function ok(name: string): HealthCheck {
  return {
    name,
    status: 'ok',
  }
}

function error(name: string, message: string): HealthCheck {
  return {
    name,
    status: 'error',
    message,
  }
}

function skipped(name: string, message: string): HealthCheck {
  return {
    name,
    status: 'skipped',
    message,
  }
}

function getBackendBaseUrl(config: AppConfigType): string {
  return config.backend.aiproxyInternal || config.backend.aiproxy
}

function validateUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function hasValue(value: string): boolean {
  return value.trim().length > 0
}

function validateConfig(config: AppConfigType): HealthCheck[] {
  const checks: HealthCheck[] = []
  const backendBaseUrl = getBackendBaseUrl(config)

  if (hasValue(config.auth.appTokenJwtKey)) {
    checks.push(ok('config.appTokenJwtKey'))
  } else {
    checks.push(error('config.appTokenJwtKey', 'APP_TOKEN_JWT_KEY is required'))
  }

  if (hasValue(config.auth.aiProxyBackendKey)) {
    checks.push(ok('config.aiProxyBackendKey'))
  } else {
    checks.push(error('config.aiProxyBackendKey', 'AI_PROXY_BACKEND_KEY is required'))
  }

  if (hasValue(backendBaseUrl) && validateUrl(backendBaseUrl)) {
    checks.push(ok('config.backendUrl'))
  } else {
    checks.push(
      error(
        'config.backendUrl',
        'AI_PROXY_BACKEND_INTERNAL or AI_PROXY_BACKEND must be a valid URL'
      )
    )
  }

  if (config.adminNameSpace.length > 0) {
    checks.push(ok('config.adminNamespaces'))
  } else {
    checks.push(error('config.adminNamespaces', 'ADMIN_NAMESPACES is required'))
  }

  if (['shellCoin', 'cny', 'usd'].includes(config.currencySymbol)) {
    checks.push(ok('config.currencySymbol'))
  } else {
    checks.push(
      error('config.currencySymbol', 'CURRENCY_SYMBOL must be one of shellCoin, cny, or usd')
    )
  }

  if (config.currencySymbol !== 'usd') {
    if (hasValue(config.backend.accountServer) && validateUrl(config.backend.accountServer)) {
      checks.push(ok('config.accountServer'))
    } else {
      checks.push(
        error(
          'config.accountServer',
          'ACCOUNT_SERVER must be a valid URL when CURRENCY_SYMBOL is not usd'
        )
      )
    }

    if (hasValue(config.auth.accountServerTokenJwtKey)) {
      checks.push(ok('config.accountServerTokenJwtKey'))
    } else {
      checks.push(
        error(
          'config.accountServerTokenJwtKey',
          'ACCOUNT_SERVER_TOKEN_JWT_KEY is required when CURRENCY_SYMBOL is not usd'
        )
      )
    }
  }

  return checks
}

function getErrorMessage(reason: unknown): string {
  if (reason instanceof Error) {
    if (reason.name === 'AbortError') {
      return `backend health request timed out after ${BACKEND_HEALTH_TIMEOUT_MS}ms`
    }
    return reason.message
  }

  return 'backend health request failed'
}

async function readBackendResponse(response: Response): Promise<BackendResponse | undefined> {
  try {
    return (await response.json()) as BackendResponse
  } catch {
    return undefined
  }
}

async function checkBackend(config: AppConfigType): Promise<HealthCheck> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BACKEND_HEALTH_TIMEOUT_MS)

  try {
    const url = new URL(BACKEND_HEALTH_PATH, getBackendBaseUrl(config))
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.auth.aiProxyBackendKey,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      return error('backend.modelsDefault', `backend returned HTTP ${response.status}`)
    }

    const result = await readBackendResponse(response)
    if (result?.success !== true) {
      return error(
        'backend.modelsDefault',
        result?.message || 'backend returned invalid health response'
      )
    }

    return ok('backend.modelsDefault')
  } catch (reason) {
    return error('backend.modelsDefault', getErrorMessage(reason))
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(): Promise<NextResponse> {
  const config = getRuntimeAppConfig()
  const checks = validateConfig(config)

  if (checks.some((check) => check.status === 'error')) {
    checks.push(skipped('backend.modelsDefault', 'skipped because configuration is invalid'))
  } else {
    checks.push(await checkBackend(config))
  }

  const status = checks.every((check) => check.status === 'ok') ? 'ok' : 'error'

  return NextResponse.json(
    {
      service: 'aiproxy',
      status,
      checks,
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
