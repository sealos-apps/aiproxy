import { GET } from '@/app/healthz/route'
import { GET as liveGET } from '@/app/livez/route'

const healthEnvKeys = [
  'APP_TOKEN_JWT_KEY',
  'AI_PROXY_BACKEND_KEY',
  'AI_PROXY_BACKEND',
  'AI_PROXY_BACKEND_INTERNAL',
  'ADMIN_NAMESPACES',
  'CURRENCY_SYMBOL',
  'ACCOUNT_SERVER',
  'ACCOUNT_SERVER_TOKEN_JWT_KEY',
] as const

const originalEnv = new Map<string, string | undefined>(
  healthEnvKeys.map((key) => [key, process.env[key]])
)

function restoreEnv() {
  for (const key of healthEnvKeys) {
    const value = originalEnv.get(key)
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function setHealthyEnv() {
  process.env.APP_TOKEN_JWT_KEY = 'app-token-key'
  process.env.AI_PROXY_BACKEND_KEY = 'backend-key'
  process.env.AI_PROXY_BACKEND = 'https://aiproxy.example.com'
  process.env.AI_PROXY_BACKEND_INTERNAL = 'http://aiproxy.aiproxy-system.svc:3000'
  process.env.ADMIN_NAMESPACES = 'ns-admin'
  process.env.CURRENCY_SYMBOL = 'cny'
  process.env.ACCOUNT_SERVER = 'http://account-service.account-system.svc:2333'
  process.env.ACCOUNT_SERVER_TOKEN_JWT_KEY = 'account-token-key'
}

describe('healthz route', () => {
  beforeEach(() => {
    restoreEnv()
    setHealthyEnv()
    global.AppConfig = undefined
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    restoreEnv()
    global.AppConfig = undefined
  })

  it('returns ok when runtime config and backend smoke pass', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toMatchObject({
      service: 'aiproxy',
      status: 'ok',
      checks: expect.arrayContaining([
        expect.objectContaining({ name: 'config.appTokenJwtKey', status: 'ok' }),
        expect.objectContaining({ name: 'config.aiProxyBackendKey', status: 'ok' }),
        expect.objectContaining({ name: 'config.backendUrl', status: 'ok' }),
        expect.objectContaining({ name: 'config.adminNamespaces', status: 'ok' }),
        expect.objectContaining({ name: 'backend.modelsDefault', status: 'ok' }),
      ]),
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://aiproxy.aiproxy-system.svc:3000/api/models/default',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'backend-key',
        }),
        cache: 'no-store',
      })
    )
  })

  it('keeps the process liveness endpoint independent from backend availability', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await liveGET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      service: 'aiproxy',
      status: 'ok',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns unavailable and skips backend smoke when required config is missing', async () => {
    delete process.env.AI_PROXY_BACKEND_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      service: 'aiproxy',
      status: 'error',
      checks: expect.arrayContaining([
        expect.objectContaining({
          name: 'config.aiProxyBackendKey',
          status: 'error',
          message: 'AI_PROXY_BACKEND_KEY is required',
        }),
        expect.objectContaining({
          name: 'backend.modelsDefault',
          status: 'skipped',
        }),
      ]),
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns unavailable and skips backend smoke when account config is invalid', async () => {
    process.env.ADMIN_NAMESPACES = ' , '
    process.env.ACCOUNT_SERVER = 'not-a-url'
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      service: 'aiproxy',
      status: 'error',
      checks: expect.arrayContaining([
        expect.objectContaining({
          name: 'config.adminNamespaces',
          status: 'error',
          message: 'ADMIN_NAMESPACES is required',
        }),
        expect.objectContaining({
          name: 'config.accountServer',
          status: 'error',
          message: 'ACCOUNT_SERVER must be a valid URL when CURRENCY_SYMBOL is not usd',
        }),
        expect.objectContaining({
          name: 'backend.modelsDefault',
          status: 'skipped',
        }),
      ]),
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns unavailable when backend smoke fails without leaking secrets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, message: 'backend unavailable' }), {
          status: 200,
        })
      )
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      service: 'aiproxy',
      status: 'error',
      checks: expect.arrayContaining([
        expect.objectContaining({
          name: 'backend.modelsDefault',
          status: 'error',
          message: 'backend unavailable',
        }),
      ]),
    })
    expect(JSON.stringify(body)).not.toContain('backend-key')
    expect(JSON.stringify(body)).not.toContain('app-token-key')
    expect(JSON.stringify(body)).not.toContain('account-token-key')
  })

  it('returns unavailable when backend smoke returns an invalid contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
        })
      )
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      service: 'aiproxy',
      status: 'error',
      checks: expect.arrayContaining([
        expect.objectContaining({
          name: 'backend.modelsDefault',
          status: 'error',
          message: 'backend returned invalid health response',
        }),
      ]),
    })
  })
})
