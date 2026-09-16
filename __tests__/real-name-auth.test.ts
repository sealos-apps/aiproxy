import jwt from 'jsonwebtoken'

import { buildAppConfig } from '@/utils/backend/app-config'
import { checkSealosUserIsRealName, kcOrAppTokenAuth } from '@/utils/backend/auth'

describe('real-name verification policy', () => {
  afterEach(() => {
    global.AppConfig = undefined
    vi.unstubAllGlobals()
  })

  it.each([undefined, '', 'true', '0', 'invalid'])('preserves verification for %s', (value) => {
    expect(buildAppConfig({ NODE_ENV: 'test', REAL_NAME_AUTH_ENABLED: value }).auth.realNameAuthEnabled).toBe(true)
  })

  it.each(['false', ' FALSE '])('skips Account with CNY and configured credentials for %s', async (value) => {
    global.AppConfig = buildAppConfig({
      NODE_ENV: 'test',
      REAL_NAME_AUTH_ENABLED: value,
      CURRENCY_SYMBOL: 'cny',
      ACCOUNT_SERVER: 'https://account.example.com',
      ACCOUNT_SERVER_TOKEN_JWT_KEY: 'test-account-key',
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await checkSealosUserIsRealName(new Headers())).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    // Disabling this check does not disable the preceding request authentication.
    await expect(kcOrAppTokenAuth(new Headers())).rejects.toBe('Auth: Token is missing')
  })

  it.each([true, false])('uses Account result %s when enabled', async (isRealName) => {
    global.AppConfig = buildAppConfig({
      NODE_ENV: 'test',
      APP_TOKEN_JWT_KEY: 'test-app-key',
      ACCOUNT_SERVER: 'https://account.example.com',
      ACCOUNT_SERVER_TOKEN_JWT_KEY: 'test-account-key',
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { isRealName },
    })))
    vi.stubGlobal('fetch', fetchMock)
    const token = jwt.sign({ userUid: 'test-user' }, 'test-app-key')

    expect(await checkSealosUserIsRealName(new Headers({ authorization: token }))).toBe(isRealName)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://account.example.com/account/v1alpha1/real-name-info',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
