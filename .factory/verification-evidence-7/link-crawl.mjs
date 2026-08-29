import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const origin = 'https://message-archive-audit.sociobot.in'
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
const sourceRoutes = ['/', '/?demo=1', '/privacy/', '/terms/', '/not-a-real-route']
const discovered = new Map()

for (const route of sourceRoutes) {
  await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded' })
  const links = await page.locator('a[href]').evaluateAll(anchors => anchors.flatMap(anchor => {
    const raw = anchor.getAttribute('href') || ''
    return raw.startsWith('#') ? [] : [{ text: anchor.textContent.trim(), href: anchor.href }]
  }))
  for (const link of links) {
    const url = new URL(link.href)
    if (url.origin !== origin) continue
    url.hash = ''
    if (!discovered.has(url.href)) discovered.set(url.href, { texts: [], sources: [] })
    const item = discovered.get(url.href)
    if (!item.texts.includes(link.text)) item.texts.push(link.text)
    if (!item.sources.includes(route)) item.sources.push(route)
  }
}

const results = []
for (const [url, details] of discovered) {
  const response = await context.request.get(url)
  results.push({ url, status: response.status(), ...details })
}
if (results.some(result => result.status < 200 || result.status >= 400)) throw new Error(`dead link: ${JSON.stringify(results)}`)
await writeFile(new URL('link-crawl-results.json', import.meta.url), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
await context.close()
await browser.close()
