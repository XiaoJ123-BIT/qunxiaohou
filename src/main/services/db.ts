import { join } from 'path'
import { app } from 'electron'
import * as fs from 'fs'
import { createRequire } from 'module'

const _require = createRequire(import.meta.url)

let db: any

export async function initDatabase() {
  const dbPath = join(app.getPath('userData'), 'analyzer.db')

  const initSqlJs = _require('sql.js')
  const wasmPath = join(app.getPath('userData'), 'sql-wasm.wasm')

  // Copy WASM to userData if not exists
  const srcWasm = _require.resolve('sql.js/dist/sql-wasm.wasm')
  if (!fs.existsSync(wasmPath)) {
    fs.copyFileSync(srcWasm, wasmPath)
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => file === 'sql-wasm.wasm' ? wasmPath : file
  })

  // Load existing DB or create new
  let buffer: Buffer | undefined
  if (fs.existsSync(dbPath)) {
    buffer = fs.readFileSync(dbPath)
  }

  db = buffer ? new SQL.Database(buffer) : new SQL.Database()

  // Auto-save helper
  const saveDb = () => {
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_name TEXT NOT NULL,
      keyword TEXT NOT NULL,
      message TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analysis_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_names TEXT NOT NULL,
      prompt TEXT NOT NULL,
      result TEXT NOT NULL,
      message_count INTEGER NOT NULL,
      time_range TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_name TEXT NOT NULL,
      report_date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chat_name, report_date)
    );

    CREATE TABLE IF NOT EXISTS monitor_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_name TEXT NOT NULL DEFAULT '',
      matches TEXT NOT NULL,
      match_count INTEGER NOT NULL,
      prompt TEXT,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monitor_configs (
      group_name TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      interval_ms INTEGER NOT NULL DEFAULT 60000,
      enabled INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  saveDb()

  // Migration: add chat_name column to existing monitor_batches
  const columns = queryRaw("PRAGMA table_info(monitor_batches)") as any[]
  if (!columns.find((c: any) => c.name === 'chat_name')) {
    db.run('ALTER TABLE monitor_batches ADD COLUMN chat_name TEXT NOT NULL DEFAULT ""')
    saveDb()
  }

  // Store saveDb for use by runSQL
  ;(db as any)._save = saveDb
}

// Helper: run query and return rows as objects
function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

function queryRaw(sql: string): any[] {
  const result = db.exec(sql)
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map((row: any[]) => {
    const obj: any = {}
    cols.forEach((c: string, i: number) => { obj[c] = row[i] })
    return obj
  })
}

function runSQL(sql: string, params: any[] = []): any {
  db.run(sql, params)
  ;(db as any)._save()
  return { lastInsertRowid: queryRaw('SELECT last_insert_rowid() as id')[0]?.id }
}

// === Public API ===

export function getSetting(key: string): string | null {
  const rows = queryAll('SELECT value FROM settings WHERE key = ?', [key])
  return rows[0]?.value ?? null
}

