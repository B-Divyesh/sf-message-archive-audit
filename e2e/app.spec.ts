import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const validEml = (subject = 'Saved message', body = 'private body marker') => `From: Sender <sender@example.test>\nSubject: ${subject}\nDate: Fri, 05 Jan 2024 08:00:00 +0000\n\n${body}`

async function waitForDemo(page: Page) {
  await page.goto('/?demo=1')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
}

const referencedEml = (subject: string, name: string) => `From: Archive <archive@example.test>\nSubject: ${subject}\nDate: Tue, 02 Jan 2024 10:00:00 +0000\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain\n\nBody\n--x\nContent-Type: application/pdf; name="${name}"\nContent-Disposition: attachment; filename="${name}"\n\n\n--x--`

async function setFolderFiles(page: Page, files: Array<{ name: string, path: string, body: string }>) {
  await page.locator('#attachment-files').evaluate((input, nextFiles) => {
    const transfer = new DataTransfer()
    for (const next of nextFiles) {
      const file = new File([next.body], next.name, { type: 'application/octet-stream' })
      Object.defineProperty(file, 'webkitRelativePath', { value: next.path })
      transfer.items.add(file)
    }
    input.files = transfer.files
  }, files)
}

test('@claim:mime-audit audits EML and MBOX plus base64 and 7-bit attachments', async ({ page }) => {
  await waitForDemo(page)
  await expect(page.locator('.metrics')).toContainText('4messages')
  await expect(page.locator('.metrics')).toContainText('2attachments named')
  await expect(page.locator('.metrics')).toContainText('2attachments hashed')
  await expect(page.getByText('meter-reading.txt')).toBeVisible()
  await expect(page.getByText('Account closure confirmed')).toBeVisible()
  await expect(page.getByText('Forwarding address saved')).toBeVisible()

  const zeroByteAttachment = `From: QA <qa@example.test>\nSubject: Zero byte attachment\nDate: Thu, 01 Aug 2026 12:00:00 +0000\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=z\n\n--z\nContent-Type: application/octet-stream; name="empty.bin"\nContent-Disposition: attachment; filename="empty.bin"\nContent-Transfer-Encoding: base64\n\n--z--`
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({
    name: 'zero-byte.eml', mimeType: 'message/rfc822', buffer: Buffer.from(zeroByteAttachment),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.locator('.metrics > div').filter({ hasText: 'attachments named' }).locator('b')).toHaveText('1')
  await expect(page.locator('.metrics > div').filter({ hasText: 'attachments hashed' }).locator('b')).toHaveText('1')
  const zeroByteRow = page.locator('tbody tr').filter({ hasText: 'empty.bin' })
  await expect(zeroByteRow).toContainText('0 bytes')
  await expect(zeroByteRow).toContainText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')

  const nestedAttachment = `From: QA <qa@example.test>\r\nSubject: Nested evidence\r\nDate: Thu, 01 Aug 2026 12:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="outer"\r\n\r\n--outer\r\nContent-Type: multipart/related; boundary="inner"\r\n\r\n--inner\r\nContent-Type: text/plain\r\n\r\nSee attached evidence.\r\n--inner\r\nContent-Type: application/pdf; name="evidence.pdf"\r\nContent-Disposition: attachment; filename="evidence.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\ncHJvb2Y=\r\n--inner--\r\n--outer--\r\n`
  await page.locator('#mail-files').setInputFiles({
    name: 'nested.eml', mimeType: 'message/rfc822', buffer: Buffer.from(nestedAttachment),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.locator('.metrics > div').filter({ hasText: 'attachments named' }).locator('b')).toHaveText('1')
  await expect(page.locator('.metrics > div').filter({ hasText: 'attachments hashed' }).locator('b')).toHaveText('1')
  const nestedRow = page.locator('tbody tr').filter({ hasText: 'evidence.pdf' })
  await expect(nestedRow).toContainText('5 bytes')
  await expect(nestedRow).toContainText('c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7')

  const standardsFixture = `From: =?UTF-8?Q?Jos=C3=A9_Archive?= <jose@example.test>\r\nSubject: =?UTF-8?Q?Caf=C3=A9_receipt?=\r\nDate: Tue, 02 Jan 2024 10:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=x\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nBody\r\n--x\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment;\r\n filename*0*=UTF-8''quarterly%20;\r\n filename*1*=report.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\ncHJvb2Y=\r\n--x--\r\n`
  await page.locator('#mail-files').setInputFiles({
    name: 'standards.eml', mimeType: 'message/rfc822', buffer: Buffer.from(standardsFixture),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  const standardsRow = page.locator('tbody tr').filter({ hasText: 'quarterly report.pdf' })
  await expect(standardsRow).toContainText('5 bytes')
  await expect(standardsRow).toContainText('c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7')
  await expect(standardsRow).toContainText('Café receipt')
  await expect(standardsRow).toContainText('José Archive')
})

test('@claim:local-only keeps the complete demo flow on-origin and out of real storage', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({
    name: 'real-before-demo.eml', mimeType: 'message/rfc822', buffer: Buffer.from(validEml('Real report before demo')),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.getByText('Real report before demo', { exact: true })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('archive-audit-theme', 'dark'))
  const realStorageBeforeDemo = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])))
  const realReportBeforeDemo = await page.evaluate(async () => {
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

  await page.goto('/?demo=1')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Use dark color theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])))).toEqual(realStorageBeforeDemo)
  const realReportDuringDemo = await page.evaluate(async () => {
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
  expect(realReportDuringDemo).toBe(realReportBeforeDemo)

  await page.getByRole('link', { name: 'Start for real' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByText('Real report before demo', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])))).toEqual(realStorageBeforeDemo)
  const realReportAfterDemo = await page.evaluate(async () => {
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
  expect(realReportAfterDemo).toBe(realReportBeforeDemo)
  expect(requests.length).toBeGreaterThan(0)
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true)
})

