import { describe, expect, it } from 'vitest'
import { parseEml } from './parser'
describe('email parser', () => {
  it('captures an embedded base64 attachment', async () => {
    const report = await parseEml('From: A <a@example.test>\nSubject: Filed note\nDate: Tue\nContent-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: text/plain\n\nHi\n--x\nContent-Type: text/plain; name="note.txt"\nContent-Disposition: attachment; filename="note.txt"\nContent-Transfer-Encoding: base64\n\naGVsbG8=\n--x--')
    expect(report.subject).toBe('Filed note'); expect(report.attachments).toMatchObject([{ name: 'note.txt', size: 5, status: 'verified' }])
  })
  it('flags a named part without usable encoded bytes', async () => {
    const report = await parseEml('Subject: X\nContent-Type: multipart/mixed; boundary=x\n\n--x\nContent-Type: application/pdf; name="lost.pdf"\nContent-Disposition: attachment; filename="lost.pdf"\n\n--x--\n')
    expect(report.attachments[0]).toMatchObject({ name: 'lost.pdf', status: 'missing' })
  })
})
