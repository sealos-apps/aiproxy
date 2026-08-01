import { NextResponse } from 'next/server'

import { getRuntimeAppConfig } from '@/utils/backend/app-config'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  try {
    const config = getRuntimeAppConfig()

    return NextResponse.json({
      code: 200,
      message: 'Success',
      data: {
        aiproxyBackend: config.backend.aiproxy,
        currencySymbol: config.currencySymbol,
        docUrl: config.common.docUrl,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Config API error:', errorMessage)

    return NextResponse.json(
      {
        code: 500,
        message: 'Failed to load configuration',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
