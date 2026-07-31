import type { AppConfigType } from '@/types/app-config'

const DEFAULT_APP_CONFIG: AppConfigType = {
  common: {
    docUrl: '',
  },
  auth: {
    appTokenJwtKey: '',
    aiProxyBackendKey: '',
    accountServerTokenJwtKey: '',
  },
  backend: {
    aiproxy: '',
    aiproxyInternal: '',
    accountServer: '',
  },
  adminNameSpace: [],
  currencySymbol: 'shellCoin',
}

function getAdminNamespaces(env: NodeJS.ProcessEnv): string[] {
  return env.ADMIN_NAMESPACES?.split(',')
    .map((namespace) => namespace.trim())
    .filter(Boolean) || []
}

export function buildAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfigType {
  const appConfig: AppConfigType = {
    common: {
      ...DEFAULT_APP_CONFIG.common,
    },
    auth: {
      ...DEFAULT_APP_CONFIG.auth,
    },
    backend: {
      ...DEFAULT_APP_CONFIG.backend,
    },
    adminNameSpace: [...DEFAULT_APP_CONFIG.adminNameSpace],
    currencySymbol: DEFAULT_APP_CONFIG.currencySymbol,
  }

  if (env.APP_TOKEN_JWT_KEY) {
    appConfig.auth.appTokenJwtKey = env.APP_TOKEN_JWT_KEY
  }
  if (env.AI_PROXY_BACKEND_KEY) {
    appConfig.auth.aiProxyBackendKey = env.AI_PROXY_BACKEND_KEY
  }
  if (env.AI_PROXY_BACKEND) {
    appConfig.backend.aiproxy = env.AI_PROXY_BACKEND
  }
  if (env.AI_PROXY_BACKEND_INTERNAL) {
    appConfig.backend.aiproxyInternal = env.AI_PROXY_BACKEND_INTERNAL
  }
  if (env.ADMIN_NAMESPACES) {
    appConfig.adminNameSpace = getAdminNamespaces(env)
  }
  if (env.CURRENCY_SYMBOL) {
    appConfig.currencySymbol = env.CURRENCY_SYMBOL as 'shellCoin' | 'cny' | 'usd'
  }
  if (env.ACCOUNT_SERVER) {
    appConfig.backend.accountServer = env.ACCOUNT_SERVER
  }
  if (env.ACCOUNT_SERVER_TOKEN_JWT_KEY) {
    appConfig.auth.accountServerTokenJwtKey = env.ACCOUNT_SERVER_TOKEN_JWT_KEY
  }
  if (env.DOC_URL) {
    appConfig.common.docUrl = env.DOC_URL
  }

  return appConfig
}

export function getRuntimeAppConfig(): AppConfigType {
  if (!global.AppConfig) {
    global.AppConfig = buildAppConfig()
  }

  return global.AppConfig
}
