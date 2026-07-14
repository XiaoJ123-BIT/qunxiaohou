import { BrowserWindow } from 'electron'
import { getHistory } from './wechat-cli'
import { analyzeMessages } from './llm'
import { insertMonitorBatch, getSetting } from './db'

interface GroupMonitorRule {
  groupName: string
  prompt: string
  intervalMs: number
}

const activeMonitors = new Map<string, {
  rule: GroupMonitorRule
  timer: NodeJS.Timeout
  lastProcessedTime: string
}>()

export function startGroupMonitor(
  config: { groupName: string; prompt: string; intervalMs: number },
  mainWindow: BrowserWindow
) {
  const { groupName, prompt, intervalMs } = config

  // Stop existing monitor for this group if any
  stopGroupMonitor(groupName)

  // Start time for incremental fetching
  const now = new Date()
  const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const timer = setInterval(async () => {
    try {
      const apiKey = getSetting('apiKey')
      const model = getSetting('model') || 'deepseek-v4-flash'
      const apiBase = getSetting('apiBase') || 'https://duoduo.taotoken.net/v1/'
      const userToken = getSetting('userToken') || ''
      if (!apiKey) return

      const entry = activeMonitors.get(groupName)
      if (!entry) return

      // Only fetch messages after lastProcessedTime to avoid duplicates
      const msgs = getHistory(groupName, entry.lastProcessedTime, '', 200)
      const msgArray = Array.isArray(msgs) ? msgs : (msgs as any).messages || []

      // Update lastProcessedTime to the latest message time
      if (msgArray.length > 0) {
        const latestTime = msgArray[msgArray.length - 1].time
        if (latestTime) {
          entry.lastProcessedTime = latestTime
        }
      }

      const text = msgArray
        .map((m: any) => `[${m.time}] ${m.sender}: ${m.content}`)
        .join('\n')

      if (!text.trim()) return

      // Use analyzeMessages for full analysis instead of extracting JSON matches
      const analysisResult = await analyzeMessages(text, prompt, apiKey, model, apiBase, undefined, userToken)

      const timestamp = Math.floor(Date.now() / 1000)
      // Store analysis result as a single "match" for backward compatibility
      const batch = {
        chatName: groupName,
        matches: [{ sender: '', content: analysisResult, analysis: '' }],
        prompt,
        timestamp
      }

      insertMonitorBatch(batch)
      mainWindow.webContents.send('monitor-batch', {
        id: timestamp,
        chatName: groupName,
        matches: batch.matches,
        matchCount: 1,
        prompt: batch.prompt,
        timestamp: batch.timestamp,
        createdAt: new Date().toISOString()
      })
    } catch (err) {
      console.error(`Monitor error for ${groupName}:`, err)
    }
  }, intervalMs)

  activeMonitors.set(groupName, {
    rule: { groupName, prompt, intervalMs },
    timer,
    lastProcessedTime: startTime
  })
}

export function stopGroupMonitor(groupName: string) {
  const entry = activeMonitors.get(groupName)
  if (entry) {
    clearInterval(entry.timer)
    activeMonitors.delete(groupName)
  }
}

export function stopAllMonitors() {
  for (const [, entry] of activeMonitors) {
    clearInterval(entry.timer)
  }
  activeMonitors.clear()
}

export function getGroupMonitorStatus(groupName: string) {
  const entry = activeMonitors.get(groupName)
  if (!entry) return { isRunning: false, prompt: '', intervalMs: 1800000 }
  return {
    isRunning: true,
    prompt: entry.rule.prompt,
    intervalMs: entry.rule.intervalMs
  }
}

export function getAllMonitorStatuses(): Record<string, { isRunning: boolean; prompt: string; intervalMs: number; lastProcessedTime: string }> {
  const result: Record<string, { isRunning: boolean; prompt: string; intervalMs: number; lastProcessedTime: string }> = {}
  for (const [name, entry] of activeMonitors) {
    result[name] = {
      isRunning: true,
      prompt: entry.rule.prompt,
      intervalMs: entry.rule.intervalMs,
      lastProcessedTime: entry.lastProcessedTime
    }
  }
  return result
}

export function getMonitoredGroupNames(): string[] {
  return Array.from(activeMonitors.keys())
}