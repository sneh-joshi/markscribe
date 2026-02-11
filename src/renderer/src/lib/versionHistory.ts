import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface Snapshot {
  id: string
  filePath: string
  content: string
  timestamp: number
  wordCount: number
  label?: string
  isManual: boolean
}

interface MarkScribeDB extends DBSchema {
  snapshots: {
    key: string
    value: Snapshot
    indexes: { 'by-file': string; 'by-timestamp': number }
  }
}

let dbPromise: Promise<IDBPDatabase<MarkScribeDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MarkScribeDB>('markscribe-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('snapshots', { keyPath: 'id' })
        store.createIndex('by-file', 'filePath')
        store.createIndex('by-timestamp', 'timestamp')
      }
    })
  }
  return dbPromise
}

export async function createSnapshot(
  filePath: string,
  content: string,
  isManual: boolean = false,
  label?: string
): Promise<Snapshot> {
  const db = await getDB()

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const snapshot: Snapshot = {
    id: `${filePath}-${Date.now()}`,
    filePath,
    content,
    timestamp: Date.now(),
    wordCount,
    label,
    isManual
  }

  await db.add('snapshots', snapshot)

  // Keep only last 50 snapshots per file
  await pruneSnapshots(filePath)

  return snapshot
}

export async function getSnapshots(filePath: string): Promise<Snapshot[]> {
  const db = await getDB()
  const snapshots = await db.getAllFromIndex('snapshots', 'by-file', filePath)
  return snapshots.sort((a, b) => b.timestamp - a.timestamp)
}

export async function getSnapshot(id: string): Promise<Snapshot | undefined> {
  const db = await getDB()
  return await db.get('snapshots', id)
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('snapshots', id)
}

async function pruneSnapshots(filePath: string): Promise<void> {
  const db = await getDB()
  const snapshots = await getSnapshots(filePath)

  // Keep last 50 snapshots
  if (snapshots.length > 50) {
    const toDelete = snapshots.slice(50)
    for (const snapshot of toDelete) {
      await db.delete('snapshots', snapshot.id)
    }
  }
}

export async function getAllSnapshots(): Promise<Snapshot[]> {
  const db = await getDB()
  return await db.getAll('snapshots')
}
