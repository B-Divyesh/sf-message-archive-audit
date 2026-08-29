import { describe, expect, it } from 'vitest'
import { parseEml, parseMailFile, reconcile, sha256 } from './parser'

const envelope = (part: string) => `From: A <a@example.test>\r\nSubject: Filed note\r\nDate: Tue, 02 Jan 2024 10:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="x"\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nHi\r\n--x\r\n${part}\r\n--x--\r\n`

describe('email parser', () => {
  it('hashes embedded base64 bytes', async () => {
    const message = await parseEml(envelope('Content-Type: text/plain; name="note.txt"\r\nContent-Disposition: attachment; filename="note.txt"\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8='))
    expect(message.attachments).toMatchObject([{ name: 'note.txt', size: 5, status: 'verified' }])
    expect(message.attachments[0].hash).toBe(await sha256(new TextEncoder().encode('hello')))
  })

  it('retains and hashes a named zero-byte base64 attachment', async () => {
    const message = await parseEml(envelope('Content-Type: application/octet-stream; name="empty.bin"\r\nContent-Disposition: attachment; filename="empty.bin"\r\nContent-Transfer-Encoding: base64\r\n\r\n'))
    expect(message.attachments).toEqual([{
      name: 'empty.bin', source: 'embedded', size: 0,
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', status: 'verified',
    }])
  })

  it('finds and hashes an attachment inside nested MIME multiparts', async () => {
    const raw = `From: QA <qa@example.test>\r\nSubject: Nested evidence\r\nDate: Thu, 01 Aug 2026 12:00:00 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="outer"\r\n\r\n--outer\r\nContent-Type: multipart/related; boundary="inner"\r\n\r\n--inner\r\nContent-Type: text/plain\r\n\r\nSee attached evidence.\r\n--inner\r\nContent-Type: application/pdf; name="evidence.pdf"\r\nContent-Disposition: attachment; filename="evidence.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\ncHJvb2Y=\r\n--inner--\r\n--outer--\r\n`
    const message = await parseEml(raw)

    expect(message.attachments).toEqual([{
      name: 'evidence.pdf', source: 'embedded', size: 5,
      hash: 'c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7', status: 'verified',
    }])
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

  it('joins and decodes RFC 2231 continued attachment filenames', async () => {
    const message = await parseEml(envelope("Content-Type: application/pdf\r\nContent-Disposition: attachment;\r\n filename*0*=UTF-8''quarterly%20;\r\n filename*1*=report.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\ncHJvb2Y="))
    expect(message.attachments).toEqual([{
      name: 'quarterly report.pdf', source: 'embedded', size: 5,
      hash: 'c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7', status: 'verified',
    }])
  })

  it('decodes UTF-8 RFC 2047 Q-encoded subject and sender text', async () => {
    const message = await parseEml('From: =?UTF-8?Q?Jos=C3=A9_Archive?= <jose@example.test>\r\nSubject: =?UTF-8?Q?Caf=C3=A9_receipt?=\r\nDate: Tue, 02 Jan 2024 10:00:00 +0000\r\n\r\nBody')
    expect(message.subject).toBe('Café receipt')
    expect(message.from).toBe('José Archive <jose@example.test>')
  })

  it('retains malformed percent escapes as a readable filename', async () => {
    const message = await parseEml(envelope("Content-Type: text/plain\r\nContent-Disposition: attachment; filename*=UTF-8''bad%ZZ.txt\r\n\r\ndata"))
    expect(message.attachments[0].name).toBe('bad%ZZ.txt')
  })

  it.each(['', 'this is not an email'])('rejects invalid EML input: %j', async raw => {
    await expect(parseEml(raw)).rejects.toThrow()
  })

  it('rejects encrypted S/MIME-style mail instead of presenting it as readable', async () => {
    const encrypted = 'From: Locked <locked@example.test>\r\nSubject: Locked\r\nMIME-Version: 1.0\r\nContent-Type: application/pkcs7-mime; smime-type=enveloped-data\r\n\r\nnot-decryptable'
    await expect(parseEml(encrypted)).rejects.toThrow('Encrypted mail is not supported.')
  })

  it('rejects an MBOX without separators and counts a valid two-message MBOX', async () => {
    await expect(parseMailFile(new File(['Subject: no separator\n\nbody'], 'mail.mbox'))).rejects.toThrow(/separators/)
    const raw = 'From one@example.test Tue Jan 02 10:00:00 2024\nFrom: One <one@example.test>\nSubject: One\n\nFirst\nFrom two@example.test Tue Jan 02 11:00:00 2024\nFrom: Two <two@example.test>\nSubject: Two\n\nSecond'
    await expect(parseMailFile(new File([raw], 'mail.mbox'))).resolves.toHaveLength(2)
  })

  it('adds the exact supplied-folder hash to a matched reference', async () => {
    const message = await parseEml(envelope('Content-Type: application/pdf; name="record.pdf"\r\nContent-Disposition: attachment; filename="record.pdf"\r\n\r\n'))
    const files = [{ name: 'record.pdf', path: 'attachments/record.pdf', size: 4, hash: 'folder-hash', status: 'unmatched' as const }]
    reconcile([message], files)
    expect(message.attachments[0]).toEqual({ name: 'record.pdf', source: 'reference', size: 4, hash: 'folder-hash', status: 'found' })
    expect(files[0].status).toBe('matched')
  })

  it('consumes one physical file only once for duplicate-name references', async () => {
    const first = await parseEml(envelope('Content-Type: application/pdf; name="invoice.pdf"\r\nContent-Disposition: attachment; filename="invoice.pdf"\r\n\r\n'))
    const second = await parseEml(envelope('Content-Type: application/pdf; name="invoice.pdf"\r\nContent-Disposition: attachment; filename="invoice.pdf"\r\n\r\n'))
    const files = [{ name: 'invoice.pdf', path: 'attachments/invoice.pdf', size: 8, hash: 'one-physical-file', status: 'unmatched' as const }]

    reconcile([first, second], files)

    expect([first.attachments[0].status, second.attachments[0].status]).toEqual(['ambiguous', 'missing'])
    expect([first.attachments[0].hash, second.attachments[0].hash]).toEqual(['one-physical-file', undefined])
    expect(files[0].status).toBe('ambiguous')
  })

  it('preserves folder-relative paths and leaves unreferenced files in the inventory', async () => {
    const message = await parseEml('From: A <a@example.test>\r\nSubject: Plain message\r\n\r\nBody')
    const files = [{ name: 'photo.jpg', path: 'export/photos/photo.jpg', size: 5, hash: 'photo-hash', status: 'matched' as const }]

    reconcile([message], files)

    expect(files).toEqual([{ name: 'photo.jpg', path: 'export/photos/photo.jpg', size: 5, hash: 'photo-hash', status: 'unmatched' }])
  })
})
