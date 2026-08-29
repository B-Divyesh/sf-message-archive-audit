import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const baseURL = 'https://message-archive-audit.sociobot.in'
const evidenceDir = new URL('.', import.meta.url).pathname
await mkdir(evidenceDir, { recursive: true })

const observations = {}
const check = (condition, message) => {
  if (!condition) throw new Error(message)
}
const sha256 = value => createHash('sha256').update(value).digest('hex')
const refEml = (subject, name, from = 'Archive QA <qa@example.test>') => `From: ${from}\r\nSubject: ${subject}\r\nDate: Sat, 29 Aug 2026 12:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="audit"\r\n\r\n--audit\r\nContent-Type: text/plain\r\n\r\nArchive note.\r\n--audit\r\nContent-Type: application/octet-stream; name="${name}"\r\nContent-Disposition: attachment; filename="${name}"\r\n\r\n\r\n--audit--\r\n`
const plainEml = (subject, body = 'private body marker') => `From: Archive QA <qa@example.test>\r\nSubject: ${subject}\r\nDate: Sat, 29 Aug 2026 12:00:00 +0000\r\n\r\n${body}`

const browser = await chromium.launch()
const requestLog = []
const responseLog = []
const consoleErrors = []
const expected404Console = []
const pageErrors = []
const desktopAxe = []
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } })
context.on('request', request => requestLog.push({ url: request.url(), method: request.method(), type: request.resourceType() }))
context.on('response', async response => {
  const url = response.url()
  if (!url.startsWith(baseURL)) return
  const headers = await response.allHeaders()
  responseLog.push({ url, status: response.status(), cacheControl: headers['cache-control'] || null, contentSecurityPolicy: headers['content-security-policy'] || null, referrerPolicy: headers['referrer-policy'] || null, strictTransportSecurity: headers['strict-transport-security'] || null, xContentTypeOptions: headers['x-content-type-options'] || null })
})
const page = await context.newPage()
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', error => pageErrors.push(String(error)))

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${evidenceDir}/live-cold-desktop.png`, fullPage: true })
observations.firstRead = {
  h1: await page.locator('h1').innerText(),
  audience: await page.locator('.lede').innerText(),
  primaryAction: await page.getByRole('link', { name: 'Try it with sample data' }).innerText(),
  actionOutcome: await page.locator('.action-note').innerText(),
  facts: await page.locator('.plain-facts li').allInnerTexts(),
}
check(observations.firstRead.h1 === 'Check an email export before access ends', 'cold headline did not state the job')
check(observations.firstRead.audience.includes('people leaving an account or device'), 'cold screen did not name its user')
check(observations.firstRead.primaryAction === 'Try it with sample data', 'cold screen lacked the required demo action')
desktopAxe.push({ route: '/', seriousOrCritical: (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact || '')).map(item => item.id) })

await page.getByRole('link', { name: 'Try it with sample data' }).click()
await page.getByText('Archive inventory complete').waitFor()
await page.screenshot({ path: `${evidenceDir}/live-demo-desktop.png`, fullPage: true })
observations.demo = {
  url: page.url(),
  banner: await page.getByText('Demo — sample data, nothing is saved').innerText(),
  metrics: await page.locator('.metrics').innerText(),
  resultsInViewport: await page.locator('#results').evaluate(element => {
    const rect = element.getBoundingClientRect()
    return rect.top < innerHeight && rect.bottom > 0
  }),
  databases: await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name)),
}
check(observations.demo.resultsInViewport, 'one-click demo did not show results in the first viewport')
check(!observations.demo.databases.includes('archive-audit'), 'demo created the real report database')
desktopAxe.push({ route: '/?demo=1', seriousOrCritical: (await new AxeBuilder({ page }).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact || '')).map(item => item.id) })
await page.getByRole('button', { name: 'Reset demo' }).click()
await page.getByText('Archive inventory complete').waitFor()
check((await page.locator('.metrics').innerText()).includes('4\nmessages'), 'demo reset did not recreate the sample')

await page.goto(baseURL)
await page.locator('#mail-files').setInputFiles({ name: 'empty.eml', mimeType: 'message/rfc822', buffer: Buffer.from('') })
await page.getByRole('button', { name: 'Audit selected files' }).click()
const emptyError = await page.getByRole('alert').innerText()
check(emptyError.includes('empty'), 'empty EML error was not actionable')
await page.locator('#mail-files').setInputFiles({ name: 'nonsense.eml', mimeType: 'message/rfc822', buffer: Buffer.from('not an email') })
await page.getByRole('button', { name: 'Audit selected files' }).click()
const nonsenseError = await page.getByRole('alert').innerText()
check(nonsenseError.includes('complete email header block'), 'nonsense EML error did not explain the malformed input')
await page.locator('#mail-files').setInputFiles({ name: 'recovered.eml', mimeType: 'message/rfc822', buffer: Buffer.from(plainEml('Recovered audit')) })
await page.getByRole('button', { name: 'Audit selected files' }).click()
await page.getByText('Recovered audit', { exact: true }).waitFor()
observations.invalidRecovery = { emptyError, nonsenseError, recovered: true }

const twentyMail = Array.from({ length: 20 }, (_, index) => ({
  name: `message-${String(index + 1).padStart(2, '0')}.eml`,
  mimeType: 'message/rfc822',
  buffer: Buffer.from(refEml(`Controlled export ${index + 1}`, `attachment-${String(index + 1).padStart(2, '0')}.dat`)),
}))
await page.locator('#mail-files').setInputFiles(twentyMail)
await page.locator('#attachment-files').evaluate((input, names) => {
  const transfer = new DataTransfer()
  for (const name of names) {
    const file = new File([`bytes:${name}`], name, { type: 'application/octet-stream' })
    Object.defineProperty(file, 'webkitRelativePath', { value: `archive/files/${name}` })
    transfer.items.add(file)
  }
  input.files = transfer.files
}, Array.from({ length: 10 }, (_, index) => `attachment-${String(index * 2 + 1).padStart(2, '0')}.dat`))
await page.getByRole('button', { name: 'Audit selected files' }).click()
await page.getByRole('heading', { name: 'Check attachment inventory' }).waitFor()
const [twentyDownload] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export JSON' }).click(),
])
const twentyReport = JSON.parse(await readFile(await twentyDownload.path(), 'utf8'))
const [twentyHtmlDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save HTML receipt' }).click()])
const twentyHtml = await readFile(await twentyHtmlDownload.path(), 'utf8')
const [twentyCsvDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()])
const twentyCsv = await readFile(await twentyCsvDownload.path(), 'utf8')
const twentyStatuses = twentyReport.messages.flatMap(message => message.attachments.map(attachment => attachment.status))
observations.twentyExports = {
  messageCount: twentyReport.messages.length,
  folderFileCount: twentyReport.folderFiles.length,
  found: twentyStatuses.filter(status => status === 'found').length,
  missing: twentyStatuses.filter(status => status === 'missing').length,
  ambiguous: twentyStatuses.filter(status => status === 'ambiguous').length,
  uniqueFolderHashes: new Set(twentyReport.folderFiles.map(file => file.hash)).size,
  htmlHasFirstAndLastMessage: twentyHtml.includes('Controlled export 1') && twentyHtml.includes('Controlled export 20'),
  htmlHasFolderInventory: twentyHtml.includes('archive/files/attachment-19.dat'),
  csvRowsIncludingHeader: twentyCsv.split('\n').length,
  csvHasMissingAndFound: twentyCsv.includes('"missing"') && twentyCsv.includes('"found"'),
}
check(observations.twentyExports.messageCount === 20, '20-export fixture lost messages')
check(observations.twentyExports.found === 10 && observations.twentyExports.missing === 10 && observations.twentyExports.ambiguous === 0, '20-export match precision was incorrect')
check(observations.twentyExports.htmlHasFirstAndLastMessage && observations.twentyExports.htmlHasFolderInventory && observations.twentyExports.csvRowsIncludingHeader === 31 && observations.twentyExports.csvHasMissingAndFound, 'portable 20-export receipts were incomplete')

const repairedEml = `From: =?UTF-8?Q?Jos=C3=A9_Archive?= <jose@example.test>\r\nSubject: =?UTF-8?Q?Caf=C3=A9_receipt?=\r\nDate: Sat, 29 Aug 2026 12:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="x"\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nBody\r\n--x\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment;\r\n filename*0*=UTF-8''quarterly%20;\r\n filename*1*=report.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\ncHJvb2Y=\r\n--x--\r\n`
await page.locator('#mail-files').setInputFiles({ name: 'rfc2231.eml', mimeType: 'message/rfc822', buffer: Buffer.from(repairedEml) })
await page.locator('#attachment-files').evaluate(input => { input.value = '' })
await page.getByRole('button', { name: 'Audit selected files' }).click()
await page.getByText('Café receipt', { exact: true }).waitFor()
const repairText = await page.locator('#results').innerText()
observations.rfcAndUtf8 = {
  subjectPresent: repairText.includes('Café receipt'),
  senderPresent: repairText.includes('José Archive'),
  attachmentPresent: repairText.includes('quarterly report.pdf'),
  hashPresent: repairText.includes(sha256('proof')),
}
check(Object.values(observations.rfcAndUtf8).every(Boolean), 'RFC 2231 or UTF-8 Q repair failed live')
await page.screenshot({ path: `${evidenceDir}/live-rfc2231-utf8.png`, fullPage: true })

const duplicateFiles = [
  { name: 'first.eml', mimeType: 'message/rfc822', buffer: Buffer.from(refEml('First invoice', 'invoice.pdf')) },
  { name: 'second.eml', mimeType: 'message/rfc822', buffer: Buffer.from(refEml('Second invoice', 'invoice.pdf')) },
  { name: 'plain.eml', mimeType: 'message/rfc822', buffer: Buffer.from(plainEml('Folder inventory', 'folder inventory marker')) },
]
await page.locator('#mail-files').setInputFiles(duplicateFiles)
await page.locator('#attachment-files').evaluate(input => {
  const transfer = new DataTransfer()
  const invoice = new File(['only one physical invoice'], 'invoice.pdf', { type: 'application/pdf' })
  const orphan = new File(['orphan photo'], 'orphan-photo.jpg', { type: 'image/jpeg' })
  Object.defineProperty(invoice, 'webkitRelativePath', { value: 'attachments/invoice.pdf' })
  Object.defineProperty(orphan, 'webkitRelativePath', { value: 'attachments/photos/orphan-photo.jpg' })
  transfer.items.add(invoice)
  transfer.items.add(orphan)
  input.files = transfer.files
})
await page.getByRole('button', { name: 'Audit selected files' }).click()
await page.getByRole('heading', { name: 'Check attachment inventory' }).waitFor()
const [duplicateDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()])
const duplicateReport = JSON.parse(await readFile(await duplicateDownload.path(), 'utf8'))
const [duplicateHtmlDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save HTML receipt' }).click()])
const duplicateHtml = await readFile(await duplicateHtmlDownload.path(), 'utf8')
const [duplicateCsvDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()])
const duplicateCsv = await readFile(await duplicateCsvDownload.path(), 'utf8')
const duplicateStatuses = duplicateReport.messages.flatMap(message => message.attachments.map(attachment => attachment.status))
observations.duplicateAndOrphan = {
  referenceStatuses: duplicateStatuses,
  folderFiles: duplicateReport.folderFiles.map(file => ({ path: file.path, status: file.status, hash: file.hash })),
  issueText: duplicateReport.issues,
  htmlRetainsOrphanAndAmbiguity: duplicateHtml.includes('attachments/photos/orphan-photo.jpg') && duplicateHtml.includes('Duplicate name; match is not unique'),
  csvRetainsOrphanAndAmbiguity: duplicateCsv.includes('attachments/photos/orphan-photo.jpg') && duplicateCsv.includes('Duplicate name; match is not unique'),
}
check(duplicateStatuses.filter(status => status === 'ambiguous').length === 1 && duplicateStatuses.filter(status => status === 'missing').length === 1, 'one folder file was reused for duplicate references')
check(duplicateReport.folderFiles.some(file => file.path === 'attachments/photos/orphan-photo.jpg' && file.status === 'unmatched'), 'orphan folder file disappeared')
check(observations.duplicateAndOrphan.htmlRetainsOrphanAndAmbiguity && observations.duplicateAndOrphan.csvRetainsOrphanAndAmbiguity, 'HTML or CSV lost folder inventory findings')
await page.screenshot({ path: `${evidenceDir}/live-duplicate-orphan.png`, fullPage: true })

const zeroEml = `From: QA <qa@example.test>\r\nSubject: Empty attachment bytes\r\nDate: Sat, 29 Aug 2026 12:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=z\r\n\r\n--z\r\nContent-Type: text/plain\r\n\r\nBody\r\n--z\r\nContent-Type: application/octet-stream; name="empty.bin"\r\nContent-Disposition: attachment; filename="empty.bin"\r\nContent-Transfer-Encoding: base64\r\n\r\n\r\n--z--\r\n`
await page.locator('#mail-files').setInputFiles({ name: 'zero.eml', mimeType: 'message/rfc822', buffer: Buffer.from(zeroEml) })
await page.locator('#attachment-files').evaluate(input => { input.value = '' })
await page.getByRole('button', { name: 'Audit selected files' }).click()
await page.getByText('Empty attachment bytes', { exact: true }).waitFor()
const zeroText = await page.locator('#results').innerText()
observations.zeroByte = { sizeShown: zeroText.includes('0 bytes'), emptyHashShown: zeroText.includes(sha256('')) }
check(observations.zeroByte.sizeShown && observations.zeroByte.emptyHashShown, 'zero-byte attachment boundary failed')

await page.locator('#mail-files').setInputFiles({ name: 'stored.eml', mimeType: 'message/rfc822', buffer: Buffer.from(plainEml('Persistent receipt', 'highly private body marker')) })
await page.getByRole('button', { name: 'Audit selected files' }).click()
await page.getByText('Persistent receipt', { exact: true }).waitFor()
const stored = await page.evaluate(async () => {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('archive-audit', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return await new Promise((resolve, reject) => {
    const request = database.transaction('reports').objectStore('reports').get('latest')
    request.onsuccess = () => resolve(JSON.stringify(request.result))
    request.onerror = () => reject(request.error)
  })
})
check(!stored.includes('highly private body marker'), 'source body bytes were stored in IndexedDB')
await page.reload()
await page.getByText('Persistent receipt', { exact: true }).waitFor()
page.once('dialog', dialog => dialog.dismiss())
await page.getByRole('button', { name: 'Clear local report' }).click()
check(await page.getByText('Persistent receipt', { exact: true }).isVisible(), 'canceling clear removed the report')
page.once('dialog', dialog => dialog.accept())
await page.getByRole('button', { name: 'Clear local report' }).click()
await page.locator('#results').getByText('Local audit summary cleared.').waitFor()
await page.reload()
observations.persistence = {
  storedBytes: Buffer.byteLength(stored),
  containsBody: stored.includes('highly private body marker'),
  survivedReload: true,
  cancelPreserved: true,
  clearRemoved: (await page.getByText('Persistent receipt', { exact: true }).count()) === 0,
}
check(observations.persistence.clearRemoved, 'confirmed clear survived reload')

await page.goto(baseURL)
await page.keyboard.press('Tab')
const skipFocused = await page.getByRole('link', { name: 'Skip to main content' }).evaluate(element => element === document.activeElement)
await page.keyboard.press('Enter')
const mainFocused = await page.locator('main').evaluate(element => element === document.activeElement)
await page.getByRole('link', { name: 'Try it with sample data' }).focus()
const focusStyle = await page.getByRole('link', { name: 'Try it with sample data' }).evaluate(element => {
  const style = getComputedStyle(element)
  return { outline: style.outline, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, outlineColor: style.outlineColor }
})
observations.keyboard = { skipFocused, mainFocused, focusStyle }
check(skipFocused && mainFocused && parseFloat(focusStyle.outlineWidth) >= 2 && focusStyle.outlineStyle !== 'none', 'keyboard focus behavior failed')

await context.close()

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
})
const mobilePage = await mobileContext.newPage()
mobilePage.on('console', message => {
  if (message.type() !== 'error') return
  if (mobilePage.url().endsWith('/not-a-real-route') && /status of 404/.test(message.text())) expected404Console.push(message.text())
  else consoleErrors.push(message.text())
})
mobilePage.on('pageerror', error => pageErrors.push(String(error)))
const axeResults = []
await mobilePage.goto(baseURL, { waitUntil: 'networkidle' })
await mobilePage.screenshot({ path: `${evidenceDir}/live-cold-mobile.png`, fullPage: true })
const mobileFirstAction = await mobilePage.getByRole('link', { name: 'Try it with sample data' }).evaluate(element => {
  const rect = element.getBoundingClientRect()
  return { top: rect.top, bottom: rect.bottom, visibleInFirstViewport: rect.top >= 0 && rect.bottom <= innerHeight }
})
check(mobileFirstAction.visibleInFirstViewport, 'mobile demo action was not in the first viewport')
for (const route of ['/?demo=1', '/privacy/', '/terms/', '/not-a-real-route']) {
  const response = await mobilePage.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' })
  if (route.includes('demo')) await mobilePage.getByText('Archive inventory complete').waitFor()
  const axe = await new AxeBuilder({ page: mobilePage }).analyze()
  axeResults.push({ route, status: response?.status(), seriousOrCritical: axe.violations.filter(item => ['serious', 'critical'].includes(item.impact || '')).map(item => item.id) })
}
await mobilePage.goto(`${baseURL}/?demo=1`)
await mobilePage.getByText('Archive inventory complete').waitFor()
await mobilePage.screenshot({ path: `${evidenceDir}/live-demo-mobile.png`, fullPage: true })
const mobileLayout = await mobilePage.evaluate(() => ({
  viewport: { width: innerWidth, height: innerHeight },
  documentWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > innerWidth,
  smallTargets: [...document.querySelectorAll('a,button,input,summary,[tabindex="0"]')].flatMap(element => {
    const rect = element.getBoundingClientRect()
    if (!rect.width || !rect.height) return []
    return rect.width < 44 || rect.height < 44 ? [`${element.tagName}:${(element.textContent || element.type || '').trim()}:${rect.width}x${rect.height}`] : []
  }),
  maxAnimationMs: Math.max(0, ...[...document.querySelectorAll('*')].flatMap(element => {
    const style = getComputedStyle(element)
    return style.animationDuration.split(',').map(value => parseFloat(value) * (value.includes('ms') ? 1 : 1000))
  })),
}))
observations.accessibility = { desktopAxe, axeResults, mobileFirstAction, mobileLayout }
check(desktopAxe.every(item => item.seriousOrCritical.length === 0), 'desktop axe found a serious or critical violation')
check(axeResults.every(item => item.seriousOrCritical.length === 0), 'axe found a serious or critical violation')
check(!mobileLayout.overflow && mobileLayout.smallTargets.length === 0, '390px layout overflowed or exposed an undersized target')
check(mobileLayout.maxAnimationMs <= 1, 'reduced motion retained a material animation')
await mobileContext.close()

const offlineContext = await browser.newContext()
const offlinePage = await offlineContext.newPage()
await offlinePage.goto(`${baseURL}/?demo=1`, { waitUntil: 'networkidle' })
await offlinePage.getByText('Archive inventory complete').waitFor()
await offlinePage.evaluate(async () => {
  await navigator.serviceWorker.ready
  if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
})
const cacheBefore = await offlinePage.evaluate(async () => await caches.keys())
await offlineContext.setOffline(true)
const offlineResponse = await offlinePage.reload({ waitUntil: 'domcontentloaded' })
await offlinePage.getByText('Archive inventory complete').waitFor()
observations.offline = {
  status: offlineResponse?.status(),
  demoRestored: true,
  controlled: await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  cacheNames: cacheBefore,
}
check(observations.offline.status === 200 && observations.offline.controlled, 'offline controlled reload failed')
await offlineContext.close()

observations.traffic = {
  count: requestLog.length,
  origins: [...new Set(requestLog.map(request => new URL(request.url).origin))],
  methods: [...new Set(requestLog.map(request => request.method))],
  requests: requestLog,
  responses: responseLog,
}
observations.errors = { consoleErrors, pageErrors, expected404Console }
check(observations.traffic.origins.length === 1 && observations.traffic.origins[0] === baseURL, 'page traffic left the product origin')
check(observations.traffic.methods.every(method => method === 'GET'), 'page sent a non-GET request')
check(consoleErrors.length === 0 && pageErrors.length === 0, 'browser logged console or page errors')

await browser.close()
await writeFile(`${evidenceDir}/live-independent-results.json`, JSON.stringify(observations, null, 2))
console.log(JSON.stringify(observations, null, 2))