test('@claim:offline-reload reloads the working demo with the network disabled', async ({ browser }) => {
  const offlineContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' })
  const offlinePage = await offlineContext.newPage()
  try {
    await waitForDemo(offlinePage)
    await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready })
    await offlinePage.reload()
    await expect.poll(() => offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
    await offlineContext.setOffline(true)
    await offlinePage.reload()
    await expect(offlinePage).toHaveTitle('Demo — Archive Audit')
    await expect(offlinePage.getByText('Archive inventory complete')).toBeVisible()
    await expect(offlinePage.getByText('4', { exact: true }).first()).toBeVisible()
  } finally {
    await offlineContext.close()
  }
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

  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({
    name: 'folder-inventory.eml', mimeType: 'message/rfc822', buffer: Buffer.from(validEml('Folder inventory')),
  })
  await page.locator('#attachment-files').evaluate((input: HTMLInputElement) => {
    const transfer = new DataTransfer()
    const orphan = new File(['photo'], 'orphan-photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(orphan, 'webkitRelativePath', { value: 'attachments/photos/orphan-photo.jpg' })
    transfer.items.add(orphan)
    input.files = transfer.files
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  for (const [button, format] of [['Save HTML receipt', 'html'], ['Export CSV', 'csv'], ['Export JSON', 'json']] as const) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: button }).click()])
    const content = await readFile(await download.path(), 'utf8')
    expect(content, format).toContain('attachments/photos/orphan-photo.jpg')
    expect(content, format).toContain(format === 'json' ? '"status": "unmatched"' : 'Not referenced by a message attachment')
  }
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
  await expect(page.getByText('local audit summary saved on this device')).toBeVisible()
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

test('@claim:demo-no-setup opens the completed sample in the viewport from a clean home page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('#mail-files')).toHaveCount(1)
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await expect(page).toHaveURL(/\/?\?demo=1$/)
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  await expect.poll(() => page.locator('#results').evaluate(element => {
    const box = element.getBoundingClientRect()
    return box.top < window.innerHeight && box.bottom > 0
  })).toBe(true)
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
  expect(databases).not.toContain('archive-audit')
})

