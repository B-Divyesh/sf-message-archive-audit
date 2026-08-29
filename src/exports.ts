import type { ArchiveReport, Attachment, FolderFile, Message } from './types'

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character]!))

type ReceiptRow = { message: Message; attachment: Attachment | null }

export function receiptRows(report: ArchiveReport): ReceiptRow[] {
  return report.messages.flatMap((message): ReceiptRow[] => message.attachments.length
    ? message.attachments.map(attachment => ({ message, attachment }))
    : [{ message, attachment: null }])
}

function safeSpreadsheetValue(value: unknown) {
  const text = String(value ?? '')
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

function csvCell(value: unknown) {
  return `"${safeSpreadsheetValue(value).replaceAll('"', '""')}"`
}

export function folderFileStatusLabel(file: FolderFile) {
  if (file.status === 'matched') return 'Matched to one message attachment'
  if (file.status === 'ambiguous') return 'Duplicate name; match is not unique'
  return 'Not referenced by a message attachment'
}

export function reportCsv(report: ArchiveReport) {
  const messageRows = receiptRows(report).map(({ message, attachment }) => [
    message.subject,
    message.from,
    message.date,
    attachment?.name ?? '',
    attachment?.status ?? 'no attachment',
    attachment?.hash ?? '',
  ].map(csvCell).join(','))
  const folderRows = report.folderFiles.map(file => [
    '[Selected folder file]',
    '',
    '',
    file.path,
    folderFileStatusLabel(file),
    file.hash,
  ].map(csvCell).join(','))
  return ['Subject,From,Date,Attachment,Status,SHA-256', ...messageRows, ...folderRows].join('\n')
}

export function reportHtml(report: ArchiveReport) {
  const attachmentCount = report.messages.flatMap(message => message.attachments).length
  const rows = receiptRows(report).map(({ message, attachment }) => `<tr>
    <td>${escapeHtml(message.subject)}<small>${escapeHtml(message.from)} · ${escapeHtml(message.date)}</small></td>
    <td>${attachment ? escapeHtml(attachment.name) : '—'}</td>
    <td>${attachment ? escapeHtml(attachment.status) : 'No attachment'}</td>
    <td class="hash">${escapeHtml(attachment?.hash ?? '—')}</td>
  </tr>`).join('')
  const folderInventory = report.folderFiles.length ? `<h2>Selected folder inventory</h2><p>${report.folderFiles.length} selected folder file${report.folderFiles.length === 1 ? '' : 's'}. Each file is listed even when no message names it.</p><table><thead><tr><th>Folder path</th><th>Size</th><th>Status</th><th>SHA-256</th></tr></thead><tbody>${report.folderFiles.map(file => `<tr>
    <td>${escapeHtml(file.path)}</td>
    <td>${file.size.toLocaleString()} bytes</td>
    <td>${escapeHtml(folderFileStatusLabel(file))}</td>
    <td class="hash">${escapeHtml(file.hash)}</td>
  </tr>`).join('')}</tbody></table>` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Archive Audit receipt</title><style>body{font:16px/1.5 system-ui;max-width:920px;margin:40px auto;padding:0 20px;color:#20261f;background:#f6f0e2}h1{font-family:Georgia,serif}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #777;text-align:left;vertical-align:top}small{display:block}.hash{font:12px ui-monospace,monospace;overflow-wrap:anywhere}@media(max-width:600px){table{font-size:13px}}</style></head><body><main><h1>Archive Audit receipt</h1><p>Created: ${escapeHtml(report.createdAt)}<br>Sources: ${report.sources.map(escapeHtml).join(', ')}</p><h2>Summary</h2><p>${report.messages.length} messages · ${attachmentCount} attachments named · ${escapeHtml(report.issues.join(' ') || 'No broken references found.')}</p><table><thead><tr><th>Message</th><th>Attachment</th><th>Status</th><th>SHA-256</th></tr></thead><tbody>${rows}</tbody></table>${folderInventory}<p>This local receipt inventories only the selected files. It does not certify a provider export.</p></main></body></html>`
}
