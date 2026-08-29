export type Attachment = {
  name: string
  source: 'embedded' | 'reference'
  size: number | null
  hash?: string
  status: 'verified' | 'missing' | 'found' | 'ambiguous'
}

export type FolderFile = {
  name: string
  path: string
  size: number
  hash: string
  status: 'matched' | 'unmatched' | 'ambiguous'
}

export type Message = {
  subject: string
  from: string
  date: string
  attachments: Attachment[]
}

export type ArchiveReport = {
  id: string
  createdAt: string
  sources: string[]
  messages: Message[]
  folderFiles: FolderFile[]
  issues: string[]
}
