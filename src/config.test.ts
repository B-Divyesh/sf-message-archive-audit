import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('static response policy', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8'))

  it('sends framing, content, permissions, and referrer protections as headers', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(config.globalHeaders['Content-Security-Policy']).toContain("script-src 'self'")
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()')
    expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff')
    expect(config.globalHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  })

  it('uses immutable hashed-asset caching and a real 404 response override', () => {
    expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable')
    expect(config.responseOverrides['404'].rewrite).toBe('/404.html')
    expect(config.navigationFallback.exclude).toContain('/404')
  })
})