test('@claim:missing-attachment-detection identifies a named file missing from the selected folder and receipt', async ({ page }) => {
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({
    name: 'missing-folder-file.eml', mimeType: 'message/rfc822', buffer: Buffer.from(referencedEml('Missing attachment', 'contract.pdf')),
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.locator('.metrics > div').filter({ hasText: 'references missing' }).locator('b')).toHaveText('1')
  await expect(page.locator('tbody tr').filter({ hasText: 'contract.pdf' })).toContainText('Missing from folder')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()])
  expect(await readFile(await download.path(), 'utf8')).toContain('"missing"')
})

test('@claim:folder-inventory shows matched, ambiguous, and unreferenced selected folder paths', async ({ page }) => {
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles([
    { name: 'matched.eml', mimeType: 'message/rfc822', buffer: Buffer.from(referencedEml('Matched item', 'match.pdf')) },
    { name: 'one.eml', mimeType: 'message/rfc822', buffer: Buffer.from(referencedEml('First duplicate', 'duplicate.pdf')) },
    { name: 'two.eml', mimeType: 'message/rfc822', buffer: Buffer.from(referencedEml('Second duplicate', 'duplicate.pdf')) },
  ])
  await setFolderFiles(page, [
    { name: 'match.pdf', path: 'selected/match.pdf', body: 'matched file' },
    { name: 'duplicate.pdf', path: 'selected/duplicate.pdf', body: 'duplicate file' },
    { name: 'orphan.txt', path: 'selected/notes/orphan.txt', body: 'unreferenced file' },
  ])
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  const folderLedger = page.getByRole('region', { name: 'Scrollable selected folder inventory' })
  await expect(folderLedger).toContainText('selected/match.pdf')
  await expect(folderLedger).toContainText('Matched to one message attachment')
  await expect(folderLedger).toContainText('selected/duplicate.pdf')
  await expect(folderLedger).toContainText('Duplicate name; match is not unique')
  await expect(folderLedger).toContainText('selected/notes/orphan.txt')
  await expect(folderLedger).toContainText('Not referenced by a message attachment')
})

test('@claim:no-telemetry makes only expected same-origin static GET requests', async ({ page }) => {
  const requests: Array<{ url: string, method: string }> = []
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }))
  await page.goto('/')
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  await page.getByRole('button', { name: 'Export JSON' }).click()
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({ name: 'private.eml', mimeType: 'message/rfc822', buffer: Buffer.from(validEml()) })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await page.getByRole('button', { name: 'Export CSV' }).click()
  expect(requests.length).toBeGreaterThan(0)
  for (const request of requests) {
    const url = new URL(request.url)
    expect(request.method).toBe('GET')
    expect(url.origin).toBe('http://127.0.0.1:4173')
    expect(url.pathname === '/' || /^(\/(assets|src|@vite|node_modules|icons)\/|\/(hero-notebook\.webp|sw\.js|manifest\.webmanifest|favicon\.ico)$)/.test(url.pathname)).toBe(true)
  }
})

