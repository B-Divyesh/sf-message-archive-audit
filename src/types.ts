export type Attachment = { name: string; source: 'embedded' | 'reference'; size: number | null; hash?: string; status: 'verified' | 'missing' | 'unmatched' }
export type Message = { subject: string; from: string; date: string; attachments: Attachment[] }
export type ArchiveReport = { id: string; createdAt: string; sources: string[]; messages: Message[]; folderFiles: Array<{name:string; size:number; hash:string}>; issues: string[] }
