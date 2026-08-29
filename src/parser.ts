import type { Attachment, Message } from './types'

const decodeHeader = (value = '') => value
  .replace(/=\?([^?]+)\?[bB]\?([^?]+)\?=/g, (_, charset, data) => {
    try {
      return new TextDecoder(charset).decode(Uint8Array.from(atob(data), character => character.charCodeAt(0)))
    } catch {
      return data
    }
  })
  .replace(/=\?([^?]+)\?[qQ]\?([^?]+)\?=/g, (_, _charset, data) => data
    .replace(/_/g, ' ')
    .replace(/=([0-9A-F]{2})/gi, (_match: string, hex: string) => String.fromCharCode(parseInt(hex, 16))))

export const sha256 = async (data: ArrayBuffer | Uint8Array) => {
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function header(block: string, key: string) {
  const match = block.match(new RegExp(`^${key}:\\s*([\\s\\S]*?)(?=\\r?\\n[^ \\t]|$)`, 'im'))
  return decodeHeader((match?.[1] || '').replace(/\r?\n[ \t]+/g, ' ').trim())
}

function safeDecodeFilename(value: string) {
  const cleaned = value.trim().replace(/^"|"$/g, '').replace(/\\(["\\])/g, '$1')
  const encoded = cleaned.match(/^[^']*'[^']*'(.*)$/)?.[1] ?? cleaned
  try {
    return decodeURIComponent(encoded)
  } catch {
    return encoded
  }
}

function parameter(headerValue: string, name: string) {
  const match = headerValue.match(new RegExp(`(?:^|;)\\s*${name}(\\*)?\\s*=\\s*(?:"((?:\\\\.|[^"])*)"|([^;\\r\\n]*))`, 'i'))
  if (!match) return ''
  return safeDecodeFilename(match[2] ?? match[3] ?? '')
}

function decodeQuotedPrintable(body: string) {
  const unfolded = body.replace(/=\r?\n/g, '')
  const bytes: number[] = []
  for (let index = 0; index < unfolded.length; index += 1) {
    const hex = unfolded.slice(index + 1, index + 3)
    if (unfolded[index] === '=' && /^[0-9A-F]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16))
      index += 2
    } else {
      bytes.push(...new TextEncoder().encode(unfolded[index]))
    }
  }
  return new Uint8Array(bytes)
}

function decodeBody(body: string, encoding: string) {
  if (/base64/i.test(encoding)) {
    return Uint8Array.from(atob(body.replace(/\s/g, '')), character => character.charCodeAt(0))
  }
  if (/quoted-printable/i.test(encoding)) return decodeQuotedPrintable(body)
  if (!encoding || /^(7bit|8bit|binary)$/i.test(encoding)) return new TextEncoder().encode(body)
  throw new Error(`Unsupported attachment encoding: ${encoding}`)
}

function validateMessage(raw: string) {
  if (!raw.trim()) throw new Error('The message file is empty.')
  const headerEnd = raw.search(/\r?\n\r?\n/)
  if (headerEnd < 0) throw new Error('The file has no complete email header block.')
  const top = raw.slice(0, headerEnd)
  const lines = top.split(/\r?\n/)
  if (lines.some((line, index) => line && !/^[ \t]/.test(line) && !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+:/.test(line) && index > 0)) {
    throw new Error('The email header block is malformed.')
  }
  if (!/^(from|to|date|subject|message-id|mime-version):/im.test(top)) {
    throw new Error('The file does not contain recognizable email headers.')
  }
  return top
}

function mimeEntity(raw: string) {
  const headEnd = raw.search(/\r?\n\r?\n/)
  if (headEnd < 0) return null
  const separator = raw.slice(headEnd).match(/^\r?\n\r?\n/)?.[0] ?? ''
  return {
    headers: raw.slice(0, headEnd),
    body: raw.slice(headEnd + separator.length),
  }
}

function mimeParts(body: string, boundary: string) {
  const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return body.split(new RegExp(`^--${escapedBoundary}(?:--)?[ \\t]*(?:\\r?\\n|$)`, 'gm')).slice(1)
}

async function collectAttachments(raw: string, attachments: Attachment[]): Promise<void> {
  const entity = mimeEntity(raw)
  if (!entity) return

  const contentType = header(entity.headers, 'content-type')
  const boundary = parameter(contentType, 'boundary')
  if (boundary) {
    for (const part of mimeParts(entity.body, boundary)) {
      await collectAttachments(part, attachments)
    }
    return
  }

  const disposition = header(entity.headers, 'content-disposition')
  const name = parameter(disposition, 'filename') || parameter(contentType, 'name')
  if (!name || (!/attachment|inline/i.test(disposition) && !/(?:^|;)\s*name\*?=/i.test(contentType))) return

  // The final line break belongs to the following MIME boundary, not the payload.
  const body = entity.body.replace(/\r?\n$/, '')
  const encoding = header(entity.headers, 'content-transfer-encoding')
  if (body.length > 0 || encoding.length > 0) {
    try {
      const bytes = decodeBody(body, encoding)
      attachments.push({
        name,
        source: 'embedded',
        size: bytes.byteLength,
        hash: await sha256(bytes),
        status: 'verified',
      })
      return
    } catch {
      // An unreadable named part is retained as a missing reference.
    }
  }
  attachments.push({ name, source: 'reference', size: null, status: 'missing' })
}

export async function parseEml(raw: string): Promise<Message> {
  const top = validateMessage(raw)
  const attachments: Attachment[] = []
  await collectAttachments(raw, attachments)

  return {
    subject: header(top, 'subject') || '(no subject)',
    from: header(top, 'from') || '(unknown sender)',
    date: header(top, 'date') || '(no date)',
    attachments,
  }
}

export async function parseMailFile(file: File): Promise<Message[]> {
  const raw = await file.text()
  if (file.name.toLowerCase().endsWith('.mbox')) {
    if (!/^From [^\r\n]+\r?\n/.test(raw)) throw new Error('The MBOX file has no message separators.')
    const chunks = raw.split(/^From [^\r\n]+\r?\n/gm).filter(chunk => chunk.trim())
    if (!chunks.length) throw new Error('The MBOX file contains no messages.')
    return Promise.all(chunks.map(parseEml))
  }
  return [await parseEml(raw)]
}

export function reconcile(messages: Message[], files: Array<{ name: string; size: number; hash: string }>) {
  for (const item of messages.flatMap(message => message.attachments)) {
    if (item.source === 'embedded') continue
    const matches = files.filter(file => file.name === item.name)
    if (matches.length === 1) {
      item.status = 'found'
      item.size = matches[0].size
      item.hash = matches[0].hash
    } else {
      item.status = 'missing'
    }
  }
}
