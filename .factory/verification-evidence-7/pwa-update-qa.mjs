import { chromium } from 'playwright'
import { cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'

const evidenceDir = new URL('.', import.meta.url).pathname
const tempRoot = await mkdtemp(join(tmpdir(), 'archive-audit-pwa-'))
await cp(new URL('../../dist', import.meta.url), tempRoot, { recursive: true })

const types = {
  '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.xml': 'application/xml',
}
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname
    const route = pathname === '/' || pathname === '/demo' ? '/index.html' : pathname.endsWith('/') ? `${pathname}index.html` : pathname
    const file = join(tempRoot, route.replace(/^\/+/, ''))
    const info = await stat(file)
    if (!info.isFile()) throw new Error('not a file')
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': route === '/sw.js' || route === '/index.html' ? 'no-cache' : 'public, max-age=60',
    })
    response.end(await readFile(file))
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.end('Not found')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
const origin = `http://127.0.0.1:${address.port}`
const errors = []
let browser

try {
  browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(String(error)))

  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
  })
  await page.locator('#mail-files').setInputFiles({
    name: 'update-preserved.eml',
    mimeType: 'message/rfc822',
    buffer: Buffer.from('From: QA <qa@example.test>\r\nSubject: Update preserved receipt\r\nDate: Sat, 29 Aug 2026 12:00:00 +0000\r\n\r\nprivate source body'),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await page.getByText('Update preserved receipt', { exact: true }).waitFor()
  const beforeCaches = await page.evaluate(async () => await caches.keys())

  const workerPath = join(tempRoot, 'sw.js')
  const worker = await readFile(workerPath, 'utf8')
  if (!worker.includes("const CACHE = 'archive-audit-v4'")) throw new Error('candidate worker cache version was not v4')
  await writeFile(workerPath, worker.replace("const CACHE = 'archive-audit-v4'", "const CACHE = 'archive-audit-v5'"))

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration.update()
  })
  const toast = page.getByText('An offline update is ready.')
  await toast.waitFor({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Refresh now' }).click()
  await page.getByText('Update preserved receipt', { exact: true }).waitFor({ timeout: 15_000 })
  const afterCaches = await page.evaluate(async () => await caches.keys())
  const stored = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('archive-audit', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return await new Promise((resolve, reject) => {
      const request = database.transaction('reports').objectStore('reports').get('latest')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  })
  const result = {
    beforeCaches,
    updateToastShown: true,
    afterCaches,
    reportRestored: stored.messages.some(message => message.subject === 'Update preserved receipt'),
    oldCacheRemoved: !afterCaches.includes('archive-audit-v4'),
    newCacheActive: afterCaches.includes('archive-audit-v5'),
    consoleOrPageErrors: errors,
  }
  if (!result.reportRestored || !result.oldCacheRemoved || !result.newCacheActive || errors.length) {
    throw new Error(`PWA update failed: ${JSON.stringify(result)}`)
  }
  await writeFile(`${evidenceDir}/pwa-update-results.json`, JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
  await context.close()
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
  await rm(tempRoot, { recursive: true })
}