test('@claim:demo-reset restores the shipped sample after a changed demo audit', async ({ page }) => {
  await waitForDemo(page)
  await page.locator('#mail-files').setInputFiles({ name: 'changed-demo.eml', mimeType: 'message/rfc822', buffer: Buffer.from(validEml('Changed demo')) })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.getByText('Changed demo', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  await expect(page.getByText('Changed demo', { exact: true })).toHaveCount(0)
  await expect(page.locator('.metrics > div').filter({ hasText: 'messages' }).locator('b')).toHaveText('4')
})

test('@claim:clear-report retains a report on cancel and deletes it after confirmation', async ({ page }) => {
  const source = validEml('Saved report')
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles({ name: 'saved-report.eml', mimeType: 'message/rfc822', buffer: Buffer.from(source) })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.getByText('Saved report', { exact: true })).toBeVisible()
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: 'Clear local report' }).click()
  await expect(page.getByText('Saved report', { exact: true })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Clear local report' }).click()
  await expect(page.getByLabel('Audit results').getByText('Local audit summary cleared.')).toBeVisible()
  expect(source).toBe(validEml('Saved report'))
  await page.reload()
  await expect(page.getByText('Saved report', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Local audit summary cleared.')).toHaveCount(0)
})

test('@claim:scope-limits rejects encrypted-style input and receipts list selected files only', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/')
  const encrypted = `From: Locked <locked@example.test>\nSubject: Locked mail\nMIME-Version: 1.0\nContent-Type: application/pkcs7-mime; smime-type=enveloped-data\n\nnot-decryptable`
  await page.locator('#mail-files').setInputFiles({ name: 'locked.eml', mimeType: 'message/rfc822', buffer: Buffer.from(encrypted) })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be audited')
  await page.locator('#mail-files').setInputFiles({ name: 'selected-only.eml', mimeType: 'message/rfc822', buffer: Buffer.from(validEml('Selected only')) })
  await page.getByRole('button', { name: 'Audit selected files' }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()])
  const receipt = JSON.parse(await readFile(await download.path(), 'utf8'))
  expect(receipt.sources).toEqual(['selected-only.eml'])
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true)
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
  await expect(page.getByText(expectedHash).first()).toBeVisible()

  const csvDownload = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()])
  const csv = await readFile(await csvDownload[0].path(), 'utf8')
  expect(csv).toContain(expectedHash)
  expect(csv).toContain('"\'=2+2"')
  expect(csv).toContain('"\'=cmd|qa <qa@example.test>"')

  const htmlDownload = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save HTML receipt' }).click()])
  expect(await readFile(await htmlDownload[0].path(), 'utf8')).toContain(expectedHash)
})

test('does not reuse a same-name folder file and inventories every selected folder file', async ({ page }) => {
  const referenced = (subject: string) => `From: Archive <archive@example.test>\nSubject: ${subject}\nDate: Tue, 02 Jan 2024 10:00:00 +0000\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain\n\nBody\n--x\nContent-Type: application/pdf; name="invoice.pdf"\nContent-Disposition: attachment; filename="invoice.pdf"\n\n\n--x--`
  const plain = validEml('Folder inventory')
  await page.goto('/')
  await page.locator('#mail-files').setInputFiles([
    { name: 'first.eml', mimeType: 'message/rfc822', buffer: Buffer.from(referenced('First invoice')) },
    { name: 'second.eml', mimeType: 'message/rfc822', buffer: Buffer.from(referenced('Second invoice')) },
    { name: 'plain.eml', mimeType: 'message/rfc822', buffer: Buffer.from(plain) },
  ])
  await page.locator('#attachment-files').evaluate((input: HTMLInputElement) => {
    const transfer = new DataTransfer()
    const invoice = new File(['only one'], 'invoice.pdf', { type: 'application/pdf' })
    const orphan = new File(['photo'], 'orphan-photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(invoice, 'webkitRelativePath', { value: 'attachments/invoice.pdf' })
    Object.defineProperty(orphan, 'webkitRelativePath', { value: 'attachments/photos/orphan-photo.jpg' })
    transfer.items.add(invoice)
    transfer.items.add(orphan)
    input.files = transfer.files
  })
  await page.getByRole('button', { name: 'Audit selected files' }).click()

  await expect(page.getByRole('heading', { name: 'Check attachment inventory' })).toBeVisible()
  const invoiceRows = page.locator('details.ledger').first().locator('tbody tr').filter({ hasText: 'invoice.pdf' })
  await expect(invoiceRows).toHaveCount(2)
  await expect(invoiceRows.filter({ hasText: 'Duplicate name; match is not unique' })).toHaveCount(1)
  await expect(invoiceRows.filter({ hasText: 'Missing from folder' })).toHaveCount(1)
  await expect(page.getByText('attachments/photos/orphan-photo.jpg', { exact: true })).toBeVisible()
  await expect(page.getByText('Not referenced by a message attachment', { exact: true })).toBeVisible()
  await expect(page.locator('.metrics > div').filter({ hasText: 'attachments hashed' }).locator('b')).toHaveText('2')

  const downloads: Record<string, string> = {}
  for (const [button, key] of [['Save HTML receipt', 'html'], ['Export CSV', 'csv'], ['Export JSON', 'json']] as const) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: button }).click()])
    downloads[key] = await readFile(await download.path(), 'utf8')
  }
  for (const format of ['html', 'csv']) {
    expect(downloads[format]).toContain('attachments/photos/orphan-photo.jpg')
    expect(downloads[format]).toContain('Not referenced by a message attachment')
    expect(downloads[format]).toContain('Duplicate name; match is not unique')
  }
  const json = JSON.parse(downloads.json)
  expect(json.folderFiles).toEqual(expect.arrayContaining([
    expect.objectContaining({ path: 'attachments/invoice.pdf', status: 'ambiguous' }),
    expect.objectContaining({ path: 'attachments/photos/orphan-photo.jpg', status: 'unmatched' }),
  ]))
  const attachmentStatuses = json.messages.flatMap((message: { attachments: Array<{ status: string }> }) => message.attachments.map(attachment => attachment.status))
  expect(attachmentStatuses).toEqual(expect.arrayContaining(['ambiguous', 'missing']))
})

