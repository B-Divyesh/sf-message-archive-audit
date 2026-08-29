import { describe, expect, it } from 'vitest'
import { receiptRows, reportCsv, reportHtml } from './exports'
import type { ArchiveReport } from './types'

const report: ArchiveReport = {
  id: 'test', createdAt: '2026-08-29T00:00:00.000Z', sources: ['mail.mbox'], folderFiles: [], issues: [],
  messages: [
    { subject: '=2+2', from: '@sender', date: '-date', attachments: [] },
    { subject: 'With file', from: 'A', date: 'Today', attachments: [{ name: '+file.txt', source: 'reference', size: 4, hash: 'folder-hash', status: 'found' }] },
  ],
}

describe('portable receipts', () => {
  it('includes messages without attachments in every row-based receipt', () => {
    expect(receiptRows(report)).toHaveLength(2)
    expect(reportHtml(report)).toContain('=2+2')
    expect(reportHtml(report)).toContain('No attachment')
  })

  it('includes supplied-folder hashes in HTML and CSV', () => {
    expect(reportHtml(report)).toContain('folder-hash')
    expect(reportCsv(report)).toContain('folder-hash')
  })

  it('neutralizes spreadsheet formulas in every attacker-controlled CSV field', () => {
    const csv = reportCsv(report)
    expect(csv).toContain('"\'=2+2"')
    expect(csv).toContain('"\'@sender"')
    expect(csv).toContain('"\'-date"')
    expect(csv).toContain('"\'+file.txt"')
  })

  it('includes every selected folder file and reconciliation state in HTML and CSV', () => {
    const folderReport: ArchiveReport = {
      ...report,
      folderFiles: [
        { name: 'record.pdf', path: 'export/invoices/record.pdf', size: 4, hash: 'matched-hash', status: 'matched' },
        { name: 'photo.jpg', path: 'export/photos/photo.jpg', size: 5, hash: 'orphan-hash', status: 'unmatched' },
        { name: 'invoice.pdf', path: 'export/duplicate/invoice.pdf', size: 8, hash: 'ambiguous-hash', status: 'ambiguous' },
      ],
    }
    const html = reportHtml(folderReport)
    const csv = reportCsv(folderReport)

    for (const expected of ['export/invoices/record.pdf', 'export/photos/photo.jpg', 'export/duplicate/invoice.pdf', 'matched-hash', 'orphan-hash', 'ambiguous-hash']) {
      expect(html).toContain(expected)
      expect(csv).toContain(expected)
    }
    expect(html).toContain('Matched to one message attachment')
    expect(html).toContain('Not referenced by a message attachment')
    expect(html).toContain('Duplicate name; match is not unique')
  })
})
