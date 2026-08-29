import type { Attachment, FolderFile, Message } from './types'

function decodeBytes(bytes: Uint8Array, charset: string) {
  try {
    return new TextDecoder(charset.trim() || 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder().decode(bytes)
  }
}

function decodeQWord(data: string, charset: string) {
  const bytes: number[] = []
  for (let index = 0; index < data.length; index += 1) {
    const hex = data.slice(index + 1, index + 3)
    if (data[index] === '=' && /^[0-9A-F]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16))
      index += 2
    } else {
      bytes.push(data[index] === '_' ? 32 : data.charCodeAt(index) & 0xff)
    }
  }
  return decodeBytes(new Uint8Array(bytes), charset)
}

const decodeHeader = (value = '') => value
  .replace(/(\?=)[ \t\r\n]+(?==\?)/g, '$1')
  .replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_, charset, encoding, data) => {
    try {
      if (encoding.toLowerCase() === 'q') return decodeQWord(data, charset)
      return decodeBytes(Uint8Array.from(atob(data), character => character.charCodeAt(0)), charset)
    } catch {
      return data
    }
  })

export const sha256 = async (data: ArrayBuffer | Uint8Array) => {
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function header(block: string, key: string) {
  const match = block.match(new RegExp(`(?:^|\\r?\\n)${key}:\\s*([\\s\\S]*?)(?=\\r?\\n[^ \\t]|$)`, 'i'))
  return decodeHeader((match?.[1] || '').replace(/\r?\n[ \t]+/g, ' ').trim())
}

function decodeExtendedParameter(value: string) {
  const extended = value.match(/^([^']*)'[^']*'(.*)$/)
  const charset = extended?.[1] || 'utf-8'
  const encoded = extended?.[2] ?? value
  const bytes: number[] = []
  for (let index = 0; index < encoded.length; index += 1) {
    const hex = encoded.slice(index + 1, index + 3)
    if (encoded[index] === '%' && /^[0-9A-F]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16))
      index += 2
    } else {
      bytes.push(...new TextEncoder().encode(encoded[index]))
    }
  }
  return decodeBytes(new Uint8Array(bytes), charset)
}

function parameter(headerValue: string, name: string) {
  const parameters = new Map<string, string>()
  const expression = /(?:^|;)\s*([!#$%&'*+.^_`|~0-9A-Za-z-]+)\s*=\s*(?:"((?:\\.|[^"])*)"|([^;\r\n]*))/g
  for (const match of headerValue.matchAll(expression)) {
    parameters.set(match[1].toLowerCase(), (match[2] ?? match[3] ?? '').trim().replace(/\\(["\\])/g, '$1'))
  }

  const key = name.toLowerCase()
  const continuation = [...parameters.entries()].flatMap(([parameterName, value]) => {
    const match = parameterName.match(new RegExp(`^${key}\\*(\\d+)(\\*)?$`, 'i'))
    return match ? [{ index: Number(match[1]), encoded: Boolean(match[2]), value }] : []
  }).sort((left, right) => left.index - right.index)
  if (continuation.length && continuation[0].index === 0 && continuation.every((part, index) => part.index === index)) {
    const combined = continuation.map(part => part.value).join('')
    return continuation.some(part => part.encoded) ? decodeExtendedParameter(combined) : combined
  }
  if (parameters.has(`${key}*`)) return decodeExtendedParameter(parameters.get(`${key}*`)!)
  return parameters.get(key) ?? ''
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

export function reconcile(messages: Message[], files: FolderFile[]) {
  const references = messages.flatMap(message => message.attachments).filter(item => item.source === 'reference')
  for (const reference of references) {
    reference.status = 'missing'
    reference.size = null
    delete reference.hash
  }
  for (const file of files) file.status = 'unmatched'

  const names = new Set([...references.map(reference => reference.name), ...files.map(file => file.name)])
  for (const name of names) {
    const namedReferences = references.filter(reference => reference.name === name)
    const namedFiles = files.filter(file => file.name === name)
    if (namedReferences.length === 1 && namedFiles.length === 1) {
      const [reference] = namedReferences
      const [file] = namedFiles
      reference.status = 'found'
      reference.size = file.size
      reference.hash = file.hash
      file.status = 'matched'
      continue
    }

    const assignments = Math.min(namedReferences.length, namedFiles.length)
    for (let index = 0; index < assignments; index += 1) {
      const reference = namedReferences[index]
      const file = namedFiles[index]
      reference.status = 'ambiguous'
      reference.size = file.size
      reference.hash = file.hash
    }
    if (namedReferences.length && namedFiles.length) {
      for (const file of namedFiles) file.status = 'ambiguous'
    }
  }
}
