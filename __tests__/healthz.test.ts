import { GET } from '@/app/api/healthz/route'
import { GET as rootGET } from '@/app/healthz/route'

describe('healthz route', () => {
  it('returns the stable health contract', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      service: 'aiproxy',
      status: 'ok',
    })
  })

  it('serves the same contract from the root health endpoint', async () => {
    const response = await rootGET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      service: 'aiproxy',
      status: 'ok',
    })
  })
})
