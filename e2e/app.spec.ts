import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const validEml = (subject = 'Saved message', body = 'private body marker') => `From: Sender <sender@example.test>\nSubject: ${subject}\nDate: Fri, 05 Jan 2024 08:00:00 +0000\n\n${body}`

async function waitForDemo(page: Page) {
  await page.goto('/demo')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
}

test('@claim:mime-audit audits EML and MBOX plus base64 and 7-bit attachments', async ({ page }) => {
  await waitForDemo(page)
  await expect(page.locator('.metrics')).toContainText('4messages')
  await expect(page.locator('.metrics')).toContainText('2attachments named')
  await expect(page.locator('.metrics')).toContainText('2attachments hashed')
  await expect(page.getByText('meter-reading.txt')).toBeVisible()
  await expect(page.getByText('Account closure confirmed')).toBeVisible()
  await expect(page.getByText('Forwarding address saved')).toBeVisible()
})

test('@claim:local-only keeps the complete demo flow on-origin and out of real storage', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await waitForDemo(page)
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
  expect(databases).not.toContain('archive-audit')
  expect(requests.length).toBeGreaterThan(0)
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true)
})

test('@claim:offline-reload reloads the working demo with the network disabled', async ({ page, context }) => {
  await waitForDemo(page)
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page).toHaveTitle('Demo — Archive Audit')
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  await expect(page.getByText('4', { exact: true }).first()).toBeVisible()
})

test('@claim:receipt-exports exports complete HTML, CSV, and JSON receipts', async ({ page }) => {
  await waitForDemo(page)
  const htmlDownload = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save HTML receipt' }).click(),
  ])
  const html = await readFile(await htmlDownload[0].path(), 'utf8')
  expect(html).toContain('Account closure confirmed')
  expect(html).toContain('No attachment')
  expect(html).toContain('meter-reading.txt')

  const csvDownload = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ])
  const csv = await readFile(await csvDownload[0].path(), 'utf8')
  expect(csv.split('\n')).toHaveLength(5)
  expect(csv).toContain('"no attachment"')

  const jsonDownload = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click(),
  ])
  const json = JSON.parse(await readFile(await jsonDownload[0].path(), 'utf8'))
  expect(json.messages).toHaveLength(4)
  expect(json.messages.some((message: { attachments: unknown[] }) => message.attachments.length === 0)).toBe(true)
})

test('@claim:report-persistence restores a real report without storing source bodies', async ({ page }) => {
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({
    name: 'saved.eml', mimeType: 'message/rfc822', buffer: Buffer.from(validEml()),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.getByText('Saved message', { exact: true })).toBeVisible()
  const stored = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('archive-audit', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return await new Promise<string>((resolve, reject) => {
      const request = database.transaction('reports').objectStore('reports').get('latest')
      request.onsuccess = () => resolve(JSON.stringify(request.result))
      request.onerror = () => reject(request.error)
    })
  })
  expect(stored).not.toContain('private body marker')
  await page.reload()
  await expect(page.getByText('Saved message', { exact: true })).toBeVisible()
  await expect(page.getByText('report saved on this device')).toBeVisible()
})

test('@claim:free-use exposes the audit and every receipt without an account or purchase', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Free. No account.')).toBeVisible()
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await expect(page.getByRole('button', { name: 'Save HTML receipt' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled()
  await expect(page.getByText(/purchase|upgrade/i)).toHaveCount(0)
})

test('rejects empty and nonsense EML instead of producing an audit stamp', async ({ page }) => {
  await page.goto('/')
  for (const [name, content] of [['empty.eml', ''], ['nonsense.eml', 'this is not an email']]) {
    await page.locator('#mail-files').setInputFiles({ name, mimeType: 'message/rfc822', buffer: Buffer.from(content) })
    await page.getByRole('button', { name: 'Audit selected files' }).click()
    await expect(page.getByRole('alert')).toContainText('could not be audited')
    await expect(page.getByText('INVENTORIED')).toHaveCount(0)
  }
})

test('exports a supplied-folder hash and neutralizes spreadsheet formulas', async ({ page }) => {
  const raw = `From: =cmd|qa <qa@example.test>\nSubject: =2+2\nDate: Fri, 05 Jan 2024 08:00:00 +0000\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain\n\nBody\n--x\nContent-Type: application/pdf; name="record.pdf"\nContent-Disposition: attachment; filename="record.pdf"\n\n\n--x--`
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({ name: 'formula.eml', mimeType: 'message/rfc822', buffer: Buffer.from(raw) })
  await page.locator('#attachment-files').evaluate((input: HTMLInputElement) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File(['folder bytes'], 'record.pdf', { type: 'application/pdf' }))
    input.files = transfer.files
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.getByText('Found separately and hashed')).toBeVisible()
  const expectedHash = createHash('sha256').update('folder bytes').digest('hex')
  await expect(page.getByText(expectedHash)).toBeVisible()

  const csvDownload = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()])
  const csv = await readFile(await csvDownload[0].path(), 'utf8')
  expect(csv).toContain(expectedHash)
  expect(csv).toContain('"\'=2+2"')
  expect(csv).toContain('"\'=cmd|qa <qa@example.test>"')

  const htmlDownload = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save HTML receipt' }).click()])
  expect(await readFile(await htmlDownload[0].path(), 'utf8')).toContain(expectedHash)
})

test('demo sample has no serious accessibility violations and the ledger is keyboard scrollable', async ({ page }) => {
  await waitForDemo(page)
  for (const route of ['/demo', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route)
    if (route === '/demo') await expect(page.getByText('Archive inventory complete')).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact || '')), route).toEqual([])
  }
  await page.goto('/demo')
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  const ledger = page.locator('.table-wrap')
  await ledger.focus()
  await expect(ledger).toBeFocused()
  await page.keyboard.press('ArrowRight')
})

test('desktop and 390px mobile have no overflow, undersized controls, or console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const smallTargets = await page.locator('a:visible, button:visible, input:visible, summary:visible, [tabindex="0"]:visible').evaluateAll(elements => elements.flatMap(element => {
      const rect = element.getBoundingClientRect()
      return rect.width < 44 || rect.height < 44 ? [`${element.tagName}:${(element.textContent || (element as HTMLInputElement).type).trim()}:${rect.width}x${rect.height}`] : []
    }))
    expect(smallTargets).toEqual([])
  }
  expect(consoleErrors).toEqual([])
})

test('keyboard entry, skip link, legal shells, and designed 404 remain operable', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await page.locator('a[href="/demo"]').first().focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/demo$/)

  for (const route of ['/privacy/', '/terms/', '/404.html']) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  }
})