test('public routes have no Axe accessibility violations and the ledger is keyboard scrollable', async ({ page }) => {
  await waitForDemo(page)
  for (const route of ['/?demo=1', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route)
    if (route === '/?demo=1') await expect(page.getByText('Archive inventory complete')).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations, route).toEqual([])
  }
  await page.goto('/?demo=1')
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
    if (viewport.width === 390) {
      await expect(page.locator('header').getByRole('link', { name: 'Privacy' })).toBeVisible()
    }
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
  await page.locator('a[href="/?demo=1"]').first().focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/?\?demo=1$/)

  for (const route of ['/privacy/', '/terms/', '/404.html']) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
  }

  await page.goto('/privacy/')
  await expect(page.getByText('Use “Clear local report” to remove a saved summary.')).toBeVisible()

  await page.goto('/404.html')
  const returnHome = page.getByRole('link', { name: 'Return to Archive Audit' })
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    const target = await returnHome.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    })
    expect(target.width).toBeGreaterThanOrEqual(44)
    expect(target.height).toBeGreaterThanOrEqual(44)
  }
})

test('every public route has its own complete metadata and the deployment config preserves 404s', async ({ page }) => {
  const routes = [
    ['/', 'Archive Audit — check an email export', 'Archive Audit — check an email export', 'https://message-archive-audit.sociobot.in/'],
    ['/?demo=1', 'Demo — Archive Audit', 'Demo — Archive Audit', 'https://message-archive-audit.sociobot.in/demo'],
    ['/privacy/', 'Privacy — Archive Audit', 'Privacy — Archive Audit', 'https://message-archive-audit.sociobot.in/privacy/'],
    ['/terms/', 'Terms — Archive Audit', 'Terms — Archive Audit', 'https://message-archive-audit.sociobot.in/terms/'],
    ['/404.html', 'Page not found — Archive Audit', 'Page not found — Archive Audit', 'https://message-archive-audit.sociobot.in/404'],
  ]
  for (const [route, title, socialTitle, canonical] of routes) {
    await page.goto(route)
    await expect(page).toHaveTitle(title)
    for (const selector of ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[name="twitter:card"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'meta[name="twitter:image"]', 'meta[name="theme-color"]', 'link[rel="icon"]', 'link[rel="apple-touch-icon"]']) {
      await expect(page.locator(selector), `${route} missing ${selector}`).toHaveCount(1)
    }
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', socialTitle)
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', socialTitle)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
  }
  const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8'))
  expect(config.navigationFallback).toBeUndefined()
  expect(config.routes).toContainEqual({ route: '/demo', rewrite: '/index.html' })
  expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' })
})

test('route changes focus the destination heading and announce it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Privacy' }).first().click()
  await expect(page).toHaveURL(/\/privacy\/$/)
  await expect(page.locator('h1')).toBeFocused()
  await expect(page.locator('[data-route-announcer]')).toHaveText('Privacy — Archive Audit')
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('h1')).toBeFocused()
  await expect(page.locator('#route-announce')).toHaveText('Archive Audit home')
})
