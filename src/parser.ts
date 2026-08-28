import type { Attachment, Message } from './types'

const decodeHeader = (value = '') => value.replace(/=\?([^?]+)\?[bB]\?([^?]+)\?=/g, (_, charset, data) => {
  try { return new TextDecoder(charset).decode(Uint8Array.from(atob(data), c => c.charCodeAt(0))) } catch { return data }
}).replace(/=\?([^?]+)\?[qQ]\?([^?]+)\?=/g, (_, _charset, data) => data.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_: string, n: string) => String.fromCharCode(parseInt(n, 16))))

export const sha256 = async (data: ArrayBuffer | Uint8Array) => {
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function header(block: string, key: string) {
  const m = block.match(new RegExp(`^${key}:\\s*([\\s\\S]*?)(?=\\r?\\n[^ \\t]|$)`, 'im'))
  return decodeHeader((m?.[1] || '').replace(/\r?\n[ \t]+/g, ' ').trim())
}

export async function parseEml(raw: string): Promise<Message> {
  const firstBreak = raw.search(/\r?\n\r?\n/); const top = firstBreak >= 0 ? raw.slice(0, firstBreak) : raw
  const boundary = header(top, 'content-type').match(/boundary\s*=\s*(?:"([^"]+)"|([^;\s]+))/i)?.slice(1).find(Boolean)
  const parts = boundary ? raw.split(new RegExp(`\\r?\\n--${boundary.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?:--)?\\r?\\n`)) : [raw]
  const attachments: Attachment[] = []
  for (const part of parts) {
    const headEnd = part.search(/\r?\n\r?\n/); const head = headEnd >= 0 ? part.slice(0, headEnd) : part
    const disposition = header(head, 'content-disposition'); const contentType = header(head, 'content-type')
    const name = (disposition.match(/filename\*?=(?:UTF-8''|\")?([^;\"\r\n]+)/i)?.[1] || contentType.match(/name\*?=(?:UTF-8''|\")?([^;\"\r\n]+)/i)?.[1])?.trim()
    if (!name || (!/attachment|inline/i.test(disposition) && !/name=/i.test(contentType))) continue
    const body = headEnd >= 0 ? part.slice(headEnd).replace(/^\r?\n\r?\n/, '').replace(/\r?\n--[^\r\n]+--\s*$/, '').trim() : ''
    const isBase64 = /content-transfer-encoding:\s*base64/i.test(head)
    if (isBase64 && body) {
      try { const bytes = Uint8Array.from(atob(body.replace(/\s/g, '')), c => c.charCodeAt(0)); attachments.push({ name: decodeURIComponent(name), source: 'embedded', size: bytes.byteLength, hash: await sha256(bytes), status: 'verified' }); continue } catch { /* record broken part below */ }
    }
    attachments.push({ name: decodeURIComponent(name), source: 'reference', size: null, status: 'missing' })
  }
  return { subject: header(top, 'subject') || '(no subject)', from: header(top, 'from') || '(unknown sender)', date: header(top, 'date') || '(no date)', attachments }
}

export async function parseMailFile(file: File): Promise<Message[]> {
  const raw = await file.text()
  if (/^From .+\r?$/m.test(raw) && file.name.toLowerCase().endsWith('.mbox')) {
    const chunks = raw.split(/^From .+\r?\n/m).filter(Boolean)
    return Promise.all(chunks.map(parseEml))
  }
  return [await parseEml(raw)]
}

export function reconcile(messages: Message[], files: Array<{name:string; size:number; hash:string}>) {
  for (const item of messages.flatMap(m => m.attachments)) {
    if (item.source === 'embedded') continue
    const matching = files.filter(f => f.name === item.name)
    item.status = matching.length === 1 ? 'unmatched' : 'missing'
  }
}