export function setSetting(key: string, value: string): void {
  runSQL('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
}

export function getAllSettings(): Record<string, string> {
  const rows = queryAll('SELECT key, value FROM settings')
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export function insertAlert(alert: { chatName: string; keyword: string; message: string; sender: string; timestamp: number }) {
  runSQL(
    'INSERT INTO alert_records (chat_name, keyword, message, sender, timestamp) VALUES (?, ?, ?, ?, ?)',
    [alert.chatName, alert.keyword, alert.message, alert.sender, alert.timestamp]
  )
}

export function getAlertRecords(limit = 100): any[] {
  return queryAll('SELECT * FROM alert_records ORDER BY timestamp DESC LIMIT ?', [limit])
}

export function insertAnalysis(data: { chatNames: string[]; prompt: string; result: string; messageCount: number; timeRange?: string }) {
  runSQL(
    'INSERT INTO analysis_history (chat_names, prompt, result, message_count, time_range) VALUES (?, ?, ?, ?, ?)',
    [JSON.stringify(data.chatNames), data.prompt, data.result, data.messageCount, data.timeRange ?? null]
  )
}

export function getAnalysisHistory(limit?: number): any[] {
  if (limit) {
    return queryAll('SELECT * FROM analysis_history ORDER BY created_at DESC LIMIT ?', [limit])
  }
  return queryAll('SELECT * FROM analysis_history ORDER BY created_at DESC')
}

export function getAnalysisById(id: number): any | null {
  const rows = queryAll('SELECT * FROM analysis_history WHERE id = ?', [id])
  if (!rows.length) return null
  const row = rows[0]
  return {
    id: row.id,
    chatNames: JSON.parse(row.chat_names),
    prompt: row.prompt,
    result: row.result,
    messageCount: row.message_count,
    timeRange: row.time_range,
    createdAt: row.created_at
  }
}

export function insertDailyReport(chatName: string, reportDate: string, content: string) {
  runSQL(
    'INSERT OR REPLACE INTO daily_reports (chat_name, report_date, content) VALUES (?, ?, ?)',
    [chatName, reportDate, content]
  )
}

export function getDailyReports(chatName?: string, limit = 30): any[] {
  if (chatName) {
    return queryAll('SELECT * FROM daily_reports WHERE chat_name = ? ORDER BY report_date DESC LIMIT ?', [chatName, limit])
  }
  return queryAll('SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT ?', [limit])
}

export function insertMonitorBatch(batch: { chatName: string; matches: any[]; prompt: string; timestamp: number }) {
  const info = runSQL(
    'INSERT INTO monitor_batches (chat_name, matches, match_count, prompt, timestamp) VALUES (?, ?, ?, ?, ?)',
    [batch.chatName, JSON.stringify(batch.matches), batch.matches.length, batch.prompt, batch.timestamp]
  )
  return info.lastInsertRowid
}

export function getMonitorBatches(limit = 100, groupName?: string): any[] {
  let rows: any[]
  if (groupName) {
    rows = queryAll('SELECT * FROM monitor_batches WHERE chat_name = ? ORDER BY timestamp DESC LIMIT ?', [groupName, limit])
  } else {
    rows = queryAll('SELECT * FROM monitor_batches ORDER BY timestamp DESC LIMIT ?', [limit])
  }
  return rows.map(r => ({
    id: r.id,
    chatName: r.chat_name || '',
    matches: JSON.parse(r.matches),
    matchCount: r.match_count,
    prompt: r.prompt,
    timestamp: r.timestamp,
    createdAt: r.created_at
  }))
}

export function saveMonitorConfig(groupName: string, config: { prompt: string; intervalMs: number }) {
  runSQL(`
    INSERT OR REPLACE INTO monitor_configs (group_name, prompt, interval_ms, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `, [groupName, config.prompt, config.intervalMs])
}

export function getMonitorConfig(groupName: string): { prompt: string; intervalMs: number } | null {
  const rows = queryAll('SELECT * FROM monitor_configs WHERE group_name = ?', [groupName])
  if (!rows.length) return null
  const row = rows[0]
  return { prompt: row.prompt, intervalMs: row.interval_ms }
}

export function getAllMonitorConfigs(): Array<{ groupName: string; prompt: string; intervalMs: number; enabled: boolean }> {
  const rows = queryAll('SELECT * FROM monitor_configs')
  return rows.map(r => ({
    groupName: r.group_name,
    prompt: r.prompt,
    intervalMs: r.interval_ms,
    enabled: !!r.enabled
  }))
}

export function getEnabledMonitorConfigs(): Array<{ groupName: string; prompt: string; intervalMs: number }> {
  const rows = queryAll('SELECT * FROM monitor_configs WHERE enabled = 1')
  return rows.map(r => ({
    groupName: r.group_name,
    prompt: r.prompt,
    intervalMs: r.interval_ms
  }))
}

export function setMonitorEnabled(groupName: string, enabled: boolean) {
  runSQL('UPDATE monitor_configs SET enabled = ? WHERE group_name = ?', [enabled ? 1 : 0, groupName])
}

export function insertMonitorResult(result: { chatName: string; sender: string; content: string; analysis: string; prompt: string; timestamp: number }) {
  return insertMonitorBatch({
    chatName: result.chatName,
    matches: [{ sender: result.sender, content: result.content, analysis: result.analysis }],
    prompt: result.prompt,
    timestamp: result.timestamp
  })
}

export function getMonitorResults(limit = 100): any[] {
  const batches = getMonitorBatches(limit)
  return batches.flatMap(batch =>
    batch.matches.map((match: any) => ({
      id: batch.id,
      chatName: batch.chatName || '',
      sender: match.sender,
      content: match.content,
      analysis: match.analysis,
      prompt: batch.prompt,
      timestamp: batch.timestamp,
      created_at: batch.createdAt
    }))
  )
}
