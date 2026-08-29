import './style.css'
import './hero.css'
import { escapeHtml, receiptRows, reportCsv, reportHtml } from './exports'
import { parseMailFile, reconcile, sha256 } from './parser'
import type { ArchiveReport } from './types'

const isDemo = location.pathname.replace(/\/$/, '') === '/demo' || new URLSearchParams(location.search).get('demo') === '1'
const databaseName = 'archive-audit'
const buildId = 'polish-1'

let report: ArchiveReport | null = null
let mailInput: HTMLInputElement
let folderInput: HTMLInputElement
let results: HTMLElement
let announce: HTMLElement
let routeAnnounce: HTMLElement

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('reports')) request.result.createObjectStore('reports')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function dbGet(): Promise<ArchiveReport | null> {
  try {
    const database = await openDatabase()
    return await new Promise(resolve => {
      const request = database.transaction('reports').objectStore('reports').get('latest')
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function hasSavedDatabase() {
  try {
    return (await indexedDB.databases()).some(database => database.name === databaseName)
  } catch {
    return false
  }
}

async function dbSave(nextReport: ArchiveReport) {
  if (isDemo) return
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction('reports', 'readwrite').objectStore('reports').put(nextReport, 'latest')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function dbClear() {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction('reports', 'readwrite').objectStore('reports').delete('latest')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function header() {
  return `<header class="top">
    <a class="brand" href="/" aria-label="Archive Audit home"><span class="brand-mark" aria-hidden="true">✓</span> Archive Audit</a>
    <nav aria-label="Product links"><a href="/?demo=1">Demo</a><a href="/#how">How it works</a><a href="/privacy/">Privacy</a><button class="theme quiet" id="theme" type="button" aria-label="Use dark color theme" aria-pressed="false">◐</button></nav>
  </header>`
}

function footer() {
  return `<footer><p>Check email exports before account or device access ends.</p><nav aria-label="Footer links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Built by Param Factory</span></nav><p>Original generated artwork · Build ${buildId}</p></footer>`
}

function renderApp() {
  document.title = isDemo ? 'Demo — Archive Audit' : 'Archive Audit — check an email export'
  if (isDemo) document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', 'https://message-archive-audit.sociobot.in/demo')
  $('#app').innerHTML = `${isDemo ? `<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" class="quiet" type="button">Reset demo</button><a class="quiet" href="/">Start for real</a></div></aside>` : ''}
  ${header()}
  <main id="main" tabindex="-1">
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow">Local email archive check</p><h1 id="page-title">Check an email export before access ends</h1><p class="lede">For people leaving an account or device who need a clear record of saved messages and attachments.</p>
        <div class="hero-actions"><a class="primary" href="/?demo=1">Try it with sample data</a><a class="text-action" href="#audit-heading">Check your own export</a></div>
        <p class="action-note">The sample opens a complete audit. No setup is needed.</p>
        <ul class="plain-facts"><li>Files stay on this device.</li><li>Works offline after the first visit.</li><li>Free. No account.</li></ul>
      </div>
      <figure class="notebook-art"><img src="/hero-notebook.webp" width="640" height="640" decoding="async" fetchpriority="high" alt="A field notebook with an envelope and attachment photographs ready for checking."><figcaption>Original generated notebook study</figcaption></figure>
    </section>
    <section class="workspace" aria-labelledby="audit-heading"><div class="section-heading"><p class="eyebrow">New audit</p><h2 id="audit-heading">Choose an email export</h2></div>
      <div class="drop-grid"><label class="dropzone" for="mail-files"><strong>Email exports</strong><span>EML message files or MBOX email collections</span><input id="mail-files" type="file" accept=".mbox,.eml,message/rfc822" multiple></label><label class="dropzone optional" for="attachment-files"><strong>Attachment folder <small>optional</small></strong><span>Choose files from the exported attachment folder</span><input id="attachment-files" type="file" multiple webkitdirectory></label></div>
      <div class="actions"><button id="audit" class="primary" type="button">Audit selected files</button></div><p class="limit">Reads EML message files and MBOX email collections. It cannot read encrypted or provider-only stores.</p>
    </section>
    <section id="results" class="results" aria-live="polite" aria-label="Audit results"></section>
    <section id="how" class="how"><p class="eyebrow">How it works</p><h2>Make a receipt in three steps</h2><ol><li><strong>Choose</strong> EML message files or MBOX email collections and an optional attachment folder.</li><li><strong>Check</strong> message counts, named attachments, missing files, and file hashes (SHA-256).</li><li><strong>Save</strong> a complete HTML, CSV, or JSON receipt beside the email export.</li></ol></section>
    <section class="limits" aria-labelledby="limits-heading"><p class="eyebrow">Privacy and limits</p><h2 id="limits-heading">Your files remain under your control</h2><p>Files stay in this browser. A real audit saves a local audit summary until you clear it. Demo audit summaries stay in memory.</p><p>A downloaded receipt inventories selected files. It cannot prove that a provider included every message.</p></section>
  </main>${footer()}<div id="route-announce" class="sr-only" aria-live="polite"></div><div id="announce" class="sr-only" aria-live="polite"></div><div id="toast" class="toast" role="status" hidden></div>`

  mailInput = $('#mail-files')
  folderInput = $('#attachment-files')
  results = $('#results')
  announce = $('#announce')
  routeAnnounce = $('#route-announce')
  $('#audit').addEventListener('click', audit)
  $('#theme').addEventListener('click', toggleTheme)
  setTheme(localStorage.getItem('archive-audit-theme') === 'dark')
  if (isDemo) $('#reset-demo').addEventListener('click', loadDemo)
  focusRoute()
}

function focusRoute() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const fromThisSite = document.referrer !== '' && new URL(document.referrer).origin === location.origin
  const returnedWithHistory = navigation?.type === 'back_forward'
  if (!fromThisSite && !returnedWithHistory) {
    window.addEventListener('pageshow', event => { if (event.persisted) focusRoute() }, { once: true })
    return
  }
  const heading = $('#page-title')
  heading.tabIndex = -1
  heading.focus({ preventScroll: true })
  routeAnnounce.textContent = isDemo ? 'Demo — Archive Audit' : 'Archive Audit home'
}

async function audit() {
  const mails = [...(mailInput.files || [])].filter(file => /\.(eml|mbox)$/i.test(file.name))
  if (!mails.length) {
    feedback('Choose at least one .eml or .mbox file, then audit again.')
    return
  }
  results.innerHTML = `<div class="working"><span aria-hidden="true"></span>Reading ${plural(mails.length, 'export')} on this device…</div>`
  announce.textContent = 'Audit in progress'
  try {
    const folderFiles = await Promise.all([...(folderInput.files || [])].map(async file => ({
      name: file.name, size: file.size, hash: await sha256(await file.arrayBuffer()),
    })))
    const messageGroups = await Promise.all(mails.map(parseMailFile))
    const messages = messageGroups.flat()
    if (!messages.length) throw new Error('No valid messages were found.')
    reconcile(messages, folderFiles)
    const missing = messages.flatMap(message => message.attachments).filter(attachment => attachment.status === 'missing').length
    report = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sources: mails.map(file => file.name),
      messages,
      folderFiles,
      issues: missing ? [`${plural(missing, 'attachment reference')} could not be found in the supplied folder.`] : [],
    }
    await dbSave(report)
    renderReport()
    announce.textContent = `Audit complete. ${plural(messages.length, 'message')} found.`
  } catch (error) {
    report = null
    feedback(`This export could not be audited. ${error instanceof Error ? error.message : 'Choose an EML message file or MBOX email collection.'}`)
  }
}

function demoFiles() {
  const base64 = `From: Sam <sam@example.test>\nSubject: Train booking record\nDate: Tue, 02 Jan 2024 10:00:00 +0000\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=archive\n\n--archive\nContent-Type: text/plain\n\nKeep this with the trip record.\n--archive\nContent-Type: text/plain; name="ticket.txt"\nContent-Disposition: attachment; filename="ticket.txt"\nContent-Transfer-Encoding: base64\n\naGVsbG8gYXJjaGl2ZQ==\n--archive--`
  const sevenBit = `From: Mina <mina@example.test>\nSubject: House handover notes\nDate: Wed, 03 Jan 2024 09:30:00 +0000\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=handover\n\n--handover\nContent-Type: text/plain\n\nFinal handover.\n--handover\nContent-Type: text/plain; name="meter-reading.txt"\nContent-Disposition: attachment; filename="meter-reading.txt"\nContent-Transfer-Encoding: 7bit\n\nReading: 04217\n--handover--`
  const mbox = `From jules@example.test Thu Jan 04 12:00:00 2024\nFrom: Jules <jules@example.test>\nSubject: Account closure confirmed\nDate: Thu, 04 Jan 2024 12:00:00 +0000\n\nYour account export is ready.\nFrom noa@example.test Thu Jan 04 12:05:00 2024\nFrom: Noa <noa@example.test>\nSubject: Forwarding address saved\nDate: Thu, 04 Jan 2024 12:05:00 +0000\n\nThe forwarding address is current.`
  return [
    new File([base64], 'travel.eml', { type: 'message/rfc822' }),
    new File([sevenBit], 'handover.eml', { type: 'message/rfc822' }),
    new File([mbox], 'closure.mbox', { type: 'application/mbox' }),
  ]
}

async function loadDemo() {
  const transfer = new DataTransfer()
  demoFiles().forEach(file => transfer.items.add(file))
  mailInput.files = transfer.files
  folderInput.value = ''
  await audit()
  const revealReceipt = () => {
    results.scrollIntoView({ block: 'start', behavior: 'auto' })
    requestAnimationFrame(() => requestAnimationFrame(() => results.scrollIntoView({ block: 'start', behavior: 'auto' })))
  }
  // Browser history restores the top of a newly navigated page after early scripts run.
  // Reposition on load as well, so the completed receipt is the first demo screen.
  if (document.readyState === 'complete') revealReceipt()
  else window.addEventListener('load', revealReceipt, { once: true })
}

function statusLabel(status: string) {
  if (status === 'verified') return 'Embedded and hashed'
  if (status === 'found') return 'Found separately and hashed'
  return 'Missing from folder'
}

function renderReport() {
  if (!report) return
  const attachments = report.messages.flatMap(message => message.attachments)
  const hashed = attachments.filter(attachment => attachment.hash).length
  const missing = attachments.filter(attachment => attachment.status === 'missing').length
  const rows = receiptRows(report).map(({ message, attachment }) => `<tr><td><b>${escapeHtml(message.subject)}</b><small>${escapeHtml(message.from)} · ${escapeHtml(message.date)}</small></td><td>${attachment ? `${escapeHtml(attachment.name)}<small>${attachment.size == null ? 'No readable bytes' : `${attachment.size.toLocaleString()} bytes`}</small>` : '—'}</td><td>${attachment ? `<span class="status ${attachment.status}">${statusLabel(attachment.status)}</span>` : '<span class="status">No attachment</span>'}</td><td class="hash">${escapeHtml(attachment?.hash || '—')}</td></tr>`).join('')
  results.innerHTML = `<div class="receipt-head"><div><p class="eyebrow">Audit receipt</p><h2>${missing ? 'Check missing attachment references' : 'Archive inventory complete'}</h2><p class="quiet-copy">Created ${new Date(report.createdAt).toLocaleString()} · ${isDemo ? 'demo audit summary not saved' : 'local audit summary saved on this device'}</p></div><div class="stamp ${missing ? 'warn' : ''}">${missing ? 'CHECK GAPS' : 'INVENTORIED'}<small>local record</small></div></div>
    <div class="metrics"><div><b>${report.messages.length}</b><span>messages</span></div><div><b>${attachments.length}</b><span>attachments named</span></div><div><b>${hashed}</b><span>attachments hashed</span></div><div><b>${missing}</b><span>references missing</span></div></div>
    ${report.issues.length ? `<div class="issue" role="status"><strong>Attention needed</strong><p>${report.issues.map(escapeHtml).join(' ')}</p><p>Choose the attachment folder and audit again, or retain this finding in the receipt.</p></div>` : `<div class="good"><strong>No broken attachment references found.</strong> Readable embedded attachments were hashed on this device.</div>`}
    <div class="report-actions"><button id="html" class="primary" type="button">Save HTML receipt</button><button id="csv" class="quiet" type="button">Export CSV</button><button id="json" class="quiet" type="button">Export JSON</button>${isDemo ? '' : '<button id="clear" class="quiet danger" type="button">Clear local report</button>'}</div>
    <details class="ledger" open><summary>Message ledger — ${plural(report.messages.length, 'message')}</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable message ledger"><table><thead><tr><th>Message</th><th>Attachment</th><th>Status</th><th>SHA-256</th></tr></thead><tbody>${rows}</tbody></table></div></details>`
  $('#html').addEventListener('click', () => download('archive-audit-receipt.html', reportHtml(report!), 'text/html'))
  $('#csv').addEventListener('click', () => download('archive-audit.csv', reportCsv(report!), 'text/csv'))
  $('#json').addEventListener('click', () => download('archive-audit.json', JSON.stringify(report, null, 2), 'application/json'))
  if (!isDemo) $('#clear').addEventListener('click', clearReport)
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

function feedback(message: string) {
  results.innerHTML = `<div class="issue" role="alert"><strong>Audit not completed</strong><p>${escapeHtml(message)}</p></div>`
  announce.textContent = message
}

async function clearReport() {
  if (!confirm('Clear this saved audit report? Your source files will not be changed.')) return
  report = null
  await dbClear()
  results.innerHTML = '<div class="good" role="status"><strong>Local audit summary cleared.</strong> Your source files were not stored or changed.</div>'
  announce.textContent = 'Local audit summary cleared.'
}

function toggleTheme() {
  const dark = document.documentElement.dataset.theme !== 'dark'
  localStorage.setItem('archive-audit-theme', dark ? 'dark' : 'light')
  setTheme(dark)
}

function setTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : ''
  const button = $('#theme')
  button.setAttribute('aria-pressed', String(dark))
  button.setAttribute('aria-label', dark ? 'Use light color theme' : 'Use dark color theme')
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js').then(registration => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state !== 'installed' || !navigator.serviceWorker.controller) return
        const toast = $('#toast')
        toast.hidden = false
        toast.innerHTML = 'An offline update is ready. <button type="button">Refresh now</button>'
        toast.querySelector('button')!.addEventListener('click', () => {
          navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true })
          registration.waiting?.postMessage('skip-waiting')
        })
      })
    })
  }).catch(() => {
    const toast = $('#toast')
    toast.hidden = false
    toast.textContent = 'Offline setup failed. Reload while online to try again.'
  })
}

renderApp()
if (isDemo) {
  void loadDemo()
} else {
  void hasSavedDatabase().then(async hasDatabase => {
    if (!hasDatabase) return
    const saved = await dbGet()
    if (!saved) return
    report = saved
    renderReport()
    announce.textContent = 'Saved local audit summary restored.'
  })
}
registerServiceWorker()
