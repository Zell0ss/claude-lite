import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import * as schema from './schema'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const dbPath = url.replace('file:', '')
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath)

const sqlite = new Database(absolutePath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

export function runMigrations() {
  migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') })
}
