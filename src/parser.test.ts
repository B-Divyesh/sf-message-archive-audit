import { describe, expect, it } from 'vitest'
import { parseEml, parseMailFile, reconcile, sha256 } from './parser'

const envelope = (part: string) => `From: A <a@example.test>\r\nSubject: Filed note\r\nDate: Tue, 02 Jan 2024 10:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="x"\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nHi\r\n--x\r\n${part}\r\n--x--\r\n`

describe('email parser', () => {
  it('hashes embedded base64 bytes', async () => {
    const message = await parseEml(envelope('Content-Type: text/plain; name="note.txt"\r\nContent-Disposition: attachment; filename="note.txt"\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8='))
    expect(message.attachments).toMatchObject([{ name: 'note.txt', size: 5, status: 'verified' }])
    expect(message.attachments[0].hash).toBe(await sha256(new TextEncoder().encode('hello')))
  })

  it('decodes and hashes standard 7-bit MIME attachment bytes', async () => {
    const message = await parseEml(envelope('Content-Type: text/plain; name="notes.txt"\r\nContent-Disposition: attachment; filename="notes.txt"\r\nContent-Transfer-Encoding: 7bit\r\n\r\nplain attachment'))
    expect(message.attachments).toEqual([{
      name: 'notes.txt', source: 'embedded', size: 16,
      hash: await sha256(new TextEncoder().encode('plain attachment')), status: 'verified',
    }])
  })

  it('decodes quoted-printable attachment bytes and RFC 5987 names', async () => {
    const message = await parseEml(envelope("Content-Type: text/plain\r\nContent-Disposition: attachment; filename*=UTF-8''field%20note.txt\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\npaid=20in=20full"))
    expect(message.attachments[0]).toMatchObject({ name: 'field note.txt', size: 12, status: 'verified' })
  })

  it('retains malformed percent escapes as a readable filename', async () => {
    const message = await parseEml(envelope("Content-Type: text/plain\r\nContent-Disposition: attachment; filename*=UTF-8''bad%ZZ.txt\r\n\r\ndata"))
    expect(message.attachments[0].name).toBe('bad%ZZ.txt')
  })

  it.each(['', 'this is not an email'])('rejects invalid EML input: %j', async raw => {
    await expect(parseEml(raw)).rejects.toThrow()
  })

  it('rejects an MBOX without separators and counts a valid two-message MBOX', async () => {
    await expect(parseMailFile(new File(['Subject: no separator\n\nbody'], 'mail.mbox'))).rejects.toThrow(/separators/)
    const raw = 'From one@example.test Tue Jan 02 10:00:00 2024\nFrom: One <one@example.test>\nSubject: One\n\nFirst\nFrom two@example.test Tue Jan 02 11:00:00 2024\nFrom: Two <two@example.test>\nSubject: Two\n\nSecond'
    await expect(parseMailFile(new File([raw], 'mail.mbox'))).resolves.toHaveLength(2)
  })

  it('adds the exact supplied-folder hash to a matched reference', async () => {
    const message = await parseEml(envelope('Content-Type: application/pdf; name="record.pdf"\r\nContent-Disposition: attachment; filename="record.pdf"\r\n\r\n'))
    reconcile([message], [{ name: 'record.pdf', size: 4, hash: 'folder-hash' }])
    expect(message.attachments[0]).toEqual({ name: 'record.pdf', source: 'reference', size: 4, hash: 'folder-hash', status: 'found' })
  })
})
