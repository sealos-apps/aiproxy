export type AppConfigType = {
  common: {
    docUrl: string
  }
  auth: {
    realNameAuthEnabled: boolean
    appTokenJwtKey: string
    aiProxyBackendKey: string
    accountServerTokenJwtKey: string
  }
  backend: {
    aiproxy: string
    aiproxyInternal: string
    accountServer: string
  }
  adminNameSpace: string[]
  currencySymbol: 'shellCoin' | 'cny' | 'usd'
}
